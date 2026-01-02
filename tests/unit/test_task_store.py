"""Unit tests for TaskStore service."""

from datetime import date, datetime, timedelta

import pytest

from src.models.task import (
    DueDateFilter,
    Priority,
    RecurrencePattern,
    ReminderOffset,
    SortKey,
    Task,
    TaskStatus,
)
from src.services.task_store import TaskStore


class TestTaskStore:
    """Tests for TaskStore CRUD operations."""

    def setup_method(self) -> None:
        """Create a fresh TaskStore for each test."""
        self.store = TaskStore()

    def test_add_task_basic(self) -> None:
        """Test adding a basic task with only title."""
        task = self.store.add("Buy groceries")

        assert task.id == 1
        assert task.title == "Buy groceries"
        assert task.description is None
        assert task.status == TaskStatus.PENDING
        assert task.priority == Priority.MEDIUM

    def test_add_task_with_all_fields(self) -> None:
        """Test adding a task with all optional fields."""
        due_date = datetime(2025, 1, 15)
        task = self.store.add(
            title="Complete report",
            description="Quarterly financial report",
            priority=Priority.HIGH,
            due_date=due_date,
        )

        assert task.id == 1
        assert task.title == "Complete report"
        assert task.description == "Quarterly financial report"
        assert task.priority == Priority.HIGH
        assert task.due_date == due_date

    def test_add_multiple_tasks_increments_id(self) -> None:
        """Test that task IDs auto-increment."""
        task1 = self.store.add("Task 1")
        task2 = self.store.add("Task 2")
        task3 = self.store.add("Task 3")

        assert task1.id == 1
        assert task2.id == 2
        assert task3.id == 3

    def test_add_task_empty_title_raises(self) -> None:
        """Test that empty title raises ValueError."""
        with pytest.raises(ValueError, match="title cannot be empty"):
            self.store.add("")

    def test_add_task_whitespace_title_raises(self) -> None:
        """Test that whitespace-only title raises ValueError."""
        with pytest.raises(ValueError, match="title cannot be empty"):
            self.store.add("   ")

    def test_add_task_long_title_raises(self) -> None:
        """Test that title over 200 chars raises ValueError."""
        long_title = "x" * 201
        with pytest.raises(ValueError, match="cannot exceed 200 characters"):
            self.store.add(long_title)

    def test_get_existing_task(self) -> None:
        """Test getting an existing task by ID."""
        self.store.add("Test task")
        task = self.store.get(1)

        assert task is not None
        assert task.title == "Test task"

    def test_get_nonexistent_task_returns_none(self) -> None:
        """Test that getting non-existent task returns None."""
        task = self.store.get(99)
        assert task is None

    def test_list_all_empty(self) -> None:
        """Test listing tasks when store is empty."""
        tasks = self.store.list_all()
        assert tasks == []

    def test_list_all_returns_sorted_by_current_sort(self) -> None:
        """Test that list_all returns tasks sorted by current sort setting.

        Default sort is CREATED_AT descending (newest first).
        """
        self.store.add("Task 1")
        self.store.add("Task 2")
        self.store.add("Task 3")

        tasks = self.store.list_all()

        assert len(tasks) == 3
        # Default sort is CREATED_AT descending, so newest (ID 3) comes first
        assert [t.id for t in tasks] == [3, 2, 1]

    def test_update_title(self) -> None:
        """Test updating task title."""
        self.store.add("Original title")
        updated = self.store.update(1, title="New title")

        assert updated is not None
        assert updated.title == "New title"

    def test_update_nonexistent_returns_none(self) -> None:
        """Test updating non-existent task returns None."""
        result = self.store.update(99, title="New title")
        assert result is None

    def test_update_empty_title_raises(self) -> None:
        """Test that updating with empty title raises ValueError."""
        self.store.add("Original")
        with pytest.raises(ValueError, match="title cannot be empty"):
            self.store.update(1, title="")

    def test_delete_existing_task(self) -> None:
        """Test deleting an existing task."""
        self.store.add("To be deleted")
        result = self.store.delete(1)

        assert result is True
        assert self.store.get(1) is None

    def test_delete_nonexistent_returns_false(self) -> None:
        """Test deleting non-existent task returns False."""
        result = self.store.delete(99)
        assert result is False

    def test_complete_task(self) -> None:
        """Test marking task as complete."""
        self.store.add("To be completed")
        result = self.store.complete(1)

        # complete() now returns tuple (completed_task, new_recurring_task)
        completed_task, new_task = result
        assert completed_task is not None
        assert completed_task.status == TaskStatus.COMPLETED
        assert new_task is None  # Non-recurring task

    def test_complete_nonexistent_returns_none(self) -> None:
        """Test completing non-existent task returns None."""
        result = self.store.complete(99)
        assert result == (None, None)

    def test_uncomplete_task(self) -> None:
        """Test marking task as incomplete."""
        self.store.add("Task")
        self.store.complete(1)
        task = self.store.uncomplete(1)

        assert task is not None
        assert task.status == TaskStatus.PENDING

    def test_count_empty_store(self) -> None:
        """Test count on empty store."""
        total, pending = self.store.count()
        assert total == 0
        assert pending == 0

    def test_count_with_tasks(self) -> None:
        """Test count with mixed completed/pending tasks."""
        self.store.add("Task 1")
        self.store.add("Task 2")
        self.store.add("Task 3")
        self.store.complete(1)

        total, pending = self.store.count()
        assert total == 3
        assert pending == 2


