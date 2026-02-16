# Research: Cloud Event-Driven Deployment (Phase V)

**Feature**: 001-cloud-event-driven-deployment
**Date**: 2025-02-09
**Purpose**: Technical research for implementing cloud deployment with Dapr, Kafka, and Kubernetes

---

## Decision 1: Kafka Deployment Strategy

**Decision**: Redpanda via Helm (single replica for Always Free tier)

**Rationale**:
- **ZooKeeper-free**: Redpanda eliminates ZooKeeper dependency, reducing infrastructure complexity
- **Resource efficient**: Runs with ~1GB RAM vs Kafka+ZooKeeper ~2GB+
- **Kafka-compatible**: Drop-in replacement for Kafka - no code changes needed
- **Oracle OKE compatible**: Single replica fits within 4 OCPU / 24GB RAM Always Free tier

**Alternatives Considered**:
- **Strimzi (Kafka + ZooKeeper)**: Rejected due to ZooKeeper overhead and resource requirements
- **Confluent Cloud (external)**: Rejected due to cost and external dependency
- **Oracle Managed Kafka**: Rejected due to limited availability and complexity

**Reference**:
```yaml
# Redpanda single-node configuration for Always Free tier
statefulset:
  replicas: 1
resources:
  cpu:
    cores: 1
  memory:
    container:
      max: 2Gi
storage:
  persistentVolume:
    size: 10Gi
```

---

## Decision 2: Dapr Integration Pattern

**Decision**: Dapr sidecar with HTTP API for Pub/Sub, State, and Secrets

**Rationale**:
- **Infrastructure abstraction**: No direct Kafka library dependencies in application code
- **Portability**: Swap message brokers via configuration without code changes
- **Built-in reliability**: Automatic retries, circuit breakers, dead letter queues
- **mTLS by default**: Secure inter-service communication out of the box

**Alternatives Considered**:
- **Direct Kafka client libraries (aiokafka)**: Rejected due to vendor lock-in and complexity
- **Redis Pub/Sub**: Rejected due to lack of persistence and ordering guarantees
- **AWS SNS/SQS or equivalent**: Rejected due to cloud vendor lock-in

**Dapr Building Blocks Selected**:

| Building Block | Component | Purpose |
|---------------|-----------|---------|
| Pub/Sub | `pubsub.kafka` | Task events, reminders |
| State Store | `state.postgresql` | Conversation state |
| Secret Store | `secretstores.kubernetes` | API keys, DB credentials |
| Service Invocation (optional) | HTTP proxy | Frontend → Backend communication |

**Reference**:
```python
# Event publishing via Dapr (no Kafka libraries needed)
import httpx

async def publish_event(pubsub: str, topic: str, data: dict):
    await httpx.post(
        f"http://localhost:3500/v1.0/publish/{pubsub}/{topic}",
        json=data
    )
```

---

## Decision 3: Cloud Provider & Container Registry

**Decision**: Oracle Cloud OKE (Always Free) + GitHub Container Registry

**Rationale**:
- **Oracle OKE Always Free**: 4 OCPUs, 24GB RAM, no time expiration
- **GitHub Container Registry**: Free for public repositories, integrated with CI/CD
- **Cost effective**: $0/month for development and testing

**Alternatives Considered**:
- **Azure AKS + ACR**: Rejected due to free tier limitations (12 months only)
- **GCP GKE + GAR**: Rejected due to $74/month minimum for e2-medium nodes
- **DigitalOcean DOKS**: Rejected due to $20/month minimum cost

---

## Decision 4: Event Schema Design

**Decision**: CloudEvents format with type-safe event envelopes

**Rationale**:
- **Industry standard**: CloudEvents specification provides interoperability
- **Traceability**: Built-in traceparent for distributed tracing
- **Type safety**: Strong typing for event contracts

**Event Types**:
```
- todo.task.created
- todo.task.updated
- todo.task.completed
- todo.task.deleted
- todo.reminder.due
- todo.recurring.next_created
```

**Event Envelope**:
```json
{
  "specversion": "1.0",
  "type": "todo.task.completed",
  "source": "/todo-backend",
  "id": "A234-1234-1234",
  "time": "2025-02-09T12:00:00Z",
  "datacontenttype": "application/json",
  "data": {
    "task_id": 123,
    "user_id": "user-uuid",
    "title": "Complete Phase V",
    "completed": true
  }
}
```

---

## Decision 5: Database Migration Strategy

**Decision**: Alembic migrations with PostgreSQL state store for Dapr

**Rationale**:
- **Existing migrations**: Project already uses Alembic
- **Production database**: Neon PostgreSQL (already configured)
- **Dapr state store**: Reuses existing PostgreSQL for conversation state

**Migration Required**:
- Add `reminder_at` column to `task` table
- Add `recurrence_rule` column to `task` table (already exists in model)
- Create `task_events` audit table (optional - could use Kafka retention)

---

## Decision 6: CI/CD Pipeline

**Decision**: GitHub Actions with Helm deployment to Oracle OKE

