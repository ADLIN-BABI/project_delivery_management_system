import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import String, Integer, DateTime, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Delivery(Base):
    __tablename__ = "deliveries"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    delivery_id: Mapped[str] = mapped_column(String(50), nullable=False)
    project: Mapped[str] = mapped_column(String(200), nullable=False)
    agent_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    agent_avatar: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    agent_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    destination: Mapped[str] = mapped_column(String(255), nullable=False)
    delivery_date: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="Pending", nullable=False)
    priority: Mapped[str] = mapped_column(String(50), default="Standard", nullable=False)
    items_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
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
