# Data Model: Kubernetes Resources

**Feature**: 003-local-kubernetes
**Date**: 2026-01-23

## Overview

This document defines the Kubernetes resource entities for the Local Kubernetes Deployment phase. Unlike traditional data models that define database entities, this phase's "data model" consists of Kubernetes manifests that define how the application is deployed.

---

## Resource Entities

### Deployment

**Purpose**: Manages replicated pods for the application.

**Entity Definition**:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: <service-name>
spec:
  replicas: 1
  selector:
    matchLabels:
      app: <service-name>
  template:
    metadata:
      labels:
        app: <service-name>
    spec:
      containers:
        - name: <service-name>
          image: <image>:<tag>
          ports:
            - containerPort: <port>
          env:
            - name: <ENV_VAR>
              valueFrom:
                configMapRef/secretKeyRef:
                  name: <name>
                  key: <key>
          resources:
            requests:
              cpu: <amount>
              memory: <amount>
            limits:
              cpu: <amount>
              memory: <amount>
          readinessProbe:
            httpGet:
              path: <health-path>
              port: <port>
          livenessProbe:
            httpGet:
              path: <health-path>
              port: <port>
```

**Attributes**:
| Attribute | Type | Description |
|-----------|------|-------------|
| metadata.name | string | Name of the deployment |
| spec.replicas | integer | Number of desired pod replicas |
| spec.selector | LabelSelector | Label selector for pods |
| spec.template | PodTemplate | Pod template for creating pods |
| containers[].name | string | Container name |
| containers[].image | string | Container image reference |
| containers[].ports[].containerPort | integer | Port exposed by container |
| containers[].env[] | EnvVar | Environment variables |
| containers[].resources | ResourceRequirements | CPU and memory requests/limits |
| containers[].readinessProbe | Probe | Health check before serving traffic |
| containers[].livenessProbe | Probe | Health check for container restart |

**State Transitions**:

- `Progressing` → `Available` → `Ready`
- Pods can be: `Pending` → `Running` → `Succeeded`/`Failed`

---

### Service

**Purpose**: Provides stable network endpoint for accessing pods.

**Entity Definition**:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: <service-name>
spec:
  type: ClusterIP
  ports:
    - port: <service-port>
      targetPort: <container-port>
  selector:
    app: <pod-label>
```

**Attributes**:
| Attribute | Type | Description |
|-----------|------|-------------|
| metadata.name | string | Name of the service |
| spec.type | string | Service type (ClusterIP, NodePort, LoadBalancer) |
| spec.ports[].port | integer | Port exposed by the service |
| spec.ports[].targetPort | integer | Port on the pod to forward to |
| spec.selector | LabelSelector | Label selector for pods |

**Relationships**:

- Selects pods with matching labels from Deployments
- Targeted by Ingress for external routing

---

### Ingress

**Purpose**: Routes external HTTP/HTTPS traffic to services.

**Entity Definition**:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: <ingress-name>
  annotations:
    <annotation-name>: <value>
spec:
  ingressClassName: nginx
  rules:
    - host: <hostname>
      http:
        paths:
          - path: <path-prefix>
            pathType: Prefix
            backend:
              service:
                name: <service-name>
                port:
                  number: <port>
```

**Attributes**:
| Attribute | Type | Description |
|-----------|------|-------------|
| metadata.name | string | Name of the ingress |
| metadata.annotations | map | Configuration for ingress controller |
| spec.ingressClassName | string | Ingress class (nginx) |
| spec.rules[].host | string | Hostname for routing |
| spec.rules[].http.paths[].path | string | URL path prefix |
| spec.rules[].http.paths[].pathType | string | Path matching type |
| spec.rules[].http.paths[].backend | IngressBackend | Target service |

**Relationships**:

- References Services for backend routing
- Requires Ingress Controller (nginx) to be installed

---

### ConfigMap

**Purpose**: Stores non-sensitive configuration data.

**Entity Definition**:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: <configmap-name>
data:
  <key>: <value>
```

**Attributes**:
| Attribute | Type | Description |
|-----------|------|-------------|
| metadata.name | string | Name of the ConfigMap |
| data | map | Key-value pairs of configuration data |

**Usage**:

- Environment variables for non-sensitive config
- Configuration files mounted as volumes
- Feature flags and application settings

---

### Secret

**Purpose**: Stores sensitive data (API keys, passwords).

**Entity Definition**:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: <secret-name>
type: Opaque
stringData:
  <key>: <value>
```

**Attributes**:
| Attribute | Type | Description |
|-----------|------|-------------|
| metadata.name | string | Name of the Secret |
| type | string | Secret type (Opaque, TLS, etc.) |
| stringData | map | Key-value pairs of sensitive data (not base64 encoded) |

**Security**:

- Never logged in plain text
- Access controlled via RBAC
- Encrypted at rest (etcd)

---

## Resource Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                         Ingress                              │
│  Routes external traffic to Services based on hostname/path │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌────────────────┐      ┌────────────────┐
│  Frontend      │      │   Backend      │
│  Service       │      │   Service      │
└───────┬────────┘      └───────┬────────┘
        │                       │
        │                       │
        ▼                       ▼
┌────────────────┐      ┌────────────────┐
│  Frontend      │      │   Backend      │
│  Deployment    │      │   Deployment    │
│  (ReplicaSet)  │      │   (ReplicaSet)  │
└───────┬────────┘      └───────┬────────┘
        │                       │
        └───────────┬───────────┘
                    ▼
         ┌──────────────────────┐
         │  Pods               │
         │  (Containers)       │
         └──────────────────────┘
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
    ┌─────────┐          ┌──────────┐
    │ ConfigMap│          │  Secret  │
    └─────────┘          └──────────┘
```

---

## Helm Template Variables

The Helm chart uses these value variables for configuration:

| Variable          | Path               | Default    | Description                      |
| ----------------- | ------------------ | ---------- | -------------------------------- |
| backend.name      | .backend.name      | backend    | Backend deployment/service name  |
| backend.replicas  | .backend.replicas  | 1          | Number of backend replicas       |
| backend.port      | .backend.port      | 8000       | Backend container port           |
| frontend.name     | .frontend.name     | frontend   | Frontend deployment/service name |
| frontend.replicas | .frontend.replicas | 1          | Number of frontend replicas      |
| frontend.port     | .frontend.port     | 3000       | Frontend container port          |
| ingress.enabled   | .ingress.enabled   | true       | Enable ingress routing           |
| ingress.host      | .ingress.host      | todo.local | Hostname for ingress             |
| dapr.enabled      | .dapr.enabled      | false      | Enable Dapr sidecar (Phase V)    |

---

## Validation Rules

### Deployment

- Must have at least 1 replica
- Must specify resource requests and limits
- Must have health probes defined

### Service

- Must have type ClusterIP
- Must have at least one port
- Selector must match Deployment labels

### Ingress

- Must have valid hostname
- Paths must reference existing Services
- Must have ingressClassName specified

### ConfigMap/Secret

- All required keys must be present
- Secret values must not be empty

---

## State Management

### Desired State

- Deployments maintain desired replica count
- Kubernetes reconciles actual state to desired state

### Self-Healing

- Failed pods are automatically restarted
- Deleted pods are automatically recreated

### Scaling

- Horizontal: Modify `spec.replicas`
- Vertical: Modify resource requests/limits
