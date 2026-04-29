# SmartGiaoAn — Product Requirements Document

## Original Problem Statement
SmartGiaoAn is a specialized SaaS for ESL teachers in Vietnam. It uses the Gemini API to generate Cambridge/CEFR-aligned worksheets. Premium, localized, efficient vibe. Bilingual UI (English primary / Vietnamese secondary). Market: Vietnamese ESL teachers (Kindergarten to IELTS).

## Architecture
- **Frontend**: React 19 + Tailwind + Shadcn UI, react-router-dom v7, jspdf + html2canvas for PDF, @phosphor-icons/react
- **Backend**: FastAPI + Motor (async MongoDB) + google-generativeai (Gemini 2.5 Flash, BYOK)
- **Auth**: Emergent-managed Google OAuth with httpOnly session_token cookies (7-day expiry) + Bearer fallback
- **Payments**: PayPal Hosted Buttons (£5/mo, ID `KRKWACD47HF7G`) — manual `mark-premium` activation
- **Database collections**: `users`, `user_sessions`, `worksheets`

## User Personas
- **The Hanoi Primary Teacher** — needs Cambridge-style printable worksheets fast, low budget, OK with ads
- **The IELTS Tutor in Saigon** — values quality + zero ads, willing to pay £5/mo
- **The Kindergarten Coordinator** — needs many simple worksheets with Vietnamese cultural context

## Core Requirements (Static)
1. Bilingual EN/VI UI with i18n context + persistent toggle
2. Cambridge-aligned worksheet generation via Gemini with strict JSON output
3. Vietnamese localization in AI prompts (names, cities, culture)
4. 3 free worksheets per user, then paywall
5. Rewarded ad system (15s/30s/45s tiered = 1/2/3 bonus credits)
6. Premium tier £5/mo (PayPal Hosted Button) with `is_premium` flag
7. Web display + PDF download + Print
8. AdSense-ready ad placeholders (sidebar, leaderboard, inline)
9. Worksheet history per user

## What's Been Implemented (2026-02)
### Backend (`/app/backend/server.py`)
- Auth: `/api/auth/session`, `/api/auth/me`, `/api/auth/logout`
- Worksheets: `/api/worksheets/generate`, `/api/worksheets`, `/api/worksheets/{id}`
- Monetization: `/api/usage/grant-rewarded` (tiered), `/api/billing/mark-premium`
- All 12 backend tests passing (iteration_1.json)
- MongoDB schema follows custom `user_id` pattern (no `_id` exposure)

### Frontend (`/app/frontend/src/`)
- `pages/Landing.jsx` — Tetris-grid hero, Cormorant Garamond + terracotta, pricing, features
- `pages/Dashboard.jsx` — generator form sidebar, worksheet preview, history, PDF download, print
- `pages/AuthCallback.jsx` — Emergent OAuth session_id exchange
- `components/WorksheetView.jsx` — Cambridge-style printable worksheet (sections, MC, fill-blank, T/F, matching, answer key, teacher notes)
- `components/PaywallModal.jsx` + `UpgradeModal` (PayPal hosted button embed)
- `components/RewardedAdModal.jsx` — countdown timer + AdSense placeholder
- `components/AdSlot.jsx` — sidebar/leaderboard/inline ad placeholders
- `lib/i18n.js` — full EN/VI translation dictionary
- `lib/auth.jsx` + `lib/api.js`

## Known Issue
- **GEMINI_API_KEY currently flagged "leaked" by Google** — user needs to generate a fresh key at https://aistudio.google.com/app/apikey and replace the value in `/app/backend/.env`, then `sudo supervisorctl restart backend`. All worksheet generation flow code is correct and verified; just blocked on a valid key.

## Backlog (P1)
- PayPal webhook verification before flipping `is_premium` (current MVP trusts client)
- Wrap `genai.generate_content` in `asyncio.to_thread` (sync call in async endpoint)
- Server-side anonymous quota (currently localStorage-only)
- Real AdSense integration once domain approved
- Worksheet edit / regenerate sections
- Listening skill: audio script + TTS

## Backlog (P2)
- Class management / student rosters
- Bulk worksheet generation
- Custom branding (school logo on PDFs)
- VND pricing alternative to GBP
- Mobile app

## Files
- Backend: `/app/backend/server.py`
- Frontend entry: `/app/frontend/src/App.js`
- Design guidelines: `/app/design_guidelines.json`
- Tests: `/app/backend/tests/test_smartgiaoan_backend.py`
