# Quickstart: Task Management Enhancements

**Feature**: 011-task-management-enhancements
**Date**: 2026-01-31

## Prerequisites

- Python 3.13+ with UV package manager
- Node.js 18+ with npm
- Existing project with FastAPI backend and Next.js frontend
- Better Auth configured

---

## Backend Implementation

### 1. Add Notification Model

**File**: `backend/app/models.py`

```python
class Notification(SQLModel, table=True):
    """In-app notification entity."""
    __tablename__ = "notification"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    task_id: Optional[int] = Field(foreign_key="task.id", index=True, default=None)

    type: str = Field(max_length=50)  # due_date_reminder, task_completed
    title: str = Field(max_length=200)
    message: Optional[str] = Field(default=None, max_length=500)

    read: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


# Add to Task model:
parent_task_id: Optional[int] = Field(
    foreign_key="task.id",
    index=True,
    default=None
)
```

### 2. Create Notification Routes

**File**: `backend/app/routes/notifications.py`

```python
from fastapi import APIRouter, Depends
from sqlmodel import Session

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

@router.get("")
async def list_notifications(
    unread_only: bool = False,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """List user's notifications."""
    query = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only:
        query = query.where(Notification.read == False)
    query = query.order_by(Notification.created_at.desc()).limit(limit)
    return session.exec(query).all()

@router.get("/unread-count")
async def unread_count(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get count of unread notifications for badge."""
    count = session.exec(
        select(func.count(Notification.id))
        .where(Notification.user_id == current_user.id)
        .where(Notification.read == False)
    ).one()
    return {"count": count, "display_count": "99+" if count > 99 else str(count)}

@router.patch("/{id}/read")
async def mark_read(
    id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Mark notification as read."""
    notification = session.get(Notification, id)
    if not notification or notification.user_id != current_user.id:
        raise HTTPException(404)
    notification.read = True
    session.add(notification)
    session.commit()
    return notification

@router.delete("/{id}")
async def dismiss(
    id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Delete/dismiss notification."""
    notification = session.get(Notification, id)
    if not notification or notification.user_id != current_user.id:
        raise HTTPException(404)
    session.delete(notification)
    session.commit()
    return Response(status_code=204)
```

### 3. Enhance Task Routes

**File**: `backend/app/routes/tasks.py`

```python
@router.get("")
async def list_tasks(
    sort_by: str = "created_at",
    sort_order: str = "desc",
    filter_start: Optional[date] = None,
    filter_end: Optional[date] = None,
    preset_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """List tasks with sorting and filtering."""
    query = select(Task).where(Task.user_id == current_user.id)

    # Apply date filter
    if preset_filter == "today":
        query = query.where(func.date(Task.created_at) == date.today())
    elif preset_filter == "this_week":
        start = date.today() - timedelta(days=date.today().weekday())
        query = query.where(Task.created_at >= start)
    elif preset_filter == "this_month":
        start = date.today().replace(day=1)
        query = query.where(Task.created_at >= start)
    elif filter_start:
        query = query.where(Task.created_at >= filter_start)
    elif filter_end:
        query = query.where(Task.created_at < filter_end + timedelta(days=1))

    # Apply sorting
    sort_column = getattr(Task, sort_by, Task.created_at)
    query = query.order_by(sort_column.desc() if sort_order == "desc" else sort_column.asc())

    tasks = session.exec(query).all()
    return {"tasks": tasks, "total": len(tasks)}

@router.get("/{id}")
async def get_task(
    id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get single task for edit form."""
    task = session.get(Task, id)
    if not task or task.user_id != current_user.id:
        raise HTTPException(404, "Task not found")
    return task

@router.put("/{id}")
async def update_task(
    id: int,
    task_update: TaskUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update existing task."""
    task = session.get(Task, id)
    if not task or task.user_id != current_user.id:
        raise HTTPException(404, "Task not found")

    task_data = task_update.model_dump(exclude_unset=True)
    for field, value in task_data.items():
        setattr(task, field, value)

    session.add(task)
    session.commit()
    return task

@router.post("/{id}/complete")
async def complete_task(
    id: int,
    edit_scope: str = "this",
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Complete task, create next instance if recurring."""
    task = session.get(Task, id)
    if not task or task.user_id != current_user.id:
        raise HTTPException(404, "Task not found")

    task.completed = True
    next_instance = None

    # Create next instance if recurring
    if task.recurrence_rule and edit_scope == "this":
        next_instance = create_next_instance(task, session)

    # Create completion notification
    create_notification(
        user_id=current_user.id,
        type="task_completed",
        title="Task completed",
        message=f"Great job! You finished {task.title}",
        task_id=task.id,
        session=session
    )

    session.add(task)
    session.commit()
    return {"task": task, "next_instance": next_instance}
```

