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
import io
from docx import Document
from docx.shared import Pt, Inches
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Any, Dict, List
from datetime import datetime, timezone, timedelta
from xml.sax.saxutils import escape as xml_escape
import google.generativeai as genai
from google.api_core.exceptions import NotFound, InvalidArgument, BadRequest as GoogleBadRequest

# ============================================================
# INITIALIZATION & CONFIG
# ============================================================
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

ADMIN_EMAILS = set(e.strip().lower() for e in os.environ.get('ADMIN_EMAILS', 'bentaylors@hotmail.co.uk').split(',') if e.strip())

PAYPAL_CLIENT_ID     = os.environ.get('PAYPAL_CLIENT_ID', '')
PAYPAL_CLIENT_SECRET = os.environ.get('PAYPAL_CLIENT_SECRET', '')
PAYPAL_BASE_URL      = os.environ.get('PAYPAL_BASE_URL', 'https://api-m.sandbox.paypal.com')

_cors_env = os.environ.get('CORS_ORIGINS', '')
CORS_ORIGINS = [o.strip() for o in _cors_env.split(',') if o.strip()] or [
    "https://smartgiaoan.site",
    "https://www.smartgiaoan.site",
    "http://localhost:3000",
]

# ============================================================
# MODEL CONFIGURATION — stable aliases, no date suffix
# ============================================================
GEMINI_MODEL_FREE    = "gemini-2.5-flash-lite"
GEMINI_MODEL_BASIC   = "gemini-2.5-flash"
GEMINI_MODEL_PREMIUM = "gemini-2.5-pro"

_GEMINI_FALLBACKS = {
    GEMINI_MODEL_FREE:    ["gemini-2.5-flash",  "gemini-2.0-flash"],
    GEMINI_MODEL_BASIC:   ["gemini-2.5-pro",    "gemini-2.0-flash"],
    GEMINI_MODEL_PREMIUM: ["gemini-2.5-flash",  "gemini-2.0-flash"],
}

TIER_CONFIG = {
    "free": {
        "model": GEMINI_MODEL_FREE,
        "lifetime_quota": 3,
        "ai_edits_per_month": 1,
        "has_word_editor": True,
        "has_ai_editor": False,
        "has_ads": True,
        "ad_frequency_base": 0.3,
    },
    "premium": {
        "model": GEMINI_MODEL_BASIC,
        "monthly_quota": 999999,
        "ai_edits_per_month": 999999,
        "has_word_editor": True,
        "has_ai_editor": False,
        "has_ads": False,
    },
    "pro": {
        "model": GEMINI_MODEL_PREMIUM,
        "monthly_quota": 999999,
        "ai_edits_per_month": 999999,
        "has_word_editor": True,
        "has_ai_editor": True,
        "has_ads": False,
    }
}

# ============================================================
# MONGODB
# ============================================================
mongo_url = os.environ.get('MONGO_URL', '')
db_name   = os.environ.get('DB_NAME', 'smartgiaoan')
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
app = FastAPI(title="SmartGiaoAn API", version="3.3.0", lifespan=lifespan)
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
# PYDANTIC MODELS
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
# AUTH HELPERS
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
    now = _now()
    needs_reset = False
    if not user.monthly_reset_at:
        needs_reset = True
    else:
        try:
            needs_reset = _parse_dt(user.monthly_reset_at) < now
        except Exception:
            needs_reset = True
            
    if needs_reset:
        config = TIER_CONFIG.get(user.subscription_tier, TIER_CONFIG["free"])
        
        updates = {
            "ai_edit_credits": config["ai_edits_per_month"],
            "monthly_reset_at": (now + timedelta(days=30)).isoformat()
        }
        
        # Only reset free_used for premium/pro, since free tier's quota is lifetime
        if user.subscription_tier != "free":
            updates["free_used"] = 0
            user.free_used = 0
            
        await db.users.update_one(
            {"user_id": user.user_id},
            {"$set": updates}
        )
        user.ai_edit_credits = config["ai_edits_per_month"]
        user.monthly_reset_at = now + timedelta(days=30)
        
    return user

async def _create_session(user_id: str, response: Response) -> str:
    token = str(uuid.uuid4())
    expires = _now() + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": token,
        "expires_at": expires.isoformat(), "created_at": _now().isoformat(),
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
    tier_order = {"free": 0, "premium": 1, "pro": 2}
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
# GEMINI ENGINE — REGIONAL ROUTING FIX
#
# WHY YOU SEE "400 User location is not supported":
#   Render's Singapore servers are geo-blocked by the standard
#   google-generativeai SDK endpoint (generativelanguage.googleapis.com).
#   This error is non-retriable — switching models won't help because
#   EVERY model hits the same IP block.
#
# THE CODE FIX (Option A — recommended):
#   When GOOGLE_APPLICATION_CREDENTIALS_JSON is set, this server uses
#   the Vertex AI SDK with location="us-central1". This routes traffic
#   through us-central1-aiplatform.googleapis.com, bypassing the
#   geo-restriction entirely regardless of where Render hosts the server.
#
# THE INFRA FIX (Option B — also do this):
#   Render Dashboard → Your Service → Settings → Region
#   Change to: "Oregon (US West)" or "Ohio (US East)"
#   This fixes the API key path and is good practice regardless.
#
# Add this env var to Render:
#   GEMINI_REGION = us-central1
# ============================================================

