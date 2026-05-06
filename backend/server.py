from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Cookie, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import uuid
import asyncio
import logging
import httpx
import hashlib
import secrets
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Any, Dict, List
from datetime import datetime, timezone, timedelta
import google.generativeai as genai

# ============================================================
# INITIALIZATION & CONFIG
# ============================================================
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

ADMIN_EMAILS = set(e.strip().lower() for e in os.environ.get('ADMIN_EMAILS', 'bentaylors@hotmail.co.uk').split(',') if e.strip())
FREE_QUOTA = int(os.environ.get('FREE_QUOTA', '3'))

_cors_env = os.environ.get('CORS_ORIGINS', '')
CORS_ORIGINS = [o.strip() for o in _cors_env.split(',') if o.strip()] or [
    "https://smartgiaoan.site",
    "https://www.smartgiaoan.site",
    "http://localhost:3000",
]

# ============================================================
# MONGODB CONNECTION
# ============================================================
mongo_url = os.environ.get('MONGO_URL', '')
db_name = os.environ.get('DB_NAME', 'smartgiaoan')
mongo_client = None
db = None

try:
    mongo_client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
    db = mongo_client[db_name]
    logger.info("MongoDB client created successfully")
except Exception as e:
    logger.error(f"MongoDB connection failed: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    if mongo_client:
        mongo_client.close()
        logger.info("MongoDB connection closed")

app = FastAPI(title="SmartGiaoAn API", version="2.0.0", lifespan=lifespan)
api_router = APIRouter(prefix="/api")

# ============================================================
# PASSWORD HASHING (Manual Auth Logic)
# ============================================================
def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000).hex()
    return f"{salt}:{h}"

def verify_password(password: str, hashed: str) -> bool:
    try:
        salt, stored = hashed.split(':', 1)
        h = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000).hex()
        return secrets.compare_digest(h, stored)
    except Exception:
        return False

# ============================================================
# MODELS
# ============================================================
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    role: str = "Teacher"
    picture: Optional[str] = ""
    is_premium: bool = False
    free_used: int = 0
    bonus_credits: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WorksheetRequest(BaseModel):
    level: str
    cefr: str
    skill: str
    topic: str
    num_questions: int = 24
    grammar_focus: Optional[str] = None

class SessionExchangeRequest(BaseModel):
    session_id: str

class EmailAuthRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = ""
    role: Optional[str] = "Teacher"
    heard_from: Optional[str] = ""

class RewardedAdRequest(BaseModel):
    tier: int

# ============================================================
# HELPERS & AUTH DEPENDENCIES
# ============================================================
def _now():
    return datetime.now(timezone.utc)

def _parse_dt(v):
    if isinstance(v, datetime):
        return v
    dt = datetime.fromisoformat(str(v).replace('Z', '+00:00'))
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)

async def _create_session(user_id: str, response: Response) -> str:
    token = str(uuid.uuid4())
    expires = _now() + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": token,
        "expires_at": expires.isoformat(),
        "created_at": _now().isoformat(),
    })
    response.set_cookie(
        key="session_token", value=token,
        httponly=True, secure=True, samesite="none",
        max_age=7 * 24 * 3600, path="/"
    )
    return token

async def get_current_user_optional(
    request: Request,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
) -> Optional[User]:
    
    token = session_token
    
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.lower().startswith("bearer "):
            token = auth_header.split(" ", 1)[1].strip()

    if not token:
        return None
        
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session or _parse_dt(session["expires_at"]) < _now():
        return None
        
    doc = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    return User(**doc) if doc else None

async def require_user(user: Optional[User] = Depends(get_current_user_optional)) -> User:
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated or session expired")
    return user