**Rationale**:
- **GitHub native**: Integrated with repository
- **Free for public repos**: No additional cost
- **Helm based**: Consistent with Phase IV deployment strategy

**Pipeline Stages**:
1. **Build**: Docker images for frontend/backend
2. **Push**: Push to GitHub Container Registry (ghcr.io)
3. **Test**: Run smoke tests against staging
4. **Deploy**: Helm upgrade to production

**Reference**:
```yaml
# .github/workflows/deploy.yaml
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build & Push Images
        run: |
          docker build -t ghcr.io/${{ github.repository }}/backend:${{ github.sha }} backend
          docker push ghcr.io/${{ github.repository }}/backend:${{ github.sha }}
      - name: Deploy via Helm
        run: |
          helm upgrade todo ./helm/todo-app --install
            --set backend.image.tag=${{ github.sha }}
            --set frontend.image.tag=${{ github.sha }}
```

---

## Decision 7: Reminder Scheduling Strategy

**Decision**: Dapr Jobs API for scheduled callbacks

**Rationale**:
- **Built-in scheduling**: No external cron service needed
- **Kubernetes native**: Leverages K8s Job resources
- **Fault tolerant**: Automatic retry on failure

**Alternatives Considered**:
- **APScheduler (current)**: Rejected for distributed deployment (single process limitation)
- **External cron service**: Rejected due to additional infrastructure
- **Kubernetes CronJob**: Rejected due to lack of dynamic scheduling

**Flow**:
1. User creates task with due_date and reminder_at
2. Backend schedules Dapr job for reminder_at timestamp
3. At reminder time, Dapr POSTs to `/api/jobs/trigger`
4. Backend publishes `todo.reminder.due` event
5. Notification service subscribes and creates in-app notification

---

## Decision 8: Resource Limits for Always Free Tier

**Decision**: Conservative resource allocation to fit within 4 OCPU / 24GB RAM

**Allocation**:
| Component | CPU | Memory | Replicas |
|-----------|-----|--------|----------|
| Backend | 200m | 256Mi | 2 |
| Frontend | 200m | 256Mi | 2 |
| Redpanda | 1000m | 2Gi | 1 |
| Dapr sidecars | 100m each | 128Mi each | 4 |
| **Total** | **~3.8 CPU** | **~6.5 GB** | |

**Note**: Leaves headroom for PostgreSQL (managed externally via Neon)

---

## Decision 9: Event Subscription Pattern

**Decision**: Declarative subscriptions via `/dapr/subscribe` endpoint

**Rationale**:
- **Dapr standard**: Dapr discovers subscriptions via HTTP endpoint
- **Dynamic**: Subscriptions can be changed without restarting Dapr
- **Type safe**: Each topic routes to specific handler

**Implementation**:
```python
@router.get("/dapr/subscribe")
async def subscribe():
    return [
        {"pubsubname": "kafka-pubsub", "topic": "task-events", "route": "/events/tasks"},
        {"pubsubname": "kafka-pubsub", "topic": "reminders", "route": "/events/reminders"},
    ]
```

---

## Decision 10: Degraded Mode Strategy

**Decision**: Continue operation when Kafka is unavailable

**Rationale**:
- **User experience**: Task CRUD operations should not depend on Kafka
- **Graceful degradation**: Events cached in memory, published when Kafka recovers

**Implementation**:
```python
# In-memory event buffer for Kafka outages
_event_buffer: list[dict] = []
_buffer_max_size = 1000

async def publish_with_fallback(event: dict):
    try:
        await publish_event("kafka-pubsub", "task-events", event)
    except httpx.ConnectError:
        _event_buffer.append(event)
        if len(_event_buffer) > _buffer_max_size:
            _event_buffer.pop(0)  # Drop oldest
```

---

## Technology Stack Summary

| Component | Technology | Version |
|-----------|-----------|---------|
| Kubernetes | Oracle OKE | Always Free tier |
| Container Registry | GitHub Container Registry | ghcr.io |
| Message Broker | Redpanda | Latest (via Helm) |
| Distributed Runtime | Dapr | 1.14+ |
| Pub/Sub API | Dapr HTTP API | v1.0 |
| State Store | Dapr PostgreSQL | v1 |
| Secret Store | Kubernetes Secrets | v1 |
| CI/CD | GitHub Actions | Latest |
| Package Manager | Helm | 3.x |
| Python | 3.13+ | |
| FastAPI | Latest | |
| SQLModel | Latest | |

---

## Open Questions Resolved

1. **Q**: How to handle recurring task instances?
   **A**: RRULE stored in parent task; completion event triggers instance creation

2. **Q**: How to deliver reminders?
   **A**: In-app notifications only (no email/SMS)

3. **Q**: What happens when Kafka is down?
   **A**: Task operations continue; events cached for retry

4. **Q**: How to schedule reminders?
   **A**: Dapr Jobs API with HTTP callback

5. **Q**: Database for conversation state?
   **A**: Existing Neon PostgreSQL via Dapr state store component
