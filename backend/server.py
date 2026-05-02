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
from typing import List, Optional, Any, Dict
from datetime import datetime, timezone, timedelta
import google.generativeai as genai

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ========== LOGGING ==========
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
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
    logging.warning("GEMINI_API_KEY not set - worksheet generation will fail")

# ========== CONFIG ==========
# Admin emails from env var - comma separated
# e.g. ADMIN_EMAILS=bentaylors@hotmail.co.uk,other@admin.com
ADMIN_EMAILS = set(
    e.strip().lower()
    for e in os.environ.get('ADMIN_EMAILS', 'bentaylors@hotmail.co.uk').split(',')
    if e.strip()
)

# Free quota per user (override via env var)
FREE_QUOTA = int(os.environ.get('FREE_QUOTA', '3'))

# ============================================================
# APP SETUP
# CRITICAL ORDER: add_middleware BEFORE include_router
# Otherwise CORS OPTIONS preflights return 404 and
# Google Login / all credentialed requests break
# ============================================================
app = FastAPI(title="SmartGiaoAn API", version="2.0.0")

# STEP 1 - CORS middleware registered FIRST
# No wildcards (*.vercel.app) - they are incompatible with
# allow_credentials=True per the CORS spec
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        "https://smartgiaoan.site",
        "https://www.smartgiaoan.site",
        "http://localhost:3000",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# STEP 2 - router defined
api_router = APIRouter(prefix="/api")


# ========== PASSWORD HASHING ==========
def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.pbkdf2_hmac(
        'sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000
    ).hex()
    return f"{salt}:{pwd_hash}"

def verify_password(password: str, hashed_str: str) -> bool:
    try:
        salt, stored_hash = hashed_str.split(':', 1)
        pwd_hash = hashlib.pbkdf2_hmac(
            'sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000
        ).hex()
        return secrets.compare_digest(pwd_hash, stored_hash)
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
    tier: int  # 15 = 1 credit, 30 = 2 credits, 45 = 3 credits


# ========== HELPERS ==========
def _now() -> datetime:
    return datetime.now(timezone.utc)

def _parse_dt(value) -> datetime:
    if isinstance(value, datetime):
        dt = value
    else:
        dt = datetime.fromisoformat(str(value).replace('Z', '+00:00'))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt

def _is_admin(user: Optional[User]) -> bool:
    return bool(user and user.email.lower() in ADMIN_EMAILS)

def _tier_to_credits(tier: int) -> int:
    return {15: 1, 30: 2, 45: 3}.get(tier, 0)

async def _create_session(user_id: str, response: Response) -> str:
    token = str(uuid.uuid4())
    expires_at = _now() + timedelta(days=7)
    await db.user_sessions.insert_one({
        "session_id": str(uuid.uuid4()),
        "user_id": user_id,
        "session_token": token,
        "expires_at": expires_at.isoformat(),
        "created_at": _now().isoformat(),
    })
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 3600,
        path="/",
    )
    return token


# ========== AUTH DEPENDENCIES ==========
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
    if not session:
        return None

    if _parse_dt(session["expires_at"]) < _now():
        return None

    user_doc = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user_doc:
        return None
    return User(**user_doc)

async def require_user(
    user: Optional[User] = Depends(get_current_user_optional),
) -> User:
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

async def require_admin(user: User = Depends(require_user)) -> User:
    if not _is_admin(user):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ========== GEMINI ==========
