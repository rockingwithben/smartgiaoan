diff --git a/backend/server.py b/backend/server.py
index 3f37bee623d5655108bffe5b246720d84b1a3fc5..7f95c20b5fc68ac8500918a0a5f497a1a1450252 100644
--- a/backend/server.py
+++ b/backend/server.py
@@ -37,50 +37,51 @@ if GEMINI_API_KEY:
     genai.configure(api_key=GEMINI_API_KEY)
 else:
     logging.warning("GEMINI_API_KEY not set - worksheet generation will fail")
 
 # ========== CONFIG ==========
 ADMIN_EMAILS = set(
     e.strip().lower()
     for e in os.environ.get('ADMIN_EMAILS', 'bentaylors@hotmail.co.uk').split(',')
     if e.strip()
 )
 FREE_QUOTA = int(os.environ.get('FREE_QUOTA', '3'))
 
 # ============================================================
 # APP SETUP
 # CRITICAL ORDER for FastAPI:
 # 1. Create app
 # 2. Create router
 # 3. Define ALL routes on router
 # 4. app.include_router(api_router)  ← MUST happen BEFORE middleware
 # 5. app.add_middleware(CORSMiddleware, ...)
 # 
 # If you put middleware before include_router, CORS preflight
 # OPTIONS requests return 404 and Google Login breaks.
 # ============================================================
 app = FastAPI(title="SmartGiaoAn API", version="2.0.0")
+# STEP 1 - router defined FIRST
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
@@ -609,57 +610,57 @@ async def cancel_premium(user: User = Depends(require_user)):
 
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
-# STEP 4 - include router BEFORE middleware
-# THIS IS THE CRITICAL FIX FOR CORS / GOOGLE LOGIN
+# STEP 3 - include router BEFORE middleware
+# CRITICAL: This order makes CORS apply to all routes
 # ============================================================
 app.include_router(api_router)
 
 # ============================================================
-# STEP 5 - CORS middleware AFTER router include
+# STEP 4 - CORS middleware LAST
 # ============================================================
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
 
 # ============================================================
 # ROOT + HEALTH
 # ============================================================
 
 @app.get("/", include_in_schema=False)
 async def root():
     return {"app": "SmartGiaoAn", "status": "ok", "version": "2.0.0"}
 
 
 @app.get("/health", include_in_schema=False)
 async def health():
     try:
