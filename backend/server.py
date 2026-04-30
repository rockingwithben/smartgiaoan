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

# ========== PASSWORD HASHING HELPERS ==========
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
    password_hash: Optional[str] = None
    # NEW: Teacher Profile Data
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
    is_public: bool = True  # NEW: Quality control flag for the library
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FixWorksheetRequest(BaseModel):
    worksheetId: str
    originalPrompt: str
    feedback: str

class EmailAuthRequest(BaseModel):
    email: str
    password: str

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
@api_router.post("/auth/register")
async def auth_register(payload: EmailAuthRequest, response: Response):
    email = payload.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    await db.users.insert_one({
        "user_id": user_id,
        "email": email,
        "name": email.split("@")[0],
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

@api_router.post("/auth/login")
async def auth_login(payload: EmailAuthRequest, response: Response):
    email = payload.email.lower()
    user_doc = await db.users.find_one({"email": email})
    
    if not user_doc or not user_doc.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(payload.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    session_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "session_id": str(uuid.uuid4()),
        "user_id": user_doc["user_id"],
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", max_age=7*24*3600, path="/")
    user_doc.pop("_id", None)
    return {"user": user_doc, "session_token": session_token}

class SessionRequest(BaseModel):
    session_id: str

@api_router.post("/auth/session")
async def auth_session(payload: SessionRequest, response: Response):
    async with httpx.AsyncClient(timeout=15) as http:
        r = await http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": payload.session_id},
        )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    data = r.json()
    email = data["email"]
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {"name": data.get("name", ""), "picture": data.get("picture", "")}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id, "email": email, "name": data.get("name", ""), "picture": data.get("picture", ""),
            "is_premium": False, "free_used": 0, "bonus_credits": 0, "created_at": datetime.now(timezone.utc).isoformat(),
        })
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "session_id": str(uuid.uuid4()), "user_id": user_id, "session_token": data["session_token"],
        "expires_at": expires_at.isoformat(), "created_at": datetime.now(timezone.utc).isoformat(),
    })
    response.set_cookie(key="session_token", value=data["session_token"], httponly=True, secure=True, samesite="none", max_age=7 * 24 * 3600, path="/")
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

@api_router.put("/auth/profile")
async def update_profile(payload: ProfileUpdateRequest, user: User = Depends(require_user)):
    """Save the teacher's classroom profile to MongoDB"""
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {
            "teaching_level": payload.teaching_level,
            "class_size": payload.class_size,
            "focus_area": payload.focus_area
        }}
    )
    updated_user = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return updated_user

@api_router.get("/auth/export")
async def auth_export(user: User = Depends(require_user)):
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    worksheets = await db.worksheets.find({"user_id": user.user_id}, {"_id": 0}).to_list(1000)
    return {"user": user_doc, "worksheets": worksheets}

@api_router.delete("/auth/delete-account")
async def auth_delete_account(response: Response, user: User = Depends(require_user)):
    await db.worksheets.delete_many({"user_id": user.user_id})
    await db.user_sessions.delete_many({"user_id": user.user_id})
    await db.users.delete_one({"user_id": user.user_id})
    response.delete_cookie("session_token", path="/")
    return {"deleted": True}

