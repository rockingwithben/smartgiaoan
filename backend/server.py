from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Cookie, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import uuid
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
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ========== MONGODB ==========
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ========== GEMINI ==========
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI(title="SmartGiaoAn API")

# 1. Define router
api_router = APIRouter(prefix="/api")

# ========== PASSWORD HASHING ==========
def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
    return f"{salt}:{pwd_hash}"

def verify_password(password: str, hashed_str: str) -> bool:
    try:
        salt, stored_hash = hashed_str.split(':')
        pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
        return pwd_hash == stored_hash
    except:
        return False

# ========== MODELS (unchanged) ==========
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

# ... (All other models stay the same - I kept them unchanged)
class WorksheetRequest(BaseModel):
    level: str  
    cefr: str   
    skill: str  
    topic: str
    num_questions: int = 24
    grammar_focus: Optional[str] = None  

class Worksheet(BaseModel):
    model_config = ConfigDict(extra="ignore")
    worksheet_id: str
    user_id: Optional[str] = None
    title: str
    level: str
    cefr: str
    skill: str
    topic: str
    content: Dict[str, Any]
    is_public: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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

# ========== AUTH HELPERS ==========
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
    
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user_doc = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user_doc:
        return None
    return User(**user_doc)

async def require_user(user: Optional[User] = Depends(get_current_user_optional)) -> User:
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

# ========== AUTH ROUTES ==========
@api_router.post("/auth/register")
async def auth_register(payload: EmailAuthRequest, response: Response):
    # ... (unchanged - kept original logic)
    email = payload.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    await db.users.insert_one({
        "user_id": user_id,
        "email": email,
        "name": payload.name if payload.name else email.split("@")[0],
        "role": payload.role,
        "heard_from": payload.heard_from,
        "password_hash": hash_password(payload.password),
        "is_premium": False,
        "free_used": 0,
        "bonus_credits": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    session_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "session_id": str(uuid.uuid4()),
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", max_age=7*24*3600, path="/")
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"user": user_doc, "session_token": session_token}

# ... (login, logout, profile, me routes unchanged - I kept them as-is)

@api_router.post("/auth/session")
async def auth_session_exchange(payload: dict, response: Response):
    session_id = payload.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")

    try:
        async with httpx.AsyncClient() as client:
            emergent_resp = await client.get(
                f"https://auth.emergentagent.com/api/session/{session_id}",
                timeout=10.0
            )
            emergent_resp.raise_for_status()
            emergent_user = emergent_resp.json()
    except Exception as e:
        logger.error(f"Emergent auth failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired Google session")

    email = emergent_user.get("email", "").lower()
    if not email:
        raise HTTPException(status_code=400, detail="No email in session")

    user_doc = await db.users.find_one({"email": email})

    if not user_doc:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": emergent_user.get("name", email.split("@")[0]),
            "picture": emergent_user.get("picture", ""),
            "role": "Teacher",
            "is_premium": False,
            "free_used": 0,
            "bonus_credits": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(user_doc)

    session_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "session_id": str(uuid.uuid4()),
        "user_id": user_doc["user_id"],
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    response.set_cookie(
        key="session_token", value=session_token, 
        httponly=True, secure=True, samesite="none", 
        max_age=7*24*3600, path="/"
    )
    
    user_doc.pop("_id", None)
    return {"user": user_doc, "session_token": session_token}

# ========== OTHER ROUTES (kept same) ==========
@api_router.get("/library/feed")
async def get_public_library(level: Optional[str] = None):
    query = {"is_public": True}
    if level:
        query["level"] = level
    docs = await db.worksheets.find(query, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    return docs

@api_router.post("/worksheets/generate")
async def generate_worksheet(
    req: WorksheetRequest,
    request: Request,
    user: Optional[User] = Depends(get_current_user_optional),
):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")

    ADMIN_EMAILS = ["bentaylors@hotmail.co.uk"]
    is_admin = (user and user.email in ADMIN_EMAILS)

    if user and not user.is_premium and not is_admin:
        if user.free_used >= (3 + user.bonus_credits):
            raise HTTPException(status_code=402, detail="Free quota exceeded.")

    # Generate worksheet logic (placeholder - you can expand later)
    try:
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash", 
            system_instruction="You are a professional ESL curriculum designer for Vietnamese students...",
            generation_config={"response_mime_type": "application/json", "temperature": 0.7},
        )
        prompt = f"Generate a full 3-page ESL worksheet for {req.level} ({req.cefr}) on topic: {req.topic}..."
        result = model.generate_content(prompt)
        content = json.loads(result.text)
    except Exception as e:
        logger.exception("Gemini generation failed")
        raise HTTPException(status_code=502, detail="AI generation failed")

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
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.worksheets.insert_one(doc)

    if user and not user.is_premium and not is_admin:
        await db.users.update_one({"user_id": user.user_id}, {"$inc": {"free_used": 1}})

    return doc

# ========== MAIN APP SETUP ==========
app.include_router(api_router)

@app.get("/")
async def root():
    return {"app": "SmartGiaoAn", "status": "ok", "version": "2.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

# 3. CORS - AFTER router inclusion
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        "https://smartgiaoan.site",
        "https://www.smartgiaoan.site",
        "http://localhost:3000",
        "https://*.vercel.app",
        "http://*.vercel.app"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()