WORKSHEET_SYSTEM_PROMPT = """
You are a senior Cambridge ESOL examiner and ESL curriculum designer specialising in
Vietnamese learners. You create rigorous, culturally-relevant worksheets that:

- Are STRICTLY aligned to the CEFR level provided (A1-C2)
- Use Vietnamese names: Minh, Lan, Huy, Thao, Nam, Linh, Duc, Mai
- Reference Vietnamese locations: Hanoi, Ho Chi Minh City/Saigon, Da Nang, Hoi An, Sapa, Da Lat
- Include Vietnamese cultural contexts: Tet, banh mi, pho, ao dai, Mid-Autumn Festival
- Fill a MINIMUM of 3 A4 pages of content
- Include a complete answer key for every exercise

OUTPUT: Valid JSON only. No markdown. No commentary outside JSON.

JSON SCHEMA:
{
  "title": "string",
  "level": "string",
  "cefr": "string",
  "skill": "string",
  "topic": "string",
  "reading_passage": {
    "title": "string",
    "text": "string (min 300 words A1-B1, 500+ words B2-C2)",
    "word_count": number
  },
  "vocabulary": {
    "glossary": [{"word": "string", "definition": "string", "example": "string"}],
    "exercises": [{"type": "string", "instructions": "string", "items": [], "answers": []}]
  },
  "grammar": {
    "focus": "string",
    "explanation": "string",
    "exercises": [{"type": "string", "instructions": "string", "items": [], "answers": []}]
  },
  "comprehension": {
    "exercises": [{"type": "string", "instructions": "string", "items": [], "answers": []}]
  },
  "writing": {
    "task": "string",
    "success_criteria": ["string"],
    "model_answer": "string"
  },
  "extension": {
    "activity": "string",
    "teacher_notes": "string"
  }
}
""".strip()

async def _run_gemini(prompt: str) -> dict:
    """Run Gemini in a thread pool so it does not block the async event loop."""
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash-preview-04-17",
        system_instruction=WORKSHEET_SYSTEM_PROMPT,
        generation_config={
            "response_mime_type": "application/json",
            "temperature": 0.8,
            "max_output_tokens": 8192,
        },
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
        "user_id": user_id,
        "email": email,
        "name": payload.name.strip() if payload.name else email.split("@")[0],
        "role": payload.role or "Teacher",
        "heard_from": payload.heard_from or "",
        "password_hash": hash_password(payload.password),
        "is_premium": False,
        "free_used": 0,
        "bonus_credits": 0,
        "created_at": _now().isoformat(),
    })

    token = await _create_session(user_id, response)
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return {"user": user_doc, "session_token": token}


@api_router.post("/auth/login")
async def auth_login(payload: EmailAuthRequest, response: Response):
    email = payload.email.strip().lower()

    # God Mode - admin bypass (no password needed if env flag set,
    # but here we still check password for security)
    user_doc = await db.users.find_one({"email": email})

    if not user_doc or not user_doc.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(payload.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = await _create_session(user_doc["user_id"], response)
    user_doc.pop("_id", None)
    user_doc.pop("password_hash", None)
    return {"user": user_doc, "session_token": token}


@api_router.post("/auth/session")
async def auth_session_exchange(payload: dict, response: Response):
    """Exchange Emergent Google OAuth session_id for a SmartGiaoAn session."""
    session_id = payload.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")

    try:
        async with httpx.AsyncClient(timeout=10.0) as hx:
            r = await hx.get(
                f"https://auth.emergentagent.com/api/session/{session_id}"
            )
            r.raise_for_status()
            emergent_user = r.json()
    except Exception as exc:
        logger.error(f"Emergent auth error: {exc}")
        raise HTTPException(status_code=401, detail="Invalid or expired Google session")

    email = emergent_user.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="No email returned from Google session")

    user_doc = await db.users.find_one({"email": email})

    if not user_doc:
        # First time Google login - create account automatically
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": emergent_user.get("name", email.split("@")[0]),
            "picture": emergent_user.get("picture", ""),
            "role": "Teacher",
            # God Mode: admin emails get premium automatically
            "is_premium": email in ADMIN_EMAILS,
            "free_used": 0,
            "bonus_credits": 0,
            "created_at": _now().isoformat(),
        }
        await db.users.insert_one(user_doc)
        logger.info(f"New Google user: {email}")
    else:
        # Refresh picture and ensure admin gets premium
        update = {"picture": emergent_user.get("picture", user_doc.get("picture", ""))}
        if email in ADMIN_EMAILS:
            update["is_premium"] = True
        await db.users.update_one({"email": email}, {"$set": update})
        user_doc = await db.users.find_one({"email": email}, {"_id": 0})

    token = await _create_session(user_doc["user_id"], response)
    user_doc.pop("_id", None)
    user_doc.pop("password_hash", None)
    return {"user": user_doc, "session_token": token}


