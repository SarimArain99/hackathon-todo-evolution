"""
SQLModel entities for Hackathon Todo Evolution.

Includes User (reference only - managed by Better Auth) and Task entities
with Pydantic schemas for API operations.
"""

import json
from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator
from sqlmodel import Field, SQLModel


# =============================================================================
# Table Models (Database)
# =============================================================================

class User(SQLModel, table=True):
    """
    User entity - REFERENCE ONLY.

    Better Auth manages the user table directly.
    This model is for reference and foreign key relationships.

    Note: In production, Better Auth creates its own user table.
    This model should match Better Auth's schema.
    The password_hash is optional since Better Auth manages passwords
    and we don't need to store it here for JWT-based auth.
    """
    __tablename__ = "user"

    id: str = Field(default=None, primary_key=True)  # UUID string
    email: EmailStr = Field(unique=True, index=True)
    name: str = Field(max_length=100)
    password_hash: Optional[str] = Field(default=None, exclude=True)  # Optional - managed by Better Auth
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Task(SQLModel, table=True):
    """
    Task entity with user isolation.

    Each task belongs to a user via user_id foreign key.
    Supports priority, tags, due dates, and recurrence rules.
    """
    __tablename__ = "task"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)

    # Core fields
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: bool = Field(default=False, index=True)

    # Enhanced fields (stored as JSON strings for SQLite compatibility)
    priority: str = Field(default="medium", max_length=10)  # low, medium, high
    tags: Optional[str] = Field(default=None)  # JSON string array
    due_date: Optional[datetime] = None
    recurrence_rule: Optional[str] = None  # iCal RRULE format

    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# =============================================================================
# Pydantic Schemas (API Input/Output)
# =============================================================================

class TaskBase(SQLModel):
    """Base fields for Task operations."""
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: bool = Field(default=False)
    priority: str = Field(default="medium")
    due_date: Optional[datetime] = None
    tags: list[str] = Field(default_factory=list)


class TaskCreate(TaskBase):
    """Schema for creating a new task."""
    recurrence_rule: Optional[str] = None


class TaskUpdate(SQLModel):
    """Schema for updating a task - all fields optional."""
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: Optional[bool] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    tags: Optional[list[str]] = None
    recurrence_rule: Optional[str] = None


class TaskRead(TaskBase):
    """Schema for task responses - includes id, user_id, timestamps."""
    id: int
    user_id: str
    recurrence_rule: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # Handle tags conversion from database JSON string to list
    @field_validator('tags', mode='before')
    @classmethod
    def parse_tags(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return []
        return v or []


class TaskList(SQLModel):
    """Schema for task list responses."""
    tasks: list[TaskRead]
    total: int


# =============================================================================
# Auth Schemas
# =============================================================================

class TokenPayload(BaseModel):
    """JWT token payload structure."""
    sub: str  # user ID
    email: str
    exp: int


class UserRead(SQLModel):
    """Schema for user responses."""
    id: str
    email: str
    name: str
    created_at: datetime


class UserCreate(SQLModel):
    """Schema for user registration."""
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(min_length=1, max_length=100)


class UserLogin(SQLModel):
    """Schema for user login."""
    email: EmailStr
    password: str
