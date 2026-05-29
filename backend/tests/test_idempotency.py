"""Unit tests for write idempotency helpers."""
import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "smartgiaoan_test")
os.environ.setdefault("FRONTEND_URL", "http://localhost:3000")
os.environ.setdefault("BACKEND_PUBLIC_URL", "http://localhost:8000")
os.environ.setdefault("EMAIL_VERIFICATION_JWT_SECRET", "testsecret-01234567890123456789012")
os.environ.setdefault("JWT_VERIFICATION_SECRET", "testsecret-01234567890123456789012")
os.environ.setdefault("GEMINI_API_KEY", "test-key")
os.environ.setdefault("OPENROUTER_API_KEY", "test-key")

from datetime import timedelta

from backend import server as srv


def setup_function():
    srv._IDEMPOTENCY_CACHE.clear()


def test_idempotency_store_and_lookup():
    key = "test-key-1"
    payload = {"worksheet_id": "ws_abc", "status": "ok"}
    srv._idempotency_store(key, payload)
    assert srv._idempotency_lookup(key) == payload


def test_idempotency_miss_returns_none():
    assert srv._idempotency_lookup("missing-key") is None
    assert srv._idempotency_lookup(None) is None


def test_idempotency_expired_entry_removed():
    key = "expired-key"
    srv._IDEMPOTENCY_CACHE[key] = (
        {"old": True},
        srv._now() - timedelta(seconds=1),
    )
    assert srv._idempotency_lookup(key) is None
    assert key not in srv._IDEMPOTENCY_CACHE
