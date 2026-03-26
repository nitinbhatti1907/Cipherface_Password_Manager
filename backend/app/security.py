import base64
import hashlib
import hmac
import json
import os
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from fastapi import HTTPException, status
from app.config import get_settings

settings = get_settings()


def derive_aes_key(secret: str) -> bytes:
    try:
        if len(secret) > 40 and all(ch.isalnum() or ch in "+/=_-" for ch in secret):
            decoded = base64.urlsafe_b64decode(secret + "==")
            if len(decoded) in {16, 24, 32}:
                return decoded[:32].ljust(32, b"0")
    except Exception:
        pass
    return hashlib.sha256(secret.encode("utf-8")).digest()


def encrypt_secret(plaintext: str) -> tuple[str, str]:
    aesgcm = AESGCM(derive_aes_key(settings.VAULT_ENCRYPTION_KEY))
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    return (
        base64.b64encode(ciphertext).decode("utf-8"),
        base64.b64encode(nonce).decode("utf-8"),
    )


def decrypt_secret(ciphertext_b64: str, nonce_b64: str) -> str:
    aesgcm = AESGCM(derive_aes_key(settings.VAULT_ENCRYPTION_KEY))
    plaintext = aesgcm.decrypt(base64.b64decode(nonce_b64), base64.b64decode(ciphertext_b64), None)
    return plaintext.decode("utf-8")


def encode_face_descriptor(data) -> str:
    return json.dumps(data)


def decode_face_descriptor(raw: str):
    return json.loads(raw)


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    iterations = 200_000
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return "pbkdf2_sha256${}${}${}".format(
        iterations,
        base64.b64encode(salt).decode("utf-8"),
        base64.b64encode(digest).decode("utf-8"),
    )


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iterations, salt_b64, digest_b64 = stored_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False

        computed = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            base64.b64decode(salt_b64),
            int(iterations),
        )
        return hmac.compare_digest(
            base64.b64encode(computed).decode("utf-8"),
            digest_b64,
        )
    except Exception:
        return False


def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        subject = payload.get("sub")
        if not subject:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        return str(subject)
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token") from exc