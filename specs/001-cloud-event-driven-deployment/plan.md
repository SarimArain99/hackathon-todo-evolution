# Implementation Plan: Cloud Event-Driven Deployment

**Branch**: `001-cloud-event-driven-deployment`
**Date**: 2025-02-09
**Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-cloud-event-driven-deployment/spec.md`

---

## Summary

Phase V transforms the Todo application into a cloud-native, event-driven system by:
1. **Deploying to Oracle Cloud OKE** (Always Free tier: 4 OCPUs, 24GB RAM)
2. **Integrating Dapr** for distributed runtime with Kafka Pub/Sub, state management, and secrets
3. **Deploying Redpanda** (ZooKeeper-free Kafka) for event streaming
4. **Extending task features** with reminders, recurrence, and advanced search/filter
5. **Setting up CI/CD** via GitHub Actions for automated deployment

Technical approach: Leverage existing Phase I-IV foundation; add Dapr sidecars; implement event publishing/subscriptions; deploy to cloud Kubernetes.

---

## Technical Context

| Category | Technology | Version/Notes |
|----------|-----------|---------------|
| **Language** | Python | 3.13+ (backend) |
| **Backend** | FastAPI, SQLModel, Pydantic | Latest via UV |
| **Frontend** | Next.js 15+, TypeScript | App Router, Tailwind CSS |
| **Database** | Neon PostgreSQL | Managed externally |
| **Message Broker** | Redpanda | Latest (Kafka-compatible) |
| **Distributed Runtime** | Dapr | 1.14+ |
| **Container Registry** | GitHub Container Registry | ghcr.io |
| **Kubernetes** | Oracle Cloud OKE | Always Free tier |
| **Package Manager** | Helm | 3.x |
| **CI/CD** | GitHub Actions | Latest |
| **Testing** | pytest, uvicorn | FastAPI TestClient |
| **Target Platform** | Linux (Alpine-based containers) | AMD64 |
| **Project Type** | web (backend + frontend) | Monorepo structure |

### Performance Goals

| Metric | Target |
|--------|--------|
| API response time | < 500ms p95 (100 concurrent users) |
| Event publishing | < 100ms p95 |
| Chatbot response | < 3 seconds p95 |
| Events processed | 1000+ per minute |

### Constraints

- Oracle OKE Always Free: 4 OCPUs, 24GB RAM
- Must stay within GitHub Container Registry free tier
- No paid services during development
- Must maintain backward compatibility with existing features

### Scale/Scope

- 1000 concurrent users target
- 1000+ tasks per user
- 1000+ events per minute throughput
- 99.9% uptime during testing

---

## Constitution Check

**GATE**: All principles verified before proceeding.

### Principle Compliance

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Spec-Driven Development** | ✅ PASS | Spec approved; this plan follows |
| **II. Skills & Subagents First** | ✅ PASS | References Dapr/Kafka skills from `.claude/skills/` |
| **III. Context7 Knowledge** | ✅ PASS | Dapr/Redpanda docs queried for latest patterns |
| **IV. No Manual Coding** | ✅ PASS | All code will be AI-generated via `/sp.implement` |
| **V. Phase Governance** | ✅ PASS | Phase V builds on Phase I-IV foundation |
| **VI. Technology Constraints** | ✅ PASS | Uses approved stack: Dapr, Kafka, Helm |
| **VII. Agent Behavior** | ✅ PASS | All work references task IDs from tasks.md |
| **VIII. Quality Principles** | ✅ PASS | Clean architecture; separation of concerns |
| **IX. Cloud-Native Readiness** | ✅ PASS | Containers, K8s, observability built-in |

### Gate Evaluation

- ❌ No gate violations detected
- ✅ All requirements are testable
- ✅ Success criteria are measurable
- ✅ Design follows constitution principles

**Status**: PROCEED TO IMPLEMENTATION

---

## Project Structure

### Documentation (this feature)

```
specs/001-cloud-event-driven-deployment/
├── spec.md              # Feature requirements (WHAT)
├── plan.md              # This file - Technical approach (HOW)
├── research.md          # Phase 0: Technology research
├── data-model.md        # Phase 1: Data entities & events
├── quickstart.md        # Phase 1: Developer guide
├── contracts/           # Phase 1: API specifications
│   └── api.yaml         # OpenAPI 3.0 specification
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```
# Web Application Structure (backend + frontend)
backend/
├── app/
│   ├── main.py              # FastAPI app with Dapr event publishing
│   ├── database.py          # Database connection & session management
│   ├── auth.py              # Better Auth JWT validation
│   ├── models.py            # SQLModel entities (Task, Notification, etc.)
│   ├── routes/
│   │   ├── tasks.py         # Task CRUD endpoints
│   │   ├── chat.py          # AI chatbot endpoints
│   │   └── notifications.py # Notification endpoints
│   ├── services/
│   │   ├── task_service.py      # Task business logic
│   │   ├── notification_service.py # Notification management
│   │   ├── agent_service.py      # OpenAI Agents SDK integration
│   │   ├── conversation_service.py # Chat state management
│   │   └── event_publisher.py  # NEW: Dapr event publishing
│   ├── subscribers.py       # NEW: Dapr event subscription handlers
│   └── mcp_server/          # MCP tools for AI agent
├── tests/
│   ├── test_tasks.py
│   ├── test_chat.py
│   ├── test_notifications.py
│   ├── test_recurrence.py   # NEW: RRULE handling tests
│   └── conftest.py
├── Dockerfile
└── requirements.txt

frontend/
├── app/
│   ├── (auth)/              # Auth routes (Better Auth)
│   ├── (protected)/
│   │   ├── dashboard/       # Task management UI
│   │   └── chat/            # AI chatbot UI
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── task-list.tsx        # Task display with filter/sort
│   ├── task-form.tsx        # Create/edit task form
│   ├── task-item.tsx        # Individual task component
│   ├── notification-bell.tsx # Notification bell icon
│   └── notification-dropdown.tsx # Notification list
├── Dockerfile
└── package.json

dapr-components/             # NEW: Dapr component configurations
├── kafka-pubsub.yaml        # Kafka Pub/Sub component
├── statestore.yaml          # PostgreSQL state store
└── secretstore.yaml         # Kubernetes secret store

helm/todo-app/               # Helm charts (extended from Phase IV)
├── Chart.yaml
├── values.yaml              # Default values (local)
├── values-cloud.yaml        # NEW: Cloud deployment overrides
└── templates/
    ├── backend-deployment.yaml   # Extended with Dapr annotations
    ├── frontend-deployment.yaml
    ├── redpanda-deployment.yaml  # NEW: Redpanda chart
    └── ingress.yaml

.github/workflows/           # NEW: CI/CD pipelines
└── deploy.yaml              # Automated deployment to Oracle OKE
```

