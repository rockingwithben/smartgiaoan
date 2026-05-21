"""email verification integration tests for SmartGiaoAn backend."""
import re
import uuid
import time
from datetime import datetime, timezone, timedelta

import pytest

from fastapi.testclient import TestClient

# Local in-process app import
import backend.server as srv
import mongomock

# Simple in-process TestClient setup helper
def _prepare_inmemory_db(db_name="test_database"):
    client = mongomock.MongoClient()
    db = client[db_name]
    return db

@pytest.fixture
def test_seeded():
    # Prepare in-memory DB that mirrors the seeded fixture in other tests
    DB_NAME = "test_database"
    db = _prepare_inmemory_db(DB_NAME)
    user_id = f"TEST_email_user_{uuid.uuid4().hex[:8]}"
    email = f"test_{int(time.time())}@example.com"
    token = f"TEST_token_{uuid.uuid4().hex}"
    now = datetime.now(timezone.utc)
    db.users.insert_one({
        "user_id": user_id, "email": email, "name": "Test User", "picture": "",
        "is_premium": False, "free_used": 0, "bonus_credits": 0,
        "email_verified": False,
        "created_at": now.isoformat()
    })
    db.user_sessions.insert_one({
        "user_id": user_id, "session_token": token,
        "expires_at": (now + timedelta(days=7)).isoformat(),
        "created_at": now.isoformat(),
    })
    return {"user_id": user_id, "token": token, "email": email, "db": db}

@pytest.fixture
def client_with_app(test_seeded, monkeypatch):
    # Bind the in-memory DB to the server module so endpoints use it
    srv.db = test_seeded["db"]
    # Ensure a known secret for token generation during tests
    srv.EMAIL_VERIFICATION_JWT_SECRET = "test-secret"
    # Patch _send_email to capture the verification email content
    captured = {}
    def fake_send_email(to_email, subject, content):
        captured["to_email"] = to_email
        captured["subject"] = subject
        captured["content"] = content
    monkeypatch.setattr(srv, "_send_email", fake_send_email)
    # Build a TestClient for the in-process app
    client = TestClient(srv.app)
    client.captured_email = captured
    return client

def test_email_verification_integration_flow(client_with_app, test_seeded):
    client = client_with_app
    seeded = test_seeded
    headers = {"Authorization": f"Bearer {seeded['token']}"}
    # Step 1: Trigger sending verification email
    resp = client.post("/api/auth/send-verification", headers=headers)
    assert resp.status_code == 200
    content = client.captured_email.get("content", "")
    assert "token=" in content
    # Extract the token from the link in email content
    m = re.search(r"token=([^&#\s]+)", content)
    assert m, f"Could not extract token from email content: {content}"
    token = m.group(1)
    # Step 2: Verify email via token (backend should mark email_verified)
    resp2 = client.post("/api/auth/verify-email", json={"token": token})
    assert resp2.status_code == 200
    assert resp2.json().get("status") == "verified"
    # Step 3: Inspect DB to confirm email_verified flag is set
    user = seeded["db"].users.find_one({"user_id": seeded["user_id"]})
    assert user is not None
    assert user.get("email_verified") is True
