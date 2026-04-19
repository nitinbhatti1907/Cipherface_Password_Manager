# 🔐 CipherFace — Face Login + Encrypted Password Vault

> **A prototype full-stack web app combining facial recognition authentication with an AES-encrypted password vault — built as a course demo project exploring biometric security concepts.**

🌐 **Live Demo:** **[https://cipherface.onrender.com](https://cipherface.onrender.com)**

[![Live on Render](https://img.shields.io/badge/Live-cipherface.onrender.com-brightgreen?style=for-the-badge&logo=render)](https://cipherface.onrender.com)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-teal?style=for-the-badge&logo=fastapi)](#)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue?style=for-the-badge&logo=react)](#)
[![Auth](https://img.shields.io/badge/Auth-Face%20%2B%20JWT-orange?style=for-the-badge&logo=shield)](#)

---

## 👋 Hey, Welcome!

I'm **Nitin**, and I built CipherFace as a deep-dive into biometric authentication and encrypted credential storage — topics I kept reading about but wanted to actually implement from scratch.

The core question I was exploring: *Can you replace a password login entirely with a face, while still being resistant to simple photo attacks?* CipherFace is my answer — a working prototype that uses multi-step liveness detection (blink + head turn challenge) before accepting a face for login, then gives verified users access to an AES-encrypted vault of their stored credentials.

It's a **demo / academic project**, not a production security product — but everything is real: the face descriptors, the encryption, the JWT sessions, the audit trail. If you're exploring biometrics for a course or portfolio, this codebase might be useful to dig through.

🔗 **Try it → [cipherface.onrender.com](https://cipherface.onrender.com)**

---

## 📸 What You Get

When you open CipherFace, here's what the full app flow looks like:

- 🧑 **Register** with face enrollment (front + side poses + liveness challenge)
- 🔑 **Log in** using face verification with blink + head turn challenge
- 🔒 **Access your encrypted vault** — add, view, edit, delete saved credentials
- 📋 **Audit trail** — every important action is logged (login, logout, vault ops, face reset)
- ⏱️ **Auto-logout** after inactivity — session doesn't stay open forever
- 🧹 **Reset your face data** — re-enroll if face detection degrades

---

## ✨ Features Breakdown

### 🧑 **Multi-Step Face Enrollment**
Registration isn't just a single selfie snap. The enrollment flow collects:
- Front-facing pose
- Left and right side poses
- Liveness challenge (movement prompts)

This builds a richer face profile and reduces the chance of a static photo defeating enrollment.

### 🔑 **Liveness-Checked Face Login**
The login flow requires the user to:
1. Align their face in the camera frame
2. **Blink** (detected via Eye Aspect Ratio analysis)
3. **Turn their head** in a prompted direction
4. Return to front-facing position

Only after all challenges pass is the face descriptor matched against stored profiles. A printed photo can't complete the blink + turn sequence.

### 🔒 **AES-Encrypted Password Vault**
Post-login, users get a credential vault where they can:
- ➕ Add new credentials (site, username, password)
- 👁️ View stored passwords (decrypted only client-side on demand)
- ✏️ Edit existing entries
- 🗑️ Delete entries

Passwords are encrypted at rest using a vault encryption key — they're never stored in plaintext.

### 📋 **Audit Trail**
Every significant action is recorded with a timestamp:

| Event | Logged? |
|:------|:-------:|
| User registration | ✅ |
| Face login success | ✅ |
| Face login failure | ✅ |
| Logout | ✅ |
| Vault: add / edit / delete | ✅ |
| Face data reset | ✅ |
| Account lockout | ✅ |

### ⏱️ **Auto-Logout on Inactivity**
The session automatically expires after a configured inactivity period — so leaving the tab open doesn't leave the vault exposed indefinitely.

### 🔐 **Account Lockout**
After a configurable number of failed face login attempts, the account enters a temporary lockout window. This prevents brute-forcing by repeatedly presenting different face photos.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│              Browser (Client)                │
│                                              │
│  React (Vite) + Tailwind CSS                 │
│  face-api.js  ←─── face descriptor math      │
│  MediaPipe    ←─── liveness (blink/turn)     │
│                                              │
│  API calls ──────────────────────────────┐  │
└──────────────────────────────────────────┼──┘
                                           │
                             HTTP (REST)   │
                                           ▼
┌──────────────────────────────────────────────┐
│              FastAPI Backend                  │
│                                              │
│  /api/auth      ── register, login, logout   │
│  /api/vault     ── CRUD credentials          │
│  /api/audit     ── activity log              │
│  /api/face      ── reset face data           │
│                                              │
│  SQLAlchemy ORM + SQLite (demo)              │
│  JWT sessions + AES vault encryption        │
│  Static file serving (React build)          │
└──────────────────────────────────────────────┘
```

In the Render deployment, the FastAPI backend also **serves the React build** as static files — so it's a single service, single URL, single deploy.

---

## 🛠️ Tech Stack

### Frontend

| Technology | Role |
|:-----------|:-----|
| **React 18** | Component-based UI |
| **Vite** | Build tool + dev server |
| **Tailwind CSS** | Utility-first styling |
| **face-api.js** | Face descriptor extraction + matching |
| **MediaPipe Tasks Vision** | Liveness: blink detection + head pose |
| **Lucide React** | Icon library |

### Backend

| Technology | Role |
|:-----------|:-----|
| **FastAPI** | REST API framework |
| **SQLAlchemy** | ORM + database abstraction |
| **SQLite** | Database (demo — swap for PostgreSQL in prod) |
| **JWT** | Session token authentication |
| **Uvicorn** | ASGI server |
| **Python cryptography** | AES vault encryption |

---

## 📁 Project Structure

```
Cipherface_Password_Manager/
│
├── 🐳 dockerfile             # Single-service container (optional)
├── 📄 netlify.toml           # Netlify config (if fronted separately)
│
├── backend/
│   ├── app/
│   │   ├── routers/          # auth, vault, audit, face reset
│   │   ├── utils/            # face matching, encryption helpers
│   │   ├── main.py           # FastAPI app + static file serving
│   │   ├── models.py         # SQLAlchemy ORM models
│   │   ├── schemas.py        # Pydantic request/response schemas
│   │   └── security.py       # JWT + password hashing utilities
│   ├── requirements.txt
│   └── run.py                # Entrypoint: builds frontend + starts uvicorn
│
└── frontend/
    ├── public/               # Static assets (face-api.js model weights)
    ├── src/
    │   ├── components/       # FaceCapture, VaultEntry, AuditLog, ...
    │   ├── context/          # AuthContext — global user session state
    │   ├── hooks/            # useFaceDetection, useVault, useAudit
    │   ├── lib/              # API client helpers
    │   └── pages/            # Register, Login, Dashboard, Vault, Audit
    ├── package.json
    └── vite.config.js
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- pip

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate        # macOS/Linux
# .venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Copy and fill environment variables
cp .env.example .env
# Edit .env with your own secret keys (see Environment Variables section)

# Start the backend
python run.py
```

Backend runs at: **http://127.0.0.1:8000**

Test it:
- `http://127.0.0.1:8000/docs` → Interactive API docs (Swagger UI)

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: **http://127.0.0.1:5173**

---

## ⚙️ Environment Variables

### Backend `.env`

```env
APP_NAME=CipherFace API
APP_ENV=development
DATABASE_URL=sqlite:///./cipherface.db

JWT_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=30

VAULT_ENCRYPTION_KEY=your-32-char-encryption-key-here

CORS_ORIGINS=http://localhost:5173

FACE_MODE=descriptor
FACE_MATCH_THRESHOLD=0.36
FACE_AVERAGE_THRESHOLD=0.40
FACE_SIDE_MIN_DISTANCE=0.05

LOGIN_MAX_ATTEMPTS=5
FACE_RESET_AFTER_ATTEMPTS=3
LOCKOUT_MINUTES=15
```

### Frontend `.env`

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

---

## ☁️ Deployment (Render — Single Service)

This app is deployed on **Render** as a single Web Service where FastAPI builds and serves the React frontend:

1. Push code to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Connect your GitHub repo
4. **Build command:** `pip install -r backend/requirements.txt && cd frontend && npm install && npm run build`
5. **Start command:** `python backend/run.py`
6. Add your environment variables in the Render dashboard
7. Hit **Deploy**

The `run.py` script handles building the React app and starting Uvicorn with static file serving from the `frontend/dist` folder.

> ⚠️ The live demo uses **SQLite** which is ephemeral on Render's free tier. Data resets on each deploy. For a persistent demo, switch `DATABASE_URL` to a PostgreSQL connection string.

---

## 📱 App Screens

| Screen | Description |
|:-------|:------------|
| **Register** | Face enrollment + credential creation |
| **Login** | Liveness challenge + face match |
| **Reset Face Data** | Re-enroll face without losing vault data |
| **Dashboard** | Overview of vault stats + recent audit events |
| **Vault Entries** | Full CRUD for stored credentials |
| **Audit Trail** | Chronological log of all account activity |

---

## 🌐 Browser Support

| Browser | Face Detection | Liveness | Recommended? |
|:--------|:--------------:|:--------:|:------------:|
| **Chrome (Desktop)** | ✅ | ✅ | ⭐⭐⭐ **Best** |
| **Edge** | ✅ | ✅ | ⭐⭐⭐ |
| **Firefox** | ✅ | ⚠️ | ⭐⭐ |
| **Safari** | ⚠️ | ⚠️ | ⭐ |
| **Mobile** | ⚠️ | ⚠️ | Not recommended |

> MediaPipe and face-api.js both rely on WebGL and `getUserMedia`. Desktop Chrome/Edge gives the most reliable experience.

---

## ⚠️ Important Disclaimer

This is an **academic / prototype project**, not a production-grade security product.

- Face matching threshold is tuned for demo convenience, not military-grade accuracy
- SQLite is used for simplicity — not suitable for multi-user production deployments
- The liveness detection reduces casual photo attacks but is not foolproof against sophisticated 3D spoofing
- **Do not store real passwords** in the live demo — treat it as a proof of concept

---

## 🗺️ Future Improvements

- 🗄️ Replace SQLite with PostgreSQL for persistent production storage
- 🔍 Stronger server-side liveness verification (IR depth maps, etc.)
- 📧 Email verification + password reset fallback
- 🔊 Voice + face multi-factor authentication
- 📊 Better audit log filtering, search, and export
- 🌐 Move from Render free tier to production-ready infrastructure
- 🧪 Add end-to-end tests for the auth flow

---

## 🤝 Contributing

Interested in improving CipherFace? Open an issue or PR. Some areas I'd love help with:

- Improving the face matching accuracy / threshold tuning
- Adding integration tests for the FastAPI routes
- Improving accessibility (keyboard nav, screen reader support)
- Building a proper production deployment guide

---

## 👤 Author

**Nitin Bhatti**

---

## 📜 License

This project is for **educational and academic demonstration purposes**. Feel free to fork it, study the code, and build on top of it for your own learning.

🔗 **Live:** [cipherface.onrender.com](https://cipherface.onrender.com)
📂 **Repo:** [github.com/nitinbhatti1907/cipherface_password_manager](https://github.com/nitinbhatti1907/cipherface_password_manager)
