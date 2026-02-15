# Quickstart: Cloud Event-Driven Deployment (Phase V)

**Feature**: 001-cloud-event-driven-deployment
**Date**: 2025-02-09
**Purpose**: Developer guide for deploying and running Phase V

---

## Prerequisites

### Required Tools

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install Dapr CLI
curl -fsSL https://raw.githubusercontent.com/dapr/cli/master/install/install.sh | bash

# Install OCI CLI (Oracle Cloud)
# Download from: https://docs.oracle.com/en-us/iaas/Content/API/Concepts/cliconcepts.htm
```

### Cloud Accounts

1. **Oracle Cloud** - Always Free OKE tier
   - Sign up at: https://www.oracle.com/cloud/free/
   - Create OKE cluster (4 OCPUs, 24GB RAM)

2. **GitHub** - For Container Registry
   - Public repository required for free GHCR
   - Generate personal access token with `write:packages` scope

---

## Quickstart Guide

### Step 1: Create Oracle OKE Cluster

```bash
# Login to OCI
oci session authenticate

# Create OKE cluster (Always Free tier)
oci ce cluster create \
  --name todo-cluster \
  --compartment-id $COMPARTMENT_ID \
  --kubernetes-version "1.29.0" \
  --name todo-cluster \
  --options file://<(cat <<'EOF'
{
  "kubernetesVersion": "1.29.0",
  "options": {
    "serviceLbConfig": {
      "loadBalancerType": "public"
    }
  }
}
EOF
)

# Get kubeconfig
oci ce cluster create-kubeconfig \
  --cluster-id $CLUSTER_ID \
  --file $HOME/.kube/config \
  --token-version 2.0

# Verify connection
kubectl get nodes
```

### Step 2: Initialize Dapr on Cluster

```bash
# Install Dapr control plane
dapr init -k

# Verify Dapr installation
kubectl get pods -n dapr-system

# Expected output: 3 pods running
# NAME                                     READY   STATUS
# dapr-sentry-xxx                          1/1     Running
# dapr-sidecar-injector-xxx                1/1     Running
# dapr-placement-xxx                       1/1     Running
```

### Step 3: Install Redpanda (Kafka)

```bash
# Add Redpanda Helm repo
helm repo add redpanda https://charts.redpanda.com
helm repo update

# Install Redpanda (single replica for Always Free tier)
helm install redpanda redpanda/redpanda \
  --namespace todo-app \
  --create-namespace \
  --set statefulset.replicas=1 \
  --set resources.cpu.cores=1 \
  --set resources.memory.container.max=2Gi \
  --set storage.persistentVolume.size=10Gi

# Verify Redpanda
kubectl get pods -n todo-app -l app=redpanda
```

### Step 4: Create Dapr Components

```bash
# Create namespace for components
kubectl create namespace todo-app

# Apply Dapr components
kubectl apply -f dapr-components/
```

**Dapr Components** (`dapr-components/`):

```yaml
# kafka-pubsub.yaml
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
      value: "redpanda.todo-app.svc.cluster.local:9092"
    - name: consumerGroup
      value: "todo-service"
    - name: authRequired
      value: "false"
    - name: maxMessageBytes
      value: "1000000"
```

```yaml
# statestore.yaml
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

```yaml
# secretstore.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: kubernetes-secrets
  namespace: todo-app
spec:
  type: secretstores.kubernetes
  version: v1
```

### Step 5: Build and Push Docker Images

```bash
# Set variables
export GHCR_USERNAME="your-username"
export REPO_NAME="hackathon_2"
export TAG="0.2.0"

# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u $GHCR_USERNAME --password-stdin

# Build backend image
docker build -t ghcr.io/$GHCR_USERNAME/$REPO_NAME/backend:$TAG backend/
docker push ghcr.io/$GHCR_USERNAME/$REPO_NAME/backend:$TAG

# Build frontend image
docker build -t ghcr.io/$GHCR_USERNAME/$REPO_NAME/frontend:$TAG frontend/
docker push ghcr.io/$GHCR_USERNAME/$REPO_NAME/frontend:$TAG
```

### Step 6: Create Kubernetes Secrets

```bash
# Create secrets
kubectl create secret generic todo-secrets \
  --namespace todo-app \
  --from-literal=database-url="$DATABASE_URL" \
  --from-literal=better-auth-secret="$BETTER_AUTH_SECRET" \
  --from-literal=openai-api-key="$OPENAI_API_KEY"
```

### Step 7: Deploy Application

```bash
# Install/upgrade Helm chart
helm install todo ./helm/todo-app \
  --namespace todo-app \
  --values helm/todo-app/values-cloud.yaml \
  --set backend.image.repository="ghcr.io/$GHCR_USERNAME/$REPO_NAME/backend" \
  --set backend.image.tag="$TAG" \
  --set frontend.image.repository="ghcr.io/$GHCR_USERNAME/$REPO_NAME/frontend" \
  --set frontend.image.tag="$TAG"

# Wait for rollout
kubectl rollout status deployment/todo-backend -n todo-app
kubectl rollout status deployment/todo-frontend -n todo-app
```

