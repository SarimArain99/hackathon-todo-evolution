"""
TaskService - Business logic for task CRUD operations.

Implements user isolation - users can only access their own tasks.
All operations are scoped to the current user's ID.
"""

import json
from datetime import date, datetime, timedelta
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
        sort_by: str = "created_at",
        sort_order: str = "desc",
        filter_start: Optional[date] = None,
        filter_end: Optional[date] = None,
        preset_filter: Optional[str] = None,
    ) -> list[Task]:
        """
        List all tasks for the current user with optional filters and sorting.

        Args:
            session: Database session
            user_id: Current user's ID (for isolation)
            completed: Filter by completion status
            priority: Filter by priority level
            search: Search in title/description
            sort_by: Field to sort by (due_date, priority, created_at, title)
            sort_order: Sort direction (asc, desc)
            filter_start: Filter tasks created after this date
            filter_end: Filter tasks created before this date
            preset_filter: Quick date filter (today, this_week, this_month)

        Returns:
            List of tasks belonging to the user
        """
        query = select(Task).where(Task.user_id == user_id)

        # Apply status filter
        if completed is not None:
            query = query.where(Task.completed == completed)

        # Apply priority filter
        if priority is not None:
            query = query.where(Task.priority == priority)

        # Apply search filter
        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                (Task.title.icontains(search_pattern)) |
                (Task.description.icontains(search_pattern))
            )

        # Apply preset date filters
        if preset_filter == "today":
            today = date.today()
            query = query.where(
                Task.created_at >= datetime.combine(today, datetime.min.time()),
                Task.created_at < datetime.combine(today + timedelta(days=1), datetime.min.time())
            )
        elif preset_filter == "this_week":
            start_of_week = date.today() - timedelta(days=date.today().weekday())
            query = query.where(Task.created_at >= datetime.combine(start_of_week, datetime.min.time()))
        elif preset_filter == "this_month":
            start_of_month = date.today().replace(day=1)
            query = query.where(Task.created_at >= datetime.combine(start_of_month, datetime.min.time()))

        # Apply custom date range filters
        if filter_start:
            query = query.where(Task.created_at >= datetime.combine(filter_start, datetime.min.time()))
        if filter_end:
            # Include the entire end day
            query = query.where(Task.created_at < datetime.combine(filter_end + timedelta(days=1), datetime.min.time()))

        # Apply sorting
        sort_column = getattr(Task, sort_by, Task.created_at)

        # Handle priority sorting (high=3, medium=2, low=1)
        if sort_by == "priority":
            # For priority, we want custom order: high > medium > low
            # Use case expression for proper ordering
            from sqlalchemy import case
            priority_order = case(
                (Task.priority == "high", 3),
                (Task.priority == "medium", 2),
                (Task.priority == "low", 1),
                else_=0
            )
            query = query.order_by(priority_order.desc() if sort_order == "desc" else priority_order.asc())
        else:
            query = query.order_by(sort_column.desc() if sort_order == "desc" else sort_column.asc())

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

        task.updated_at = datetime.utcnow()
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
        task.updated_at = datetime.utcnow()

        session.add(task)
        await session.commit()
        await session.refresh(task)

        return TaskRead.model_validate(task)
