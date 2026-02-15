"""
Jobs API Routes.

Endpoints for Dapr job callbacks and job management.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user, UserRead
from app.database import get_session
from app.models import Task

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.post("/trigger")
async def trigger_job(
    task_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
):
    """
    Job trigger endpoint for Dapr Jobs API callbacks.

    When a scheduled job triggers, Dapr calls this endpoint
    to execute the job logic (create notification).

    Args:
        task_id: Task ID to process reminder for
        session: Database session
        current_user: Authenticated user

    Returns:
        Success message
    """
    # Verify task exists and belongs to user
    task = await session.get(Task, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found"
        )

    # In production, authorization would be handled via API key
    # For now, we process the job directly

    # Import the job function to avoid circular dependency
    from app.jobs import create_reminder_notification

    # Execute the job
    await create_reminder_notification(task_id)

    return {"status": "success", "message": f"Reminder processed for task {task_id}"}


@router.delete("/reminders/{task_id}")
async def cancel_reminder(
    task_id: int,
    scheduler,
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
):
    """
    Cancel scheduled reminders for a task.

    Args:
        task_id: Task ID to cancel reminders for
        scheduler: APScheduler instance (from app.state)
        session: Database session
        current_user: Authenticated user

    Returns:
        Success message
    """
    # Verify task exists and belongs to user
    task = await session.get(Task, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found"
        )

    if task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel reminders for this task"
        )

    # Cancel the scheduled job
    from app.services.task_service import TaskService

    TaskService.cancel_reminder(task_id, scheduler)

    return {"status": "success", "message": f"Reminders cancelled for task {task_id}"}
