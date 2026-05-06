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

# ============================================================
# APP SETUP
# ============================================================
app = FastAPI(title="SmartGiaoAn API", version="2.0.0", lifespan=lifespan)
api_router = APIRouter(prefix="/api")

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
    # Set the cookie as a fallback, but primary auth will use the returned token via LocalStorage
    response.set_cookie(
        key="session_token", value=token,
        httponly=True, secure=True, samesite="none",
        max_age=7 * 24 * 3600, path="/"
    )
    return token

# FIX: Ironclad Auth Header Extraction
async def get_current_user_optional(
    request: Request,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
) -> Optional[User]:
    
    token = session_token
    
    # Aggressively check for the Bearer token in the Authorization header
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        
    if not token:
        # Fallback check directly in the request headers just in case
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
- OUTPUT MUST BE RAW, VALID JSON ONLY. Do not use markdown code blocks (```json).
"""
    # Dynamic Pedagogy Injection
    if "Kindergarten" in level:
        base_prompt += "\n- KINDERGARTEN OVERRIDE: You are designing for a class of active 3-to-4-year-olds. Do NOT generate dense text. Prioritize large visual placeholders, alphabet tracing exercises, basic phonics, and TPR (Total Physical Response) game ideas. Limit text to extremely simple target vocabulary."
    elif "Primary" in level:
        base_prompt += "\n- PRIMARY OVERRIDE: Focus on vocabulary matching, simple gap-fills, short localized stories (e.g., family trips to the Old Quarter), and coloring prompts. Keep formatting highly spacious."
    else:
        base_prompt += "\n- SECONDARY/IELTS OVERRIDE: Minimum 3 full A4 pages of rigorous content. Include complex reading comprehension, structured writing tasks, and a full, detailed answer key."

    return base_prompt

async def _run_gemini(prompt: str, level: str) -> dict:
    dynamic_instruction = build_system_prompt(level)
    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=dynamic_instruction,
        generation_config={"response_mime_type": "application/json", "temperature": 0.8},
    )
    
    # FIX: Robust 3-try loop to eliminate random AI hallucination crashes
    for attempt in range(3):
        try:
            result = await asyncio.to_thread(model.generate_content, prompt)
            raw_text = result.text.strip()
            
            # Clean markdown formatting if the AI disobeys prompt instructions
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:-3].strip()
            elif raw_text.startswith("```"):
                raw_text = raw_text[3:-3].strip()
                
            return json.loads(raw_text)
        except Exception as e:
            if attempt == 2:
                logger.error(f"Gemini generation failed after 3 attempts: {e}")
                raise HTTPException(status_code=500, detail="AI Generation failed. Please try again.")
            await asyncio.sleep(1)

# ============================================================
# API ROUTES
# ============================================================

# --- AUTHENTICATION ---
@api_router.post("/auth/session")
async def auth_session_exchange(payload: SessionExchangeRequest, response: Response):
    try:
        async with httpx.AsyncClient(timeout=10.0) as hx:
            r = await hx.get(f"[https://auth.emergentagent.com/api/session/](https://auth.emergentagent.com/api/session/){payload.session_id}")
            r.raise_for_status()
            eu = r.json()
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired Google session")

    email = eu.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="No email in Google session")

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
            "created_at": _now().isoformat(),
        }
        await db.users.insert_one(doc)
    else:
        update = {"picture": eu.get("picture", doc.get("picture", ""))}
        if email in ADMIN_EMAILS:
            update["is_premium"] = True
        await db.users.update_one({"email": email}, {"$set": update})
        doc = await db.users.find_one({"email": email}, {"_id": 0})

    token = await _create_session(doc["user_id"], response)
    doc.pop("_id", None)
    
    # Returning session_token explicitly so frontend api.js can store it in LocalStorage
    return {"user": doc, "session_token": token}

@api_router.get("/auth/me")
async def auth_me(user: User = Depends(require_user)):
    return user.model_dump()

@api_router.post("/auth/logout")
async def auth_logout(response: Response, request: Request):
    # Try to extract the token to delete it from DB
    token = request.cookies.get("session_token")
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
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
    # 1. Enforce Paywall & Quotas
    total_allowed = FREE_QUOTA + user.bonus_credits
    if not user.is_premium and user.free_used >= total_allowed:
        raise HTTPException(status_code=402, detail="Out of credits. Please upgrade or watch an ad.")

    # 2. Build AI Prompt
    prompt = f"Design a {payload.skill} worksheet for {payload.level} (CEFR {payload.cefr}) students. Topic: '{payload.topic}'. Length: {payload.num_questions} items. Grammar focus: {payload.grammar_focus or 'None'}."

    # 3. Generate Content via Dynamic Engine
    ws_data = await _run_gemini(prompt, payload.level)

    # 4. Save to Database
    ws_id = f"ws_{uuid.uuid4().hex[:12]}"
    ws_doc = {
        "worksheet_id": ws_id,
        "user_id": user.user_id,
        "title": f"{payload.topic} - {payload.skill}",
        "level": payload.level,
        "cefr": payload.cefr,
        "skill": payload.skill,
        "content": ws_data,
        "is_public": True,  # Feeds the Public Library SEO
        "created_at": _now().isoformat()
    }
    await db.worksheets.insert_one(ws_doc)

    # 5. Deduct Quota
    if not user.is_premium:
        await db.users.update_one({"user_id": user.user_id}, {"$inc": {"free_used": 1}})

    ws_doc.pop("_id", None)
    return ws_doc

@api_router.get("/worksheets")
async def list_ws(user: User = Depends(require_user)):
    docs = await db.worksheets.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return docs

# --- MONETIZATION & USAGE ---
@api_router.post("/usage/grant-rewarded")
async def grant_ad_reward(payload: RewardedAdRequest, user: User = Depends(require_user)):
    # 15s Ad = 1 credit | 30s Ad = 2 credits
    bonus_amount = 1 if payload.tier <= 15 else 2
    await db.users.update_one({"user_id": user.user_id}, {"$inc": {"bonus_credits": bonus_amount}})
    return {"status": "reward_granted", "amount": bonus_amount}

@api_router.post("/billing/mark-premium")
async def mark_premium(user: User = Depends(require_user)):
    # MVP Honor System Route (MUST secure with PayPal Webhooks post-launch)
    await db.users.update_one({"user_id": user.user_id}, {"$set": {"is_premium": True}})
    return {"status": "premium_activated"}


# ============================================================
# ROUTER INCLUSION & MIDDLEWARE 
# (Strict Ordering Required for CORS to work)
# ============================================================
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", include_in_schema=False)
async def root():
    return {"app": "SmartGiaoAn API", "status": "operational", "version": "2.0.0"}

@app.get("/health", include_in_schema=False)
async def health():
    return {"status": "healthy", "db": "connected" if mongo_client else "disconnected"}