class TestTaskModel:
    """Tests for Task dataclass validation."""

    def test_task_creation_basic(self) -> None:
        """Test basic task creation."""
        task = Task(id=1, title="Test")

        assert task.id == 1
        assert task.title == "Test"
        assert task.status == TaskStatus.PENDING

    def test_task_strips_title_whitespace(self) -> None:
        """Test that task title whitespace is stripped."""
        task = Task(id=1, title="  Trimmed  ")
        assert task.title == "Trimmed"

    def test_task_empty_title_raises(self) -> None:
        """Test that empty title raises ValueError."""
        with pytest.raises(ValueError, match="title cannot be empty"):
            Task(id=1, title="")

    def test_task_priority_string_conversion(self) -> None:
        """Test that string priority is converted to enum."""
        task = Task(id=1, title="Test", priority="high")  # type: ignore
        assert task.priority == Priority.HIGH

    def test_priority_enum_values(self) -> None:
        """Test Priority enum values."""
        assert Priority.LOW.value == "low"
        assert Priority.MEDIUM.value == "medium"
        assert Priority.HIGH.value == "high"


class TestNewEnums:
    """Tests for new enums added in Phase I enhancement (T015)."""

    def test_task_status_enum_values(self) -> None:
        """Test TaskStatus enum values."""
        assert TaskStatus.PENDING.value == "pending"
        assert TaskStatus.IN_PROGRESS.value == "in_progress"
        assert TaskStatus.COMPLETED.value == "completed"

    def test_recurrence_pattern_enum_values(self) -> None:
        """Test RecurrencePattern enum values."""
        assert RecurrencePattern.DAILY.value == "daily"
        assert RecurrencePattern.WEEKLY.value == "weekly"
        assert RecurrencePattern.MONTHLY.value == "monthly"

    def test_reminder_offset_enum_values(self) -> None:
        """Test ReminderOffset enum values."""
        assert ReminderOffset.AT_DUE_TIME.value == "0"
        assert ReminderOffset.FIFTEEN_MIN_BEFORE.value == "15"
        assert ReminderOffset.ONE_HOUR_BEFORE.value == "60"
        assert ReminderOffset.ONE_DAY_BEFORE.value == "1440"

    def test_sort_key_enum_values(self) -> None:
        """Test SortKey enum values."""
        assert SortKey.PRIORITY.value == "priority"
        assert SortKey.DUE_DATE.value == "due_date"
        assert SortKey.CREATED_AT.value == "created_at"

    def test_due_date_filter_enum_values(self) -> None:
        """Test DueDateFilter enum values."""
        assert DueDateFilter.TODAY.value == "today"
        assert DueDateFilter.THIS_WEEK.value == "this_week"
        assert DueDateFilter.OVERDUE.value == "overdue"
        assert DueDateFilter.NO_DUE_DATE.value == "no_due_date"


class TestTaskComputedProperties:
    """Tests for Task computed properties (T016)."""

    def test_is_overdue_with_past_due_date(self) -> None:
        """Test is_overdue returns True for past due date."""
        past_date = datetime.now() - timedelta(days=1)
        task = Task(id=1, title="Overdue task", due_date=past_date)
        assert task.is_overdue is True

    def test_is_overdue_with_future_due_date(self) -> None:
        """Test is_overdue returns False for future due date."""
        future_date = datetime.now() + timedelta(days=1)
        task = Task(id=1, title="Future task", due_date=future_date)
        assert task.is_overdue is False

    def test_is_overdue_when_completed(self) -> None:
        """Test is_overdue returns False when task is completed."""
        past_date = datetime.now() - timedelta(days=1)
        task = Task(id=1, title="Done task", due_date=past_date, status=TaskStatus.COMPLETED)
        assert task.is_overdue is False

    def test_is_overdue_without_due_date(self) -> None:
        """Test is_overdue returns False when no due date."""
        task = Task(id=1, title="No due date")
        assert task.is_overdue is False

    def test_reminder_time_calculation(self) -> None:
        """Test reminder_time is calculated correctly."""
        due_date = datetime(2025, 12, 30, 10, 0)
        task = Task(
            id=1,
            title="Task with reminder",
            due_date=due_date,
            reminder_offset=ReminderOffset.ONE_HOUR_BEFORE,
        )
        expected = datetime(2025, 12, 30, 9, 0)
        assert task.reminder_time == expected

    def test_reminder_time_fifteen_minutes(self) -> None:
        """Test reminder_time for 15 minutes before."""
        due_date = datetime(2025, 12, 30, 10, 0)
        task = Task(
            id=1,
            title="Task",
            due_date=due_date,
            reminder_offset=ReminderOffset.FIFTEEN_MIN_BEFORE,
        )
        expected = datetime(2025, 12, 30, 9, 45)
        assert task.reminder_time == expected

    def test_reminder_time_one_day_before(self) -> None:
        """Test reminder_time for 1 day before."""
        due_date = datetime(2025, 12, 30, 10, 0)
        task = Task(
            id=1,
            title="Task",
            due_date=due_date,
            reminder_offset=ReminderOffset.ONE_DAY_BEFORE,
        )
        expected = datetime(2025, 12, 29, 10, 0)
        assert task.reminder_time == expected

    def test_reminder_time_without_due_date(self) -> None:
        """Test reminder_time is None without due date."""
        task = Task(id=1, title="No due date")
        assert task.reminder_time is None

    def test_reminder_time_without_offset(self) -> None:
        """Test reminder_time is None without offset."""
        task = Task(id=1, title="Task", due_date=datetime.now())
        assert task.reminder_time is None

    def test_task_validation_reminder_without_due_date_raises(self) -> None:
        """Test that setting reminder without due date raises error."""
        with pytest.raises(ValueError, match="Reminder requires a due date"):
            Task(
                id=1,
                title="Invalid",
                reminder_offset=ReminderOffset.ONE_HOUR_BEFORE,
            )

    def test_task_validation_recurrence_end_before_due_raises(self) -> None:
        """Test that recurrence_end_date before due_date raises error."""
        with pytest.raises(ValueError, match="Recurrence end date must be on or after due date"):
            Task(
                id=1,
                title="Invalid",
                due_date=datetime(2025, 12, 30),
                recurrence=RecurrencePattern.DAILY,
                recurrence_end_date=datetime(2025, 12, 25),
            )

    def test_task_status_string_conversion(self) -> None:
        """Test that string status is converted to enum."""
        task = Task(id=1, title="Test", status="in_progress")  # type: ignore
        assert task.status == TaskStatus.IN_PROGRESS


