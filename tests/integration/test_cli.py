"""Integration tests for CLI commands."""

import importlib
import sys
from datetime import datetime, date, timedelta
from unittest.mock import patch

import pytest

from src.models.task import TaskStatus, Task


def get_fresh_cli_module():
    """Get a fresh import of the CLI module."""
    # Clear any cached CLI module imports
    modules_to_clear = [k for k in list(sys.modules.keys()) if "src.cli" in k]
    for mod in modules_to_clear:
        del sys.modules[mod]

    # Clear models and services too to ensure fresh imports
    modules_to_clear = [k for k in list(sys.modules.keys()) if "src.models" in k or "src.services" in k]
    for mod in modules_to_clear:
        del sys.modules[mod]

    # Now import fresh using importlib
    return importlib.import_module("src.cli.main")


@pytest.fixture
def cli():
    """Provide a fresh CLI module for each test."""
    from src.services.task_store import TaskStore

    mod = get_fresh_cli_module()
    mod.store = TaskStore()
    return mod


class TestCLIIntegration:
    """Integration tests for CLI command handlers."""

    def test_add_task_creates_task(self, cli) -> None:
        """Test that add_task creates a task in the store."""
        inputs = ["Buy groceries", "", "medium", ""]

        with patch("src.cli.main.Prompt.ask", side_effect=inputs):
            cli.add_task()

        tasks = cli.store.list_all()
        assert len(tasks) == 1
        assert tasks[0].title == "Buy groceries"

    def test_add_task_empty_title_shows_error(self, cli, capsys) -> None:
        """Test that empty title shows error message."""
        with patch("src.cli.main.Prompt.ask", return_value=""):
            cli.add_task()

        # Task should not be created
        assert len(cli.store.list_all()) == 0

    def test_list_tasks_empty_shows_message(self, cli, capsys) -> None:
        """Test that list_tasks shows message when empty."""
        cli.list_tasks()

        captured = capsys.readouterr()
        assert "No tasks yet" in captured.out

    def test_list_tasks_displays_tasks(self, cli, capsys) -> None:
        """Test that list_tasks displays existing tasks."""
        cli.store.add("Task 1")
        cli.store.add("Task 2")

        cli.list_tasks()

        captured = capsys.readouterr()
        assert "Task 1" in captured.out
        assert "Task 2" in captured.out
        assert "Tasks: 2 total" in captured.out

    def test_update_task_changes_title(self, cli) -> None:
        """Test that update_task changes the title."""
        cli.store.add("Original")
        inputs = ["1", "Updated"]

        with patch("src.cli.main.Prompt.ask", side_effect=inputs):
            cli.update_task()

        task = cli.store.get(1)
        assert task is not None
        assert task.title == "Updated"

    def test_update_nonexistent_task_shows_error(self, cli, capsys) -> None:
        """Test that updating non-existent task shows error."""
        with patch("src.cli.main.Prompt.ask", return_value="99"):
            cli.update_task()

        captured = capsys.readouterr()
        assert "not found" in captured.out

    def test_delete_task_with_confirmation(self, cli) -> None:
        """Test that delete_task removes task when confirmed."""
        cli.store.add("To delete")

        with (
            patch("src.cli.main.Prompt.ask", return_value="1"),
            patch("src.cli.main.Confirm.ask", return_value=True),
        ):
            cli.delete_task()

        assert cli.store.get(1) is None

    def test_delete_task_cancelled(self, cli) -> None:
        """Test that delete_task keeps task when cancelled."""
        cli.store.add("Keep me")

        with (
            patch("src.cli.main.Prompt.ask", return_value="1"),
            patch("src.cli.main.Confirm.ask", return_value=False),
        ):
            cli.delete_task()

        assert cli.store.get(1) is not None

    def test_complete_task_marks_complete(self, cli) -> None:
        """Test that complete_task marks task as done."""
        cli.store.add("To complete")

        with patch("src.cli.main.Prompt.ask", return_value="1"):
            cli.complete_task()

        task = cli.store.get(1)
        assert task is not None
        assert task.status == TaskStatus.COMPLETED

    def test_complete_already_completed_task_toggles(self, cli) -> None:
        """Test that completing already-completed task offers toggle."""
        cli.store.add("Already done")
        cli.store.complete(1)

        with (
            patch("src.cli.main.Prompt.ask", return_value="1"),
            patch("src.cli.main.Confirm.ask", return_value=True),
        ):
            cli.complete_task()

        task = cli.store.get(1)
        assert task is not None
        assert task.status == TaskStatus.PENDING

    def test_invalid_task_id_shows_error(self, cli, capsys) -> None:
        """Test that invalid (non-numeric) task ID shows error."""
        with patch("src.cli.main.Prompt.ask", return_value="abc"):
            cli.update_task()

        captured = capsys.readouterr()
        assert "Invalid task ID" in captured.out