GEMINI_REGION   = os.environ.get('GEMINI_REGION', 'us-central1')
USE_VERTEX_AI   = False
_vertex_project = None

adc_json_raw = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS_JSON', '').strip()
api_key      = os.environ.get('GEMINI_API_KEY', '').strip()

if adc_json_raw:
    try:
        creds_dict = json.loads(adc_json_raw)
        adc_path = '/tmp/gcp_adc.json'
        with open(adc_path, 'w') as f:
            json.dump(creds_dict, f)
        os.chmod(adc_path, 0o600)
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = adc_path

        import google.auth
        _gcp_creds, _vertex_project = google.auth.default()

        # ── KEY FIX: Vertex AI with explicit US region ────────────────────────
        # This routes ALL calls through us-central1-aiplatform.googleapis.com,
        # bypassing the Singapore geo-block on generativelanguage.googleapis.com
        import vertexai
        vertexai.init(project=_vertex_project, location=GEMINI_REGION)
        USE_VERTEX_AI = True
        logger.info(f"AI Engine: Vertex AI | project={_vertex_project} | region={GEMINI_REGION} | geo-block bypassed ✓")

    except Exception as e:
        logger.error(f"Vertex AI init failed: {e}")
        if api_key:
            genai.configure(api_key=api_key)
            logger.warning("AI Engine: API key fallback — change Render region to Oregon to avoid 400 location errors.")
        else:
            logger.error("CRITICAL: No usable Google credentials.")

elif api_key:
    genai.configure(api_key=api_key)
    logger.warning(
        "AI Engine: API key mode. "
        "If you see '400 User location not supported', go to "
        "Render Dashboard → Settings → Region → Oregon (US West)."
    )
else:
    logger.error("CRITICAL: NO GOOGLE CREDENTIALS — all AI calls will fail.")


def _is_location_error(exc: Exception) -> bool:
    msg = str(exc).lower()
    return "user location is not supported" in msg or ("failed_precondition" in msg and "location" in msg)


def _build_model(model_name: str, system_instruction: str):
    """
    Return the appropriate model instance.
    Vertex AI path routes through us-central1, bypassing geo-restrictions.
    """
    if USE_VERTEX_AI:
        from vertexai.generative_models import GenerativeModel as VertexModel, GenerationConfig
        return VertexModel(
            model_name,
            system_instruction=system_instruction,
            generation_config=GenerationConfig(
                response_mime_type="application/json",
                temperature=0.8,
            ),
        )
    return genai.GenerativeModel(
        model_name=model_name,
        system_instruction=system_instruction,
        generation_config={"response_mime_type": "application/json", "temperature": 0.8},
    )


def build_system_prompt(level: str) -> str:
    base = """You are a senior Cambridge ESOL examiner and ESL curriculum designer specialising in Vietnamese learners.

Rules:
- STRICTLY align to the CEFR level given.
- Use Vietnamese names: Minh, Lan, Huy, Thao, Nam, Linh, Duc, Mai.
- Use Vietnamese locations: Hanoi, Hoan Kiem, West Lake, Sapa, Da Lat.
- Include Vietnamese culture: Tet, banh mi, pho, ao dai, Mid-Autumn Festival.
- OUTPUT MUST BE RAW, VALID JSON ONLY. Do not use markdown code blocks.
"""
    if "Kindergarten" in level:
        base += "\n- KINDERGARTEN OVERRIDE: Prioritize large visual placeholders, alphabet tracing, and TPR game ideas. Extremely simple vocab only."
    elif "Primary" in level:
        base += "\n- PRIMARY OVERRIDE: Focus on vocab matching, gap-fills, and short stories about Vietnam. Spacious formatting."
    else:
        base += "\n- SECONDARY/IELTS OVERRIDE: Rigorous academic content, complex reading comprehension, and full answer keys."
        
    base += "\n- IF SKILL IS LISTENING: You MUST include a 'listening_script' field in the JSON with the text of the audio track."
    return base


