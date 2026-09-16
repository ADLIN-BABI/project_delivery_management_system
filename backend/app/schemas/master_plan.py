from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime


class MasterPlanBase(BaseModel):
    project_id: Optional[UUID] = None
    project_name: Optional[str] = None
    work_type: str


class MasterPlanCreate(MasterPlanBase):
    pass


class MasterPlanUpdate(BaseModel):
    project_id: Optional[UUID] = None
    project_name: Optional[str] = None
    work_type: Optional[str] = None


class MasterPlanResponse(MasterPlanBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