### 4. Add Notification Helper

**File**: `backend/app/services/notification_service.py`

```python
from dateutil.rrule import rrulestr
from datetime import datetime, timedelta

def create_notification(user_id: str, type: str, title: str, message: str, task_id: Optional[int], session: Session):
    """Create a new notification."""
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        task_id=task_id
    )
    session.add(notification)
    return notification

def create_next_instance(task: Task, session: Session) -> Optional[Task]:
    """Create next recurring task instance."""
    if not task.recurrence_rule or not task.due_date:
        return None

    rule = rrulestr(task.recurrence_rule)
    next_date = rule.after(task.due_date)

    if next_date:
        next_task = Task(
            user_id=task.user_id,
            parent_task_id=task.id,
            title=task.title,
            description=task.description,
            priority=task.priority,
            due_date=next_date,
            recurrence_rule=task.recurrence_rule,
            completed=False
        )
        session.add(next_task)
        return next_task
    return None

def check_due_date_reminders(session: Session):
    """Background job to create due date reminders."""
    tomorrow = datetime.now() + timedelta(days=1)
    start = tomorrow.replace(hour=0, minute=0, second=0)
    end = tomorrow.replace(hour=23, minute=59, second=59)

    tasks_due = session.exec(
        select(Task).where(Task.due_date >= start).where(Task.due_date <= end).where(Task.completed == False)
    ).all()

    for task in tasks_due:
        existing = session.exec(
            select(Notification).where(Notification.task_id == task.id).where(Notification.type == "due_date_reminder")
        ).first()
        if not existing:
            create_notification(
                user_id=task.user_id,
                type="due_date_reminder",
                title="Task due soon",
                message=f"{task.title} is due tomorrow",
                task_id=task.id,
                session=session
            )
    session.commit()
```

### 5. Register Routes

**File**: `backend/app/main.py`

```python
from app.routes import notifications

app.include_router(notifications.router)
```

---

## Frontend Implementation

### 1. Create Notification Bell Component

**File**: `frontend/components/notification-bell.tsx`

```tsx
"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { api } from "@/lib/api"

interface NotificationBellProps {
  onOpenChange: (open: boolean) => void
}

export function NotificationBell({ onOpenChange }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Fetch unread count every 30 seconds
    const fetchCount = async () => {
      const res = await api.get("/notifications/unread-count")
      setUnreadCount(res.data.count)
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <button
      onClick={() => onOpenChange(true)}
      className="relative p-2 rounded-full hover:bg-muted transition-colors"
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  )
}
```

### 2. Create Notification Dropdown

**File**: `frontend/components/notification-dropdown.tsx`

```tsx
"use client"

import { useEffect, useState } from "react"
import { X, Check } from "lucide-react"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"

interface Notification {
  id: number
  type: string
  title: string
  message: string | null
  read: boolean
  task_id: number | null
  created_at: string
}

interface NotificationDropdownProps {
  open: boolean
  onClose: () => void
}

export function NotificationDropdown({ open, onClose }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const router = useRouter()

  useEffect(() => {
    if (open) {
      api.get("/notifications").then(res => setNotifications(res.data))
    }
  }, [open])

  const handleClick = async (notification: Notification) => {
    // Mark as read
    await api.patch(`/notifications/${notification.id}/read`)
    // Navigate to task if applicable
    if (notification.task_id) {
      router.push(`/dashboard?task=${notification.task_id}`)
    }
    onClose()
  }

  const handleDismiss = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    await api.delete(`/notifications/${id}`)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  if (!open) return null

  return (
    <div className="absolute right-0 top-12 w-80 bg-background border rounded-lg shadow-lg">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-semibold">Notifications</h3>
        <button onClick={onClose} className="p-1 hover:bg-muted rounded">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="p-4 text-center text-muted-foreground">No notifications</p>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              className={`p-4 border-b hover:bg-muted cursor-pointer ${
                !n.read ? "bg-muted/50" : ""
              }`}
            >
              <div className="flex justify-between">
                <p className="font-medium">{n.title}</p>
                <button
                  onClick={(e) => handleDismiss(e, n.id)}
                  className="p-1 hover:bg-background rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              {n.message && <p className="text-sm text-muted-foreground">{n.message}</p>}
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(n.created_at).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
```

