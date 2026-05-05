from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Cookie, Depends
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
from typing import Optional, Any, Dict
from datetime import datetime, timezone, timedelta
import google.generativeai as genai

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ========== MONGODB ==========
mongo_url = os.environ['MONGO_URL']
mongo_client = AsyncIOMotorClient(mongo_url)
db = mongo_client[os.environ['DB_NAME']]

# ========== GEMINI ==========
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    logger.warning("GEMINI_API_KEY not set")

# ========== CONFIG ==========
# Set ADMIN_EMAILS=bentaylors@hotmail.co.uk in Vercel env vars
ADMIN_EMAILS = set(
    e.strip().lower()
    for e in os.environ.get('ADMIN_EMAILS', 'bentaylors@hotmail.co.uk').split(',')
    if e.strip()
)
FREE_QUOTA = int(os.environ.get('FREE_QUOTA', '3'))

# ========== CORS ORIGINS ==========
# Set CORS_ORIGINS in Vercel env vars if you add new domains
# e.g. CORS_ORIGINS=https://smartgiaoan.site,https://www.smartgiaoan.site
_cors_env = os.environ.get('CORS_ORIGINS', '')
CORS_ORIGINS = [o.strip() for o in _cors_env.split(',') if o.strip()] or [
    "https://smartgiaoan.site",
    "https://www.smartgiaoan.site",
    "http://localhost:3000",
]

# ============================================================
# APP - CORS middleware MUST be registered before include_router
# ============================================================
app = FastAPI(title="SmartGiaoAn API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")

# ========== PASSWORD HASHING ==========
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

# ========== MODELS ==========
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    role: str = "Teacher"
    heard_from: str = ""
    picture: Optional[str] = ""
    is_premium: bool = False
    free_used: int = 0
    bonus_credits: int = 0
    password_hash: Optional[str] = None
    teaching_level: Optional[str] = None
    class_size: Optional[str] = None
    focus_area: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WorksheetRequest(BaseModel):
    level: str
    cefr: str
    skill: str
    topic: str
    num_questions: int = 24
    grammar_focus: Optional[str] = None

class EmailAuthRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = ""
    role: Optional[str] = "Teacher"
    heard_from: Optional[str] = ""

class ProfileUpdateRequest(BaseModel):
    teaching_level: str
    class_size: str
    focus_area: str

class RewardedAdRequest(BaseModel):
    tier: int  # 15=1 credit, 30=2 credits, 45=3 credits

# ========== HELPERS ==========
def _now():
    return datetime.now(timezone.utc)

def _parse_dt(v):
    if isinstance(v, datetime):
        dt = v
    else:
        dt = datetime.fromisoformat(str(v).replace('Z', '+00:00'))
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)

def _is_admin(user):
    return bool(user and user.email and user.email.strip().lower() in ADMIN_EMAILS)

async def _create_session(user_id: str, response: Response) -> str:
    token = str(uuid.uuid4())
    expires = _now() + timedelta(days=7)
    await db.user_sessions.insert_one({
        "session_id": str(uuid.uuid4()),
        "user_id": user_id,
        "session_token": token,
        "expires_at": expires.isoformat(),
        "created_at": _now().isoformat(),
    })
    response.set_cookie(
        key="session_token", value=token,
        httponly=True, secure=True, samesite="none",
        max_age=7*24*3600, path="/"
    )
    return token

# ========== AUTH DEPS ==========
async def get_current_user_optional(
    request: Request,
    session_token: Optional[str] = Cookie(None),
) -> Optional[User]:
    token = session_token
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        return None
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session or _parse_dt(session["expires_at"]) < _now():
        return None
    doc = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    return User(**doc) if doc else None

async def require_user(user: Optional[User] = Depends(get_current_user_optional)) -> User:
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

async def require_admin(user: User = Depends(require_user)) -> User:
    if not _is_admin(user):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ========== GEMINI ==========
