from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models import AuditLog, User
from app.schemas import AuditLogListResponse

router = APIRouter(prefix="/api/audit-logs", tags=["audit-logs"])


@router.get("", response_model=AuditLogListResponse)
def list_audit_logs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = (
        db.query(AuditLog)
        .filter(AuditLog.user_id == current_user.id)
        .order_by(AuditLog.created_at.desc())
        .limit(50)
        .all()
    )
    return AuditLogListResponse(items=items)
