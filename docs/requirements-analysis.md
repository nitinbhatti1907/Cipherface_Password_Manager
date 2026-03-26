# CipherFace Requirements Analysis

## Core objective
Build a web-based password manager that replaces traditional password-only account access with face-based login while protecting stored credentials using encryption.

## Functional requirements extracted from the proposal

### 1. User enrollment
- Register a user with camera capture
- Convert capture into a secure face template / embedding
- Do not store raw face images by default

### 2. User login
- Verify a user with face comparison
- Include a basic liveness step
- Rate limit repeated failures
- Temporarily lock the account after repeated failures

### 3. Credential vault
- Add credentials
- Edit credentials
- Delete credentials
- View credentials in a structured dashboard
- Fields: site name, URL, username, password, notes

### 4. Encryption and key handling
- Encrypt passwords before storage
- Use authenticated encryption such as AES-GCM
- Keep key handling separate from raw DB contents

### 5. Password tools
- Password strength analyzer
- Password generator

### 6. Session security
- Auto logout after inactivity
- Backend token expiration

### 7. Audit logs
- Record enrollment, login success/failure, logout, auto logout
- Record add, edit, delete, and view-related vault actions
- Show audit history to the user

### 8. Testing requirements
- Unit tests for encryption and password utilities
- Integration/system testing
- Security checks for:
  - encrypted DB storage
  - rate limiting
  - session expiration
  - input validation

## Non-functional requirements
- Clean modern web UI
- React-based frontend
- Python-based backend
- PostgreSQL-ready storage
- Netlify-friendly frontend deployment
- Course-demo friendly implementation

## Final implementation choices

### Frontend
- React + Vite + Tailwind CSS
- Framer Motion for interaction polish
- face-api.js in the browser for lightweight, deployable biometric capture

### Backend
- FastAPI + SQLAlchemy
- AES-GCM encryption using `cryptography`
- PostgreSQL-ready with SQLite local fallback
- JWT auth and audit logging

## Practical deployment adjustment
The proposal asks for React + Python. That is preserved.
For deployment practicality, the React app is packaged for Netlify and the Python API is packaged for a Python-friendly host.

## Mapping from requirements to folders
- `frontend/src/components/FaceCapturePanel.jsx` -> enrollment/login camera flow
- `backend/app/routers/auth.py` -> face auth, lockout, login audit events
- `backend/app/routers/credentials.py` -> vault CRUD
- `backend/app/security.py` -> AES-GCM encryption and JWT
- `backend/app/utils/password_tools.py` -> password analyzer and generator
- `frontend/src/hooks/useIdleLogout.js` -> inactivity logout UX
- `backend/app/routers/audit_logs.py` -> audit history API
- `backend/tests/` -> starter test coverage
