"""
Smart Reminder Tests

Tests for the reminder scheduling and notification functionality.
- T132: Reminder scheduling integration
- T133: Job trigger endpoint
- T134: Reminder notification creation
"""

import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import Mock
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import SQLModel

from app.database import async_engine
from app.models import Task, Notification, User, TaskCreate
from app.services.task_service import TaskService
from app.jobs import create_reminder_notification


@pytest.fixture
async def test_db():
    """Create test database tables."""
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
        await conn.run_sync(SQLModel.metadata.create_all)
    yield
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)


@pytest.fixture
async def test_user(test_db):
    """Create a test user."""
    async with AsyncSession(async_engine) as session:
        user = User(
            id="test-user-reminder",
            email="reminder@example.com",
            name="Test Reminder User",
            createdAt=datetime.utcnow(),
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        yield user


class TestReminderScheduling:
    """Tests for T132: Reminder scheduling in task service."""

    @pytest.mark.asyncio
    async def test_schedule_reminder_with_task(self, test_db, test_user):
        """Test that creating a task with reminder_at schedules a job."""
        # Create a mock scheduler
        mock_scheduler = Mock()
        mock_scheduler.add_job = Mock()

        # Create a task with a reminder
        reminder_time = datetime.now(timezone.utc) + timedelta(hours=1)
        async with AsyncSession(async_engine) as session:
            task_data = TaskCreate(
                title="Test Task with Reminder",
                description="Test description",
                priority="medium",
                reminder_at=reminder_time.isoformat(),
            )

            task = await TaskService.create_task(
                session,
                task_data,
                test_user.id,
                scheduler=mock_scheduler,
            )

            # Verify the task was created
            assert task.id is not None
            assert task.reminder_at is not None

            # Verify the scheduler was called to add a job
            mock_scheduler.add_job.assert_called_once()

            # Verify the job ID format
            call_kwargs = mock_scheduler.add_job.call_args[1]
            assert "id" in call_kwargs
            assert f"reminder_task_{task.id}_" in call_kwargs["id"]

    @pytest.mark.asyncio
    async def test_task_without_reminder_no_schedule(self, test_db, test_user):
        """Test that creating a task without reminder_at does not schedule a job."""
        # Create a mock scheduler
        mock_scheduler = Mock()
        mock_scheduler.add_job = Mock()

        # Create a task without a reminder
        async with AsyncSession(async_engine) as session:
            task_data = TaskCreate(
                title="Test Task without Reminder",
                description="Test description",
                priority="medium",
            )

            task = await TaskService.create_task(
                session,
                task_data,
                test_user.id,
                scheduler=mock_scheduler,
            )

            # Verify the task was created
            assert task.id is not None
            assert task.reminder_at is None

            # Verify the scheduler was NOT called
            mock_scheduler.add_job.assert_not_called()

    @pytest.mark.asyncio
    async def test_cancel_reminder(self, test_db, test_user):
        """Test that cancel_reminder removes the scheduled job."""
        # Create a mock scheduler
        mock_scheduler = Mock()
        mock_scheduler.remove_job = Mock()
        mock_scheduler.get_jobs = Mock(return_value=[
            Mock(id=f"reminder_task_123_{int(datetime.now(timezone.utc).timestamp())}")
        ])

        # Cancel a reminder
        TaskService.cancel_reminder(123, mock_scheduler)

        # Verify the scheduler was called to remove the job
        mock_scheduler.remove_job.assert_called_once()


class TestReminderJobFunction:
    """Tests for T134: Reminder notification creation."""

    @pytest.mark.asyncio
    async def test_create_reminder_notification(self, test_db, test_user):
        """Test that the reminder job creates a notification."""
        # Create a task with a due date
        due_date = datetime.now(timezone.utc) + timedelta(hours=2)
        async with AsyncSession(async_engine) as session:
            task = Task(
                user_id=test_user.id,
                title="Test Task",
                description="Test description",
                priority="medium",
                due_date=due_date.replace(microsecond=0),
                completed=False,
            )
            session.add(task)
            await session.commit()
            await session.refresh(task)

        # Run the reminder job
        await create_reminder_notification(task.id)

        # Verify notification was created
        async with AsyncSession(async_engine) as session:
            result = await session.execute(
                select(Notification).where(Notification.task_id == task.id)
            )
            notification = result.scalar_one_or_none()

            assert notification is not None
            assert notification.type == "reminder"
            assert notification.title == "Task Reminder"
            assert notification.user_id == test_user.id
            assert notification.read is False

    @pytest.mark.asyncio
    async def test_reminder_for_completed_task_skipped(self, test_db, test_user):
        """Test that reminders are not created for already completed tasks."""
        # Create a completed task
        due_date = datetime.now(timezone.utc) + timedelta(hours=2)
        async with AsyncSession(async_engine) as session:
            task = Task(
                user_id=test_user.id,
                title="Completed Task",
                description="Test description",
                priority="medium",
                due_date=due_date.replace(microsecond=0),
                completed=True,  # Already completed
            )
            session.add(task)
            await session.commit()
            await session.refresh(task)

        # Run the reminder job
        await create_reminder_notification(task.id)

        # Verify NO notification was created
        async with AsyncSession(async_engine) as session:
            result = await session.execute(
                select(Notification).where(Notification.task_id == task.id)
            )
            notification = result.scalar_one_or_none()

            assert notification is None

    @pytest.mark.asyncio
    async def test_reminder_for_nonexistent_task_skipped(self, test_db, test_user):
        """Test that reminders for non-existent tasks are handled gracefully."""
        # Run the reminder job for a non-existent task
        await create_reminder_notification(99999)

        # Should not raise an error


class TestReminderMessageFormatting:
    """Tests for reminder notification message formatting."""

    @pytest.mark.asyncio
    async def test_reminder_message_with_due_date_soon(self, test_db, test_user):
        """Test reminder message when due date is within 24 hours."""
        # Create a task with due date in 2 hours and reminder time set
        reminder_time = datetime.now(timezone.utc) + timedelta(minutes=30)
        due_date = datetime.now(timezone.utc) + timedelta(hours=2)
        async with AsyncSession(async_engine) as session:
            task = Task(
                user_id=test_user.id,
                title="Urgent Task",
                description="Test description",
                priority="high",
                due_date=due_date.replace(microsecond=0),
                reminder_at=reminder_time.replace(microsecond=0),
                completed=False,
            )
            session.add(task)
            await session.commit()
            await session.refresh(task)

        # Run the reminder job
        await create_reminder_notification(task.id)

        # Check the message contains time info
        async with AsyncSession(async_engine) as session:
            result = await session.execute(
                select(Notification).where(Notification.task_id == task.id)
            )
            notification = result.scalar_one()

            assert notification is not None
            assert "hour" in notification.message or "due at" in notification.message

    @pytest.mark.asyncio
    async def test_reminder_message_without_due_date(self, test_db, test_user):
        """Test reminder message when task has no due date."""
        # Create a task without due date
        async with AsyncSession(async_engine) as session:
            task = Task(
                user_id=test_user.id,
                title="Task Without Due Date",
                description="Test description",
                priority="medium",
                due_date=None,
                completed=False,
            )
            session.add(task)
            await session.commit()
            await session.refresh(task)

        # Run the reminder job
        await create_reminder_notification(task.id)

        # Check the message
        async with AsyncSession(async_engine) as session:
            result = await session.execute(
                select(Notification).where(Notification.task_id == task.id)
            )
            notification = result.scalar_one()

            assert notification is not None
            assert notification.title == "Task Reminder"
            assert "Task Without Due Date" in notification.message
