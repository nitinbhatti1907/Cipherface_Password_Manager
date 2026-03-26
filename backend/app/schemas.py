from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, model_validator


class UserOut(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    created_at: datetime
    last_login_at: datetime | None = None

    model_config = {"from_attributes": True}


class FaceProfilePayload(BaseModel):
    center: list[float] = Field(min_length=8)
    left: list[float] = Field(min_length=8)
    right: list[float] = Field(min_length=8)


class AuthRegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    confirm_password: str = Field(min_length=6, max_length=128)
    face_profile: FaceProfilePayload
    challenge_passed: bool = False

    @model_validator(mode="after")
    def validate_passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Password and confirm password must match")
        return self


class AuthLoginRequest(BaseModel):
    email: EmailStr
    descriptor: list[float] = Field(min_length=8)
    challenge_passed: bool = False


class FaceResetRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    face_profile: FaceProfilePayload
    challenge_passed: bool = False


class FaceResetResponse(BaseModel):
    message: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class CredentialBase(BaseModel):
    site_name: str = Field(min_length=1, max_length=255)
    site_url: str | None = Field(default=None, max_length=500)
    username: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=1, max_length=512)
    notes: str | None = None


class CredentialCreate(CredentialBase):
    pass


class CredentialUpdate(CredentialBase):
    pass


class CredentialOut(BaseModel):
    id: str
    site_name: str
    site_url: str | None = None
    username: str
    password: str
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CredentialsListResponse(BaseModel):
    items: list[CredentialOut]


class PasswordStrengthRequest(BaseModel):
    password: str


class PasswordGenerateRequest(BaseModel):
    length: int = Field(default=18, ge=12, le=64)
    include_symbols: bool = True


class PasswordStrengthResponse(BaseModel):
    score: int
    label: str
    feedback: list[str]


class PasswordGenerateResponse(BaseModel):
    password: str
    analysis: PasswordStrengthResponse


class AuditLogOut(BaseModel):
    id: str
    action: str
    details: str | None = None
    ip_address: str | None = None
    success: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditLogListResponse(BaseModel):
    items: list[AuditLogOut]