**Structure Decision**: Web application structure (Option 2) with separate backend (FastAPI) and frontend (Next.js) directories. Dapr components added for event-driven capabilities. Helm charts extended for cloud deployment with Dapr sidecar annotations.

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Oracle Cloud OKE                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                       Ingress (NGINX)                       ││
│  └──────────────────────────┬──────────────────────────────────┘│
│                             │                                     │
│         ┌───────────────────┼───────────────────┐                │
│         ▼                   ▼                   ▼                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │  Frontend   │    │   Backend   │    │  Redpanda   │          │
│  │  (Next.js)  │    │  (FastAPI)  │    │   (Kafka)   │          │
│  │             │    │             │    │             │          │
│  │ Dapr Sidecar│    │ Dapr Sidecar│    │             │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
│         │                   │                   │                │
│         └───────────────────┴───────────────────┘                │
│                             │                                     │
│                    ┌────────▼────────┐                           │
│                    │   Dapr Control  │                           │
│                    │     Plane       │                           │
│                    └─────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  │ (External Managed Service)
                                  ▼
                       ┌─────────────────────┐
                       │    Neon PostgreSQL  │
                       │   (Database + State)│
                       └─────────────────────┘
```

### Event Flow

```
User Action → Frontend → Backend API → Database
                                     ↓
                              Dapr Sidecar
                                     ↓
                               Kafka/Redpanda
                                     ↓
                    ┌────────────────────────────┐
                    │    Backend Subscribers     │
                    │  (/events/tasks route)     │
                    └────────────────────────────┘
                                     ↓
                        ┌─────────────┴────────────┐
                        ▼                           ▼
                  Next Instance                  Notification
                  Creation (recurrence)          (reminder)
