# Feature Specification: Cloud Event-Driven Deployment

**Feature Branch**: `001-cloud-event-driven-deployment`
**Created**: 2025-02-09
**Status**: Draft
**Input**: User description: "read the hackathon_docs and specs/001-hackathon-todo-evolution/tasks.md and create spec to complete the phase 5"

## Overview

Phase V completes the "Evolution of Todo" hackathon project by implementing advanced features (recurring tasks, reminders, search/filter/tags) and deploying the application to cloud Kubernetes with event-driven architecture using Kafka and Dapr.

This phase transforms the monolithic todo chatbot into a distributed, event-driven system capable of handling advanced task management scenarios while deploying to production cloud infrastructure.

---

## User Scenarios & Testing

### User Story 1 - Advanced Task Organization (Priority: P1)

As a user, I want to organize my tasks with tags, priorities, and search/filter capabilities so I can efficiently manage large numbers of tasks.

**Why this priority**: Core productivity enhancement - users with many tasks need organization features to find and manage tasks effectively.

**Independent Test**: Create 20+ tasks with different tags and priorities, then verify search/filter returns correct subsets.

**Acceptance Scenarios**:

1. **Given** I have created multiple tasks, **When** I search by keyword "meeting", **Then** only tasks containing "meeting" are displayed
2. **Given** I have tasks with different priorities (high, medium, low), **When** I filter by "high priority", **Then** only high priority tasks are shown
3. **Given** I have tagged tasks as "work" or "personal", **When** I filter by tag "work", **Then** only work-related tasks appear
4. **Given** I have many tasks, **When** I sort by due date, **Then** tasks appear in chronological order

---

### User Story 2 - Recurring Task Automation (Priority: P2)

As a user, I want to create recurring tasks (daily, weekly, monthly) so that when I complete one instance, the next occurrence is automatically created.

**Why this priority**: Powerful productivity feature for repeating tasks; reduces manual task creation for routine activities.

**Independent Test**: Create a weekly recurring task, complete it, verify new instance appears with correct due date.

**Acceptance Scenarios**:

1. **Given** I create a task with daily recurrence, **When** I complete today's task, **Then** a new task is automatically created for tomorrow
2. **Given** I create a weekly "pay bills" task due every Friday, **When** I complete this week's task, **Then** next week's task appears with due date of next Friday
3. **Given** I create a monthly recurring task, **When** I complete the January instance, **Then** February instance is created with correct date
4. **Given** I complete a recurring task, **When** the new instance is created, **Then** it inherits the original title, description, tags, and priority

---

### User Story 3 - Smart Reminders (Priority: P2)

As a user, I want to receive reminders for tasks with due dates so I don't miss important deadlines.

**Why this priority**: Completes the task management lifecycle - ensures users are notified before tasks are due.

**Independent Test**: Create a task with due date and reminder time, verify notification is triggered at reminder time.

**Acceptance Scenarios**:

1. **Given** I create a task due tomorrow with a reminder 1 hour before, **When** the reminder time arrives, **Then** an in-app notification appears with task details
2. **Given** I have multiple reminders scheduled, **When** reminder time arrives, **Then** notifications are sent for each task at correct times
3. **Given** I complete a task before its reminder time, **When** reminder time arrives, **Then** no notification is sent for the completed task
4. **Given** I dismiss a reminder, **When** the reminder time recurs, **Then** I am notified again (for recurring tasks)

---

### User Story 4 - Cloud Deployment (Priority: P3)

As a developer, I want to deploy the application to cloud Kubernetes so that users can access the production application from anywhere.

**Why this priority**: Required for production availability; completes the local-to-cloud deployment journey.

**Independent Test**: Deploy to cloud K8s, access application via public URL, verify all features work.

**Acceptance Scenarios**:

