# CipherFace - Biometric Password Vault

[![Live Demo](https://img.shields.io/badge/LIVE%20DEMO-cipherface.onrender.com-22c55e?style=flat-square&logo=render&logoColor=white)](https://cipherface.onrender.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.11x-009688?style=flat-square&logo=fastapi)]()
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)]()
[![License](https://img.shields.io/badge/License-Academic%20Demo-6366f1?style=flat-square)]()

A working prototype that replaces password-based login with **facial recognition + liveness detection**, then gives authenticated users an AES-encrypted credential vault.

**[https://cipherface.onrender.com](https://cipherface.onrender.com)**

> **Demo note:** The live instance runs on Render's free tier with SQLite. Data may reset on cold starts. Use test credentials - don't store anything real.

---

## The security problem this explores

Most "face login" demos are trivially defeated by holding a photo up to the camera. CipherFace adds a **liveness challenge layer** that a static image can't pass:

1. Detect a face in frame
2. Require a **blink** (Eye Aspect Ratio drops below threshold)
3. Require a **head turn** in a randomly prompted direction
4. Return to front-facing position
5. Only then run face descriptor matching against stored profiles

This doesn't make it production-grade biometric security - but it's a meaningful step beyond snapshot-based face login, and building it taught me a lot about how real liveness detection works.

---

## Application screens

| Screen | What happens here |
|--------|-------------------|
| **Register** | Multi-step face enrollment: front pose, side poses, liveness challenge, account creation |
| **Login** | Blink + head-turn challenge, face descriptor match, JWT session issued |
| **Dashboard** | Session overview, recent audit events, vault statistics |
| **Vault** | Add / view / edit / delete encrypted credentials |
| **Audit Trail** | Full timestamped log of every account action |
| **Reset Face** | Re-enroll face data without losing vault contents |

---

## How face matching works

face-api.js extracts a **128-dimension face descriptor vector** from the webcam frame. During registration, multiple descriptor samples (front + side poses) are stored after hashing.

At login, the current frame's descriptor is compared against stored descriptors using Euclidean distance:

```
distance < FACE_MATCH_THRESHOLD   ->  match accepted
distance >= FACE_MATCH_THRESHOLD  ->  match rejected
```

Key thresholds (configurable via `.env`):

| Variable | Default | Effect |
|----------|---------|--------|
| `FACE_MATCH_THRESHOLD` | `0.36` | Single-frame match sensitivity |
| `FACE_AVERAGE_THRESHOLD` | `0.40` | Average across multi-sample comparison |
| `FACE_SIDE_MIN_DISTANCE` | `0.05` | Minimum descriptor variance for side poses |

Lower values = stricter matching. The defaults are tuned for demo convenience, not high-security deployments.

---

## Stack

**Frontend** - served as a static build by the FastAPI backend

```
React 18 + Vite + Tailwind CSS
face-api.js         <-- face descriptor extraction and matching
MediaPipe Tasks     <-- blink detection (EAR) + head pose estimation
Lucide React        <-- icons
```

**Backend** - single FastAPI service on Render

```
FastAPI + Uvicorn
SQLAlchemy ORM + SQLite
JWT authentication
AES vault encryption (cryptography library)
```

The backend **builds the React app and serves it as static files** - so the entire application is one Render service, one URL, one deploy command.

---

## Local setup

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # fill in your secret values
python run.py
# -> http://127.0.0.1:8000
# -> http://127.0.0.1:8000/docs  (Swagger UI)
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# -> http://127.0.0.1:5173
```

---

## Environment variables

### `backend/.env`

```env
# App
APP_NAME=CipherFace API
APP_ENV=development

# Database
DATABASE_URL=sqlite:///./cipherface.db

# JWT
JWT_SECRET=replace-with-a-long-random-string
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=30

# Vault encryption (must be exactly 32 bytes for AES-256)
VAULT_ENCRYPTION_KEY=replace-with-32-char-key-here!!

# CORS
CORS_ORIGINS=http://localhost:5173

# Face matching
FACE_MODE=descriptor
FACE_MATCH_THRESHOLD=0.36
FACE_AVERAGE_THRESHOLD=0.40
FACE_SIDE_MIN_DISTANCE=0.05

# Security
LOGIN_MAX_ATTEMPTS=5
FACE_RESET_AFTER_ATTEMPTS=3
LOCKOUT_MINUTES=15
```

### `frontend/.env`

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

---

## Deployment (Render - single service)

The live demo at [cipherface.onrender.com](https://cipherface.onrender.com) runs as a single Web Service:

| Setting | Value |
|---------|-------|
| **Build command** | `pip install -r backend/requirements.txt && cd frontend && npm install && npm run build` |
| **Start command** | `python backend/run.py` |
| **Environment** | All variables from `backend/.env` |

`run.py` builds the React app into `frontend/dist/` and starts Uvicorn configured to serve those static files alongside the API.

---

## Project layout

```
Cipherface_Password_Manager/
+-- dockerfile
+-- netlify.toml
+-- backend/
|   +-- run.py                    # Entrypoint: builds frontend, starts uvicorn
|   +-- requirements.txt
|   +-- .env.example
|   +-- app/
|       +-- main.py               # FastAPI app + static file mount
|       +-- models.py             # User, VaultEntry, AuditLog ORM models
|       +-- schemas.py            # Pydantic schemas
|       +-- security.py           # JWT + password hashing
|       +-- routers/              # auth, vault, audit, face_reset
|       +-- utils/                # face matching, encryption
+-- frontend/
    +-- public/                   # face-api.js model weights
    +-- src/
    |   +-- pages/                # Register, Login, Dashboard, Vault, Audit
    |   +-- components/           # FaceCapture, VaultEntry, AuditLog
    |   +-- context/              # AuthContext
    |   +-- hooks/                # useFaceDetection, useVault
    |   +-- lib/                  # API client
    +-- package.json
    +-- vite.config.js
```

---

## Known limitations

- **SQLite on Render free tier** - ephemeral storage; data resets on each cold deploy
- **No 3D liveness** - a high-quality video of the real user's face could defeat the blink/turn challenge
- **Face threshold tuned for demos** - tighten `FACE_MATCH_THRESHOLD` for stricter matching
- **Chrome/Edge only recommended** - MediaPipe and face-api.js both rely on WebGL; Safari support is inconsistent

---

## Future directions

- PostgreSQL for persistent production storage
- Server-side liveness verification (don't trust the client)
- FIDO2 / WebAuthn integration for hardware-backed auth
- Email 2FA fallback if face enrollment degrades
- End-to-end encrypted vault (client-side encryption before upload)

---

*Built by **Nitin Bhatti** as an academic demo project exploring biometric authentication.*
*[github.com/nitinbhatti1907](https://github.com/nitinbhatti1907)*
