"""
Task routes - REST API endpoints for task CRUD operations.

All endpoints require JWT authentication via Better Auth.
Users can only access their own tasks (data isolation).
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user, UserRead
from app.database import get_session
from app.models import TaskCreate, TaskList, TaskRead, TaskUpdate
from app.services.task_service import TaskService

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("", response_model=TaskList)
async def list_tasks(
    completed: Optional[bool] = Query(None, description="Filter by completion status"),
    priority: Optional[str] = Query(None, description="Filter by priority (low, medium, high)"),
    search: Optional[str] = Query(None, description="Search in title/description"),
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
) -> TaskList:
    """
    List all tasks for the current user.

    Supports filtering by:
    - completed: Show only completed/incomplete tasks
    - priority: Show only tasks of specific priority
    - search: Find tasks matching text in title or description
    """
    tasks = await TaskService.list_tasks(
        session=session,
        user_id=current_user.id,
        completed=completed,
        priority=priority,
        search=search,
    )
    return TaskList(
        tasks=[TaskRead.model_validate(t) for t in tasks],
        total=len(tasks),
    )


@router.get("/{task_id}", response_model=TaskRead)
async def get_task(
    task_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
) -> TaskRead:
    """Get a specific task by ID."""
    task = await TaskService.get_task(session, task_id, current_user.id)
    return TaskRead.model_validate(task)


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
) -> TaskRead:
    """Create a new task for the current user."""
    return await TaskService.create_task(session, task_data, current_user.id)


@router.patch("/{task_id}", response_model=TaskRead)
async def update_task(
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
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
) -> TaskRead:
    """Mark a task as completed."""
    return await TaskService.set_completion(session, task_id, True, current_user.id)


@router.post("/{task_id}/uncomplete", response_model=TaskRead)
async def uncomplete_task(
    task_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
) -> TaskRead:
    """Mark a task as incomplete (reopen)."""
    return await TaskService.set_completion(session, task_id, False, current_user.id)
