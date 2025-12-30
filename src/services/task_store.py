"""In-memory task storage for Phase I console application with enhanced features."""

from datetime import date, datetime, timedelta
from typing import Any, Callable, Optional, Union

# Sentinel for "value not provided" in update()
class _Unset:
    pass

UNSET = _Unset()

from src.models.task import (
    DueDateFilter,
    Priority,
    RecurrencePattern,
    ReminderOffset,
    SortKey,
    Task,
    TaskStatus,
)

# Type alias for filter predicates
FilterPredicate = Callable[[Task], bool]


class TaskStore:
    """In-memory storage for tasks with CRUD operations.

    This class provides a simple dictionary-based storage mechanism
    for managing tasks during a single session. Data is not persisted
    between sessions.
    """

    def __init__(self) -> None:
        """Initialize the task store with empty storage."""
        self._tasks: dict[int, Task] = {}
        self._next_id: int = 1
        self._current_sort: SortKey = SortKey.CREATED_AT
        self._sort_descending: bool = True
        self._active_filters: dict[str, Any] = {}

    def add(
        self,
        title: str,
        description: Optional[str] = None,
        priority: Priority = Priority.MEDIUM,
        due_date: Optional[datetime] = None,
        recurrence: Optional[RecurrencePattern] = None,
        recurrence_end_date: Optional[datetime] = None,
        reminder_offset: Optional[ReminderOffset] = None,
    ) -> Task:
        """Add a new task to the store.

        Args:
            title: Task title (required)
            description: Optional task description
            priority: Task priority level
            due_date: Optional due date
            recurrence: Optional recurrence pattern
            recurrence_end_date: Optional end date for recurrence
            reminder_offset: Optional reminder timing

        Returns:
            The created Task object with assigned ID

        Raises:
            ValueError: If title is empty or exceeds limits
        """
        task = Task(
            id=self._next_id,
            title=title,
            description=description,
            priority=priority,
            due_date=due_date,
            recurrence=recurrence,
            recurrence_end_date=recurrence_end_date,
            reminder_offset=reminder_offset,
        )
        self._tasks[task.id] = task
        self._next_id += 1
        return task

    def get(self, task_id: int) -> Optional[Task]:
        """Get a task by its ID.

        Args:
            task_id: The unique task identifier

        Returns:
            The Task if found, None otherwise
        """
        return self._tasks.get(task_id)

    def list_all(self) -> list[Task]:
        """Get all tasks in the store, applying current sort.

        Returns:
            List of all tasks sorted by current sort setting
        """
        tasks = list(self._tasks.values())
        return self.sort_tasks(self._current_sort, self._sort_descending, tasks)

    def update(
        self,
        task_id: int,
        title: Union[str, _Unset] = UNSET,
        description: Union[Optional[str], _Unset] = UNSET,
        priority: Union[Priority, _Unset] = UNSET,
        due_date: Union[Optional[datetime], _Unset] = UNSET,
        recurrence: Union[Optional[RecurrencePattern], _Unset] = UNSET,
        recurrence_end_date: Union[Optional[datetime], _Unset] = UNSET,
        reminder_offset: Union[Optional[ReminderOffset], _Unset] = UNSET,
    ) -> Optional[Task]:
        """Update an existing task.

        Args:
            task_id: The task ID to update
            title: New title
            description: New description
            priority: New priority
            due_date: New due date
            recurrence: New recurrence pattern
            recurrence_end_date: New recurrence end date
            reminder_offset: New reminder offset

        Returns:
            The updated Task if found, None otherwise

        Raises:
            ValueError: If new title is invalid
        """
        task = self._tasks.get(task_id)
        if task is None:
            return None

        if not isinstance(title, _Unset):
            if not title or len(title.strip()) == 0:
                raise ValueError("Task title cannot be empty")
            if len(title) > 200:
                raise ValueError("Task title cannot exceed 200 characters")
            task.title = title.strip()

        if not isinstance(description, _Unset):
            if description and len(description) > 1000:
                raise ValueError("Task description cannot exceed 1000 characters")
            task.description = description

        if not isinstance(priority, _Unset):
            task.priority = priority

        if not isinstance(due_date, _Unset):
            task.due_date = due_date

        if not isinstance(recurrence, _Unset):
            task.recurrence = recurrence

        if not isinstance(recurrence_end_date, _Unset):
            task.recurrence_end_date = recurrence_end_date

        if not isinstance(reminder_offset, _Unset):
            if reminder_offset is not None and not task.due_date:
                raise ValueError("Reminder requires a due date")
            task.reminder_offset = reminder_offset
            # Reset shown flag if reminder is new/changed
            task.reminder_shown = False

        return task

    def delete(self, task_id: int) -> bool:
        """Delete a task by its ID.

        Args:
            task_id: The task ID to delete

        Returns:
            True if task was deleted, False if not found
        """
        if task_id in self._tasks:
            del self._tasks[task_id]
            return True
        return False

    def complete(self, task_id: int) -> tuple[Optional[Task], Optional[Task]]:
        """Mark a task as completed. If recurring, creates next occurrence.

        Args:
            task_id: The task ID to complete

        Returns:
            Tuple of (completed_task, new_recurring_task or None)
        """
        task = self._tasks.get(task_id)
        if task is None:
            return (None, None)

        task.status = TaskStatus.COMPLETED

        # Handle recurring task - create next occurrence
        new_task = None
        if task.recurrence and task.due_date:
            # Check if we should create next occurrence
            if not task.recurrence_end_date or datetime.now() < task.recurrence_end_date:
                new_task = self._create_next_occurrence(task)

        return (task, new_task)

    def uncomplete(self, task_id: int) -> Optional[Task]:
        """Mark a task as not completed.

        Args:
            task_id: The task ID to uncomplete

        Returns:
            The updated Task if found, None otherwise
        """
        task = self._tasks.get(task_id)
        if task is not None:
            task.status = TaskStatus.PENDING
        return task

    def count(self) -> tuple[int, int]:
        """Get task counts.

        Returns:
            Tuple of (total_count, pending_count)
        """
        total = len(self._tasks)
        pending = sum(1 for t in self._tasks.values() if t.status != TaskStatus.COMPLETED)
        return total, pending

    def _calculate_next_due(
        self, current_due: datetime, pattern: RecurrencePattern
    ) -> datetime:
        """Calculate next due date based on recurrence pattern."""
        if pattern == RecurrencePattern.DAILY:
            return current_due + timedelta(days=1)
        elif pattern == RecurrencePattern.WEEKLY:
            return current_due + timedelta(weeks=1)
        elif pattern == RecurrencePattern.MONTHLY:
            # Add one month (handle month boundaries)
            year = current_due.year + (current_due.month // 12)
            month = (current_due.month % 12) + 1
            day = min(current_due.day, 28)  # Safe for all months
            return current_due.replace(year=year, month=month, day=day)
        return current_due

    def _create_next_occurrence(self, task: Task) -> Task:
        """Create the next occurrence of a recurring task."""
        next_due = self._calculate_next_due(task.due_date, task.recurrence)  # type: ignore

        return self.add(
            title=task.title,
            description=task.description,
            priority=task.priority,
            due_date=next_due,
            recurrence=task.recurrence,
            recurrence_end_date=task.recurrence_end_date,
            reminder_offset=task.reminder_offset,
        )

    # =========================================================================
    # Search Methods (US1)
    # =========================================================================

    def search_by_keyword(self, keyword: str) -> list[Task]:
        """Search tasks by keyword in title or description (case-insensitive).

        Args:
            keyword: The search term

        Returns:
            List of matching tasks
        """
        if not keyword:
            return []
        keyword_lower = keyword.lower()
        return [
            t for t in self._tasks.values()
            if keyword_lower in t.title.lower()
            or (t.description and keyword_lower in t.description.lower())
        ]

    # =========================================================================
    # Filter Methods (US1)
    # =========================================================================

    def filter_tasks(
        self,
        tasks: Optional[list[Task]] = None,
        status: Optional[TaskStatus] = None,
        priority: Optional[Priority] = None,
        due_date_filter: Optional[DueDateFilter] = None,
    ) -> list[Task]:
        """Filter tasks by status, priority, and/or due date (AND logic).

        Args:
            tasks: List of tasks to filter (defaults to all tasks)
            status: Filter by task status
            priority: Filter by priority level
            due_date_filter: Filter by due date category

        Returns:
            List of tasks matching ALL provided filters
        """
        if tasks is None:
            tasks = list(self._tasks.values())

        predicates: list[FilterPredicate] = []

        if status is not None:
            predicates.append(lambda t, s=status: t.status == s)

        if priority is not None:
            predicates.append(lambda t, p=priority: t.priority == p)

        if due_date_filter is not None:
            predicates.append(self._get_due_date_predicate(due_date_filter))

        if not predicates:
            return tasks

        return [t for t in tasks if all(p(t) for p in predicates)]

    def _get_due_date_predicate(self, filter_type: DueDateFilter) -> FilterPredicate:
        """Get the predicate function for a due date filter."""
        today = date.today()

        if filter_type == DueDateFilter.TODAY:
            return lambda t: t.due_date is not None and t.due_date.date() == today

        elif filter_type == DueDateFilter.THIS_WEEK:
            # Get Monday of current week (ISO 8601)
            week_start = today - timedelta(days=today.weekday())
            week_end = week_start + timedelta(days=6)
            return lambda t: (
                t.due_date is not None
                and week_start <= t.due_date.date() <= week_end
            )

        elif filter_type == DueDateFilter.OVERDUE:
            return lambda t: t.is_overdue

        elif filter_type == DueDateFilter.NO_DUE_DATE:
            return lambda t: t.due_date is None

        return lambda t: True

    def set_filter(
        self,
        status: Optional[TaskStatus] = None,
        priority: Optional[Priority] = None,
        due_date_filter: Optional[DueDateFilter] = None,
    ) -> None:
        """Set active filters for list_all().

        Args:
            status: Filter by task status (None to clear)
            priority: Filter by priority level (None to clear)
            due_date_filter: Filter by due date category (None to clear)
        """
        if status is not None:
            self._active_filters["status"] = status
        elif "status" in self._active_filters:
            del self._active_filters["status"]

        if priority is not None:
            self._active_filters["priority"] = priority
        elif "priority" in self._active_filters:
            del self._active_filters["priority"]

        if due_date_filter is not None:
            self._active_filters["due_date_filter"] = due_date_filter
        elif "due_date_filter" in self._active_filters:
            del self._active_filters["due_date_filter"]

    def clear_filters(self) -> None:
        """Clear all active filters."""
        self._active_filters.clear()

    def get_active_filters(self) -> dict[str, Any]:
        """Get currently active filters.

        Returns:
            Dict of filter names and their values
        """
        return self._active_filters.copy()

    # =========================================================================
    # Sort Methods (US2)
    # =========================================================================

    def sort_tasks(
        self,
        sort_key: SortKey,
        descending: bool = True,
        tasks: Optional[list[Task]] = None,
    ) -> list[Task]:
        """Sort tasks by the specified key.

        Args:
            sort_key: The field to sort by
            descending: Sort in descending order (default True)
            tasks: List of tasks to sort (defaults to all tasks)

        Returns:
            Sorted list of tasks
        """
        if tasks is None:
            tasks = list(self._tasks.values())

        # Priority ranking: HIGH=3, MEDIUM=2, LOW=1
        priority_rank = {Priority.LOW: 1, Priority.MEDIUM: 2, Priority.HIGH: 3}

        if sort_key == SortKey.PRIORITY:
            # Sort by priority rank
            sorted_tasks = sorted(
                tasks,
                key=lambda t: priority_rank[t.priority],
                reverse=descending,
            )
        elif sort_key == SortKey.DUE_DATE:
            # Sort by due date with nulls last
            # For ascending: earliest date first, nulls at end
            # For descending: latest date first, nulls at end
            if descending:
                sorted_tasks = sorted(
                    tasks,
                    key=lambda t: (t.due_date is None, t.due_date if t.due_date else datetime.min),
                    reverse=True,
                )
                # Re-sort to move nulls to end
                with_dates = [t for t in sorted_tasks if t.due_date is not None]
                without_dates = [t for t in sorted_tasks if t.due_date is None]
                sorted_tasks = sorted(with_dates, key=lambda t: t.due_date, reverse=True) + without_dates
            else:
                sorted_tasks = sorted(
                    tasks,
                    key=lambda t: (t.due_date is None, t.due_date if t.due_date else datetime.max),
                )
        elif sort_key == SortKey.CREATED_AT:
            sorted_tasks = sorted(
                tasks,
                key=lambda t: t.created_at,
                reverse=descending,
            )
        else:
            sorted_tasks = tasks

        return sorted_tasks

    def set_sort(self, sort_key: SortKey, descending: bool = True) -> None:
        """Set the current sort order for list_all().

        Args:
            sort_key: The field to sort by
            descending: Sort in descending order (default True)
        """
        self._current_sort = sort_key
        self._sort_descending = descending

    def get_current_sort(self) -> tuple[SortKey, bool]:
        """Get the current sort settings.

        Returns:
            Tuple of (sort_key, descending)
        """
        return self._current_sort, self._sort_descending

    # =========================================================================
    # Status Management Methods (US3)
    # =========================================================================

    def mark_in_progress(self, task_id: int) -> Optional[Task]:
        """Mark a task as in progress.

        Args:
            task_id: The task ID to mark as in progress

        Returns:
            The updated Task if found, None otherwise
        """
        task = self._tasks.get(task_id)
        if task is not None:
            task.status = TaskStatus.IN_PROGRESS
        return task

    def get_progress(self) -> float:
        """Calculate the progress percentage of completed tasks.

        Returns:
            Percentage of completed tasks (0-100)
        """
        total = len(self._tasks)
        if total == 0:
            return 0.0

        completed = sum(1 for t in self._tasks.values() if t.status == TaskStatus.COMPLETED)
        return (completed / total) * 100.0

    # =========================================================================
    # Calendar View Methods (US5)
    # =========================================================================

    @staticmethod
    def get_week_start(for_date: Optional[date] = None) -> date:
        """Get the Monday (ISO 8601) of the week containing the given date.

        Args:
            for_date: The date to get week start for (defaults to today)

        Returns:
            The Monday of the week
        """
        if for_date is None:
            for_date = date.today()
        return for_date - timedelta(days=for_date.weekday())

    def get_daily_tasks(self, for_date: Optional[date] = None) -> list[Task]:
        """Get all tasks due on a specific date.

        Args:
            for_date: The date to get tasks for (defaults to today)

        Returns:
            List of tasks due on that date
        """
        if for_date is None:
            for_date = date.today()

        return [
            t for t in self._tasks.values()
            if t.due_date is not None and t.due_date.date() == for_date
        ]

    def get_weekly_tasks(self, week_start: Optional[date] = None) -> list[Task]:
        """Get all tasks due during a specific week.

        Args:
            week_start: The Monday of the week (defaults to current week)

        Returns:
            List of tasks due during that week
        """
        if week_start is None:
            week_start = self.get_week_start()

        week_end = week_start + timedelta(days=6)

        return [
            t for t in self._tasks.values()
            if t.due_date is not None
            and week_start <= t.due_date.date() <= week_end
        ]

    def get_weekly_tasks_grouped(
        self, week_start: Optional[date] = None
    ) -> dict[date, list[Task]]:
        """Get tasks for a week grouped by day.

        Args:
            week_start: The Monday of the week (defaults to current week)

        Returns:
            Dictionary mapping dates to lists of tasks
        """
        if week_start is None:
            week_start = self.get_week_start()

        # Initialize dict with all days of the week
        grouped: dict[date, list[Task]] = {}
        for i in range(7):
            day = week_start + timedelta(days=i)
            grouped[day] = []

        # Populate with tasks
        for task in self._tasks.values():
            if task.due_date is not None:
                task_date = task.due_date.date()
                if task_date in grouped:
                    grouped[task_date].append(task)

        return grouped

    # =========================================================================
    # Reminder Methods (US6)
    # =========================================================================

    def check_reminders(self) -> list[Task]:
        """Check for reminders that should be displayed now.

        Returns:
            List of tasks whose reminder time has passed and reminder not shown
        """
        now = datetime.now()
        triggered = []

        for task in self._tasks.values():
            if (
                task.status != TaskStatus.COMPLETED
                and task.due_date is not None
                and task.reminder_offset is not None
                and not task.reminder_shown
            ):
                reminder_time = task.reminder_time
                if reminder_time is not None and reminder_time <= now:
                    triggered.append(task)

        return triggered

    def mark_reminder_shown(self, task_id: int) -> None:
        """Mark a task's reminder as having been shown.

        Args:
            task_id: The task ID to update
        """
        task = self._tasks.get(task_id)
        if task:
            task.reminder_shown = True

    def get_upcoming_reminders(self) -> list[Task]:
        """Get all pending tasks that have reminders set.

        Returns:
            List of tasks with reminders, sorted by reminder time
        """
        with_reminders = [
            t for t in self._tasks.values()
            if t.status != TaskStatus.COMPLETED
            and t.reminder_offset is not None
            and t.due_date is not None
        ]

        return sorted(with_reminders, key=lambda t: t.reminder_time)  # type: ignore

    def get_overdue_tasks(self) -> list[Task]:
        """Get all tasks that are overdue.

        Returns:
            List of overdue tasks
        """
        return [t for t in self._tasks.values() if t.is_overdue]

    def count_by_status(self) -> dict[str, int]:
        """Count tasks by status.

        Returns:
            Dictionary mapping status names to counts
        """
        counts = {
            "total": len(self._tasks),
            TaskStatus.PENDING.value: 0,
            TaskStatus.IN_PROGRESS.value: 0,
            TaskStatus.COMPLETED.value: 0,
        }

        for task in self._tasks.values():
            counts[task.status.value] += 1

        return counts
