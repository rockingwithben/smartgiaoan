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
import random
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Any, Dict, List
from datetime import datetime, timezone, timedelta
import google.generativeai as genai
from google.api_core.exceptions import NotFound, InvalidArgument

# ============================================================
# INITIALIZATION & CONFIG
# ============================================================
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

ADMIN_EMAILS = set(e.strip().lower() for e in os.environ.get('ADMIN_EMAILS', 'bentaylors@hotmail.co.uk').split(',') if e.strip())

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
# TIER CONFIGURATION
# ── STABLE model aliases — no date suffix, never expire ──────
#
#   gemini-2.5-flash-lite  →  cheapest/fastest  (Free)
#   gemini-2.5-flash       →  balanced          (Basic)
#   gemini-2.5-pro         →  highest quality   (Premium)
#
# ── Why the old names broke ──────────────────────────────────
#   "gemini-2.5-*-preview-06-17" never existed on Google's API.
#   Preview date-suffixes are controlled by Google (e.g. -06-05).
#   Stable aliases are guaranteed not to 404.
# ============================================================
GEMINI_MODEL_FREE    = "gemini-2.5-flash-lite"
GEMINI_MODEL_BASIC   = "gemini-2.5-flash"
GEMINI_MODEL_PREMIUM = "gemini-2.5-pro"

# Fallback chain: if primary 404s, each model is tried in order.
# This means a future Google deprecation can never fully kill the app.
_GEMINI_FALLBACKS = {
    GEMINI_MODEL_FREE:    ["gemini-2.5-flash", "gemini-2.5-pro"],
    GEMINI_MODEL_BASIC:   ["gemini-2.5-pro", "gemini-2.5-flash-lite"],
    GEMINI_MODEL_PREMIUM: ["gemini-2.5-flash", "gemini-2.5-flash-lite"],
}

TIER_CONFIG = {
    "free": {
        "model": GEMINI_MODEL_FREE,
        "monthly_quota": 999999,
        "ai_edits_per_month": 0,
        "has_word_editor": True,
        "has_ai_editor": False,
        "has_ads": True,
        "ad_frequency_base": 0.3,
    },
    "basic": {
        "model": GEMINI_MODEL_BASIC,
        "monthly_quota": 50,
        "ai_edits_per_month": 0,
        "has_word_editor": True,
        "has_ai_editor": False,
        "has_ads": False,
    },
    "premium": {
        "model": GEMINI_MODEL_PREMIUM,
        "monthly_quota": 999999,
        "ai_edits_per_month": 50,
        "has_word_editor": True,
        "has_ai_editor": True,
        "has_ads": False,
    }
}

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
app = FastAPI(title="SmartGiaoAn API", version="3.2.2", lifespan=lifespan)
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
    subscription_tier: str = "free"
    is_premium: bool = False
    free_used: int = 0
    bonus_credits: int = 0
    ai_edit_credits: int = 0
    monthly_reset_at: Optional[datetime] = None
    paypal_subscription_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WorksheetRequest(BaseModel):
    level: str
    cefr: str
    skill: str
    topic: str
    num_questions: int = 24
    grammar_focus: Optional[str] = None

class LessonPlanRequest(BaseModel):
    level: str
    cefr: str
    topic: str
    duration_weeks: int = 4
    lessons_per_week: int = 4

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
    reward_type: str = "worksheet"

class AIEditRequest(BaseModel):
    worksheet_id: str
    command: str

class UpdateWorksheetRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[dict] = None
    is_public: Optional[bool] = None

class PayPalCaptureRequest(BaseModel):
    order_id: str
    product_type: str

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

async def _load_user(doc: dict) -> Optional[User]:
    if not doc:
        return None
    if "subscription_tier" not in doc:
        doc["subscription_tier"] = "premium" if doc.get("is_premium") else "free"
    if "ai_edit_credits" not in doc:
        doc["ai_edit_credits"] = 0
    return User(**doc)