class TestSearchByKeyword:
    """Tests for search_by_keyword method (T017)."""

    def setup_method(self) -> None:
        """Create a fresh TaskStore with sample tasks."""
        self.store = TaskStore()
        self.store.add("Buy groceries", description="Get milk and bread")
        self.store.add("Team meeting", description="Weekly standup")
        self.store.add("Review PR", description="Code review for feature branch")
        self.store.add("Buy birthday gift")

    def test_search_by_keyword_in_title(self) -> None:
        """Test search finds matches in title."""
        results = self.store.search_by_keyword("meeting")
        assert len(results) == 1
        assert results[0].title == "Team meeting"

    def test_search_by_keyword_in_description(self) -> None:
        """Test search finds matches in description."""
        results = self.store.search_by_keyword("milk")
        assert len(results) == 1
        assert results[0].title == "Buy groceries"

    def test_search_is_case_insensitive(self) -> None:
        """Test search is case-insensitive (per clarification)."""
        results = self.store.search_by_keyword("MEETING")
        assert len(results) == 1
        assert results[0].title == "Team meeting"

    def test_search_partial_match(self) -> None:
        """Test search finds partial matches."""
        results = self.store.search_by_keyword("Buy")
        assert len(results) == 2

    def test_search_no_matches(self) -> None:
        """Test search returns empty list when no matches."""
        results = self.store.search_by_keyword("xyz123")
        assert results == []

    def test_search_empty_keyword(self) -> None:
        """Test search with empty keyword returns empty list."""
        results = self.store.search_by_keyword("")
        assert results == []


class TestFilterByStatus:
    """Tests for filter_tasks with status filter (T018)."""

    def setup_method(self) -> None:
        """Create a fresh TaskStore with tasks in different states."""
        self.store = TaskStore()
        self.store.add("Pending task 1")
        self.store.add("Pending task 2")
        task3 = self.store.add("In progress task")
        task3.status = TaskStatus.IN_PROGRESS
        task4 = self.store.add("Completed task")
        task4.status = TaskStatus.COMPLETED

    def test_filter_by_pending_status(self) -> None:
        """Test filtering by pending status."""
        results = self.store.filter_tasks(status=TaskStatus.PENDING)
        assert len(results) == 2
        assert all(t.status == TaskStatus.PENDING for t in results)

    def test_filter_by_in_progress_status(self) -> None:
        """Test filtering by in_progress status."""
        results = self.store.filter_tasks(status=TaskStatus.IN_PROGRESS)
        assert len(results) == 1
        assert results[0].title == "In progress task"

    def test_filter_by_completed_status(self) -> None:
        """Test filtering by completed status."""
        results = self.store.filter_tasks(status=TaskStatus.COMPLETED)
        assert len(results) == 1
        assert results[0].title == "Completed task"


class TestFilterByPriority:
    """Tests for filter_tasks with priority filter (T019)."""

    def setup_method(self) -> None:
        """Create a fresh TaskStore with tasks of different priorities."""
        self.store = TaskStore()
        self.store.add("Low priority", priority=Priority.LOW)
        self.store.add("Medium priority 1", priority=Priority.MEDIUM)
        self.store.add("Medium priority 2", priority=Priority.MEDIUM)
        self.store.add("High priority", priority=Priority.HIGH)

    def test_filter_by_low_priority(self) -> None:
        """Test filtering by low priority."""
        results = self.store.filter_tasks(priority=Priority.LOW)
        assert len(results) == 1
        assert results[0].title == "Low priority"

    def test_filter_by_medium_priority(self) -> None:
        """Test filtering by medium priority."""
        results = self.store.filter_tasks(priority=Priority.MEDIUM)
        assert len(results) == 2

    def test_filter_by_high_priority(self) -> None:
        """Test filtering by high priority."""
        results = self.store.filter_tasks(priority=Priority.HIGH)
        assert len(results) == 1
        assert results[0].title == "High priority"


class TestFilterByDueDate:
    """Tests for filter_tasks with due date filter (T020)."""

    def setup_method(self) -> None:
        """Create a fresh TaskStore with tasks with different due dates."""
        self.store = TaskStore()
        # Use date-based times to avoid race conditions with datetime.now()
        today_date = date.today()
        # Use end of day for "today" to ensure it's not already past
        today_end = datetime.combine(today_date, datetime.max.time().replace(microsecond=0))
        yesterday = datetime.combine(today_date - timedelta(days=1), datetime.min.time())
        tomorrow = datetime.combine(today_date + timedelta(days=1), datetime.min.time())
        next_week = datetime.combine(today_date + timedelta(days=10), datetime.min.time())

        self.store.add("Overdue task", due_date=yesterday)
        self.store.add("Due today", due_date=today_end)
        self.store.add("Due tomorrow", due_date=tomorrow)
        self.store.add("Due next week", due_date=next_week)
        self.store.add("No due date")

    def test_filter_by_today(self) -> None:
        """Test filtering by today's tasks."""
        results = self.store.filter_tasks(due_date_filter=DueDateFilter.TODAY)
        assert len(results) == 1
        assert results[0].title == "Due today"

    def test_filter_by_overdue(self) -> None:
        """Test filtering by overdue tasks."""
        results = self.store.filter_tasks(due_date_filter=DueDateFilter.OVERDUE)
        assert len(results) == 1
        assert results[0].title == "Overdue task"

    def test_filter_by_no_due_date(self) -> None:
        """Test filtering by tasks without due date."""
        results = self.store.filter_tasks(due_date_filter=DueDateFilter.NO_DUE_DATE)
        assert len(results) == 1
        assert results[0].title == "No due date"


