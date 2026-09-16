from typing import Optional
from pydantic import BaseModel, EmailStr


class ClientCreateRequest(BaseModel):
    company_name: str
    contact_person: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    active_projects: Optional[int] = 0
    status: Optional[str] = "Active"
    avatar: Optional[str] = None

class ClientUpdateRequest(BaseModel):
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    active_projects: Optional[int] = None
    status: Optional[str] = None
    avatar: Optional[str] = None


class ClientResponse(BaseModel):
    id: str
    company_name: str
    contact_person: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    active_projects: int
    status: str
    avatar: Optional[str] = None
    created_at: Optional[str] = None