# ============================================================
# GEMINI & DYNAMIC PEDAGOGY ENGINE
# ============================================================
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def build_system_prompt(level: str) -> str:
    base_prompt = """You are a senior Cambridge ESOL examiner and ESL curriculum designer specialising in Vietnamese learners.

Rules:
- STRICTLY align to the CEFR level given.
- Use Vietnamese names: Minh, Lan, Huy, Thao, Nam, Linh, Duc, Mai.
- Use Vietnamese locations: Hanoi, Hoan Kiem, West Lake, Sapa, Da Lat.
- Include Vietnamese culture: Tet, banh mi, pho, ao dai, Mid-Autumn Festival.
- OUTPUT MUST BE RAW, VALID JSON ONLY. Do not use markdown code blocks.
"""
    if "Kindergarten" in level:
        base_prompt += "\n- KINDERGARTEN OVERRIDE: Prioritize large visual placeholders, alphabet tracing, and TPR game ideas. Extremely simple vocab only."
    elif "Primary" in level:
        base_prompt += "\n- PRIMARY OVERRIDE: Focus on vocab matching, gap-fills, and short stories about Vietnam. Spacious formatting."
    else:
        base_prompt += "\n- SECONDARY/IELTS OVERRIDE: Rigorous academic content, complex reading comprehension, and full answer keys."

    return base_prompt