class TestFilterCombination:
    """Tests for combining multiple filters with AND logic (T021)."""

    def setup_method(self) -> None:
        """Create a fresh TaskStore with varied tasks."""
        self.store = TaskStore()
        today = datetime.now()

        # Task 1: pending, high priority, due today
        self.store.add("Urgent today task", priority=Priority.HIGH, due_date=today)

        # Task 2: pending, high priority, no due date
        self.store.add("High priority no date", priority=Priority.HIGH)

        # Task 3: completed, high priority, due today
        task3 = self.store.add("Completed today", priority=Priority.HIGH, due_date=today)
        task3.status = TaskStatus.COMPLETED

        # Task 4: pending, low priority, due today
        self.store.add("Low priority today", priority=Priority.LOW, due_date=today)

    def test_filter_status_and_priority(self) -> None:
        """Test combining status and priority filters."""
        results = self.store.filter_tasks(
            status=TaskStatus.PENDING,
            priority=Priority.HIGH,
        )
        assert len(results) == 2
        assert all(t.status == TaskStatus.PENDING for t in results)
        assert all(t.priority == Priority.HIGH for t in results)

    def test_filter_status_priority_and_due_date(self) -> None:
        """Test combining all three filters (AND logic per clarification)."""
        results = self.store.filter_tasks(
            status=TaskStatus.PENDING,
            priority=Priority.HIGH,
            due_date_filter=DueDateFilter.TODAY,
        )
        assert len(results) == 1
        assert results[0].title == "Urgent today task"

    def test_filter_returns_empty_when_no_match(self) -> None:
        """Test filter returns empty list when no tasks match all criteria."""
        results = self.store.filter_tasks(
            status=TaskStatus.IN_PROGRESS,
            priority=Priority.HIGH,
        )
        assert results == []

    def test_no_filters_returns_all(self) -> None:
        """Test that no filters returns all tasks."""
        results = self.store.filter_tasks()
        assert len(results) == 4


class TestSortByPriority:
    """Tests for sort_tasks by priority (T037)."""

    def setup_method(self) -> None:
        """Create a fresh TaskStore with tasks of different priorities."""
        self.store = TaskStore()
        self.store.add("Medium task", priority=Priority.MEDIUM)
        self.store.add("High task", priority=Priority.HIGH)
        self.store.add("Low task", priority=Priority.LOW)

    def test_sort_by_priority_descending(self) -> None:
        """Test sorting by priority descending (HIGH first)."""
        results = self.store.sort_tasks(SortKey.PRIORITY, descending=True)
        assert results[0].title == "High task"
        assert results[1].title == "Medium task"
        assert results[2].title == "Low task"

    def test_sort_by_priority_ascending(self) -> None:
        """Test sorting by priority ascending (LOW first)."""
        results = self.store.sort_tasks(SortKey.PRIORITY, descending=False)
        assert results[0].title == "Low task"
        assert results[1].title == "Medium task"
        assert results[2].title == "High task"


class TestSortByDueDate:
    """Tests for sort_tasks by due_date with nulls last (T038)."""

    def setup_method(self) -> None:
        """Create a fresh TaskStore with tasks with different due dates."""
        self.store = TaskStore()
        self.store.add("No due date")
        self.store.add("Due tomorrow", due_date=datetime.now() + timedelta(days=1))
        self.store.add("Due today", due_date=datetime.now())
        self.store.add("Due next week", due_date=datetime.now() + timedelta(days=7))

    def test_sort_by_due_date_ascending_nulls_last(self) -> None:
        """Test sorting by due date ascending with nulls last."""
        results = self.store.sort_tasks(SortKey.DUE_DATE, descending=False)
        # Due today, tomorrow, next week, then no due date (null last)
        assert results[0].title == "Due today"
        assert results[1].title == "Due tomorrow"
        assert results[2].title == "Due next week"
        assert results[3].title == "No due date"

    def test_sort_by_due_date_descending_nulls_last(self) -> None:
        """Test sorting by due date descending with nulls last."""
        results = self.store.sort_tasks(SortKey.DUE_DATE, descending=True)
        # Next week, tomorrow, today, then no due date (null last)
        assert results[0].title == "Due next week"
        assert results[1].title == "Due tomorrow"
        assert results[2].title == "Due today"
        assert results[3].title == "No due date"


class TestSortDirection:
    """Tests for sort_tasks ascending vs descending (T039)."""

    def setup_method(self) -> None:
        """Create a fresh TaskStore with tasks created at different times."""
        self.store = TaskStore()
        # Tasks are created in order, so created_at will be sequential
        self.store.add("First task")
        self.store.add("Second task")
        self.store.add("Third task")

    def test_sort_by_created_at_ascending(self) -> None:
        """Test sorting by created_at ascending (oldest first)."""
        results = self.store.sort_tasks(SortKey.CREATED_AT, descending=False)
        assert results[0].title == "First task"
        assert results[1].title == "Second task"
        assert results[2].title == "Third task"

    def test_sort_by_created_at_descending(self) -> None:
        """Test sorting by created_at descending (newest first)."""
        results = self.store.sort_tasks(SortKey.CREATED_AT, descending=True)
        assert results[0].title == "Third task"
        assert results[1].title == "Second task"
        assert results[2].title == "First task"

    def test_set_and_get_sort(self) -> None:
        """Test set_sort() and get_current_sort()."""
        self.store.set_sort(SortKey.PRIORITY, descending=True)
        sort_key, descending = self.store.get_current_sort()
        assert sort_key == SortKey.PRIORITY
        assert descending is True

    def test_list_all_applies_current_sort(self) -> None:
        """Test that list_all() applies the current sort setting."""
        # Default sort is CREATED_AT descending
        self.store.set_sort(SortKey.CREATED_AT, descending=True)
        results = self.store.list_all()
        assert results[0].title == "Third task"
        assert results[2].title == "First task"


