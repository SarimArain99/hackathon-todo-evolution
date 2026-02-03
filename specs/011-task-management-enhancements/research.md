# Research: Task Management Enhancements

**Feature**: 011-task-management-enhancements
**Date**: 2026-01-31
**Phase**: 0 - Research & Technology Decisions

## Overview

This document captures research findings and technology decisions for implementing task sorting, filtering, notifications, and recurrence features in an existing Next.js + FastAPI todo application.

---

## 1. Notification System Implementation

### Decision: In-App Notification System with Database Storage

**Rationale**:
- User clarified notifications are in-app only (no email/push)
- Database storage enables persistence across sessions
- Bell icon with badge is a standard UI pattern
- 90-day retention balances utility with storage

**Alternatives Considered**:
| Option | Pros | Cons | Selected |
|--------|------|------|----------|
| Database-backed notifications | Persistent, queryable, simple | Requires DB schema | ✅ Yes |
| In-memory only | Fast, no schema | Lost on refresh, not persistent | ❌ |
| Redis cache | Fast, scalable | Additional infrastructure | ❌ |
| WebSocket push | Real-time | Complex, overkill for MVP | ❌ |

**Implementation Pattern**:
- Add `Notification` table to PostgreSQL (via SQLModel)
- Poll on interval (e.g., 30 seconds) or use server-sent events for updates
- Bell icon in header fetches unread count
- Dropdown panel shows recent notifications

---

## 2. Task Sorting & Filtering

### Decision: Client-Side Sorting/Filtering with Server Query Support

**Rationale**:
- Sorting by 4 fields (due_date, priority, created_at, title) is lightweight
- Date filtering requires server-side query for efficiency
- Existing task list can be enhanced with URL query params
- Sort preference stored in localStorage for persistence

**Alternatives Considered**:
| Option | Pros | Cons | Selected |
|--------|------|------|----------|
| Client-side only | Simple, fast API | All tasks loaded | ❌ |
| Server-side only | Efficient, scalable | More API complexity | ❌ |
| Hybrid (filter server, sort client) | Best of both | Slightly complex | ✅ Yes |

**Implementation Pattern**:
- Server: Add query params for date range filtering (`?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`)
- Client: Apply sorting after fetching filtered results
- Store preferences: `localStorage.setItem('taskSort', 'due_date')`

---

## 3. Recurring Task Implementation

### Decision: iCal RRULE Format with On-Completion Instance Creation

**Rationale**:
- iCal RRULE is an established standard (RFC 5545)
- Python `dateutil.rrule` library handles parsing
- User clarified: next instance created immediately upon completion
- Parent-child relationship for recurrence series

**Alternatives Considered**:
| Option | Pros | Cons | Selected |
|--------|------|------|----------|
| iCal RRULE | Standard, tested | Library dependency | ✅ Yes |
| Custom format | Full control | Maintenance burden | ❌ |
| Cron expression | Flexible | Not user-friendly | ❌ |

**Implementation Pattern**:
- Store RRULE string in `recurrence_rule` column (already exists)
- Add `parent_task_id` foreign key for linking instances
- When completing a recurring task:
  1. Parse RRULE to calculate next date
  2. Create new task instance with same properties
  3. Link via `parent_task_id`

---

## 4. Enhanced Task Editing

### Decision: Reuse Existing Task Form with Pre-Population

**Rationale**:
- Existing `TaskForm` component already handles all task fields
- Add `initialData` prop for edit mode
- Minimal changes to existing code

**Implementation Pattern**:
- Pass task object to form when editing
- Form fields use `defaultValue` or controlled inputs with initial values
- Save button calls update API instead of create API

---

## 5. Data Model Additions

### New: Notification Table

```python
class Notification(SQLModel, table=True):
    __tablename__ = "notification"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    task_id: Optional[int] = Field(foreign_key="task.id", index=True)

    # Notification content
    type: str = Field(max_length=50)  # "due_date_reminder", "task_completed"
    title: str = Field(max_length=200)
    message: Optional[str] = Field(default=None, max_length=500)

    # State
    read: bool = Field(default=False, index=True)

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

### Existing: Task Table Enhancements

```python
# Add to existing Task model:
parent_task_id: Optional[int] = Field(
    foreign_key="task.id",
    index=True,
    default=None
)  # Links recurring instances
```

---

## 6. API Contract Design

### RESTful Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/tasks?sort=due_date&filter_start=YYYY-MM-DD | List with sort/filter |
| GET | /api/tasks/{id} | Get single task (for edit) |
| PUT | /api/tasks/{id} | Update task |
| GET | /api/notifications | List notifications |
| PATCH | /api/notifications/{id}/read | Mark as read |
| DELETE | /api/notifications/{id} | Dismiss notification |
| GET | /api/notifications/unread-count | Badge count |

---

## 7. Frontend Component Additions

### New Components

| Component | Purpose |
|-----------|---------|
| `NotificationBell` | Header bell icon with badge |
| `NotificationDropdown` | Panel showing notification history |
| `TaskSortControls` | Sort selector dropdown |
| `TaskFilterControls` | Date filter buttons |
| `EmptyState` | "No tasks match filter" message |

### Modified Components

| Component | Changes |
|-----------|---------|
| `TaskForm` | Add `initialData` prop, mode detection |
| `TaskList` | Apply sort/filter, show empty state |
| `DashboardHeader` | Add NotificationBell |

---

## 8. Performance Considerations

### Index Requirements

- `notification.read` - for unread count queries
- `notification.created_at` - for time-based cleanup
- `notification.user_id` - for user filtering
- `task.parent_task_id` - for recurrence series queries

### Query Optimization

- Unread count: `SELECT COUNT(*) FROM notification WHERE user_id=? AND read=FALSE`
- Cleanup job: `DELETE FROM notification WHERE created_at < NOW() - INTERVAL '90 days'`

---

## 9. Edge Case Handling

| Edge Case | Resolution |
|-----------|------------|
| Task deleted, notification still exists | Notification shows "Task no longer available" |
| More than 99 unread notifications | Badge shows "99+" |
| Identical sort values (same due date) | Secondary sort by `created_at DESC` |
| Recurrence date on weekend | Create on exact date (no adjustment per spec) |
| Editing recurring task | Prompt user: "This instance only" or "All future instances" |

---

## 10. Technology Stack Confirmation

**Backend**:
- Python 3.13+ with UV
- FastAPI for REST APIs
- SQLModel for ORM
- Neon PostgreSQL for database
- `dateutil` for RRULE parsing

**Frontend**:
- Next.js 16.1.1 (App Router)
- TypeScript strict mode
- Tailwind CSS for styling
- Lucide React for icons (bell, filter, etc.)
- Framer Motion for animations
- Sonner for toasts

**Authentication**:
- Better Auth with JWT

---

## Summary

All technical unknowns have been resolved. The implementation will:

1. Add a `Notification` table with 90-day auto-cleanup
2. Extend `Task` table with `parent_task_id` for recurrence
3. Create RESTful API endpoints for notifications and enhanced task queries
4. Add React components for notification bell, sort controls, and filter controls
5. Implement immediate-next-instance creation for recurring tasks
6. Store user preferences (sort order) in localStorage

**No NEEDS CLARIFICATION items remain.** Ready for Phase 1 design.
