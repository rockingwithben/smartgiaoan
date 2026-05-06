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
import re
import base64
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

# PayPal Config
PAYPAL_CLIENT_ID = os.environ.get('PAYPAL_CLIENT_ID', '')
PAYPAL_CLIENT_SECRET = os.environ.get('PAYPAL_CLIENT_SECRET', '')
PAYPAL_BASE_URL = os.environ.get('PAYPAL_BASE_URL', 'https://api-m.sandbox.paypal.com')

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
    human_editor_credits: int = 0
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

class AIEditRequest(BaseModel):
    worksheet_id: str
    command: str

class HumanEditRequest(BaseModel):
    worksheet_id: str
    notes: Optional[str] = ""

class PayPalCaptureRequest(BaseModel):
    order_id: str
    product_type: str  # "premium_monthly" or "human_editor_credit"

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

async def require_premium(user: User = Depends(require_user)) -> User:
    if not user.is_premium:
        raise HTTPException(status_code=402, detail="Premium required. Upgrade to unlock the AI Editor.")
    return user

async def require_human_editor_credit(user: User = Depends(require_user)) -> User:
    if user.human_editor_credits < 1:
        raise HTTPException(status_code=402, detail="No human editor credits. Purchase a review for £5.")
    return user

# ============================================================
# PAYPAL HELPERS
# ============================================================
async def verify_paypal_order(order_id: str) -> dict:
    if not PAYPAL_CLIENT_ID or not PAYPAL_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="PayPal credentials not configured")
    
    async with httpx.AsyncClient() as client:
        auth_str = base64.b64encode(f"{PAYPAL_CLIENT_ID}:{PAYPAL_CLIENT_SECRET}".encode()).decode()
        token_resp = await client.post(
            f"{PAYPAL_BASE_URL}/v1/oauth2/token",
            headers={"Authorization": f"Basic {auth_str}"},
            data={"grant_type": "client_credentials"}
        )
        token_resp.raise_for_status()
        access_token = token_resp.json()["access_token"]
        
        order_resp = await client.get(
            f"{PAYPAL_BASE_URL}/v2/checkout/orders/{order_id}",
            headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
        )
        order_resp.raise_for_status()
        return order_resp.json()

# ============================================================
# GEMINI & DYNAMIC PEDAGOGY ENGINE
# ============================================================
adc_json_raw = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS_JSON', '').strip()
api_key = os.environ.get('GEMINI_API_KEY', '').strip()
adc_configured = False

if adc_json_raw:
    try:
        creds_dict = json.loads(adc_json_raw)
        adc_path = '/tmp/gcp_adc.json'
        with open(adc_path, 'w') as f:
            json.dump(creds_dict, f)
        os.chmod(adc_path, 0o600)
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = adc_path
        
        import google.auth
        credentials, project_id = google.auth.default()
        genai.configure(credentials=credentials)
        logger.info(f"Using Enterprise ADC credentials for Google API (project: {project_id}).")
        adc_configured = True
    except json.JSONDecodeError:
        logger.error("GOOGLE_APPLICATION_CREDENTIALS_JSON is not valid JSON. Falling back.")
    except Exception as e:
        logger.error(f"ADC setup failed: {e}. Falling back.")

if not adc_configured and api_key:
    genai.configure(api_key=api_key)
    logger.info("Using standard API key.")
elif not adc_configured and not api_key:
    logger.warning("NO GOOGLE CREDENTIALS FOUND! AI Engine will fail.")

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
        model_name="gemini-1.5-pro-latest",
        system_instruction=dynamic_instruction,
        generation_config={"response_mime_type": "application/json", "temperature": 0.8},
    )
    
    last_error = ""
    for attempt in range(3):
        try:
            result = await asyncio.wait_for(
                asyncio.to_thread(model.generate_content, prompt),
                timeout=60.0
            )
            
            if not result.candidates:
                feedback = result.prompt_feedback if hasattr(result, 'prompt_feedback') else None
                block_reason = feedback.block_reason if feedback and hasattr(feedback, 'block_reason') else "Unknown"
                last_error = f"Content blocked by safety filters. Reason: {block_reason}"
                logger.warning(last_error)
                await asyncio.sleep(1)
                continue
            
            raw_text = result.text.strip()
            
            if not raw_text:
                last_error = "Empty response from AI"
                logger.warning(last_error)
                await asyncio.sleep(1)
                continue
            
            raw_text = re.sub(r'^```(?:json)?\s*', '', raw_text, flags=re.IGNORECASE)
            raw_text = re.sub(r'\s*```$', '', raw_text)
            raw_text = raw_text.strip()
                
            return json.loads(raw_text)
            
        except asyncio.TimeoutError:
            last_error = "AI generation timed out after 60 seconds"
            logger.error(last_error)
        except json.JSONDecodeError as je:
            last_error = f"JSON Parsing Error: {je}"
            logger.error(last_error)
        except Exception as e:
            last_error = f"Google API Error: {str(e)}"
            logger.error(last_error)
            
        await asyncio.sleep(1)
        
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
        "free_used": 0, "bonus_credits": 0, "human_editor_credits": 0,
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
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True, trust_env=False) as hx:
            url = f"https://auth.emergentagent.com/api/session/{sid}"
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
            "free_used": 0, "bonus_credits": 0, "human_editor_credits": 0,
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
    response.delete_cookie("session_token", path="/")
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

