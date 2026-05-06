from contextlib import asynccontextmanager
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
mongo_url = os.environ.get('MONGO_URL', '')
db_name = os.environ.get('DB_NAME', 'smartgiaoan')
logger.info(f"MONGO_URL present: {bool(mongo_url)}")
logger.info(f"DB_NAME: {db_name}")

mongo_client = None
db = None

try:
    mongo_client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
    db = mongo_client[db_name]
    logger.info("MongoDB client created successfully")
except Exception as e:
    logger.error(f"MongoDB connection failed: {e}")

# ========== GEMINI ==========
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    logger.warning("GEMINI_API_KEY not set")

# ========== CONFIG ==========
ADMIN_EMAILS = set(
    e.strip().lower()
    for e in os.environ.get('ADMIN_EMAILS', 'bentaylors@hotmail.co.uk').split(',')
    if e.strip()
)
FREE_QUOTA = int(os.environ.get('FREE_QUOTA', '3'))

# ========== CORS ORIGINS ==========
_cors_env = os.environ.get('CORS_ORIGINS', '')
CORS_ORIGINS = [o.strip() for o in _cors_env.split(',') if o.strip()] or [
    "https://smartgiaoan.site",
    "https://www.smartgiaoan.site",
    "http://localhost:3000",
]
logger.info(f"CORS_ORIGINS: {CORS_ORIGINS}")

# ============================================================
# LIFESPAN 
# ============================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    if mongo_client:
        mongo_client.close()
        logger.info("MongoDB connection closed")

# ============================================================
# APP INITIALIZATION
# ============================================================
app = FastAPI(title="SmartGiaoAn API", version="2.0.0", lifespan=lifespan)
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

class SessionExchangeRequest(BaseModel):
    session_id: str

class ProfileUpdateRequest(BaseModel):
    teaching_level: str
    class_size: str
    focus_area: str

class RewardedAdRequest(BaseModel):
    tier: int

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
"""

async def _run_gemini(prompt: str) -> dict:
    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=SYSTEM_PROMPT,
        generation_config={"response_mime_type": "application/json", "temperature": 0.8},
    )
    result = await asyncio.to_thread(model.generate_content, prompt)
    return json.loads(result.text)

# ============================================================
# ROUTES
# ============================================================
@api_router.post("/auth/session")
async def auth_session_exchange(payload: SessionExchangeRequest, response: Response):
    session_id = payload.session_id
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

# ============================================================
# INCLUDE ROUTER MUST BE BEFORE MIDDLEWARE 
# ============================================================
app.include_router(api_router)

# ============================================================
# MIDDLEWARE WRAP (Now properly wraps the routes)
# ============================================================
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", include_in_schema=False)
async def root():
    return {"app": "SmartGiaoAn", "status": "ok", "version": "2.0.0"}

@app.get("/health", include_in_schema=False)
async def health():
    return {"status": "healthy"}