1. **Given** the application is deployed to cloud Kubernetes, **When** I access the public URL, **Then** the application loads and functions correctly
2. **Given** deployment completes successfully, **When** I sign in and create tasks, **Then** data persists correctly across sessions
3. **Given** the cloud deployment is running, **When** I use the AI chatbot, **Then** natural language commands work as expected
4. **Given** a new deployment is pushed, **When** the CI/CD pipeline runs, **Then** the application updates without downtime

---

### User Story 5 - Event-Driven Architecture (Priority: P3)

As a system architect, I want event-driven communication between services so that the system scales reliably and components remain decoupled.

**Why this priority**: Enables scalable microservices architecture; foundation for advanced features like recurring tasks and reminders.

**Independent Test**: Complete a recurring task, verify Kafka event is published and new task instance is created by subscriber service.

**Acceptance Scenarios**:

1. **Given** a task is created via chat, **When** the task creation event is published to Kafka, **Then** the audit service records the event
2. **Given** a recurring task is completed, **When** the completion event is published, **Then** the recurring task service creates the next instance
3. **Given** a task with a reminder is created, **When** the reminder time arrives, **Then** a reminder event triggers notification delivery
4. **Given** the Kafka service is temporarily unavailable, **When** events are published, **Then** the system continues operating and events are processed when Kafka recovers

---

### Edge Cases

- **Kafka service unavailable**: What happens when Kafka is down during task operations?
  - System continues operating with degraded functionality (events not published, cached for retry)
  - Task CRUD operations continue to work via direct database operations

- **Recurring task edge cases**: What happens when a recurring task falls on a non-existent date (e.g., February 30)?
  - RRULE standard handling: task is scheduled for the next valid occurrence

- **Reminder for completed tasks**: Should reminders fire for tasks that were already completed before the reminder time?
  - No: completed tasks should not trigger reminders

- **Notification display**: In-app notifications appear in notification bell; must persist until dismissed or marked as read

- **Cloud resource limits**: What happens when cloud deployment exceeds resource quotas?
  - Deployment fails with clear error message; system provides guidance on increasing quotas

- **Concurrent task modifications**: How to handle when chatbot and web UI modify same task simultaneously?
  - Last-write-wins with optimistic locking; users are notified of conflicts

---

## Requirements

### Functional Requirements

#### Advanced Task Features

- **FR-001**: System MUST support adding multiple tags to any task
- **FR-002**: System MUST support three priority levels: high, medium, low
- **FR-003**: System MUST support searching tasks by title keyword
- **FR-004**: System MUST support filtering tasks by status (pending/completed), priority, and tags
- **FR-005**: System MUST support sorting tasks by due date, priority, creation date, or title
- **FR-006**: System MUST support iCalendar RRULE format for recurring task definitions
- **FR-007**: System MUST support common recurrence frequencies: daily, weekly, monthly, yearly
- **FR-008**: System MUST automatically create next instance when a recurring task is completed
- **FR-009**: System MUST support setting due dates with specific date and time
- **FR-010**: System MUST support scheduling reminders before due date (configurable offset)

#### Event-Driven Architecture

- **FR-011**: System MUST publish events to Kafka for all task operations (create, update, delete, complete)
- **FR-012**: System MUST consume task completion events to generate next recurring instance
- **FR-013**: System MUST consume reminder events to trigger notifications
- **FR-014**: System MUST maintain audit log of all task operations via event streaming
- **FR-015**: System MUST use Dapr for Pub/Sub abstraction over Kafka
- **FR-016**: System MUST use Dapr for state management (conversation history)
- **FR-017**: System MUST use Dapr Jobs API for scheduled reminder callbacks

#### Cloud Deployment