SYSTEM_PROMPT = """
You are a senior Cambridge ESOL examiner and ESL curriculum designer specialising in Vietnamese learners.

Rules:
- STRICTLY align to the CEFR level given (A1-C2)
- Use Vietnamese names: Minh, Lan, Huy, Thao, Nam, Linh, Duc, Mai
- Use Vietnamese locations: Hanoi, Ho Chi Minh City, Da Nang, Hoi An, Sapa, Da Lat
- Include Vietnamese culture: Tet, banh mi, pho, ao dai, Mid-Autumn Festival
- Minimum 3 full A4 pages of content
- Full answer key for every exercise

OUTPUT: Valid JSON only. No markdown fences. No text outside the JSON object.

JSON SCHEMA:
{
  "title": "string",
  "level": "string",
  "cefr": "string",
  "skill": "string",
  "topic": "string",
  "reading_passage": {"title": "string", "text": "string", "word_count": 0},
  "vocabulary": {
    "glossary": [{"word": "string", "definition": "string", "example": "string"}],
    "exercises": [{"type": "string", "instructions": "string", "items": [], "answers": []}]
  },
  "grammar": {
    "focus": "string", "explanation": "string",
    "exercises": [{"type": "string", "instructions": "string", "items": [], "answers": []}]
  },
  "comprehension": {
    "exercises": [{"type": "string", "instructions": "string", "items": [], "answers": []}]
  },
  "writing": {"task": "string", "success_criteria": ["string"], "model_answer": "string"},
  "extension": {"activity": "string", "teacher_notes": "string"}
}
""".strip()

async def _run_gemini(prompt: str) -> dict:
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash-preview-04-17",
        system_instruction=SYSTEM_PROMPT,
        generation_config={"response_mime_type": "application/json", "temperature": 0.8, "max_output_tokens": 8192},
    )
    result = await asyncio.to_thread(model.generate_content, prompt)
    return json.loads(result.text)

# ============================================================
# AUTH ROUTES
# ============================================================

@api_router.post("/auth/register")
async def auth_register(payload: EmailAuthRequest, response: Response):
    email = payload.email.strip().lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    await db.users.insert_one({
        "user_id": user_id, "email": email,
        "name": (payload.name or "").strip() or email.split("@")[0],
        "role": payload.role or "Teacher",
        "heard_from": payload.heard_from or "",
        "password_hash": hash_password(payload.password),
        "is_premium": email in ADMIN_EMAILS,
        "free_used": 0, "bonus_credits": 0,
        "created_at": _now().isoformat(),
    })
    token = await _create_session(user_id, response)
    doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return {"user": doc, "session_token": token}

@api_router.post("/auth/login")
async def auth_login(payload: EmailAuthRequest, response: Response):
    email = payload.email.strip().lower()
    doc = await db.users.find_one({"email": email})
    if not doc or not doc.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(payload.password, doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    # Ensure admin always has premium
    if email in ADMIN_EMAILS and not doc.get("is_premium"):
        await db.users.update_one({"email": email}, {"$set": {"is_premium": True}})
        doc["is_premium"] = True
    token = await _create_session(doc["user_id"], response)
    doc.pop("_id", None)
    doc.pop("password_hash", None)
    return {"user": doc, "session_token": token}

@api_router.post("/auth/session")
async def auth_session_exchange(payload: dict, response: Response):
    """Exchange Emergent Google OAuth session_id for a SmartGiaoAn session."""
    session_id = payload.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    try:
        async with httpx.AsyncClient(timeout=10.0) as hx:
            r = await hx.get(f"https://auth.emergentagent.com/api/session/{session_id}")
            r.raise_for_status()
            eu = r.json()
    except Exception as e:
        logger.error(f"Emergent auth error: {e}")
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
        logger.info(f"New Google user: {email}")
    else:
        update = {"picture": eu.get("picture", doc.get("picture", ""))}
        if email in ADMIN_EMAILS:
            update["is_premium"] = True
        await db.users.update_one({"email": email}, {"$set": update})
        doc = await db.users.find_one({"email": email}, {"_id": 0})

    token = await _create_session(doc["user_id"], response)
    doc.pop("_id", None)
    doc.pop("password_hash", None)
    return {"user": doc, "session_token": token}

@api_router.get("/auth/me")
async def auth_me(user: User = Depends(require_user)):
    return await db.users.find_one({"user_id": user.user_id}, {"_id": 0, "password_hash": 0})

@api_router.post("/auth/logout")
async def auth_logout(response: Response, session_token: Optional[str] = Cookie(None)):
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}

