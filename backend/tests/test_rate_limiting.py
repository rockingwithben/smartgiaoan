import os
import time

# Set required env vars BEFORE importing server
os.environ['MONGO_URL'] = 'mongodb://localhost:27017'
os.environ['DB_NAME'] = 'smartgiaoan_test'
os.environ['FRONTEND_URL'] = 'http://localhost:3000'
os.environ['BACKEND_PUBLIC_URL'] = 'http://localhost:8000'
os.environ['EMAIL_VERIFICATION_JWT_SECRET'] = 'testsecret'
os.environ['JWT_VERIFICATION_SECRET'] = 'testsecret'
os.environ['GEMINI_API_KEY'] = 'test-key'
os.environ['OPENROUTER_API_KEY'] = 'test-key'
os.environ['PAYPAL_CLIENT_ID'] = 'test'
os.environ['PAYPAL_CLIENT_SECRET'] = 'test'
os.environ['GOOGLE_APPLICATION_CREDENTIALS_JSON'] = '{}'

import pytest
from fastapi.testclient import TestClient

from backend import server


@pytest.fixture(autouse=True)
def clear_rate_limit_store():
    server.RATE_LIMIT_STORE.clear()
    yield


@pytest.fixture
def client():
    return TestClient(server.app)


def test_rate_limit_allows_limit(client):
    # The /internal/rate-limit-test endpoint allows 3 requests per second
    for _ in range(3):
        res = client.get("/api/internal/rate-limit-test")
        assert res.status_code == 200
    res = client.get("/api/internal/rate-limit-test")
    assert res.status_code == 429
    assert res.json().get("detail") == "Rate limit exceeded"


def test_rate_limit_resets_after_window(client):
    for _ in range(3):
        res = client.get("/api/internal/rate-limit-test")
        assert res.status_code == 200
    res = client.get("/api/internal/rate-limit-test")
    assert res.status_code == 429
    # Wait for the window to expire (configured as 1 second in the route)
    time.sleep(1.1)
    res = client.get("/api/internal/rate-limit-test")
    assert res.status_code == 200