- **FR-018**: System MUST deploy to Oracle Cloud OKE (Always Free tier: 4 OCPUs, 24GB RAM)
- **FR-019**: System MUST use Helm charts for deployment (consistent with Phase IV)
- **FR-020**: System MUST configure Dapr sidecar for all application pods
- **FR-021**: System MUST deploy Redpanda (ZooKeeper-free Kafka) via Helm within Kubernetes cluster
- **FR-022**: System MUST configure PostgreSQL state store component in Dapr
- **FR-023**: System MUST use Kubernetes secret store for sensitive credentials
- **FR-024**: System MUST implement CI/CD pipeline using GitHub Actions
- **FR-025**: CI/CD pipeline MUST build and push Docker images to GitHub Container Registry (ghcr.io)
- **FR-026**: CI/CD pipeline MUST run smoke tests before deployment
- **FR-027**: CI/CD pipeline MUST deploy via Helm to cloud Kubernetes

#### AI Chatbot Enhancements

- **FR-028**: Chatbot MUST understand and execute commands to create recurring tasks
- **FR-029**: Chatbot MUST understand and execute commands to add tags to tasks
- **FR-030**: Chatbot MUST understand and execute commands to set task priorities
- **FR-031**: Chatbot MUST understand and execute search/filter commands via natural language
- **FR-032**: Chatbot MUST support setting due dates and reminders through conversation

### Key Entities

#### Extended Task

- **Task**: Core todo item with extended attributes
  - id: Unique identifier
  - user_id: Owner reference
  - title: Task name
  - description: Detailed description (optional)
  - completed: Completion status
  - priority: One of {high, medium, low}
  - tags: Array of category labels
  - recurrence_rule: RRULE string for recurring tasks (optional)
  - parent_task_id: Reference to original recurring task (for instances)
  - due_date: Deadline timestamp (optional)
  - reminder_at: When to send reminder (optional)
  - created_at: Creation timestamp
  - updated_at: Last modification timestamp

#### Task Event

- **TaskEvent**: Event published to Kafka for task operations
  - event_id: Unique event identifier
  - event_type: One of {created, updated, deleted, completed}
  - task_id: Reference to affected task
  - task_data: Full task snapshot
  - user_id: User who performed action
  - timestamp: When event occurred

#### Reminder

- **Reminder**: Scheduled notification for tasks
  - id: Unique identifier
  - task_id: Reference to task
  - user_id: User to notify
  - remind_at: When to send reminder
  - status: One of {pending, sent, dismissed, cancelled}
  - created_at: Creation timestamp

#### Recurring Task Instance

- **RecurringInstance**: Tracks relationship between recurring template and instances
  - parent_task_id: Original recurring task template
  - instance_task_id: Generated task instance
  - sequence_number: Order in recurrence series
  - scheduled_for: Due date for this instance
  - created_from: Which completion triggered this instance

---

## Success Criteria

### Measurable Outcomes

#### Feature Completeness

- **SC-001**: 100% of tasks defined in Phase V (T111-T136) are completed and verified
- **SC-002**: All advanced task features (tags, priorities, search, filter, sort) work in both web UI and chatbot
- **SC-003**: Recurring tasks correctly generate next instances with proper RRULE interpretation
- **SC-004**: Reminders are sent within 60 seconds of scheduled time

#### Event-Driven Architecture

- **SC-005**: Task operations publish events to Kafka within 100ms of database commit
- **SC-006**: System processes task completion events and creates recurring instances within 5 seconds
- **SC-007**: Audit log contains 100% of task operations with correct timestamps
- **SC-008**: System continues operating when Kafka is unavailable (degraded mode)

#### Cloud Deployment

- **SC-009**: Application is accessible via public URL with 99.9% uptime during testing period
- **SC-010**: CI/CD pipeline completes full build, test, and deployment cycle in under 15 minutes
- **SC-011**: Deployment supports zero-downtime updates (rolling deployments)
- **SC-012**: All smoke tests pass after every deployment

#### Performance & Scalability

- **SC-013**: API response time for task operations is under 500ms at 100 concurrent users
- **SC-014**: Chatbot responds to natural language commands within 3 seconds
- **SC-015**: System can handle 1000 task events per minute without backlog

#### User Experience