async def _run_gemini(prompt: str, level: str, model_name: str) -> dict:
    """
    Run Gemini with:
      1. Vertex AI regional routing (bypasses geo-block when ADC is configured)
      2. Fail-fast on location errors — no pointless retries across models
      3. Fallback model chain for model-not-found / quota errors
      4. Up to 3 retries per model for timeout / empty / JSON errors
    """
    system_instruction = build_system_prompt(level)

    seen: set = set()
    model_chain = [
        m for m in ([model_name] + _GEMINI_FALLBACKS.get(model_name, ["gemini-2.5-flash", "gemini-2.0-flash"]))
        if not (m in seen or seen.add(m))
    ]

    last_error = "Unknown error"

    for current_model in model_chain:
        logger.info(
            f"[Gemini] model={current_model} | "
            f"engine={'vertex/' + GEMINI_REGION if USE_VERTEX_AI else 'genai/api-key'}"
        )

        try:
            model = _build_model(current_model, system_instruction)
        except Exception as e:
            last_error = f"Model build failed: {e}"
            logger.warning(f"[Gemini] {last_error} — skipping '{current_model}'")
            continue

        for attempt in range(3):
            try:
                result = await asyncio.wait_for(
                    asyncio.to_thread(model.generate_content, prompt),
                    timeout=90.0
                )

                if not result.candidates:
                    feedback = getattr(result, 'prompt_feedback', None)
                    block_reason = getattr(feedback, 'block_reason', 'Unknown') if feedback else 'Unknown'
                    last_error = f"Content blocked: {block_reason}"
                    logger.warning(f"[Gemini] {last_error}")
                    await asyncio.sleep(1)
                    continue

                raw = result.text.strip()
                if not raw:
                    last_error = "Empty response"
                    logger.warning(f"[Gemini] {last_error} (attempt {attempt+1})")
                    await asyncio.sleep(1)
                    continue

                raw = re.sub(r'^```(?:json)?\s*', '', raw, flags=re.IGNORECASE)
                raw = re.sub(r'\s*```$', '', raw).strip()
                parsed = json.loads(raw)

                if current_model != model_name:
                    logger.warning(f"[Gemini] Used fallback '{current_model}' (primary '{model_name}' was unavailable)")
                return parsed

            # ── Geo-restriction: FAIL FAST — retrying with other models won't help ──
            except GoogleBadRequest as e:
                if _is_location_error(e):
                    raise HTTPException(status_code=503, detail=(
                        "AI Engine: Google blocked this server's location (400 FAILED_PRECONDITION). "
                        "IMMEDIATE FIX: Render Dashboard → Settings → Region → 'Oregon (US West)'. "
                        "PERMANENT FIX: Add GOOGLE_APPLICATION_CREDENTIALS_JSON env var to use Vertex AI routing."
                    ))
                last_error = f"Bad request: {e}"
                logger.error(f"[Gemini] {last_error} (attempt {attempt+1})")

            # ── Any exception with location message — same fail-fast ──────────────
            except Exception as e:
                if _is_location_error(e):
                    raise HTTPException(status_code=503, detail=(
                        "AI Engine: Google blocked this server's location (400 FAILED_PRECONDITION). "
                        "IMMEDIATE FIX: Render Dashboard → Settings → Region → 'Oregon (US West)'. "
                        "PERMANENT FIX: Add GOOGLE_APPLICATION_CREDENTIALS_JSON env var to use Vertex AI routing."
                    ))
                # ── Model not found → break inner, try next model ─────────────────
                if isinstance(e, (NotFound, InvalidArgument)):
                    last_error = f"Model not found: {e}"
                    logger.warning(f"[Gemini] {last_error} — trying fallback")
                    break
                # ── Timeout ───────────────────────────────────────────────────────
                if isinstance(e, asyncio.TimeoutError):
                    last_error = "Timed out after 90s"
                    logger.error(f"[Gemini] {last_error} (attempt {attempt+1})")
                elif isinstance(e, json.JSONDecodeError):
                    last_error = f"JSON parse error: {e}"
                    logger.error(f"[Gemini] {last_error} (attempt {attempt+1})")
                else:
                    last_error = f"API error: {e}"
                    logger.error(f"[Gemini] {last_error} (attempt {attempt+1})")

            await asyncio.sleep(1)

    raise HTTPException(
        status_code=500,
        detail=f"AI Engine failed: all models exhausted. Last error: {last_error}"
    )

# ============================================================
# API ROUTES — AUTH
# ============================================================
@api_router.post("/auth/register")
async def auth_register(payload: EmailAuthRequest, response: Response):
    email = payload.email.strip().lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id  = f"user_{uuid.uuid4().hex[:12]}"
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
    return {"user": {k: v for k, v in doc.items() if k not in ["_id", "password_hash"]}, "session_token": token}

