import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.master_plan import MasterPlan
from app.schemas.master_plan import (
    MasterPlanCreate,
    MasterPlanUpdate,
    MasterPlanResponse,
)

router = APIRouter(prefix="/master-plans", tags=["Master Plan"])


@router.get("", response_model=List[MasterPlanResponse])
def list_master_plans(
    project_id: Optional[uuid.UUID] = None,
    project_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all Master Plan entries with optional project filtering."""
    query = select(MasterPlan)
    if project_id:
        query = query.where(MasterPlan.project_id == project_id)
    if project_name:
        query = query.where(MasterPlan.project_name.ilike(f"%{project_name.strip()}%"))

    master_plans = db.execute(query.order_by(desc(MasterPlan.created_at))).scalars().all()
    return master_plans


@router.get("/{plan_id}", response_model=MasterPlanResponse)
def get_master_plan(
    plan_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve single Master Plan entry by ID."""
    plan = db.execute(
        select(MasterPlan).where(MasterPlan.id == plan_id)
    ).scalar_one_or_none()

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Master Plan not found.",
        )
    return plan


@router.post("", response_model=MasterPlanResponse, status_code=status.HTTP_201_CREATED)
def create_master_plan(
    payload: MasterPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new Master Plan entry."""
    new_plan = MasterPlan(
        project_id=payload.project_id,
        project_name=payload.project_name.strip() if payload.project_name else None,
        work_type=payload.work_type.strip(),
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)
    return new_plan


@router.put("/{plan_id}", response_model=MasterPlanResponse)
def update_master_plan(
    plan_id: uuid.UUID,
    payload: MasterPlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing Master Plan entry."""
    plan = db.execute(
        select(MasterPlan).where(MasterPlan.id == plan_id)
    ).scalar_one_or_none()

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Master Plan not found.",
        )

    if payload.project_id is not None:
        plan.project_id = payload.project_id
    if payload.project_name is not None:
        plan.project_name = payload.project_name.strip() if payload.project_name else None
    if payload.work_type is not None:
        plan.work_type = payload.work_type.strip()

    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_master_plan(
    plan_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a Master Plan entry."""
    plan = db.execute(
        select(MasterPlan).where(MasterPlan.id == plan_id)
    ).scalar_one_or_none()

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Master Plan not found.",
        )

    db.delete(plan)
    db.commit()
    return None
