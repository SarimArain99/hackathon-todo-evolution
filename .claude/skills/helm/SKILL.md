# Helm Skill

**Source**: Context7 MCP - `/websites/helm_sh`
**Benchmark Score**: 80.3 | **Code Snippets**: 1883 | **Reputation**: High

## Overview

Helm is the package manager for Kubernetes that helps you manage Kubernetes applications using charts.

## Key Concepts

### 1. Chart Structure

```
mychart/
├── Chart.yaml          # Chart metadata
├── values.yaml         # Default configuration values
├── charts/             # Subcharts directory
└── templates/          # Kubernetes manifest templates
    ├── deployment.yaml
    ├── service.yaml
    └── _helpers.tpl
```

### 2. Template with Values

```yaml
# templates/deployment.yaml
apiVersion: v1
kind: ReplicationController
metadata:
  name: deis-database
  namespace: deis
  labels:
    app.kubernetes.io/managed-by: deis
spec:
  replicas: 1
  selector:
    app.kubernetes.io/name: deis-database
  template:
    metadata:
      labels:
        app.kubernetes.io/name: deis-database
    spec:
      serviceAccount: deis-database
      containers:
        - name: deis-database
          image: {{ .Values.imageRegistry }}/postgres:{{ .Values.dockerTag }}
          imagePullPolicy: {{ .Values.pullPolicy }}
          ports:
            - containerPort: 5432
          env:
            - name: DATABASE_STORAGE
              value: {{ default "minio" .Values.storage }}
```

### 3. Values File

```yaml
# values.yaml
imageRegistry: docker.io
dockerTag: "14"
pullPolicy: IfNotPresent
storage: minio

replicaCount: 1

service:
  type: ClusterIP
  port: 80

resources:
  limits:
    cpu: 100m
    memory: 128Mi
  requests:
    cpu: 100m
    memory: 128Mi
```

### 4. Chart.yaml

```yaml
apiVersion: v2
name: todo-app
description: A Helm chart for Todo Application
type: application
version: 0.1.0
appVersion: "1.0.0"
```

## Template Language

### Variables
- `{{ .Values.key }}` - Access values.yaml
- `{{ .Release.Name }}` - Release name
- `{{ .Chart.Name }}` - Chart name
- `{{ .Release.Namespace }}` - Namespace

### Functions
- `{{ default "value" .Values.key }}` - Default value
- `{{ quote .Values.key }}` - Quote string
- `{{ .Values.key | upper }}` - Uppercase

### Conditionals
```yaml
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
...
{{- end }}
```

### Loops
```yaml
{{- range .Values.services }}
- name: {{ .name }}
  port: {{ .port }}
{{- end }}
```

## Hackathon Helm Structure

```
hackathon-todo/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── configmap.yaml
│   └── secret.yaml
```

## Helm Commands

```bash
# Create new chart
helm create mychart

# Install chart
helm install my-release ./mychart

# Install with custom values
helm install my-release ./mychart -f custom-values.yaml

# Upgrade release
helm upgrade my-release ./mychart

# List releases
helm list

# Uninstall release
helm uninstall my-release

# Dry run (preview)
helm install my-release ./mychart --dry-run --debug

# Package chart
helm package ./mychart

# Template rendering (debug)
helm template my-release ./mychart
```

## Best Practices

1. Use `_helpers.tpl` for reusable template snippets
2. Set resource limits and requests
3. Use ConfigMaps for non-sensitive configuration
4. Use Secrets for sensitive data
5. Define health checks (readiness/liveness probes)
6. Use meaningful release names
