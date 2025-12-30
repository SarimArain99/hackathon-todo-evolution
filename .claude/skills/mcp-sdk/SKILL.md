# MCP SDK Skill (Model Context Protocol)

**Source**: Context7 MCP - `/modelcontextprotocol/python-sdk`
**Benchmark Score**: 89.2 | **Code Snippets**: 296 | **Reputation**: High

## Overview

The MCP Python SDK implements the Model Context Protocol, enabling applications to provide standardized context for LLMs, build MCP clients, and create MCP servers that expose resources, prompts, and tools.

## Key Concepts

### 1. FastMCP Server (Recommended)

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Test Server", json_response=True)

@mcp.tool()
def add(a: int, b: int) -> int:
    """Add two numbers"""
    return a + b

@mcp.resource("greeting://{name}")
def get_greeting(name: str) -> str:
    """Get a personalized greeting"""
    return f"Hello, {name}!"

@mcp.prompt()
def greet_user(name: str, style: str = "friendly") -> str:
    """Generate a greeting prompt"""
    return f"Write a {style} greeting for someone named {name}."

if __name__ == "__main__":
    mcp.run(transport="streamable-http")
```

### 2. Low-Level MCP Server

```python
import asyncio
from typing import Any
import mcp.server.stdio
import mcp.types as types
from mcp.server.lowlevel import NotificationOptions, Server
from mcp.server.models import InitializationOptions

server = Server("example-server")

@server.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    """Return available tools."""
    return [
        types.Tool(
            name="calculate",
            description="Perform calculations",
            inputSchema={
                "type": "object",
                "properties": {
                    "operation": {"type": "string", "enum": ["add", "multiply"]},
                    "a": {"type": "number"},
                    "b": {"type": "number"}
                },
                "required": ["operation", "a", "b"]
            }
        )
    ]

@server.call_tool()
async def handle_tool(name: str, arguments: dict[str, Any]) -> dict[str, Any]:
    """Handle tool execution."""
    if name != "calculate":
        raise ValueError(f"Unknown tool: {name}")

    operation = arguments["operation"]
    a, b = arguments["a"], arguments["b"]

    if operation == "add":
        result = a + b
    elif operation == "multiply":
        result = a * b

    return {"result": result, "operation": operation}

@server.list_resources()
async def handle_list_resources() -> list[types.Resource]:
    return [
        types.Resource(
            uri=types.AnyUrl("data://stats"),
            name="Statistics",
            description="System statistics"
        )
    ]

@server.read_resource()
async def handle_read_resource(uri: types.AnyUrl) -> str | bytes:
    if str(uri) == "data://stats":
        return '{"cpu": 45, "memory": 60}'
    raise ValueError(f"Unknown resource: {uri}")

async def run():
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="example-server",
                server_version="0.1.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={}
                )
            )
        )

if __name__ == "__main__":
    asyncio.run(run())
```

### 3. Weather Service Example

```python
from mcp.server.fastmcp import FastMCP, Icon

mcp = FastMCP(
    "Weather Service",
    website_url="https://weather.example.com",
    icons=[Icon(src="https://weather.example.com/icon.png", mimeType="image/png")]
)

@mcp.tool()
def get_weather(city: str, unit: str = "celsius") -> str:
    """Get current weather for a city."""
    return f"Weather in {city}: 22°{unit[0].upper()}"

@mcp.resource("config://settings")
def get_settings() -> str:
    """Expose application settings as a resource."""
    return '{"theme": "dark", "language": "en"}'

@mcp.prompt()
def review_code(code: str) -> str:
    """Generate a code review prompt."""
    return f"Please review this code:\n\n{code}"

if __name__ == "__main__":
    mcp.run()
```

## Hackathon MCP Tools

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Todo MCP Server")

@mcp.tool()
def add_task(user_id: str, title: str, description: str = None) -> dict:
    """Create a new task."""
    # Database operation
    return {"task_id": 5, "status": "created", "title": title}

@mcp.tool()
def list_tasks(user_id: str, status: str = "all") -> list:
    """Retrieve tasks from the list."""
    return [{"id": 1, "title": "Buy groceries", "completed": False}]

@mcp.tool()
def complete_task(user_id: str, task_id: int) -> dict:
    """Mark a task as complete."""
    return {"task_id": task_id, "status": "completed"}

@mcp.tool()
def delete_task(user_id: str, task_id: int) -> dict:
    """Remove a task from the list."""
    return {"task_id": task_id, "status": "deleted"}

@mcp.tool()
def update_task(user_id: str, task_id: int, title: str = None, description: str = None) -> dict:
    """Modify task title or description."""
    return {"task_id": task_id, "status": "updated"}
```

## Running MCP Server

```bash
# Direct execution
python server.py

# With UV
uv run server.py
```
