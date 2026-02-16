# Data Model: Cloud Event-Driven Deployment (Phase V)

**Feature**: 001-cloud-event-driven-deployment
**Date**: 2025-02-09
**Purpose**: Define data entities for event-driven task management system

---

## Entity Relationship Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │     │    Task     │     │Notification │
│ (BetterAuth)│     │             │     │             │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │ 1                 │ 1                  │ 1
       │                   │                    │
       │ N                 │ N                  │ N
       │                   │                    │
┌──────▼───────────────────▼────────────────────▼──────┐
│                    Conversation                        │
│                       (AI Chat)                       │
└──────────────────────────┬─────────────────────────────┘
                           │ 1
                           │
                           │ N
                    ┌──────▼──────┐
                    │   Message   │
                    └─────────────┘

┌──────────────────────────────────────────────────────────┐
│                    Kafka Topics (Events)                 │
│  - task-events: created, updated, completed, deleted    │
│  - reminders: scheduled reminder triggers                │
└──────────────────────────────────────────────────────────┘
```

---

## Core Entities

### 1. Task (Extended)

**Table**: `task`
**Purpose**: Core todo item with recurrence and reminder support

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | int | PK, Auto-increment | Unique identifier |
| `user_id` | str | FK → user.id, Indexed | Owner of the task |
| `parent_task_id` | int | FK → task.id, Nullable | Reference to recurring template |
| `title` | str | Min 1, Max 200 | Task name |
| `description` | str | Max 1000, Nullable | Detailed description |
| `completed` | bool | Default false, Indexed | Completion status |
| `priority` | str | Enum: low/medium/high | Task priority |
| `tags` | str | JSON string, Nullable | Array of tag strings |
| `due_date` | datetime | Nullable | Task deadline |
| `reminder_at` | datetime | Nullable | When to send reminder (NEW) |
| `recurrence_rule` | str | RRULE format, Nullable | Recurrence definition |
| `created_at` | datetime | Default utcnow() | Creation timestamp |
| `updated_at` | datetime | Default utcnow() | Last modification |

**Indexes**:
- `idx_task_user_id`: (user_id)
- `idx_task_completed`: (completed)
- `idx_task_parent_task_id`: (parent_task_id)
- `idx_task_due_date`: (due_date) - for reminder queries

**State Transitions**:
```
[Pending] ←→ [Pending with Reminder] ←→ [Completed]
    ↓              ↓                         ↓
┌─────────┐    ┌──────────────┐        ┌───────────┐
│ Created │    │ Due Set      │        │ Completed │
└─────────┘    └──────────────┘        └───────────┘
                   ↓
              [Reminder Sent]
                   ↓
              [Dismissed/Cancelled]
```

### 2. Notification

**Table**: `notification`
**Purpose**: In-app alerts for reminders and events

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | int | PK, Auto-increment | Unique identifier |
| `user_id` | str | FK → user.id, Indexed | Recipient |
| `task_id` | int | FK → task.id, Nullable | Related task |
| `type` | str | Max 50 | Event type |
| `title` | str | Max 200 | Notification title |
| `message` | str | Max 500, Nullable | Detail message |
| `read` | bool | Default false, Indexed | Read status |
| `created_at` | datetime | Default utcnow() | Creation timestamp |

**Notification Types**:
- `due_date_reminder`: Task due soon
- `task_completed`: Recurring task next instance created
- `reminder_scheduled`: Confirmation of reminder set

### 3. User (Reference)

**Table**: `user`
**Purpose**: Managed by Better Auth (reference only)

| Field | Type | Description |
|-------|------|-------------|
| `id` | str (UUID) | Primary key |
| `email` | str | User email (unique) |
| `name` | str | Display name |
| `emailVerified` | bool | Email verification status |
| `createdAt` | datetime | Account creation |
| `updatedAt` | datetime | Last update |

**Note**: This table is managed directly by Better Auth. Our models reference it for foreign keys.

### 4. Conversation (AI Chat)

**Table**: `conversation`
**Purpose**: Chat session container

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | int | PK, Auto-increment | Unique identifier |
| `user_id` | str | FK → user.id, Indexed | Conversation owner |
| `created_at` | datetime | Default utcnow() | Creation timestamp |
| `updated_at` | datetime | Default utcnow() | Last activity |

### 5. Message

**Table**: `message`
**Purpose**: Individual chat messages

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | int | PK, Auto-increment | Unique identifier |
| `conversation_id` | int | FK → conversation.id, Indexed | Parent conversation |
| `role` | str | Enum: user/assistant | Message sender |
| `content` | str | Max 10000, Nullable | Message text |
| `tool_calls` | str | JSON string, Nullable | AI tool invocations |
| `created_at` | datetime | Default utcnow() | Creation timestamp |

---

## Event Schema (Kafka)

### Task Event

**Topic**: `task-events`
**Format**: CloudEvents 1.0

```json
{
  "specversion": "1.0",
  "type": "todo.task.created|updated|completed|deleted",
  "source": "/todo-backend",
  "id": "evt_<uuid>",
  "time": "2025-02-09T12:00:00Z",
  "datacontenttype": "application/json",
  "data": {
    "task_id": 123,
    "user_id": "user-uuid",
    "title": "Complete Phase V",
    "description": null,
    "completed": false,
    "priority": "high",
    "tags": ["hackathon", "phase5"],
    "due_date": "2025-02-15T23:59:59Z",
    "recurrence_rule": null,
    "parent_task_id": null,
    "operation": "created"
  }
}
```

**Event Types**:
- `todo.task.created`: New task created
- `todo.task.updated`: Task modified
- `todo.task.completed`: Task marked complete (triggers next instance)
- `todo.task.deleted`: Task removed

### Reminder Event

**Topic**: `reminders`
**Format**: CloudEvents 1.0

```json
{
  "specversion": "1.0",
  "type": "todo.reminder.due",
  "source": "/todo-backend/jobs",
  "id": "rem_<uuid>",
  "time": "2025-02-15T22:00:00Z",
  "datacontenttype": "application/json",
  "data": {
    "task_id": 123,
    "user_id": "user-uuid",
    "title": "Complete Phase V",
    "due_date": "2025-02-15T23:59:59Z",
    "reminder_type": "before_due",
    "minutes_before": 60
  }
}
```

---

## Recurrence Data Model

### Recurring Task Pattern

```
┌─────────────────┐
│  Parent Task    │
│  (Template)     │
│  recurrence_rule│
│  = "FREQ=WEEKLY"│
└────────┬────────┘
         │
         │ Completion Event
         │
    ┌────┴─────┬─────────┬─────────┐
    │          │         │         │
    ▼          ▼         ▼         ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Instance│ │Instance│ │Instance│ │Instance│
