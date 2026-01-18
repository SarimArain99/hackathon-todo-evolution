# Implementation Plan: AI-Powered Todo Chatbot

**Branch**: `003-ai-chatbot` | **Date**: 2026-01-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-ai-chatbot/spec.md`

## Summary

Implement an AI-powered conversational interface for todo management using natural language. The system uses OpenAI Agents SDK for AI reasoning, MCP (Model Context Protocol) for tool exposure, and OpenAI ChatKit for the frontend UI. All conversation state is persisted to Neon PostgreSQL with a stateless server architecture for scalability.

**Technical Approach**: Agent receives user message, loads conversation context from database, invokes MCP tools to perform task operations, stores responses, and returns result to client.

## Technical Context

**Language/Version**: Python 3.13+ (backend), TypeScript 5+ (frontend)
**Primary Dependencies**: OpenAI Agents SDK, MCP FastMCP SDK, FastAPI, Next.js 16+, SQLModel
**Storage**: Neon Serverless PostgreSQL (extends Phase II database)
**Testing**: pytest (backend), React Testing Library (frontend)
**Target Platform**: Linux server (backend), Web browser (frontend)
**Project Type**: web (extends existing Phase II web application)
**Performance Goals**: <10s task creation, <2s conversation load, 90%+ AI accuracy
**Constraints**: Stateless server, JWT authentication, max 50 message context window
**Scale/Scope**: 100 concurrent conversations, 1M+ messages

## Architecture Decisions

### Decision 1: OpenAI Agents SDK for AI Orchestration

**Selected**: OpenAI Agents SDK with `@function_tool` decorator pattern

**Rationale**:
- Constitution-mandated for Phase III
- Native async/await support
- Built-in session management
- Automatic tool schema generation

**Key Pattern**:
```python
from agents import Agent, Runner, function_tool

@function_tool
async def add_task(user_id: str, title: str, description: str = None) -> dict:
    """Create a new task for a user."""
    return await task_service.create_task(user_id, title, description)

