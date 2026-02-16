# Minikube Deployment Guide

**Feature**: 001-hackathon-todo-evolution (Phase IV: Local Kubernetes Deployment)
**Last Updated**: 2025-02-09

---

## Overview

This guide covers deploying the Todo Evolution application to a local Kubernetes cluster using Minikube. The application consists of:
- **Backend**: FastAPI Python application
- **Frontend**: Next.js React application
- **Database**: SQLite (development) or PostgreSQL (production)

---

## Prerequisites

### Required Software

| Software | Version | Installation |
|----------|---------|--------------|
| Minikube | Latest | https://minikube.sigs.k8s.io/docs/start/ |
| kubectl | Matches K8s version | https://kubernetes.io/docs/tasks/tools/ |
| Helm | 3.x | https://helm.sh/docs/intro/install/ |
| Docker | Latest | https://docs.docker.com/get-docker/ |

### Verify Installation

```bash
minikube version
kubectl version --client
helm version
docker --version
```

---

## Quick Start

### 1. Start Minikube

```bash
# Start Minikube with required resources
minikube start \
  --driver=docker \
  --cpus=4 \
  --memory=8192 \
  --disk-size=20gb \
  --addons=ingress

# Verify ingress is enabled
minikube addons enable ingress
```

### 2. Build Container Images

```bash
# Build backend image
cd backend
docker build -t todo-backend:latest .

# Build frontend image
cd ../frontend
docker build -t todo-frontend:latest .
```

### 3. Load Images into Minikube

```bash
# Load images into Minikube's Docker registry
minikube image load todo-backend:latest
minikube image load todo-frontend:latest
```

### 4. Install Application via Helm

```bash
# From project root
helm install todo-app ./helm/todo-app \
  --namespace todo-app \
  --create-namespace \
  --set backend.env.DATABASE_URL="sqlite:////app/data/todo.db" \
  --set backend.env.BETTER_AUTH_SECRET="your-secret-key-here" \
  --set backend.env.OPENAI_API_KEY="your-openai-key-here"
```

### 5. Access the Application

```bash
# Add todo.local to /etc/hosts
echo "$(minikube ip) todo.local" | sudo tee -a /etc/hosts

# Open in browser
open http://todo.local
```

---

## Automated Deployment Script

A deployment script is provided at `scripts/deploy-minikube.sh`:

```bash
# Run full deployment
./scripts/deploy-minikube.sh

# Run with custom values
./scripts/deploy-minikube.sh --namespace custom-ns --release todo-prod
```

### Script Features

- ✅ Starts Minikube with recommended settings
- ✅ Enables ingress addon
- ✅ Builds Docker images
- ✅ Loads images into Minikube
- ✅ Installs Helm chart with secrets
- ✅ Configures DNS (/etc/hosts)
- ✅ Verifies deployment health

---

## Helm Chart Configuration

### Values Overview

The Helm chart at `helm/todo-app` accepts the following configuration:

```yaml
# Backend Configuration
backend:
  name: backend
  image:
    repository: todo-backend
    tag: latest
  replicas: 1
  port: 8000
  resources:
    limits:
      cpu: 200m
      memory: 256Mi
    requests:
      cpu: 100m
      memory: 128Mi
  env:
    DATABASE_URL: ""        # Set via --set or secret
    BETTER_AUTH_SECRET: ""   # Set via --set or secret
    OPENAI_API_KEY: ""       # Set via --set or secret

# Frontend Configuration
frontend:
  name: frontend
  image:
    repository: todo-frontend
    tag: latest
  replicas: 1
  port: 3000
  resources:
    limits:
      cpu: 200m
      memory: 256Mi
    requests:
      cpu: 100m
      memory: 128Mi
  env:
    NEXT_PUBLIC_API_URL: "http://backend:8000"

# Ingress Configuration
ingress:
  enabled: true
  className: nginx
  host: todo.local

# PostgreSQL (optional, disabled by default)
postgres:
  enabled: false
  database: todo_db
  storage: 1Gi
```

### Production Values

For production deployment with PostgreSQL:

