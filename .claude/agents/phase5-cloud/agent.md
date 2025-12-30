# Phase V: Cloud Deployment Subagent

**Purpose**: Deploy the Todo application to cloud Kubernetes with Dapr, Kafka/Redpanda for event streaming and distributed runtime.
**Phase**: V (Cloud Native)
**Points**: 300

## Capabilities

This agent specializes in:
- Dapr distributed application runtime
- Kafka/Redpanda event streaming
- Cloud Kubernetes deployment (DOKS/AKS/GKE)
- Pub/Sub messaging patterns
- State management and secrets

## Skills Referenced

- `.claude/skills/dapr/SKILL.md`
- `.claude/skills/kafka-python/SKILL.md`
- `.claude/skills/helm/SKILL.md`

## Task Execution Protocol

### 1. Dapr Components Configuration

#### Kafka Pub/Sub Component

```yaml
# dapr-components/kafka-pubsub.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: kafka-pubsub
  namespace: todo-app
spec:
  type: pubsub.kafka
  version: v1
  metadata:
    - name: brokers
      value: "redpanda:9092"  # or kafka:9092
    - name: consumerGroup
      value: "todo-service"
    - name: authRequired
      value: "false"
    - name: maxMessageBytes
      value: "1000000"
```

#### State Store Component (PostgreSQL)

```yaml
# dapr-components/statestore.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: statestore
  namespace: todo-app
spec:
  type: state.postgresql
  version: v1
  metadata:
    - name: connectionString
      secretKeyRef:
        name: todo-secrets
        key: database-url
```

#### Secrets Store Component

```yaml
# dapr-components/secretstore.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: kubernetes-secrets
  namespace: todo-app
spec:
  type: secretstores.kubernetes
  version: v1
```

### 2. Event Publishing with Dapr

```python
# backend/app/events.py
import httpx
from datetime import datetime

DAPR_HTTP_PORT = 3500

async def publish_task_event(event_type: str, task_data: dict, user_id: str):
    """Publish task event to Kafka via Dapr."""
    event = {
        "event_type": event_type,  # created, updated, completed, deleted
        "task_id": task_data.get("id"),
        "task_data": task_data,
        "user_id": user_id,
        "timestamp": datetime.utcnow().isoformat()
    }

    async with httpx.AsyncClient() as client:
        await client.post(
            f"http://localhost:{DAPR_HTTP_PORT}/v1.0/publish/kafka-pubsub/task-events",
            json=event
        )

async def publish_reminder(task_id: int, title: str, remind_at: str, user_id: str):
    """Publish reminder event."""
    event = {
        "task_id": task_id,
        "title": title,
        "remind_at": remind_at,
        "user_id": user_id,
        "timestamp": datetime.utcnow().isoformat()
    }

    async with httpx.AsyncClient() as client:
        await client.post(
            f"http://localhost:{DAPR_HTTP_PORT}/v1.0/publish/kafka-pubsub/reminders",
            json=event
        )
```

### 3. Event Subscription

```python
# backend/app/subscribers.py
from fastapi import APIRouter, Request

router = APIRouter()

@router.post("/dapr/subscribe")
async def subscribe():
    """Dapr subscription configuration."""
    return [
        {
            "pubsubname": "kafka-pubsub",
            "topic": "task-events",
            "route": "/events/tasks"
        },
        {
            "pubsubname": "kafka-pubsub",
            "topic": "reminders",
            "route": "/events/reminders"
        }
    ]

@router.post("/events/tasks")
async def handle_task_event(request: Request):
    """Handle task events from Kafka."""
    event = await request.json()
    event_type = event.get("data", {}).get("event_type")

    if event_type == "created":
        # Could trigger notifications, analytics, etc.
        print(f"Task created: {event['data']}")
    elif event_type == "completed":
        print(f"Task completed: {event['data']}")

    return {"status": "SUCCESS"}

@router.post("/events/reminders")
async def handle_reminder_event(request: Request):
    """Handle reminder events."""
    event = await request.json()
    data = event.get("data", {})

    # Send notification (webhook, email, push, etc.)
    print(f"Reminder triggered for task {data.get('task_id')}: {data.get('title')}")

    return {"status": "SUCCESS"}
```

### 4. State Management with Dapr

```python
# backend/app/conversation_state.py
import httpx
import json

DAPR_HTTP_PORT = 3500
STATE_STORE = "statestore"

async def save_conversation(conv_id: str, messages: list):
    """Save conversation state via Dapr."""
    async with httpx.AsyncClient() as client:
        await client.post(
            f"http://localhost:{DAPR_HTTP_PORT}/v1.0/state/{STATE_STORE}",
            json=[{
                "key": f"conversation-{conv_id}",
                "value": {"messages": messages}
            }]
        )

async def get_conversation(conv_id: str) -> list:
    """Retrieve conversation state via Dapr."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"http://localhost:{DAPR_HTTP_PORT}/v1.0/state/{STATE_STORE}/conversation-{conv_id}"
        )
        if response.status_code == 200 and response.text:
            data = response.json()
            return data.get("messages", [])
        return []
```

### 5. Secrets Access with Dapr

