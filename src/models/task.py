"""Task model for Phase I console application with enhanced features."""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional


class Priority(str, Enum):
    """Task priority levels."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TaskStatus(str, Enum):
    """Task status states (replaces completed boolean)."""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class RecurrencePattern(str, Enum):
    """Supported recurrence intervals."""

    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class ReminderOffset(str, Enum):
    """Reminder timing options (minutes before due)."""

    AT_DUE_TIME = "0"
    FIFTEEN_MIN_BEFORE = "15"
    ONE_HOUR_BEFORE = "60"
    ONE_DAY_BEFORE = "1440"


class SortKey(str, Enum):
    """Available sort options."""

    PRIORITY = "priority"
    DUE_DATE = "due_date"
    CREATED_AT = "created_at"


class DueDateFilter(str, Enum):
    """Due date filter options."""

    TODAY = "today"
    THIS_WEEK = "this_week"
    OVERDUE = "overdue"
    NO_DUE_DATE = "no_due_date"


@dataclass
class Task:
    """Represents a todo task with metadata.

    Attributes:
        id: Unique task identifier (auto-generated)
        title: Task title (required, 1-200 chars)
        description: Optional task description (max 1000 chars)
        status: Task status (pending/in_progress/completed)
        priority: Task priority level
        due_date: Optional due date for the task
        created_at: Timestamp when task was created
        recurrence: Optional recurrence pattern
        recurrence_end_date: Optional end date for recurrence
        parent_task_id: Links to original recurring task
        reminder_offset: When to show reminder
        reminder_shown: Prevents duplicate notifications
    """

    id: int
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.PENDING
    priority: Priority = Priority.MEDIUM
    due_date: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.now)
    recurrence: Optional[RecurrencePattern] = None
    recurrence_end_date: Optional[datetime] = None
    parent_task_id: Optional[int] = None
    reminder_offset: Optional[ReminderOffset] = None
    reminder_shown: bool = False

    @property
    def is_overdue(self) -> bool:
        """Check if task is overdue."""
        if self.status == TaskStatus.COMPLETED:
            return False
        if self.due_date is None:
            return False
        return self.due_date < datetime.now()

    @property
    def reminder_time(self) -> Optional[datetime]:
        """Calculate when reminder should trigger."""
        if not self.due_date or not self.reminder_offset:
            return None
        offset_minutes = int(self.reminder_offset.value)
        return self.due_date - timedelta(minutes=offset_minutes)

    def __post_init__(self) -> None:
        """Validate task fields after initialization."""
        if not self.title or len(self.title.strip()) == 0:
            raise ValueError("Task title cannot be empty")
        if len(self.title) > 200:
            raise ValueError("Task title cannot exceed 200 characters")
        if self.description and len(self.description) > 1000:
            raise ValueError("Task description cannot exceed 1000 characters")
        # Normalize title
        self.title = self.title.strip()
        # Convert string priority to enum if needed
        if isinstance(self.priority, str):
            self.priority = Priority(self.priority.lower())
        # Convert string status to enum if needed
        if isinstance(self.status, str):
            self.status = TaskStatus(self.status.lower())
        # Validate recurrence end date
        if self.recurrence_end_date and self.due_date:
            if self.recurrence_end_date < self.due_date:
                raise ValueError("Recurrence end date must be on or after due date")
        # Validate reminder requires due date
        if self.reminder_offset and not self.due_date:
            raise ValueError("Reminder requires a due date")