```bash
helm install todo-app ./helm/todo-app \
  --namespace todo-app \
  --create-namespace \
  --values helm/todo-app/values-cloud.yaml \
  --set postgres.enabled=true \
  --set postgres.user=todo_user \
  --set postgres.password=secure_password \
  --set backend.env.DATABASE_URL="postgresql+asyncpg://todo_user:secure_password@postgres:5432/todo_db"
```

---

## Verification

### Check Pod Status

```bash
# List all pods
kubectl get pods -n todo-app

# Expected output:
# NAME                        READY   STATUS    RESTARTS   AGE
# backend-xxxxxxxxx-xxxxx    1/1     Running   0          1m
# frontend-xxxxxxxxx-xxxxx   1/1     Running   0          1m
```

### Check Services

```bash
# List services
kubectl get svc -n todo-app

# Expected output:
# NAME       TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)    AGE
# backend    ClusterIP   10.100.200.100    <none>        8000/TCP   1m
# frontend   ClusterIP   10.100.200.200    <none>        3000/TCP   1m
```

### Check Ingress

```bash
# List ingress
kubectl get ingress -n todo-app

# Expected output:
# NAME       CLASS   HOSTS         ADDRESS         PORTS   AGE
# todo-app   nginx   todo.local    192.168.49.2    80      1m
```

### Port Forwarding (Alternative)

If ingress is not working:

```bash
# Forward frontend
kubectl port-forward -n todo-app svc/frontend 3000:3000

# Forward backend
kubectl port-forward -n todo-app svc/backend 8000:8000
```

---

## Troubleshooting

### Issue: Images Not Found

```bash
# Verify images are loaded
minikube image list | grep todo

# Re-load images
minikube image load todo-backend:latest
minikube image load todo-frontend:latest
```

### Issue: Pods Not Starting

```bash
# Check pod logs
kubectl logs -n todo-app deployment/backend
kubectl logs -n todo-app deployment/frontend

# Describe pod for events
kubectl describe pod -n todo-app <pod-name>
```

### Issue: Ingress Not Working

```bash
# Verify ingress addon is enabled
minikube addons list

# Enable ingress
minikube addons enable ingress

# Restart ingress controller
minikube stop
minikube start
```

### Issue: Database Connection Errors

For SQLite:
- Ensure DATABASE_URL is set: `sqlite:////app/data/todo.db`
- Check backend logs for file permission errors

For PostgreSQL:
- Ensure postgres.enabled=true
- Verify DATABASE_URL includes credentials
- Check postgres pod is running: `kubectl get pods -n todo-app -l app=postgres`

---

## Uninstallation

```bash
# Uninstall Helm release
helm uninstall todo-app -n todo-app

# Delete namespace
kubectl delete namespace todo-app

# Remove DNS entry
sudo sed -i '/todo.local/d' /etc/hosts

# Optional: Stop Minikube
minikube stop
```

---

## Development Workflow

### Iterating on Backend

```bash
# 1. Build new image
cd backend
docker build -t todo-backend:latest .

# 2. Load into Minikube
minikube image load todo-backend:latest

# 3. Restart deployment
kubectl rollout restart deployment/backend -n todo-app

# 4. Stream logs
kubectl logs -f -n todo-app deployment/backend
```

### Iterating on Frontend

```bash
# 1. Build new image
cd frontend
docker build -t todo-frontend:latest .

# 2. Load into Minikube
minikube image load todo-frontend:latest

# 3. Restart deployment
kubectl rollout restart deployment/frontend -n todo-app

# 4. Stream logs
kubectl logs -f -n todo-app deployment/frontend
```

### Hot Reload (Development Only)

For local development without rebuilding:

```bash
# Use minikube mount to sync local files
minikube mount /path/to/backend:/app/backend
```

---

## Next Steps

After successful local deployment:
1. Test all features (auth, tasks, chat)
2. Verify database persistence
3. Check resource usage with `kubectl top`
4. Review logs for errors
5. Proceed to Phase V: Cloud Deployment

---

## References

- [Minikube Documentation](https://minikube.sigs.k8s.io/docs/)
- [Helm Documentation](https://helm.sh/docs/)
- [Kubectl Documentation](https://kubernetes.io/docs/reference/kubectl/)
- [Project Tasks](/specs/001-hackathon-todo-evolution/tasks.md)