```

### Dapr Component Architecture

| Component | Type | Purpose |
|-----------|------|---------|
| `kafka-pubsub` | pubsub.kafka | Abstract Kafka for Pub/Sub |
| `statestore` | state.postgresql | Conversation state storage |
| `kubernetes-secrets` | secretstores.kubernetes | Secrets management |

---

## Implementation Phases

### Phase 0: Research & Setup ✅

**Status**: Complete
- Technology research documented in `research.md`
- Dapr patterns documented in `.claude/skills/dapr/SKILL.md`
- Redpanda deployment strategy defined
- Oracle OKE allocation planned

### Phase 1: Data Model & Contracts ✅

**Status**: Complete
- Data model defined in `data-model.md`
- API contracts defined in `contracts/api.yaml`
- Event schema (CloudEvents) defined

### Phase 2: Implementation Tasks

**To be generated via `/sp.tasks`** - will create atomic work units:
1. Backend event publishing module
2. Backend event subscription handlers
3. Dapr component YAML files
4. Database migration for `reminder_at` column
5. Recurring task instance generation
6. Reminder scheduling with Dapr Jobs
7. Helm chart updates for Dapr sidecar
8. Redpanda Helm integration
9. CI/CD pipeline setup
10. Testing & validation

---

## Key Implementation Details

### Event Publishing Pattern

```python
# backend/app/services/event_publisher.py
from dapr.clients import DaprClient

class EventPublisher:
    async def publish_task_event(
        self,
        event_type: str,  # created, updated, completed, deleted
        task: TaskRead,
        user_id: str
    ):
        event = {
            "specversion": "1.0",
            "type": f"todo.task.{event_type}",
            "source": "/todo-backend",
            "id": f"evt_{uuid4()}",
            "time": datetime.utcnow().isoformat(),
            "datacontenttype": "application/json",
            "data": {
                "task_id": task.id,
                "user_id": user_id,
                "title": task.title,
                **task.model_dump()
            }
        }

        async with DaprClient() as client:
            await client.publish_event(
                pubsub_name="kafka-pubsub",
                topic_name="task-events",
                data=json.dumps(event),
                data_content_type="application/json"
            )
```

### Event Subscription Pattern

```python
# backend/app/subscribers.py
from fastapi import APIRouter, Request

router = APIRouter()

@router.get("/dapr/subscribe")
async def subscribe():
    """Dapr discovers subscriptions via this endpoint."""
    return [
        {"pubsubname": "kafka-pubsub", "topic": "task-events", "route": "/events/tasks"},
        {"pubsubname": "kafka-pubsub", "topic": "reminders", "route": "/events/reminders"},
    ]

@router.post("/events/tasks")
async def handle_task_event(request: Request):
    """Handle task completion - create next instance if recurring."""
    event = await request.json()
    data = event.get("data", {})

    if data.get("operation") == "completed" and data.get("recurrence_rule"):
        await create_next_instance(data)

    return {"status": "SUCCESS"}
```

### Dapr-Enabled Deployment

```yaml
# helm/todo-app/templates/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Values.backend.name }}
spec:
  replicas: {{ .Values.backend.replicas }}
  selector:
    matchLabels:
      app: {{ .Values.backend.name }}
  template:
    metadata:
      labels:
        app: {{ .Values.backend.name }}
      annotations:
        dapr.io/enabled: "true"  # Enable Dapr sidecar
        dapr.io/app-id: "todo-backend"
        dapr.io/app-port: "8000"
        dapr.io/enable-api-logging: "true"
    spec:
      containers:
        - name: backend
          image: "{{ .Values.backend.image.repository }}:{{ .Values.backend.image.tag }}"
          ports:
            - containerPort: 8000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: todo-secrets
                  key: database-url
