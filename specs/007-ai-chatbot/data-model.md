# Data Model: AI Chatbot

**Feature**: 003-ai-chatbot
**Date**: 2026-01-14
**Status**: Complete

## Overview

This document defines the data entities required for the AI chatbot feature. The design extends the existing Phase II data model with conversation and message entities while reusing the Task entity.

## Entities

### 1. Conversation (New)

**Purpose**: Represents a chat session between a user and the AI assistant.

**Table**: `conversation`

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | int | PRIMARY KEY, AUTO INCREMENT | Unique conversation identifier |
| `user_id` | str | FOREIGN KEY → user.id, NOT NULL, INDEXED | Owner of this conversation |
| `created_at` | datetime | DEFAULT utc_now(), NOT NULL | When conversation was created |
| `updated_at` | datetime | DEFAULT utc_now(), ON UPDATE utc_now(), NOT NULL | Last activity timestamp |

**SQLModel Definition**:
```python
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel

class Conversation(SQLModel, table=True):
    """A chat session between a user and the AI assistant."""
    __tablename__ = "conversation"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
```

**Indexes**:
- `idx_conversation_user_id` on `user_id` for user-scoped queries

---

### 2. Message (New)

**Purpose**: Represents a single message within a conversation.

**Table**: `message`

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | int | PRIMARY KEY, AUTO INCREMENT | Unique message identifier |
| `conversation_id` | int | FOREIGN KEY → conversation.id, NOT NULL, INDEXED | Parent conversation |
| `role` | str | NOT NULL, INDEXED, VALUES: "user", "assistant" | Who sent this message |
| `content` | str | NOT NULL | Message text content |
| `tool_calls` | str | NULL, TEXT | JSON array of tools invoked (for assistant messages) |
| `created_at` | datetime | DEFAULT utc_now(), NOT NULL | When message was created |

**SQLModel Definition**:
```python
class Message(SQLModel, table=True):
    """A single message in a conversation."""
    __tablename__ = "message"

    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversation.id", index=True)
    role: str = Field(index=True)  # "user" or "assistant"
    content: str
    tool_calls: Optional[str] = None  # JSON string of tool calls
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
```

**Indexes**:
- `idx_message_conversation_id` on `conversation_id` for history retrieval
- `idx_message_role` on `role` for filtering

**tool_calls JSON Structure**:
```json
[
  {
    "tool": "add_task",
    "parameters": {"user_id": "abc123", "title": "Buy groceries"},
    "result": {"task_id": 5, "status": "created"}
  }
]
```

---

### 3. Task (Existing - Reused)

**Purpose**: Todo items managed through the chat interface.

**Table**: `task` (from Phase II)

**Relevant Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `id` | int | Unique task identifier |
| `user_id` | str | Owner of the task |
| `title` | str | Task title |
| `description` | str | Optional detailed description |
| `completed` | bool | Completion status |
| `created_at` | datetime | Creation timestamp |
| `updated_at` | datetime | Last update timestamp |

**Note**: No changes needed to Task entity. MCP tools will use the existing TaskService.

---

### 4. User (Existing - Reference Only)

**Purpose**: Managed by Better Auth. Referenced for foreign key relationships.

**Table**: `user` (managed by Better Auth)

**Relevant Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `id` | str | UUID string identifier |
| `email` | str | User email (unique) |
| `name` | str | Display name |

**Note**: Better Auth manages this table. Our models reference it but don't modify it directly.

---

## Entity Relationships

```
┌─────────────┐
│    User     │
│ (Better Auth│
│  managed)   │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────▼───────────┐       ┌──────────────┐
│  Conversation    │ 1   N │   Message    │
│  ─────────────   │───────│  ──────────  │
│  user_id         │       │  conversation│
│  id              │       │  _id         │
│  created_at      │       │  role        │
│  updated_at      │       │  content     │
└──────────────────┘       │  tool_calls  │
       │                  │  created_at  │
       │                  └──────────────┘
       │ N
       │
┌──────▼───────────┐
│      Task        │
│  ─────────────   │
│  user_id         │
│  id              │
│  title           │
│  description     │
│  completed       │
│  created_at      │
│  updated_at      │
└──────────────────┘
```