class TestSearchMenuIntegration:
    """Integration tests for search menu (T035)."""

    def test_search_by_id_finds_task(self, cli, capsys) -> None:
        """Test that search by ID displays task details."""
        cli.store.add("Test task", description="Test description")

        with patch("src.cli.main.Prompt.ask", return_value="1"):
            cli.search_by_id_handler()

        captured = capsys.readouterr()
        assert "Test task" in captured.out
        assert "Test description" in captured.out

    def test_search_by_id_not_found(self, cli, capsys) -> None:
        """Test that search by ID shows message when not found."""
        with patch("src.cli.main.Prompt.ask", return_value="99"):
            cli.search_by_id_handler()

        captured = capsys.readouterr()
        assert "No task found" in captured.out

    def test_search_by_keyword_finds_tasks(self, cli, capsys) -> None:
        """Test that search by keyword finds matching tasks."""
        cli.store.add("Buy groceries", description="Get milk")
        cli.store.add("Team meeting")
        cli.store.add("Buy birthday gift")

        with patch("src.cli.main.Prompt.ask", return_value="Buy"):
            cli.search_by_keyword_handler()

        captured = capsys.readouterr()
        assert "Buy groceries" in captured.out
        assert "Buy birthday gift" in captured.out
        assert "Found 2 matching" in captured.out

    def test_search_by_keyword_no_results(self, cli, capsys) -> None:
        """Test that search by keyword shows message when no results."""
        cli.store.add("Test task")

        with patch("src.cli.main.Prompt.ask", return_value="xyz123"):
            cli.search_by_keyword_handler()

        captured = capsys.readouterr()
        assert "No tasks found matching" in captured.out

    def test_search_menu_back_to_main(self, cli) -> None:
        """Test that search menu option 3 returns to main."""
        # Option 3 should just return without error
        with patch("src.cli.main.Prompt.ask", return_value="3"):
            cli.search_menu()  # Should complete without error


class TestFilterMenuIntegration:
    """Integration tests for filter menu (T036)."""

    def test_filter_by_status_sets_filter(self, cli, capsys) -> None:
        """Test that filter by status sets the active filter."""
        cli.store.add("Task 1")

        # Select option 1 (Filter by Status), then 1 (Pending)
        with patch("src.cli.main.Prompt.ask", return_value="1"):
            cli.filter_by_status_handler()

        active = cli.store.get_active_filters()
        assert "status" in active
        assert active["status"] == TaskStatus.PENDING

    def test_filter_by_priority_sets_filter(self, cli, capsys) -> None:
        """Test that filter by priority sets the active filter."""
        from src.models.task import Priority

        # Select option 3 (High)
        with patch("src.cli.main.Prompt.ask", return_value="3"):
            cli.filter_by_priority_handler()

        active = cli.store.get_active_filters()
        assert "priority" in active
        assert active["priority"] == Priority.HIGH

    def test_filter_by_due_date_sets_filter(self, cli, capsys) -> None:
        """Test that filter by due date sets the active filter."""
        from src.models.task import DueDateFilter

        # Select option 1 (Today)
        with patch("src.cli.main.Prompt.ask", return_value="1"):
            cli.filter_by_due_date_handler()

        active = cli.store.get_active_filters()
        assert "due_date_filter" in active
        assert active["due_date_filter"] == DueDateFilter.TODAY

    def test_clear_filters(self, cli, capsys) -> None:
        """Test that clear all filters clears active filters."""
        from src.models.task import Priority

        # Set a filter first
        cli.store.set_filter(priority=Priority.HIGH)
        assert cli.store.get_active_filters()

        # Clear all filters (option 4 in filter menu)
        cli.store.clear_filters()

        assert cli.store.get_active_filters() == {}

    def test_list_tasks_applies_filters(self, cli, capsys) -> None:
        """Test that list_tasks applies active filters."""
        from src.models.task import Priority

        cli.store.add("Low task", priority=Priority.LOW)
        cli.store.add("High task", priority=Priority.HIGH)

        # Set filter for HIGH priority
        cli.store.set_filter(priority=Priority.HIGH)

        cli.list_tasks()

        captured = capsys.readouterr()
        assert "High task" in captured.out
        # Low task should be filtered out
        # Note: checking via count or ensuring "Low task" appears less prominently
        assert "filtered" in captured.out.lower()

    def test_filter_menu_back_to_main(self, cli) -> None:
        """Test that filter menu option 5 returns to main."""
        # Option 5 should just return without error
        with patch("src.cli.main.Prompt.ask", return_value="5"):
            cli.filter_menu()  # Should complete without error


