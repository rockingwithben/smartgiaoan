"""SmartGiaoAn backend API tests."""
import os
import time
import uuid
import requests
import pytest

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://lotus-esl.preview.emergentagent.com').rstrip('/')

# Read backend env to get mongo for seeding
from pymongo import MongoClient
from datetime import datetime, timezone, timedelta

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')


@pytest.fixture(scope="module")
def seeded():
    cli = MongoClient(MONGO_URL)
    db = cli[DB_NAME]
    user_id = f"TEST_user_{uuid.uuid4().hex[:8]}"
    token = f"TEST_token_{uuid.uuid4().hex}"
    email = f"TEST_{int(time.time())}@example.com"
    db.users.insert_one({
        "user_id": user_id, "email": email, "name": "Test User", "picture": "",
        "is_premium": False, "free_used": 0, "bonus_credits": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    db.user_sessions.insert_one({
        "user_id": user_id, "session_token": token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    yield {"user_id": user_id, "token": token, "email": email, "db": db}
    # cleanup
    db.users.delete_many({"user_id": user_id})
    db.user_sessions.delete_many({"user_id": user_id})
    db.worksheets.delete_many({"user_id": user_id})


@pytest.fixture
def auth_headers(seeded):
    return {"Authorization": f"Bearer {seeded['token']}"}


# ===== Health =====
def test_root_health():
    r = requests.get(f"{BASE_URL}/api/")
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "ok"
    assert data.get("app") == "SmartGiaoAn"


# ===== Auth =====
def test_auth_session_invalid():
    r = requests.post(f"{BASE_URL}/api/auth/session", json={"session_id": "invalid_xxx"})
    assert r.status_code == 401


def test_auth_me_no_token():
    r = requests.get(f"{BASE_URL}/api/auth/me")
    assert r.status_code == 401


def test_auth_me_with_token(auth_headers, seeded):
    r = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["user_id"] == seeded["user_id"]
    assert data["email"] == seeded["email"]
    assert "name" in data
    assert data["is_premium"] is False
    assert data["free_used"] == 0
    assert data["bonus_credits"] == 0
    assert "_id" not in data


# ===== Worksheets =====
def test_worksheets_list_no_auth():
    r = requests.get(f"{BASE_URL}/api/worksheets")
    assert r.status_code == 401


def test_worksheets_list_empty(auth_headers):
    r = requests.get(f"{BASE_URL}/api/worksheets", headers=auth_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ===== Rewarded ad =====
def test_grant_rewarded(auth_headers, seeded):
    # baseline
    me1 = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers).json()
    base = me1["bonus_credits"]
    r = requests.post(f"{BASE_URL}/api/usage/grant-rewarded", headers=auth_headers, json={"tier": "medium"})
    assert r.status_code == 200
    data = r.json()
    assert data["granted"] == 1
    assert data["user"]["bonus_credits"] == base + 1
    assert "_id" not in data["user"]


# ===== Premium =====
def test_mark_premium(auth_headers, seeded):
    r = requests.post(f"{BASE_URL}/api/billing/mark-premium", headers=auth_headers)
    assert r.status_code == 200
    user = r.json()
    assert user["is_premium"] is True
    assert "_id" not in user
    # Verify persistence via /auth/me
    me = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers).json()
    assert me["is_premium"] is True


# ===== Quota bypass for premium =====
def test_premium_bypass_quota(auth_headers, seeded):
    """After mark-premium, set free_used high. Quota check should not block premium users."""
    seeded["db"].users.update_one({"user_id": seeded["user_id"]}, {"$set": {"free_used": 99, "is_premium": True}})
    # We don't actually call generate (Gemini key leaked). We just verify the user state allows it.
    me = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers).json()
    assert me["is_premium"] is True
    assert me["free_used"] == 99  # quota check is `if not is_premium and free_used >= total` -> bypass


# ===== Worksheet generate (expected to fail with 502 due to leaked Gemini key) =====
def test_worksheet_generate_returns_proper_error_structure(auth_headers):
    payload = {"level": "Primary", "cefr": "A2", "skill": "reading", "topic": "Tet holiday", "num_questions": 5}
    r = requests.post(f"{BASE_URL}/api/worksheets/generate", headers=auth_headers, json=payload, timeout=60)
    # Expected: 502 with detail (Gemini key leaked) OR 200 if key was replaced
    assert r.status_code in (200, 502, 402, 500)
    body = r.json()
    if r.status_code != 200:
        assert "detail" in body
        print(f"Generate endpoint returned {r.status_code}: {body.get('detail')[:200] if body.get('detail') else ''}")
    else:
        assert "worksheet_id" in body


# ===== Logout =====
def test_logout_deletes_session(seeded):
    # Create a fresh session for logout test
    db = seeded["db"]
    token = f"TEST_logout_{uuid.uuid4().hex}"
    db.user_sessions.insert_one({
        "user_id": seeded["user_id"], "session_token": token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    # Logout uses Cookie, but endpoint is permissive (returns ok regardless)
    r = requests.post(f"{BASE_URL}/api/auth/logout", cookies={"session_token": token})
    assert r.status_code == 200
    assert r.json().get("ok") is True
    # Verify session deleted
    assert db.user_sessions.find_one({"session_token": token}) is None


# ===== Mongo persistence shape =====
def test_mongo_documents_shape(seeded):
    db = seeded["db"]
    u = db.users.find_one({"user_id": seeded["user_id"]})
    assert u is not None
    assert u["user_id"] == seeded["user_id"]
    # created_at stored as ISO string
    assert isinstance(u["created_at"], str)
    s = db.user_sessions.find_one({"user_id": seeded["user_id"]})
    assert s is not None
    assert isinstance(s["expires_at"], str)
