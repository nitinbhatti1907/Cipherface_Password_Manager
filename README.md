# CipherFace

CipherFace is a cybersecurity course prototype for a **face-based password manager** with:
- Face registration and face login
- Encrypted credential vault
- Password strength analyzer and generator
- Audit logs
- Auto logout on inactivity
- Rate limiting and temporary lockout on repeated login failures

## Important deployment note

This ZIP is designed around the project proposal, but there is one important platform constraint:

- **Netlify is excellent for deploying the React frontend**.
- **Netlify does not natively deploy Python Functions** in its current Functions platform, so the Python API in this project should be deployed separately on Render, Railway, Fly.io, or any other Python host.

Because of that, this project is packaged as:

- `frontend/` - React + Vite + Tailwind UI for Netlify
- `backend/` - Python FastAPI API for the secure vault and auth logic

This keeps the stack aligned with your proposal while staying realistic for deployment.

## Proposal coverage

Implemented or scaffolded directly from the proposal:

- React frontend dashboard and camera-based flows
- Python backend with FastAPI
- PostgreSQL-ready database setup with SQLite fallback for local testing
- Face enrollment and face login workflow
- Encrypted password storage using AES-GCM
- Credential CRUD APIs
- Password strength analyzer
- Password generator
- Audit logs
- Login rate limiting / temporary lockout
- Auto logout in frontend + JWT expiry in backend
- Basic tests for crypto, password tools, and face matching

## Architecture

### Frontend
- React + Vite
- Tailwind CSS
- Framer Motion for animations
- `face-api.js` for browser-side face detection, landmarks, and descriptors

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL or SQLite
- JWT authentication
- AES-GCM encryption with `cryptography`

## Face authentication approach

This project supports **two modes**:

### 1) Descriptor mode (default)
Recommended for the Netlify-friendly setup.
- Face detection and descriptor extraction happen in the browser using `face-api.js`
- The Python backend stores and compares the face descriptor securely
- This is the default because it is much easier to deploy

### 2) Image mode (optional)
For a fully Python-based face pipeline on a traditional Python host.
- Backend can be extended to use `face_recognition` / OpenCV
- A helper service stub is included for that path
- This is not enabled by default because heavy CV dependencies are not ideal for the target deployment setup

## Quick start

### 1) Backend
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

Backend runs on `http://localhost:8000`.

### 2) Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Environment variables

### Backend `.env`
See `backend/.env.example`

Important variables:
- `DATABASE_URL`
- `JWT_SECRET`
- `VAULT_ENCRYPTION_KEY`
- `CORS_ORIGINS`
- `FACE_MODE`

### Frontend `.env`
See `frontend/.env.example`

Important variables:
- `VITE_API_BASE_URL`
- `VITE_FACE_MODEL_URL`
- `VITE_IDLE_TIMEOUT_MS`

## Netlify frontend deployment

1. Push this project to GitHub.
2. In Netlify, create a new site from that repo.
3. Use the root `netlify.toml` already included.
4. Set the frontend env var:
   - `VITE_API_BASE_URL=https://YOUR-PYTHON-BACKEND/api`
5. Deploy.

## Python backend deployment suggestions

Any Python-friendly host works. Common options:
- Render
- Railway
- Fly.io
- a VPS

## Security notes for demo/prototype

This is a **course prototype**, not a production password manager. It demonstrates secure patterns, but before real production use you would still want:
- hardware-backed key management / KMS
- stronger liveness detection
- CSRF strategy if using cookie sessions
- refresh token rotation
- device/session management
- monitoring and alerting
- stronger anomaly detection
- hardened secrets management

## Folder structure

```text
cipherface_project/
  frontend/
  backend/
  netlify.toml
  README.md
```


## Python 3.14 note
This package was adjusted to run locally with Python 3.14 by removing the NumPy runtime dependency and updating backend dependency ranges so pip can install Python 3.14-compatible wheels.


## Node 16 compatibility

This package is pinned to a Node 16 compatible frontend toolchain:
- Vite 4.x
- React Router 6.x

Local frontend commands:
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell, replace `cp` with:
```powershell
Copy-Item .env.example .env -Force
```
