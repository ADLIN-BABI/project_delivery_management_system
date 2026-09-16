import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.user import User
from app.models.enums import UserRole, UserStatus
from app.models.audit_log import AuditLog
from app.schemas.user import (
    UserResponse,
    AdminCreateRequest,
    AdminUpdateRequest,
    AdminStatusUpdateRequest,
    AuditLogResponse,
)
from app.api.deps import get_current_super_admin, get_current_admin, get_current_user

router = APIRouter(prefix="/admins", tags=["Admin & User Management"])


@router.get("", response_model=List[UserResponse], summary="List All Users / Admins")
def list_admins(
    role: Optional[UserRole] = None,
    status: Optional[UserStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lists registered users and admins with optional role/status filters."""
    query = select(User).order_by(desc(User.created_at))
    if role:
        query = query.where(User.role == role)
    if status:
        query = query.where(User.status == status)

    users = db.execute(query).scalars().all()
    return users


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Create New Admin")
def create_admin(
    payload: AdminCreateRequest,
    request: Request,
    db: Session = Depends(get_db),
    super_admin: User = Depends(get_current_super_admin),
):
    """Super Admin creates a new Admin or Employee account."""
    existing_user = db.execute(
        select(User).where(User.email == payload.email.strip().lower())
    ).scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email '{payload.email}' already exists.",
        )

    new_user = User(
        full_name=payload.full_name.strip(),
        email=payload.email.strip().lower(),
        password_hash=get_password_hash(payload.password),
        phone=payload.phone.strip() if payload.phone else None,
        role=payload.role,
        status=UserStatus.ACTIVE,
    )
    db.add(new_user)
    db.flush()

    # Record Audit Log
    client_ip = request.client.host if request.client else None
    audit = AuditLog(
        user_id=super_admin.id,
        action="CREATE_ADMIN",
        entity_type="User",
        entity_id=str(new_user.id),
        new_values={
            "full_name": new_user.full_name,
            "email": new_user.email,
            "role": new_user.role.value,
            "status": new_user.status.value,
        },
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(audit)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.put("/{admin_id}", response_model=UserResponse, summary="Edit Admin Details")
def update_admin(
    admin_id: uuid.UUID,
    payload: AdminUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    super_admin: User = Depends(get_current_super_admin),
):
    """Super Admin updates an administrator's profile information."""
    target_user = db.execute(select(User).where(User.id == admin_id)).scalar_one_or_none()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target user not found.",
        )

    old_values = {
        "full_name": target_user.full_name,
        "email": target_user.email,
        "phone": target_user.phone,
        "role": target_user.role.value,
        "status": target_user.status.value,
    }

    if payload.full_name is not None:
        target_user.full_name = payload.full_name.strip()
    if payload.email is not None:
        # Check if email is already taken by another user
        new_email = payload.email.strip().lower()
        if new_email != target_user.email:
            existing = db.execute(select(User).where(User.email == new_email)).scalar_one_or_none()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Email '{payload.email}' is already in use by another user.",
                )
            target_user.email = new_email
    if payload.password is not None and len(payload.password.strip()) >= 6:
        target_user.password_hash = get_password_hash(payload.password.strip())
    if payload.phone is not None:
        target_user.phone = payload.phone.strip() if payload.phone else None
    if payload.profile_image is not None:
        target_user.profile_image = payload.profile_image
    if payload.status is not None:
        target_user.status = payload.status
    if payload.role is not None:
        # Prevent downgrading the main super admin if it's the only one
        if target_user.role == UserRole.SUPER_ADMIN and payload.role != UserRole.SUPER_ADMIN:
            super_admin_count = db.execute(
                select(User).where(User.role == UserRole.SUPER_ADMIN)
            ).scalars().all()
            if len(super_admin_count) <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot downgrade the sole Super Admin of the system.",
                )
        target_user.role = payload.role

    # Record Audit Log
    client_ip = request.client.host if request.client else None
    audit = AuditLog(
        user_id=super_admin.id,
        action="UPDATE_ADMIN",
        entity_type="User",
        entity_id=str(target_user.id),
        old_values=old_values,
        new_values={
            "full_name": target_user.full_name,
            "email": target_user.email,
            "phone": target_user.phone,
            "role": target_user.role.value,
            "status": target_user.status.value,
        },
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(audit)
    db.commit()
    db.refresh(target_user)
    return target_user


@router.delete("/{admin_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete User / Administrator")
def delete_admin(
    admin_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    super_admin: User = Depends(get_current_super_admin),
):
    """Super Admin deletes a user account from PostgreSQL."""
    target_user = db.execute(select(User).where(User.id == admin_id)).scalar_one_or_none()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target user not found.",
        )

    if target_user.id == super_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own active Super Admin account.",
        )

    if target_user.role == UserRole.SUPER_ADMIN:
        super_admin_count = db.execute(
            select(User).where(User.role == UserRole.SUPER_ADMIN)
        ).scalars().all()
        if len(super_admin_count) <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete the sole Super Admin of the system.",
            )

    client_ip = request.client.host if request.client else None
    audit = AuditLog(
        user_id=super_admin.id,
        action="DELETE_ADMIN",
        entity_type="User",
        entity_id=str(target_user.id),
        old_values={
            "full_name": target_user.full_name,
            "email": target_user.email,
            "role": target_user.role.value,
        },
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(audit)
    db.delete(target_user)
    db.commit()
    return None


@router.patch("/{admin_id}/status", response_model=UserResponse, summary="Change Status: Activate / Deactivate / Ban Admin")
def update_admin_status(
    admin_id: uuid.UUID,
    payload: AdminStatusUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    super_admin: User = Depends(get_current_super_admin),
):
    """
    Super Admin activates, deactivates, or bans an account.
    Restricted: Super Admin cannot ban or deactivate their own active account.
    """
    target_user = db.execute(select(User).where(User.id == admin_id)).scalar_one_or_none()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target user not found.",
        )

    if target_user.id == super_admin.id and payload.status in (UserStatus.BANNED, UserStatus.INACTIVE):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate or ban your own Super Admin account.",
        )

    old_status = target_user.status.value
    target_user.status = payload.status

    action_name = f"ADMIN_STATUS_{payload.status.value}"
    client_ip = request.client.host if request.client else None
    audit = AuditLog(
        user_id=super_admin.id,
        action=action_name,
        entity_type="User",
        entity_id=str(target_user.id),
        old_values={"status": old_status},
        new_values={"status": payload.status.value},
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(audit)
    db.commit()
    db.refresh(target_user)
    return target_user


@router.get("/audit-logs/recent", response_model=List[AuditLogResponse], summary="Get Recent Security & Action Audit Logs")
def get_audit_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Returns recent audit logs recorded across the platform."""
    logs = db.execute(
        select(AuditLog).order_by(desc(AuditLog.created_at)).limit(limit)
    ).scalars().all()
    return logs
