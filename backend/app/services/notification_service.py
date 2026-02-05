"""
NotificationService - Business logic for notification operations.

Implements user isolation and notification lifecycle management.
Includes due date reminder checking and recurring task instance creation.
All datetimes are handled in UTC for consistency.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from dateutil.rrule import rrulestr
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlmodel import select

from app.models import Notification, Task, NotificationCreate, NotificationUpdate


def utcnow() -> datetime:
    """Get current datetime in UTC with timezone info for consistent comparisons."""
    return datetime.now(timezone.utc).replace(microsecond=0)


class NotificationService:
    """
    Service layer for Notification operations.

    All methods automatically filter by user_id to ensure data isolation.
    """

    @staticmethod
    async def list_notifications(
        session: AsyncSession,
        user_id: str,
        unread_only: bool = False,
        limit: int = 50,
    ) -> list[Notification]:
        """
        List notifications for the current user.

        Args:
            session: Database session
            user_id: Current user's ID (for isolation)
            unread_only: Filter to only unread notifications
            limit: Maximum number of notifications to return

        Returns:
            List of notifications ordered by created_at descending
        """
        query = select(Notification).where(Notification.user_id == user_id)

        if unread_only:
            query = query.where(Notification.read == False)

        query = query.order_by(Notification.created_at.desc()).limit(limit)

        results = await session.execute(query)
        return list(results.scalars().all())

    @staticmethod
    async def get_unread_count(session: AsyncSession, user_id: str) -> int:
        """
        Get the count of unread notifications for a user.

        Args:
            session: Database session
            user_id: Current user's ID

        Returns:
            Count of unread notifications (capped at 99 for display)
        """
        query = select(Notification).where(
            Notification.user_id == user_id,
            Notification.read == False
        )
        result = await session.execute(query)
        return min(len(list(result.scalars().all())), 99)

    @staticmethod
    async def get_notification(
        session: AsyncSession,
        notification_id: int,
        user_id: str,
    ) -> Notification:
        """
        Get a specific notification by ID.

        Args:
            session: Database session
            notification_id: Notification ID to fetch
            user_id: Current user's ID (for access control)

        Returns:
            The requested notification

        Raises:
            HTTPException: 404 if notification not found or doesn't belong to user
        """
        notification = await session.get(Notification, notification_id)
        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )

        if notification.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this notification"
            )

        return notification

    @staticmethod
    async def create_notification(
        session: AsyncSession,
        user_id: str,
        type: str,
        title: str,
        message: Optional[str] = None,
        task_id: Optional[int] = None,
    ) -> Notification:
        """
        Create a new notification for a user.

        Args:
            session: Database session
            user_id: Recipient user's ID
            type: Notification type (due_date_reminder, task_completed)
            title: Notification title
            message: Optional additional message
            task_id: Optional related task ID

        Returns:
            The created notification
        """
        notification = Notification(
            user_id=user_id,
            task_id=task_id,
            type=type,
            title=title,
            message=message,
            read=False,
        )
        session.add(notification)
        await session.commit()
        await session.refresh(notification)
        return notification

    @staticmethod
    async def update_notification(
        session: AsyncSession,
        notification_id: int,
        notification_data: NotificationUpdate,
        user_id: str,
    ) -> Notification:
        """
        Update a notification (typically to mark as read).

        Args:
            session: Database session
            notification_id: Notification ID to update
            notification_data: Update data
            user_id: Current user's ID (for access control)

        Returns:
            The updated notification
        """
        notification = await NotificationService.get_notification(
            session, notification_id, user_id
        )

        notification.read = notification_data.read
        session.add(notification)
        await session.commit()
        await session.refresh(notification)

        return notification

    @staticmethod
    async def delete_notification(
        session: AsyncSession,
        notification_id: int,
        user_id: str,
    ) -> bool:
        """
        Delete a notification.

        Args:
            session: Database session
            notification_id: Notification ID to delete
            user_id: Current user's ID (for access control)

        Returns:
            True if deleted
        """
        notification = await NotificationService.get_notification(
            session, notification_id, user_id
        )
        await session.delete(notification)
        await session.commit()
        return True

    @staticmethod
    def create_next_instance(task: Task) -> Optional[dict]:
        """
        Create the next instance of a recurring task.

        Uses the iCal RRULE format to calculate the next occurrence.
        Returns a dict of task data for creating the next instance.

        Args:
            task: The completed task instance

        Returns:
            Dict containing data for next instance, or None if no next occurrence
        """
        if not task.recurrence_rule or not task.due_date:
            return None

        try:
            rule = rrulestr(task.recurrence_rule)
            next_date = rule.after(task.due_date)

            if next_date:
                return {
                    "user_id": task.user_id,
                    "parent_task_id": task.id,
                    "title": task.title,
                    "description": task.description,
                    "priority": task.priority,
                    "due_date": next_date,
                    "recurrence_rule": task.recurrence_rule,
                    "completed": False,
                }
        except Exception:
            # Invalid RRULE - log and return None
            pass

        return None

    @staticmethod
    async def check_due_date_reminders(session: AsyncSession) -> None:
        """
        Background job to create due date reminders for tasks due tomorrow.

        Should be run daily (e.g., via cron or scheduler).
        Creates notifications for tasks due within 24 hours
        that don't already have a reminder.

        Uses UTC timezone for all date comparisons to ensure consistency
        across different server locations and user timezones.

        Args:
            session: Database session
        """
        now = utcnow()
        tomorrow_start = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0)
        tomorrow_end = (now + timedelta(days=1)).replace(hour=23, minute=59, second=59)

        # Find tasks due in the next 24 hours (tomorrow) that aren't completed
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
                Notification.created_at >= tomorrow_start  # Only check recent notifications
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