@api_router.get("/worksheets/{worksheet_id}")
async def get_worksheet(worksheet_id: str, user: User = Depends(require_user)):
    ws = await db.worksheets.find_one({"worksheet_id": worksheet_id}, {"_id": 0})
    if not ws:
        raise HTTPException(status_code=404, detail="Worksheet not found")
    if ws.get("user_id") != user.user_id and not ws.get("is_public", False):
        raise HTTPException(status_code=403, detail="This worksheet is private")
    return ws

# --- AI EDITOR (PREMIUM PAYWALL) ---
@api_router.post("/worksheets/ai-edit")
async def ai_edit_worksheet(payload: AIEditRequest, user: User = Depends(require_premium)):
    ws = await db.worksheets.find_one({"worksheet_id": payload.worksheet_id, "user_id": user.user_id})
    if not ws:
        raise HTTPException(status_code=404, detail="Worksheet not found")
    
    current_content = json.dumps(ws["content"], indent=2)
    edit_prompt = f"""You are editing an ESL worksheet. Here is the current content:
{current_content}

TEACHER'S REQUEST: {payload.command}

Rules:
- Return the FULL updated worksheet as valid JSON.
- Preserve the existing structure (title, sections, exercises).
- Only modify what the teacher asked for.
- OUTPUT MUST BE RAW JSON ONLY. Do not use markdown code blocks."""
    
    edited_content = await _run_gemini(edit_prompt, ws["level"])
    
    new_ws_id = f"ws_{uuid.uuid4().hex[:12]}"
    new_doc = {
        "worksheet_id": new_ws_id,
        "user_id": user.user_id,
        "title": f"{ws['title']} (Edited)",
        "level": ws["level"],
        "cefr": ws["cefr"],
        "skill": ws["skill"],
        "topic": ws.get("topic", ""),
        "content": edited_content,
        "is_public": False,
        "parent_id": payload.worksheet_id,
        "edit_command": payload.command,
        "created_at": _now().isoformat()
    }
    await db.worksheets.insert_one(new_doc)
    return {k: v for k, v in new_doc.items() if k != "_id"}

# --- HUMAN EDITOR (£5 ONE-TIME PAYWALL) ---
@api_router.post("/worksheets/human-edit-request")
async def request_human_edit(payload: HumanEditRequest, user: User = Depends(require_human_editor_credit)):
    ws = await db.worksheets.find_one({"worksheet_id": payload.worksheet_id, "user_id": user.user_id})
    if not ws:
        raise HTTPException(status_code=404, detail="Worksheet not found")
    
    await db.users.update_one({"user_id": user.user_id}, {"$inc": {"human_editor_credits": -1}})
    
    review_doc = {
        "review_id": f"rev_{uuid.uuid4().hex[:8]}",
        "worksheet_id": payload.worksheet_id,
        "user_id": user.user_id,
        "user_email": user.email,
        "worksheet_title": ws["title"],
        "teacher_notes": payload.notes,
        "status": "pending",
        "assigned_to": None,
        "result": None,
        "created_at": _now().isoformat(),
        "completed_at": None
    }
    await db.human_reviews.insert_one(review_doc)
    
    return {
        "status": "submitted",
        "review_id": review_doc["review_id"],
        "message": "Your worksheet is in the review queue. Expect feedback within 24 hours."
    }