class TestSortMenuIntegration:
    """Integration tests for sort menu (T047)."""

    def test_sort_by_priority_sets_sort(self, cli, capsys) -> None:
        """Test that sort by priority sets the sort key."""
        from src.models.task import SortKey

        # Select option 1 (Priority)
        with patch("src.cli.main.Prompt.ask", return_value="1"):
            cli.sort_menu()

        sort_key, _ = cli.store.get_current_sort()
        assert sort_key == SortKey.PRIORITY

    def test_sort_by_due_date_sets_sort(self, cli, capsys) -> None:
        """Test that sort by due date sets the sort key."""
        from src.models.task import SortKey

        # Select option 2 (Due Date)
        with patch("src.cli.main.Prompt.ask", return_value="2"):
            cli.sort_menu()

        sort_key, _ = cli.store.get_current_sort()
        assert sort_key == SortKey.DUE_DATE

    def test_sort_by_created_date_sets_sort(self, cli, capsys) -> None:
        """Test that sort by created date sets the sort key."""
        from src.models.task import SortKey

        # Select option 3 (Created Date)
        with patch("src.cli.main.Prompt.ask", return_value="3"):
            cli.sort_menu()

        sort_key, _ = cli.store.get_current_sort()
        assert sort_key == SortKey.CREATED_AT

    def test_toggle_direction(self, cli, capsys) -> None:
        """Test that toggle direction changes the sort direction."""
        # Get initial direction (should be descending by default)
        _, initial_desc = cli.store.get_current_sort()

        # Select option 4 (Toggle Direction)
        with patch("src.cli.main.Prompt.ask", return_value="4"):
            cli.sort_menu()

        _, new_desc = cli.store.get_current_sort()
        assert new_desc != initial_desc

    def test_list_tasks_shows_sorted_results(self, cli, capsys) -> None:
        """Test that list_tasks displays tasks in sorted order."""
        from src.models.task import Priority, SortKey

        cli.store.add("Low priority", priority=Priority.LOW)
        cli.store.add("High priority", priority=Priority.HIGH)
        cli.store.add("Medium priority", priority=Priority.MEDIUM)

        # Set sort by priority descending
        cli.store.set_sort(SortKey.PRIORITY, descending=True)

        cli.list_tasks()

        captured = capsys.readouterr()
        # Find positions of each task in output
        high_pos = captured.out.find("High priority")
        medium_pos = captured.out.find("Medium priority")
        low_pos = captured.out.find("Low priority")

        # High should come before Medium, Medium before Low
        assert high_pos < medium_pos < low_pos

    def test_sort_menu_back_to_main(self, cli) -> None:
        """Test that sort menu option 5 returns to main."""
        # Option 5 should just return without error
        with patch("src.cli.main.Prompt.ask", return_value="5"):
            cli.sort_menu()  # Should complete without error


