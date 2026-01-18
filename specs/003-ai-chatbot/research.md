# Research: AI Chatbot Technical Decisions

**Feature**: 003-ai-chatbot
**Date**: 2026-01-14
**Status**: Complete

## Overview

This document consolidates research findings for implementing the AI-powered todo chatbot, covering OpenAI Agents SDK integration, MCP server patterns, and frontend chat UI.

## Decision 1: AI Framework - OpenAI Agents SDK

**Selected**: OpenAI Agents SDK (Python)

**Rationale**:
- Constitution-mandated for Phase III
- Native Python support with async/await
- Built-in tool calling with `@function_tool` decorator
- Session and conversation history management
- Excellent TypeScript/Pydantic integration

**Alternatives Considered**:
- LangChain: More complex, steeper learning curve
- Direct OpenAI API: Requires manual tool orchestration
- AutoGen: Multi-agent focus overkill for single-agent use case

**Key Patterns**:
```python
from agents import Agent, Runner, function_tool

@function_tool
async def add_task(user_id: str, title: str, description: str = None) -> dict:
    """Create a new task for a user."""
    # Database operation
    return {"task_id": 1, "status": "created", "title": title}

agent = Agent(
    name="Todo Assistant",
    instructions="You help users manage their todo lists.",
    tools=[add_task, list_tasks, complete_task, delete_task, update_task]
)

result = await Runner.run(agent, input="Add a task to buy groceries")
```

---

## Decision 2: MCP Server - FastMCP

**Selected**: FastMCP (high-level MCP SDK)

**Rationale**:
- Constitution-mandated for Phase III
- Declarative `@mcp.tool()` decorator pattern
- JSON response mode for easy integration
- Built-in stdio and HTTP transport support
- Minimal boilerplate compared to low-level SDK

**Alternatives Considered**:
- Low-level MCP SDK: Too verbose, requires manual schema definition
- Direct tool functions: Loses standardization benefits

**Key Patterns**:
```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Todo MCP Server", json_response=True)

@mcp.tool()
async def add_task(user_id: str, title: str, description: str = None) -> dict:
    """Create a new task for a user."""
    # Returns: {"task_id": 5, "status": "created", "title": "Buy groceries"}
    ...

if __name__ == "__main__":
    mcp.run(transport="streamable-http")
```

**Architecture Decision**: The MCP server will run as a separate module within the FastAPI application, exposing tools that the OpenAI Agent invokes. Tools are stateless - all state goes to the database.

---

## Decision 3: Conversation Storage - SQLModel with Neon PostgreSQL

**Selected**: Extend existing SQLModel setup with new Conversation and Message entities

**Rationale**:
- Reuses existing Phase II database infrastructure
- SQLModel provides Pydantic schemas automatically
- Neon PostgreSQL serverless scales automatically
- ACID compliance for conversation integrity

**Schema Design**:
```python
class Conversation(SQLModel, table=True):
    __tablename__ = "conversation"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

class Message(SQLModel, table=True):
    __tablename__ = "message"
    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversation.id")
    role: str = Field(index=True)  # "user" or "assistant"
    content: str
    tool_calls: Optional[str] = None  # JSON string of tool calls
    created_at: datetime = Field(default_factory=utc_now)
```

**Alternatives Considered**:
- Redis: Overkill for chat history, loses persistence on restart
- Separate chat database: Adds operational complexity

---

## Decision 4: State Management - Stateless Server Pattern

**Selected**: Stateless server with database-persisted conversations

**Rationale**:
- Constitution requirement (FR-030, FR-031)
- Enables horizontal scaling
- Server restarts don't lose conversations
- Matches Phase V cloud-native readiness goals

**Flow**:
1. Client sends message with `conversation_id` (or null for new)
2. Server loads conversation history from database
3. Server builds message array for agent
4. Server stores user message in database
5. Agent runs with MCP tools
6. Server stores assistant response and tool calls in database
7. Server returns response to client
8. Server holds NO state - ready for next request

---

## Decision 5: Frontend Chat UI - OpenAI ChatKit

**Selected**: OpenAI ChatKit for React

**Rationale**:
- Constitution-mandated for Phase III
- Purpose-built for AI chat interfaces
- Message rendering built-in
- Streaming response support
- TypeScript native

**Alternatives Considered**:
- Custom components: Reinventing the wheel
- Generic chat libraries: Missing AI-specific features

**Key Components**:
```tsx
import { ChatInterface, Message } from "@openai/chatkit"

function ChatPage() {
  return (
    <ChatInterface
      messages={messages}
      onSendMessage={handleSend}
      isStreaming={isLoading}
    />
  )
}
```

---

## Decision 6: API Contract - REST Endpoints

**Selected**: RESTful endpoints under `/api/chat/`

**Rationale**:
- Consistent with existing Phase II API patterns
- Simple stateless POST for chat
- Standard HTTP semantics