@api_router.put("/auth/profile")
async def update_profile(payload: ProfileUpdateRequest, user: User = Depends(require_user)):
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"teaching_level": payload.teaching_level, "class_size": payload.class_size, "focus_area": payload.focus_area}}
    )
    return await db.users.find_one({"user_id": user.user_id}, {"_id": 0, "password_hash": 0})

@api_router.get("/auth/export")
async def export_account(user: User = Depends(require_user)):
    doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0, "password_hash": 0})
    worksheets = await db.worksheets.find({"user_id": user.user_id}, {"_id": 0}).to_list(1000)
    return {"user": doc, "worksheets": worksheets}

@api_router.delete("/auth/delete-account")
async def delete_account(user: User = Depends(require_user), response: Response = None):
    await db.users.delete_one({"user_id": user.user_id})
    await db.worksheets.delete_many({"user_id": user.user_id})
    await db.user_sessions.delete_many({"user_id": user.user_id})
    if response:
        response.delete_cookie("session_token", path="/")
    return {"ok": True}

# ============================================================
# WORKSHEET ROUTES
# ============================================================

@api_router.post("/worksheets/generate")
async def generate_worksheet(req: WorksheetRequest, user: Optional[User] = Depends(get_current_user_optional)):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")
    is_admin = _is_admin(user)
    if user and not user.is_premium and not is_admin:
        allowance = FREE_QUOTA + (user.bonus_credits or 0)
        if user.free_used >= allowance:
            raise HTTPException(status_code=402, detail=f"Quota of {allowance} exceeded. Upgrade or watch an ad.")

    grammar_line = f"\nGrammar focus: {req.grammar_focus}" if req.grammar_focus else ""
    prompt = (
        f"Create a complete 3-page Cambridge ESL worksheet.\n"
        f"Level: {req.level} | CEFR: {req.cefr} | Skill: {req.skill} | Topic: {req.topic}\n"
        f"Questions: {req.num_questions}{grammar_line}\n"
        f"Vietnamese names/locations/culture throughout. Full answer key. Min 3 A4 pages."
    )
    try:
        content = await _run_gemini(prompt)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="AI returned invalid content - please retry")
    except Exception:
        logger.exception("Gemini failed")
        raise HTTPException(status_code=502, detail="AI generation failed - please retry")

    worksheet_id = f"ws_{uuid.uuid4().hex[:12]}"
    doc = {
        "worksheet_id": worksheet_id,
        "user_id": user.user_id if user else None,
        "title": content.get("title", req.topic),
        "level": req.level, "cefr": req.cefr, "skill": req.skill, "topic": req.topic,
        "content": content, "is_public": True, "created_at": _now().isoformat(),
    }
    await db.worksheets.insert_one(doc)
    logger.info(f"Worksheet: {worksheet_id} user={user.user_id if user else 'anon'} admin={is_admin}")

    if user and not user.is_premium and not is_admin:
        await db.users.update_one({"user_id": user.user_id}, {"$inc": {"free_used": 1}})

    doc.pop("_id", None)
    return doc

@api_router.get("/worksheets")
async def list_worksheets(user: User = Depends(require_user)):
    return await db.worksheets.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)

