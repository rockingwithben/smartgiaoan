#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${REACT_APP_BACKEND_URL:-http://localhost:8001}}"
BASE_URL="${BASE_URL%/}"

echo "[1/6] Health endpoint"
curl -fsS "$BASE_URL/health" | python -m json.tool

echo "[2/6] API root"
curl -fsS "$BASE_URL/api/" | python -m json.tool

echo "[3/6] Public library feed"
curl -fsS "$BASE_URL/api/library/feed?limit=3" | python -m json.tool > /dev/null
echo "library/feed ok"

echo "[4/6] Auth unauthenticated guard"
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/auth/me")
if [[ "$status" != "401" ]]; then
  echo "Expected 401 from /api/auth/me when logged out, got $status" >&2
  exit 1
fi
echo "auth guard ok (401)"

echo "[5/6] CORS preflight"
status=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS \
  -H "Origin: https://www.smartgiaoan.site" \
  -H "Access-Control-Request-Method: POST" \
  "$BASE_URL/api/auth/session")
if [[ "$status" != "200" && "$status" != "204" ]]; then
  echo "Unexpected CORS preflight status: $status" >&2
  exit 1
fi
echo "cors preflight ok ($status)"

echo "[6/6] Python syntax"
python -m py_compile backend/server.py backend/tests/test_smartgiaoan_backend.py

echo "All prelaunch checks passed for $BASE_URL"
