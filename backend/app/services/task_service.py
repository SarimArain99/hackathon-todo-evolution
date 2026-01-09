"""
TaskService - Business logic for task CRUD operations.

Implements user isolation - users can only access their own tasks.
All operations are scoped to the current user's ID.
"""

import json
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models import Task, TaskCreate, TaskRead, TaskUpdate


class TaskService:
    """
    Service layer for Task operations.

    All methods automatically filter by user_id to ensure data isolation.
    """

    @staticmethod
    async def list_tasks(
        session: AsyncSession,
        user_id: str,
        completed: Optional[bool] = None,
        priority: Optional[str] = None,
        search: Optional[str] = None,
    ) -> list[Task]:
        """
        List all tasks for the current user with optional filters.

        Args:
            session: Database session
            user_id: Current user's ID (for isolation)
            completed: Filter by completion status
            priority: Filter by priority level
            search: Search in title/description

        Returns:
            List of tasks belonging to the user
        """
        query = select(Task).where(Task.user_id == user_id)

        if completed is not None:
            query = query.where(Task.completed == completed)

        if priority is not None:
            query = query.where(Task.priority == priority)

        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                (Task.title.icontains(search_pattern)) |
                (Task.description.icontains(search_pattern))
            )

        query = query.order_by(Task.created_at.desc())

        results = await session.execute(query)
        return list(results.scalars().all())

    @staticmethod
    async def get_task(session: AsyncSession, task_id: int, user_id: str) -> Task:
        """
        Get a specific task by ID.

        Args:
            session: Database session
            task_id: Task ID to fetch
            user_id: Current user's ID (for access control)

        Returns:
            The requested task

        Raises:
            HTTPException: 404 if task not found or doesn't belong to user
        """
        task = await session.get(Task, task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )

        if task.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this task"
            )

        return task

    @staticmethod
    def _task_data_to_dict(task_data: TaskCreate | TaskUpdate) -> dict:
        """Convert task data to dict, handling tags JSON conversion."""
        data = task_data.model_dump(exclude_unset=True)
        # Convert tags list to JSON string if present
        if "tags" in data and data["tags"] is not None:
            data["tags"] = json.dumps(data["tags"])
        return data

    @staticmethod
    async def create_task(
        session: AsyncSession,
        task_data: TaskCreate,
        user_id: str,
    ) -> TaskRead:
        """
        Create a new task for the current user.

        Args:
            session: Database session
            task_data: Task creation data
            user_id: Current user's ID (for ownership)

        Returns:
            The created task
        """
        data = TaskService._task_data_to_dict(task_data)
        task = Task(**data, user_id=user_id)
        session.add(task)
        await session.commit()
        await session.refresh(task)

        return TaskRead.model_validate(task)

    @staticmethod
    async def update_task(
        session: AsyncSession,
        task_id: int,
        task_data: TaskUpdate,
        user_id: str,
    ) -> TaskRead:
        """
        Update an existing task.

        Args:
            session: Database session
            task_id: Task ID to update
            task_data: Updated task data
            user_id: Current user's ID (for access control)

        Returns:
            The updated task

        Raises:
            HTTPException: 404 if task not found, 403 if not owned by user
        """
        task = await TaskService.get_task(session, task_id, user_id)

        # Update only provided fields
        update_data = TaskService._task_data_to_dict(task_data)
        for field, value in update_data.items():
            setattr(task, field, value)

        task.updated_at = datetime.now(timezone.utc)
        session.add(task)
        await session.commit()
        await session.refresh(task)

        return TaskRead.model_validate(task)

    @staticmethod
    async def delete_task(session: AsyncSession, task_id: int, user_id: str) -> bool:
        """
        Delete a task.

        Args:
            session: Database session
            task_id: Task ID to delete
            user_id: Current user's ID (for access control)

        Returns:
            True if deleted

        Raises:
            HTTPException: 404 if task not found, 403 if not owned by user
        """
        task = await TaskService.get_task(session, task_id, user_id)
        await session.delete(task)
        await session.commit()
        return True

    @staticmethod
    async def set_completion(
        session: AsyncSession,
        task_id: int,
        completed: bool,
        user_id: str,
    ) -> TaskRead:
        """
        Set the completion status of a task.

        Args:
            session: Database session
            task_id: Task ID to update
            completed: Desired completion status
            user_id: Current user's ID (for access control)

        Returns:
            The updated task
        """
        task = await TaskService.get_task(session, task_id, user_id)
        task.completed = completed
        task.updated_at = datetime.now(timezone.utc)

        session.add(task)
        await session.commit()
        await session.refresh(task)

        return TaskRead.model_validate(task)