# ========== WORKSHEET ROUTES ==========
WORKSHEET_SYSTEM_PROMPT = """ROLE
You are a SENIOR CAMBRIDGE ESOL EXAMINER and ESL CURRICULUM DESIGNER with 20+ years of experience writing official exam materials (YLE Starters/Movers/Flyers, KET, PET, FCE, IELTS) and authoring textbooks used in Vietnamese schools. You write the kind of worksheet a Vietnamese teacher proudly photocopies for tomorrow's class.

OUTPUT CONTRACT — NON-NEGOTIABLE
- Return ONE valid JSON object only. No markdown fences, no commentary, no trailing text.
- Match the JSON schema below exactly. All required fields must be present.
- All natural-language content (questions, options, passages, instructions) is in ENGLISH. Only the `vi_translation` of the title is in Vietnamese.

PEDAGOGICAL RULES
1. CEFR alignment is strict:
   - A1: 250-word vocab, present simple, basic Q-words, concrete topics. Sentences <8 words.
   - A2: 600-word vocab, past simple, can-could, comparatives. Sentences <12 words.
   - B1: 1200-word vocab, present perfect, conditionals 0/1, modals. Paragraphs of 3-5 sentences.
   - B2: 2500-word vocab, conditionals 2/3, passive voice, phrasal verbs. Argumentative texts.
   - C1: 4000+ word vocab, advanced cohesion, nuance, abstract topics, register shifts.
   - C2: native-like; idiom, irony, register, complex argumentation.
2. Level mapping:
   - Kindergarten → A1 max. Big print, picture-friendly cues (describe in text), 16-20 total questions across all sections, fun.
   - Primary → A1-A2. 22-26 total questions. Rhymes, repetition, simple stories.
   - Secondary → A2-B2. 26-30 total questions. Exam-style tasks.
   - IELTS → B1-C1. 26-32 total questions. Mirror IELTS task formats: True/False/Not Given, matching headings, sentence completion, multiple choice.
3. VOLUME REQUIREMENT — THREE-PAGE WORKSHEET MINIMUM:
   The output MUST be substantial enough to fill at least 3 printed A4 pages. Plan for it:
   - Reading passage: A1=120w, A2=180w, B1=280w, B2=380w, C1=500w, C2=650w (LONGER than typical AI worksheets — this is non-negotiable).
   - 4 to 5 sections minimum, each with 5-8 questions.
   - The TOTAL number of questions across all sections must respect the level mapping above (16-32). DO NOT undershoot.
   - Always include a final Writing/Production task (1-2 prompts of 60-100 words minimum response).
   - Always include a vocabulary glossary section with 8-12 key words from the passage with simple definitions.
   - Always include the answer key, teacher notes, AND extension activity.
4. STRUCTURE — MUST follow this multi-part shape regardless of skill (with adjustments):
   Section 1 — Pre-reading / Vocabulary preview (matching, definitions, predict)
   Section 2 — Main passage comprehension (multiple_choice + true_false / true_false_not_given)
   Section 3 — Detailed comprehension (short_answer or fill_blank) OR grammar focus drawn from passage
   Section 4 — Vocabulary in context (gap-fill, word formation, sentence_transformation for B1+)
   Section 5 — Production: short writing or speaking prompt with success criteria (3-5 bullet criteria)
   Skill-specific tweaks:
   - Writing focus: Section 3 becomes "model text analysis", Section 5 expanded to longer prompt.
   - Grammar focus: target ONE structure across Sections 2-4 (recognition → controlled → free).
   - Vocabulary focus: ensure the passage is rich in target lexis; Sections 3-4 drill it.
   - Listening focus: passage IS the transcript; Section 1 is gist listening; later sections detail. Note: "Teacher reads passage aloud at natural pace, twice."
4. QUESTION TYPES — use a MIX (never only multiple choice):
   - multiple_choice (4 plausible distractors)
   - fill_blank
   - short_answer
   - true_false (or true_false_not_given for IELTS B1+)
   - matching
   - sentence_transformation (B1+)
   - error_correction (B1+)
5. Every question has: number, question, type, options (for MC/matching only), answer.
6. ANSWER KEY: include a one-line, learner-friendly EXPLANATION for each item. For grammar items, name the rule.
7. TEACHER NOTES: 3 short sentences — (a) lesson aim, (b) one common Vietnamese-L1 error to watch for (e.g. dropped articles, plural -s, /θ/ → /t/), (c) one differentiation tip.

LOCALIZATION (MANDATORY — this is the soul of SmartGiaoAn)
- Use Vietnamese FIRST names every time a person is needed: Minh, Lan, Linh, Huy, Nam, Hoa, Mai, Tuan, An, Khanh, Thao, Bao, Phuong, Quan, Trang.
- Use Vietnamese family names sparingly: Nguyen, Tran, Le, Pham, Hoang, Vu, Bui.
- Locations: Hanoi, Saigon (Ho Chi Minh City), Da Nang, Hue, Hoi An, Sapa, Halong Bay, Mekong Delta, Phu Quoc, Da Lat.
- Culture/objects: Tet, Mid-Autumn (Trung Thu), banh mi, pho, bun cha, banh chung, ao dai, conical hat (non la), motorbike, lotus pond, dragon fruit, lychee, bamboo, water puppet.
- School/life: morning exercise, red scarf, Hung Kings Day, lunar new year, family altar, grandparents living together.
- Avoid clichés that flatten the culture; weave details organically.
- NEVER reference politics, war, religion-comparison, alcohol with minors, or anything inappropriate for a Vietnamese classroom.

QUALITY BAR
- Every question must have a SINGLE unambiguous correct answer. Distractors plausible but defensibly wrong.
- No tautologies, no trick questions, no questions answerable without reading the passage.
- Vary sentence openers; avoid robotic patterns.
- For young learners, inject one tiny moment of warmth or humour.

JSON SCHEMA (return EXACTLY this shape)
{
  "title": "string — short, exam-paper style (e.g. 'Tet at Grandma's House')",
  "vi_translation": "string — Vietnamese translation of the title only",
  "subtitle": "string — skill + level summary, e.g. 'Reading · A2 · Primary'",
  "level": "string",
  "cefr": "string",
  "skill": "string",
  "estimated_time_minutes": number,
  "learning_objectives": ["string", ...],
  "vocabulary_glossary": [
    {"word": "string", "part_of_speech": "n. | v. | adj. | adv. | phr.", "definition": "simple learner-friendly definition", "example": "example sentence using a Vietnamese context"}
  ],
  "instructions": "string — overall instructions, exam-style",
  "passage": "string OR null — reading text or listening transcript (LONG, level-appropriate length)",
  "sections": [
    {
      "section_title": "string e.g. 'Part 1 — Pre-reading: vocabulary preview'",
      "instructions": "string",
      "questions": [
        {
          "number": 1,
          "question": "string",
          "type": "multiple_choice | fill_blank | short_answer | true_false | true_false_not_given | matching | sentence_transformation | error_correction | open_ended",
          "options": ["string", ...] or null,
          "answer": "string"
        }
      ]
    }
  ],
  "writing_task": {
    "prompt": "string — concrete writing prompt with a Vietnamese context",
    "minimum_words": number,
    "success_criteria": ["string", "string", "string"]
  },
  "answer_key": [
    {"number": 1, "answer": "string", "explanation": "string — one short learner-friendly line"}
  ],
  "teacher_notes": "string — three sentences as specified above",
  "extension_activity": "string — one optional 5-minute activity teachers can do after, using the same target language"
}
"""