agent = Agent(
    name="Todo Assistant",
    instructions="You help users manage their todo lists.",
    tools=[add_task, list_tasks, complete_task, delete_task, update_task]
)
```

### Decision 2: FastMCP for Tool Server

**Selected**: FastMCP high-level SDK

**Rationale**:
- Declarative `@mcp.tool()` decorator
- Minimal boilerplate
- JSON response mode
- HTTP transport support

### Decision 3: Stateless Server with Database Persistence

**Selected**: All conversation state in PostgreSQL, server holds no memory

**Rationale**:
- Enables horizontal scaling
- Server restarts don't lose conversations
- Matches Phase V cloud-native goals
- Constitution requirement (FR-030, FR-031)

### Decision 4: Context Window Limit (50 Messages)

**Selected**: Store all messages, send last 50 to AI

**Rationale**:
- Balances context awareness with token limits
- Sufficient for typical sessions
- Chronological pruning (oldest dropped)

### Decision 5: Direct Database Access from Tools

**Selected**: MCP tools call TaskService directly (not HTTP)

**Rationale**:
- Tools run in-process with FastAPI
- Avoids HTTP overhead
- Single transaction boundary
- Reuses existing Phase II TaskService

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Phase Governance ✅

| Requirement | Status | Notes |
|-------------|--------|-------|
| Phase III scope | ✅ PASS | AI Chatbot features only |
| No Phase IV/V features | ✅ PASS | No Kubernetes/cloud features |
| Builds on Phase II | ✅ PASS | Extends existing web app |

### Technology Constraints ✅

| Requirement | Status | Notes |
|-------------|--------|-------|
| Python 3.13+ | ✅ PASS | Backend uses 3.13+ |
| FastAPI | ✅ PASS | Existing backend |
| SQLModel | ✅ PASS | ORM for new entities |
| Neon PostgreSQL | ✅ PASS | Extended with new tables |
| Next.js 15+ | ✅ PASS | Frontend uses 16.1.1 |
| TypeScript strict | ✅ PASS | Frontend strict mode |
| OpenAI Agents SDK | ✅ PASS | New dependency |
| MCP SDK | ✅ PASS | New dependency |
| OpenAI ChatKit | ✅ PASS | New frontend dependency |
| Better Auth JWT | ✅ PASS | Existing auth |

### Agent Behavior Rules ✅

| Rule | Status | Notes |
|------|--------|-------|
| No code without Task ID | ✅ PASS | Will reference tasks.md |
| No architecture changes | ✅ PASS | Plan defines all changes |
| No new features | ✅ PASS | Implements spec only |
| Stop if underspecified | ✅ PASS | Spec is complete |

### Quality Principles ✅

| Principle | Status | Notes |
|-----------|--------|-------|
| Clean architecture | ✅ PASS | Services, routes, models separated |
| Type hints | ✅ PASS | All Python functions typed |
| Error handling | ✅ PASS | Graceful degradation planned |
| Stateless design | ✅ PASS | Database-persisted conversations |

### Cloud-Native Readiness ✅

| Principle | Status | Notes |
|-----------|--------|-------|
| Health endpoints | ✅ PASS | Existing /health |
| Structured logging | ✅ PASS | Will add chat logging |
| Container-ready | ✅ PASS | Extends existing container |

### Overall Gate Status: ✅ PASSED

All constitution requirements satisfied. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/003-ai-chatbot/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0: Technical research (COMPLETE)
├── data-model.md        # Phase 1: Data entities (COMPLETE)
├── quickstart.md        # Phase 1: Setup guide (COMPLETE)
├── contracts/           # Phase 1: API specifications (COMPLETE)
│   └── chat-api.yaml    # OpenAPI 3.0 spec
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2: Implementation tasks (TODO)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app (add chat routes)
│   ├── models.py               # SQLModel entities (add Conversation, Message)
│   ├── auth.py                 # JWT middleware (existing)
│   ├── database.py             # Database connection (existing)
│   ├── mcp_server/
│   │   ├── __init__.py
│   │   ├── server.py           # MCP FastMCP server setup (NEW)
│   │   └── tools.py            # MCP tools (NEW)
│   ├── services/
│   │   ├── task_service.py     # Task CRUD (existing)
│   │   ├── conversation_service.py  # Conversation CRUD (NEW)
│   │   └── agent_service.py    # OpenAI Agents orchestration (NEW)
│   └── routes/
│       ├── tasks.py            # Task routes (existing)
│       └── chat.py             # Chat API endpoints (NEW)
├── tests/
│   ├── test_tasks.py           # Existing tests
│   ├── test_chat.py            # Chat API tests (NEW)
│   └── test_ai_accuracy.py     # AI accuracy test suite (NEW)
└── pyproject.toml              # Add openai-agents-sdk, mcp

frontend/
├── app/
│   ├── (protected)/
│   │   ├── layout.tsx          # Add chat navigation link
│   │   ├── dashboard/page.tsx  # Existing dashboard
│   │   └── chat/
│   │       └── page.tsx        # Chat page (NEW)
│   └── api/
│       └── chat.ts             # Chat API client (NEW)
├── components/
│   ├── task-list.tsx           # Existing components
│   ├── chat.tsx                # Chat interface (NEW)
│   ├── chat-input.tsx          # Input component (NEW)
│   └── conversation-list.tsx   # Conversation sidebar (NEW)
├── lib/
│   └── api/
│       └── chat.ts             # Chat API wrapper (NEW)
└── package.json                # Add @openai/chatkit
```

**Structure Decision**: Web application (Option 2) - extends existing Phase II full-stack architecture. Backend uses FastAPI with service layer pattern. Frontend uses Next.js 16+ App Router with TypeScript strict mode.

## Data Model Extensions

### New Entities

**Conversation** (table: `conversation`):
- `id`: int (PK)
- `user_id`: str (FK → user.id)
- `created_at`: datetime
- `updated_at`: datetime

**Message** (table: `message`):
- `id`: int (PK)
- `conversation_id`: int (FK → conversation.id)
- `role`: str ("user" | "assistant")
- `content`: str
- `tool_calls`: str (JSON, nullable)
- `created_at`: datetime

### Existing Entities (Reused)

**Task**: Referenced by MCP tools, no changes needed
**User**: Managed by Better Auth, referenced for foreign keys

See [data-model.md](./data-model.md) for complete schema.

## API Endpoints