async def _run_gemini(prompt: str, level: str) -> dict:
    dynamic_instruction = build_system_prompt(level)
    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=dynamic_instruction,
        generation_config={"response_mime_type": "application/json", "temperature": 0.8},
    )
    
    last_error = ""
    for attempt in range(3):
        try:
            result = await asyncio.to_thread(model.generate_content, prompt)
            raw_text = result.text.strip()
            
            # 2000% FIX: Bulletproof markdown stripping
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.startswith("```"):
                raw_text = raw_text[3:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
                
            raw_text = raw_text.strip()
            return json.loads(raw_text)
            
        except json.JSONDecodeError as je:
            last_error = f"JSON Parsing Error. The AI generated invalid format. Detail: {je}"
            logger.error(last_error)
        except Exception as e:
            last_error = f"Google API Error: {str(e)}"
            logger.error(last_error)
            
        await asyncio.sleep(1)
        
    # 2000% FIX: Unmasked error throwing
    raise HTTPException(status_code=500, detail=f"AI Engine failed: {last_error}")

# ============================================================
# API ROUTES
# ============================================================

# --- MANUAL AUTHENTICATION ---
@api_router.post("/auth/register")
async def auth_register(payload: EmailAuthRequest, response: Response):
    email = payload.email.strip().lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    doc = {
        "user_id": user_id, "email": email,
        "name": payload.name or email.split("@")[0],
        "role": payload.role or "Teacher",
        "password_hash": hash_password(payload.password),
        "is_premium": email in ADMIN_EMAILS,
        "free_used": 0, "bonus_credits": 0,
        "created_at": _now().isoformat()
    }
    await db.users.insert_one(doc)
    token = await _create_session(user_id, response)
    safe_user = {k: v for k, v in doc.items() if k not in ["_id", "password_hash"]}
    return {"user": safe_user, "session_token": token}

@api_router.post("/auth/login")
async def auth_login(payload: EmailAuthRequest, response: Response):
    email = payload.email.strip().lower()
    doc = await db.users.find_one({"email": email})
    
    if not doc or not doc.get("password_hash") or not verify_password(payload.password, doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = await _create_session(doc["user_id"], response)
    safe_user = {k: v for k, v in doc.items() if k not in ["_id", "password_hash"]}
    return {"user": safe_user, "session_token": token}

# --- GOOGLE OAUTH EXCHANGE ---
@api_router.post("/auth/session")
async def auth_session_exchange(payload: SessionExchangeRequest, response: Response):
    sid = payload.session_id.strip()
    if not sid:
        raise HTTPException(status_code=400, detail="Missing session ID")

    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as hx:
            url = f"[https://auth.emergentagent.com/api/session/](https://auth.emergentagent.com/api/session/){sid}"
            r = await hx.get(url, headers={"Accept": "application/json", "User-Agent": "SmartGiaoAn-Backend/1.0"})
            if r.status_code == 404:
                raise HTTPException(status_code=401, detail="Google Session ID was already consumed. Try clicking Google Login again.")
            r.raise_for_status()
            eu = r.json()
    except HTTPException:
        raise
    except httpx.HTTPStatusError as e:
        logger.error(f"Emergent HTTP Error: {e.response.status_code} - {e.response.text}")
        raise HTTPException(status_code=401, detail=f"Auth Broker Error {e.response.status_code}: {e.response.text}")
    except Exception as e:
        logger.error(f"Emergent Connection Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Connection Timeout to Auth Server: {str(e)}")

    email = eu.get("email", "").strip().lower()
    doc = await db.users.find_one({"email": email})
    
    if not doc:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        doc = {
            "user_id": user_id, "email": email, 
            "name": eu.get("name", email.split("@")[0]), 
            "picture": eu.get("picture", ""), 
            "role": "Teacher", 
            "is_premium": email in ADMIN_EMAILS, 
            "free_used": 0, "bonus_credits": 0, 
            "created_at": _now().isoformat()
        }
        await db.users.insert_one(doc)
    else:
        await db.users.update_one({"email": email}, {"$set": {"picture": eu.get("picture", doc.get("picture", ""))}})
        doc = await db.users.find_one({"email": email})

    token = await _create_session(doc["user_id"], response)
    safe_user = {k: v for k, v in doc.items() if k not in ["_id", "password_hash"]}
    return {"user": safe_user, "session_token": token}

@api_router.get("/auth/me")
async def auth_me(user: User = Depends(require_user)):
    return user.model_dump()

@api_router.post("/auth/logout")
async def auth_logout(response: Response, request: Request):
    token = request.cookies.get("session_token")
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ")[1]
    if token:
        await db.user_sessions.delete_many({"session_token": token})
    response.delete_cookie("session_token")
    return {"status": "logged_out"}

@api_router.get("/auth/export")
async def export_account(user: User = Depends(require_user)):
    worksheets = await db.worksheets.find({"user_id": user.user_id}, {"_id": 0}).to_list(None)
    return {"user": user.model_dump(), "worksheets": worksheets}

@api_router.delete("/auth/delete-account")
async def delete_account(user: User = Depends(require_user)):
    await db.users.delete_one({"user_id": user.user_id})
    await db.worksheets.delete_many({"user_id": user.user_id})
    await db.user_sessions.delete_many({"user_id": user.user_id})
    return {"status": "deleted"}

# --- WORKSHEETS ---
@api_router.post("/worksheets/generate")
async def generate_ws(payload: WorksheetRequest, user: User = Depends(require_user)):
    total_allowed = FREE_QUOTA + user.bonus_credits
    if not user.is_premium and user.free_used >= total_allowed:
        raise HTTPException(status_code=402, detail="Out of credits. Please upgrade or watch an ad.")

    # 2000% FIX: Provide stricter instructions on what schema to output
    prompt = f"""
    Design a {payload.skill} worksheet for {payload.level} (CEFR {payload.cefr}) students. 
    Topic: '{payload.topic}'. Length: {payload.num_questions} items. 
    Grammar focus: {payload.grammar_focus or 'None'}.
    You MUST return the content using structured keys appropriate for an ESL worksheet (e.g. "title", "reading_passage", "exercises", "answer_key").
    """
    ws_data = await _run_gemini(prompt, payload.level)

    ws_id = f"ws_{uuid.uuid4().hex[:12]}"
    ws_doc = {
        "worksheet_id": ws_id, "user_id": user.user_id, 
        "title": f"{payload.topic} - {payload.skill}", 
        "level": payload.level, "cefr": payload.cefr, "skill": payload.skill, 
        "content": ws_data, "is_public": True, "created_at": _now().isoformat()
    }
    
    await db.worksheets.insert_one(ws_doc)
    
    if not user.is_premium:
        await db.users.update_one({"user_id": user.user_id}, {"$inc": {"free_used": 1}})
        
    return {k: v for k, v in ws_doc.items() if k != "_id"}

@api_router.get("/worksheets")
async def list_ws(user: User = Depends(require_user)):
    return await db.worksheets.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)

# --- MONETIZATION ---
@api_router.post("/usage/grant-rewarded")
async def grant_ad_reward(payload: RewardedAdRequest, user: User = Depends(require_user)):
    bonus = 1 if payload.tier <= 15 else 2
    await db.users.update_one({"user_id": user.user_id}, {"$inc": {"bonus_credits": bonus}})
    return {"status": "reward_granted", "amount": bonus}

@api_router.post("/billing/mark-premium")
async def mark_premium(user: User = Depends(require_user)):
    await db.users.update_one({"user_id": user.user_id}, {"$set": {"is_premium": True}})
    return {"status": "premium_activated"}

# ============================================================
# MIDDLEWARE & ROUTING
# ============================================================
app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/")
async def root():
    return {"app": "SmartGiaoAn API", "status": "operational"}

@app.get("/health")
async def health():
    return {"status": "healthy", "db": "connected" if mongo_client else "disconnected"}