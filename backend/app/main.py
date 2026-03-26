from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import Base, engine
from app.routers import audit_logs, auth, credentials, password_tools

settings = get_settings()

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIST_DIR = BASE_DIR / "frontend_dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(credentials.router)
app.include_router(password_tools.router)
app.include_router(audit_logs.router)


@app.get("/api/health")
def health():
    return {
        "name": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "status": "ok",
        "docs": "/docs",
    }


if FRONTEND_DIST_DIR.exists():
    assets_dir = FRONTEND_DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/favicon.ico", include_in_schema=False)
    def favicon():
        favicon_path = FRONTEND_DIST_DIR / "favicon.ico"
        if favicon_path.exists():
            return FileResponse(favicon_path)
        return FileResponse(FRONTEND_DIST_DIR / "index.html")

    @app.get("/", include_in_schema=False)
    def serve_index():
        return FileResponse(FRONTEND_DIST_DIR / "index.html")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        # Do not interfere with API/docs routes
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return {"detail": "Not Found"}
        target = FRONTEND_DIST_DIR / full_path
        if target.exists() and target.is_file():
            return FileResponse(target)
        return FileResponse(FRONTEND_DIST_DIR / "index.html")
else:
    @app.get("/")
    def root():
        return {
            "name": settings.APP_NAME,
            "environment": settings.APP_ENV,
            "status": "ok",
            "docs": "/docs",
        }