async def refresh_user_credits(user: User) -> User:
    if user.subscription_tier in ("basic", "premium"):
        now = _now()
        reset_at = user.monthly_reset_at
        needs_reset = False
        if not reset_at:
            needs_reset = True
        else:
            try:
                if _parse_dt(reset_at) < now:
                    needs_reset = True
            except Exception:
                needs_reset = True
        
        if needs_reset:
            config = TIER_CONFIG[user.subscription_tier]
            await db.users.update_one(
                {"user_id": user.user_id},
                {"$set": {
                    "ai_edit_credits": config["ai_edits_per_month"],
                    "monthly_reset_at": (now + timedelta(days=30)).isoformat(),
                    "free_used": 0
                }}
            )
            user.ai_edit_credits = config["ai_edits_per_month"]
            user.free_used = 0
            user.monthly_reset_at = now + timedelta(days=30)
    return user

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
    return await _load_user(doc)

async def require_user(user: Optional[User] = Depends(get_current_user_optional)) -> User:
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated or session expired")
    return user

def require_tier(min_tier: str):
    tier_order = {"free": 0, "basic": 1, "premium": 2}
    async def _require_tier(user: User = Depends(require_user)) -> User:
        user = await refresh_user_credits(user)
        if tier_order.get(user.subscription_tier, 0) < tier_order.get(min_tier, 0):
            raise HTTPException(status_code=402, detail=f"{min_tier.capitalize()} subscription required.")
        return user
    return _require_tier

# ============================================================
# PAYPAL HELPERS
# ============================================================
async def _paypal_access_token() -> str:
    if not PAYPAL_CLIENT_ID or not PAYPAL_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="PayPal credentials not configured")
    async with httpx.AsyncClient(timeout=15.0) as client:
        auth_str = base64.b64encode(f"{PAYPAL_CLIENT_ID}:{PAYPAL_CLIENT_SECRET}".encode()).decode()
        r = await client.post(
            f"{PAYPAL_BASE_URL}/v1/oauth2/token",
            headers={"Authorization": f"Basic {auth_str}"},
            data={"grant_type": "client_credentials"}
        )
        r.raise_for_status()
        return r.json()["access_token"]

async def verify_paypal_order(order_id: str) -> dict:
    token = await _paypal_access_token()
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(
            f"{PAYPAL_BASE_URL}/v2/checkout/orders/{order_id}",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        )
        r.raise_for_status()
        return r.json()

async def verify_paypal_subscription(subscription_id: str) -> dict:
    token = await _paypal_access_token()
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(
            f"{PAYPAL_BASE_URL}/v1/billing/subscriptions/{subscription_id}",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        )
        r.raise_for_status()
        return r.json()

# ============================================================
# GEMINI ENGINE
# ── Single genai.configure() call ────────────────────────────
# ── _run_gemini() retries with fallback models on 404 ────────
# ============================================================
adc_json_raw = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS_JSON', '').strip()
api_key = os.environ.get('GEMINI_API_KEY', '').strip()

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
        logger.info(f"AI Engine: Enterprise ADC (project: {project_id}).")
    except Exception as e:
        logger.error(f"ADC failed: {e}")
        if api_key:
            genai.configure(api_key=api_key)
            logger.info("AI Engine: Fallback to API key.")
elif api_key:
    genai.configure(api_key=api_key)
    logger.info("AI Engine: Using API key.")
else:
    logger.warning("CRITICAL: NO GOOGLE CREDENTIALS CONFIGURED — AI will fail.")

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

