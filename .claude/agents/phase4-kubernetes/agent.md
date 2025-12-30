# Phase IV: Local Kubernetes Subagent

**Purpose**: Containerize and deploy the Todo application to local Kubernetes using Docker, Helm, and Minikube.
**Phase**: IV (Container Orchestration)
**Points**: 250

## Capabilities

This agent specializes in:
- Docker multi-stage builds
- Helm chart development
- Kubernetes resource management
- Minikube local deployment
- Container networking and services

## Skills Referenced

- `.claude/skills/helm/SKILL.md`
- Docker best practices
- Kubernetes fundamentals

## Task Execution Protocol

### 1. Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM python:3.13-slim AS builder

WORKDIR /app
RUN pip install uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

FROM python:3.13-slim AS runtime

WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
COPY . .

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2. Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
```

### 3. Helm Chart Structure

```
helm/todo-app/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── _helpers.tpl
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   └── ingress.yaml
```

### 4. Chart.yaml

```yaml
# helm/todo-app/Chart.yaml
apiVersion: v2
name: todo-app
description: Hackathon Todo Application
type: application
version: 0.1.0
appVersion: "1.0.0"
```

### 5. values.yaml

```yaml
# helm/todo-app/values.yaml
# Global settings
global:
  namespace: todo-app

# Backend configuration
backend:
  name: backend
  image:
    repository: todo-backend
    tag: latest
    pullPolicy: IfNotPresent
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
    DATABASE_URL: ""  # Set via secret
    BETTER_AUTH_SECRET: ""  # Set via secret

# Frontend configuration
frontend:
  name: frontend
  image:
    repository: todo-frontend
    tag: latest
    pullPolicy: IfNotPresent
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

# Ingress configuration
ingress:
  enabled: true
  className: nginx
  host: todo.local
```

### 6. Backend Deployment

```yaml
# helm/todo-app/templates/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Values.backend.name }}
  labels:
    app: {{ .Values.backend.name }}
spec:
  replicas: {{ .Values.backend.replicas }}
  selector:
    matchLabels:
      app: {{ .Values.backend.name }}
  template:
    metadata:
      labels:
        app: {{ .Values.backend.name }}
    spec:
      containers:
        - name: {{ .Values.backend.name }}
          image: "{{ .Values.backend.image.repository }}:{{ .Values.backend.image.tag }}"
          imagePullPolicy: {{ .Values.backend.image.pullPolicy }}
          ports:
            - containerPort: {{ .Values.backend.port }}
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: todo-secrets
                  key: database-url
            - name: BETTER_AUTH_SECRET
              valueFrom:
                secretKeyRef:
                  name: todo-secrets
                  key: auth-secret
          resources:
            {{- toYaml .Values.backend.resources | nindent 12 }}
          readinessProbe:
            httpGet:
              path: /health
              port: {{ .Values.backend.port }}
            initialDelaySeconds: 10
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /health
              port: {{ .Values.backend.port }}
            initialDelaySeconds: 15
            periodSeconds: 10
```

### 7. Backend Service

```yaml
# helm/todo-app/templates/backend-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ .Values.backend.name }}
spec:
  type: ClusterIP
  ports:
    - port: {{ .Values.backend.port }}
      targetPort: {{ .Values.backend.port }}
      protocol: TCP
  selector:
    app: {{ .Values.backend.name }}
```

### 8. Frontend Deployment

```yaml
# helm/todo-app/templates/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Values.frontend.name }}
  labels:
    app: {{ .Values.frontend.name }}
spec:
  replicas: {{ .Values.frontend.replicas }}
  selector:
    matchLabels:
      app: {{ .Values.frontend.name }}
  template:
    metadata:
      labels:
        app: {{ .Values.frontend.name }}
    spec:
      containers:
        - name: {{ .Values.frontend.name }}
          image: "{{ .Values.frontend.image.repository }}:{{ .Values.frontend.image.tag }}"
          imagePullPolicy: {{ .Values.frontend.image.pullPolicy }}
          ports:
            - containerPort: {{ .Values.frontend.port }}
          env:
            - name: NEXT_PUBLIC_API_URL
              value: {{ .Values.frontend.env.NEXT_PUBLIC_API_URL }}
          resources:
            {{- toYaml .Values.frontend.resources | nindent 12 }}
          readinessProbe:
            httpGet:
              path: /
              port: {{ .Values.frontend.port }}
            initialDelaySeconds: 10
            periodSeconds: 5
```

### 9. Secrets

```yaml
# helm/todo-app/templates/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: todo-secrets
type: Opaque
stringData:
  database-url: {{ .Values.backend.env.DATABASE_URL | quote }}
  auth-secret: {{ .Values.backend.env.BETTER_AUTH_SECRET | quote }}
```

### 10. Ingress

```yaml
# helm/todo-app/templates/ingress.yaml
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: todo-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: {{ .Values.ingress.className }}
  rules:
    - host: {{ .Values.ingress.host }}
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: {{ .Values.backend.name }}
                port:
                  number: {{ .Values.backend.port }}
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {{ .Values.frontend.name }}
                port:
                  number: {{ .Values.frontend.port }}
{{- end }}
```

## Deployment Commands

```bash
# Start Minikube
minikube start --driver=docker

# Enable ingress addon
minikube addons enable ingress

# Build images in Minikube's Docker
eval $(minikube docker-env)
docker build -t todo-backend:latest ./backend
docker build -t todo-frontend:latest ./frontend

# Install Helm chart
helm install todo ./helm/todo-app \
  --set backend.env.DATABASE_URL="postgresql://..." \
  --set backend.env.BETTER_AUTH_SECRET="your-secret"

# Check deployment status
kubectl get pods
kubectl get services
kubectl get ingress

# Access via tunnel
minikube tunnel

# Or port-forward for testing
kubectl port-forward svc/frontend 3000:3000
kubectl port-forward svc/backend 8000:8000

# View logs
kubectl logs -l app=backend -f
kubectl logs -l app=frontend -f

# Upgrade after changes
helm upgrade todo ./helm/todo-app

# Uninstall
helm uninstall todo
```

## Acceptance Criteria

- [ ] Backend Dockerfile with multi-stage build
- [ ] Frontend Dockerfile with standalone output
- [ ] Helm chart with all templates
- [ ] ConfigMap and Secrets for configuration
- [ ] Health checks (readiness/liveness probes)
- [ ] Resource limits set
- [ ] Ingress for routing
- [ ] Successful deployment to Minikube
- [ ] All pods running and healthy
- [ ] Services accessible via ingress

## Troubleshooting

```bash
# Check pod status
kubectl describe pod <pod-name>

# View events
kubectl get events --sort-by=.metadata.creationTimestamp

# Check resource usage
kubectl top pods

# Debug networking
kubectl exec -it <pod-name> -- sh
```

## Handoff to Phase V

Upon completion, this agent provides:
1. Docker images for all services
2. Helm charts for Kubernetes
3. Local deployment validated
4. Health checks configured

Phase V agent will:
- Add Dapr sidecars
- Configure Kafka/Redpanda
- Deploy to cloud Kubernetes (DOKS/AKS/GKE)
