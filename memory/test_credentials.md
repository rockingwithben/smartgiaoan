# SmartGiaoAn — Test Credentials

## Auth
- Provider: Emergent-managed Google OAuth
- No password-based credentials (use any real Google account to sign in)
- After first login, user document is created with `user_id = user_<12hex>`
- Session cookie: `session_token` (httpOnly, secure, samesite=none, 7 days)

## Test User Seeding (for testing agent)
```
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  is_premium: false,
  free_used: 0,
  bonus_credits: 0,
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Premium Test User
Set `is_premium: true` on the user document to bypass quota.

## API Keys (already in /app/backend/.env)
- GEMINI_API_KEY: provided by user (BYOK), Gemini 2.5 Flash