async def _run_gemini(prompt: str, level: str, model_name: str) -> dict:
    """
    Run a Gemini generation with:
      1. Up to 3 retries for transient errors (timeout, empty response, bad JSON).
      2. Automatic fallback to next model in chain on 404 / model-not-found.

    The fallback chain means a Google deprecation can never fully kill the app.
    """
    dynamic_instruction = build_system_prompt(level)

    # Build the full model chain: primary first, then fallbacks
    model_chain = [model_name] + _GEMINI_FALLBACKS.get(model_name, ["gemini-2.5-flash", "gemini-2.0-flash"])
    # Deduplicate while preserving order
    seen = set()
    model_chain = [m for m in model_chain if not (m in seen or seen.add(m))]

    for current_model in model_chain:
        logger.info(f"[Gemini] Attempting model: {current_model}")

        try:
            model = genai.GenerativeModel(
                model_name=current_model,
                system_instruction=dynamic_instruction,
                generation_config={"response_mime_type": "application/json", "temperature": 0.8},
            )
        except Exception as e:
            logger.warning(f"[Gemini] Could not instantiate '{current_model}': {e} — skipping.")
            continue

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
                    last_error = f"Content blocked. Reason: {block_reason}"
                    logger.warning(last_error)
                    await asyncio.sleep(1)
                    continue

                raw_text = result.text.strip()
                if not raw_text:
                    last_error = "Empty response from AI"
                    logger.warning(last_error)
                    await asyncio.sleep(1)
                    continue

                # Strip accidental markdown fences
                raw_text = re.sub(r'^```(?:json)?\s*', '', raw_text, flags=re.IGNORECASE)
                raw_text = re.sub(r'\s*```$', '', raw_text)
                raw_text = raw_text.strip()

                parsed = json.loads(raw_text)
                if current_model != model_name:
                    logger.warning(f"[Gemini] Used fallback model '{current_model}' (primary '{model_name}' was unavailable).")
                return parsed

            except asyncio.TimeoutError:
                last_error = "AI generation timed out"
                logger.error(f"[Gemini] {last_error} (model={current_model}, attempt={attempt+1})")

            except json.JSONDecodeError as je:
                last_error = f"JSON parse error: {je}"
                logger.error(f"[Gemini] {last_error} (model={current_model}, attempt={attempt+1})")

            except (NotFound, InvalidArgument) as e:
                # Model doesn't exist on this API key/project — break inner loop,
                # move to next model in chain immediately (no point retrying).
                last_error = f"Model not found: {e}"
                logger.warning(f"[Gemini] {last_error} — trying next fallback.")
                break  # <-- exits the retry loop, continues outer model_chain loop

            except Exception as e:
                last_error = f"Google API Error: {str(e)}"
                logger.error(f"[Gemini] {last_error} (model={current_model}, attempt={attempt+1})")

            await asyncio.sleep(1)

        else:
            # All 3 attempts exhausted without hitting a 404 — move to next model
            logger.warning(f"[Gemini] All retries failed for '{current_model}': {last_error}")
            continue

    # Every model in the chain failed
    raise HTTPException(
        status_code=500,
        detail=f"AI Engine failed: all models exhausted. Last error: {last_error}"
    )

# ============================================================
# API ROUTES
# ============================================================

# --- AUTHENTICATION ---
@api_router.post("/auth/register")
async def auth_register(payload: EmailAuthRequest, response: Response):
    email = payload.email.strip().lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    is_admin = email in ADMIN_EMAILS
    doc = {
        "user_id": user_id, "email": email,
        "name": payload.name or email.split("@")[0],
        "role": payload.role or "Teacher",
        "password_hash": hash_password(payload.password),
        "is_premium": is_admin,
        "subscription_tier": "premium" if is_admin else "free",
        "free_used": 0, "bonus_credits": 0, "ai_edit_credits": 0,
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
    is_admin = email in ADMIN_EMAILS
    if not doc:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        doc = {
            "user_id": user_id, "email": email,
            "name": eu.get("name", email.split("@")[0]),
            "picture": eu.get("picture", ""),
            "role": "Teacher",
            "is_premium": is_admin,
            "subscription_tier": "premium" if is_admin else "free",
            "free_used": 0, "bonus_credits": 0, "ai_edit_credits": 0,
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
    user = await refresh_user_credits(user)
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
    user = await refresh_user_credits(user)
    config = TIER_CONFIG.get(user.subscription_tier, TIER_CONFIG["free"])
    
    if user.subscription_tier != "free":
        total_allowed = config["monthly_quota"] + user.bonus_credits
        if user.free_used >= total_allowed:
            raise HTTPException(status_code=402, detail="Monthly quota reached. Upgrade for more.")
    
    should_show_ad = False
    ad_duration = 0
    if user.subscription_tier == "free" and user.free_used > 0:
        base_freq = config.get("ad_frequency_base", 0.3)
        usage_factor = min(user.free_used / 10, 1.0)
        ad_probability = base_freq + (usage_factor * 0.4)
        should_show_ad = random.random() < ad_probability
        if should_show_ad:
            ad_duration = random.choice([15, 30, 60])
    
    prompt = f"""
    Design a {payload.skill} worksheet for {payload.level} (CEFR {payload.cefr}) students.
    Topic: '{payload.topic}'. Length: {payload.num_questions} items.
    Grammar focus: {payload.grammar_focus or 'None'}.
    You MUST return the content using structured keys appropriate for an ESL worksheet.
    """
    
    ws_data = await _run_gemini(prompt, payload.level, model_name=config["model"])

    ws_id = f"ws_{uuid.uuid4().hex[:12]}"
    ws_doc = {
        "worksheet_id": ws_id, "user_id": user.user_id,
        "title": f"{payload.topic} - {payload.skill}",
        "level": payload.level, "cefr": payload.cefr, "skill": payload.skill,
        "topic": payload.topic,
        "content": ws_data, "is_public": True, "created_at": _now().isoformat()
    }
    await db.worksheets.insert_one(ws_doc)
    await db.users.update_one({"user_id": user.user_id}, {"$inc": {"free_used": 1}})
    
    result = {k: v for k, v in ws_doc.items() if k != "_id"}
    if should_show_ad:
        result["show_ad"] = True
        result["ad_duration"] = ad_duration
    return result

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

@api_router.patch("/worksheets/{worksheet_id}")
async def update_worksheet(worksheet_id: str, payload: UpdateWorksheetRequest, user: User = Depends(require_user)):
    ws = await db.worksheets.find_one({"worksheet_id": worksheet_id, "user_id": user.user_id})
    if not ws:
        raise HTTPException(status_code=404, detail="Worksheet not found")
    updates = {}
    if payload.title is not None:
        updates["title"] = payload.title
    if payload.content is not None:
        updates["content"] = payload.content
    if payload.is_public is not None:
        updates["is_public"] = payload.is_public
    if updates:
        updates["updated_at"] = _now().isoformat()
        await db.worksheets.update_one({"worksheet_id": worksheet_id}, {"$set": updates})
    return {"status": "updated"}

# --- AI EDITOR (PREMIUM ONLY) ---
@api_router.post("/worksheets/ai-edit")
async def ai_edit_worksheet(payload: AIEditRequest, user: User = Depends(require_tier("premium"))):
    user = await refresh_user_credits(user)
    if user.ai_edit_credits < 1:
        raise HTTPException(status_code=402, detail="No AI edit credits. Buy more or watch an ad.")
    
    ws = await db.worksheets.find_one({"worksheet_id": payload.worksheet_id, "user_id": user.user_id})
    if not ws:
        raise HTTPException(status_code=404, detail="Worksheet not found")
    
    current_content = json.dumps(ws["content"], indent=2)
    edit_prompt = f"""You are editing an ESL worksheet. Current content:
{current_content}

TEACHER'S REQUEST: {payload.command}

Rules:
- Return FULL updated worksheet as valid JSON.
- Preserve existing structure.
- Only modify what was requested.
- OUTPUT MUST BE RAW JSON ONLY."""
    
    edited_content = await _run_gemini(edit_prompt, ws["level"], model_name=GEMINI_MODEL_PREMIUM)
    
    await db.users.update_one({"user_id": user.user_id}, {"$inc": {"ai_edit_credits": -1}})
    
    new_ws_id = f"ws_{uuid.uuid4().hex[:12]}"
    new_doc = {
        "worksheet_id": new_ws_id,
        "user_id": user.user_id,
        "title": f"{ws['title']} (AI Edited)",
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

# --- SMART LESSON PLANNER (PREMIUM ONLY) ---
@api_router.post("/lesson-plans/generate")
async def generate_lesson_plan(payload: LessonPlanRequest, user: User = Depends(require_tier("premium"))):
    user = await refresh_user_credits(user)
    config = TIER_CONFIG["premium"]
    
    total_cost = payload.duration_weeks * payload.lessons_per_week
    if user.free_used + total_cost > config["monthly_quota"] + user.bonus_credits:
        raise HTTPException(status_code=402, detail=f"Need {total_cost} worksheet credits. Upgrade or generate fewer weeks.")
    
    prompt = f"""You are a senior Cambridge ESOL curriculum designer creating a complete unit plan for Vietnamese learners.

Create a {payload.duration_weeks}-week unit plan for {payload.level} (CEFR {payload.cefr}) students.
Topic: '{payload.topic}'
Lessons per week: {payload.lessons_per_week}

For EACH lesson, provide:
- lesson_title
- lesson_type (vocabulary/grammar/reading/writing/listening/speaking/assessment/project)
- duration_minutes
- learning_objectives (array)
- worksheet_content (full structured JSON for the worksheet)
- homework_task
- materials_needed

Also include:
- unit_title
- unit_overview
- assessment_criteria
- suggested_extensions_for_advanced_learners
- suggested_support_for_weak_learners

Rules:
- Use Vietnamese names: Minh, Lan, Huy, Thao, Nam, Linh, Duc, Mai.
- Use Vietnamese locations and culture.
- OUTPUT MUST BE RAW, VALID JSON ONLY.
- Structure: {{"unit_title": "...", "weeks": [{{"week_number": 1, "lessons": [...]}}]}}"""
    
    plan_data = await _run_gemini(prompt, payload.level, model_name=GEMINI_MODEL_PREMIUM)
    
    plan_id = f"lp_{uuid.uuid4().hex[:12]}"
    plan_doc = {
        "plan_id": plan_id,
        "user_id": user.user_id,
        "unit_title": plan_data.get("unit_title", f"{payload.topic} Unit"),
        "level": payload.level,
        "cefr": payload.cefr,
        "topic": payload.topic,
        "duration_weeks": payload.duration_weeks,
        "content": plan_data,
        "created_at": _now().isoformat()
    }
    await db.lesson_plans.insert_one(plan_doc)
    
    worksheet_count = 0
    if "weeks" in plan_data:
        for week in plan_data["weeks"]:
            for lesson in week.get("lessons", []):
                if "worksheet_content" in lesson:
                    ws_id = f"ws_{uuid.uuid4().hex[:12]}"
                    ws_doc = {
                        "worksheet_id": ws_id,
                        "user_id": user.user_id,
                        "title": lesson.get("lesson_title", "Untitled"),
                        "level": payload.level,
                        "cefr": payload.cefr,
                        "skill": lesson.get("lesson_type", "Mixed"),
                        "topic": payload.topic,
                        "content": lesson["worksheet_content"],
                        "is_public": False,
                        "parent_plan": plan_id,
                        "created_at": _now().isoformat()
                    }
                    await db.worksheets.insert_one(ws_doc)
                    worksheet_count += 1
    
    await db.users.update_one({"user_id": user.user_id}, {"$inc": {"free_used": total_cost}})
    
    return {
        "plan_id": plan_id,
        "unit_title": plan_doc["unit_title"],
        "worksheets_generated": worksheet_count,
        "total_lessons": total_cost,
        "content": plan_data
    }

@api_router.get("/lesson-plans")
async def list_lesson_plans(user: User = Depends(require_user)):
    return await db.lesson_plans.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)

@api_router.get("/lesson-plans/{plan_id}")
async def get_lesson_plan(plan_id: str, user: User = Depends(require_user)):
    plan = await db.lesson_plans.find_one({"plan_id": plan_id, "user_id": user.user_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    return plan

# --- REWARDED ADS ---
@api_router.post("/usage/grant-rewarded")
async def grant_ad_reward(payload: RewardedAdRequest, user: User = Depends(require_user)):
    reward_type = payload.reward_type
    if reward_type == "ai_edit":
        if user.subscription_tier != "premium":
            raise HTTPException(status_code=403, detail="AI edit rewards require Premium.")
        bonus = 1 if payload.tier <= 15 else 2 if payload.tier <= 30 else 3
        await db.users.update_one({"user_id": user.user_id}, {"$inc": {"ai_edit_credits": bonus}})
        return {"status": "reward_granted", "amount": bonus, "type": "ai_edit_credit"}
    else:
        bonus = 1 if payload.tier <= 15 else 2
        await db.users.update_one({"user_id": user.user_id}, {"$inc": {"bonus_credits": bonus}})
        return {"status": "reward_granted", "amount": bonus, "type": "worksheet_credit"}

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

# --- MONETIZATION & TIER MANAGEMENT ---
@api_router.get("/billing/tier")
async def get_tier(user: User = Depends(require_user)):
    user = await refresh_user_credits(user)
    config = TIER_CONFIG.get(user.subscription_tier, TIER_CONFIG["free"])
    return {
        "tier": user.subscription_tier,
        "is_premium": user.is_premium,
        "monthly_quota": config["monthly_quota"],
        "used_this_month": user.free_used,
        "remaining_this_month": max(0, config["monthly_quota"] + user.bonus_credits - user.free_used) if user.subscription_tier != "free" else "unlimited",
        "ai_edit_credits": user.ai_edit_credits,
        "has_word_editor": config["has_word_editor"],
        "has_ai_editor": config["has_ai_editor"],
        "has_ads": config["has_ads"],
        "model": config["model"],
        "reset_at": user.monthly_reset_at.isoformat() if user.monthly_reset_at else None
    }

@api_router.post("/billing/paypal-capture")
async def paypal_capture(payload: PayPalCaptureRequest, user: User = Depends(require_user)):
    product_type = payload.product_type
    now = _now()

    if product_type in ("basic_monthly", "premium_monthly"):
        try:
            sub_data = await verify_paypal_subscription(payload.order_id)
            status = sub_data.get("status", "")
            if status not in ("ACTIVE", "APPROVED"):
                raise HTTPException(status_code=400, detail=f"Subscription not active. Status: {status}")
        except Exception as e:
            logger.error(f"PayPal subscription verification failed: {e}")
            raise HTTPException(status_code=400, detail="PayPal verification failed")
        tier = "basic" if product_type == "basic_monthly" else "premium"
        await db.users.update_one(
            {"user_id": user.user_id},
            {"$set": {
                "subscription_tier": tier,
                "is_premium": True,
                "free_used": 0,
                "ai_edit_credits": TIER_CONFIG[tier]["ai_edits_per_month"],
                "monthly_reset_at": (now + timedelta(days=30)).isoformat(),
                "paypal_subscription_id": payload.order_id
            }}
        )
        return {"status": "success", "tier": tier}
    elif product_type == "ai_edit_pack":
        try:
            order_data = await verify_paypal_order(payload.order_id)
        except Exception as e:
            logger.error(f"PayPal order verification failed: {e}")
            raise HTTPException(status_code=400, detail="PayPal verification failed")
        status = order_data.get("status", "")
        if status not in ("COMPLETED", "APPROVED"):
            raise HTTPException(status_code=400, detail=f"PayPal order not completed. Status: {status}")
        await db.users.update_one({"user_id": user.user_id}, {"$inc": {"ai_edit_credits": 10}})
        return {"status": "success", "credits_added": 10}
    else:
        raise HTTPException(status_code=400, detail="Unknown product type")

@api_router.post("/billing/mark-basic")
async def mark_basic(user: User = Depends(require_user)):
    now = _now()
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {
            "subscription_tier": "basic",
            "is_premium": True,
            "free_used": 0,
            "ai_edit_credits": TIER_CONFIG["basic"]["ai_edits_per_month"],
            "monthly_reset_at": (now + timedelta(days=30)).isoformat()
        }}
    )
    return {"status": "basic_activated"}

@api_router.post("/billing/mark-premium")
async def mark_premium(user: User = Depends(require_user)):
    now = _now()
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {
            "subscription_tier": "premium",
            "is_premium": True,
            "free_used": 0,
            "ai_edit_credits": TIER_CONFIG["premium"]["ai_edits_per_month"],
            "monthly_reset_at": (now + timedelta(days=30)).isoformat()
        }}
    )
    return {"status": "premium_activated"}

