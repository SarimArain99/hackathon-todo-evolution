# Dapr Skill (Distributed Application Runtime)

**Source**: Context7 MCP - `/websites/dapr_io`
**Benchmark Score**: 85.0 | **Code Snippets**: 4437 | **Reputation**: High

## Overview

Dapr is a portable, event-driven runtime that provides APIs as building blocks to simplify building resilient, portable microservices applications.

## Key Concepts

### 1. Pub/Sub Messaging

**Publish a message:**
```
POST /v1.0/publish/{pubsubname}/{topic}

Body: {"orderId": "12345", "status": "processed"}
```

**Python example:**
```python
import httpx

# Publish via Dapr sidecar (no Kafka library needed!)
await httpx.post(
    "http://localhost:3500/v1.0/publish/kafka-pubsub/task-events",
    json={"event_type": "created", "task_id": 1}
)
```

**Dapr Component Configuration:**
```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: kafka-pubsub
spec:
  type: pubsub.kafka
  version: v1
  metadata:
    - name: brokers
      value: "kafka:9092"
    - name: consumerGroup
      value: "todo-service"
```

### 2. State Management

**Save state:**
```python
import httpx

await httpx.post(
    "http://localhost:3500/v1.0/state/statestore",
    json=[{
        "key": f"conversation-{conv_id}",
        "value": {"messages": messages}
    }]
)
```

**Get state:**
```python
response = await httpx.get(
    f"http://localhost:3500/v1.0/state/statestore/conversation-{conv_id}"
)
```

**Dapr Component:**
```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: statestore
spec:
  type: state.postgresql
  version: v1
  metadata:
    - name: connectionString
      value: "host=neon.db user=... password=... dbname=todo"
```

### 3. Service Invocation

**Without Dapr:**
```javascript
fetch("http://backend-service:8000/api/chat", {...})
```

**With Dapr:**
```javascript
fetch("http://localhost:3500/v1.0/invoke/backend-service/method/api/chat", {...})
```

### 4. Secrets Management

**Dapr Component (Kubernetes Secrets):**
```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: kubernetes-secrets
spec:
  type: secretstores.kubernetes
  version: v1
```

**Access in App:**
```python
import httpx

response = await httpx.get(
    "http://localhost:3500/v1.0/secrets/kubernetes-secrets/openai-api-key"
)
api_key = response.json()["openai-api-key"]
```

### 5. Jobs API (Scheduled Reminders)

```python
import httpx
from datetime import datetime

async def schedule_reminder(task_id: int, remind_at: datetime, user_id: str):
    """Schedule reminder using Dapr Jobs API."""
    await httpx.post(
        f"http://localhost:3500/v1.0-alpha1/jobs/reminder-task-{task_id}",
        json={
            "dueTime": remind_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "data": {
                "task_id": task_id,
                "user_id": user_id,
                "type": "reminder"
            }
        }
    )

# Handle callback
@app.post("/api/jobs/trigger")
async def handle_job_trigger(request: Request):
    job_data = await request.json()
    if job_data["data"]["type"] == "reminder":
        await publish_event("reminders", "reminder.due", job_data["data"])
    return {"status": "SUCCESS"}
```

## Dapr Building Blocks for Todo App

| Building Block | Use Case |
|---------------|----------|
| **Pub/Sub** | Kafka abstraction for events |
| **State Management** | Conversation state storage |
| **Service Invocation** | Frontend → Backend communication |
| **Bindings** | Cron triggers for reminders |
| **Secrets Management** | API keys, DB credentials |

## Benefits

| Without Dapr | With Dapr |
|-------------|-----------|
| Import Kafka, Redis libraries | Single HTTP API for all |
| Connection strings in code | Dapr components (YAML config) |
| Manual retry logic | Built-in retries, circuit breakers |
| Service URLs hardcoded | Automatic service discovery |
| Vendor lock-in | Swap backends via config |

## Getting Started

```bash
# Install Dapr CLI
curl -fsSL https://raw.githubusercontent.com/dapr/cli/master/install/install.sh | bash

# Initialize Dapr on Kubernetes
dapr init -k

# Deploy components
kubectl apply -f dapr-components/

# Run app with Dapr sidecar
dapr run --app-id backend --app-port 8000 -- uvicorn main:app
```
