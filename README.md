# 🚀 SmartGiaoAn – AI‑Powered Cambridge‑Style ESL Worksheets

> **Instantly generate printable, three‑page worksheets** aligned with the CEFR framework, fully localised for Vietnamese classrooms.  

🌐 **Live Demo:** https://www.smartgiaoan.site  

[![License](https://img.shields.io/github/license/rockingwithben/smartgiaoan?style=flat-square)](LICENSE)  
[![Version](https://img.shields.io/github/v/release/rockingwithben/smartgiaoan?include_prereleases&style=flat-square)](https://github.com/rockingwithben/smartgiaoan/releases)  
[![Made with ❤️](https://img.shields.io/badge/Made%20with-❤️-1f4428?style=flat-square)](https://github.com/rockingwithben)  
[![Contributors](https://img.shields.io/github/contributors/rockingwithben/smartgiaoan?style=flat-square)](https://github.com/rockingwithben)  
[![Docs](https://img.shields.io/badge/docs-online-brightgreen?style=flat-square)](https://smartgiaoan.readme.io)  [![Discord](https://img.shields.io/discord/invite/xyz?style=flat-square)](https://discord.gg/xyz)  
[![PayPal Donate](https://img.shields.io/badge/PayPal-Donate-ff6f61?style=flat-square)](https://www.paypal.com/donate?hosted_button_id=XYZ)  
[![Twitter Follow](https://img.shields.io/twitter/follow/SmartGiaoAn?style=social)](https://twitter.com/SmartGiaoAn)  

---

## 🎥 Demo

Watch a quick walkthrough of the platform in action:

<div align="center">
  <a href="https://www.youtube.com/watch?v=YOUR_DEMO_VIDEO_ID">
    <img src="https://img.youtube.com/vi/YOUR_DEMO_VIDEO_ID/0.jpg" alt="SmartGiaoAn Demo" width="720"/>
  </a>
</div>

*(Replace `YOUR_DEMO_VIDEO_ID` with the actual YouTube video identifier.)*

---

## 📸 Screenshots

<div align="center">
  <img src="https://raw.githubusercontent.com/rockingwithben/smartgiaoan/main/assets/screenshot1.png" alt="Worksheet Preview 1" width="400"/>
  <img src="https://raw.githubusercontent.com/rockingwithben/smartgiaoan/main/assets/screenshot2.png" alt="Worksheet Preview 2" width="400"/>
  <img src="https://raw.githubusercontent.com/rockingwithben/smartgiaoan/main/assets/screenshot3.png" alt="Worksheet Preview 3" width="400"/>
</div>

*(Add your actual screenshot paths or host them elsewhere.)*

---

## ✨ Why SmartGiaoAn?

- **Three‑page, ready‑to‑print worksheets** – long passage, glossary, 4‑5 graded sections (24‑32 questions), writing task with success criteria, full answer key, teacher notes, extension activity.  - **All CEFR levels** A1 → C2 across Kindergarten, Primary, Secondary, and IELTS.  
- **Five skill modes** – reading, writing, grammar, vocabulary, listening.  
- **Vietnam‑localised content** – Vietnamese names, places, cultural references, and bilingual UI (English primary / Vietnamese secondary).  
- **Print‑ready PDF export** – A4 layout with Cormorant Garamond serif body for a professional exam‑paper feel.  
- **Free tier + premium tier** – 3 free worksheets per browser (anonymous) or per Google account, then £5 /month via PayPal or rewarded ads (15 s/30 s/45 s = 1/2/3 credits).  
- **Google Auth** via Emergent‑managed OAuth for seamless sign‑in.  ---

## 🛠 Tech Stack

| Layer | Tools |
|-------|-------|
| **Frontend** | React 19 • Tailwind CSS • Shadcn UI • react‑router v7 • jsPDF + html2canvas |
| **Backend** | FastAPI • Motor (async MongoDB) • google‑generativeai (Gemini 2.5 Flash) |
| **Database** | MongoDB |
| **Auth** | Emergent‑managed Google OAuth (httpOnly cookie, 7‑day session) |
| **Payments** | PayPal Hosted Buttons (£5 GBP/mo) |
| **Ads** | Google AdSense placeholders (sidebar, leaderboard, inline) |

---

## 📁 Project Structure

```
/app
├── backend/
│   ├── server.py          # FastAPI app – all /api routes
│   ├── requirements.txt
│   └── .env               # MONGO_URL, DB_NAME, GEMINI_API_KEY (NOT committed)
└── frontend/
    ├── public/index.html  # PayPal SDK + Google Fonts    └── src/
        ├── App.js        ├── pages/         # Landing, Dashboard, About, Pricing, FAQ, Contact, Privacy, Terms, Account, Levels, NotFound, AuthCallback
        ├── components/    # Navbar, Footer, WorksheetView, Paywall/UpgradeModal, RewardedAdModal, AdSlot, LangToggle
        └── lib/           # api.js, auth.jsx, i18n.js, catalog.js
    └── package.json
└── design_guidelines.json
```

---

## ⚙️ Local Development

### Prerequisites
- **Node** 18+ (recommended 20)  
- **Yarn** 1.x  
- **Python** 3.11+  
- **MongoDB** running locally  
- **Google Gemini API key** – get it at https://aistudio.google.com/app/apikey  

### Setup
```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env   # then add your GEMINI_API_KEY
```

```bash
# Frontend
cd ../frontend
yarn install
```

### Environment Variables**backend/.env**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=smartgiaoan
CORS_ORIGINS=*
GEMINI_API_KEY=your_gemini_key_here
```

**frontend/.env**
```env
REACT_APP_BACKEND_URL=https://your-backend.example.com
```

### Run
```bash
# Backend
cd backend && uvicorn server:app --reload --host 0.0.0.0 --port 8001

# Frontend
cd frontend && yarn start
```

---

## 🧠 The AI Prompt

The Gemini system prompt enforces a **senior Cambridge ESOL examiner** persona with strict CEFR descriptors, a 3‑page minimum content volume rule, mandatory Vietnamese localisation, mixed question types (MCQ, T/F/NG, fill‑blank, short‑answer, matching, sentence transformation, error correction), and a fixed JSON schema. See `WORKSHEET_SYSTEM_PROMPT` in `backend/server.py`.

---

## 💸 Monetisation

- **Free tier** – 3 worksheets per browser (anonymous) or per Google account, plus rewarded‑ad bonus credits.  
- **Premium tier** – £5 /month via PayPal Hosted Button (`KRKWACD47HF7G`).  
- **Rewarded ads** – 15 s = 1 credit, 30 s = 2, 45 s = 3.  
- **Ad placeholders** – sidebar, leaderboard, inline (replace with AdSense after domain approval).  

---

## 📈 Roadmap

| Milestone | Target Release |
|-----------|----------------|
| **Beta Launch** | ✅ Completed (v0.9) |
| **Premium Subscription** | Q1 2026 |
| **Mobile App (iOS/Android)** | Q3 2026 |
| **API for Third‑Party Integration** | Q4 2026 |
| **Full‑screen PDF Export** | Q2 2027 |

---

## 📝 License

> **Proprietary** – © SmartGiaoAn. All rights reserved.  

---

## 🙌 Contribute & Support

- **Star** the repo if you love what we’re building!  
- **Contribute** a worksheet, bug‑fix, or translation – see our [Contributing Guide](CONTRIBUTING.md).  
- **Sponsor** the project via PayPal or GitHub Sponsors to keep the free tier alive.  - **Follow** us on Twitter [@SmartGiaoAn](https://twitter.com/SmartGiaoAn) for updates and new releases.  
- **Join** our Discord community: [Discord Invite](https://discord.gg/xyz)  

---

## ❓ FAQ

**Q: Do I need a credit card for the free tier?**  A: No. The free tier is completely anonymous and does not require any payment information.

**Q: Can I host the generated PDFs on my own site?**  
A: Yes. The PDFs are generated client‑side and can be downloaded or uploaded wherever you prefer.

**Q: How do I report a bug or request a feature?**  
A: Open an issue on the GitHub repository or drop a message in the #bugs channel on Discord.

---

## 📬 Contact

- **Email:** support@smartgiaoan.site  
- **Twitter:** [@SmartGiaoAn](https://twitter.com/SmartGiaoAn)  - **Discord:** [Join our server](https://discord.gg/xyz)  

---

> **Built for Vietnamese ESL teachers who deserve their evenings back.**  
> **Join the community and help shape the future of language learning!**