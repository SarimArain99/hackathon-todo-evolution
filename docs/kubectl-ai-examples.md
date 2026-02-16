# kubectl-ai Integration Examples

**Feature**: 001-hackathon-todo-evolution (Phase IV: Local Kubernetes Deployment)
**Last Updated**: 2025-02-09

---

## Overview

This document provides practical examples of using kubectl with AI assistance (kubectl-ai) for managing the Todo Evolution application on Kubernetes. These examples demonstrate common operations and troubleshooting scenarios.

---

## Getting Started with kubectl-ai

### Installation

```bash
# Install kubectl-ai via krew
kubectl krew install ai

# Or install via Go
go install github.com/anthonybabong/kubectl-ai@latest

# Verify installation
kubectl ai --help
```

### Configuration

```bash
# Set your OpenAI API key
export OPENAI_API_KEY="your-api-key-here"

# Optional: Set custom model
export KUBECTL_AI_MODEL="gpt-4o"
```

---

## Basic Operations

### 1. Check Pod Status

```bash
# Natural language query
kubectl ai "show me all pods in the todo-app namespace that are not running"

# Equivalent kubectl command
kubectl get pods -n todo-app --field-selector=status.phase!=Running
```

**Example Output:**
```
Generated: kubectl get pods -n todo-app --field-selector=status.phase!=Running

No resources found in todo-app namespace.
```

---

### 2. View Pod Logs

```bash
# Natural language query
kubectl ai "show the last 50 lines of logs from the backend pod"

# Equivalent kubectl command
kubectl logs -n todo-app -l app=backend --tail=50
```

**Example Output:**
```
Generated: kubectl logs -n todo-app -l app=backend --tail=50

INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

### 3. Describe Resources

```bash
# Natural language query
kubectl ai "describe the frontend deployment and show me its events"

# Equivalent kubectl command
kubectl describe deployment -n todo-app frontend
```

---

## Troubleshooting Examples

### 4. Find Pods with Crashing Containers

```bash
# Natural language query
kubectl ai "find pods with restart count greater than 0"

# Equivalent kubectl command
kubectl get pods -n todo-app -o jsonpath='{range .items[?(@.status.containerStatuses[0].restartCount>0)]}{.metadata.name}{"\n"}{end}'
```

---

### 5. Check Resource Usage

```bash
# Natural language query
kubectl ai "show me CPU and memory usage for all pods in todo-app namespace"

# Equivalent kubectl command
kubectl top pods -n todo-app
```

---

### 6. Find Image Pull Errors

```bash
# Natural language query
kubectl ai "show pods with ImagePullBackOff or ErrImagePull status"

# Equivalent kubectl command
kubectl get pods -n todo-app -o jsonpath='{range .items[?(@.status.containerStatuses[0].state.waiting.reason=="ImagePullBackOff"||@.status.containerStatuses[0].state.waiting.reason=="ErrImagePull")]}{.metadata.name}: {.status.containerStatuses[0].state.waiting.reason}{"\n"}{end}'
```

---

## Deployment Operations

### 7. Scale Up Backend

```bash
# Natural language query
kubectl ai "scale the backend deployment to 3 replicas"

# Equivalent kubectl command
kubectl scale deployment -n todo-app backend --replicas=3
```

---

### 8. Rollout Restart

```bash
# Natural language query
kubectl ai "restart the frontend deployment to pick up new image changes"

# Equivalent kubectl command
kubectl rollout restart deployment -n todo-app frontend
```

---

### 9. Check Rollout Status

```bash
# Natural language query
kubectl ai "show me the status of the latest backend rollout"

# Equivalent kubectl command
kubectl rollout status deployment -n todo-app backend
```

---

## Debugging with Exec

### 10. Access Container Shell

```bash
# Natural language query
kubectl ai "open a bash shell in the backend pod"

# Equivalent kubectl command
kubectl exec -it -n todo-app deployment/backend -- bash
```

---

### 11. Run Commands in Pod

```bash
# Natural language query
kubectl ai "check the environment variables in the frontend pod"

# Equivalent kubectl command
kubectl exec -n todo-app deployment/frontend -- env
```

---

### 12. Test Database Connectivity

```bash
# Natural language query
kubectl ai "from the backend pod, check if the database is accessible"

# Equivalent kubectl command
kubectl exec -n todo-app deployment/backend -- python -c "from app.database import async_engine; print(async_engine.url)"
```

---

## Network Debugging

### 13. Test Service Connectivity

```bash
# Natural language query
kubectl ai "test if the frontend can reach the backend service"

# Equivalent kubectl command
kubectl exec -n todo-app deployment/frontend -- curl -s http://backend:8000/health
```

---

### 14. Port Forward to Local

```bash
# Natural language query
kubectl ai "forward the backend service port 8000 to my local port 8080"

