# Dapr Components

This directory contains Dapr component configurations for the Todo application's event-driven architecture.

## Components

| Component | Type | Purpose |
|-----------|------|---------|
| `kafka-pubsub.yaml` | pubsub.kafka | Abstract Redpanda (Kafka-compatible) message broker for event streaming |
| `statestore.yaml` | state.postgresql | Store conversation state and cache data in PostgreSQL |
| `secretstore.yaml` | secretstores.kubernetes | Fetch secrets from Kubernetes secrets (no credentials in code) |

## Installation

### Local Development

For local development, Dapr can use an in-memory pubsub or local Redpanda:

```bash
# Initialize Dapr
dapr init

# Run locally with self-hosted mode
dapr run --app-id todo-backend --app-port 8000 -- python -m uvicorn app.main:app
```

### Cloud Deployment (Oracle OKE)

Apply all components to the cluster:

```bash
kubectl apply -f dapr-components/ -n todo-app
```

Verify components are registered:

```bash
kubectl get components -n todo-app
```

## Topics

### Pub/Sub Topics (kafka-pubsub)

| Topic | Publisher | Subscriber | Purpose |
|-------|-----------|------------|---------|
| `task-events` | todo-backend | todo-backend | Task lifecycle events (created, updated, completed, deleted) |
| `reminders` | Dapr Jobs | todo-backend | Reminder notifications triggered by scheduled jobs |

### State Keys (statestore)

| Key Pattern | Purpose | TTL |
|-------------|---------|-----|
| `conversation_{user_id}` | Chat conversation state | 7 days |
| `job_id_{job_id}` | Dapr Job metadata for cancellation | None |

## Secrets

Required Kubernetes secrets (create before applying components):

```bash
kubectl create secret generic todo-secrets \
  --from-literal=database-url="postgresql://user:pass@host:5432/dbname" \
  --from-literal=better-auth-secret="your-jwt-secret" \
  --from-literal=openai-api-key="sk-..." \
  -n todo-app
```

## Event Format

All events follow CloudEvents 1.0 specification:

```json
{
  "specversion": "1.0",
  "type": "todo.task.completed",
  "source": "/todo-backend",
  "id": "evt_abc123",
  "time": "2025-02-09T12:00:00Z",
  "datacontenttype": "application/json",
  "data": {
    "task_id": 123,
    "user_id": "user-abc",
    "title": "Buy groceries",
    "operation": "completed"
  }
}
```

## Troubleshooting

### Check Dapr sidecar logs

```bash
kubectl logs -f deployment/todo-backend -c daprd -n todo-app
```

### Check component registration

```bash
kubectl get components -n todo-app
kubectl describe component kafka-pubsub -n todo-app
```

### Test pub/sub connectivity

```bash
# From within the pod
kubectl exec -it deployment/todo-backend -n todo-app -- curl -v http://localhost:3500/v1.0/publish/kafka-pubsub/task-events -d '{"test":"data"}'
```

## References

- [Dapr Pub/Sub](https://docs.dapr.io/developing-applications/building-blocks/pubsub/)
- [Dapr State Management](https://docs.dapr.io/developing-applications/building-blocks/state-management/)
- [Dapr Secrets](https://docs.dapr.io/developing-applications/building-blocks/secrets/)
- [CloudEvents Spec](https://github.com/cloudevents/spec)
