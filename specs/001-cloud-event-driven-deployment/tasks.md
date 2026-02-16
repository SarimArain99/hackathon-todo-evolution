# Implementation Tasks: Cloud Event-Driven Deployment (Phase V)

**Branch**: `001-cloud-event-driven-deployment`
**Date**: 2025-02-09
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)

---

## Task Execution Guide

### Dependency Graph

```
Phase 1: Setup (T101-T105)
    ↓
Phase 2: Foundation (T106-T111)
    ↓
┌───────────┬───────────┬───────────┬───────────┐
│           │           │           │           │
US1 (T112)  US2 (T122)  US3 (T132)  US4 (T142)  US5 (T152)
P1 Core     P2 Recur    P2 Remind   P3 Cloud   P3 Events
└─────┬─────┴─────┬─────┴─────┬─────┴─────┬─────┴─────┬─────
      │           │           │           │           │
      └───────────┴───────────┴─────┬─────┴───────────┘
                                  ↓
                    Phase 8: Polish (T162-T167)
```

### Parallel Execution Examples

```bash
# US1 tasks can run in parallel after foundation:
- [T112, T113, T114]  # Backend API extensions
- [T115, T116, T117]  # Frontend components

# US2 tasks after US1:
- [T122, T123]        # RRULE validation + backend
- [T124]              # Frontend (after T123)

# US4 and US5 can run in parallel after US2:
- [T142-T147]         # Cloud deployment (US4)
- [T152-T158]         # Event-driven (US5)
```

### Task Legend

- `[T###]` = Task ID
- `[P#]` = Priority (P1=Highest, P3=Lowest)
- `[US#]` = User Story reference
- `[AB#]` = After-Build task (runs after /sp.implement completes)

---

## Phase 1: Setup & Dependencies

### Environment Preparation

- [ ] [T101] [P1] [] Install Dapr Python SDK and add to backend/requirements.txt (backend/requirements.txt)
  - `dapr==1.14.0` and `dapr-dev==1.14.0` packages (pinned version)
  - Verify uv sync completes without errors

- [ ] [T102] [P1] [] Create dapr-components directory structure (dapr-components/)
  - kafka-pubsub.yaml (Pub/Sub component)
  - statestore.yaml (PostgreSQL state store)
  - secretstore.yaml (Kubernetes secrets)
  - README.md (component documentation)

- [ ] [T103] [P1] [] Add python-dateutil to backend/requirements.txt for RRULE parsing (backend/requirements.txt)
  - `python-dateutil>=2.8.2` for iCal RRULE support

- [ ] [T104] [P1] [] Create local Dapr configuration for development (dapr-components/config.yaml)
  - Local development overrides (in-memory pubsub for testing)
  - Enable API logging for debugging

- [ ] [T105] [P1] [] Update backend/requirements.txt with test dependencies (backend/requirements.txt)
  - `pytest-asyncio` for async test support
  - `pytest-mock` for subscriber testing

---

## Phase 2: Foundation - Data Model & Services

### Database Schema

- [ ] [T106] [P1] [] Add reminder_at column to Task table migration (backend/alembic/versions/)
  - Alembic migration: `add_reminder_at_column`
  - Index on reminder_at for efficient querying
  - Verify migration applies cleanly

- [ ] [T107] [P1] [] Update Task model with reminder_at field (backend/app/models.py)
  - `reminder_at: Optional[datetime] = None`
  - Update TaskCreate, TaskUpdate, TaskRead schemas
  - Add validation: reminder_at must be before due_date

- [ ] [T107a] [P1] [] Implement optimistic locking for concurrent task updates (backend/app/routes/tasks.py, backend/app/models.py)
  - Add `updated_at` to TaskUpdate schema for optimistic locking
  - Check `updated_at` matches before applying updates (409 Conflict if mismatch)
  - Return 409 status with current task state on concurrent modification
  - Add test for concurrent update scenario

- [ ] [T108] [P1] [] Create event schemas in backend/app/models.py (backend/app/models.py)
  - TaskEvent schema (CloudEvents 1.0 format)
  - ReminderEvent schema
  - Event envelope for Dapr publishing

### Base Services

- [ ] [T109] [P1] [] Create event publisher service (backend/app/services/event_publisher.py)
  - EventPublisher class with publish_task_event method
  - CloudEvents 1.0 envelope construction
  - Dapr client integration with error handling
  - Degraded mode (in-memory cache) when Dapr unavailable