**Relationship Rules**:
- One User has Many Conversations
- One Conversation has Many Messages
- One User has Many Tasks (existing)
- Messages do NOT directly reference Tasks (tool_calls JSON stores task operations)

---

## Pydantic Schemas (API)

### CreateMessageRequest

```python
from pydantic import BaseModel

class CreateMessageRequest(BaseModel):
    """Request to send a chat message."""
    message: str  # User's natural language input
    conversation_id: Optional[int] = None  # Omit to start new conversation
```

### ChatResponse

```python
class ToolCall(BaseModel):
    tool: str
    parameters: dict
    result: dict

class ChatResponse(BaseModel):
    """Response from chat endpoint."""
    conversation_id: int
    message_id: int
    response: str  # AI's text response
    tool_calls: list[ToolCall] = []  # Tools invoked during processing
```

### ConversationResponse

```python
class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

class ConversationResponse(BaseModel):
    """Conversation details."""
    id: int
    created_at: datetime
    updated_at: datetime
    messages: list[MessageResponse] = []
```

---

## State Management

### Stateless Server Design

The server holds NO conversation state in memory. All state is persisted:

1. **Request arrives** with `conversation_id` (or null)
2. **Load conversation** from database
3. **Load messages** from database (last 50 for context)
4. **Store user message** in database
5. **Run agent** with context
6. **Store assistant response** in database
7. **Return response** to client
8. **Server is clear** - ready for next request

### Context Window Strategy

To balance context awareness with token limits:

- Store ALL messages in database indefinitely
- Send last 50 messages to AI agent
- Prune chronologically (oldest dropped first)
- 50 messages ≈ typical conversation session

---

## Database Migrations

### Migration Steps

1. Create `conversation` table
2. Create `message` table
3. Add indexes for performance
4. Create foreign key constraints

### Alembic Migration (Example)

```python
def upgrade():
    op.create_table(
        "conversation",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("id")
    )
    op.create_index("idx_conversation_user_id", "conversation", ["user_id"])

    op.create_table(
        "message",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("conversation_id", sa.Integer(), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("content", sa.String(), nullable=False),
        sa.Column("tool_calls", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["conversation_id"], ["conversation.id"]),
        sa.PrimaryKeyConstraint("id")
    )
    op.create_index("idx_message_conversation_id", "message", ["conversation_id"])
    op.create_index("idx_message_role", "message", ["role"])
```

---

## Validation Rules

### Conversation

- `user_id` must exist in `user` table
- `created_at` <= `updated_at`

### Message

- `conversation_id` must exist in `conversation` table
- `role` must be "user" or "assistant"
- `content` cannot be empty string
- `tool_calls` must be valid JSON when present
- `tool_calls` only allowed when `role = "assistant"`

---

## Queries

### Common Query Patterns

**Get or create conversation**:
```python
# If conversation_id provided, load it
# If null, create new conversation
conversation = await conversation_service.get_or_create(
    user_id=user_id,
    conversation_id=conversation_id
)
```

**Get message history**:
```python
# Get last N messages for context
messages = await conversation_service.get_messages(
    conversation_id=conv_id,
    limit=50,
    order="desc"
)
```

**List user conversations**:
```python
# Get all conversations for a user
conversations = await conversation_service.list_by_user(
    user_id=user_id,
    limit=20
)
```

---

## Performance Considerations

- **Indexes on foreign keys**: Speed up JOIN operations
- **Message limit**: Prevents memory issues with long conversations
- **Async queries**: All database operations use SQLModel async
- **Connection pooling**: Reuse database connections
