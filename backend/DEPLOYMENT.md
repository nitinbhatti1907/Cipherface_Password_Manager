# Backend deployment notes

## Recommended hosting
Because the project targets Netlify for the frontend and uses Python for the backend, deploy the API to a Python-friendly free host such as:
- Render
- Railway
- Fly.io

## Start command
```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Environment variables
Set these at minimum:
- `DATABASE_URL`
- `JWT_SECRET`
- `VAULT_ENCRYPTION_KEY`
- `CORS_ORIGINS`
- `FACE_MODE=descriptor`

## Database
For production, use PostgreSQL instead of SQLite.

## CORS
Set `CORS_ORIGINS` to your deployed Netlify site URL.
Example:
```text
https://your-site-name.netlify.app
```