class TestMarkInProgress:
    """Tests for mark_in_progress() method (T048)."""

    def setup_method(self) -> None:
        """Create a fresh TaskStore with a task."""
        self.store = TaskStore()
        self.store.add("Test task")

    def test_mark_in_progress_from_pending(self) -> None:
        """Test marking a pending task as in progress."""
        task = self.store.mark_in_progress(1)
        assert task is not None
        assert task.status == TaskStatus.IN_PROGRESS

    def test_mark_in_progress_from_completed(self) -> None:
        """Test marking a completed task as in progress."""
        self.store.complete(1)
        task = self.store.mark_in_progress(1)
        assert task is not None
        assert task.status == TaskStatus.IN_PROGRESS

    def test_mark_in_progress_nonexistent_returns_none(self) -> None:
        """Test that marking non-existent task returns None."""
        result = self.store.mark_in_progress(99)
        assert result is None

    def test_mark_in_progress_already_in_progress(self) -> None:
        """Test marking already in-progress task stays in progress."""
        self.store.mark_in_progress(1)
        task = self.store.mark_in_progress(1)
        assert task is not None
        assert task.status == TaskStatus.IN_PROGRESS


class TestGetProgress:
    """Tests for get_progress() calculation (T049)."""

    def setup_method(self) -> None:
        """Create a fresh TaskStore."""
        self.store = TaskStore()

    def test_progress_empty_store(self) -> None:
        """Test progress with no tasks returns 0."""
        progress = self.store.get_progress()
        assert progress == 0.0

    def test_progress_all_pending(self) -> None:
        """Test progress with all pending tasks."""
        self.store.add("Task 1")
        self.store.add("Task 2")
        progress = self.store.get_progress()
        assert progress == 0.0

    def test_progress_all_completed(self) -> None:
        """Test progress with all completed tasks."""
        self.store.add("Task 1")
        self.store.add("Task 2")
        self.store.complete(1)
        self.store.complete(2)
        progress = self.store.get_progress()
        assert progress == 100.0

    def test_progress_half_completed(self) -> None:
        """Test progress with half completed tasks."""
        self.store.add("Task 1")
        self.store.add("Task 2")
        self.store.complete(1)
        progress = self.store.get_progress()
        assert progress == 50.0

    def test_progress_mixed_states(self) -> None:
        """Test progress with mixed states (pending, in_progress, completed)."""
        self.store.add("Pending task")
        self.store.add("In progress task")
        self.store.add("Completed task")
        self.store.add("Another completed")

        self.store.mark_in_progress(2)
        self.store.complete(3)
        self.store.complete(4)

        # 2 completed out of 4 = 50%
        progress = self.store.get_progress()
        assert progress == 50.0


class TestStatusTransitions:
    """Tests for status transitions (T050)."""

    def setup_method(self) -> None:
        """Create a fresh TaskStore with a task."""
        self.store = TaskStore()
        self.store.add("Test task")

    def test_pending_to_in_progress(self) -> None:
        """Test transition from pending to in_progress."""
        task = self.store.get(1)
        assert task.status == TaskStatus.PENDING

        self.store.mark_in_progress(1)
        task = self.store.get(1)
        assert task.status == TaskStatus.IN_PROGRESS

    def test_in_progress_to_completed(self) -> None:
        """Test transition from in_progress to completed."""
        self.store.mark_in_progress(1)
        self.store.complete(1)

        task = self.store.get(1)
        assert task.status == TaskStatus.COMPLETED

    def test_completed_to_pending_via_uncomplete(self) -> None:
        """Test transition from completed back to pending."""
        self.store.complete(1)
        self.store.uncomplete(1)

        task = self.store.get(1)
        assert task.status == TaskStatus.PENDING

    def test_pending_to_completed_directly(self) -> None:
        """Test direct transition from pending to completed."""
        self.store.complete(1)

        task = self.store.get(1)
        assert task.status == TaskStatus.COMPLETED

    def test_full_lifecycle(self) -> None:
        """Test full task lifecycle: pending → in_progress → completed → pending."""
        task = self.store.get(1)
        assert task.status == TaskStatus.PENDING

        self.store.mark_in_progress(1)
        task = self.store.get(1)
        assert task.status == TaskStatus.IN_PROGRESS

        self.store.complete(1)
        task = self.store.get(1)
        assert task.status == TaskStatus.COMPLETED

        self.store.uncomplete(1)
        task = self.store.get(1)
        assert task.status == TaskStatus.PENDING


class TestRecurringTasksDaily:
    """Tests for complete() with daily recurrence (T062)."""

    def setup_method(self) -> None:
        """Create a fresh TaskStore."""
        self.store = TaskStore()

    def test_complete_daily_recurring_creates_next_occurrence(self) -> None:
        """Test completing a daily recurring task creates next day's task."""
        due_date = datetime(2025, 1, 15, 10, 0)
        task = self.store.add(
            "Daily standup",
            due_date=due_date,
            recurrence=RecurrencePattern.DAILY,
        )

        completed_task, new_task = self.store.complete(task.id)

        assert completed_task is not None
        assert completed_task.status == TaskStatus.COMPLETED
        assert new_task is not None
        assert new_task.title == "Daily standup"
        assert new_task.due_date == datetime(2025, 1, 16, 10, 0)
        assert new_task.recurrence == RecurrencePattern.DAILY
        assert new_task.status == TaskStatus.PENDING

    def test_daily_recurrence_preserves_task_properties(self) -> None:
        """Test that new recurring task preserves original properties."""
        due_date = datetime(2025, 1, 15)
        task = self.store.add(
            "Daily task",
            description="Important daily task",
            priority=Priority.HIGH,
            due_date=due_date,
            recurrence=RecurrencePattern.DAILY,
            reminder_offset=ReminderOffset.ONE_HOUR_BEFORE,
        )

        _, new_task = self.store.complete(task.id)

        assert new_task.description == "Important daily task"
        assert new_task.priority == Priority.HIGH
        assert new_task.reminder_offset == ReminderOffset.ONE_HOUR_BEFORE


