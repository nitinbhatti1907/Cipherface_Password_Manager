from fastapi import APIRouter
from app.schemas import (
    PasswordGenerateRequest,
    PasswordGenerateResponse,
    PasswordStrengthRequest,
    PasswordStrengthResponse,
)
from app.utils.password_tools import analyze_password, generate_password

router = APIRouter(prefix="/api/password", tags=["password-tools"])


@router.post("/strength", response_model=PasswordStrengthResponse)
def strength(payload: PasswordStrengthRequest):
    return analyze_password(payload.password)


@router.post("/generate", response_model=PasswordGenerateResponse)
def generate(payload: PasswordGenerateRequest):
    password = generate_password(length=payload.length, include_symbols=payload.include_symbols)
    return PasswordGenerateResponse(password=password, analysis=analyze_password(password))