def build_user_prompt(req: WorksheetRequest, user_doc: dict = None) -> str:
    exam_map = {
        "Kindergarten": "YLE Pre-Starters",
        "Primary": "YLE Starters / Movers / Flyers",
        "Secondary": "KET / PET / FCE",
        "IELTS": "IELTS",
    }
    exam = exam_map.get(req.level, "Cambridge")
    grammar = req.grammar_focus or "appropriate to the level and topic"
    
    # INVISIBLE MAGIC: Injecting the teacher's profile directly into the AI's brain
    profile_context = ""
    if user_doc and user_doc.get("teaching_level"):
        profile_context = f"\nTEACHER PROFILE CONTEXT: This class is for {user_doc.get('teaching_level')} students. The class size is {user_doc.get('class_size')}, focusing heavily on {user_doc.get('focus_area')}. Scale the activity formats, font sizes, and instructions to perfectly match this exact demographic."

    return f"""TASK — generate a flawless, classroom-ready, FUN worksheet.

CEFR Level: {req.cefr}
Cambridge family: {exam}
Student level: {req.level}
Skill focus: {req.skill}
Topic: "{req.topic}"
Target grammar: "{grammar}"
Target total questions: {req.num_questions} (you may exceed to satisfy the 3-page minimum and level-mapped range).
{profile_context}

Apply the dynamic persona / tone rules from your system instructions for this CEFR level.
Strict JSON. Vietnamese localisation throughout. Make it fun enough that students forget it's a worksheet."""