- [ ] [T110] [P1] [] Create Dapr subscriber router (backend/app/subscribers.py)
  - GET /dapr/subscribe endpoint (subscription discovery)
  - POST /events/tasks (task event handler)
  - POST /events/reminders (reminder event handler)
  - Register subscriber router in main.py

### NFR Validation Tasks (G1 Remediation)

- [ ] [T111] [P1] [] Create event publishing latency test (backend/tests/test_events_nfr.py)
  - Measure p95 latency for event publishing (target: <100ms)
  - Test with concurrent operations (100 simultaneous events)
  - Verify degraded mode behavior when Dapr unavailable
  - Benchmark throughput (target: 1000+ events/minute)

---

## Phase 3: User Story 1 - Advanced Task Organization (P1)

> As a user, I want to organize my tasks with tags, priorities, and search/filter capabilities so I can efficiently manage large numbers of tasks.

### Backend Extensions

- [ ] [T112] [P1] [US1] Add tags array field to Task model and schemas (backend/app/models.py)
  - JSON array storage for tags
  - Tag validation: max 10 tags, max 50 chars each
  - Update TaskCreate/Update/Read schemas

- [ ] [T113] [P1] [US1] Add priority enum to Task model (backend/app/models.py)
  - Priority enum: LOW, MEDIUM, HIGH
  - Default priority: MEDIUM
  - Update all schemas with priority field

- [ ] [T114] [P1] [US1] Implement search, filter, sort in tasks endpoint (backend/app/routes/tasks.py)
  - Search by title (ILIKE query)
  - Filter by status, priority, tags (comma-separated)
  - Sort by due_date, priority, created_at, title
  - Query parameters: search, priority, status, tags, sort_by, sort_order

### Frontend Components

- [ ] [T115] [P1] [US1] Create task-filter-controls component (frontend/components/task-filter-controls.tsx)
  - Priority dropdown (high, medium, low, all)
  - Status toggle (pending, completed, all)
  - Tag filter (multi-select from existing tags)
  - Search input with debounced API call

- [ ] [T116] [P1] [US1] Create task-sort-controls component (frontend/components/task-sort-controls.tsx)
  - Sort by dropdown (due date, priority, created, title)
  - Sort order toggle (ascending, descending)
  - Sync with URL params for shareable filters

- [ ] [T117] [P1] [US1] Update task-list to render with filters and tags (frontend/components/task-list.tsx)
  - Display tags as colored badges
  - Priority indicators (high=red, medium=yellow, low=green)
  - Apply client-side filtering from URL params
  - Empty state for no matching results

### Testing

- [ ] [T118] [P1] [US1] Test advanced task organization (backend/tests/test_tasks.py)
  - Test tag creation and filtering
  - Test priority filtering
  - Test search by keyword
  - Test sort combinations
  - Test 20+ tasks with mixed tags/priorities

---

## Phase 4: User Story 2 - Recurring Task Automation (P2)

> As a user, I want to create recurring tasks (daily, weekly, monthly) so that when I complete one instance, the next occurrence is automatically created.

### Backend Implementation

- [ ] [T122] [P2] [US2] Create RRULE validation utility (backend/app/services/recurrence_service.py)
  - validate_recurrence(rrule_str, due_date) function
  - Uses dateutil.rrule for parsing
  - Returns next occurrence date
  - Validates RRULE generates future dates

- [ ] [T123] [P2] [US2] Implement next instance creation in subscriber (backend/app/subscribers.py)
  - Handle task completion events
  - Calculate next occurrence via RRULE
  - Create new task with parent_task_id reference
  - Copy title, description, tags, priority from parent
  - Set recurrence_rule=NULL on instances

- [ ] [T124] [P2] [US2] Add recurrence_rule to TaskCreate schema (backend/app/models.py)
  - Optional string field for RRULE format
  - Validation via recurrence_service
  - Documentation with common examples (daily, weekly, monthly)

### Frontend Implementation

- [ ] [T125] [P2] [US2] Add recurrence UI to task-form (frontend/components/task-form.tsx)
  - Recurrence dropdown (none, daily, weekly, monthly, custom)
  - Custom RRULE input with validation helper
  - Show "This task will repeat every X" preview text
  - Display recurrence badge on recurring tasks

- [ ] [T126] [P2] [US2] Update task-item to show recurrence indicator (frontend/components/task-item.tsx)
  - Repeat icon for recurring tasks
  - Show parent task reference on instances
  - Link back to parent recurring task

### Testing