@api_router.get("/auth/me")
async def auth_me(user: User = Depends(require_user)):
    user_doc = await db.users.find_one(
        {"user_id": user.user_id},
        {"_id": 0, "password_hash": 0}
    )
    return user_doc


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
        {"$set": {
            "teaching_level": payload.teaching_level,
            "class_size": payload.class_size,
            "focus_area": payload.focus_area,
        }},
    )
    updated = await db.users.find_one(
        {"user_id": user.user_id},
        {"_id": 0, "password_hash": 0}
    )
    return updated


@api_router.get("/auth/export")
async def export_account(user: User = Depends(require_user)):
    user_doc = await db.users.find_one(
        {"user_id": user.user_id},
        {"_id": 0, "password_hash": 0}
    )
    worksheets = await db.worksheets.find(
        {"user_id": user.user_id}, {"_id": 0}
    ).to_list(1000)
    return {"user": user_doc, "worksheets": worksheets}


@api_router.delete("/auth/delete-account")
async def delete_account(user: User = Depends(require_user), response: Response = None):
    await db.users.delete_one({"user_id": user.user_id})
    await db.worksheets.delete_many({"user_id": user.user_id})
    await db.user_sessions.delete_many({"user_id": user.user_id})
    if response:
        response.delete_cookie("session_token", path="/")
    logger.info(f"Account deleted: {user.user_id}")
    return {"ok": True}


# ============================================================
# WORKSHEET ROUTES
# ============================================================

@api_router.post("/worksheets/generate")
async def generate_worksheet(
    req: WorksheetRequest,
    user: Optional[User] = Depends(get_current_user_optional),
):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")

    # Quota check - admins and premium users have unlimited access
    if user and not user.is_premium and not _is_admin(user):
        allowance = FREE_QUOTA + (user.bonus_credits or 0)
        if user.free_used >= allowance:
            raise HTTPException(
                status_code=402,
                detail=f"Free quota of {allowance} worksheets exceeded. Upgrade to Premium or watch an ad."
            )

    grammar_line = f"\nGrammar focus: {req.grammar_focus}" if req.grammar_focus else ""
    prompt = (
        f"Create a complete 3-page Cambridge-style ESL worksheet.\n"
        f"Level: {req.level}\n"
        f"CEFR: {req.cefr}\n"
        f"Skill focus: {req.skill}\n"
        f"Topic: {req.topic}\n"
        f"Number of comprehension/practice questions: {req.num_questions}"
        f"{grammar_line}\n\n"
        f"Use Vietnamese names, locations, and cultural contexts throughout. "
        f"Full answer key required. Minimum 3 A4 pages of content."
    )

    try:
        content = await _run_gemini(prompt)
    except json.JSONDecodeError:
        logger.error("Gemini returned invalid JSON")
        raise HTTPException(status_code=502, detail="AI returned invalid content - please retry")
    except Exception:
        logger.exception("Gemini generation failed")
        raise HTTPException(status_code=502, detail="AI generation failed - please retry")

    worksheet_id = f"ws_{uuid.uuid4().hex[:12]}"
    doc = {
        "worksheet_id": worksheet_id,
        "user_id": user.user_id if user else None,
        "title": content.get("title", req.topic),
        "level": req.level,
        "cefr": req.cefr,
        "skill": req.skill,
        "topic": req.topic,
        "content": content,
        "is_public": True,
        "created_at": _now().isoformat(),
    }
    await db.worksheets.insert_one(doc)
    logger.info(f"Worksheet generated: {worksheet_id} user={user.user_id if user else 'anon'}")

    if user and not user.is_premium and not _is_admin(user):
        await db.users.update_one(
            {"user_id": user.user_id},
            {"$inc": {"free_used": 1}},
        )

    doc.pop("_id", None)
    return doc


