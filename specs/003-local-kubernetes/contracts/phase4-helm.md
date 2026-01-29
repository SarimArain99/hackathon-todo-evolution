# Phase IV: Helm Chart Contract

**Type**: Kubernetes Helm Chart
**Chart Name**: todo-app
**Version**: 0.1.0

## Chart Structure

```
helm/todo-app/
├── Chart.yaml
├── values.yaml
├── values-cloud.yaml
└── templates/
    ├── _helpers.tpl
    ├── backend-deployment.yaml
    ├── backend-service.yaml
    ├── frontend-deployment.yaml
    ├── frontend-service.yaml
    ├── configmap.yaml
    ├── secret.yaml
    └── ingress.yaml
```

## values.yaml Schema

```yaml
# Global
global:
  namespace: todo-app

# Backend
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
    DATABASE_URL: ""       # Set via --set or values-cloud.yaml
    BETTER_AUTH_SECRET: "" # Set via --set or values-cloud.yaml
    OPENAI_API_KEY: ""     # Set via --set or values-cloud.yaml

# Frontend
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

# Ingress
ingress:
  enabled: true
  className: nginx
  host: todo.local
  annotations: {}

# Dapr (Phase V only)
dapr:
  enabled: false  # Set to true in values-cloud.yaml
```

## Deployment Specifications

### Backend Deployment

```yaml
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
      {{- if .Values.dapr.enabled }}
      annotations:
        dapr.io/enabled: "true"
        dapr.io/app-id: "todo-backend"
        dapr.io/app-port: "{{ .Values.backend.port }}"
      {{- end }}
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
            - name: OPENAI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: todo-secrets
                  key: openai-api-key
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

### Frontend Deployment

```yaml
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

### Services

```yaml
# Backend Service
apiVersion: v1
kind: Service
metadata:
  name: {{ .Values.backend.name }}
spec:
  type: ClusterIP
  ports:
    - port: {{ .Values.backend.port }}
      targetPort: {{ .Values.backend.port }}
  selector:
    app: {{ .Values.backend.name }}

---
# Frontend Service
apiVersion: v1
kind: Service
metadata:
  name: {{ .Values.frontend.name }}
spec:
  type: ClusterIP
  ports:
    - port: {{ .Values.frontend.port }}
      targetPort: {{ .Values.frontend.port }}
  selector:
    app: {{ .Values.frontend.name }}
```

### Ingress

```yaml
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: todo-ingress
  annotations:
    {{- toYaml .Values.ingress.annotations | nindent 4 }}
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

### Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: todo-secrets
type: Opaque
stringData:
  database-url: {{ .Values.backend.env.DATABASE_URL | quote }}
  auth-secret: {{ .Values.backend.env.BETTER_AUTH_SECRET | quote }}
  openai-api-key: {{ .Values.backend.env.OPENAI_API_KEY | quote }}
```

## Helm Commands

### Install (Local/Minikube)

```bash
helm install todo ./helm/todo-app \
  --set backend.env.DATABASE_URL="postgresql://..." \
  --set backend.env.BETTER_AUTH_SECRET="secret" \
  --set backend.env.OPENAI_API_KEY="sk-..."
```

### Install (Cloud with Dapr)

```bash
helm install todo ./helm/todo-app \
  -f ./helm/todo-app/values-cloud.yaml \
  --set backend.env.DATABASE_URL="postgresql://..." \
  --set backend.env.BETTER_AUTH_SECRET="secret" \
  --set backend.env.OPENAI_API_KEY="sk-..."
```

### Upgrade

```bash
helm upgrade todo ./helm/todo-app
```

### Uninstall

```bash
helm uninstall todo
```

### Template Debug

```bash
helm template todo ./helm/todo-app --debug
```

## Docker Images

### Backend Dockerfile

```dockerfile
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

### Frontend Dockerfile

```dockerfile
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

## Health Check Endpoints

### Backend

```
GET /health

Response 200:
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-01-01T00:00:00Z"
}

Response 503:
{
  "status": "unhealthy",
  "database": "disconnected",
  "error": "Connection refused"
}
```

### Frontend

```
GET /

Response 200: HTML page (Next.js app)
```
