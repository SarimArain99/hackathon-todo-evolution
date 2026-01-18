---
id: 002
title: implementation-plan
stage: plan
date: 2026-01-14
surface: agent
model: claude-opus-4-5-20251101
feature: 003-ai-chatbot
branch: 003-ai-chatbot
user: sarimarain99
command: /sp.plan
labels: ["plan","architecture","phase-3"]
links:
  spec: specs/003-ai-chatbot/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-ai-chatbot/plan.md (created)
  - specs/003-ai-chatbot/research.md (created)
  - specs/003-ai-chatbot/data-model.md (created)
  - specs/003-ai-chatbot/quickstart.md (created)
  - specs/003-ai-chatbot/contracts/chat-api.yaml (created)
tests:
  - N/A (planning phase)
---

## Prompt

go for phase 4 read the hackathon_docs files and specs/001-hackathon-todo-evolution/tasks.md and create specs to start the work!

## Response snapshot

## Implementation Plan Complete: AI-Powered Todo Chatbot

### Branch and Files
- Branch: 003-ai-chatbot
- Plan File: specs/003-ai-chatbot/plan.md

### Artifacts Created

#### Phase 0: Research
- **research.md**: Technical decisions for OpenAI Agents SDK, MCP FastMCP, stateless architecture
  - 10 key architecture decisions documented
  - Skills reviewed: openai-agents-sdk, mcp-sdk
  - Dependencies identified: openai-agents-sdk, mcp, @openai/chatkit

#### Phase 1: Design & Contracts
- **data-model.md**: Conversation and Message entities defined
  - Conversation: id, user_id, created_at, updated_at
  - Message: id, conversation_id, role, content, tool_calls, created_at
  - Reuses existing Task and User entities

- **contracts/chat-api.yaml**: OpenAPI 3.0 specification
  - POST /api/chat - Send message, get AI response
  - GET /api/chat/conversations - List conversations
  - GET /api/chat/conversations/{id} - Get conversation details
  - GET /api/chat/conversations/{id}/messages - Get messages
  - DELETE /api/chat/conversations/{id} - Delete conversation

- **quickstart.md**: Developer setup guide
  - Backend dependency installation
  - Database migration steps
  - Frontend ChatKit setup
  - Testing procedures

### Architecture Decisions

1. **OpenAI Agents SDK**: For AI orchestration with @function_tool pattern
2. **FastMCP**: For MCP tool server with @mcp.tool() decorator
3. **Stateless Server**: All conversation state in PostgreSQL
4. **Context Window**: Last 50 messages sent to AI, all stored in DB
5. **Direct DB Access**: Tools call TaskService directly (not HTTP)

### Constitution Check: ✅ PASSED

- Phase Governance: Phase III scope only, builds on Phase II
- Technology Constraints: All mandated technologies used
- Agent Behavior: No code without Task ID, implements spec only
- Quality Principles: Clean architecture, type hints, error handling
- Cloud-Native: Health endpoints, structured logging

### MCP Tools

| Tool | Parameters | Returns |
|------|------------|---------|
| add_task | user_id, title, description? | {task_id, status, title} |
| list_tasks | user_id, status? | [{id, title, completed}, ...] |
| complete_task | user_id, task_id | {task_id, status, title} |
| delete_task | user_id, task_id | {task_id, status, title} |
| update_task | user_id, task_id, title?, description? | {task_id, status, title} |

### Data Extensions

**New Tables**:
- conversation: id, user_id, created_at, updated_at
- message: id, conversation_id, role, content, tool_calls, created_at

**Reused**: task, user (Better Auth managed)

### Project Structure

Backend additions:
- backend/app/mcp_server/server.py (MCP FastMCP server)
- backend/app/mcp_server/tools.py (MCP tools)
- backend/app/services/conversation_service.py (Conversation CRUD)
- backend/app/services/agent_service.py (OpenAI Agents orchestration)
- backend/app/routes/chat.py (Chat API endpoints)

Frontend additions:
- frontend/app/(protected)/chat/page.tsx (Chat page)
- frontend/components/chat.tsx, chat-input.tsx, conversation-list.tsx
- frontend/lib/api/chat.ts (Chat API client)

### Next Steps

Run `/sp.tasks` to generate implementation tasks from this plan.

## Outcome

- Impact: Complete technical plan for Phase 4 (AI Chatbot - 200 pts) ready for task breakdown
- Tests: N/A (planning phase)
- Files: Created plan.md, research.md, data-model.md, quickstart.md, contracts/chat-api.yaml
- Next prompts: Run `/sp.tasks` to generate implementation tasks (T065-T090)
- Reflection: All architecture decisions justified with constitution compliance. Technical approach extends Phase II patterns without introducing unnecessary complexity.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results: PASSED - Constitution check passed, all gates satisfied
- Prompt variant: N/A
- Next experiment: None
