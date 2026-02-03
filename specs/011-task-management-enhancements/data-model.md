# Data Model: Task Management Enhancements

**Feature**: 011-task-management-enhancements
**Date**: 2026-01-31
**Phase**: 1 - Data Model Design

## Overview

This document defines the data model changes required for implementing task sorting, filtering, notifications, and recurrence features. The existing Task model is enhanced, and a new Notification model is added.

---

## Entity Relationship Diagram

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│    User     │─────────││    Task     │◄────────│ Notification │
│ (existing)  │ 1     N ││  (enhanced) ││  1     N    │  (new)     │
└─────────────┘         └──────┬───────┘         └──────────────┘
                               │
                               │ self-reference
                               │ (recurrence)
                               ▼
                        ┌─────────────┐
                        │   Task     │
                        │  (parent)  │
                        └─────────────┘
```

---

## New Entity: Notification

### Table: `notification`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| user_id | VARCHAR (UUID) | FOREIGN KEY → user.id, INDEX | Notification recipient |
| task_id | INTEGER | FOREIGN KEY → task.id, INDEX, NULLABLE | Related task (if applicable) |
| type | VARCHAR(50) | NOT NULL | Notification type: `due_date_reminder`, `task_completed` |
| title | VARCHAR(200) | NOT NULL | Notification title |
| message | VARCHAR(500) | NULLABLE | Additional detail text |
| read | BOOLEAN | DEFAULT FALSE, INDEX | Read/unread status |
| created_at | TIMESTAMP | DEFAULT NOW(), INDEX | Creation timestamp |

### Indexes

```sql
CREATE INDEX idx_notification_user_read ON notification(user_id, read);
CREATE INDEX idx_notification_created_at ON notification(created_at);
CREATE INDEX idx_notification_task_id ON notification(task_id);
```

### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| type | Must be one of: `due_date_reminder`, `task_completed` | "Invalid notification type" |
| title | Required, max 200 chars | "Title is required" |
| user_id | Must reference valid user | "Invalid user" |
| task_id | If provided, must reference valid task | "Invalid task" |

### State Transitions

```
[Created] → [Read] → [Deleted after 90 days]
    ↓
[Dismissed by user]
```

---

## Enhanced Entity: Task

### New Column: `parent_task_id`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| parent_task_id | INTEGER | FOREIGN KEY → task.id, INDEX, NULLABLE | Links recurring task instances |

### Existing Columns (Reference)

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| user_id | VARCHAR (UUID) | Foreign key to user |
| title | VARCHAR(200) | Task title |
| description | VARCHAR(1000) | Optional description |
| completed | BOOLEAN | Completion status |
| priority | VARCHAR(10) | low, medium, high |
| tags | VARCHAR (JSON) | Array of tag strings |
| due_date | TIMESTAMP | Optional due date |
| recurrence_rule | VARCHAR | iCal RRULE format |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

### Indexes (Addition)

```sql
CREATE INDEX idx_task_parent_id ON task(parent_task_id);
```

### Recurrence Instance Pattern

```
Parent Task (recurrence_rule set, completed = FALSE)
    ├── Instance 1 (parent_task_id → Parent, due_date = 2025-01-15)
    ├── Instance 2 (parent_task_id → Parent, due_date = 2025-01-22)
    └── Instance 3 (parent_task_id → Parent, due_date = 2025-01-29)
```

### Validation Rules (Additions)

| Field | Rule | Error Message |
|-------|------|---------------|
| parent_task_id | Cannot reference self | "Task cannot be its own parent" |
| recurrence_rule | If set, must be valid iCal RRULE | "Invalid recurrence rule" |
| recurrence_rule | Required if creating recurring task | "Recurrence rule required for recurring tasks" |

---

## SQLModel Schema

### Notification Model

```python
from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel

class Notification(SQLModel, table=True):
    """Notification entity for in-app alerts."""
    __tablename__ = "notification"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    task_id: Optional[int] = Field(foreign_key="task.id", index=True, default=None)

    # Content
    type: str = Field(max_length=50)  # due_date_reminder, task_completed
    title: str = Field(max_length=200)
    message: Optional[str] = Field(default=None, max_length=500)

    # State
    read: bool = Field(default=False, index=True)

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

