# Quickstart: Local Kubernetes Deployment

**Feature**: 003-local-kubernetes
**Date**: 2026-01-23

## Overview

This guide provides step-by-step instructions for deploying the Todo Evolution application to a local Kubernetes cluster using Minikube and Helm.

---

## Prerequisites

| Tool     | Version | Installation                             |
| -------- | ------- | ---------------------------------------- |
| Docker   | Latest  | https://docs.docker.com/get-docker/      |
| Minikube | Latest  | https://minikube.sigs.k8s.io/docs/start/ |
| kubectl  | Latest  | https://kubernetes.io/docs/tasks/tools/  |
| Helm     | 3.x     | https://helm.sh/docs/intro/install/      |

**System Requirements**:

- 2+ CPUs
- 4+ GB RAM
- 20+ GB disk space

---

## Step 1: Start Minikube

Start Minikube with adequate resources:

```bash
minikube start --cpus=2 --memory=4096 --driver=docker
```

Enable the nginx ingress addon:

```bash
minikube addons enable ingress
```

Wait for the ingress controller to be ready:

```bash
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=300s
```

Verify Minikube is running:

```bash
kubectl get nodes
```

---

## Step 2: Build Docker Images

Build the backend and frontend Docker images:

```bash
# From repository root
docker build -t todo-backend:latest ./backend/
docker build -t todo-frontend:latest ./frontend/
```

Load images into Minikube:

```bash
minikube image load todo-backend:latest
minikube image load todo-frontend:latest
```

---

## Step 3: Deploy with Helm

Install the application using the Helm chart:

```bash
helm install todo ./helm/todo-app \
  --set backend.env.DATABASE_URL="sqlite:////app/data/todo.db" \
  --set backend.env.BETTER_AUTH_SECRET="your-secret-key-here" \
  --set backend.env.OPENAI_API_KEY="sk-your-openai-key"
```

Wait for all pods to be ready:

```bash
kubectl get pods -w
```

Expected output:

```
NAME                       READY   STATUS    RESTARTS   AGE
todo-backend-xxxxx-xxxxx   1/1     Running   0          30s
todo-frontend-xxxxx-xxxxx  1/1     Running   0          30s
```

---

## Step 4: Access the Application

### Option A: Use Ingress (recommended)

Add the ingress hostname to `/etc/hosts`:

```bash
echo "$(minikube ip) todo.local" | sudo tee -a /etc/hosts
```

Access the application:

```bash
# On macOS/Linux
open http://todo.local

# On Windows
start http://todo.local
```

### Option B: Use Port Forwarding

Forward the frontend service to localhost:

```bash
kubectl port-forward svc/frontend 3000:3000
```

Access at http://localhost:3000

---

## Step 5: Verify Deployment

Run these checks to verify everything is working:

```bash
# Check all pods are running
kubectl get pods

# Check services
kubectl get svc

# Check ingress
kubectl get ingress

# Check backend health
curl http://todo.local/api/health

# Check logs
kubectl logs -l app=backend
kubectl logs -l app=frontend
```

---

## Common Operations

### Scale the Application

```bash
# Scale backend to 3 replicas
helm upgrade todo ./helm/todo-app --set backend.replicas=3

# Scale frontend to 2 replicas
helm upgrade todo ./helm/todo-app --set frontend.replicas=2
```

### Update the Application

After making code changes:

```bash
# Rebuild images
docker build -t todo-backend:latest ./backend/
docker build -t todo-frontend:latest ./frontend/

# Load into Minikube
minikube image load todo-backend:latest
minikube image load todo-frontend:latest

# Upgrade deployment
helm upgrade todo ./helm/todo-app
```

### Rollback

```bash
# List revisions
helm history todo

# Rollback to previous version
helm rollback todo
```

### Uninstall

```bash
# Remove the application
helm uninstall todo

# Remove from /etc/hosts
sudo sed -i '/todo.local/d' /etc/hosts
```

---

## Troubleshooting

### Health Checks

Kubernetes health checks monitor pod health and automatically restart unhealthy containers.

**Health Check Endpoints**:

| Service  | Endpoint          | Purpose                    |
| -------- | ----------------- | -------------------------- |
| Backend  | GET /health       | Basic liveness/readiness   |
| Backend  | GET /health/with-db | Health with database verify |
| Frontend | GET /             | Frontend is serving pages  |

**Health Check Configuration**:

```yaml
# Backend probes (configured in Helm chart)
readinessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 10   # Wait 10s before first check
  periodSeconds: 5          # Check every 5s
  timeoutSeconds: 3         # Timeout after 3s
  failureThreshold: 3       # Fail after 3 consecutive failures

livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 15   # Wait 15s before first check
  periodSeconds: 10         # Check every 10s
  timeoutSeconds: 3         # Timeout after 3s
  failureThreshold: 3       # Restart after 3 consecutive failures
```

**Self-Healing Behavior**:

- If readiness probe fails: Pod is removed from service endpoints (no traffic sent)
- If liveness probe fails: Pod is automatically restarted
- Kubernetes creates replacement pod within 30 seconds

**Test Self-Healing**:

```bash
# Delete a backend pod and watch it restart
kubectl delete pod -l app=backend

# Watch the replacement being created
kubectl get pods -w

# Expected: New pod appears with STATUS=Running within 30s
```

**Expected Health Response**:

```json
{
  "status": "healthy",
  "timestamp": "2026-01-24T12:00:00",
  "version": "0.1.0"
}
```

### Pods Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name>

# Check logs
kubectl logs <pod-name>

# Common issues:
# - ImagePullBackOff: Image not loaded into Minikube
# - CrashLoopBackOff: Application error, check logs
```

### Ingress Not Working

```bash
# Check ingress controller is running
kubectl get pods -n ingress-nginx

# Check ingress resource
kubectl describe ingress todo-ingress

# Verify DNS
ping todo.local
```

### Resource Issues

```bash
# Check Minikube status
minikube status

# Increase resources
minikube stop
minikube start --cpus=4 --memory=8192
```

---

## Automated Deployment

Use the provided script for automated deployment:

```bash
./scripts/deploy-minikube.sh
```

This script:

1. Checks Minikube status
2. Enables ingress if needed
3. Builds Docker images
4. Loads images into Minikube
5. Installs/updates the Helm chart
6. Verifies deployment
7. Prints access URLs

---

## Next Steps

After successful local deployment:

- Test all user flows (signup, login, create tasks)
- Test scaling by increasing replicas
- Test health checks by deleting pods
- Test upgrade workflow
- Proceed to Phase V for cloud deployment
