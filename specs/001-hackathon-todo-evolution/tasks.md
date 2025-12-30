# Tasks: Hackathon Todo Evolution

**Input**: Design documents from `/specs/001-hackathon-todo-evolution/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/
**Target**: 1000 pts (5 phases) + 700 pts (bonus) = 1700 potential points

**Organization**: Tasks are grouped by user story (hackathon phase) to enable independent implementation and testing. Each phase builds on the previous but is independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story/phase (US1=Phase I, US2=Phase II, etc.)
- Include exact file paths in descriptions

## Path Conventions

- **Phase I**: `src/` at repository root (console app)
- **Phase II-V**: `backend/`, `frontend/` (monorepo)
- **Infrastructure**: `helm/`, `docker/`, `dapr-components/`

---

## Phase 1: Setup (Shared Infrastructure) - COMPLETE

**Purpose**: Project initialization and tooling setup

- [x] T001 Initialize Python project with UV at repository root (pyproject.toml)
- [x] T002 [P] Create .gitignore for Python, Node.js, and IDE files
- [x] T003 [P] Create .env.example with required environment variables template
- [x] T004 [P] Setup pytest configuration in pyproject.toml

**Checkpoint**: Project skeleton ready for Phase I implementation

---

## Phase 2: User Story 1 - Console Todo Management (Priority: P1) - 100 pts - COMPLETE

**Goal**: In-memory Python console app with Rich UI for basic CRUD operations

**Independent Test**: Run `uv run python -m src.cli.main` and perform add/list/update/delete/complete operations

### Implementation for User Story 1

- [x] T005 [US1] Create Priority enum in src/models/task.py
- [x] T006 [US1] Create Task dataclass with id, title, description, completed, priority, due_date, created_at in src/models/task.py
- [x] T007 [US1] Create __init__.py exports in src/models/__init__.py
- [x] T008 [US1] Implement TaskStore class with in-memory dict storage in src/services/task_store.py
- [x] T009 [US1] Implement TaskStore.add() method with auto-increment ID in src/services/task_store.py
- [x] T010 [US1] Implement TaskStore.get() method in src/services/task_store.py
- [x] T011 [US1] Implement TaskStore.list_all() method in src/services/task_store.py
- [x] T012 [US1] Implement TaskStore.update() method in src/services/task_store.py
- [x] T013 [US1] Implement TaskStore.delete() method in src/services/task_store.py
- [x] T014 [US1] Implement TaskStore.complete() and uncomplete() methods in src/services/task_store.py
- [x] T015 [US1] Create __init__.py exports in src/services/__init__.py
- [x] T016 [US1] Create Rich console menu display function in src/cli/main.py
- [x] T017 [US1] Implement add_task command handler with Rich prompts in src/cli/main.py
- [x] T018 [US1] Implement list_tasks command with Rich table output in src/cli/main.py
- [x] T019 [US1] Implement update_task command handler in src/cli/main.py
- [x] T020 [US1] Implement delete_task command with confirmation in src/cli/main.py
- [x] T021 [US1] Implement complete_task command with toggle support in src/cli/main.py
- [x] T022 [US1] Implement main menu loop with exit handling in src/cli/main.py
- [x] T023 [US1] Add error handling for invalid inputs in src/cli/main.py
- [x] T024 [P] [US1] Write unit tests for TaskStore in tests/unit/test_task_store.py
- [x] T025 [P] [US1] Write integration tests for CLI commands in tests/integration/test_cli.py
- [x] T026 [US1] Create src/__init__.py with package metadata

**Checkpoint**: Phase I complete (100 pts). Console app fully functional with all CRUD operations.

---

## Phase 3: User Story 2 - Web-Based Multi-User Application (Priority: P2) - 150 pts

**Goal**: FastAPI backend + Next.js frontend with Better Auth JWT + Neon PostgreSQL

**Independent Test**: Sign up, log in, create tasks, log out, log in again - tasks persist and are user-isolated

### Backend Setup

- [ ] T027 [US2] Create backend/ directory and initialize with UV (backend/pyproject.toml)
- [ ] T028 [US2] Add FastAPI, SQLModel, Pydantic, python-jose, httpx dependencies in backend/pyproject.toml
- [ ] T029 [P] [US2] Create backend/.env.example with DATABASE_URL, BETTER_AUTH_SECRET
- [ ] T030 [US2] Create database connection module with Neon async engine in backend/app/database.py
- [ ] T031 [US2] Create SQLModel User entity (reference only, Better Auth manages) in backend/app/models.py
- [ ] T032 [US2] Create SQLModel Task entity with user_id foreign key in backend/app/models.py
- [ ] T033 [US2] Create TaskCreate, TaskUpdate, TaskRead Pydantic schemas in backend/app/models.py
- [ ] T034 [US2] Implement JWT verification middleware (verify Better Auth tokens) in backend/app/auth.py
- [ ] T035 [US2] Implement get_current_user dependency in backend/app/auth.py
- [ ] T036 [US2] Implement TaskService with CRUD operations in backend/app/services/task_service.py
- [ ] T037 [US2] Implement user isolation in TaskService (filter by user_id) in backend/app/services/task_service.py
- [ ] T038 [US2] Create health check endpoint GET /health in backend/app/main.py
- [ ] T039 [US2] Create tasks router with GET /api/tasks endpoint in backend/app/routes/tasks.py
- [ ] T040 [US2] Implement GET /api/tasks/{task_id} endpoint in backend/app/routes/tasks.py
- [ ] T041 [US2] Implement POST /api/tasks endpoint in backend/app/routes/tasks.py
- [ ] T042 [US2] Implement PATCH /api/tasks/{task_id} endpoint in backend/app/routes/tasks.py
- [ ] T043 [US2] Implement DELETE /api/tasks/{task_id} endpoint in backend/app/routes/tasks.py
- [ ] T044 [US2] Implement POST /api/tasks/{task_id}/complete endpoint in backend/app/routes/tasks.py
- [ ] T045 [US2] Implement POST /api/tasks/{task_id}/uncomplete endpoint in backend/app/routes/tasks.py
- [ ] T046 [US2] Configure CORS middleware for localhost:3000 in backend/app/main.py
- [ ] T047 [US2] Register routes and configure FastAPI app in backend/app/main.py
- [ ] T048 [P] [US2] Write backend API tests in backend/tests/test_tasks.py

### Frontend Setup

- [ ] T049 [US2] Create frontend/ with Next.js 15 App Router (npx create-next-app@latest)
- [ ] T050 [US2] Install Better Auth and @better-auth/jwt dependencies in frontend/package.json
- [ ] T051 [P] [US2] Create frontend/.env.local.example with BETTER_AUTH_SECRET, API_URL
- [ ] T052 [US2] Configure Better Auth with JWT plugin in frontend/lib/auth.ts
- [ ] T053 [US2] Create auth API route handler in frontend/app/api/auth/[...all]/route.ts
- [ ] T054 [US2] Create API client with JWT token injection in frontend/lib/api.ts
- [ ] T055 [US2] Create sign-in page in frontend/app/(auth)/sign-in/page.tsx
- [ ] T056 [US2] Create sign-up page in frontend/app/(auth)/sign-up/page.tsx
- [ ] T057 [US2] Create protected layout with auth check in frontend/app/(protected)/layout.tsx
- [ ] T058 [US2] Create TaskList component in frontend/components/task-list.tsx
- [ ] T059 [US2] Create TaskForm component in frontend/components/task-form.tsx
- [ ] T060 [US2] Create TaskItem component with complete/delete actions in frontend/components/task-item.tsx
- [ ] T061 [US2] Create dashboard page with task list in frontend/app/(protected)/dashboard/page.tsx
- [ ] T062 [US2] Create landing page with auth links in frontend/app/page.tsx
- [ ] T063 [US2] Apply Tailwind CSS styling across components
- [ ] T064 [US2] Create root layout with global styles in frontend/app/layout.tsx

**Checkpoint**: Phase II complete (150 pts). Full-stack web app with auth and persistence working.

---

## Phase 4: User Story 3 - Natural Language Todo Chatbot (Priority: P3) - 200 pts

**Goal**: AI chatbot using OpenAI Agents SDK with MCP tools for task operations

**Independent Test**: Chat "Add a task to buy groceries" -> AI creates task. "What's on my list?" -> AI shows tasks.

### MCP Server Implementation

- [ ] T065 [US3] Add openai-agents-sdk, mcp dependencies in backend/pyproject.toml
- [ ] T066 [US3] Create MCP server base structure in backend/app/mcp_server/server.py
- [ ] T067 [US3] Implement add_task MCP tool in backend/app/mcp_server/tools.py
- [ ] T068 [US3] Implement list_tasks MCP tool in backend/app/mcp_server/tools.py
- [ ] T069 [US3] Implement complete_task MCP tool in backend/app/mcp_server/tools.py
- [ ] T070 [US3] Implement delete_task MCP tool in backend/app/mcp_server/tools.py
- [ ] T071 [US3] Implement update_task MCP tool in backend/app/mcp_server/tools.py
- [ ] T072 [US3] Register all tools with MCP server in backend/app/mcp_server/server.py

### Conversation Persistence

- [ ] T073 [US3] Create SQLModel Conversation entity in backend/app/models.py
- [ ] T074 [US3] Create SQLModel Message entity with role enum in backend/app/models.py
- [ ] T075 [US3] Create ConversationService for CRUD operations in backend/app/services/conversation_service.py
- [ ] T076 [US3] Implement conversation history retrieval in backend/app/services/conversation_service.py

### Chat API Endpoints

- [ ] T077 [US3] Create Agent with MCP tools integration in backend/app/services/agent_service.py
- [ ] T078 [US3] Implement stateless chat processing in backend/app/services/agent_service.py
- [ ] T079 [US3] Create POST /api/chat endpoint in backend/app/routes/chat.py
- [ ] T080 [US3] Create GET /api/chat/conversations endpoint in backend/app/routes/chat.py
- [ ] T081 [US3] Create GET /api/chat/conversations/{id}/messages endpoint in backend/app/routes/chat.py
- [ ] T082 [US3] Create DELETE /api/chat/conversations/{id} endpoint in backend/app/routes/chat.py
- [ ] T083 [US3] Register chat routes in backend/app/main.py

### Chat Frontend

- [ ] T084 [US3] Install OpenAI ChatKit in frontend/package.json
- [ ] T085 [US3] Create Chat component with message display in frontend/components/chat.tsx
- [ ] T086 [US3] Create ChatInput component in frontend/components/chat-input.tsx
- [ ] T087 [US3] Create ConversationList component in frontend/components/conversation-list.tsx
- [ ] T088 [US3] Create chat page with ChatKit integration in frontend/app/(protected)/chat/page.tsx
- [ ] T089 [US3] Add chat navigation link to dashboard in frontend/app/(protected)/layout.tsx
- [ ] T090 [P] [US3] Write chat API integration tests in backend/tests/test_chat.py

**Checkpoint**: Phase III complete (200 pts). AI chatbot operational with natural language task management.

---

## Phase 5: User Story 4 - Local Kubernetes Deployment (Priority: P4) - 250 pts

**Goal**: Dockerize apps, create Helm charts, deploy to Minikube

**Independent Test**: `helm install` to Minikube, access todo.local, verify full functionality

### Docker Images

- [ ] T091 [US4] Create multi-stage backend Dockerfile in docker/backend.Dockerfile
- [ ] T092 [US4] Create multi-stage frontend Dockerfile in docker/frontend.Dockerfile
- [ ] T093 [US4] Create .dockerignore files for backend and frontend

### Helm Chart Structure

- [ ] T094 [US4] Create Helm chart scaffolding in helm/todo-app/Chart.yaml
- [ ] T095 [US4] Create \_helpers.tpl with template functions in helm/todo-app/templates/\_helpers.tpl
- [ ] T096 [US4] Create values.yaml with all configuration in helm/todo-app/values.yaml
- [ ] T097 [US4] Create backend Deployment template in helm/todo-app/templates/backend-deployment.yaml
- [ ] T098 [US4] Create backend Service template in helm/todo-app/templates/backend-service.yaml
- [ ] T099 [US4] Create frontend Deployment template in helm/todo-app/templates/frontend-deployment.yaml
- [ ] T100 [US4] Create frontend Service template in helm/todo-app/templates/frontend-service.yaml
- [ ] T101 [US4] Create ConfigMap template in helm/todo-app/templates/configmap.yaml
- [ ] T102 [US4] Create Secret template in helm/todo-app/templates/secret.yaml
- [ ] T103 [US4] Create Ingress template in helm/todo-app/templates/ingress.yaml

### Health Checks

- [ ] T104 [US4] Add readiness probe to backend Deployment in helm/todo-app/templates/backend-deployment.yaml
- [ ] T105 [US4] Add liveness probe to backend Deployment in helm/todo-app/templates/backend-deployment.yaml
- [ ] T106 [US4] Enhance /health endpoint with database check in backend/app/main.py

### Minikube Deployment

- [ ] T107 [US4] Create deployment script for Minikube in scripts/deploy-minikube.sh
- [ ] T108 [US4] Document Minikube setup in quickstart.md (update)
- [ ] T109 [US4] Create kubectl-ai integration examples in docs/kubectl-ai-examples.md
- [ ] T110 [P] [US4] Test Helm chart with helm template --debug

**Checkpoint**: Phase IV complete (250 pts). Application running on local Kubernetes.

---

## Phase 6: User Story 5 - Cloud Deployment with Event-Driven Architecture (Priority: P5) - 300 pts

**Goal**: Cloud K8s + Kafka/Redpanda + Dapr + Advanced features (recurring tasks, reminders, priorities, tags, search)

**Independent Test**: Deploy to cloud K8s, create recurring task, complete it, verify new instance auto-created

### Advanced Task Features

- [ ] T111 [US5] Add tags, recurrence_rule columns to Task model in backend/app/models.py
- [ ] T112 [US5] Add database migration for new columns (Alembic or manual)
- [ ] T113 [US5] Implement search/filter in TaskService in backend/app/services/task_service.py
- [ ] T114 [US5] Add query params (search, priority, tags, completed) to GET /api/tasks in backend/app/routes/tasks.py
- [ ] T115 [US5] Implement recurrence rule parsing (iCal RRULE) in backend/app/services/recurrence_service.py
- [ ] T116 [US5] Update frontend TaskForm with tags and recurrence inputs in frontend/components/task-form.tsx
- [ ] T117 [US5] Update MCP tools to support new task fields in backend/app/mcp_server/tools.py

### Kafka/Dapr Integration

- [ ] T118 [US5] Add kafka-python and dapr dependencies in backend/pyproject.toml
- [ ] T119 [US5] Create TaskEvent Pydantic model in backend/app/models.py
- [ ] T120 [US5] Create event publishing module (Dapr HTTP) in backend/app/events/publisher.py
- [ ] T121 [US5] Implement publish_task_event function in backend/app/events/publisher.py
- [ ] T122 [US5] Integrate event publishing into TaskService in backend/app/services/task_service.py
- [ ] T123 [US5] Create event subscriber endpoints in backend/app/events/subscriber.py
- [ ] T124 [US5] Implement recurring task handler in subscriber in backend/app/events/subscriber.py
- [ ] T125 [US5] Implement reminder scheduling via Dapr Jobs in backend/app/services/reminder_service.py
- [ ] T126 [US5] Register subscriber routes in backend/app/main.py

### Dapr Components

- [ ] T127 [US5] Create Kafka Pub/Sub component in dapr-components/kafka-pubsub.yaml
- [ ] T128 [US5] Create PostgreSQL State Store component in dapr-components/statestore.yaml
- [ ] T129 [US5] Create Kubernetes Secret Store component in dapr-components/secretstore.yaml
- [ ] T130 [US5] Update Helm values-cloud.yaml with Dapr annotations in helm/todo-app/values-cloud.yaml

### Cloud Deployment

- [ ] T131 [US5] Create cloud values file for DOKS/AKS in helm/todo-app/values-cloud.yaml
- [ ] T132 [US5] Create GitHub Actions workflow for CI/CD in .github/workflows/deploy.yaml
- [ ] T133 [US5] Configure Docker image push to container registry in .github/workflows/deploy.yaml
- [ ] T134 [US5] Configure Helm deployment to cloud K8s in .github/workflows/deploy.yaml
- [ ] T135 [US5] Add smoke tests to CI/CD pipeline in .github/workflows/deploy.yaml
- [ ] T136 [US5] Create deployment documentation in docs/cloud-deployment.md

**Checkpoint**: Phase V complete (300 pts). Full cloud-native deployment with event-driven architecture.

---

## Phase 7: Bonus Features (+700 pts)

### Subagents & Skills (+200 pts) - ALREADY EARNED

- [x] T137 [BONUS] Create .claude/skills/ with 9 technology skills
- [x] T138 [BONUS] Create .claude/agents/ with 5 phase-specific subagents
- [x] T139 [BONUS] Populate skills from Context7 MCP documentation

**Status**: Complete - 200 bonus points earned

### Cloud-Native Blueprints (+200 pts)

- [ ] T140 [BONUS] Create cloud-blueprints skill in .claude/skills/cloud-blueprints/SKILL.md
- [ ] T141 [BONUS] Document reusable Helm patterns in .claude/skills/cloud-blueprints/helm-patterns.md
- [ ] T142 [BONUS] Document reusable Dapr patterns in .claude/skills/cloud-blueprints/dapr-patterns.md
- [ ] T143 [BONUS] Document CI/CD pipeline patterns in .claude/skills/cloud-blueprints/cicd-patterns.md

### Multi-language Support - Urdu (+100 pts)

- [ ] T144 [BONUS] Add Urdu system prompt to agent configuration in backend/app/services/agent_service.py
- [ ] T145 [BONUS] Create Urdu language MCP tool responses in backend/app/mcp_server/tools.py
- [ ] T146 [BONUS] Test Urdu conversation flow

### Voice Commands (+200 pts)

- [ ] T147 [BONUS] Integrate Web Speech API in frontend chat component
- [ ] T148 [BONUS] Add voice input button to ChatInput in frontend/components/chat-input.tsx
- [ ] T149 [BONUS] Implement speech-to-text for task commands
- [ ] T150 [BONUS] Test voice command flow end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) → Phase 2 (US1: Console) → Phase 3 (US2: Web) → Phase 4 (US3: Chat) → Phase 5 (US4: K8s) → Phase 6 (US5: Cloud)
                                                                                                                      ↓
                                                                                                         Phase 7 (Bonus)
```

