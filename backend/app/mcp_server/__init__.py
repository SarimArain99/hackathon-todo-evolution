"""
MCP Server for Todo Chatbot.

This module provides a FastMCP-based server that exposes task management
tools for the AI agent to invoke. Tools are stateless and interact directly
with the TaskService.
"""

from app.mcp_server.server import get_mcp_server

__all__ = ["get_mcp_server"]
