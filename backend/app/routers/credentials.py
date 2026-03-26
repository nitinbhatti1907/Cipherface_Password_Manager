from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user, get_request_ip
from app.models import Credential, User
from app.schemas import CredentialCreate, CredentialOut, CredentialsListResponse, CredentialUpdate
from app.security import decrypt_secret, encrypt_secret
from app.utils.audit import create_audit_log

router = APIRouter(prefix="/api/credentials", tags=["credentials"])


def hydrate_credential(item: Credential) -> CredentialOut:
    return CredentialOut(
        id=item.id,
        site_name=item.site_name,
        site_url=item.site_url,
        username=item.username,
        password=decrypt_secret(item.encrypted_password, item.nonce),
        notes=item.notes,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.get("", response_model=CredentialsListResponse)
def list_credentials(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = (
        db.query(Credential)
        .filter(Credential.user_id == current_user.id)
        .order_by(Credential.updated_at.desc())
        .all()
    )
    return CredentialsListResponse(items=[hydrate_credential(item) for item in items])


@router.post("", response_model=CredentialOut)
def create_credential(
    payload: CredentialCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    encrypted_password, nonce = encrypt_secret(payload.password)
    item = Credential(
        user_id=current_user.id,
        site_name=payload.site_name,
        site_url=payload.site_url,
        username=payload.username,
        encrypted_password=encrypted_password,
        nonce=nonce,
        notes=payload.notes,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    create_audit_log(
        db,
        current_user,
        action="credential_add",
        details=f"Created credential for {payload.site_name}",
        ip_address=get_request_ip(request),
        success=True,
    )
    return hydrate_credential(item)


@router.put("/{credential_id}", response_model=CredentialOut)
def update_credential(
    credential_id: str,
    payload: CredentialUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = (
        db.query(Credential)
        .filter(Credential.id == credential_id, Credential.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credential not found")

    encrypted_password, nonce = encrypt_secret(payload.password)
    item.site_name = payload.site_name
    item.site_url = payload.site_url
    item.username = payload.username
    item.encrypted_password = encrypted_password
    item.nonce = nonce
    item.notes = payload.notes
    db.commit()
    db.refresh(item)

    create_audit_log(
        db,
        current_user,
        action="credential_edit",
        details=f"Updated credential for {payload.site_name}",
        ip_address=get_request_ip(request),
        success=True,
    )
    return hydrate_credential(item)


@router.delete("/{credential_id}")
def delete_credential(
    credential_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = (
        db.query(Credential)
        .filter(Credential.id == credential_id, Credential.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credential not found")

    site_name = item.site_name
    db.delete(item)
    db.commit()

    create_audit_log(
        db,
        current_user,
        action="credential_delete",
        details=f"Deleted credential for {site_name}",
        ip_address=get_request_ip(request),
        success=True,
    )
    return {"ok": True}