- **Setup (Phase 1)**: No dependencies - start immediately
- **US1/Phase I (Phase 2)**: Depends on Setup - foundation for all phases
- **US2/Phase II (Phase 3)**: Depends on US1 - refactors console patterns to web
- **US3/Phase III (Phase 4)**: Depends on US2 - adds AI on top of web app
- **US4/Phase IV (Phase 5)**: Depends on US3 - containerizes complete application
- **US5/Phase V (Phase 6)**: Depends on US4 - adds cloud infrastructure
- **Bonus (Phase 7)**: Can be done in parallel with phases, but Skills/Subagents already complete

### Within Each Phase

- Models before services
- Services before routes/endpoints
- Backend before frontend (for API contracts)
- Core implementation before tests
- Phase complete before moving to next

### Parallel Opportunities

- All [P] marked tasks can run in parallel within their phase
- Frontend and backend development can overlap once API contracts are defined
- Bonus tasks (T140-T150) can be done in parallel with Phase V-VI

---

## Parallel Example: Phase 3 (US2)

```bash
# Launch backend models in parallel:
Task T031: "Create SQLModel User entity in backend/app/models.py"
Task T032: "Create SQLModel Task entity in backend/app/models.py"
Task T033: "Create TaskCreate, TaskUpdate, TaskRead schemas in backend/app/models.py"

# Then services (depends on models):
Task T036: "Implement TaskService in backend/app/services/task_service.py"

# Then routes (depends on services):
Tasks T039-T047: All route implementations can be parallel after TaskService exists
```

