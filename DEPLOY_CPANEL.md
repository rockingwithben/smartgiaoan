# SmartGiaoAn — cPanel Deployment Guide

> This guide assumes you have **Namecheap cPanel** hosting + the domain `smartgiaoan.site`.
> Estimated time: ~45 minutes (most of it waiting for DNS).

The architecture you're deploying:
```
Browser ──► https://www.smartgiaoan.site/        ►  Static React (cPanel public_html)
        ──► https://api.smartgiaoan.site/api/*   ►  FastAPI (cPanel Python App)
                                                 ►  MongoDB (Atlas — separate, free)
```

## Step 0 — One-time prerequisites (10 min)

### 0a. Get a fresh Gemini API key
1. Go to https://aistudio.google.com/app/apikey
2. **Delete the old leaked key**, click **Create API key**
3. Copy the new key — you'll paste it into cPanel in Step 2

### 0b. Set up MongoDB Atlas (free forever, 512 MB)
cPanel cannot host MongoDB. You need Atlas.
1. Sign up at https://www.mongodb.com/atlas (free)
2. Create a free **M0** cluster (any region close to Vietnam, e.g. Singapore or Mumbai)
3. **Database Access** → Add database user (username + strong password — copy them)
4. **Network Access** → Add IP → **Allow access from anywhere** (`0.0.0.0/0`) — required because cPanel IPs are dynamic
5. **Connect** → **Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://USER:PASS@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Replace `USER` and `PASS` with your actual creds. **Save this string** — you'll paste it into cPanel.

---

## Step 1 — Push to GitHub (2 min)
1. In Emergent, click your **profile icon** (top-right) → **Connect GitHub** (one-time)
2. In the chat, click the **"Save to GitHub"** button → select **`rockingwithben/smartgiaoan`** → branch `main` → **Push to GitHub**
3. Open your repo at https://github.com/rockingwithben/smartgiaoan → Code → **Download ZIP**
4. Extract the ZIP locally — you'll upload from this folder.

---

## Step 2 — Deploy the BACKEND (FastAPI on cPanel Python App) (15 min)