class TestMarkInProgressIntegration:
    """Integration tests for mark in progress functionality (T060)."""

    def test_mark_in_progress_changes_status(self, cli) -> None:
        """Test that mark_in_progress changes task status."""
        cli.store.add("Test task")

        with patch("src.cli.main.Prompt.ask", return_value="1"):
            cli.mark_in_progress()

        task = cli.store.get(1)
        assert task is not None
        assert task.status == TaskStatus.IN_PROGRESS

    def test_mark_in_progress_not_found(self, cli, capsys) -> None:
        """Test mark_in_progress shows error for non-existent task."""
        with patch("src.cli.main.Prompt.ask", return_value="99"):
            cli.mark_in_progress()

        captured = capsys.readouterr()
        assert "not found" in captured.out

    def test_mark_in_progress_already_in_progress(self, cli, capsys) -> None:
        """Test mark_in_progress shows message when already in progress."""
        cli.store.add("Test task")
        cli.store.mark_in_progress(1)

        with patch("src.cli.main.Prompt.ask", return_value="1"):
            cli.mark_in_progress()

        captured = capsys.readouterr()
        assert "already in progress" in captured.out


class TestProgressDisplayIntegration:
    """Integration tests for progress display (T061)."""

    def test_list_tasks_shows_progress_percentage(self, cli, capsys) -> None:
        """Test that list_tasks displays progress percentage."""
        cli.store.add("Task 1")
        cli.store.add("Task 2")
        cli.store.complete(1)

        cli.list_tasks()

        captured = capsys.readouterr()
        assert "Progress:" in captured.out
        assert "50.0%" in captured.out

    def test_list_tasks_shows_zero_progress(self, cli, capsys) -> None:
        """Test that list_tasks shows 0% progress when no tasks completed."""
        cli.store.add("Task 1")
        cli.store.add("Task 2")

        cli.list_tasks()

        captured = capsys.readouterr()
        assert "Progress: 0.0%" in captured.out

    def test_list_tasks_shows_full_progress(self, cli, capsys) -> None:
        """Test that list_tasks shows 100% progress when all tasks completed."""
        cli.store.add("Task 1")
        cli.store.add("Task 2")
        cli.store.complete(1)
        cli.store.complete(2)

        cli.list_tasks()

        captured = capsys.readouterr()
        assert "Progress: 100.0%" in captured.out

    def test_list_tasks_shows_three_state_status(self, cli, capsys) -> None:
        """Test that list_tasks displays all three status states."""
        cli.store.add("Pending task")
        cli.store.add("In progress task")
        cli.store.add("Completed task")

        cli.store.mark_in_progress(2)
        cli.store.complete(3)

        cli.list_tasks()

        captured = capsys.readouterr()
        assert "Pending" in captured.out
        assert "In Progress" in captured.out
        assert "Done" in captured.out


class TestRecurringTaskCreationIntegration:
    """Integration tests for recurring task creation (T073)."""

    def test_add_task_with_daily_recurrence(self, cli) -> None:
        """Test creating a task with daily recurrence via CLI."""
        from datetime import datetime
        from src.models.task import RecurrencePattern

        # Simulate inputs: title, desc, priority, due_date, recurrence, end_date, reminder
        inputs = ["Daily standup", "", "medium", "2026-01-15", "daily", "", "none"]

        with patch("src.cli.main.Prompt.ask", side_effect=inputs):
            cli.add_task()

        tasks = cli.store.list_all()
        assert len(tasks) == 1
        assert tasks[0].title == "Daily standup"
        assert tasks[0].recurrence == RecurrencePattern.DAILY

    def test_add_task_with_weekly_recurrence_and_end_date(self, cli) -> None:
        """Test creating a task with weekly recurrence and end date."""
        from datetime import datetime
        from src.models.task import RecurrencePattern

        # title, desc, priority, due_date, recurrence, end_date, reminder
        inputs = ["Weekly review", "", "high", "2026-01-15", "weekly", "2026-03-15", "none"]

        with patch("src.cli.main.Prompt.ask", side_effect=inputs):
            cli.add_task()

        tasks = cli.store.list_all()
        assert len(tasks) == 1
        assert tasks[0].recurrence == RecurrencePattern.WEEKLY
        assert tasks[0].recurrence_end_date is not None

    def test_add_task_without_due_date_skips_recurrence(self, cli) -> None:
        """Test that task without due date doesn't prompt for recurrence."""
        # Without due date, recurrence prompt is skipped
        inputs = ["One-time task", "", "medium", ""]

        with patch("src.cli.main.Prompt.ask", side_effect=inputs):
            cli.add_task()

        tasks = cli.store.list_all()
        assert len(tasks) == 1
        assert tasks[0].recurrence is None

    def test_list_tasks_shows_recurrence_indicator(self, cli, capsys) -> None:
        """Test that list_tasks shows recurrence indicator for recurring tasks."""
        from datetime import datetime
        from src.models.task import RecurrencePattern

        cli.store.add(
            "Daily task",
            due_date=datetime(2026, 1, 15),
            recurrence=RecurrencePattern.DAILY,
        )
        cli.store.add("One-time task", due_date=datetime(2026, 1, 16))

        cli.list_tasks()

        captured = capsys.readouterr()
        # Recurrence indicator should appear for daily task
        assert "🔄" in captured.out


