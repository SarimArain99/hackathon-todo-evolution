# Tasks: AI-Powered Todo Chatbot

**Input**: Design documents from `/specs/003-ai-chatbot/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/chat-api.yaml

**Tests**: Tests are included per Phase III hackathon requirements

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US6)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/app/` for source, `backend/tests/` for tests
- **Frontend**: `frontend/` for source
- Based on plan.md structure extending Phase II web application

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure environment for AI chatbot

- [X] T001 Add openai-agents-sdk and mcp dependencies to backend/pyproject.toml
- [X] T002 Add @openai/chatkit dependency to frontend/package.json
- [X] T003 Add OPENAI_API_KEY and OPENAI_MODEL environment variables to backend/.env.example

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data models and services that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create Conversation entity in backend/app/models.py with id, user_id, created_at, updated_at fields
- [X] T005 [P] Create Message entity in backend/app/models.py with id, conversation_id, role, content, tool_calls, created_at fields
- [X] T006 Create Alembic migration for conversation and message tables with indexes in backend/alembic/versions/
- [X] T007 Run database migration to create conversation and message tables
- [X] T008 Create ConversationService with get_or_create, list_by_user, get_messages methods in backend/app/services/conversation_service.py
- [X] T009 Create Pydantic schemas: CreateMessageRequest, ChatResponse, ToolCall, ConversationResponse in backend/app/models.py

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Natural Language Task Creation (Priority: P1) 🎯 MVP

**Goal**: Users can create tasks through natural language by typing phrases like "Add a task to buy groceries"

**Independent Test**: Send "Add a task to buy groceries" → AI responds → Task appears in database with correct title

### Tests for User Story 1

- [X] T010 [P] [US1] Contract test for POST /api/chat creating tasks via natural language in backend/tests/test_chat.py
- [X] T011 [P] [US1] Integration test for add_task MCP tool in backend/tests/test_chat.py

### Implementation for User Story 1

- [X] T012 [P] Create MCP server base with FastMCP in backend/app/mcp_server/server.py
- [X] T013 [P] [US1] Implement add_task MCP tool in backend/app/mcp_server/tools.py
- [X] T014 [US1] Create AgentService with OpenAI Agent and add_task tool in backend/app/services/agent_service.py
- [X] T015 [US1] Implement POST /api/chat endpoint with stateless processing in backend/app/routes/chat.py
- [X] T016 [US1] Register chat routes in backend/app/main.py

**Checkpoint**: At this point, users can create tasks via natural language chat

---

## Phase 4: User Story 2 - Task Discovery and Listing (Priority: P1)

**Goal**: Users can query and view their tasks through natural language

**Independent Test**: Send "What's on my list?" → AI responds with user's tasks

### Tests for User Story 2

- [X] T017 [P] [US2] Contract test for list_tasks MCP tool in backend/tests/test_chat.py

### Implementation for User Story 2

- [X] T018 [US2] Implement list_tasks MCP tool with status filter in backend/app/mcp_server/tools.py
- [X] T019 [US2] Add list_tasks tool to Agent in backend/app/services/agent_service.py

**Checkpoint**: At this point, users can create AND list tasks via chat

---

## Phase 5: User Story 3 - Task Completion (Priority: P1)

**Goal**: Users can mark tasks complete through natural language

**Independent Test**: Send "Mark task 1 as complete" → Task status changes to completed

### Tests for User Story 3

- [X] T020 [P] [US3] Contract test for complete_task MCP tool in backend/tests/test_chat.py

### Implementation for User Story 3

- [X] T021 [US3] Implement complete_task MCP tool in backend/app/mcp_server/tools.py
- [X] T022 [US3] Add complete_task tool to Agent in backend/app/services/agent_service.py

**Checkpoint**: At this point, users can create, list, and complete tasks via chat

---

## Phase 6: User Story 4 - Task Modification (Priority: P2)

**Goal**: Users can update task details through natural language

**Independent Test**: Send "Change task 1 to Call mom tonight" → Task title updates

### Tests for User Story 4

- [X] T023 [P] [US4] Contract test for update_task MCP tool in backend/tests/test_chat.py

### Implementation for User Story 4

- [X] T024 [US4] Implement update_task MCP tool in backend/app/mcp_server/tools.py
- [X] T025 [US4] Add update_task tool to Agent in backend/app/services/agent_service.py

**Checkpoint**: At this point, all CRUD operations work via chat

---

## Phase 7: User Story 5 - Task Deletion (Priority: P2)

**Goal**: Users can delete tasks through natural language

**Independent Test**: Send "Delete task 1" → Task is removed from database

### Tests for User Story 5

- [X] T026 [P] [US5] Contract test for delete_task MCP tool in backend/tests/test_chat.py

### Implementation for User Story 5

- [X] T027 [US5] Implement delete_task MCP tool in backend/app/mcp_server/tools.py
- [X] T028 [US5] Add delete_task tool to Agent in backend/app/services/agent_service.py

**Checkpoint**: At this point, all task CRUD operations are complete

---

## Phase 8: User Story 6 - Conversation Memory and Context (Priority: P2)

**Goal**: Users can have multi-turn conversations with context awareness

**Independent Test**: Send "Add task: Buy milk", then "also add eggs" → Two tasks created, AI remembers context

### Tests for User Story 6

- [X] T029 [P] [US6] Integration test for conversation context loading in backend/tests/test_chat.py
- [X] T030 [P] [US6] Integration test for conversation persistence across requests in backend/tests/test_chat.py

### Implementation for User Story 6