class TestRecurringTasksWeekly:
    """Tests for complete() with weekly recurrence (T063)."""

    def setup_method(self) -> None:
        """Create a fresh TaskStore."""
        self.store = TaskStore()

    def test_complete_weekly_recurring_creates_next_occurrence(self) -> None:
        """Test completing a weekly recurring task creates next week's task."""
        due_date = datetime(2025, 1, 15, 14, 0)  # Wednesday
        task = self.store.add(
            "Weekly review",
            due_date=due_date,
            recurrence=RecurrencePattern.WEEKLY,
        )

        completed_task, new_task = self.store.complete(task.id)

        assert completed_task.status == TaskStatus.COMPLETED
        assert new_task is not None
        assert new_task.due_date == datetime(2025, 1, 22, 14, 0)  # Next Wednesday
        assert new_task.recurrence == RecurrencePattern.WEEKLY

    def test_weekly_recurrence_over_month_boundary(self) -> None:
        """Test weekly recurrence that crosses month boundary."""
        due_date = datetime(2025, 1, 29)  # Wednesday
        task = self.store.add(
            "Weekly task",
            due_date=due_date,
            recurrence=RecurrencePattern.WEEKLY,
        )

        _, new_task = self.store.complete(task.id)

        assert new_task.due_date == datetime(2025, 2, 5)  # Next Wednesday (February)


class TestRecurringTasksMonthly:
    """Tests for complete() with monthly recurrence (T064)."""

    def setup_method(self) -> None:
        """Create a fresh TaskStore."""
        self.store = TaskStore()

    def test_complete_monthly_recurring_creates_next_occurrence(self) -> None:
        """Test completing a monthly recurring task creates next month's task."""
        due_date = datetime(2025, 1, 15)
        task = self.store.add(
            "Monthly report",
            due_date=due_date,
            recurrence=RecurrencePattern.MONTHLY,
        )

        completed_task, new_task = self.store.complete(task.id)

        assert completed_task.status == TaskStatus.COMPLETED
        assert new_task is not None
        assert new_task.due_date.month == 2
        assert new_task.due_date.year == 2025
        assert new_task.recurrence == RecurrencePattern.MONTHLY

    def test_monthly_recurrence_handles_day_overflow(self) -> None:
        """Test monthly recurrence handles months with fewer days (e.g., Jan 31 → Feb 28)."""
        due_date = datetime(2025, 1, 31)
        task = self.store.add(
            "End of month task",
            due_date=due_date,
            recurrence=RecurrencePattern.MONTHLY,
        )

        _, new_task = self.store.complete(task.id)

        # Day is capped to 28 for safety
        assert new_task.due_date.day <= 28
        assert new_task.due_date.month == 2

    def test_monthly_recurrence_over_year_boundary(self) -> None:
        """Test monthly recurrence that crosses year boundary."""
        due_date = datetime(2025, 12, 15)
        task = self.store.add(
            "Monthly task",
            due_date=due_date,
            recurrence=RecurrencePattern.MONTHLY,
        )

        _, new_task = self.store.complete(task.id)

        assert new_task.due_date.year == 2026
        assert new_task.due_date.month == 1


class TestRecurrenceEndDate:
    """Tests for recurrence with end_date (T065)."""

    def setup_method(self) -> None:
        """Create a fresh TaskStore."""
        self.store = TaskStore()

    def test_recurrence_stops_after_end_date(self) -> None:
        """Test that recurrence stops when next due date exceeds end date.

        This tests the scenario where:
        - Task is due in 2 days
        - End date is in 2.5 days (so end_date >= due_date for task creation)
        - Next occurrence would be in 3 days
        - Since next_due (3 days) > end_date (2.5 days), no new task should be created
        """
        now = datetime.now()
        due_date = now + timedelta(days=2)  # Due in 2 days
        end_date = now + timedelta(days=2, hours=12)  # End date is 2.5 days from now
        task = self.store.add(
            "Limited recurrence",
            due_date=due_date,
            recurrence=RecurrencePattern.DAILY,
            recurrence_end_date=end_date,
        )

        completed_task, new_task = self.store.complete(task.id)

        assert completed_task.status == TaskStatus.COMPLETED
        # Should NOT create new task since next_due (now + 3 days) > end_date (now + 2.5 days)
        assert new_task is None

    def test_recurrence_continues_before_end_date(self) -> None:
        """Test that recurrence continues before end date."""
        # Use future dates to ensure now() < end_date
        due_date = datetime(2026, 1, 15)
        end_date = datetime(2026, 1, 31)  # End date is after next occurrence
        task = self.store.add(
            "Continuing recurrence",
            due_date=due_date,
            recurrence=RecurrencePattern.DAILY,
            recurrence_end_date=end_date,
        )

        completed_task, new_task = self.store.complete(task.id)

        assert completed_task.status == TaskStatus.COMPLETED
        assert new_task is not None
        assert new_task.recurrence_end_date == end_date

    def test_non_recurring_task_returns_none(self) -> None:
        """Test that completing non-recurring task returns None for new_task."""
        task = self.store.add(
            "One-time task",
            due_date=datetime(2025, 1, 15),
        )

        completed_task, new_task = self.store.complete(task.id)

        assert completed_task.status == TaskStatus.COMPLETED
        assert new_task is None

    def test_recurring_without_due_date_returns_none(self) -> None:
        """Test that recurring task without due date doesn't create new occurrence."""
        task = self.store.add("No due date task")
        task.recurrence = RecurrencePattern.DAILY  # Set directly (normally would fail validation)

        completed_task, new_task = self.store.complete(task.id)

        assert completed_task.status == TaskStatus.COMPLETED
        assert new_task is None