- **SC-016**: Users can create a recurring task with 3 or fewer UI interactions
- **SC-017**: Search and filter operations return results within 1 second for 1000+ tasks
- **SC-018**: New users can understand advanced features (recurrence, tags) without documentation

#### Quality & Reliability

- **SC-019**: 95% test coverage for new event-driven components
- **SC-020**: Zero data loss events during deployment or Kafka unavailability

---

## Non-Functional Requirements

### Performance

- Task CRUD operations: < 500ms p95 latency
- Event publishing: < 100ms p95 latency
- Chatbot response: < 3 seconds p95 latency
- Support 1000 concurrent users

### Reliability

- 99.9% uptime during active testing
- Zero data loss during Kafka outages (events cached)
- Automatic recovery from service failures

### Scalability

- Horizontal scaling of backend services
- Kafka handles 1000+ events per minute
- Database connection pooling for 100+ concurrent connections

### Security

- All inter-service communication via Dapr with mTLS
- Secrets stored in Kubernetes secret store
- JWT authentication for all API endpoints
- No credentials in code or configuration files

### Maintainability

- Clear separation between event publishers and consumers
- Dapr components in version-controlled YAML files
- CI/CD pipeline for automated testing and deployment
- Comprehensive logging and monitoring

---

## Assumptions & Constraints

### Assumptions

- Oracle Cloud account with Always Free OKE tier (4 OCPUs, 24GB RAM, no time expiration)
- GitHub Container Registry for Docker image storage
- Existing Phase IV codebase (Docker images, Helm charts) is available and working
- Redpanda will be deployed via Helm chart (ZooKeeper-free, ~1GB RAM footprint)
- CI/CD will use GitHub Actions (free for public repositories)
- Neon PostgreSQL remains the external database service

### Constraints

- Must use technology stack specified in hackathon guidelines:
  - Kafka or Kafka-compatible message broker
  - Dapr for distributed application runtime
  - Helm for Kubernetes deployment
  - GitHub Actions for CI/CD
- Must complete all tasks T111-T136 from the main hackathon tasks.md
- Must maintain backward compatibility with existing Phase I-IV features
- Cloud deployment costs must stay within free tier limits during development

### Dependencies

- Phase IV (Local Kubernetes Deployment) must be complete
- Docker images for frontend and backend must be built and tested
- Helm charts from Phase IV must be extended for cloud deployment
- Existing database schema must be migrated (Alembic)

---

## Out of Scope

The following are explicitly excluded from Phase V:

- Multi-language support (Urdu) - designated as bonus feature
- Voice commands - designated as bonus feature
- Real-time WebSocket sync between clients - future enhancement
- Mobile application - web-only scope
- Advanced analytics/reporting dashboards - future enhancement
- Task sharing/collaboration between users - single-user scope maintained

---

## Documentation Requirements

The following documentation will be created:

- Cloud deployment guide (docs/cloud-deployment.md)
- Dapr components reference (dapr-components/README.md)
- Kafka event schema documentation (docs/event-schema.md)
- CI/CD pipeline documentation (.github/workflows/deploy.yaml with comments)
- Architecture decision records for significant choices

---

## Clarifications

### Session 2025-02-09

- Q: Which cloud Kubernetes provider should be the primary target for Phase V deployment? → A: Oracle Cloud OKE (always free) with GitHub Container Registry
- Q: Which Kafka deployment strategy for Oracle OKE's Always Free tier (4 OCPUs, 24GB RAM)? → A: Redpanda via Helm (ZooKeeper-free, ~1GB RAM)
- Q: How should task reminders be delivered to users? → A: In-app notifications only (notification bell in UI)

---

## References

- Hackathon II Guidelines: `hackathon_docs/Hackathon2-guidelines.md`
- Main Tasks File: `specs/001-hackathon-todo-evolution/tasks.md` (T111-T136)
- Phase IV Helm Charts: `helm/todo-app/`
- Existing Dapr Documentation: `docs/ri/dapr-fundamentals.md` (if exists)