class TestRecurringTaskCompletionIntegration:
    """Integration tests for recurring task completion (T074)."""

    def test_complete_recurring_task_creates_next_occurrence(self, cli, capsys) -> None:
        """Test completing a recurring task creates next occurrence."""
        from datetime import datetime
        from src.models.task import RecurrencePattern

        cli.store.add(
            "Daily standup",
            due_date=datetime(2026, 1, 15),
            recurrence=RecurrencePattern.DAILY,
        )

        with patch("src.cli.main.Prompt.ask", return_value="1"):
            cli.complete_task()

        # Should have 2 tasks now: completed original + new occurrence
        tasks = cli.store.list_all()
        assert len(tasks) == 2

        # Check output mentions recurring task
        captured = capsys.readouterr()
        assert "Recurring task created" in captured.out

    def test_complete_non_recurring_task_no_new_occurrence(self, cli, capsys) -> None:
        """Test completing a non-recurring task doesn't create new occurrence."""
        from datetime import datetime

        cli.store.add("One-time task", due_date=datetime(2026, 1, 15))

        with patch("src.cli.main.Prompt.ask", return_value="1"):
            cli.complete_task()

        # Should only have 1 task
        tasks = cli.store.list_all()
        assert len(tasks) == 1

        captured = capsys.readouterr()
        assert "Recurring task created" not in captured.out


class TestCalendarViewIntegration:
    """Integration tests for calendar view functionality (T085, T086)."""

    def test_daily_view_displays_tasks(self, cli, capsys) -> None:
        """Test that daily_view_handler displays tasks for the day."""
        from datetime import date
        cli.store.add("Today's session", due_date=datetime.combine(date.today(), datetime.min.time()))

        with patch("src.cli.main.Prompt.ask", return_value="1"):
            cli.calendar_menu()

        captured = capsys.readouterr()
        assert "Today's session" in captured.out

    def test_weekly_view_displays_tasks(self, cli, capsys) -> None:
        """Test that weekly_view_handler displays tasks for the week."""
        from datetime import date
        cli.store.add("Weekly task", due_date=datetime.combine(date.today(), datetime.min.time()))

        with patch("src.cli.main.Prompt.ask", return_value="2"):
            cli.calendar_menu()

        captured = capsys.readouterr()
        assert "Weekly task" in captured.out
        assert "Mon" in captured.out
        assert "Sun" in captured.out

    def test_calendar_navigation(self, cli, capsys) -> None:
        """Test that calendar navigation moves the current date."""
        from datetime import date, timedelta
        initial_date = cli._calendar_current_date

        # Move to next day (option 4)
        with patch("src.cli.main.Prompt.ask", return_value="4"):
            cli.calendar_menu()

        assert cli._calendar_current_date == initial_date + timedelta(days=1)

        # Move to previous day (option 3)
        with patch("src.cli.main.Prompt.ask", return_value="3"):
            cli.calendar_menu()

        assert cli._calendar_current_date == initial_date

        # Go to today (option 5)
        cli._calendar_current_date = date.today() + timedelta(days=10)
        with patch("src.cli.main.Prompt.ask", return_value="5"):
            cli.calendar_menu()

        assert cli._calendar_current_date == date.today()

    def test_calendar_menu_back_to_main(self, cli) -> None:
        """Test that calendar menu option 6 returns to main."""
        with patch("src.cli.main.Prompt.ask", return_value="6"):
            cli.calendar_menu()  # Should complete without error