@api_router.post("/worksheets/generate")
async def generate_worksheet(
    req: WorksheetRequest,
    request: Request,
    user: Optional[User] = Depends(get_current_user_optional),
):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")

    # --- GOD MODE LOGIC ---
    ADMIN_EMAILS = ["bentaylors@hotmail.co.uk"]
    is_admin = False
    
    if user and user.email in ADMIN_EMAILS:
        is_admin = True
        logger.info(f"🔥 GOD MODE ACTIVATED: {user.email} bypassed the paywall.")

    if user and not user.is_premium and not is_admin:
        free_total = 3 + user.bonus_credits
        if user.free_used >= free_total:
            raise HTTPException(status_code=402, detail="Free quota exceeded. Upgrade to Premium or watch an ad.")

    # Grab the freshest user doc so we can inject their profile into the prompt
    fresh_user = None
    if user:
        fresh_user = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})

    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=WORKSHEET_SYSTEM_PROMPT,
            generation_config={"response_mime_type": "application/json", "temperature": 0.8},
        )
        # PASS THE USER DOC HERE
        result = model.generate_content(build_user_prompt(req, fresh_user))
        content = json.loads(result.text)
    except Exception as e:
        logger.exception("Gemini generation failed")
        raise HTTPException(status_code=502, detail=f"AI generation failed: {str(e)}")

    worksheet_id = f"ws_{uuid.uuid4().hex[:12]}"
    doc = {
        "worksheet_id": worksheet_id, "user_id": user.user_id if user else None, "title": content.get("title", req.topic),
        "level": req.level, "cefr": req.cefr, "skill": req.skill, "topic": req.topic, "content": content,
        "is_public": True, # NEW: Automatically flagged for the public library!
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.worksheets.insert_one(doc)

    if user and not user.is_premium and not is_admin:
        await db.users.update_one({"user_id": user.user_id}, {"$inc": {"free_used": 1}})

    return {"worksheet_id": worksheet_id, "title": doc["title"], "level": req.level, "cefr": req.cefr, "skill": req.skill, "topic": req.topic, "content": content, "user": fresh_user}

@api_router.post("/worksheets/fix")
async def fix_worksheet(req: FixWorksheetRequest, user: Optional[User] = Depends(get_current_user_optional)):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")

    ai_correction_prompt = f"""
    You are an expert curriculum designer. You previously generated an ESL worksheet using these instructions: 
    "{req.originalPrompt}"
    
    The teacher rejected your worksheet and provided this specific feedback:
    "{req.feedback}"
    
    CRITICAL INSTRUCTION: Rewrite the entire worksheet. You MUST incorporate the teacher's feedback and fix the issues they mentioned. Keep the rest of the structure intact. Return only the updated content in the exact same JSON format as before.
    """

    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=WORKSHEET_SYSTEM_PROMPT,
            generation_config={"response_mime_type": "application/json", "temperature": 0.8},
        )
        result = model.generate_content(ai_correction_prompt)
        content = json.loads(result.text)
        
    except Exception as e:
        logger.exception("Gemini generation failed during fix")
        raise HTTPException(status_code=502, detail=f"AI correction failed: {str(e)}")

    query = {"worksheet_id": req.worksheetId}
    if user: query["user_id"] = user.user_id

    await db.worksheets.update_one(
        query,
        {
            "$set": {
                "content": content, 
                "status": "needs_review",
                "is_public": False # NEW: Removes bad worksheets from the public library
            },
            "$push": {"revisions": {"feedback": req.feedback, "timestamp": datetime.now(timezone.utc).isoformat()}}
        }
    )
    return {"success": True, "content": content}

# NEW ROUTE: Public Library Feed
@api_router.get("/library/feed")
async def get_public_library(level: Optional[str] = None):
    # Search MongoDB for worksheets flagged as public
    query = {"is_public": True}
    
    # If the user clicked "Kindergarten" on the menu, filter the results
    if level:
        query["level"] = level
        
    # Grab the 50 freshest worksheets to display on the public feed
    docs = await db.worksheets.find(query, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    return docs

@api_router.get("/worksheets")
async def list_worksheets(user: User = Depends(require_user)):
    docs = await db.worksheets.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return docs

@api_router.get("/worksheets/{worksheet_id}")
async def get_worksheet(worksheet_id: str, user: User = Depends(require_user)):
    doc = await db.worksheets.find_one({"worksheet_id": worksheet_id, "user_id": user.user_id}, {"_id": 0})
    if not doc: raise HTTPException(status_code=404, detail="Not found")
    return doc

class RewardedRequest(BaseModel):
    tier: str  

@api_router.post("/usage/grant-rewarded")
async def grant_rewarded(payload: RewardedRequest, user: User = Depends(require_user)):
    tier_credits = {"short": 1, "medium": 2, "long": 3}
    credit = tier_credits.get(payload.tier, 1)
    await db.users.update_one({"user_id": user.user_id}, {"$inc": {"bonus_credits": credit}})
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return {"granted": credit, "user": user_doc}

@api_router.post("/billing/mark-premium")
async def mark_premium(user: User = Depends(require_user)):
    await db.users.update_one({"user_id": user.user_id}, {"$set": {"is_premium": True, "premium_since": datetime.now(timezone.utc).isoformat()}})
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return user_doc

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
