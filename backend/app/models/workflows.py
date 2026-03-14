import uuid
from datetime import datetime
from typing import Optional, Any
from sqlalchemy import String, ForeignKey, Text, JSON, DateTime, Enum as SQLEnum
from sqlalchemy.types import Uuid
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import BaseModel
from app.models.domain import WorkflowName
import enum

class WorkflowStatus(str, enum.Enum):
    pending = "pending"
    active = "active"
    paused = "paused"
    completed = "completed"
    failed = "failed"

class TaskStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    failed = "failed"
    skipped = "skipped"

class WorkflowInstance(BaseModel):
    __tablename__ = "workflow_instances"
    org_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("organizations.id"))
    workflow_name: Mapped[WorkflowName] = mapped_column(SQLEnum(WorkflowName))
    entity_id: Mapped[str] = mapped_column(String(255), nullable=True) # E.g., Vendor ID
    entity_type: Mapped[str] = mapped_column(String(100), nullable=True) # E.g., 'vendor', 'asset'
    status: Mapped[WorkflowStatus] = mapped_column(SQLEnum(WorkflowStatus), default=WorkflowStatus.active)
    current_step: Mapped[str] = mapped_column(String(100)) # e.g., 'inventory', 'tiering'
    state_data: Mapped[dict] = mapped_column(JSON, nullable=True) # payload across steps
    started_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    completed_at: Mapped[datetime] = mapped_column(nullable=True)

class WorkflowTask(BaseModel):
    __tablename__ = "workflow_tasks"
    workflow_instance_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("workflow_instances.id"))
    step_id: Mapped[str] = mapped_column(String(100))
    action: Mapped[str] = mapped_column(String(255))
    status: Mapped[TaskStatus] = mapped_column(SQLEnum(TaskStatus), default=TaskStatus.pending)
    assigned_to: Mapped[str] = mapped_column(String(255), nullable=True)
    result_data: Mapped[dict] = mapped_column(JSON, nullable=True)
    error_message: Mapped[str] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(nullable=True)
    completed_at: Mapped[datetime] = mapped_column(nullable=True)
