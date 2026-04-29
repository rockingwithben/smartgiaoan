# SmartGiaoAn

> Cambridge & CEFR-aligned ESL worksheets for Vietnamese teachers — generated in seconds.

🌐 **Live at: https://smartgiaoan.site/**

A focused SaaS that turns one topic + one CEFR level into a printable, three-page Cambridge-style worksheet, fully localised to Vietnam (names, places, culture).

## ✨ Features

- **Three-page worksheets** — long passage, vocabulary glossary, 4-5 graded sections (24-32 questions), writing task with success criteria, full answer key, teacher notes, extension activity
- **All CEFR levels** A1 → C2 across Kindergarten / Primary / Secondary / IELTS
- **Five skill modes** — reading, writing, grammar, vocabulary, listening
- **Vietnam-localised** — Vietnamese names (Minh, Lan, Huy…), cities (Hanoi, Saigon, Sapa…), culture (Tet, banh mi, ao dai…)
- **Bilingual UI** — English primary / Vietnamese secondary, instant toggle
- **Print + PDF export** — A4-ready, exam-paper styling (Cormorant Garamond serif body)
- **Free & Premium tiers** — 3 free, then £5/month via PayPal Hosted Buttons OR rewarded ads (15s/30s/45s = 1/2/3 credits)
- **Google Auth** via Emergent-managed OAuth

## 🛠 Tech Stack

| Layer | Tech |
| --- | --- |
| Frontend | React 19 · Tailwind · Shadcn UI · react-router v7 · jsPDF + html2canvas |
| Backend | FastAPI · Motor (async MongoDB) · google-generativeai (Gemini 2.5 Flash) |
| Database | MongoDB |
| Auth | Emergent-managed Google OAuth (httpOnly cookie, 7-day session) |
| Payments | PayPal Hosted Buttons (£5 GBP/mo) |
| Ads | Google AdSense placeholders (sidebar / leaderboard / inline) |

## 📁 Structure

```
/app
├── backend/
│   ├── server.py          # FastAPI app · all /api routes
│   ├── requirements.txt
│   └── .env               # MONGO_URL, DB_NAME, GEMINI_API_KEY (NOT committed)
├── frontend/
│   ├── public/index.html  # PayPal SDK + Google Fonts
│   ├── src/
│   │   ├── App.js
│   │   ├── pages/         # Landing, Dashboard, About, Pricing, FAQ, Contact, Privacy, Terms, Account, Levels, NotFound, AuthCallback
│   │   ├── components/    # Navbar, Footer, WorksheetView, Paywall/UpgradeModal, RewardedAdModal, AdSlot, LangToggle
│   │   └── lib/           # api.js, auth.jsx, i18n.js, catalog.js
│   └── package.json
└── design_guidelines.json
```

## ⚙️ Local Development

### Prerequisites
- Node 18+, Yarn
- Python 3.11+
- MongoDB running locally
- A Google Gemini API key (https://aistudio.google.com/app/apikey)

### Setup
```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env  # then add your GEMINI_API_KEY

# Frontend
cd ../frontend
yarn install
```

### Environment variables
**backend/.env**
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=smartgiaoan
CORS_ORIGINS=*
GEMINI_API_KEY=your_gemini_key_here
```

**frontend/.env**
```
REACT_APP_BACKEND_URL=https://your-backend.example.com
```

### Run
```bash
# Backend
cd backend && uvicorn server:app --reload --host 0.0.0.0 --port 8001

# Frontend
cd frontend && yarn start
```

## 🧠 The AI Prompt

The Gemini system prompt enforces a **senior Cambridge ESOL examiner** persona with strict CEFR descriptors, a 3-page minimum content volume rule, mandatory Vietnamese localisation, mixed question types (MCQ, T/F/NG, fill-blank, short-answer, matching, sentence transformation, error correction), and a fixed JSON schema. See `WORKSHEET_SYSTEM_PROMPT` in `backend/server.py`.

## 💸 Monetisation

- **Free tier** — 3 worksheets per browser (anonymous) / per Google account, plus rewarded-ad bonus credits
- **Premium tier** — £5/month via PayPal Hosted Button (`KRKWACD47HF7G`)
- **Rewarded ads** — 15s = 1 credit, 30s = 2, 45s = 3
- **Ad placeholders** — sidebar, leaderboard, inline (replace with AdSense after domain approval)

## 📝 License

Proprietary — © SmartGiaoAn. All rights reserved.

---

Built for Vietnamese ESL teachers who deserve their evenings back.