@api_router.get("/worksheets/{worksheet_id}")
async def get_worksheet(worksheet_id: str, user: Optional[User] = Depends(get_current_user_optional)):
    doc = await db.worksheets.find_one({"worksheet_id": worksheet_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Worksheet not found")
    if not doc.get("is_public"):
        if not user or (user.user_id != doc.get("user_id") and not _is_admin(user)):
            raise HTTPException(status_code=403, detail="Access denied")
    return doc

@api_router.delete("/worksheets/{worksheet_id}")
async def delete_worksheet(worksheet_id: str, user: User = Depends(require_user)):
    doc = await db.worksheets.find_one({"worksheet_id": worksheet_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    if doc.get("user_id") != user.user_id and not _is_admin(user):
        raise HTTPException(status_code=403, detail="Not your worksheet")
    await db.worksheets.delete_one({"worksheet_id": worksheet_id})
    return {"ok": True}

# ============================================================
# LIBRARY
# ============================================================

@api_router.get("/library/feed")
async def get_public_library(level: Optional[str] = None, cefr: Optional[str] = None, skill: Optional[str] = None, limit: int = 50):
    query: Dict[str, Any] = {"is_public": True}
    if level: query["level"] = level
    if cefr: query["cefr"] = cefr
    if skill: query["skill"] = skill
    docs = await db.worksheets.find(query, {"_id": 0, "content": 0}).sort("created_at", -1).limit(min(limit, 100)).to_list(min(limit, 100))
    return docs

# ============================================================
# REWARDED ADS
# ============================================================

@api_router.post("/usage/grant-rewarded")
async def grant_rewarded(payload: RewardedAdRequest, user: User = Depends(require_user)):
    credit_map = {15: 1, 30: 2, 45: 3}
    credits = credit_map.get(int(payload.tier), 0)
    if credits == 0:
        raise HTTPException(status_code=400, detail="Invalid tier. Use 15, 30, or 45.")
    await db.users.update_one({"user_id": user.user_id}, {"$inc": {"bonus_credits": credits}})
    updated = await db.users.find_one({"user_id": user.user_id}, {"_id": 0, "password_hash": 0})
    logger.info(f"Rewarded: +{credits} to {user.user_id}")
    return {"ok": True, "credits_granted": credits, "user": updated}

# ============================================================
# BILLING
# ============================================================

@api_router.post("/billing/mark-premium")
async def mark_premium(user: User = Depends(require_user)):
    await db.users.update_one({"user_id": user.user_id}, {"$set": {"is_premium": True}})
    updated = await db.users.find_one({"user_id": user.user_id}, {"_id": 0, "password_hash": 0})
    logger.info(f"Premium: {user.user_id}")
    return {"ok": True, "user": updated}

@api_router.post("/billing/cancel-premium")
async def cancel_premium(user: User = Depends(require_user)):
    await db.users.update_one({"user_id": user.user_id}, {"$set": {"is_premium": False}})
    updated = await db.users.find_one({"user_id": user.user_id}, {"_id": 0, "password_hash": 0})
    return {"ok": True, "user": updated}

# ============================================================
# ADMIN
# ============================================================

@api_router.get("/admin/stats")
async def admin_stats(user: User = Depends(require_admin)):
    total = await db.users.count_documents({})
    premium = await db.users.count_documents({"is_premium": True})
    wsheets = await db.worksheets.count_documents({})
    return {"total_users": total, "premium_users": premium, "free_users": total - premium, "total_worksheets": wsheets}

@api_router.post("/admin/grant-premium/{user_id}")
async def admin_grant_premium(user_id: str, admin: User = Depends(require_admin)):
    r = await db.users.update_one({"user_id": user_id}, {"$set": {"is_premium": True}})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True}

# ============================================================
# INCLUDE ROUTER
# ============================================================
app.include_router(api_router)

@app.get("/", include_in_schema=False)
async def root():
    return {"app": "SmartGiaoAn", "status": "ok", "version": "2.0.0"}

@app.get("/health", include_in_schema=False)
async def health():
    try:
        await db.command("ping")
        db_ok = True
    except Exception:
        db_ok = False
    return {
        "status": "healthy" if db_ok else "degraded",
        "database": "ok" if db_ok else "error",
        "gemini": "configured" if GEMINI_API_KEY else "missing",
        "admin_emails": list(ADMIN_EMAILS),
        "cors_origins": CORS_ORIGINS,
    }

@app.on_event("shutdown")
async def shutdown_db_client():
    mongo_client.close()