All endpoints protected by JWT authentication (`user_id` extracted from token).

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send message, get AI response |
| GET | `/api/chat/conversations` | List user's conversations |
| GET | `/api/chat/conversations/{id}` | Get conversation details |
| GET | `/api/chat/conversations/{id}/messages` | Get conversation history |
| DELETE | `/api/chat/conversations/{id}` | Delete conversation |

See [contracts/chat-api.yaml](./contracts/chat-api.yaml) for OpenAPI specification.

## Request/Response Flow

```
1. Client → Server: POST /api/chat
   {
     "message": "Add a task to buy groceries",
     "conversation_id": null  // or existing ID
   }

2. Server: Extract user_id from JWT
   → Load or create conversation
   → Load last 50 messages

3. Server → Agent: Run with context
   [
     {role: "user", content: "Add a task to buy groceries"}
   ]

4. Agent: Interpret intent, invoke tool
   → add_task(user_id, title="Buy groceries")

5. Tool → Database: Create task
   ← Returns task object

6. Agent: Format response
   "I've created a task called 'Buy groceries'."

7. Server: Store messages in database
   → User message
   → Assistant message + tool_calls

8. Server ← Client: Return response
   {
     "conversation_id": 1,
     "message_id": 42,
     "response": "I've created a task called 'Buy groceries'.",
     "tool_calls": [
       {
         "tool": "add_task",
         "parameters": {...},
         "result": {...}
       }
     ]
   }
```

## MCP Tools

All tools are stateless and perform database operations through TaskService.

| Tool | Parameters | Returns |
|------|------------|---------|
| `add_task` | user_id, title, description? | {task_id, status, title} |
| `list_tasks` | user_id, status? | [{id, title, completed}, ...] |
| `complete_task` | user_id, task_id | {task_id, status, title} |
| `delete_task` | user_id, task_id | {task_id, status, title} |
| `update_task` | user_id, task_id, title?, description? | {task_id, status, title} |

## Implementation Phases

### Phase 1: Backend Foundation (Tasks T065-T076)

1. Add dependencies (`openai-agents-sdk`, `mcp`)
2. Create database models (Conversation, Message)
3. Run migration
4. Implement MCP server with tools
5. Create ConversationService
6. Implement AgentService

### Phase 2: Chat API (Tasks T077-T083)

1. Create chat routes (`/api/chat/*`)
2. Implement POST /api/chat (stateless processing)
3. Implement conversation listing
4. Implement message retrieval
5. Implement conversation deletion
6. Register routes in main.py

### Phase 3: Frontend UI (Tasks T084-T089)

1. Install ChatKit
2. Create chat components
3. Create chat page
4. Add navigation
5. Implement API client

### Phase 4: Testing (Tasks T090, T090-B)

1. API integration tests
2. AI accuracy test suite (100 natural language commands)

## Error Handling Strategy

| Error Type | Response to User | Retry |
|------------|------------------|-------|
| OpenAI API error | "AI service unavailable. Please try again." | Yes |
| Tool execution error | "Couldn't complete that action: {details}" | No |
| Ambiguous command | "Did you mean X or Y?" | No |
| Task not found | "I couldn't find that task. Here are your tasks..." | No |
| Database error | "Something went wrong. Please try again." | Yes |

## Dependencies to Add

**backend/pyproject.toml**:
```toml
dependencies = [
    "openai-agents-sdk>=0.1.0",
    "mcp>=0.1.0",
    # ... existing
]
```

**frontend/package.json**:
```json
{
  "dependencies": {
    "@openai/chatkit": "latest"
  }
}
```

## Environment Variables

```bash
# Backend .env additions
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

## Next Steps

1. ✅ Research complete ([research.md](./research.md))
2. ✅ Data model defined ([data-model.md](./data-model.md))
3. ✅ API contracts specified ([contracts/chat-api.yaml](./contracts/chat-api.yaml))
4. ✅ Setup guide written ([quickstart.md](./quickstart.md))
5. ⏭️ Run `/sp.tasks` to generate implementation tasks

## Complexity Tracking

> No violations - all constitution requirements satisfied

| Status | Notes |
|--------|-------|
| ✅ No violations | All decisions follow constitution principles |
| ✅ Minimal complexity | Extends existing patterns, no new architectural concepts |
