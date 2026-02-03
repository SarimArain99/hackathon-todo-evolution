"""
SQLModel entities for Hackathon Todo Evolution.

Includes User (reference only - managed by Better Auth) and Task entities
with Pydantic schemas for API operations.
"""

import json
from datetime import datetime
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

    Note: This model matches Better Auth's user table schema.
    Better Auth uses camelCase column names.
    """
    __tablename__ = "user"

    # Matches Better Auth user table schema (camelCase columns)
    id: str = Field(default=None, primary_key=True)  # UUID string
    email: str = Field(unique=True, index=True)
    name: str = Field(max_length=100)
    emailVerified: bool = Field(default=False)
    image: Optional[str] = Field(default=None)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


class Task(SQLModel, table=True):
    """
    Task entity with user isolation.

    Each task belongs to a user via user_id foreign key.
    Supports priority, tags, due dates, and recurrence rules.
    """
    __tablename__ = "task"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)

    # Recurrence support - self-reference for recurring task instances
    parent_task_id: Optional[int] = Field(
        default=None,
        foreign_key="task.id",
        index=True
    )

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
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Notification(SQLModel, table=True):
    """
    Notification entity for in-app alerts.

    Each notification belongs to a user and optionally references a task.
    Supports due date reminders and task completion notifications.
    """
    __tablename__ = "notification"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    task_id: Optional[int] = Field(default=None, foreign_key="task.id", index=True)

    # Content
    type: str = Field(max_length=50)  # due_date_reminder, task_completed
    title: str = Field(max_length=200)
    message: Optional[str] = Field(default=None, max_length=500)

    # State
    read: bool = Field(default=False, index=True)

    # Timestamp
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Conversation(SQLModel, table=True):
    """
    Conversation entity for AI chatbot sessions.

    Each conversation belongs to a user and contains multiple messages.
    Stores conversation metadata and timestamps.
    """
    __tablename__ = "conversation"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Message(SQLModel, table=True):
    """
    Message entity within a conversation.

    Stores user and AI messages with optional tool calls.
    The tool_calls field stores JSON array of tool invocations.
    """
    __tablename__ = "message"

    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversation.id", index=True)

    # Message content
    role: str = Field(max_length=20)  # "user" or "assistant"
    content: Optional[str] = Field(default=None, max_length=10000)
    tool_calls: Optional[str] = Field(default=None)  # JSON string array of tool calls

    # Timestamp
    created_at: datetime = Field(default_factory=datetime.utcnow)


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


class TaskReadExtended(TaskRead):
    """Extended task read schema with parent_task_id for recurrence."""
    parent_task_id: Optional[int] = None


# =============================================================================
# Notification Schemas
# =============================================================================

class NotificationBase(SQLModel):
    """Base fields for Notification operations."""
    type: str = Field(max_length=50)  # due_date_reminder, task_completed
    title: str = Field(max_length=200)
    message: Optional[str] = Field(default=None, max_length=500)


class NotificationCreate(NotificationBase):
    """Schema for internal notification creation."""
    task_id: Optional[int] = None


class NotificationUpdate(SQLModel):
    """Schema for updating notification read status."""
    read: bool


class NotificationRead(NotificationBase):
    """Schema for notification responses - includes id, user_id, timestamps."""
    id: int
    user_id: str
    task_id: Optional[int] = None
    read: bool
    created_at: datetime


class NotificationList(SQLModel):
    """Schema for notification list responses."""
    notifications: list[NotificationRead]
    total: int


class UnreadCountResponse(SQLModel):
    """Schema for unread notification count response."""
    count: int
    display_count: str  # "99+" if count > 99, otherwise str(count)


# =============================================================================
# Auth Schemas
# =============================================================================

class TokenPayload(BaseModel):
    """JWT token payload structure."""
    sub: str  # user ID
    email: str
    exp: int


class UserRead(SQLModel):
    """Schema for user responses - uses camelCase to match Better Auth."""
    id: str
    email: str
    name: str
    createdAt: datetime


class UserCreate(SQLModel):
    """Schema for user registration."""
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(min_length=1, max_length=100)


class UserLogin(SQLModel):
    """Schema for user login."""
    email: EmailStr
    password: str


# =============================================================================
# Chat Schemas (Phase III - AI Chatbot)
# =============================================================================

class ToolCall(SQLModel):
    """Schema for a tool call made by the AI agent."""
    name: str  # Tool function name (e.g., "add_task")
    arguments: dict  # Tool arguments as key-value pairs


class CreateMessageRequest(SQLModel):
    """Schema for creating a new chat message."""
    message: str = Field(min_length=1, max_length=5000)
    conversation_id: Optional[int] = None  # None for new conversation


class ChatResponse(SQLModel):
    """Schema for chat response from the AI agent."""
    message: str  # Assistant's response text
    conversation_id: int  # Conversation ID (new or existing)
    tool_calls: list[ToolCall] = Field(default_factory=list)  # Tools invoked


class ConversationRead(SQLModel):
    """Schema for conversation response."""
    id: int
    user_id: str
    created_at: datetime
    updated_at: datetime


class MessageRead(SQLModel):
    """Schema for message response."""
    id: int
    conversation_id: int
    role: str
    content: Optional[str] = None
    tool_calls: list[ToolCall] = Field(default_factory=list)
    created_at: datetime

    # Handle tool_calls conversion from database JSON string to list
    @field_validator('tool_calls', mode='before')
    @classmethod
    def parse_tool_calls(cls, v):
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            try:
                return json.loads(v) if v else []
            except json.JSONDecodeError:
                return []
        return []


class ConversationWithMessages(SQLModel):
    """Schema for conversation with its messages."""
    conversation: ConversationRead
    messages: list[MessageRead]