- [ ] [T127] [P2] [US2] Test recurring task creation (backend/tests/test_recurrence.py)
  - Test daily recurrence creates next day
  - Test weekly recurrence (e.g., Friday → next Friday)
  - Test monthly recurrence (e.g., 15th → next month 15th)
  - Test edge case (Feb 30 → next valid date)
  - Test instance inherits parent attributes

---

## Phase 5: User Story 3 - Smart Reminders (P2)

> As a user, I want to receive reminders for tasks with due dates so I don't miss important deadlines.

### Backend Implementation

- [X] [T132] [P2] [US3] Add reminder scheduling to task service (backend/app/services/task_service.py)
  - Schedule reminder when task created with reminder_at
  - Use Dapr Jobs API to schedule callback
  - Store job ID for cancellation if task completed/deleted

- [X] [T133] [P2] [US3] Create job trigger callback endpoint (backend/app/routes/jobs.py)
  - POST /api/jobs/trigger endpoint
  - Handle Dapr job callbacks
  - Create notification for reminder
  - Skip if task already completed

- [X] [T134] [P2] [US3] Create notification for reminder (backend/app/services/notification_service.py)
  - Create notification with type="due_date_reminder"
  - Include task title, due date, time until due
  - Link to task details

### Frontend Implementation

- [X] [T135] [P2] [US3] Add reminder picker to task-form (frontend/components/task-form.tsx)
  - Date-time picker for reminder_at
  - Quick options: "1 hour before", "1 day before", "1 week before"
  - Validation: reminder must be before due date

- [X] [T136] [P2] [US3] Update notification-bell to show reminder notifications (frontend/components/notification-bell.tsx)
  - Real-time unread count
  - Priority styling for urgent reminders
  - Mark as read functionality

### Testing

- [X] [T137] [P2] [US3] Test reminder functionality (backend/tests/test_notifications.py)
  - Test reminder scheduled for future task
  - Test notification created at reminder time
  - Test reminder not sent for completed task
  - Test multiple reminders handled correctly

---

## Phase 6: User Story 4 - Cloud Deployment (P3)

> As a developer, I want to deploy the application to cloud Kubernetes so that users can access the production application from anywhere.

### Container Images

- [X] [T142] [P3] [US4] Update backend Dockerfile for Dapr (backend/Dockerfile)
  - Install Dapr CLI for local testing
  - Expose Dapr sidecar port (3500)
  - Health check for Dapr readiness

- [X] [T143] [P3] [US4] Build and push backend image to GHCR (shell)
  - docker build for backend
  - Tag with version (0.2.0)
  - Push to ghcr.io/[user]/hackathon_2/backend
  - Note: Uses GitHub Actions workflow (.github/workflows/build-backend.yml)

- [X] [T144] [P3] [US4] Build and push frontend image to GHCR (shell)
  - docker build for frontend
  - Tag with version (0.2.0)
  - Push to ghcr.io/[user]/hackathon_2/frontend
  - Note: Uses GitHub Actions workflow (.github/workflows/build-frontend.yml)

### Helm Charts

- [X] [T145] [P3] [US4] Create values-cloud.yaml for Oracle OKE (helm/todo-app/values-cloud.yaml)
  - Cloud-specific resource limits (fit in 4 OCPU, 24GB)
  - GHCR image references
  - Public ingress configuration
  - Cloud replicas (2 each for HA)

- [X] [T146] [P3] [US4] Add Dapr annotations to backend deployment (helm/todo-app/templates/backend-deployment.yaml)
  - dapr.io/enabled: "true"
  - dapr.io/app-id: "todo-backend"
  - dapr.io/app-port: "8000"
  - dapr.io/enable-api-logging: "true"
  - Fixed typo: allowPrivilegeEscalation → allowPrivilegeEscalation

- [X] [T147] [P3] [US4] Add Dapr annotations to frontend deployment (helm/todo-app/templates/frontend-deployment.yaml)
  - dapr.io/enabled: "true"
  - dapr.io/app-id: "todo-frontend"
  - dapr.io/app-port: "3000"
  - dapr.io/app-protocol: "http"

### Oracle OKE Setup

- [X] [T148] [P3] [US4] Create Oracle OKE cluster setup script (scripts/setup-oke.sh)
  - OCI CLI commands for OKE creation
  - Kubeconfig generation
  - Namespace creation (todo-app)
  - VCN and subnet configuration
  - Dapr initialization

- [X] [T149] [P3] [US4] Install Redpanda via Helm (scripts/install-redpanda.sh)
  - Add Redpanda Helm repo
  - Install single replica for Always Free tier
  - Configure resources (1 CPU, 2GB RAM, 10GB storage)
  - Create Kafka topics (task-events, reminders, notifications)