### 2a. Create the Python App
1. Log into Namecheap cPanel
2. Open **Setup Python App** (under "Software")
3. Click **CREATE APPLICATION**:
   - Python version: **3.11** (or the latest 3.11.x available)
   - Application root: `smartgiaoan-backend` (cPanel will create `/home/<user>/smartgiaoan-backend`)
   - Application URL: select the **api.smartgiaoan.site** subdomain (create the subdomain first in **Subdomains** if it doesn't exist — point it to the same `public_html` will be overridden by the app)
   - Application startup file: `passenger_wsgi.py`
   - Application Entry point: `application`
4. Click **Create**.

### 2b. Upload the backend files
1. In cPanel **File Manager**, go to `/home/<user>/smartgiaoan-backend/`
2. Upload the entire contents of the `backend/` folder from your downloaded ZIP (skip `__pycache__`, skip `tests/`)
   - Must include: `server.py`, `passenger_wsgi.py`, `requirements.txt`
3. Do **NOT** upload `.env` — we set env vars in cPanel UI instead.

### 2c. Set environment variables
Back in **Setup Python App**, click your app → scroll to **Environment variables** and add:

| Name | Value |
|---|---|
| `MONGO_URL` | (paste your full Atlas connection string from Step 0b) |
| `DB_NAME` | `smartgiaoan` |
| `CORS_ORIGINS` | `https://www.smartgiaoan.site,https://smartgiaoan.site` |
| `GEMINI_API_KEY` | (paste your fresh Gemini key from Step 0a) |

### 2d. Install dependencies + restart
1. Click **Run pip install** (or open the **terminal** the cPanel app gives you and run `pip install -r requirements.txt`)
2. Click **Restart** at the top.

### 2e. Health check
Open https://api.smartgiaoan.site/api/ in your browser. You should see:
```json
{"app":"SmartGiaoAn","status":"ok"}
```
✅ Backend is live.

If you see a 500 error: open the **Logs** tab in Setup Python App — usually it's a missing env var or `pip install` didn't complete.

---

## Step 3 — Deploy the FRONTEND (Static React on cPanel) (5 min)

The frontend has already been **pre-built** for you — it lives in `frontend/build/` in the GitHub ZIP.

> If for any reason the `build/` folder is missing in your ZIP (e.g. if you regenerate from scratch), open a terminal locally and run:
> ```
> cd frontend
> echo "REACT_APP_BACKEND_URL=https://api.smartgiaoan.site" > .env.production
> yarn install && yarn build
> ```
> The output goes to `frontend/build/`.

1. In cPanel **File Manager**, go to `public_html/` (this is your `www.smartgiaoan.site` web root)
2. **Delete** anything inside that's not yours (default cPanel index files)
3. Upload **the contents of `frontend/build/`** into `public_html/`. The folder layout should now look like:
   ```
   public_html/
     ├── .htaccess          ← React SPA routing (CRITICAL)
     ├── index.html
     ├── favicon.svg
     ├── og-image.svg
     ├── robots.txt
     ├── sitemap.xml
     └── static/
         ├── css/...
         └── js/...
   ```
4. Make sure the `.htaccess` file is uploaded (cPanel sometimes hides dotfiles — enable "Show hidden files" in File Manager settings).

---

## Step 4 — DNS at Namecheap (5 min + DNS propagation up to 1 hour)

Open Namecheap → **Domain List** → manage `smartgiaoan.site` → **Advanced DNS**:

| Type | Host | Value | TTL |
|---|---|---|---|
| `A` | `@` | (your cPanel server IP — find it on cPanel home page, "Shared IP Address") | Automatic |
| `A` | `www` | (same cPanel server IP) | Automatic |
| `A` | `api` | (same cPanel server IP — same server runs both) | Automatic |

> If your cPanel uses a CNAME instead of an IP (some hosts give you e.g. `server123.web-hosting.com`), use `CNAME` instead of `A` for `www` and `api`.

Delete any conflicting `A`/`CNAME`/parking records for `@`, `www`, `api`.

Wait 5–60 minutes for DNS to propagate. Test with: `nslookup www.smartgiaoan.site`

---

## Step 5 — SSL certificates (free, 2 min)

In cPanel:
1. Open **SSL/TLS Status** (under "Security")
2. Tick `smartgiaoan.site`, `www.smartgiaoan.site`, `api.smartgiaoan.site`
3. Click **Run AutoSSL** → wait ~2 min → all three should show 🟢 green padlocks.

(Namecheap shared cPanel ships with AutoSSL using Let's Encrypt — free.)

---

## Step 6 — Test the live site (2 min)

1. Open https://www.smartgiaoan.site/ — you should see the SmartGiaoAn landing page
2. Click **Sign in with Google** — should redirect to Google, then back to `/dashboard`
3. Generate a test worksheet — should produce a 3-page Cambridge worksheet
4. Click **Download PDF** — should download
5. Open https://www.smartgiaoan.site/sitemap.xml — should show all 8 URLs

---

## Common issues & fixes

| Symptom | Cause | Fix |
|---|---|---|
| Backend returns 500 | Missing env var or `pip install` failed | Check **Logs** tab in Setup Python App; rerun pip install |
| `Failed to fetch` in frontend | CORS misconfigured | Set `CORS_ORIGINS=https://www.smartgiaoan.site,https://smartgiaoan.site` exactly (no trailing slash, no `*`) |
| Refreshing `/dashboard` shows 404 | `.htaccess` missing in `public_html/` | Re-upload `.htaccess`; ensure mod_rewrite is enabled on the cPanel plan |
| `gemini.generate_content` 403 | API key invalid | Replace `GEMINI_API_KEY` env var in cPanel and click Restart |
| MongoDB connection timeout | Atlas IP allowlist | In Atlas Network Access, ensure `0.0.0.0/0` is allowed |
| AutoSSL fails on `api.` | Subdomain DNS not propagated | Wait 30 min, retry AutoSSL |
| Login redirects but immediately logs out | Cookies blocked by SameSite | Confirm you're using HTTPS on **both** www. and api. — cookie has `secure=True, samesite=none` |

---

## After you're live

- Apply for **Google AdSense** at https://adsense.google.com → add the `<ins class="adsbygoogle">` snippet to your AdSlot component once approved (free tier monetises immediately).
- Test the PayPal button with a real £5 sandbox payment to make sure your hosted button is wired correctly.
- Add Google Analytics 4 if you want traffic stats (paste the GA4 snippet into `frontend/public/index.html`).

---

## Push updates later

Whenever you make changes in Emergent and want them live:
1. Click **Save to GitHub** in Emergent → Push
2. On cPanel, in **File Manager**:
   - Backend: replace files in `smartgiaoan-backend/` and click **Restart** in Setup Python App
   - Frontend: re-run `yarn build` locally, replace `public_html/` contents

There's no auto-sync — you push when you're ready.