@api_router.get("/worksheets/human-edit-status/{review_id}")
async def human_edit_status(review_id: str, user: User = Depends(require_user)):
    review = await db.human_reviews.find_one({"review_id": review_id, "user_id": user.user_id}, {"_id": 0})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review

# --- PUBLIC LIBRARY ---
@api_router.get("/library/feed")
async def public_library_feed(
    level: Optional[str] = None,
    skill: Optional[str] = None,
    search: Optional[str] = None
):
    query = {"is_public": True}
    if level and level != "All":
        query["level"] = level
    if skill and skill != "All":
        query["skill"] = skill
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"topic": {"$regex": search, "$options": "i"}}
        ]
    
    pipeline = [
        {"$match": query},
        {"$sort": {"created_at": -1}},
        {"$limit": 100},
        {"$lookup": {
            "from": "users",
            "localField": "user_id",
            "foreignField": "user_id",
            "as": "author"
        }},
        {"$project": {
            "_id": 0,
            "worksheet_id": 1,
            "title": 1,
            "level": 1,
            "cefr": 1,
            "skill": 1,
            "topic": 1,
            "created_at": 1,
            "author_name": {"$ifNull": [{"$arrayElemAt": ["$author.name", 0]}, "Anonymous Teacher"]}
        }}
    ]
    docs = await db.worksheets.aggregate(pipeline).to_list(100)
    return docs

@api_router.post("/library/{worksheet_id}/clone")
async def clone_worksheet(worksheet_id: str, user: User = Depends(require_user)):
    original = await db.worksheets.find_one({"worksheet_id": worksheet_id, "is_public": True})
    if not original:
        raise HTTPException(status_code=404, detail="Worksheet not found or not public")
    
    new_id = f"ws_{uuid.uuid4().hex[:12]}"
    new_doc = {
        "worksheet_id": new_id,
        "user_id": user.user_id,
        "title": original["title"],
        "level": original["level"],
        "cefr": original["cefr"],
        "skill": original["skill"],
        "topic": original.get("topic", ""),
        "content": original["content"],
        "is_public": False,
        "created_at": _now().isoformat(),
        "cloned_from": worksheet_id
    }
    await db.worksheets.insert_one(new_doc)
    return {"worksheet_id": new_id, "status": "cloned"}

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

# --- PAYPAL PAYMENTS ---
@api_router.post("/billing/paypal-capture")
async def paypal_capture(payload: PayPalCaptureRequest, user: User = Depends(require_user)):
    try:
        order_data = await verify_paypal_order(payload.order_id)
    except Exception as e:
        logger.error(f"PayPal verification failed: {e}")
        raise HTTPException(status_code=400, detail="PayPal verification failed")
    
    status = order_data.get("status", "")
    if status not in ("COMPLETED", "APPROVED"):
        raise HTTPException(status_code=400, detail=f"PayPal order not completed. Status: {status}")
    
    product_type = payload.product_type
    
    if product_type == "human_editor_credit":
        await db.users.update_one({"user_id": user.user_id}, {"$inc": {"human_editor_credits": 1}})
        return {"status": "success", "product": "human_editor_credit", "credits_added": 1}
    elif product_type == "premium_monthly":
        await db.users.update_one({"user_id": user.user_id}, {"$set": {"is_premium": True}})
        return {"status": "success", "product": "premium_monthly", "premium_activated": True}
    else:
        raise HTTPException(status_code=400, detail="Unknown product type")

@api_router.post("/webhooks/paypal")
async def paypal_webhook(request: Request):
    payload = await request.body()
    try:
        data = json.loads(payload)
        event_type = data.get("event_type", "")
        resource = data.get("resource", {})
        
        logger.info(f"PayPal webhook received: {event_type}")
        
        if event_type == "BILLING.SUBSCRIPTION.ACTIVATED":
            custom_id = resource.get("custom_id", "")
            if custom_id.startswith("user_"):
                await db.users.update_one({"user_id": custom_id}, {"$set": {"is_premium": True}})
                logger.info(f"Premium activated via PayPal subscription for {custom_id}")
                
        elif event_type == "BILLING.SUBSCRIPTION.CANCELLED":
            custom_id = resource.get("custom_id", "")
            if custom_id.startswith("user_"):
                await db.users.update_one({"user_id": custom_id}, {"$set": {"is_premium": False}})
                logger.info(f"Premium cancelled via PayPal subscription for {custom_id}")
                
    except Exception as e:
        logger.error(f"PayPal webhook error: {e}")
    
    return {"status": "ok"}

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