@api_router.get("/worksheets")
async def list_worksheets(user: User = Depends(require_user)):
    docs = await db.worksheets.find(
        {"user_id": user.user_id}, {"_id": 0}
    ).sort("created_at", -1).limit(100).to_list(100)
    return docs


@api_router.get("/worksheets/{worksheet_id}")
async def get_worksheet(
    worksheet_id: str,
    user: Optional[User] = Depends(get_current_user_optional),
):
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
        raise HTTPException(status_code=404, detail="Worksheet not found")
    if doc.get("user_id") != user.user_id and not _is_admin(user):
        raise HTTPException(status_code=403, detail="Not your worksheet")
    await db.worksheets.delete_one({"worksheet_id": worksheet_id})
    return {"ok": True}


# ============================================================
# LIBRARY
# ============================================================

@api_router.get("/library/feed")
async def get_public_library(
    level: Optional[str] = None,
    cefr: Optional[str] = None,
    skill: Optional[str] = None,
    limit: int = 50,
):
    query: Dict[str, Any] = {"is_public": True}
    if level:
        query["level"] = level
    if cefr:
        query["cefr"] = cefr
    if skill:
        query["skill"] = skill
    limit = min(limit, 100)
    docs = await db.worksheets.find(
        query, {"_id": 0, "content": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return docs


# ============================================================
# REWARDED ADS
# ============================================================

@api_router.post("/usage/grant-rewarded")
async def grant_rewarded(payload: RewardedAdRequest, user: User = Depends(require_user)):
    credits = _tier_to_credits(payload.tier)
    if credits == 0:
        raise HTTPException(status_code=400, detail="Invalid tier. Use 15, 30, or 45.")
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$inc": {"bonus_credits": credits}},
    )
    updated = await db.users.find_one(
        {"user_id": user.user_id},
        {"_id": 0, "password_hash": 0}
    )
    logger.info(f"Rewarded ad: +{credits} credits to {user.user_id}")
    return {"ok": True, "credits_granted": credits, "user": updated}


# ============================================================
# BILLING
# ============================================================

@api_router.post("/billing/mark-premium")
async def mark_premium(user: User = Depends(require_user)):
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"is_premium": True}},
    )
    updated = await db.users.find_one(
        {"user_id": user.user_id},
        {"_id": 0, "password_hash": 0}
    )
    logger.info(f"Premium upgraded: {user.user_id}")
    return {"ok": True, "user": updated}


@api_router.post("/billing/cancel-premium")
async def cancel_premium(user: User = Depends(require_user)):
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"is_premium": False}},
    )
    updated = await db.users.find_one(
        {"user_id": user.user_id},
        {"_id": 0, "password_hash": 0}
    )
    return {"ok": True, "user": updated}


# ============================================================
# ADMIN
# ============================================================

@api_router.get("/admin/stats")
async def admin_stats(user: User = Depends(require_admin)):
    total_users = await db.users.count_documents({})
    premium_users = await db.users.count_documents({"is_premium": True})
    total_worksheets = await db.worksheets.count_documents({})
    return {
        "total_users": total_users,
        "premium_users": premium_users,
        "free_users": total_users - premium_users,
        "total_worksheets": total_worksheets,
    }


@api_router.post("/admin/grant-premium/{user_id}")
async def admin_grant_premium(user_id: str, admin: User = Depends(require_admin)):
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"is_premium": True}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True, "user_id": user_id}


# ============================================================
# STEP 3 - include router AFTER middleware
# ============================================================
app.include_router(api_router)


# ============================================================
# ROOT + HEALTH
# ============================================================

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
    }


# ============================================================
# LIFECYCLE
# ============================================================

@app.on_event("shutdown")
async def shutdown_db_client():
    mongo_client.close()