- [X] T031 [US6] Implement GET /api/chat/conversations endpoint in backend/app/routes/chat.py
- [X] T032 [US6] Implement GET /api/chat/conversations/{id}/messages endpoint in backend/app/routes/chat.py
- [X] T033 [US6] Implement DELETE /api/chat/conversations/{id} endpoint in backend/app/routes/chat.py
- [X] T034 [US6] Update AgentService to load conversation history (last 50 messages) in backend/app/services/agent_service.py
- [X] T035 [US6] Update AgentService to store user and assistant messages in database in backend/app/services/agent_service.py

**Checkpoint**: At this point, backend is complete with full conversation memory

---

## Phase 9: Frontend Chat UI (Priority: P1 - Required for usability)

**Goal**: Web interface for chat interactions

**Independent Test**: Open chat page, send message, see response

### Implementation for Frontend

- [X] T036 [P] Create Chat component with message display in frontend/components/chat.tsx
- [X] T037 [P] Create ChatInput component with send button in frontend/components/chat-input.tsx
- [X] T038 [P] Create ConversationList sidebar component in frontend/components/conversation-list.tsx
- [X] T039 Create chat page with ChatKit integration in frontend/app/(protected)/chat/page.tsx
- [X] T040 Create chat API client in frontend/lib/api/chat.ts
- [X] T041 Add chat navigation link to protected layout in frontend/app/(protected)/layout.tsx

**Checkpoint**: At this point, full-stack chatbot is functional

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, validation, and quality assurance

- [X] T042 [P] Add error handling for OpenAI API failures in backend/app/services/agent_service.py
- [X] T043 [P] Add error handling for MCP tool execution failures in backend/app/mcp_server/tools.py
- [X] T044 [P] Add graceful handling for ambiguous commands in backend/app/services/agent_service.py
- [X] T045 [P] Add user-friendly error messages in backend/app/routes/chat.py
- [X] T046 [P] Add request logging for chat operations in backend/app/routes/chat.py
- [X] T047 Add OpenAI instructions for confirmations and error handling in backend/app/services/agent_service.py
- [X] T048 Validate tool_calls JSON format in backend/app/models.py

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-8)**: All depend on Foundational phase completion
  - User Stories 1-5 (CRUD operations) can proceed in parallel after Foundational
  - User Story 6 (Conversation Memory) should follow US1-5 for integration
- **Frontend (Phase 9)**: Depends on Backend completion (Phases 1-8)
- **Polish (Phase 10)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - Creates base chat infrastructure
- **User Story 2 (P1)**: Can start after Foundational - Extends MCP tools
- **User Story 3 (P1)**: Can start after Foundational - Extends MCP tools
- **User Story 4 (P2)**: Can start after Foundational - Extends MCP tools
- **User Story 5 (P2)**: Can start after Foundational - Extends MCP tools
- **User Story 6 (P2)**: Should start after US1-5 for conversation context integration

### MCP Tool Implementation Order

The MCP tools should be implemented in this order:

1. add_task (US1) - Core functionality
2. list_tasks (US2) - Verify creation
3. complete_task (US3) - State change
4. update_task (US4) - Modification
5. delete_task (US5) - Removal

Each tool is independent and can be developed in parallel by different agents.

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD approach)
- MCP tools before AgentService integration
- AgentService before route implementation
- Routes before frontend integration

### Parallel Opportunities

- **Phase 1**: All tasks (T001-T003) can run in parallel
- **Phase 2**: T004-T005 (models) can run in parallel
- **Phase 3**: T010-T011 (tests), T012-T013 (MCP base) can run in parallel
- **Phases 4-8**: Test tasks can run in parallel with each other
- **Phase 9**: T036-T038 (components) can run in parallel
- **Phase 10**: T042-T046 (error handling per module) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
/sp.implement T010 "[US1] Contract test for POST /api/chat creating tasks via natural language"
/sp.implement T011 "[US1] Integration test for add_task MCP tool"

# Launch MCP base and tool together:
/sp.implement T012 "Create MCP server base with FastMCP"
/sp.implement T013 "[US1] Implement add_task MCP tool"
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Task Creation)
4. Complete Phase 4: User Story 2 (Task Listing)
5. Complete Phase 5: User Story 3 (Task Completion)
6. **STOP and VALIDATE**: Test core CRUD operations independently
7. Deploy/demo MVP

### Full Implementation

1. Complete MVP (User Stories 1-3)
2. Add User Story 4 (Task Modification)
3. Add User Story 5 (Task Deletion)
4. Add User Story 6 (Conversation Memory)
5. Add Frontend UI
6. Polish and validate

### Incremental Delivery

1. Setup + Foundational → Data models ready
2. Add US1 (Task Creation) → Can create tasks via chat
3. Add US2 (Task Listing) → Can see tasks via chat
4. Add US3 (Task Completion) → Can complete tasks via chat
5. Add US4-5 (Modify/Delete) → Full CRUD via chat
6. Add US6 (Memory) → Context-aware conversations
7. Add Frontend → Complete user experience

Each phase adds value without breaking previous functionality.

---

## Format Validation

All tasks follow the required format: `- [ ] [ID] [P?] [Story?] Description with file path`

**Total Tasks**: 48
**Tasks per User Story**:

- US1 (Task Creation): 7 tasks (T010-T016)
- US2 (Task Listing): 2 tasks (T017-T019)
- US3 (Task Completion): 2 tasks (T020-T022)
- US4 (Task Modification): 2 tasks (T023-T025)
- US5 (Task Deletion): 2 tasks (T026-T028)
- US6 (Conversation Memory): 7 tasks (T029-T035)

**Parallel Opportunities**: 21 tasks marked [P] can run in parallel within their phases

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Backend and Frontend are on separate dependency chains
- MCP tools are independent and can be developed in parallel
- Tests follow TDD approach: write test, verify fail, implement, verify pass
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
