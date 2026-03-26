from sqlalchemy.orm import Session
from app.models import AuditLog, User


def create_audit_log(
    db: Session,
    user: User,
    action: str,
    details: str | None = None,
    ip_address: str | None = None,
    success: bool = True,
) -> AuditLog:
    entry = AuditLog(
        user_id=user.id,
        action=action,
        details=details,
        ip_address=ip_address,
        success=success,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