@api_router.post("/billing/downgrade")
async def downgrade(user: User = Depends(require_user)):
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"subscription_tier": "free", "is_premium": False, "paypal_subscription_id": None, "ai_edit_credits": 0}}
    )
    return {"status": "downgraded_to_free"}

# --- PAYPAL WEBHOOKS ---
@api_router.post("/webhooks/paypal")
async def paypal_webhook(request: Request):
    payload = await request.body()
    try:
        data = json.loads(payload)
        event_type = data.get("event_type", "")
        resource = data.get("resource", {})
        logger.info(f"PayPal webhook received: {event_type}")
        
        if event_type in ("BILLING.SUBSCRIPTION.ACTIVATED", "BILLING.SUBSCRIPTION.PAYMENT.COMPLETED"):
            sub_id = resource.get("id", "")
            custom_id = resource.get("custom_id", "")
            if not custom_id and "subscriber" in resource:
                custom_id = resource["subscriber"].get("custom_id", "")
            if custom_id and custom_id.startswith("user_"):
                tier = "premium" if "premium" in (resource.get("plan_id", "") + custom_id).lower() else "basic"
                await db.users.update_one(
                    {"user_id": custom_id},
                    {"$set": {
                        "subscription_tier": tier,
                        "is_premium": True,
                        "free_used": 0,
                        "ai_edit_credits": TIER_CONFIG[tier]["ai_edits_per_month"],
                        "monthly_reset_at": (_now() + timedelta(days=30)).isoformat(),
                        "paypal_subscription_id": sub_id
                    }}
                )
                logger.info(f"PayPal webhook: {tier} activated for {custom_id}")
                
        elif event_type == "BILLING.SUBSCRIPTION.CANCELLED":
            sub_id = resource.get("id", "")
            custom_id = resource.get("custom_id", "")
            if not custom_id and "subscriber" in resource:
                custom_id = resource["subscriber"].get("custom_id", "")
            if custom_id and custom_id.startswith("user_"):
                await db.users.update_one(
                    {"user_id": custom_id},
                    {"$set": {"subscription_tier": "free", "is_premium": False, "paypal_subscription_id": None, "ai_edit_credits": 0}}
                )
                logger.info(f"PayPal webhook: cancelled for {custom_id}")
    except Exception as e:
        logger.error(f"PayPal webhook error: {e}")
    return {"status": "ok"}

# ============================================================
# MIDDLEWARE & ROUTING
# ============================================================
app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/")
async def root():
    return {"app": "SmartGiaoAn API", "status": "operational", "version": "3.2.2"}

@app.get("/health")
async def health():
    return {"status": "healthy", "db": "connected" if mongo_client else "disconnected"}