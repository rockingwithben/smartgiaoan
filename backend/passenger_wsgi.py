"""
Phusion Passenger entry point for cPanel "Setup Python App".

cPanel's Python App feature uses Passenger which expects a WSGI callable
named `application`. FastAPI is ASGI, so we use a2wsgi to bridge.

Deployment notes (Namecheap / generic cPanel):
1. In cPanel, open "Setup Python App"
2. Create a new app:
     - Python version: 3.11 (or latest available)
     - Application root: /home/<user>/smartgiaoan-backend
     - Application URL: api.smartgiaoan.site   (or whatever subdomain you point at it)
     - Application startup file: passenger_wsgi.py
     - Application Entry point: application
3. Upload the entire `backend/` folder contents into the Application root.
4. Open the app, click "Run pip install" (or use the cPanel terminal):
     pip install -r requirements.txt
5. Edit Environment Variables in cPanel for the app:
     MONGO_URL=mongodb+srv://...
     DB_NAME=smartgiaoan
     CORS_ORIGINS=https://www.smartgiaoan.site,https://smartgiaoan.site
     GEMINI_API_KEY=your-new-key
6. Click "Restart" in cPanel.
7. Health check: https://api.smartgiaoan.site/api/  -> {"app":"SmartGiaoAn","status":"ok"}
"""
import os
import sys

# Ensure local imports (server.py, .env) resolve from this folder
APP_ROOT = os.path.dirname(os.path.abspath(__file__))
if APP_ROOT not in sys.path:
    sys.path.insert(0, APP_ROOT)

from a2wsgi import ASGIMiddleware  # noqa: E402
from server import app as fastapi_app  # noqa: E402

# Passenger looks for `application`
application = ASGIMiddleware(fastapi_app)