### Enhanced Task Model

```python
class Task(SQLModel, table=True):
    """Task entity with user isolation and recurrence support."""
    __tablename__ = "task"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)

    # NEW: Recurrence parent reference
    parent_task_id: Optional[int] = Field(
        foreign_key="task.id",
        index=True,
        default=None
    )

    # Existing fields...
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: bool = Field(default=False, index=True)
    priority: str = Field(default="medium", max_length=10)
    tags: Optional[str] = Field(default=None)
    due_date: Optional[datetime] = None
    recurrence_rule: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

---

## Pydantic Schemas

### NotificationCreate

```python
class NotificationCreate(SQLModel):
    """Schema for internal notification creation."""
    task_id: Optional[int] = None
    type: str  # due_date_reminder, task_completed
    title: str
    message: Optional[str] = None
```

### NotificationRead

```python
class NotificationRead(SQLModel):
    """Schema for notification responses."""
    id: int
    user_id: str
    task_id: Optional[int] = None
    type: str
    title: str
    message: Optional[str] = None
    read: bool
    created_at: datetime
```

### TaskUpdate (Enhanced)

```python
class TaskUpdate(SQLModel):
    """Schema for updating a task - all fields optional."""
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: Optional[bool] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    tags: Optional[list[str]] = None
    recurrence_rule: Optional[str] = None
    parent_task_id: Optional[int] = None  # NEW
    edit_scope: Optional[str] = None  # NEW: "this" or "all" for recurring
```

---

## Migration Plan

### Step 1: Create Notification Table

```sql
CREATE TABLE notification (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES "user"(id),
    task_id INTEGER REFERENCES task(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message VARCHAR(500),
    read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_user_read ON notification(user_id, read);
CREATE INDEX idx_notification_created_at ON notification(created_at);
CREATE INDEX idx_notification_task_id ON notification(task_id);
```

### Step 2: Add parent_task_id to Task Table

```sql
ALTER TABLE task ADD COLUMN parent_task_id INTEGER REFERENCES task(id);
CREATE INDEX idx_task_parent_id ON task(parent_task_id);
```

### Step 3: Create Cleanup Function (90-day retention)

```sql
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM notification
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
```

---

## Data Dictionary

### Notification Types

| Type | Trigger | Title Template | Message Template |
|------|---------|----------------|------------------|
| `due_date_reminder` | Task due_date < 24h | "Task due soon" | "{task.title} is due tomorrow" |
| `task_completed` | Task.completed = TRUE | "Task completed" | "Great job! You finished {task.title}" |

### Priority Order (for sorting)

| Priority | Sort Value | Description |
|----------|------------|-------------|
| high | 3 | Urgent tasks |
| medium | 2 | Normal tasks |
| low | 1 | Backlog tasks |

### Recurrence Frequencies

| Frequency | RRULE Pattern |
|------------|---------------|
| daily | `FREQ=DAILY` |
| weekly | `FREQ=WEEKLY` |
| monthly | `FREQ=MONTHLY` |

---

## Query Patterns

### Get Unread Notifications

```python
SELECT * FROM notification
WHERE user_id = ? AND read = FALSE
ORDER BY created_at DESC
LIMIT 50;
```

### Get Unread Count

```python
SELECT COUNT(*) FROM notification
WHERE user_id = ? AND read = FALSE;
```

### Get Recurring Task Series

```python
SELECT * FROM task
WHERE parent_task_id = ?
ORDER BY due_date ASC;
```

### Filter Tasks by Date Range

```python
SELECT * FROM task
WHERE user_id = ?
  AND created_at >= ? AND created_at < ?
ORDER BY {sort_column} {sort_direction};
```

---

## Summary

**New Tables**: 1 (`notification`)
**New Columns**: 1 (`task.parent_task_id`)
**New Indexes**: 4
**Migration Complexity**: Low

The data model is designed for:
- Fast unread count queries (composite index)
- Efficient time-based cleanup (created_at index)
- Recurrence series traversal (parent_task_id index)
- Future multi-user support (user_id on notifications)