│Feb 9   │ │Feb 16  │ │Feb 23  │ │Mar 1   │
│parent_id│ │parent_id│ │parent_id│ │parent_id│
│ = 1     │ │ = 1     │ │ = 1     │ │ = 1     │
└────────┘ └────────┘ └────────┘ └────────┘
```

### RRULE Examples

| Pattern | RRULE | Description |
|---------|-------|-------------|
| Daily | `FREQ=DAILY` | Every day |
| Weekly | `FREQ=WEEKLY;BYDAY=FR` | Every Friday |
| Monthly | `FREQ=MONTHLY` | Every month on same date |
| Weekdays | `FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR` | Mon-Fri |

**Instance Creation Flow**:
1. User creates task with `recurrence_rule` set
2. Task saved with `parent_task_id = NULL` (is a template)
3. On completion, `task-events` published with type `completed`
4. Event consumer calculates next occurrence via `dateutil.rrule`
5. New task created with `parent_task_id = original_id`
6. `recurrence_rule = NULL` on instances (inherited from parent)

---

## Dapr State Store Schema

### Conversation State

**Store**: `statestore` (PostgreSQL via Dapr)
**Key Pattern**: `conversation:{conversation_id}`

```json
{
  "conversation_id": 123,
  "user_id": "user-uuid",
  "messages": [
    {"role": "user", "content": "Create a task"},
    {"role": "assistant", "content": "I've created...", "tool_calls": [...]}
  ],
  "updated_at": "2025-02-09T12:00:00Z",
  "metadata": {
    "total_messages": 10,
    "last_activity": "2025-02-09T12:00:00Z"
  }
}
```

**Note**: Database `conversation` and `message` tables remain source of truth. Dapr state is cache for performance.

---

## Database Migrations Required

### Migration: `add_reminder_and_recurrence_support`

```python
def upgrade():
    op.add_column('task', sa.Column('reminder_at', sa.DateTime(), nullable=True))
    op.create_index('ix_task_reminder_at', 'task', ['reminder_at'])
    # recurrence_rule already exists from Phase 011
    # parent_task_id already exists from Phase 011

def downgrade():
    op.drop_index('ix_task_reminder_at', 'task')
    op.drop_column('task', 'reminder_at')
```

---

## Validation Rules

### Task Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| `title` | 1-200 chars | "Title must be between 1 and 200 characters" |
| `priority` | in {low, medium, high} | "Priority must be low, medium, or high" |
| `recurrence_rule` | Valid RRULE | "Invalid recurrence rule format" |
| `due_date` | > created_at | "Due date must be in the future" |
| `reminder_at` | < due_date | "Reminder must be before due date" |
| `tags` | Max 10 tags | "Cannot have more than 10 tags" |

### Recurrence Validation

```python
from dateutil import rrule

def validate_recurrence(rrule_str: str, due_date: datetime) -> bool:
    """Validate RRULE and ensure next occurrence exists."""
    try:
        rule = rrule.rrulestr(rrule_str, dtstart=due_date)
        next_occurrence = rule.after(due_date)
        return next_occurrence is not None
    except Exception:
        return False
```

---

## Data Access Patterns

### Event Publishing Pattern

```python
# After database commit, publish event
async def create_task(task: TaskCreate, user_id: str):
    # 1. Database operation
    task = Task.model_validate(task, update={"user_id": user_id})
    session.add(task)
    await session.commit()
    await session.refresh(task)

    # 2. Publish event (fire and forget)
    await publish_task_event("created", task.model_dump(), user_id)

    return task
```

### Event Subscription Pattern

```python
@app.post("/events/tasks")
async def handle_task_event(request: Request):
    """Handle task events from Kafka via Dapr."""
    event = await request.json()
    event_type = event.get("data", {}).get("operation")

    if event_type == "completed":
        await create_next_instance(event["data"])

    return {"status": "SUCCESS"}
```
