"""
Task routes - REST API endpoints for task CRUD operations.

All endpoints require JWT authentication via Better Auth.
Users can only access their own tasks (data isolation).
"""

from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Body, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user, UserRead
from app.database import get_session
from app.models import TaskCreate, TaskList, TaskRead, TaskUpdate, TaskReadExtended
from app.services.task_service import TaskService
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


class CompleteTaskRequest(BaseModel):
    """Request schema for completing a task with recurrence handling."""
    edit_scope: str = "this"  # "this" for single instance, "all" for entire series


@router.get("", response_model=TaskList)
async def list_tasks(
    # Existing filters
    completed: Optional[bool] = Query(None, description="Filter by completion status"),
    priority: Optional[str] = Query(None, description="Filter by priority (low, medium, high)"),
    search: Optional[str] = Query(None, description="Search in title/description"),
    # NEW: Sort parameters
    sort_by: Optional[str] = Query("created_at", description="Sort field: due_date, priority, created_at, title"),
    sort_order: Optional[str] = Query("desc", description="Sort direction: asc or desc"),
    # NEW: Date filter parameters
    filter_start: Optional[date] = Query(None, description="Filter tasks created after this date (YYYY-MM-DD)"),
    filter_end: Optional[date] = Query(None, description="Filter tasks created before this date (YYYY-MM-DD)"),
    preset_filter: Optional[str] = Query(None, description="Preset date filter: today, this_week, this_month"),
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
) -> TaskList:
    """
    List all tasks for the current user.

    Supports filtering by:
    - completed: Show only completed/incomplete tasks
    - priority: Show only tasks of specific priority
    - search: Find tasks matching text in title or description

    Supports sorting by:
    - sort_by: Field to sort (due_date, priority, created_at, title)
    - sort_order: Direction (asc, desc)

    Supports date filtering by:
    - filter_start/filter_end: Custom date range
    - preset_filter: Quick presets (today, this_week, this_month)
    """
    tasks = await TaskService.list_tasks(
        session=session,
        user_id=current_user.id,
        completed=completed,
        priority=priority,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        filter_start=filter_start,
        filter_end=filter_end,
        preset_filter=preset_filter,
    )
    return TaskList(
        tasks=[TaskRead.model_validate(t) for t in tasks],
        total=len(tasks),
    )


@router.get("/{task_id}", response_model=TaskReadExtended)
async def get_task(
    task_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
) -> TaskReadExtended:
    """
    Get a specific task by ID.

    Returns extended task data including parent_task_id for recurring tasks.
    This endpoint is used for pre-populating the edit form.
    """
    task = await TaskService.get_task(session, task_id, current_user.id)
    return TaskReadExtended.model_validate(task)


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
) -> TaskRead:
    """Create a new task for the current user."""
    return await TaskService.create_task(session, task_data, current_user.id)


@router.put("/{task_id}", response_model=TaskRead)
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
) -> TaskRead:
    """
    Update an existing task. All fields are optional - only provided fields will be updated.

    This endpoint is used for edit mode functionality.
    """
    return await TaskService.update_task(session, task_id, task_data, current_user.id)


@router.patch("/{task_id}", response_model=TaskRead)
async def patch_task(
    task_id: int,
    task_data: TaskUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
) -> TaskRead:
    """Update an existing task. Only provided fields will be updated."""
    return await TaskService.update_task(session, task_id, task_data, current_user.id)


@router.delete("/{task_id}", status_code=status.HTTP_200_OK)
async def delete_task(
    task_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
) -> dict[str, bool]:
    """Delete a task."""
    await TaskService.delete_task(session, task_id, current_user.id)
    return {"ok": True}


@router.post("/{task_id}/complete", response_model=TaskRead)
async def complete_task(
    task_id: int,
    request: CompleteTaskRequest = Body(default=CompleteTaskRequest()),
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
) -> TaskRead:
    """
    Mark a task as completed.

    For recurring tasks, creates the next instance immediately if edit_scope is "this".
    Also creates a completion notification for the user.
    """
    # Get the task before completion
    task = await TaskService.get_task(session, task_id, current_user.id)

    # Mark as completed
    updated_task = await TaskService.set_completion(session, task_id, True, current_user.id)

    # Create completion notification
    await NotificationService.create_notification(
        session=session,
        user_id=current_user.id,
        type="task_completed",
        title="Task completed",
        message=f"Great job! You finished {task.title}",
        task_id=task.id,
    )

    # Handle recurring tasks - create next instance if applicable
    next_instance = None
    if task.recurrence_rule and request.edit_scope == "this":
        next_instance_data = NotificationService.create_next_instance(task)
        if next_instance_data:
            # Import here to avoid circular dependency
            from app.models import Task
            next_task = Task(**next_instance_data)
            session.add(next_task)
            await session.commit()
            await session.refresh(next_task)
            next_instance = TaskRead.model_validate(next_task)

    # Refresh to get latest state
    await session.refresh(updated_task)

    return updated_task


@router.post("/{task_id}/uncomplete", response_model=TaskRead)
async def uncomplete_task(
    task_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
) -> TaskRead:
    """Mark a task as incomplete (reopen)."""
    return await TaskService.set_completion(session, task_id, False, current_user.id)