**Endpoints**:
- `POST /api/chat` - Send message, get AI response
- `GET /api/chat/conversations` - List user's conversations
- `GET /api/chat/conversations/{id}` - Get conversation details
- `GET /api/chat/conversations/{id}/messages` - Get conversation history
- `DELETE /api/chat/conversations/{id}` - Delete conversation

---

## Decision 7: Authentication - Better Auth JWT

**Selected**: Continue using Phase II Better Auth JWT middleware

**Rationale**:
- Already implemented and working
- User identity verified at request level
- No additional auth complexity needed

**Integration**:
- All `/api/chat/*` endpoints protected by JWT middleware
- `user_id` extracted from JWT token
- No separate chat authentication needed

---

## Decision 8: Error Handling - Graceful Degradation

**Selected**: User-friendly error messages with retry guidance

**Rationale**:
- Spec requirement FR-024, FR-026
- AI failures shouldn't crash the chat
- Users should understand what went wrong

**Patterns**:
```python
try:
    result = await Runner.run(agent, input=message)
except OpenAIError as e:
    return {
        "error": "AI service unavailable",
        "message": "I'm having trouble connecting right now. Please try again.",
        "retry": True
    }
except ToolError as e:
    return {
        "error": "action_failed",
        "message": f"Couldn't complete that action: {e}",
        "retry": False
    }
```

---

## Decision 9: Tool Implementation - Direct Database Access

**Selected**: MCP tools call TaskService directly (not HTTP)

**Rationale**:
- Tools run in-process with FastAPI
- Avoids HTTP overhead
- Reuses existing TaskService from Phase II
- Single transaction boundary

**Pattern**:
```python
@mcp.tool()
async def add_task(user_id: str, title: str, description: str = None) -> dict:
    task = await task_service.create_task(
        user_id=user_id,
        title=title,
        description=description
    )
    return {"task_id": task.id, "status": "created", "title": task.title}
```

---

## Decision 10: Context Window - Message Limit Strategy

**Selected**: Send last 50 messages + prune old

**Rationale**:
- Balances context awareness with token limits
- 50 messages covers most conversation sessions
- Oldest messages least relevant for current context

**Pattern**:
```python
messages = await conversation_service.get_messages(
    conversation_id=conv_id,
    limit=50,
    order="desc"  # Most recent first
)
messages.reverse()  # Put back in chronological order for agent
```

---

## Open Questions Resolved

| Question | Resolution |
|----------|------------|
| How to handle ambiguous task references? | Agent will list matching tasks and ask user to specify |
| What if AI service is down? | Return friendly error, don't crash, allow retry |
| How to prevent cross-user data access? | JWT middleware extracts user_id, all queries filtered by user_id |
| How to handle very long conversations? | Limit context to last 50 messages, store all in DB |
| How to show which tasks were modified? | Include `tool_calls` array in API response |

---

## Dependencies to Add

**Backend (pyproject.toml)**:
```toml
dependencies = [
    "openai-agents-sdk>=0.1.0",
    "mcp>=0.1.0",
    # ... existing dependencies
]
```

**Frontend (package.json)**:
```json
{
  "dependencies": {
    "@openai/chatkit": "latest",
    ...
  }
}
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              ChatKit UI (React/Next.js)                    │  │
│  │  - Message display with streaming                         │  │
│  │  - Input field with send button                           │  │
│  │  - Conversation sidebar                                   │  │
│  └───────────────────────────┬───────────────────────────────┘  │
└──────────────────────────────┼───────────────────────────────────┘
                               │ HTTPS + JWT
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI Server                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              POST /api/chat                                │ │
│  │  - JWT middleware extracts user_id                         │ │
│  │  - Loads conversation from DB                              │ │
│  │  - Calls AgentService                                      │ │
│  └────────────────────┬───────────────────────────────────────┘ │
│                       │                                          │
│  ┌────────────────────▼───────────────────────────────────────┐ │
│  │              AgentService                                  │ │
│  │  - Creates OpenAI Agent with function tools               │ │
│  │  - Runs agent with conversation context                   │ │
│  │  - Returns response + tool calls                           │ │
│  └────────────────────┬───────────────────────────────────────┘ │
│                       │                                          │
│  ┌────────────────────▼───────────────────────────────────────┐ │
│  │              MCP Tools                                     │ │
│  │  - add_task()    ──────────────────┐                       │ │
│  │  - list_tasks()  │                 │                       │ │
│  │  - complete_task()│  Direct calls   │                       │ │
│  │  - delete_task()  │  to TaskService │                       │ │
│  │  - update_task() ──────────────────┘                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────┬───────────────────────────────────────┘
                            │ SQLModel
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Neon PostgreSQL                                │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │    Task     │  │ Conversation │  │        Message          │ │
│  │  (existing) │  │   (new)      │  │       (new)             │ │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. Create data-model.md with entity definitions
2. Create API contracts in contracts/
3. Create quickstart.md with setup instructions
4. Update plan.md with architecture decisions