### Step 8: Verify Deployment

```bash
# Check pods (should see 2/2 containers per pod - app + daprd)
kubectl get pods -n todo-app

# Expected output:
# NAME                              READY   STATUS
# todo-backend-xxx                  2/2     Running
# todo-frontend-xxx                 2/2     Running
# redpanda-0                        1/1     Running

# Check services
kubectl get svc -n todo-app

# Get application URL
kubectl get ingress -n todo-app
```

---

## Local Development with Dapr

### Running Backend with Dapr Sidecar

```bash
# Terminal 1: Start Dapr sidecar
dapr run \
  --app-id todo-backend \
  --app-port 8000 \
  --dapr-http-port 3500 \
  --components-path ./dapr-components \
  -- python -m uvicorn app.main:app --reload

# Terminal 2: Publish test event
curl -X POST http://localhost:3500/v1.0/publish/kafka-pubsub/task-events \
  -H "Content-Type: application/json" \
  -d '{"event_type": "created", "task_id": 1, "title": "Test"}'
```

### Running Frontend with Dapr Sidecar

```bash
# Start Dapr with Next.js
dapr run \
  --app-id todo-frontend \
  --app-port 3000 \
  --dapr-http-port 3501 \
  -- npm run dev
```

---

## Testing Event Flow

### 1. Verify Kafka Topics

```bash
# Port-forward to Redpanda
kubectl port-forward -n todo-app redpanda-0 9092:9092

# List topics (requires rpk CLI)
rkp topic list --brokers localhost:9092
# Expected: task-events, reminders
```

### 2. Publish Test Event

```bash
# Via Dapr CLI
dapr publish \
  --pubsub kafka-pubsub \
  --topic task-events \
  --data '{"event_type":"created","task_id":999}'
```

### 3. Check Event Logs

```bash
# Backend logs
kubectl logs -n todo-app -l app=backend -c backend --tail=50 -f

# Dapr sidecar logs
kubectl logs -n todo-app -l app=backend -c daprd --tail=50 -f
```

---

## Troubleshooting

### Dapr Sidecar Not Injecting

```bash
# Verify namespace annotation
kubectl get namespace todo-app -o yaml

# Add annotation if missing
kubectl annotate namespace todo-app dapr.io/enabled=true
```

### Events Not Publishing

```bash
# Check Dapr components
dapr components -k -n todo-app

# Check component logs
kubectl logs -n todo-app -l app=dapr-sidecar-injector
```

### Redpanda Connection Issues

```bash
# Check Redpanda status
kubectl exec -n todo-app redpanda-0 -- rpk cluster info

# Test connectivity from backend
kubectl exec -n todo-app todo-backend-xxx -c backend -- \
  curl -v redpanda.todo-app.svc.cluster.local:9092
```

---

## CI/CD Setup

### GitHub Actions Workflow

Create `.github/workflows/deploy.yaml`:

```yaml
name: Deploy to Cloud

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build & Push Backend
        run: |
          docker build -t ghcr.io/${{ github.repository }}/backend:${{ github.sha }} backend
          echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          docker push ghcr.io/${{ github.repository }}/backend:${{ github.sha }}

      - name: Build & Push Frontend
        run: |
          docker build -t ghcr.io/${{ github.repository }}/frontend:${{ github.sha }} frontend
          docker push ghcr.io/${{ github.repository }}/frontend:${{ github.sha }}

      - name: Deploy via Helm
        run: |
          helm upgrade todo ./helm/todo-app --install \
            --namespace todo-app \
            --set backend.image.repository=ghcr.io/${{ github.repository }}/backend \
            --set backend.image.tag=${{ github.sha }} \
            --set frontend.image.repository=ghcr.io/${{ github.repository }}/frontend \
            --set frontend.image.tag=${{ github.sha }}
```

---

## Monitoring

### Health Checks

```bash
# Backend health
kubectl exec -n todo-app todo-backend-xxx -c backend -- curl http://localhost:8000/health

# Database health
kubectl exec -n todo-app todo-backend-xxx -c backend -- curl http://localhost:8000/health/with-db
```

### Metrics

```bash
# Dapr metrics
kubectl port-forward -n todo-app svc/todo-backend-dapr 9090:9090
open http://localhost:9090/metrics
```

---

## Cleanup

```bash
# Uninstall application
helm uninstall todo -n todo-app

# Uninstall Redpanda
helm uninstall redpanda -n todo-app

# Uninstall Dapr
dapr uninstall -k

# Delete namespace
kubectl delete namespace todo-app
```