class TestGetDailyTasks:
    """Tests for get_daily_tasks() method (T075)."""

    def setup_method(self) -> None:
        """Create a fresh TaskStore with tasks on different days."""
        self.store = TaskStore()
        # Tasks for today
        self.today = date.today()
        self.store.add("Today task 1", due_date=datetime.combine(self.today, datetime.min.time()))
        self.store.add("Today task 2", due_date=datetime.combine(self.today, datetime.min.time()))
        # Task for tomorrow
        self.tomorrow = self.today + timedelta(days=1)
        self.store.add("Tomorrow task", due_date=datetime.combine(self.tomorrow, datetime.min.time()))
        # Task for yesterday
        self.yesterday = self.today - timedelta(days=1)
        self.store.add("Yesterday task", due_date=datetime.combine(self.yesterday, datetime.min.time()))
        # Task with no due date
        self.store.add("No due date task")

    def test_get_daily_tasks_for_today(self) -> None:
        """Test getting tasks for today."""
        tasks = self.store.get_daily_tasks(self.today)
        assert len(tasks) == 2
        assert all("Today" in t.title for t in tasks)

    def test_get_daily_tasks_for_tomorrow(self) -> None:
        """Test getting tasks for tomorrow."""
        tasks = self.store.get_daily_tasks(self.tomorrow)
        assert len(tasks) == 1
        assert tasks[0].title == "Tomorrow task"

    def test_get_daily_tasks_for_day_with_no_tasks(self) -> None:
        """Test getting tasks for a day with no tasks."""
        next_week = self.today + timedelta(days=7)
        tasks = self.store.get_daily_tasks(next_week)
        assert len(tasks) == 0

    def test_get_daily_tasks_default_is_today(self) -> None:
        """Test that get_daily_tasks defaults to today."""
        tasks = self.store.get_daily_tasks()
        assert len(tasks) == 2


class TestGetWeeklyTasks:
    """Tests for get_weekly_tasks() method (T076)."""

    def setup_method(self) -> None:
        """Create a fresh TaskStore with tasks across the week."""
        self.store = TaskStore()
        self.today = date.today()
        # Get Monday of this week
        self.week_start = self.today - timedelta(days=self.today.weekday())

        # Add tasks for each day of the week
        for i in range(7):
            day = self.week_start + timedelta(days=i)
            self.store.add(
                f"Day {i} task",
                due_date=datetime.combine(day, datetime.min.time()),
            )

        # Add task outside this week
        next_week = self.week_start + timedelta(days=10)
        self.store.add("Next week task", due_date=datetime.combine(next_week, datetime.min.time()))

    def test_get_weekly_tasks_returns_week_tasks(self) -> None:
        """Test getting tasks for the current week."""
        tasks = self.store.get_weekly_tasks(self.week_start)
        assert len(tasks) == 7

    def test_get_weekly_tasks_excludes_other_weeks(self) -> None:
        """Test that weekly tasks excludes tasks from other weeks."""
        next_week_start = self.week_start + timedelta(days=7)
        tasks = self.store.get_weekly_tasks(next_week_start)
        assert len(tasks) == 1
        assert tasks[0].title == "Next week task"

    def test_get_weekly_tasks_grouped_by_day(self) -> None:
        """Test that weekly tasks are returned grouped by day."""
        grouped = self.store.get_weekly_tasks_grouped(self.week_start)
        assert len(grouped) == 7
        for day_tasks in grouped.values():
            assert len(day_tasks) == 1


class TestGetWeekStart:
    """Tests for get_week_start() static method (T077)."""

    def test_get_week_start_monday(self) -> None:
        """Test that week starts on Monday (ISO 8601)."""
        # January 15, 2025 is a Wednesday
        test_date = date(2025, 1, 15)
        week_start = TaskStore.get_week_start(test_date)
        assert week_start == date(2025, 1, 13)  # Monday
        assert week_start.weekday() == 0  # Monday is 0

    def test_get_week_start_from_sunday(self) -> None:
        """Test week start from Sunday returns previous Monday."""
        # January 19, 2025 is a Sunday
        test_date = date(2025, 1, 19)
        week_start = TaskStore.get_week_start(test_date)
        assert week_start == date(2025, 1, 13)  # Previous Monday

    def test_get_week_start_from_monday(self) -> None:
        """Test week start from Monday returns same day."""
        # January 13, 2025 is a Monday
        test_date = date(2025, 1, 13)
        week_start = TaskStore.get_week_start(test_date)
        assert week_start == test_date

    def test_get_week_start_defaults_to_today(self) -> None:
        """Test that get_week_start defaults to today's week."""
        week_start = TaskStore.get_week_start()
        today = date.today()
        expected = today - timedelta(days=today.weekday())
        assert week_start == expected