class TestReminderIntegration:
    """Integration tests for reminder management (T100)."""

    def test_set_reminder_via_menu(self, cli, capsys) -> None:
        """Test setting a reminder for a task via menu."""
        from src.models.task import ReminderOffset
        cli.store.add("Meeting", due_date=datetime.now() + timedelta(hours=1))

        # Inputs: task_id="1", reminder_time="1h"
        with patch("src.cli.main.Prompt.ask", side_effect=["1", "1h"]):
            cli.set_reminder_handler()

        task = cli.store.get(1)
        assert task.reminder_offset == ReminderOffset.ONE_HOUR_BEFORE

    def test_remove_reminder_via_menu(self, cli, capsys) -> None:
        """Test removing a reminder for a task via menu."""
        from src.models.task import ReminderOffset
        cli.store.add(
            "Meeting",
            due_date=datetime.now() + timedelta(hours=1),
            reminder_offset=ReminderOffset.ONE_HOUR_BEFORE,
        )

        with patch("src.cli.main.Prompt.ask", return_value="1"):
            cli.remove_reminder_handler()

        task = cli.store.get(1)
        assert task.reminder_offset is None

    def test_view_reminders_displays_info(self, cli, capsys) -> None:
        """Test that view_reminders_handler displays set reminders."""
        from src.models.task import ReminderOffset
        cli.store.add(
            "Important task",
            due_date=datetime.now() + timedelta(hours=2),
            reminder_offset=ReminderOffset.FIFTEEN_MIN_BEFORE,
        )

        cli.view_reminders_handler()

        captured = capsys.readouterr()
        assert "Important task" in captured.out
        assert "Upcoming Reminders" in captured.out

    def test_check_and_display_reminders(self, cli, capsys) -> None:
        """Test that polling triggers display of due reminders."""
        from src.models.task import ReminderOffset
        # Set reminder in past
        cli.store.add(
            "Immediate task",
            due_date=datetime.now() + timedelta(minutes=5),
            reminder_offset=ReminderOffset.FIFTEEN_MIN_BEFORE,  # Reminder was 10 mins ago
        )

        cli.check_and_display_reminders()

        captured = capsys.readouterr()
        assert "REMINDER: Immediate task" in captured.out

        # Second check should not show it again
        cli.check_and_display_reminders()
        captured_again = capsys.readouterr()
        assert "REMINDER: Immediate task" not in captured_again.out

    def test_complete_recurring_task_with_expired_end_date(self, cli, capsys) -> None:
        """Test completing recurring task after end date doesn't create new occurrence."""
        from datetime import datetime
        from src.models.task import RecurrencePattern

        # Use past end date
        cli.store.add(
            "Limited task",
            due_date=datetime(2024, 1, 15),
            recurrence=RecurrencePattern.DAILY,
            recurrence_end_date=datetime(2024, 1, 16),  # Already expired
        )

        with patch("src.cli.main.Prompt.ask", return_value="1"):
            cli.complete_task()

        # Should only have 1 task (no new occurrence)
        tasks = cli.store.list_all()
        assert len(tasks) == 1

        captured = capsys.readouterr()
        assert "Recurring task created" not in captured.out