### 3. Create Task Sort Controls

**File**: `frontend/components/task-sort-controls.tsx`

```tsx
"use client"

import { useTaskList } from "@/hooks/use-task-list"

const SORT_OPTIONS = [
  { value: "due_date", label: "Due Date" },
  { value: "priority", label: "Priority" },
  { value: "created_at", label: "Created" },
  { value: "title", label: "Title" },
]

export function TaskSortControls() {
  const { sortBy, setSortBy, sortOrder, setSortOrder } = useTaskList()

  return (
    <div className="flex items-center gap-2">
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="px-3 py-2 border rounded-md bg-background"
      >
        {SORT_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <button
        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        className="px-3 py-2 border rounded-md hover:bg-muted"
      >
        {sortOrder === "asc" ? "↑" : "↓"}
      </button>
    </div>
  )
}
```

### 4. Create Task Filter Controls

**File**: `frontend/components/task-filter-controls.tsx`

```tsx
"use client"

import { useTaskList } from "@/hooks/use-task-list"

const FILTER_OPTIONS = [
  { value: null, label: "All Tasks" },
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
]

export function TaskFilterControls() {
  const { presetFilter, setPresetFilter, clearFilters } = useTaskList()

  return (
    <div className="flex items-center gap-2">
      {FILTER_OPTIONS.map(opt => (
        <button
          key={opt.value || "all"}
          onClick={() => setPresetFilter(opt.value)}
          className={`px-3 py-2 rounded-md border transition-colors ${
            presetFilter === opt.value
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
        >
          {opt.label}
        </button>
      ))}
      {presetFilter && (
        <button
          onClick={clearFilters}
          className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Clear
        </button>
      )}
    </div>
  )
}
```

### 5. Update Task Form for Edit Mode

**File**: `frontend/components/task-form.tsx`

```tsx
interface TaskFormProps {
  initialData?: Task  // Add this prop
  mode?: "create" | "edit"
  onSuccess?: () => void
}

export function TaskForm({ initialData, mode = "create", onSuccess }: TaskFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    priority: initialData?.priority || "medium",
    due_date: initialData?.due_date || "",
    tags: initialData?.tags || [],
    recurrence_rule: initialData?.recurrence_rule || "",
  })

  // Form fields use formData as initial values
  // On submit, call PUT /api/tasks/{id} for edit, POST for create
}
```

### 6. Add Hook for Task List State

**File**: `frontend/hooks/use-task-list.ts`

```tsx
"use client"

import { create } from "zustand"

interface TaskListState {
  sortBy: string
  sortOrder: "asc" | "desc"
  presetFilter: string | null
  setSortBy: (value: string) => void
  setSortOrder: (value: "asc" | "desc") => void
  setPresetFilter: (value: string | null) => void
  clearFilters: () => void
}

export const useTaskList = create<TaskListState>((set) => ({
  sortBy: localStorage.getItem("taskSort") || "created_at",
  sortOrder: "desc",
  presetFilter: null,
  setSortBy: (value) => {
    localStorage.setItem("taskSort", value)
    set({ sortBy: value })
  },
  setSortOrder: (value) => set({ sortOrder: value }),
  setPresetFilter: (value) => set({ presetFilter: value }),
  clearFilters: () => set({ presetFilter: null }),
}))
```

---

## Database Migration

```sql
-- Add notification table
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

-- Add parent_task_id to task table
ALTER TABLE task ADD COLUMN parent_task_id INTEGER REFERENCES task(id);
CREATE INDEX idx_task_parent_id ON task(parent_task_id);

-- Cleanup function for 90-day retention
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM notification
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
```

---

## Testing

```bash
# Backend tests
cd backend
uv run pytest tests/test_notifications.py -v
uv run pytest tests/test_tasks_sorting.py -v

# Frontend tests
cd frontend
npm test -- notification-bell.test.tsx
npm test -- task-filter-controls.test.tsx
```

---

## Development Workflow

1. Start backend: `cd backend && uv run uvicorn app.main:app --reload`
2. Start frontend: `cd frontend && npm run dev`
3. Navigate to `http://localhost:3000/dashboard`
4. Test sorting: Click sort dropdown, observe order change
5. Test filtering: Click "Today", see filtered results
6. Test notifications: Complete a task, see bell badge appear
7. Test recurrence: Create recurring task, complete it, see next instance