class TestReminders:
    """Tests for reminder functionality (T087, T088, T089)."""

    def setup_method(self) -> None:
        """Create a fresh TaskStore with tasks and reminders."""
        self.store = TaskStore()
        # Task 1: Reminder in the past (should trigger)
        self.past_due = datetime.now() - timedelta(minutes=5)
        self.store.add(
            "Past reminder",
            due_date=self.past_due + timedelta(minutes=15),
            reminder_offset=ReminderOffset.FIFTEEN_MIN_BEFORE,
        )
        # Task 2: Reminder in the future (should not trigger)
        self.future_due = datetime.now() + timedelta(hours=1)
        self.store.add(
            "Future reminder",
            due_date=self.future_due,
            reminder_offset=ReminderOffset.FIFTEEN_MIN_BEFORE,
        )
        # Task 3: No reminder
        self.store.add("No reminder task", due_date=datetime.now() + timedelta(hours=1))

    def test_check_reminders_finds_triggered_reminders(self) -> None:
        """Test that check_reminders() finds reminders that should be shown."""
        triggered = self.store.check_reminders()
        assert len(triggered) == 1
        assert triggered[0].title == "Past reminder"

    def test_mark_reminder_shown(self) -> None:
        """Test that marking a reminder as shown prevents it from triggering again."""
        triggered = self.store.check_reminders()
        assert len(triggered) == 1

        self.store.mark_reminder_shown(triggered[0].id)

        # Should not trigger again
        triggered_again = self.store.check_reminders()
        assert len(triggered_again) == 0

    def test_get_upcoming_reminders(self) -> None:
        """Test getting all tasks with set reminders."""
        upcoming = self.store.get_upcoming_reminders()
        assert len(upcoming) == 2
        assert any(t.title == "Past reminder" for t in upcoming)
        assert any(t.title == "Future reminder" for t in upcoming)

    def test_remove_reminder(self) -> None:
        """Test removing a reminder from a task."""
        # Find ID of future reminder
        future_id = next(t.id for t in self.store.list_all() if t.title == "Future reminder")

        # Set reminder_offset to None
        self.store.update(future_id, reminder_offset=None)

        task = self.store.get(future_id)
        assert task.reminder_offset is None

        upcoming = self.store.get_upcoming_reminders()
        assert len(upcoming) == 1
        assert upcoming[0].title == "Past reminder"


class TestRecurrenceEndDateValidation:
    """Tests for recurrence end date validation bug fix (T001-T004).

    These tests verify the fix for the bug where completing a recurring task
    crashes with "Recurrence end date must be on or after due date" error.
    """

    def setup_method(self) -> None:
        """Create a fresh TaskStore for each test."""
        self.store = TaskStore()

    # T001: Test for completing recurring task when next due exceeds end date
    def test_complete_recurring_task_next_due_exceeds_end_date_no_crash(self) -> None:
        """Test that completing a recurring task doesn't crash when next due exceeds end date.

        Given a task with weekly recurrence, due today, and end date tomorrow,
        When the user completes the task,
        Then no error should occur and no new task should be created.
        """
        # Create a task due today with end date tomorrow
        today = datetime.now()
        end_date = today + timedelta(days=1)

        task = self.store.add(
            "Weekly meeting",
            due_date=today,
            recurrence=RecurrencePattern.WEEKLY,
            recurrence_end_date=end_date,
        )

        # Complete the task - should NOT crash
        completed, new_task = self.store.complete(task.id)

        assert completed is not None
        assert completed.status == TaskStatus.COMPLETED
        # No new task should be created since next due (today + 7 days) exceeds end date
        assert new_task is None

    # T002: Test for completing recurring task within end date
    def test_complete_recurring_task_within_end_date_creates_next(self) -> None:
        """Test that completing a recurring task creates next occurrence when within end date.

        Given a task with weekly recurrence and end date set to next month,
        When the user completes the task,
        Then a new task occurrence should be created with the correct next due date.
        """
        today = datetime.now()
        end_date = today + timedelta(weeks=4)  # End date is 4 weeks from now

        task = self.store.add(
            "Weekly review",
            due_date=today,
            recurrence=RecurrencePattern.WEEKLY,
            recurrence_end_date=end_date,
        )

        # Complete the task
        completed, new_task = self.store.complete(task.id)

        assert completed is not None
        assert completed.status == TaskStatus.COMPLETED
        assert new_task is not None
        # Next due should be 1 week later
        assert new_task.due_date == today + timedelta(weeks=1)
        assert new_task.recurrence == RecurrencePattern.WEEKLY
        assert new_task.recurrence_end_date == end_date

    # T003: Test for completing recurring task without end date
    def test_complete_recurring_task_no_end_date_creates_next(self) -> None:
        """Test that completing a recurring task without end date creates next occurrence indefinitely.

        Given a task with monthly recurrence and no end date,
        When the user completes the task,
        Then a new task occurrence should be created with the next month's due date.
        """
        today = datetime.now()

        task = self.store.add(
            "Monthly bills",
            due_date=today,
            recurrence=RecurrencePattern.MONTHLY,
        )

        # Complete the task
        completed, new_task = self.store.complete(task.id)

        assert completed is not None
        assert completed.status == TaskStatus.COMPLETED
        assert new_task is not None
        # Next due should be 1 month later
        expected_month = (today.month % 12) + 1
        expected_year = today.year + (today.month // 12)
        expected_day = min(today.day, 28)  # Safe for all months
        expected_due = today.replace(year=expected_year, month=expected_month, day=expected_day)
        assert new_task.due_date == expected_due
        assert new_task.recurrence == RecurrencePattern.MONTHLY
        assert new_task.recurrence_end_date is None

    # T004: Test for edge case - next due equals end date
    def test_complete_recurring_task_next_due_equals_end_date_creates_occurrence(self) -> None:
        """Test that completing a recurring task creates next occurrence when next due equals end date.

        Given a task with due date and end date on the same day as next due,
        When the user completes the task,
        Then a new task occurrence should be created (boundary case).
        """
        today = datetime.now()
        # End date is exactly one week from now (same as next due date)
        end_date = today + timedelta(weeks=1)

        task = self.store.add(
            "Weekly sync",
            due_date=today,
            recurrence=RecurrencePattern.WEEKLY,
            recurrence_end_date=end_date,
        )

        # Complete the task - should create next occurrence
        completed, new_task = self.store.complete(task.id)

        assert completed is not None
        assert completed.status == TaskStatus.COMPLETED
        assert new_task is not None
        # Next due equals end date - should still create
        assert new_task.due_date == end_date
        assert new_task.recurrence == RecurrencePattern.WEEKLY
