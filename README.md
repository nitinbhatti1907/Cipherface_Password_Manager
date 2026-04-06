# CipherFace - Face Login + Encrypted Vault

CipherFace is a prototype model that combines **face-based authentication** with an **encrypted password vault**. It allows users to register with secure face enrollment, log in using face verification, store encrypted credentials, and track activity through audit logs.

## Live Demo

[https://cipherface.onrender.com/](https://cipherface.onrender.com/)

## Features

- Face-based user registration and login
- MediaPipe-based liveness checks
- Anti-photo login improvement using blink + head movement flow
- Encrypted password vault
- Add, edit, delete, and view stored credentials
- Audit trail for login, logout, and vault actions
- Auto logout after inactivity
- Modern dashboard UI
- Single-service deployment for frontend + backend

## Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- face-api.js
- MediaPipe Tasks Vision
- Lucide React

### Backend
- FastAPI
- SQLAlchemy
- SQLite
- JWT authentication
- Uvicorn

## Project Structure

```bash
Cipherface_Password_Manager/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   ├── utils/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── security.py
│   │   └── ...
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
├── Dockerfile
└── README.md
```

## How It Works

### 1. Face Enrollment
During registration, the user completes a face capture flow that collects:
- front face
- side face poses
- liveness-based movement checks

This helps reduce spoofing attempts and improves face profile quality.

### 2. Face Login
During login, the user:
- aligns the face in front of the camera
- performs a blink
- performs a head turn challenge
- returns to a front-facing position

Only after this challenge passes is the face descriptor used for login.

### 3. Encrypted Vault
After successful login, users can:
- store credentials
- update credentials
- delete credentials
- view hidden password details

### 4. Audit Logging
Important actions are recorded, including:
- registration
- login success/failure
- logout
- vault operations
- face reset actions

## Local Setup

### Prerequisites
- Node.js
- Python 3.x
- pip

### Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

Backend runs at:

```bash
http://127.0.0.1:8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```bash
http://127.0.0.1:5173
```

## Environment Variables

### Backend `.env`
Example:

```env
APP_NAME=CipherFace API
APP_ENV=development
DATABASE_URL=sqlite:///./cipherface.db
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=30
VAULT_ENCRYPTION_KEY=your-encryption-key
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
Example:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

## Deployment

This project is currently deployed as a **single Render service**, where:

- React frontend is built and served through FastAPI
- FastAPI handles API routes
- SQLite is used for demo purposes

Live link:

[https://cipherface.onrender.com/](https://cipherface.onrender.com/)

## Important Note

This project is a **course prototype / demo project**. The deployed version uses SQLite for simplicity, which is fine for demonstration, but not ideal for production-scale persistent storage.

## Screens Included in the App

- Register
- Login
- Reset Face Data
- Dashboard
- Vault Entries
- Audit Trail

## Future Improvements

- Replace SQLite with PostgreSQL for production
- Move from demo hosting to production-ready infrastructure
- Stronger server-side liveness verification
- Email verification and password reset flow
- Better biometric anti-spoofing support
- Improved activity filtering and search

## Author

**Nitin Bhatti**

## License

This project is for educational and academic demonstration purposes.
