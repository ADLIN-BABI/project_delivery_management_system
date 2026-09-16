import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.client import Client
from app.schemas.client import ClientCreateRequest, ClientResponse, ClientUpdateRequest

router = APIRouter(prefix="/clients", tags=["Clients Directory"])


@router.get("", response_model=List[ClientResponse])
def list_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all clients from PostgreSQL."""
    clients = db.execute(
        select(Client).order_by(desc(Client.created_at))
    ).scalars().all()

    return [
        ClientResponse(
            id=str(c.id),
            company_name=c.company_name,
            contact_person=c.contact_person,
            email=c.email,
            phone=c.phone,
            address=c.address,
            active_projects=c.active_projects,
            status=c.status,
            avatar=c.avatar,
            created_at=c.created_at.isoformat() if c.created_at else None,
        )
        for c in clients
    ]


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
def create_client(
    payload: ClientCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Register a new client in PostgreSQL."""
    new_client = Client(
        company_name=payload.company_name.strip(),
        contact_person=payload.contact_person.strip(),
        email=payload.email.strip().lower(),
        phone=payload.phone.strip() if payload.phone else None,
        address=payload.address.strip() if payload.address else None,
        active_projects=payload.active_projects or 0,
        status=payload.status or "Active",
        avatar=payload.avatar or "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    )

    db.add(new_client)
    db.commit()
    db.refresh(new_client)

    return ClientResponse(
        id=str(new_client.id),
        company_name=new_client.company_name,
        contact_person=new_client.contact_person,
        email=new_client.email,
        phone=new_client.phone,
        address=new_client.address,
        active_projects=new_client.active_projects,
        status=new_client.status,
        avatar=new_client.avatar,
        created_at=new_client.created_at.isoformat() if new_client.created_at else None,
    )


@router.put("/{client_id}", response_model=ClientResponse)
def update_client(
    client_id: uuid.UUID,
    payload: ClientUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a client in PostgreSQL."""
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(client, key, value)

    db.commit()
    db.refresh(client)

    return ClientResponse(
        id=str(client.id),
        company_name=client.company_name,
        contact_person=client.contact_person,
        email=client.email,
        phone=client.phone,
        address=client.address,
        active_projects=client.active_projects,
        status=client.status,
        avatar=client.avatar,
        created_at=client.created_at.isoformat() if client.created_at else None,
    )


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(
    client_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a client from PostgreSQL."""
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    db.delete(client)
    db.commit()
    return None