@api_router.post("/auth/login")
async def auth_login(payload: EmailAuthRequest, response: Response):
    email = payload.email.strip().lower()
    doc   = await db.users.find_one({"email": email})
    if not doc or not doc.get("password_hash") or not verify_password(payload.password, doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = await _create_session(doc["user_id"], response)
    return {"user": {k: v for k, v in doc.items() if k not in ["_id", "password_hash"]}, "session_token": token}

@api_router.post("/auth/session")
async def auth_session_exchange(payload: SessionExchangeRequest, response: Response):
    sid = payload.session_id.strip()
    if not sid:
        raise HTTPException(status_code=400, detail="Missing session ID")
    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True, trust_env=False) as hx:
            r = await hx.get(
                f"https://auth.emergentagent.com/api/session/{sid}",
                headers={"Accept": "application/json", "User-Agent": "SmartGiaoAn-Backend/1.0"}
            )
            if r.status_code == 404:
                raise HTTPException(status_code=401, detail="Google Session ID already consumed. Try clicking Google Login again.")
            r.raise_for_status()
            eu = r.json()
    except HTTPException:
        raise
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=401, detail=f"Auth Broker Error {e.response.status_code}: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auth server connection failed: {e}")

    email    = eu.get("email", "").strip().lower()
    doc      = await db.users.find_one({"email": email})
    is_admin = email in ADMIN_EMAILS
    if not doc:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        doc = {
            "user_id": user_id, "email": email,
            "name": eu.get("name", email.split("@")[0]),
            "picture": eu.get("picture", ""), "role": "Teacher",
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
    return {"user": {k: v for k, v in doc.items() if k not in ["_id", "password_hash"]}, "session_token": token}

@api_router.get("/auth/me")
async def auth_me(user: User = Depends(require_user)):
    return (await refresh_user_credits(user)).model_dump()

@api_router.post("/auth/logout")
async def auth_logout(response: Response, request: Request):
    token = request.cookies.get("session_token")
    auth  = request.headers.get("Authorization", "")
    if auth.lower().startswith("bearer "):
        token = auth.split(" ")[1]
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

# ============================================================
# API ROUTES — WORKSHEETS
# ============================================================
@api_router.post("/worksheets/generate")
async def generate_ws(payload: WorksheetRequest, user: User = Depends(require_user)):
    user   = await refresh_user_credits(user)
    config = TIER_CONFIG.get(user.subscription_tier, TIER_CONFIG["free"])

    if user.subscription_tier == "free":
        if user.free_used >= config["lifetime_quota"] + user.bonus_credits:
            raise HTTPException(status_code=402, detail="Free quota reached. Upgrade to Premium for unlimited worksheets.")
    else:
        if user.free_used >= config["monthly_quota"] + user.bonus_credits:
            raise HTTPException(status_code=402, detail="Monthly quota reached. Upgrade for more.")

    should_show_ad = False
    ad_duration    = 0
    if user.subscription_tier == "free" and user.free_used > 0:
        prob = config.get("ad_frequency_base", 0.3) + min(user.free_used / 10, 1.0) * 0.4
        should_show_ad = random.random() < prob
        if should_show_ad:
            ad_duration = random.choice([15, 30, 60])

    prompt = (
        f"Design a {payload.skill} worksheet for {payload.level} (CEFR {payload.cefr}) students. "
        f"Topic: '{payload.topic}'. Length: {payload.num_questions} items. "
        f"Grammar focus: {payload.grammar_focus or 'None'}. "
        f"Return structured JSON appropriate for an ESL worksheet."
    )

    ws_data = await _run_gemini(prompt, payload.level, model_name=config["model"])
    ws_id   = f"ws_{uuid.uuid4().hex[:12]}"
    ws_doc  = {
        "worksheet_id": ws_id, "user_id": user.user_id,
        "title": f"{payload.topic} - {payload.skill}",
        "level": payload.level, "cefr": payload.cefr,
        "skill": payload.skill, "topic": payload.topic,
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

@api_router.get("/worksheets/{worksheet_id}/export-docx")
async def export_worksheet_docx(worksheet_id: str, user: User = Depends(require_user)):
    ws = await db.worksheets.find_one({"worksheet_id": worksheet_id}, {"_id": 0})
    if not ws:
        raise HTTPException(status_code=404, detail="Worksheet not found")
    if ws.get("user_id") != user.user_id and not ws.get("is_public", False):
        raise HTTPException(status_code=403, detail="This worksheet is private")

    content = ws.get("content", {})
    title = content.get("title", ws.get("title", "Untitled Worksheet"))
    
    document = Document()
    
    style = document.styles['Normal']
    font = style.font
    font.name = 'Arial'
    font.size = Pt(11)
    
    heading = document.add_heading(title, 0)
    heading.alignment = 1
    
    if content.get("subtitle"):
        sub = document.add_paragraph(content["subtitle"])
        sub.alignment = 1
        
    document.add_paragraph("Name: ____________________\t\tDate: __________\t\tScore: _____/100")
    
    def add_question(doc, q, num):
        q_text = q if isinstance(q, str) else q.get("question", q.get("sentence", q.get("prompt", q.get("text", str(q)))))
        doc.add_paragraph(f"{num}. {q_text}")
        
        options = []
        if isinstance(q, dict):
            options = q.get("options", q.get("choices", []))
            
        if options:
            for opt_idx, opt in enumerate(options):
                opt_text = opt if isinstance(opt, str) else opt.get("text", opt.get("label", str(opt)))
                opt_label = opt.get("label", chr(65 + opt_idx)) if isinstance(opt, dict) and opt.get("label") else chr(65 + opt_idx)
                doc.add_paragraph(f"    ( ) {opt_label}. {opt_text}")
        else:
            doc.add_paragraph("\n    __________________________________________________\n")

    passage = content.get("reading_passage") or content.get("passage")
    if passage:
        document.add_heading("Reading Passage", level=1)
        if isinstance(passage, dict):
            if passage.get("title"):
                document.add_heading(passage["title"], level=2)
            document.add_paragraph(passage.get("text", ""))
        else:
            document.add_paragraph(str(passage))
            
    vocab = content.get("vocabulary")
    if vocab:
        document.add_heading("Vocabulary", level=1)
        glossary = vocab.get("glossary", [])
        for item in glossary:
            document.add_paragraph(f"{item.get('word', '')} — {item.get('definition', '')}")
        
        for ex_idx, ex in enumerate(vocab.get("exercises", [])):
            instructions = ex.get("instructions", ex.get("prompt", f"Exercise {ex_idx+1}"))
            document.add_heading(instructions, level=2)
            for i, q in enumerate(ex.get("items", ex.get("questions", []))):
                add_question(document, q, i+1)

    comp = content.get("comprehension")
    if comp and comp.get("exercises"):
        document.add_heading("Comprehension", level=1)
        for ex_idx, ex in enumerate(comp.get("exercises", [])):
            instructions = ex.get("instructions", ex.get("prompt", f"Exercise {ex_idx+1}"))
            document.add_heading(instructions, level=2)
            for i, q in enumerate(ex.get("items", ex.get("questions", []))):
                add_question(document, q, i+1)

    grammar = content.get("grammar")
    if grammar:
        focus = grammar.get('focus', '')
        document.add_heading(f"Grammar{': ' + focus if focus else ''}", level=1)
        if grammar.get("explanation"):
            document.add_paragraph(grammar["explanation"])
            
        for ex_idx, ex in enumerate(grammar.get("exercises", [])):
            instructions = ex.get("instructions", ex.get("prompt", f"Exercise {ex_idx+1}"))
            document.add_heading(instructions, level=2)
            for i, q in enumerate(ex.get("items", ex.get("questions", []))):
                add_question(document, q, i+1)
                
    exercises = content.get("exercises")
    if exercises:
        for ex_idx, ex in enumerate(exercises):
            instructions = ex.get("instructions", ex.get("prompt", f"Exercise {ex_idx+1}"))
            document.add_heading(instructions, level=1)
            for i, q in enumerate(ex.get("items", ex.get("questions", []))):
                add_question(document, q, i+1)

    sections = content.get("sections")
    if sections:
        for sec_idx, sec in enumerate(sections):
            stitle = sec.get("section_title", f"Section {sec_idx+1}")
            document.add_heading(stitle, level=1)
            if sec.get("instructions"):
                document.add_paragraph(sec["instructions"])
            for q in sec.get("questions", []):
                num = q.get("number", "?")
                add_question(document, q, num)
                
    writing = content.get("writing") or content.get("writing_task")
    if writing:
        document.add_heading("Writing Task", level=1)
        if isinstance(writing, dict):
            task = writing.get("task") or writing.get("prompt")
            if task:
                document.add_paragraph(task)
            document.add_paragraph("\n")
            for _ in range(8):
                document.add_paragraph("_________________________________________________________________________________________")

    file_stream = io.BytesIO()
    document.save(file_stream)
    file_stream.seek(0)
    
    headers = {
        'Content-Disposition': f'attachment; filename="{title}.docx"'
    }
    return Response(
        content=file_stream.read(),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers=headers
    )

@api_router.patch("/worksheets/{worksheet_id}")
async def update_worksheet(worksheet_id: str, payload: UpdateWorksheetRequest, user: User = Depends(require_user)):
    ws = await db.worksheets.find_one({"worksheet_id": worksheet_id, "user_id": user.user_id})
    if not ws:
        raise HTTPException(status_code=404, detail="Worksheet not found")
    updates = {k: v for k, v in {"title": payload.title, "content": payload.content, "is_public": payload.is_public}.items() if v is not None}
    if updates:
        updates["updated_at"] = _now().isoformat()
        await db.worksheets.update_one({"worksheet_id": worksheet_id}, {"$set": updates})
    return {"status": "updated"}

# ============================================================
# API ROUTES — AI EDITOR (PREMIUM)
# ============================================================
@api_router.post("/worksheets/ai-edit")
async def ai_edit_worksheet(payload: AIEditRequest, user: User = Depends(require_user)):
    user = await refresh_user_credits(user)
    if user.ai_edit_credits < 1:
        raise HTTPException(status_code=402, detail="No AI edit credits remaining. You get 1 free edit per month, or unlimited with Premium.")
    
    ws = await db.worksheets.find_one({"worksheet_id": payload.worksheet_id, "user_id": user.user_id})
    if not ws:
        raise HTTPException(status_code=404, detail="Worksheet not found")

    edit_prompt = (
        f"You are editing an ESL worksheet.\nCurrent content:\n{json.dumps(ws['content'], indent=2)}\n\n"
        f"TEACHER'S REQUEST: {payload.command}\n\n"
        "Rules:\n- Return FULL updated worksheet as valid JSON.\n"
        "- Preserve existing structure.\n- Only modify what was requested.\n- OUTPUT MUST BE RAW JSON ONLY."
    )

    # Use the appropriate model based on their tier
    config = TIER_CONFIG.get(user.subscription_tier, TIER_CONFIG["free"])
    edited = await _run_gemini(edit_prompt, ws["level"], model_name=config["model"])
    await db.users.update_one({"user_id": user.user_id}, {"$inc": {"ai_edit_credits": -1}})

    new_id  = f"ws_{uuid.uuid4().hex[:12]}"
    new_doc = {
        "worksheet_id": new_id, "user_id": user.user_id,
        "title": f"{ws['title']} (AI Edited)",
        "level": ws["level"], "cefr": ws["cefr"], "skill": ws["skill"],
        "topic": ws.get("topic", ""), "content": edited,
        "is_public": False, "parent_id": payload.worksheet_id,
        "edit_command": payload.command, "created_at": _now().isoformat()
    }
    await db.worksheets.insert_one(new_doc)
    return {k: v for k, v in new_doc.items() if k != "_id"}

# ============================================================
# API ROUTES — SMART LESSON PLANNER (PREMIUM)
# ============================================================
@api_router.post("/lesson-plans/generate")
async def generate_lesson_plan(payload: LessonPlanRequest, user: User = Depends(require_tier("premium"))):
    user       = await refresh_user_credits(user)
    config     = TIER_CONFIG["premium"]
    total_cost = payload.duration_weeks * payload.lessons_per_week

    if user.free_used + total_cost > config["monthly_quota"] + user.bonus_credits:
        raise HTTPException(status_code=402, detail=f"Need {total_cost} credits. Upgrade or reduce weeks.")

    prompt = (
        f"You are a senior Cambridge ESOL curriculum designer for Vietnamese learners.\n\n"
        f"Create a {payload.duration_weeks}-week unit plan for {payload.level} (CEFR {payload.cefr}) students.\n"
        f"Topic: '{payload.topic}'\nLessons per week: {payload.lessons_per_week}\n\n"
        "For EACH lesson provide: lesson_title, lesson_type, duration_minutes, "
        "learning_objectives (array), worksheet_content (full JSON), homework_task, materials_needed.\n\n"
        "Also include: unit_title, unit_overview, assessment_criteria, "
        "suggested_extensions_for_advanced_learners, suggested_support_for_weak_learners.\n\n"
        "Rules:\n- Vietnamese names: Minh, Lan, Huy, Thao, Nam, Linh, Duc, Mai.\n"
        "- Vietnamese locations and culture.\n- OUTPUT MUST BE RAW VALID JSON ONLY.\n"
        '- Structure: {"unit_title": "...", "weeks": [{"week_number": 1, "lessons": [...]}]}'
    )

    plan_data = await _run_gemini(prompt, payload.level, model_name=GEMINI_MODEL_PREMIUM)
    plan_id   = f"lp_{uuid.uuid4().hex[:12]}"
    plan_doc  = {
        "plan_id": plan_id, "user_id": user.user_id,
        "unit_title": plan_data.get("unit_title", f"{payload.topic} Unit"),
        "level": payload.level, "cefr": payload.cefr, "topic": payload.topic,
        "duration_weeks": payload.duration_weeks, "content": plan_data,
        "created_at": _now().isoformat()
    }
    await db.lesson_plans.insert_one(plan_doc)

    worksheet_count = 0
    for week in plan_data.get("weeks", []):
        for lesson in week.get("lessons", []):
            if "worksheet_content" in lesson:
                await db.worksheets.insert_one({
                    "worksheet_id": f"ws_{uuid.uuid4().hex[:12]}",
                    "user_id": user.user_id,
                    "title": lesson.get("lesson_title", "Untitled"),
                    "level": payload.level, "cefr": payload.cefr,
                    "skill": lesson.get("lesson_type", "Mixed"), "topic": payload.topic,
                    "content": lesson["worksheet_content"],
                    "is_public": False, "parent_plan": plan_id,
                    "created_at": _now().isoformat()
                })
                worksheet_count += 1

    await db.users.update_one({"user_id": user.user_id}, {"$inc": {"free_used": total_cost}})
    return {
        "plan_id": plan_id, "unit_title": plan_doc["unit_title"],
        "worksheets_generated": worksheet_count, "total_lessons": total_cost,
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

# ============================================================
# API ROUTES — REWARDED ADS
# ============================================================
@api_router.post("/usage/grant-rewarded")
async def grant_ad_reward(payload: RewardedAdRequest, user: User = Depends(require_user)):
    if payload.reward_type == "ai_edit":
        if user.subscription_tier != "premium":
            raise HTTPException(status_code=403, detail="AI edit rewards require Premium.")
        bonus = 1 if payload.tier <= 15 else 2 if payload.tier <= 30 else 3
        await db.users.update_one({"user_id": user.user_id}, {"$inc": {"ai_edit_credits": bonus}})
        return {"status": "reward_granted", "amount": bonus, "type": "ai_edit_credit"}
    bonus = 1 if payload.tier <= 15 else 2
    await db.users.update_one({"user_id": user.user_id}, {"$inc": {"bonus_credits": bonus}})
    return {"status": "reward_granted", "amount": bonus, "type": "worksheet_credit"}

# ============================================================
# API ROUTES — PUBLIC LIBRARY
# ============================================================
@api_router.get("/library/feed")
async def public_library_feed(
    response: Response,
    level: Optional[str] = None,
    skill: Optional[str] = None,
    search: Optional[str] = None
):
    response.headers["Cache-Control"] = "public, max-age=300, stale-while-revalidate=600"
    response.headers["X-Robots-Tag"] = "index, follow"
    query: dict = {"is_public": True}
    if level  and level  != "All": query["level"] = level
    if skill  and skill  != "All": query["skill"] = skill
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"topic": {"$regex": search, "$options": "i"}}
        ]
    pipeline = [
        {"$match": query}, {"$sort": {"created_at": -1}}, {"$limit": 100},
        {"$lookup": {"from": "users", "localField": "user_id", "foreignField": "user_id", "as": "author"}},
        {"$project": {
            "_id": 0, "worksheet_id": 1, "title": 1, "level": 1, "cefr": 1,
            "skill": 1, "topic": 1, "created_at": 1,
            "author_name": {"$ifNull": [{"$arrayElemAt": ["$author.name", 0]}, "Anonymous Teacher"]}
        }}
    ]
    return await db.worksheets.aggregate(pipeline).to_list(100)

@api_router.get("/library/feed.xml")
async def public_library_feed_xml(
    response: Response,
    level: Optional[str] = None,
    skill: Optional[str] = None,
    search: Optional[str] = None
):
    response.headers["Cache-Control"] = "public, max-age=300, stale-while-revalidate=600"
    response.headers["X-Robots-Tag"] = "index, follow"
    response.headers["Content-Type"] = "application/atom+xml; charset=utf-8"

    query: dict = {"is_public": True}
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

    worksheets = await db.worksheets.aggregate(pipeline).to_list(100)
    updated_at = worksheets[0]["created_at"] if worksheets else _now().isoformat()

    entries = []
    for ws in worksheets:
        ws_title = xml_escape(ws.get("title", "Untitled Worksheet"))
        ws_topic = ws.get("topic")
        topic_text = f" on {xml_escape(ws_topic)}" if ws_topic else ""
        summary = (
            f"ESL worksheet for {xml_escape(ws['level'])} "
            f"({xml_escape(ws['cefr'])}) — {xml_escape(ws['skill'])}{topic_text}."
        )
        url = f"https://www.smartgiaoan.site/worksheet/{xml_escape(ws['worksheet_id'])}"
        entries.append(
            "\n".join([
                "  <entry>",
                f"    <id>{url}</id>",
                f"    <title>{ws_title}</title>",
                f"    <link href=\"{url}\" />",
                f"    <updated>{xml_escape(ws['created_at'])}</updated>",
                f"    <summary>{summary}</summary>",
                f"    <author><name>{xml_escape(ws['author_name'])}</name></author>",
                "  </entry>"
            ])
        )

    feed = "\n".join([
        "<?xml version=\"1.0\" encoding=\"utf-8\"?>",
        "<feed xmlns=\"http://www.w3.org/2005/Atom\">",
        "  <title>SmartGiaoAn Public Library Feed</title>",
        "  <id>https://www.smartgiaoan.site/library</id>",
        "  <link href=\"https://www.smartgiaoan.site/library\" />",
        "  <link href=\"https://smartgiaoan.onrender.com/api/library/feed.xml\" rel=\"self\" />",
        f"  <updated>{xml_escape(updated_at)}</updated>",
        "  <subtitle>Public ESL worksheets generated by teachers across Vietnam.</subtitle>",
        *entries,
        "</feed>"
    ])

    return Response(content=feed, media_type="application/atom+xml")

@api_router.post("/library/{worksheet_id}/clone")
async def clone_worksheet(worksheet_id: str, user: User = Depends(require_user)):
    original = await db.worksheets.find_one({"worksheet_id": worksheet_id, "is_public": True})
    if not original:
        raise HTTPException(status_code=404, detail="Worksheet not found or not public")
    new_id  = f"ws_{uuid.uuid4().hex[:12]}"
    new_doc = {
        "worksheet_id": new_id, "user_id": user.user_id,
        "title": original["title"], "level": original["level"],
        "cefr": original["cefr"], "skill": original["skill"],
        "topic": original.get("topic", ""), "content": original["content"],
        "is_public": False, "created_at": _now().isoformat(), "cloned_from": worksheet_id
    }
    await db.worksheets.insert_one(new_doc)
    return {"worksheet_id": new_id, "status": "cloned"}

# ============================================================
# API ROUTES — BILLING
# ============================================================
@api_router.get("/billing/tier")
async def get_tier(user: User = Depends(require_user)):
    user   = await refresh_user_credits(user)
    config = TIER_CONFIG.get(user.subscription_tier, TIER_CONFIG["free"])
    return {
        "tier": user.subscription_tier,
        "is_premium": user.is_premium,
        "monthly_quota": config["monthly_quota"],
        "used_this_month": user.free_used,
        "remaining_this_month": (
            max(0, config["monthly_quota"] + user.bonus_credits - user.free_used)
            if user.subscription_tier != "free" else "unlimited"
        ),
        "ai_edit_credits": user.ai_edit_credits,
        "has_word_editor": config["has_word_editor"],
        "has_ai_editor":   config["has_ai_editor"],
        "has_ads":         config["has_ads"],
        "model":           config["model"],
        "ai_engine":       "vertex_ai" if USE_VERTEX_AI else "generative_ai",
        "ai_region":       GEMINI_REGION,
        "reset_at": user.monthly_reset_at.isoformat() if user.monthly_reset_at else None,
    }

@api_router.post("/billing/paypal-capture")
async def paypal_capture(payload: PayPalCaptureRequest, user: User = Depends(require_user)):
    now = _now()
    if payload.product_type in ("premium_monthly", "pro_monthly"):
        try:
            sub = await verify_paypal_subscription(payload.order_id)
            if sub.get("status") not in ("ACTIVE", "APPROVED"):
                raise HTTPException(status_code=400, detail=f"Subscription not active: {sub.get('status')}")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail="PayPal verification failed")
        tier = "premium" if payload.product_type == "premium_monthly" else "pro"
        await db.users.update_one({"user_id": user.user_id}, {"$set": {
            "subscription_tier": tier, "is_premium": True, "free_used": 0,
            "ai_edit_credits": TIER_CONFIG[tier]["ai_edits_per_month"],
            "monthly_reset_at": (now + timedelta(days=30)).isoformat(),
            "paypal_subscription_id": payload.order_id
        }})
        return {"status": "success", "tier": tier}
    elif payload.product_type == "ai_edit_pack":
        try:
            order = await verify_paypal_order(payload.order_id)
            if order.get("status") not in ("COMPLETED", "APPROVED"):
                raise HTTPException(status_code=400, detail=f"Order not completed: {order.get('status')}")
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=400, detail="PayPal verification failed")
        await db.users.update_one({"user_id": user.user_id}, {"$inc": {"ai_edit_credits": 10}})
        return {"status": "success", "credits_added": 10}
    raise HTTPException(status_code=400, detail="Unknown product type")

