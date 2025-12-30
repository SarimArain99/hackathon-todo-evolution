# OpenAI Agents SDK Skill

**Source**: Context7 MCP - `/openai/openai-agents-python`
**Benchmark Score**: 86.4 | **Code Snippets**: 255 | **Reputation**: High

## Overview

The OpenAI Agents SDK is a framework for building multi-agent workflows, supporting various LLMs with features like agents, handoffs, guardrails, sessions, and tracing.

## Key Concepts

### 1. Basic Agent with Tools

```python
import asyncio
from agents import Agent, Runner, function_tool

@function_tool
def get_weather(city: str) -> str:
    return f"The weather in {city} is sunny."

agent = Agent(
    name="Hello world",
    instructions="You are a helpful agent.",
    tools=[get_weather],
)

async def main():
    result = await Runner.run(agent, input="What's the weather in Tokyo?")
    print(result.final_output)

if __name__ == "__main__":
    asyncio.run(main())
```

### 2. Function Tools with Type Hints

```python
import json
from typing_extensions import TypedDict, Any
from agents import Agent, FunctionTool, RunContextWrapper, function_tool

class Location(TypedDict):
    lat: float
    long: float

@function_tool
async def fetch_weather(location: Location) -> str:
    """Fetch the weather for a given location.

    Args:
        location: The location to fetch the weather for.
    """
    return "sunny"

@function_tool(name_override="fetch_data")
def read_file(ctx: RunContextWrapper[Any], path: str, directory: str | None = None) -> str:
    """Read the contents of a file.

    Args:
        path: The path to the file to read.
        directory: The directory to read the file from.
    """
    return "<file contents>"

agent = Agent(
    name="Assistant",
    tools=[fetch_weather, read_file],
)
```

### 3. Structured Output with Pydantic

```python
import asyncio
from typing import Annotated
from pydantic import BaseModel, Field
from agents import Agent, Runner, function_tool

class Weather(BaseModel):
    city: str = Field(description="The city name")
    temperature_range: str = Field(description="Temperature in Celsius")
    conditions: str = Field(description="Weather conditions")

@function_tool
def get_weather(city: Annotated[str, "The city to get weather for"]) -> Weather:
    """Get current weather information for a specified city."""
    return Weather(
        city=city,
        temperature_range="14-20C",
        conditions="Sunny with wind."
    )

agent = Agent(
    name="Weather Assistant",
    instructions="You are a helpful weather assistant.",
    tools=[get_weather]
)

async def main():
    result = await Runner.run(agent, "What's the weather in Tokyo?")
    print(result.final_output)

asyncio.run(main())
```

### 4. Custom Agent Execution

```python
@function_tool
async def run_my_agent() -> str:
    """A tool that runs the agent with custom configs"""
    agent = Agent(name="My agent", instructions="...")
    result = await Runner.run(
        agent,
        input="...",
        max_turns=5,
        run_config=...
    )
    return str(result.final_output)
```

## SDK Features

- **Agent Loop**: Built-in loop handles calling tools, sending results to LLM
- **Python-first**: Use built-in language features to orchestrate agents
- **Handoffs**: Coordinate and delegate between multiple agents
- **Guardrails**: Run input validations in parallel
- **Sessions**: Automatic conversation history management
- **Function Tools**: Turn any Python function into a tool with auto schema generation
- **Tracing**: Built-in visualization, debugging, and monitoring

## Hackathon MCP Tools Pattern

```python
from agents import Agent, function_tool

@function_tool
def add_task(user_id: str, title: str, description: str = None) -> dict:
    """Create a new task for a user."""
    # Call database/MCP tool
    return {"task_id": 1, "status": "created", "title": title}

@function_tool
def list_tasks(user_id: str, status: str = "all") -> list:
    """List tasks for a user."""
    return [{"id": 1, "title": "Buy groceries", "completed": False}]

@function_tool
def complete_task(user_id: str, task_id: int) -> dict:
    """Mark a task as complete."""
    return {"task_id": task_id, "status": "completed"}

todo_agent = Agent(
    name="Todo Assistant",
    instructions="You help users manage their todo lists.",
    tools=[add_task, list_tasks, complete_task]
)
```
