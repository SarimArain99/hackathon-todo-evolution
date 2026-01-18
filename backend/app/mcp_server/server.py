"""
FastMCP Server for Todo Chatbot.

This module creates and configures the FastMCP server that exposes
task management tools for the AI agent.
"""

from typing import Callable

from mcp.server.fastmcp import FastMCP

from app.mcp_server.tools import (
    MCP_TOOL_DEFINITIONS,
    MCP_TOOL_FUNCTIONS,
    add_task,
    complete_task,
    delete_task,
    list_tasks,
    update_task,
)


# Create the FastMCP server instance
# Using json_response=True for easier integration with OpenAI
_mcp_server: FastMCP | None = None


def get_mcp_server() -> FastMCP:
    """
    Get or create the FastMCP server instance.

    The server is configured with all todo management tools.

    Returns:
        FastMCP server instance with registered tools
    """
    global _mcp_server

    if _mcp_server is not None:
        return _mcp_server

    # Create FastMCP server with JSON response mode
    _mcp_server = FastMCP(
        name="Todo MCP Server",
        json_response=True,
    )

    # Register all tools with the MCP server
    _register_tools(_mcp_server)

    return _mcp_server


def _register_tools(mcp: FastMCP) -> None:
    """
    Register all MCP tools with the FastMCP server.

    Args:
        mcp: FastMCP server instance
    """
    # Register add_task tool
    @mcp.tool()
    async def add_task_tool(
        title: str,
        description: str | None = None,
        priority: str = "medium",
        tags: list[str] | None = None,
    ) -> dict:
        """Create a new task for the user."""
        return await add_task(title, description, priority, tags)

    # Register list_tasks tool
    @mcp.tool()
    async def list_tasks_tool(
        completed: bool | None = None,
        priority: str | None = None,
        search: str | None = None,
    ) -> dict:
        """List tasks from the user's todo list."""
        return await list_tasks(completed, priority, search)

    # Register complete_task tool
    @mcp.tool()
    async def complete_task_tool(task_id: int) -> dict:
        """Mark a task as completed."""
        return await complete_task(task_id)

    # Register update_task tool
    @mcp.tool()
    async def update_task_tool(
        task_id: int,
        title: str | None = None,
        description: str | None = None,
        priority: str | None = None,
        completed: bool | None = None,
        tags: list[str] | None = None,
    ) -> dict:
        """Update an existing task."""
        return await update_task(task_id, title, description, priority, completed, tags)

    # Register delete_task tool
    @mcp.tool()
    async def delete_task_tool(task_id: int) -> dict:
        """Delete a task from the user's todo list."""
        return await delete_task(task_id)


def get_tool_definitions() -> list[dict]:
    """
    Get OpenAI function definitions for all registered tools.

    These definitions can be passed directly to OpenAI's API
    for function calling.

    Returns:
        List of function definition dictionaries
    """
    return MCP_TOOL_DEFINITIONS.copy()


def get_tool_function(tool_name: str) -> Callable:
    """
    Get the implementation function for a specific tool.

    Args:
        tool_name: Name of the tool to get

    Returns:
        Async function that implements the tool

    Raises:
        KeyError: If tool name is not recognized
    """
    if tool_name not in MCP_TOOL_FUNCTIONS:
        raise KeyError(f"Unknown tool: {tool_name}. Available tools: {list(MCP_TOOL_FUNCTIONS.keys())}")
    return MCP_TOOL_FUNCTIONS[tool_name]


def get_available_tools() -> list[str]:
    """
    Get list of available tool names.

    Returns:
        List of tool name strings
    """
    return list(MCP_TOOL_FUNCTIONS.keys())


__all__ = [
    "get_mcp_server",
    "get_tool_definitions",
    "get_tool_function",
    "get_available_tools",
]