# Equivalent kubectl command
kubectl port-forward -n todo-app svc/backend 8080:8000
```

---

### 15. Check Service Endpoints

```bash
# Natural language query
kubectl ai "show me all endpoints for the todo-app services"

# Equivalent kubectl command
kubectl get endpoints -n todo-app
```

---

## Configuration Management

### 16. View Current ConfigMap

```bash
# Natural language query
kubectl ai "show me the contents of the todo-app ConfigMap"

# Equivalent kubectl command
kubectl get configmap -n todo-app todo-app-config -o yaml
```

---

### 17. View Secrets (Redacted)

```bash
# Natural language query
kubectl ai "show me the keys in the todo-secrets Secret (don't show values)"

# Equivalent kubectl command
kubectl get secret -n todo-app todo-secrets -o jsonpath='{.data}'
```

---

### 18. Update Environment Variable

```bash
# Natural language query
kubectl ai "set the LOG_LEVEL environment variable to debug in the backend deployment"

# Equivalent kubectl command
kubectl set env deployment -n todo-app backend LOG_LEVEL=debug
```

---

## Advanced Scenarios

### 19. Find Pods Not Ready

```bash
# Natural language query
kubectl ai "show pods that are not ready across all namespaces"

# Equivalent kubectl command
kubectl get pods -A --field-selector=status.phase!=Running -o jsonpath='{range .items[?(@.status.readyReplicas != @.spec.replicas)]}{.metadata.namespace}/{.metadata.name}{"\n"}{end}'
```

---

### 20. Clean Up Evicted Pods

```bash
# Natural language query
kubectl ai "delete all pods with Evicted status in todo-app namespace"

# Equivalent kubectl command
kubectl delete pods -n todo-app --field-selector=status.phase==Failed
```

---

### 21. Export Deployment YAML

```bash
# Natural language query
kubectl ai "export the backend deployment YAML to a file called backend-export.yaml"

# Equivalent kubectl command
kubectl get deployment -n todo-app backend -o yaml > backend-export.yaml
```

---

### 22. Apply YAML from File

```bash
# Natural language query
kubectl ai "apply the configuration in backend-update.yaml"

# Equivalent kubectl command
kubectl apply -f backend-update.yaml
```

---

## Monitoring and Logs

### 23. Stream Logs from Multiple Pods

```bash
# Natural language query
kubectl ai "show logs from all backend pods at the same time"

# Equivalent kubectl command
kubectl logs -f -n todo-app -l app=backend --max-log-requests=10
```

---

### 24. View Previous Container Logs

```bash
# Natural language query
kubectl ai "show logs from the previous container instance of the backend pod"

# Equivalent kubectl command
kubectl logs -n todo-app -l app=backend --previous
```

---

### 25. Check Pod Resource Limits

```bash
# Natural language query
kubectl ai "show me the resource limits for all deployments in todo-app"

# Equivalent kubectl command
kubectl get deployment -n todo-app -o jsonpath='{range .items[*]}{.metadata.name}: CPU {.spec.template.spec.containers[0].resources.requests.cpu}/{.spec.template.spec.containers[0].resources.limits.cpu}, Memory {.spec.template.spec.containers[0].resources.requests.memory}/{.spec.template.spec.containers[0].resources.limits.memory}{"\n"}{end}'
```

---

## Quick Reference

| Task | kubectl-ai Command | Description |
|------|-------------------|-------------|
| List Pods | `kubectl ai "show all pods in todo-app"` | List all pods |
| Get Logs | `kubectl ai "show backend logs"` | View pod logs |
| Describe | `kubectl ai "describe backend deployment"` | Get detailed info |
| Scale | `kubectl ai "scale backend to 3 replicas"` | Change replica count |
| Restart | `kubectl ai "restart frontend deployment"` | Rollout restart |
| Exec | `kubectl ai "open shell in backend pod"` | Access container |
| Port Forward | `kubectl ai "forward backend 8000:8080"` | Port forward locally |
| Debug | `kubectl ai "why is backend pod crashing?"` | Troubleshoot issues |

---

## Tips for Using kubectl-ai

1. **Be Specific**: Include namespace and resource type in your query
2. **Use Quotes**: Always wrap your natural language query in quotes
3. **Verify Commands**: kubectl-ai shows the generated command before executing (with --dry-run)
4. **Learn from Output**: Use kubectl-ai to learn kubectl syntax by comparing natural language to generated commands
5. **Combine with Pipes**: Output can be piped to other tools like `jq` for further processing

---

## See Also

- [kubectl-ai GitHub](https://github.com/anthonybabong/kubectl-ai)
- [Minikube Deployment Guide](/docs/minikube-deployment.md)
- [Helm Chart](/helm/todo-app/)
- [Project Tasks](/specs/001-hackathon-todo-evolution/tasks.md)
