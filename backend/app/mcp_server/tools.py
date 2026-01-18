"""
MCP Tools for Todo Chatbot.

This module defines all MCP tools that the AI agent can invoke to manage tasks.
Each tool is stateless and interacts directly with TaskService.
"""

from contextvars import ContextVar
from datetime import datetime
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import TaskCreate, TaskUpdate
from app.services.task_service import TaskService


def _parse_due_date(due_date_str: Optional[str]) -> Optional[datetime]:
    """
    Parse a due date string into a datetime object.

    Supports common date formats like:
    - "2025-01-15"
    - "tomorrow"
    - "next week"
    - "in 3 days"

    Args:
        due_date_str: String representation of a date

    Returns:
        datetime object or None if parsing fails
    """
    if not due_date_str:
        return None

    # Try ISO format first
    try:
        return datetime.fromisoformat(due_date_str.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        pass

    # Try common date parsing
    from datetime import timedelta
    today = datetime.now()
    due_date_str_lower = due_date_str.strip().lower()

    if due_date_str_lower == "today":
        return today
    elif due_date_str_lower == "tomorrow":
        return today + timedelta(days=1)
    elif due_date_str_lower.startswith("next week"):
        return today + timedelta(days=7)
    elif due_date_str_lower.startswith("in "):
        # "in 3 days", "in 1 week", etc.
        parts = due_date_str_lower.split()
        if len(parts) >= 2:
            try:
                amount = int(parts[1])
                if "day" in parts[2]:
                    return today + timedelta(days=amount)
                elif "week" in parts[2]:
                    return today + timedelta(weeks=amount)
                elif "month" in parts[2]:
                    # Approximate month as 30 days
                    return today + timedelta(days=amount * 30)
            except (ValueError, IndexError):
                pass

    # If all parsing fails, return None
    return None


def _format_due_date(dt: Optional[datetime]) -> Optional[str]:
    """Format datetime to ISO string for JSON serialization."""
    if dt is None:
        return None
    return dt.isoformat()


# Session context for tool execution (set by AgentService before calling tools)
_db_session: ContextVar[Optional[AsyncSession]] = ContextVar("mcp_db_session", default=None)
_user_id: ContextVar[Optional[str]] = ContextVar("mcp_user_id", default=None)


def get_session() -> AsyncSession:
    """Get the current database session from context."""
    session = _db_session.get()
    if session is None:
        raise RuntimeError("Database session not set. Use set_mcp_context() before calling tools.")
    return session


def get_user_id() -> str:
    """Get the current user ID from context."""
    user_id = _user_id.get()
    if user_id is None:
        raise RuntimeError("User ID not set. Use set_mcp_context() before calling tools.")
    return user_id


async def set_mcp_context(session: AsyncSession, user_id: str):
    """
    Set the execution context for MCP tools.

    This must be called before any tool is invoked.

    Args:
        session: Database session to use for tool operations
        user_id: Current user's ID for data isolation
    """
    _db_session.set(session)
    _user_id.set(user_id)


def clear_mcp_context():
    """Clear the MCP execution context after tool execution."""
    _db_session.set(None)
    _user_id.set(None)


# =============================================================================
# MCP Tool Implementations
# =============================================================================

async def add_task(
    title: str,
    description: Optional[str] = None,
    priority: str = "medium",
    tags: Optional[list[str]] = None,
    due_date: Optional[str] = None,
) -> dict:
    """
    Create a new task for the user.

    Use this tool when the user wants to create, add, or insert a new task.
    Supports natural language due dates like "tomorrow", "next week", "in 3 days".

    Args:
        title: The task title (required)
        description: Optional detailed description
        priority: Task priority - "low", "medium", or "high" (default: "medium")
        tags: Optional list of tags for categorization
        due_date: Optional due date (ISO format "2025-01-15" or natural language "tomorrow")

    Returns:
        Dictionary with task_id, status, and task details
    """
    session = get_session()
    user_id = get_user_id()

    # Parse due date if provided
    parsed_due_date = _parse_due_date(due_date) if due_date else None

    task_data = TaskCreate(
        title=title,
        description=description,
        priority=priority if priority in ("low", "medium", "high") else "medium",
        tags=tags or [],
        due_date=parsed_due_date,
    )

    task = await TaskService.create_task(session, task_data, user_id)

    return {
        "task_id": task.id,
        "status": "created",
        "title": task.title,
        "description": task.description,
        "completed": task.completed,
        "priority": task.priority,
        "tags": task.tags,
        "due_date": _format_due_date(task.due_date),
    }


async def list_tasks(
    completed: Optional[bool] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
) -> dict:
    """
    List tasks from the user's todo list.

    Use this tool when the user asks what tasks they have or wants to see their list.

    Args:
        completed: Filter by completion status (true/false)
        priority: Filter by priority level ("low", "medium", "high")
        search: Search text in title or description

    Returns:
        Dictionary with list of tasks and total count
    """
    session = get_session()
    user_id = get_user_id()

    tasks = await TaskService.list_tasks(
        session,
        user_id,
        completed=completed,
        priority=priority,
        search=search,
    )

    return {
        "tasks": [
            {
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "completed": t.completed,
                "priority": t.priority,
                "tags": t.tags if isinstance(t.tags, list) else [],
                "due_date": _format_due_date(t.due_date),
            }
            for t in tasks
        ],
        "total": len(tasks),
    }


async def complete_task(task_id: int) -> dict:
    """
    Mark a task as completed.

    Use this tool when the user wants to complete, finish, or check off a task.

    Args:
        task_id: The ID of the task to complete

    Returns:
        Dictionary with task_id, status, and completion confirmation
    """
    session = get_session()
    user_id = get_user_id()

    task = await TaskService.set_completion(session, task_id, True, user_id)

    return {
        "task_id": task.id,
        "status": "completed",
        "title": task.title,
        "completed": task.completed,
    }


async def update_task(
    task_id: int,
    title: Optional[str] = None,
    description: Optional[str] = None,
    priority: Optional[str] = None,
    completed: Optional[bool] = None,
    tags: Optional[list[str]] = None,
    due_date: Optional[str] = None,
) -> dict:
    """
    Update an existing task.

    Use this tool when the user wants to change, modify, or edit a task.
    Supports natural language due dates like "tomorrow", "next week", "in 3 days".

    Args:
        task_id: The ID of the task to update
        title: New task title
        description: New description
        priority: New priority level ("low", "medium", "high")
        completed: New completion status
        tags: New list of tags
        due_date: New due date (ISO format "2025-01-15" or natural language "tomorrow")

    Returns:
        Dictionary with updated task details
    """
    session = get_session()
    user_id = get_user_id()

    # Build update data with only provided fields
    update_data = {}
    if title is not None:
        update_data["title"] = title
    if description is not None:
        update_data["description"] = description
    if priority is not None:
        update_data["priority"] = priority
    if completed is not None:
        update_data["completed"] = completed
    if tags is not None:
        update_data["tags"] = tags
    if due_date is not None:
        parsed_due_date = _parse_due_date(due_date)
        update_data["due_date"] = parsed_due_date

    task_update = TaskUpdate(**update_data)
    task = await TaskService.update_task(session, task_id, task_update, user_id)

    return {
        "task_id": task.id,
        "status": "updated",
        "title": task.title,
        "description": task.description,
        "completed": task.completed,
        "priority": task.priority,
        "tags": task.tags if isinstance(task.tags, list) else [],
        "due_date": _format_due_date(task.due_date),
    }


async def delete_task(task_id: int) -> dict:
    """
    Delete a task from the user's todo list.

    Use this tool when the user wants to remove or delete a task.

    Args:
        task_id: The ID of the task to delete

    Returns:
        Dictionary confirming deletion
    """
    session = get_session()
    user_id = get_user_id()

    await TaskService.delete_task(session, task_id, user_id)

    return {
        "task_id": task_id,
        "status": "deleted",
        "deleted": True,
    }


# =============================================================================
# Tool Registry and Metadata
# =============================================================================

# Tool definitions for OpenAI function calling
MCP_TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "add_task",
            "description": "Add a new task to the user's todo list. Use this when the user wants to create, add, or insert a new task. Supports natural language due dates like 'tomorrow', 'next week', 'in 3 days', or ISO format like '2025-01-15'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "The task title (required)",
                    },
                    "description": {
                        "type": "string",
                        "description": "Optional detailed description",
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["low", "medium", "high"],
                        "description": "Task priority (default: medium)",
                    },
                    "tags": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Optional list of tags for categorization",
                    },
                    "due_date": {
                        "type": "string",
                        "description": "Optional due date as ISO format (YYYY-MM-DD) or natural language (tomorrow, next week, in 3 days)",
                    },
                },
                "required": ["title"],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_tasks",
            "description": "List tasks from the user's todo list. Use this when the user asks what tasks they have or wants to see their list.",
            "parameters": {
                "type": "object",
                "properties": {
                    "completed": {
                        "type": "boolean",
                        "description": "Filter by completion status (true/false)",
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["low", "medium", "high"],
                        "description": "Filter by priority level",
                    },
                    "search": {
                        "type": "string",
                        "description": "Search text in title or description",
                    },
                },
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "complete_task",
            "description": "Mark a task as completed. Use this when the user wants to complete, finish, or check off a task.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "integer",
                        "description": "The ID of the task to complete",
                    },
                },
                "required": ["task_id"],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_task",
            "description": "Update an existing task. Use this when the user wants to change, modify, or edit a task. Supports natural language due dates like 'tomorrow', 'next week', 'in 3 days', or ISO format like '2025-01-15'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "integer",
                        "description": "The ID of the task to update",
                    },
                    "title": {
                        "type": "string",
                        "description": "New task title",
                    },
                    "description": {
                        "type": "string",
                        "description": "New description",
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["low", "medium", "high"],
                        "description": "New priority level",
                    },
                    "completed": {
                        "type": "boolean",
                        "description": "New completion status",
                    },
                    "tags": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "New list of tags",
                    },
                    "due_date": {
                        "type": "string",
                        "description": "New due date as ISO format (YYYY-MM-DD) or natural language (tomorrow, next week, in 3 days)",
                    },
                },
                "required": ["task_id"],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_task",
            "description": "Delete a task from the user's todo list. Use this when the user wants to remove or delete a task.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "integer",
                        "description": "The ID of the task to delete",
                    },
                },
                "required": ["task_id"],
                "additionalProperties": False,
            },
        },
    },
]

# Mapping of tool names to their implementation functions
MCP_TOOL_FUNCTIONS = {
    "add_task": add_task,
    "list_tasks": list_tasks,
    "complete_task": complete_task,
    "update_task": update_task,
    "delete_task": delete_task,
}
