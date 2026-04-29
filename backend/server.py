from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Cookie, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import uuid
import logging
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any, Dict
from datetime import datetime, timezone, timedelta
import google.generativeai as genai

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Gemini
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI(title="SmartGiaoAn API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ========== MODELS ==========
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = ""
    is_premium: bool = False
    free_used: int = 0
    bonus_credits: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class WorksheetRequest(BaseModel):
    level: str  # Kindergarten / Primary / Secondary / IELTS
    cefr: str   # A1, A2, B1, B2, C1, C2
    skill: str  # reading / writing / grammar / vocabulary / listening
    topic: str
    num_questions: int = 8


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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


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
        expires_at = datetime.fromisoformat(expires_at)
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
class SessionRequest(BaseModel):
    session_id: str


@api_router.post("/auth/session")
async def auth_session(payload: SessionRequest, response: Response):
    """Exchange Emergent session_id for session_token."""
    async with httpx.AsyncClient(timeout=15) as http:
        r = await http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": payload.session_id},
        )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    data = r.json()
    email = data["email"]
    # Upsert user
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": data.get("name", ""), "picture": data.get("picture", "")}},
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": data.get("name", ""),
            "picture": data.get("picture", ""),
            "is_premium": False,
            "free_used": 0,
            "bonus_credits": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    # Save session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "session_id": str(uuid.uuid4()),
        "user_id": user_id,
        "session_token": data["session_token"],
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    response.set_cookie(
        key="session_token",
        value=data["session_token"],
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 3600,
        path="/",
    )
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"user": user_doc, "session_token": data["session_token"]}


@api_router.get("/auth/me")
async def auth_me(user: User = Depends(require_user)):
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return user_doc


@api_router.post("/auth/logout")
async def auth_logout(response: Response, session_token: Optional[str] = Cookie(None)):
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


# ========== WORKSHEET ROUTES ==========
WORKSHEET_SYSTEM_PROMPT = """You are a senior Cambridge ESOL examiner & curriculum designer creating worksheets for ESL teachers in Vietnam.

CRITICAL RULES:
1. Output ONLY valid JSON - no markdown, no preamble, no explanations.
2. Cambridge/CEFR-aligned content matching the requested level exactly.
3. LOCALIZATION (mandatory): Use Vietnamese names (Minh, Lan, Linh, Huy, Nam, Hoa, Mai, Tuan), Vietnamese cities (Hanoi, Saigon, Da Nang, Hue, Hoi An), and cultural touchstones (Tet, Pho, Banh Mi, Ao Dai, Mekong, Sapa, motorbikes, fish sauce, lotus) wherever a person, place or context is needed.
4. Age-appropriate complexity per level.
5. Provide answer key for every question.

JSON SCHEMA:
{
  "title": "string - short Cambridge-style title",
  "subtitle": "string - skill + level summary",
  "level": "string",
  "cefr": "string",
  "skill": "string",
  "instructions": "string - exam-style instructions",
  "passage": "string OR null - reading text if reading skill",
  "sections": [
    {
      "section_title": "string e.g. 'Part 1 - Multiple Choice'",
      "instructions": "string",
      "questions": [
        {
          "number": 1,
          "question": "string",
          "type": "multiple_choice | fill_blank | short_answer | true_false | matching",
          "options": ["string"] or null,
          "answer": "string"
        }
      ]
    }
  ],
  "answer_key": [
    {"number": 1, "answer": "string", "explanation": "string"}
  ],
  "teacher_notes": "string - 2-3 sentences for the teacher"
}
"""


def build_user_prompt(req: WorksheetRequest) -> str:
    return f"""Create a Cambridge-style ESL worksheet with the following parameters:
- Student level: {req.level}
- CEFR: {req.cefr}
- Skill focus: {req.skill}
- Topic: {req.topic}
- Number of questions: {req.num_questions}

Remember: Vietnamese localization (names, places, culture). Strict JSON only."""


@api_router.post("/worksheets/generate")
async def generate_worksheet(
    req: WorksheetRequest,
    request: Request,
    user: Optional[User] = Depends(get_current_user_optional),
):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")

    # Quota enforcement (only for logged-in users; anonymous users tracked by frontend localStorage)
    if user and not user.is_premium:
        free_total = 3 + user.bonus_credits
        if user.free_used >= free_total:
            raise HTTPException(status_code=402, detail="Free quota exceeded. Upgrade to Premium or watch an ad.")

    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=WORKSHEET_SYSTEM_PROMPT,
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.8,
            },
        )
        result = model.generate_content(build_user_prompt(req))
        text = result.text
        content = json.loads(text)
    except Exception as e:
        logger.exception("Gemini generation failed")
        raise HTTPException(status_code=502, detail=f"AI generation failed: {str(e)}")

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
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.worksheets.insert_one(doc)

    # Increment usage if logged in & not premium
    if user and not user.is_premium:
        await db.users.update_one({"user_id": user.user_id}, {"$inc": {"free_used": 1}})

    fresh_user = None
    if user:
        fresh_user = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})

    return {
        "worksheet_id": worksheet_id,
        "title": doc["title"],
        "level": req.level,
        "cefr": req.cefr,
        "skill": req.skill,
        "topic": req.topic,
        "content": content,
        "user": fresh_user,
    }


@api_router.get("/worksheets")
async def list_worksheets(user: User = Depends(require_user)):
    docs = await db.worksheets.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return docs


@api_router.get("/worksheets/{worksheet_id}")
async def get_worksheet(worksheet_id: str, user: User = Depends(require_user)):
    doc = await db.worksheets.find_one({"worksheet_id": worksheet_id, "user_id": user.user_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return doc


# ========== USAGE / REWARDED AD ==========
class RewardedRequest(BaseModel):
    tier: str  # 'short' | 'medium' | 'long'


@api_router.post("/usage/grant-rewarded")
async def grant_rewarded(payload: RewardedRequest, user: User = Depends(require_user)):
    """Grant 1 bonus credit after user watches a rewarded ad of given tier."""
    credit = 1
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$inc": {"bonus_credits": credit}},
    )
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return {"granted": credit, "user": user_doc}


# ========== UPGRADE (PayPal) ==========
@api_router.post("/billing/mark-premium")
async def mark_premium(user: User = Depends(require_user)):
    """Called by frontend after PayPal hosted-button success. NOTE: For production, use webhook verification."""
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"is_premium": True, "premium_since": datetime.now(timezone.utc).isoformat()}},
    )
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return user_doc


# ========== HEALTH ==========
@api_router.get("/")
async def root():
    return {"app": "SmartGiaoAn", "status": "ok"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
