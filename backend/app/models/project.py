import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Integer, Text, DateTime, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    client: Mapped[str] = mapped_column(String(200), nullable=False)
    client_details: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    platform: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    project_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="In Progress", nullable=False)
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    priority: Mapped[str] = mapped_column(String(50), default="Medium", nullable=False)
    start_date: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    end_date: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    duration_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    manager_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    manager_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    manager_role: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    manager_avatar: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    assigned_employees: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(JSONB, nullable=True)
    technologies: Mapped[Optional[List[str]]] = mapped_column(JSONB, nullable=True)
    platforms: Mapped[Optional[List[str]]] = mapped_column(JSONB, nullable=True)
    sub_portals: Mapped[Optional[List[str]]] = mapped_column(JSONB, nullable=True)
    modules: Mapped[Optional[List[str]]] = mapped_column(JSONB, nullable=True)
    sprints: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(JSONB, nullable=True)
    work_types: Mapped[Optional[List[str]]] = mapped_column(JSONB, nullable=True)
    created_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class ProjectTask(Base):
    __tablename__ = "project_tasks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    project_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    project_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    module: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    sprint: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    work_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="To Do", nullable=False)
    priority: Mapped[str] = mapped_column(String(50), default="Medium", nullable=False)
    assignee_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    assignee_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    assignee_email: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    assignee_avatar: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    assignee_role: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    due_date: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    start_date: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    daily_logs: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(JSONB, nullable=True)
    task_notifications: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(JSONB, nullable=True)
    estimated_hours: Mapped[Optional[int]] = mapped_column(Integer, default=0, nullable=True)
    logged_hours: Mapped[Optional[int]] = mapped_column(Integer, default=0, nullable=True)
    developer_deadline: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_escalated: Mapped[bool] = mapped_column(default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
