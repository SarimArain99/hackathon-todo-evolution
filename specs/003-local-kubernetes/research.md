# Research: Local Kubernetes Deployment

**Feature**: 003-local-kubernetes
**Date**: 2026-01-23
**Phase**: 0 (Research & Technology Decisions)

## Overview

This document captures research findings and technology decisions for Phase 4 (Local Kubernetes Deployment). All decisions align with the constitution requirements and existing codebase.

---

## R1: Next.js Standalone Docker Output

### Question

Does Next.js 16 support standalone output for containerized deployment?

### Research Findings

Next.js 16 supports `output: 'standalone'` mode which creates a standalone server build optimized for containerization. This feature:

- Generates a minimal `.next/standalone` directory with only necessary files
- Creates a self-contained `server.js` for production serving
- Minimizes image size by excluding unused dependencies

### Decision

**Use Next.js standalone output for frontend Docker image.**

**Implementation**:

```javascript
// next.config.ts
const nextConfig = {
  output: "standalone",
};
```

**Dockerfile Pattern**:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

**Alternatives Rejected**:

- Full .next copy: Larger image size
- Custom server: More complexity, less maintained

---

## R2: FastAPI Multi-Stage Docker Build

### Question

What is the recommended multi-stage Docker pattern for FastAPI applications?

### Research Findings

FastAPI with Python 3.13 recommends:

- Multi-stage builds to minimize final image size
- Separate builder stage for dependencies
- Non-root user for security
- UV package manager for fast dependency resolution

### Decision

**Use multi-stage build with UV for backend.**

**Implementation**:

```dockerfile
# Builder stage
FROM python:3.13-slim AS builder
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
RUN pip install uv
COPY pyproject.toml requirements.txt* ./
RUN uv sync --no-dev || pip install -r requirements.txt

# Runtime stage
FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
RUN useradd -m -u 1000 appuser
COPY --from=builder /opt/venv /opt/venv || /usr/local
COPY --chown=appuser:appuser . .
USER appuser
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Alternatives Rejected**:

- Single stage: Larger image, includes build tools
- Poetry: More complex setup than UV

---

## R3: Minikube Ingress Configuration

### Question

How to enable nginx ingress in Minikube?

### Research Findings

Minikube includes an nginx ingress addon that must be explicitly enabled:

- Command: `minikube addons enable ingress`
- Requires additional startup time
- Creates `ingress-nginx` controller in `ingress-nginx` namespace
- Routes traffic based on Ingress resources

### Decision

**Enable nginx ingress in deployment script.**

**Implementation**:

```bash
minikube addons enable ingress
# Wait for ingress controller to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=300s
```

**Host Configuration**:

- Use `todo.local` as the local hostname
- Add to `/etc/hosts` or use Minikube tunnel

**Alternatives Rejected**:

- port-forward: More manual, less production-like
- LoadBalancer: Requires cloud provider (not local)

---

## R4: Image Loading Strategy for Minikube

### Question

How to load Docker images into Minikube without external registry?

### Research Findings

Minikube can load images directly from the host Docker daemon:

- Command: `minikube image load <image-name>:<tag>`
- Required when using Minikube's Docker driver (not required with podman)
- Images must be reloaded after each rebuild

### Decision

**Build images locally, then load into Minikube.**

**Implementation**:

```bash
# Build backend image
docker build -t todo-backend:latest backend/

# Build frontend image
docker build -t todo-frontend:latest frontend/

# Load both into Minikube
minikube image load todo-backend:latest
minikube image load todo-frontend:latest
```

**Workflow**:

1. Make code changes
2. Rebuild Docker images
3. Reload into Minikube
4. Restart deployments (`kubectl rollout restart`)

**Alternatives Rejected**:

- Docker Hub: Requires account, slower push/pull
- Local registry: Adds another service to manage
- Build inside Minikube: Slower, no caching

---

## R5: Resource Limits for Minikube Deployment

### Question

What are reasonable CPU/memory limits for FastAPI and Next.js in Minikube?

### Research Findings

Based on Kubernetes best practices and typical resource usage:

| Service | Request CPU | Limit CPU | Request Memory | Limit Memory |
| ------- | ----------- | --------- | -------------- | ------------ |
| FastAPI | 100m        | 200m      | 128Mi          | 256Mi        |
| Next.js | 100m        | 200m      | 128Mi          | 256Mi        |

**Notes**:

- `m` = millicore (100m = 0.1 CPU)
- `Mi` = Mebibyte (binary megabyte)
- Requests guarantee minimum resources
- Limits prevent resource exhaustion
- Minikube default: 2 CPUs, 2GB RAM (should be 4GB)

### Decision

**Use the above resource limits for both services.**

**Implementation in values.yaml**:

```yaml
backend:
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 200m
      memory: 256Mi

frontend:
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 200m
      memory: 256Mi
```

**Minikube Recommendations**:

- Start Minikube with 4+ GB RAM: `minikube start --memory=4096`
- Start with 2+ CPUs: `minikube start --cpus=2`

---

## Additional Decisions

### AD-004: Health Check Configuration

**Decision**: Use existing `/health` endpoint with conservative timeouts.

**Implementation**:

```yaml
readinessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3

livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 15
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 3
```

### AD-005: Database Configuration for Minikube

**Decision**: Use SQLite with persistent volume claim (optional).

For simplicity in local deployment:

- Default: In-memory SQLite (ephemeral)
- Optional: PVC for persistence (documented in quickstart)

**Environment Variable**:

```yaml
DATABASE_URL: "sqlite:////app/data/todo.db"
```

---

## Technology Summary

| Technology    | Version   | Purpose                  |
| ------------- | --------- | ------------------------ |
| Docker        | Latest    | Container runtime        |
| Minikube      | Latest    | Local Kubernetes cluster |
| Helm          | 3.x       | Package manager          |
| nginx ingress | Latest    | Ingress controller       |
| Python        | 3.13-slim | Backend runtime          |
| Node.js       | 20-alpine | Frontend runtime         |

---

## References

- Next.js Docker Deployment: https://nextjs.org/docs/deployment
- FastAPI Docker: https://fastapi.tiangolo.com/deployment/docker/
- Minikube Ingress: https://minikube.sigs.k8s.io/docs/handbook/ingress/
- Helm Best Practices: https://helm.sh/docs/chart_best_practices/