### CI/CD Pipeline

- [X] [T150] [P3] [US4] Create GitHub Actions deploy workflow (.github/workflows/deploy-cloud.yml)
  - Trigger on push to main branch
  - Build and push images to GHCR
  - Run smoke tests
  - Deploy via Helm to Oracle OKE
  - Zero-downtime rolling update

- [x] [T151] [P3] [US4] Create smoke tests for CI/CD (backend/tests/test_smoke.py)
  - Health endpoint test
  - Database connectivity test
  - Chat endpoint smoke test
  - Task CRUD smoke test

---

## Phase 7: User Story 5 - Event-Driven Architecture (P3)

> As a system architect, I want event-driven communication between services so that the system scales reliably and components remain decoupled.

### Event Publishing

- [ ] [T152] [P3] [US5] Integrate event publishing in task routes (backend/app/routes/tasks.py)
  - Publish "created" event after task creation
  - Publish "updated" event after task update
  - Publish "completed" event after task completion
  - Publish "deleted" event after task deletion
  - Fire-and-forget pattern with error logging

- [ ] [T153] [P3] [US5] Add CloudEvents metadata to published events (backend/app/services/event_publisher.py)
  - specversion: "1.0"
  - type: "todo.task.{created|updated|completed|deleted}"
  - source: "/todo-backend"
  - id: unique event ID (UUID)
  - time: ISO timestamp

### Event Subscribers

- [ ] [T154] [P3] [US5] Create task event subscriber handlers (backend/app/subscribers.py)
  - Handle "completed" event → trigger next instance creation
  - Handle "created" event → schedule reminder if applicable
  - Handle "deleted" event → cancel scheduled jobs
  - Return SUCCESS status to Dapr

- [ ] [T155] [P3] [US5] Create reminder event subscriber (backend/app/subscribers.py)
  - Handle reminder events from Dapr Jobs
  - Create in-app notifications
  - Skip if task already completed

### Dapr Configuration

- [ ] [T156] [P3] [US5] Create kafka-pubsub component (dapr-components/kafka-pubsub.yaml)
  - type: pubsub.kafka
  - brokers: redpanda.todo-app.svc.cluster.local:9092
  - consumerGroup: "todo-service"
  - authRequired: false

- [ ] [T157] [P3] [US5] Create PostgreSQL state store component (dapr-components/statestore.yaml)
  - type: state.postgresql
  - connectionString from Kubernetes secret
  - For conversation state caching

- [ ] [T158] [P3] [US5] Create Kubernetes secret store component (dapr-components/secretstore.yaml)
  - type: secretstores.kubernetes
  - For DATABASE_URL, BETTER_AUTH_SECRET, OPENAI_API_KEY

### Testing & Validation

- [ ] [T159] [P3] [US5] Test event publishing (backend/tests/test_events.py)
  - Mock Dapr client
  - Verify CloudEvents format
  - Verify event published on task operations
  - Test degraded mode when Dapr unavailable

- [ ] [T160] [P3] [US5] Test event subscribers (backend/tests/test_subscribers.py)
  - Mock request with CloudEvents payload
  - Verify task completion triggers next instance
  - Verify reminder triggers notification
  - Test error handling and retry

---

## Phase 8: Polish & Cross-Cutting Concerns

### Chatbot Enhancements

- [ ] [T162] [P2] [] Add recurring task creation to chatbot (backend/app/routes/chat.py)
  - Parse "create a daily task to ..." commands
  - Parse "create a weekly task every Friday ..." commands
  - Set recurrence_rule based on natural language
  - Confirm recurrence with user

- [ ] [T163] [P2] [] Add tags/priority to chatbot commands (backend/app/routes/chat.py)
  - Parse "add tag work to task ..." commands
  - Parse "set priority high for task ..." commands
  - Update task with new tags/priority

- [ ] [T164] [P2] [] Add search/filter to chatbot (backend/app/routes/chat.py)
  - Parse "show my high priority tasks" commands
  - Parse "find tasks with tag work" commands
  - Return filtered task list

### Documentation

- [ ] [T165] [P3] [] Create cloud deployment guide (docs/cloud-deployment.md)
  - Oracle OKE setup steps
  - Dapr initialization
  - Redpanda installation
  - Troubleshooting common issues
  - Reference quickstart.md for details

- [ ] [T166] [P3] [] Create event schema documentation (docs/event-schema.md)
  - Task event format (CloudEvents)
  - Reminder event format
  - Example payloads
  - Error handling patterns

### Final Testing