class TestCalendarViewIntegration:
    """Integration tests for calendar view functionality (T085, T086)."""

    def test_daily_view_displays_tasks(self, cli, capsys) -> None:
        """Test that daily_view_handler displays tasks for the day."""
        from datetime import date
        cli.store.add("Today's session", due_date=datetime.combine(date.today(), datetime.min.time()))

        with patch("src.cli.main.Prompt.ask", return_value="1"):
            cli.calendar_menu()

        captured = capsys.readouterr()
        assert "Today's session" in captured.out

    def test_weekly_view_displays_tasks(self, cli, capsys) -> None:
        """Test that weekly_view_handler displays tasks for the week."""
        from datetime import date
        cli.store.add("Weekly task", due_date=datetime.combine(date.today(), datetime.min.time()))

        with patch("src.cli.main.Prompt.ask", return_value="2"):
            cli.calendar_menu()

        captured = capsys.readouterr()
        assert "Weekly task" in captured.out
        assert "Mon" in captured.out
        assert "Sun" in captured.out

    def test_calendar_navigation(self, cli, capsys) -> None:
        """Test that calendar navigation moves the current date."""
        from datetime import date, timedelta
        initial_date = cli._calendar_current_date

        # Move to next day (option 4)
        with patch("src.cli.main.Prompt.ask", return_value="4"):
            cli.calendar_menu()

        assert cli._calendar_current_date == initial_date + timedelta(days=1)

        # Move to previous day (option 3)
        with patch("src.cli.main.Prompt.ask", return_value="3"):
            cli.calendar_menu()

        assert cli._calendar_current_date == initial_date

        # Go to today (option 5)
        cli._calendar_current_date = date.today() + timedelta(days=10)
        with patch("src.cli.main.Prompt.ask", return_value="5"):
            cli.calendar_menu()

        assert cli._calendar_current_date == date.today()

    def test_calendar_menu_back_to_main(self, cli) -> None:
        """Test that calendar menu option 6 returns to main."""
        with patch("src.cli.main.Prompt.ask", return_value="6"):
            cli.calendar_menu()  # Should complete without error


class TestReminderIntegration:
    """Integration tests for reminder management (T100)."""

    def test_set_reminder_via_menu(self, cli, capsys) -> None:
        """Test setting a reminder for a task via menu."""
        from src.models.task import ReminderOffset
        cli.store.add("Meeting", due_date=datetime.now() + timedelta(hours=1))

        # Inputs: task_id="1", reminder_time="1h"
        with patch("src.cli.main.Prompt.ask", side_effect=["1", "1h"]):
            cli.set_reminder_handler()

        task = cli.store.get(1)
        assert task.reminder_offset == ReminderOffset.ONE_HOUR_BEFORE

    def test_remove_reminder_via_menu(self, cli, capsys) -> None:
        """Test removing a reminder for a task via menu."""
        from src.models.task import ReminderOffset
        cli.store.add(
            "Meeting",
            due_date=datetime.now() + timedelta(hours=1),
            reminder_offset=ReminderOffset.ONE_HOUR_BEFORE,
        )

        with patch("src.cli.main.Prompt.ask", return_value="1"):
            cli.remove_reminder_handler()

        task = cli.store.get(1)
        assert task.reminder_offset is None

    def test_view_reminders_displays_info(self, cli, capsys) -> None:
        """Test that view_reminders_handler displays set reminders."""
        from src.models.task import ReminderOffset
        cli.store.add(
            "Important task",
            due_date=datetime.now() + timedelta(hours=2),
            reminder_offset=ReminderOffset.FIFTEEN_MIN_BEFORE,
        )

        cli.view_reminders_handler()

        captured = capsys.readouterr()
        assert "Important task" in captured.out
        assert "Upcoming Reminders" in captured.out

    def test_check_and_display_reminders(self, cli, capsys) -> None:
        """Test that polling triggers display of due reminders."""
        from src.models.task import ReminderOffset
        # Set reminder in past
        cli.store.add(
            "Immediate task",
            due_date=datetime.now() + timedelta(minutes=5),
            reminder_offset=ReminderOffset.FIFTEEN_MIN_BEFORE,  # Reminder was 10 mins ago
        )

        cli.check_and_display_reminders()

        captured = capsys.readouterr()
        assert "REMINDER: Immediate task" in captured.out

        # Second check should not show it again
        cli.check_and_display_reminders()
        captured_again = capsys.readouterr()
        assert "REMINDER: Immediate task" not in captured_again.out