@api_router.post("/billing/mark-premium")
async def mark_premium(user: User = Depends(require_user)):
    await db.users.update_one({"user_id": user.user_id}, {"$set": {
        "subscription_tier": "premium", "is_premium": True, "free_used": 0,
        "ai_edit_credits": TIER_CONFIG["premium"]["ai_edits_per_month"],
        "monthly_reset_at": (_now() + timedelta(days=30)).isoformat()
    }})
    return {"status": "premium_activated"}

@api_router.post("/billing/mark-pro")
async def mark_pro(user: User = Depends(require_user)):
    await db.users.update_one({"user_id": user.user_id}, {"$set": {
        "subscription_tier": "pro", "is_premium": True, "free_used": 0,
        "ai_edit_credits": TIER_CONFIG["pro"]["ai_edits_per_month"],
        "monthly_reset_at": (_now() + timedelta(days=30)).isoformat()
    }})
    return {"status": "pro_activated"}

@api_router.post("/billing/downgrade")
async def downgrade(user: User = Depends(require_user)):
    await db.users.update_one({"user_id": user.user_id}, {"$set": {
        "subscription_tier": "free", "is_premium": False,
        "paypal_subscription_id": None, "ai_edit_credits": 0
    }})
    return {"status": "downgraded_to_free"}