```

---

## Non-Functional Requirements

### Performance

- Task CRUD: < 500ms p95 latency
- Event publishing: < 100ms p95 latency
- Support 1000 concurrent users
- 1000+ events/minute throughput

### Reliability

- 99.9% uptime during testing
- Zero data loss during Kafka outages (events cached)
- Automatic recovery from service failures

### Scalability

- Horizontal scaling of backend services
- Kafka handles 1000+ events per minute
- Database connection pooling for 100+ connections

### Security

- All inter-service communication via Dapr with mTLS
- Secrets stored in Kubernetes secret store
- JWT authentication for all API endpoints
- No credentials in code or configuration files

---

## Complexity Tracking

> **No violations to justify.** All additions align with Phase V requirements:
> - Dapr integration: Required by hackathon guidelines for Phase V
> - Kafka/Redpanda: Required for event-driven architecture
> - Extended data model: Required for recurrence and reminders
> - Cloud deployment: Natural progression from Phase IV (local K8s)

### Phase V Complexity Metrics

| Metric | Phase IV Baseline | Phase V Addition | Justification |
|--------|-------------------|------------------|---------------|
| **Estimated Lines of Code** | ~2,500 LOC | +1,200 LOC | Event publishers, subscribers, Dapr integration, cloud configs |
| **New Components** | 2 (frontend, backend) | +5 (daprd sidecar, redpanda, 3 dapr-components) | Event-driven infrastructure per hackathon requirements |
| **New Services** | 2 (frontend, backend) | +1 (event_publisher) | +1 (subscribers router) | Decoupled event handling |
| **New API Endpoints** | ~15 endpoints | +4 endpoints | `/dapr/subscribe`, `/events/tasks`, `/events/reminders`, `/api/jobs/trigger` |
| **New Database Columns** | 8 columns | +1 column | `reminder_at` for scheduled notifications |
| **Integration Points** | 2 (Neon DB, auth) | +3 (Kafka, Dapr control plane, GitHub Container Registry) | Cloud-native event streaming |
| **Helm Templates** | 6 templates | +3 templates | redpanda-deployment.yaml, dapr annotations, values-cloud.yaml |
| **CI/CD Pipelines** | 0 | +1 workflow | .github/workflows/deploy.yaml |
| **External Dependencies** | ~15 packages | +3 packages | dapr>=1.14.0, python-dateutil, dapr-dev |
| **New Test Files** | 4 test files | +2 test files | test_recurrence.py, test_events.py |

### Architectural Justification

Each addition serves a specific Phase V requirement:

1. **Dapr Sidecars**: Enables mTLS, service discovery, and pub/sub abstraction without code coupling
2. **Redpanda**: Kafka-compatible message broker fitting in 4 OCPU/24GB Always Free tier
3. **Event Publisher/Subscriber**: Implements FR-011 to FR-017 (event-driven architecture requirements)
4. **Reminder Column**: Implements FR-010 (scheduled reminders before due date)
5. **Cloud Deployment**: Implements FR-018 to FR-027 (Oracle OKE, CI/CD, container registry)
6. **Recurrence Support**: Implements FR-006 to FR-008 (recurring task automation)

### Complexity Containment

- **No Framework Changes**: FastAPI, Next.js, SQLModel remain unchanged
- **No Database Migration Breaking Changes**: Additive only (reminder_at column)
- **Backward Compatible**: All existing Phase I-IV features preserved
- **Optional Dapr**: Application runs without Dapr in degraded mode

---

## References

- **Spec**: `specs/001-cloud-event-driven-deployment/spec.md`
- **Research**: `specs/001-cloud-event-driven-deployment/research.md`
- **Data Model**: `specs/001-cloud-event-driven-deployment/data-model.md`
- **API Contracts**: `specs/001-cloud-event-driven-deployment/contracts/api.yaml`
- **Quickstart**: `specs/001-cloud-event-driven-deployment/quickstart.md`
- **Phase IV Helm**: `helm/todo-app/`
- **Dapr Skill**: `.claude/skills/dapr/SKILL.md`
- **Phase V Agent**: `.claude/agents/phase5-cloud/agent.md`

---

## Next Steps

1. Run `/sp.tasks` to generate atomic work units from this plan
2. Run `/sp.implement` to execute tasks sequentially
3. Run `/sp.git.commit_pr` to create pull request after completion