```python
# backend/app/secrets.py
import httpx

DAPR_HTTP_PORT = 3500

async def get_secret(secret_name: str) -> str:
    """Retrieve secret via Dapr secrets API."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"http://localhost:{DAPR_HTTP_PORT}/v1.0/secrets/kubernetes-secrets/{secret_name}"
        )
        data = response.json()
        return data.get(secret_name)

# Usage
openai_key = await get_secret("openai-api-key")
```

### 6. Updated Helm Values for Dapr

```yaml
# helm/todo-app/values-cloud.yaml
# Cloud-specific overrides

backend:
  replicas: 2
  dapr:
    enabled: true
    appId: "todo-backend"
    appPort: 8000

frontend:
  replicas: 2
  dapr:
    enabled: true
    appId: "todo-frontend"
    appPort: 3000

# Redpanda/Kafka
kafka:
  enabled: true
  brokers: "redpanda:9092"

# Dapr
dapr:
  enabled: true
```

### 7. Dapr-Enabled Deployment

```yaml
# helm/todo-app/templates/backend-deployment-dapr.yaml
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
        {{- if .Values.dapr.enabled }}
        dapr.io/enabled: "true"
        dapr.io/app-id: "{{ .Values.backend.dapr.appId }}"
        dapr.io/app-port: "{{ .Values.backend.dapr.appPort }}"
        dapr.io/enable-api-logging: "true"
        {{- end }}
    spec:
      containers:
        - name: {{ .Values.backend.name }}
          image: "{{ .Values.backend.image.repository }}:{{ .Values.backend.image.tag }}"
          ports:
            - containerPort: {{ .Values.backend.port }}
          # ... rest of container spec
```

### 8. Redpanda Deployment

```yaml
# helm/redpanda/values.yaml
# Simplified Redpanda for hackathon
image:
  repository: redpandadata/redpanda
  tag: latest

resources:
  limits:
    cpu: 1
    memory: 2Gi

storage:
  persistentVolume:
    enabled: true
    size: 10Gi
```

## Cloud Deployment Commands

```bash
# Install Dapr on Kubernetes
dapr init -k

# Apply Dapr components
kubectl apply -f dapr-components/

# Deploy Redpanda (or use managed Kafka)
helm repo add redpanda https://charts.redpanda.com
helm install redpanda redpanda/redpanda -n todo-app

# Deploy application with Dapr
helm install todo ./helm/todo-app -f values-cloud.yaml \
  --set backend.env.DATABASE_URL="postgresql://..." \
  --set backend.env.BETTER_AUTH_SECRET="..."

# Verify Dapr sidecars
kubectl get pods -n todo-app
# Each pod should show 2/2 containers (app + daprd)

# Check Dapr components
dapr components -k -n todo-app

# View Dapr logs
kubectl logs -l app=backend -c daprd -f

# Test pub/sub
dapr publish --pubsub kafka-pubsub --topic task-events --data '{"test": true}'
```

## Event Flow Architecture

```
┌─────────────┐     ┌────────────┐     ┌─────────────────┐
│   Frontend  │────▶│   Backend  │────▶│  Dapr Sidecar   │
│  (Next.js)  │     │  (FastAPI) │     │    (daprd)      │
└─────────────┘     └────────────┘     └────────┬────────┘
                                                 │
                         Dapr Pub/Sub API        │
                                                 ▼
                    ┌────────────────────────────────────┐
                    │         Kafka / Redpanda           │
                    │  Topics: task-events, reminders    │
                    └───────────────┬────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            ▼                       ▼                       ▼
    ┌───────────────┐      ┌───────────────┐      ┌───────────────┐
    │  Notification │      │   Analytics   │      │   WebSocket   │
    │    Service    │      │    Service    │      │    Service    │
    └───────────────┘      └───────────────┘      └───────────────┘
```

## Kafka Topics

| Topic | Producer | Consumers | Purpose |
|-------|----------|-----------|---------|
| task-events | Backend | Analytics, Notifications | All task CRUD operations |
| reminders | Backend | Notification Service | Scheduled reminder triggers |
| task-updates | Backend | WebSocket Service | Real-time sync to clients |

## Acceptance Criteria

- [ ] Dapr installed and configured on cluster
- [ ] Kafka/Redpanda running with required topics
- [ ] Pub/Sub component working
- [ ] State store component working
- [ ] Secrets component working
- [ ] Events published on task operations
- [ ] Event subscribers receiving messages
- [ ] Conversation state persisted via Dapr
- [ ] All services deployed to cloud K8s
- [ ] Zero direct Kafka library imports (Dapr abstracts)

## Cloud Provider Specifics

### DigitalOcean (DOKS)
```bash
doctl kubernetes cluster create todo-cluster --region nyc1 --size s-2vcpu-4gb --count 3
doctl kubernetes cluster kubeconfig save todo-cluster
```

### Azure (AKS)
```bash
az aks create --resource-group todo-rg --name todo-cluster --node-count 3 --node-vm-size Standard_B2s
az aks get-credentials --resource-group todo-rg --name todo-cluster
```

### Google Cloud (GKE)
```bash
gcloud container clusters create todo-cluster --zone us-central1-a --num-nodes 3 --machine-type e2-medium
gcloud container clusters get-credentials todo-cluster --zone us-central1-a
```

## Completion

Upon successful deployment:
- Full cloud-native Todo application running
- Event-driven architecture with Dapr
- Scalable microservices on Kubernetes
- Hackathon Phase V complete (+300 points)
