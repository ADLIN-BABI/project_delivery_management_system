import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.delivery import Delivery

router = APIRouter(prefix="/deliveries", tags=["Delivery Management"])


class DeliveryCreateRequest(BaseModel):
    deliveryId: Optional[str] = None
    project: str
    agent: Optional[Dict[str, Any]] = None
    destination: str
    deliveryDate: Optional[str] = None
    status: Optional[str] = "Pending"
    priority: Optional[str] = "Standard"
    itemsCount: Optional[int] = 1
    notes: Optional[str] = None


class DeliveryResponse(BaseModel):
    id: str
    deliveryId: str
    project: str
    agent: Dict[str, Any]
    destination: str
    deliveryDate: Optional[str] = None
    status: str
    priority: str
    itemsCount: int
    notes: Optional[str] = None
    created_at: Optional[str] = None


@router.get("", response_model=List[DeliveryResponse])
def list_deliveries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all deliveries from PostgreSQL."""
    deliveries = db.execute(
        select(Delivery).order_by(desc(Delivery.created_at))
    ).scalars().all()

    return [
        DeliveryResponse(
            id=str(d.id),
            deliveryId=d.delivery_id,
            project=d.project,
            agent={
                "name": d.agent_name or "Dispatcher",
                "avatar": d.agent_avatar or "",
                "phone": d.agent_phone or "",
            },
            destination=d.destination,
            deliveryDate=d.delivery_date,
            status=d.status,
            priority=d.priority,
            itemsCount=d.items_count,
            notes=d.notes,
            created_at=d.created_at.isoformat() if d.created_at else None,
        )
        for d in deliveries
    ]


@router.post("", response_model=DeliveryResponse, status_code=status.HTTP_201_CREATED)
def create_delivery(
    payload: DeliveryCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a delivery in PostgreSQL."""
    delivery_code = payload.deliveryId
    if not delivery_code:
        delivery_code = f"DEL-{uuid.uuid4().hex[:4].upper()}"

    agent_data = payload.agent or {}

    new_delivery = Delivery(
        delivery_id=delivery_code,
        project=payload.project.strip(),
        agent_name=agent_data.get("name"),
        agent_avatar=agent_data.get("avatar"),
        agent_phone=agent_data.get("phone"),
        destination=payload.destination.strip(),
        delivery_date=payload.deliveryDate,
        status=payload.status or "Pending",
        priority=payload.priority or "Standard",
        items_count=payload.itemsCount or 1,
        notes=payload.notes,
    )

    db.add(new_delivery)
    db.commit()
    db.refresh(new_delivery)

    return DeliveryResponse(
        id=str(new_delivery.id),
        deliveryId=new_delivery.delivery_id,
        project=new_delivery.project,
        agent={
            "name": new_delivery.agent_name or "Dispatcher",
            "avatar": new_delivery.agent_avatar or "",
            "phone": new_delivery.agent_phone or "",
        },
        destination=new_delivery.destination,
        deliveryDate=new_delivery.delivery_date,
        status=new_delivery.status,
        priority=new_delivery.priority,
        itemsCount=new_delivery.items_count,
        notes=new_delivery.notes,
        created_at=new_delivery.created_at.isoformat() if new_delivery.created_at else None,
    )


@router.patch("/{delivery_id}/status", response_model=DeliveryResponse)
def update_delivery_status(
    delivery_id: str,
    payload: Dict[str, str],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update status of a delivery."""
    try:
        uid = uuid.UUID(delivery_id)
        d = db.get(Delivery, uid)
    except ValueError:
        d = db.execute(select(Delivery).where(Delivery.delivery_id == delivery_id)).scalars().first()

    if not d:
        raise HTTPException(status_code=404, detail="Delivery not found")

    new_status = payload.get("status")
    if new_status:
        d.status = new_status
        db.commit()
        db.refresh(d)

    return DeliveryResponse(
        id=str(d.id),
        deliveryId=d.delivery_id,
        project=d.project,
        agent={
            "name": d.agent_name or "Dispatcher",
            "avatar": d.agent_avatar or "",
            "phone": d.agent_phone or "",
        },
        destination=d.destination,
        deliveryDate=d.delivery_date,
        status=d.status,
        priority=d.priority,
        itemsCount=d.items_count,
        notes=d.notes,
        created_at=d.created_at.isoformat() if d.created_at else None,
    )
