from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.config import get_settings
from app.database import get_db
from app.dependencies import get_current_user, get_request_ip
from app.models import User
from app.schemas import (
    AuthLoginRequest,
    AuthRegisterRequest,
    AuthResponse,
    FaceResetRequest,
    FaceResetResponse,
    UserOut,
)
from app.security import (
    create_access_token,
    decode_face_descriptor,
    encode_face_descriptor,
    hash_password,
    verify_password,
)
from app.utils.audit import create_audit_log
from app.utils.face import compare_candidate_to_profile, validate_face_profile

router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()


@router.post("/register", response_model=AuthResponse)
def register(payload: AuthRegisterRequest, request: Request, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    if not payload.challenge_passed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Live registration challenge failed")

    try:
        face_profile = validate_face_profile(payload.face_profile.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    user = User(
        full_name=payload.full_name.strip(),
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        face_descriptor=encode_face_descriptor(face_profile),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    create_audit_log(
        db,
        user,
        action="enrollment_success",
        details="User completed strict registration with password and three-pose face enrollment.",
        ip_address=get_request_ip(request),
        success=True,
    )

    token = create_access_token(user.id)
    return AuthResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=AuthResponse)
def login(payload: AuthLoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid login attempt")

    ip_address = get_request_ip(request)
    now = datetime.utcnow()

    if user.lockout_until and user.lockout_until > now:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "message": f"Account temporarily locked. Try again after {user.lockout_until.isoformat()} UTC.",
                "failed_attempts": user.failed_attempts,
                "allow_face_reset": user.failed_attempts >= settings.FACE_RESET_AFTER_ATTEMPTS,
            },
        )

    if not payload.challenge_passed:
        create_audit_log(db, user, "login_failed", "Live login challenge failed.", ip_address, False)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Live login challenge failed")

    try:
        matched, metrics = compare_candidate_to_profile(
            decode_face_descriptor(user.face_descriptor),
            payload.descriptor,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    if not matched:
        user.failed_attempts += 1
        if user.failed_attempts >= settings.LOGIN_MAX_ATTEMPTS:
            user.lockout_until = now + timedelta(minutes=settings.LOCKOUT_MINUTES)
        db.commit()

        create_audit_log(
            db,
            user,
            "login_failed",
            (
                "Descriptor mismatch. "
                f"center={metrics['center_distance']:.4f}, "
                f"average={metrics['average_distance']:.4f}, "
                f"best={metrics['best_pose_distance']:.4f}"
            ),
            ip_address,
            False,
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "message": "Face verification failed",
                "failed_attempts": user.failed_attempts,
                "remaining_before_reset": max(settings.FACE_RESET_AFTER_ATTEMPTS - user.failed_attempts, 0),
                "allow_face_reset": user.failed_attempts >= settings.FACE_RESET_AFTER_ATTEMPTS,
            },
        )

    user.failed_attempts = 0
    user.lockout_until = None
    user.last_login_at = now
    db.commit()

    create_audit_log(
        db,
        user,
        "login_success",
        (
            "Descriptor verified. "
            f"center={metrics['center_distance']:.4f}, "
            f"average={metrics['average_distance']:.4f}, "
            f"best={metrics['best_pose_distance']:.4f}"
        ),
        ip_address,
        True,
    )
    token = create_access_token(user.id)
    return AuthResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/reset-face", response_model=FaceResetResponse)
def reset_face(payload: FaceResetRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No account found for this email")

    ip_address = get_request_ip(request)

    if user.failed_attempts < settings.FACE_RESET_AFTER_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Face reset becomes available only after {settings.FACE_RESET_AFTER_ATTEMPTS} failed face login attempts",
        )

    if not verify_password(payload.password, user.password_hash):
        create_audit_log(
            db,
            user,
            action="face_reset_failed",
            details="Password did not match during face reset.",
            ip_address=ip_address,
            success=False,
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password")

    if not payload.challenge_passed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Live reset challenge failed")

    try:
        face_profile = validate_face_profile(payload.face_profile.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    user.face_descriptor = encode_face_descriptor(face_profile)
    user.failed_attempts = 0
    user.lockout_until = None
    db.commit()

    create_audit_log(
        db,
        user,
        action="face_reset_success",
        details="User replaced face data after password verification and strict three-pose enrollment.",
        ip_address=ip_address,
        success=True,
    )

    return FaceResetResponse(message="Face data reset successfully. Please log in again.")


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {"user": UserOut.model_validate(current_user)}


@router.post("/logout")
def logout(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    create_audit_log(
        db,
        current_user,
        action="logout",
        details="User manually logged out.",
        ip_address=get_request_ip(request),
        success=True,
    )
    return {"ok": True}