"""
Scheduled Jobs Module.

Contains job functions that are scheduled by APScheduler.
These jobs run asynchronously to perform background tasks like sending reminders.
"""

import logging
import os

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlmodel import select

from app.models import Task, Notification
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)

# Database URL for jobs
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./todo.db")
if DATABASE_URL.startswith("sqlite:///"):
    ASYNC_DATABASE_URL = DATABASE_URL.replace("sqlite:///", "sqlite+aiosqlite:///")
else:
    ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

# Create engine for jobs
engine = create_async_engine(ASYNC_DATABASE_URL, echo=False)


async def get_session():
    """Get a database session for job execution."""
    async_session_maker = create_async_engine(
        ASYNC_DATABASE_URL,
        echo=False,
    ).sessionmaker(class_=AsyncSession, expire_on_commit=False)

    async with async_session_maker() as session:
        yield session


async def create_reminder_notification(task_id: int) -> None:
    """
    Job function to create a reminder notification for a task.

    This function is scheduled by APScheduler to run at the reminder_at time.
    It creates a notification if the task is not yet completed.

    Args:
        task_id: Task ID to create reminder for
    """
    async with AsyncSession(engine) as session:
        # Get the task
        task = await session.get(Task, task_id)

        if not task:
            logger.warning(f"Task {task_id} not found for reminder")
            return

        # Skip if task is already completed
        if task.completed:
            logger.info(f"Task {task_id} already completed, skipping reminder")
            return

        # Calculate time until due
        time_until_due = None
        if task.due_date and task.reminder_at:
            delta = task.due_date - task.reminder_at
            if delta.days > 0:
                time_until_due = f"{delta.days} day{'s' if delta.days > 1 else ''}"
            elif delta.seconds >= 3600:
                hours = delta.seconds // 3600
                time_until_due = f"{hours} hour{'s' if hours > 1 else ''}"
            elif delta.seconds >= 60:
                minutes = delta.seconds // 60
                time_until_due = f"{minutes} minute{'s' if minutes > 1 else ''}"
            else:
                time_until_due = "due soon"
        elif task.due_date:
            # Has due date but no reminder_at - can't calculate time until due
            time_until_due = None

        # Create notification message
        message = f"Reminder: {task.title}"
        if time_until_due:
            message += f" - {time_until_due} until due"
        elif task.due_date:
            message += f" - due at {task.due_date.strftime('%Y-%m-%d %H:%M')} UTC"

        # Check if notification already exists for this reminder time
        existing_query = select(Notification).where(
            Notification.task_id == task_id,
            Notification.type == "reminder",
            Notification.title == "Task Reminder"
        )
        existing_result = await session.execute(existing_query)
        existing = existing_result.first()

        if existing:
            logger.info(f"Reminder notification already exists for task {task_id}")
            return

        # Create the notification
        notification = Notification(
            user_id=task.user_id,
            task_id=task_id,
            type="reminder",
            title="Task Reminder",
            message=message,
            read=False,
        )
        session.add(notification)
        await session.commit()

        logger.info(f"Created reminder notification for task {task_id}: {message}")


# For Dapr Jobs API compatibility
def due_date_reminder_job() -> None:
    """
    Background job to create due date reminders for tasks due tomorrow.

    Should be run daily (e.g., via cron or scheduler).
    This is a synchronous wrapper for compatibility with APScheduler.
    """
    import asyncio
    from datetime import timedelta
    from app.services.notification_service import utcnow

    async def _run():
        now = utcnow()
        tomorrow_start = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow_end = (now + timedelta(days=1)).replace(hour=23, minute=59, second=59, microsecond=0)

        async with AsyncSession(engine) as session:
            # Find tasks due in the next 24 hours (tomorrow) that aren't completed
            from sqlmodel import select
            query = select(Task).where(
                Task.due_date >= tomorrow_start,
                Task.due_date <= tomorrow_end,
                Task.completed == False
            )
            result = await session.execute(query)
            tasks_due = result.scalars().all()

            for task in tasks_due:
                # Check if reminder already exists for this task
                existing_query = select(Notification).where(
                    Notification.task_id == task.id,
                    Notification.type == "due_date_reminder",
                    Notification.created_at >= tomorrow_start
                )
                existing_result = await session.execute(existing_query)
                existing = existing_result.first()

                if not existing:
                    # Create reminder notification
                    await NotificationService.create_notification(
                        session=session,
                        user_id=task.user_id,
                        type="due_date_reminder",
                        title="Task due soon",
                        message=f"{task.title} is due tomorrow",
                        task_id=task.id,
                    )

            await session.commit()
            logger.info(f"Processed {len(tasks_due)} tasks for due date reminders")

    # Run the async function
    asyncio.run(_run())