# ============================================================
# API ROUTES — PAYPAL WEBHOOKS
# ============================================================
@api_router.post("/webhooks/paypal")
async def paypal_webhook(request: Request):
    try:
        data       = json.loads(await request.body())
        event_type = data.get("event_type", "")
        resource   = data.get("resource", {})
        logger.info(f"PayPal webhook: {event_type}")

        if event_type in ("BILLING.SUBSCRIPTION.ACTIVATED", "BILLING.SUBSCRIPTION.PAYMENT.COMPLETED"):
            sub_id    = resource.get("id", "")
            custom_id = resource.get("custom_id") or resource.get("subscriber", {}).get("custom_id", "")
            plan_id   = resource.get("plan_id", "")
            
            if custom_id and custom_id.startswith("user_"):
                tier = "premium"
                if plan_id == "P-40482060EU873762GNH7A6YI" or "pro" in custom_id.lower():
                    tier = "pro"
                
                await db.users.update_one({"user_id": custom_id}, {"$set": {
                    "subscription_tier": tier, "is_premium": True, "free_used": 0,
                    "ai_edit_credits": TIER_CONFIG[tier]["ai_edits_per_month"],
                    "monthly_reset_at": (_now() + timedelta(days=30)).isoformat(),
                    "paypal_subscription_id": sub_id
                }})

        elif event_type == "BILLING.SUBSCRIPTION.CANCELLED":
            custom_id = resource.get("custom_id") or resource.get("subscriber", {}).get("custom_id", "")
            if custom_id and custom_id.startswith("user_"):
                await db.users.update_one({"user_id": custom_id}, {"$set": {
                    "subscription_tier": "free", "is_premium": False,
                    "paypal_subscription_id": None, "ai_edit_credits": 0
                }})
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
    return {
        "app": "SmartGiaoAn API", "status": "operational", "version": "3.3.0",
        "ai_engine": "vertex_ai" if USE_VERTEX_AI else "generative_ai",
        "ai_region": GEMINI_REGION,
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "db": "connected" if mongo_client else "disconnected",
        "ai_engine": "vertex_ai" if USE_VERTEX_AI else "generative_ai",
        "ai_region": GEMINI_REGION,
    }