---

## Implementation Strategy

### MVP First (User Story 1 = Phase I)

1. Complete Phase 1: Setup
2. Complete Phase 2: US1 (Console App)
3. **STOP and VALIDATE**: Test console app end-to-end
4. Demo/Submit for 100 pts

### Incremental Delivery by Hackathon Phase

1. US1 Complete → 100 pts
2. US1 + US2 Complete → 250 pts
3. US1 + US2 + US3 Complete → 450 pts
4. US1 + US2 + US3 + US4 Complete → 700 pts
5. All phases + Bonus Complete → 1700 pts

### Sprint Plan (Suggested)

| Day  | Tasks     | Target                       |
| ---- | --------- | ---------------------------- |
| 1    | T001-T026 | Phase I Complete (100 pts)   |
| 2-3  | T027-T064 | Phase II Complete (250 pts)  |
| 4-5  | T065-T090 | Phase III Complete (450 pts) |
| 6-7  | T091-T110 | Phase IV Complete (700 pts)  |
| 8-10 | T111-T136 | Phase V Complete (1000 pts)  |
| 11+  | T140-T150 | Bonus Features (+700 pts)    |

---

## Summary

| Phase     | User Story     | Tasks     | Points | Cumulative |
| --------- | -------------- | --------- | ------ | ---------- |
| Setup     | -              | T001-T004 | -      | -          |
| Phase I   | US1: Console   | T005-T026 | 100    | 100        |
| Phase II  | US2: Web App   | T027-T064 | 150    | 250        |
| Phase III | US3: Chatbot   | T065-T090 | 200    | 450        |
| Phase IV  | US4: Local K8s | T091-T110 | 250    | 700        |
| Phase V   | US5: Cloud     | T111-T136 | 300    | 1000       |
| Bonus     | Subagents      | T137-T139 | +200   | 1200       |
| Bonus     | Blueprints     | T140-T143 | +200   | 1400       |
| Bonus     | Urdu           | T144-T146 | +100   | 1500       |
| Bonus     | Voice          | T147-T150 | +200   | 1700       |

**Total Tasks**: 150
**Total Points**: 1700 (1000 base + 700 bonus)
**Parallel Opportunities**: ~40 tasks marked [P]
**MVP Scope**: T001-T026 (Phase I Console App = 100 pts)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific hackathon phase
- Each phase is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate phase independently
- Skills/Subagents bonus (+200) already earned via .claude/skills/ and .claude/agents/