- [ ] [T167] [P2] [] Run full integration test suite (shell)
  - pytest backend/tests/ -v
  - Verify all tests pass
  - Check coverage >= 95% for new code

- [ ] [T168] [P3] [] Manual testing checklist (shell)
  - Create 20 tasks with various tags/priorities
  - Create recurring task, complete, verify next instance
  - Create task with reminder, wait for notification
  - Test search/filter/sort combinations
  - Test chatbot commands for all new features

- [ ] [T169] [P3] [] Performance validation (shell)
  - Load test with 100 concurrent users
  - Verify API < 500ms p95
  - Verify event publishing < 100ms p95
  - Verify 1000+ events/minute throughput

---

## After-Build Tasks

These tasks require `/sp.implement` to complete first, as they depend on deployed infrastructure.

### Cloud Deployment Validation

- [ ] [T172] [AB] [US4] Deploy application to Oracle OKE (shell)
  - Run scripts/setup-oke-cluster.sh
  - Run scripts/install-redpanda.sh
  - Apply dapr-components/*.yaml
  - Deploy via Helm with values-cloud.yaml

- [ ] [T173] [AB] [US4] Verify cloud deployment health (shell)
  - kubectl get pods -n todo-app (verify 2/2 containers running)
  - kubectl get svc -n todo-app (verify services)
  - kubectl get ingress -n todo-app (get public URL)
  - Access application, run smoke tests

- [ ] [T174] [AB] [US5] Test event flow in cloud (shell)
  - Create task via UI
  - Check Kafka topic for event
  - Verify subscriber processed event
  - Check logs for errors

### CI/CD Validation

- [ ] [T175] [AB] [US4] Trigger CI/CD pipeline (shell)
  - Push to main branch
  - Verify GitHub Actions workflow runs
  - Verify images built and pushed
  - Verify deployment succeeds

- [ ] [T176] [AB] [US4] Verify zero-downtime deployment (shell)
  - Trigger deployment while application is in use
  - Verify no errors during rollout
  - Verify existing sessions remain active
  - Verify new pods receive traffic

---

## Task Summary

| Phase | Tasks | Priority | User Story |
|-------|-------|----------|------------|
| Phase 1: Setup | T101-T105 | P1 | Foundation |
| Phase 2: Foundation | T106-T111 | P1 | Foundation |
| Phase 3: US1 | T112-T118 | P1 | Advanced Organization |
| Phase 4: US2 | T122-T127 | P2 | Recurring Tasks |
| Phase 5: US3 | T132-T137 | P2 | Smart Reminders |
| Phase 6: US4 | T142-T151 | P3 | Cloud Deployment |
| Phase 7: US5 | T152-T160 | P3 | Event-Driven |
| Phase 8: Polish | T162-T169 | P2-P3 | Cross-cutting |
| After-Build | T172-T176 | P3 | Cloud Validation |

**Total Tasks**: 76 tasks (69 implementable + 7 after-build)
**Added for Remediation**: T107a (optimistic locking), T111 (NFR validation tests)

---

## Success Criteria Mapping

| Success Criteria | Verified By |
|------------------|-------------|
| SC-001: 100% tasks complete | Task checklist above |
| SC-002: Features work in UI + chatbot | T162-T164, T168 |
| SC-003: RRULE correct instances | T122-T127 |
| SC-004: Reminders within 60s | T132-T137 |
| SC-005: Events publish < 100ms | T111, T159 |
| SC-006: Recurring instances < 5s | T123, T160 |
| SC-007: 100% audit log coverage | T152-T154 |
| SC-008: Degraded mode works | T109, T111, T159 |
| SC-009: 99.9% uptime | T172-T175 |
| SC-010: CI/CD < 15 min | T150, T175 |
| SC-011: Zero-downtime deploy | T176 |
| SC-012: Smoke tests pass | T151 |
| SC-013: API < 500ms p95 | T169 |
| SC-014: Chatbot < 3s | T162-T164 |
| SC-015: 1000 events/min | T111, T169 |
| SC-016: 3 clicks for recurrence | T125 |
| SC-017: Search < 1s for 1000 tasks | T114, T118 |
| SC-018: Features discoverable | T165, T168 |
| SC-019: 95% test coverage | T167 |
| SC-020: Zero data loss | T159, T160 |

---

## Next Steps

1. Run `/sp.implement` to execute tasks T101-T169
2. After implementation completes, run after-build tasks T172-T176
3. Create pull request via `/sp.git.commit_pr`
4. Verify all success criteria (SC-001 to SC-020) are met
