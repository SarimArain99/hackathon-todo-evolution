# ADR-0001: Dapr Event-Driven Architecture

> **Scope**: Document decision clusters, not individual technology choices. Group related decisions that work together (e.g., "Frontend Stack" not separate ADRs for framework, styling, deployment).

- **Status:** Accepted
- **Date:** 2025-02-09
- **Feature:** 001-cloud-event-driven-deployment
- **Context:** Phase V requires transforming the Todo application from a monolithic architecture into a distributed, event-driven system. The hackathon guidelines mandate using Kafka for event streaming and Dapr for distributed application runtime. The deployment target is Oracle Cloud OKE Always Free tier (4 OCPUs, 24GB RAM), which imposes strict resource constraints.

<!-- Significance checklist (ALL must be true to justify this ADR)
     1) Impact: Long-term consequence for architecture/platform/security? YES - defines core event-driven patterns for all future features
     2) Alternatives: Multiple viable options considered with tradeoffs? YES - direct Kafka libraries, other service meshes, different message brokers
     3) Scope: Cross-cutting concern (not an isolated detail)? YES - affects task CRUD, recurring tasks, reminders, notifications, and chatbot
     If any are false, prefer capturing as a PHR note instead of an ADR. -->

## Decision

Adopt Dapr as the distributed application runtime with CloudEvents-standard messaging over Redpanda (Kafka-compatible) for event-driven architecture:

- **Distributed Runtime**: Dapr 1.14+ with sidecar injection for all application pods
- **Message Broker**: Redpanda via Helm (ZooKeeper-free Kafka) deployed in-cluster
- **Event Format**: CloudEvents 1.0 specification for all event types
- **Pub/Sub API**: Dapr HTTP API for event publishing (no direct Kafka client libraries)
- **State Management**: Dapr PostgreSQL state store for conversation caching
- **Secrets**: Dapr Kubernetes secret store integration
- **Job Scheduling**: Dapr Jobs API for reminder callbacks
- **Deployment**: Oracle Cloud OKE Always Free tier with GitHub Container Registry

### Component Integration

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Frontend   │    │   Backend   │    │  Redpanda   │
│  + Dapr     │    │  + Dapr     │    │   (Kafka)   │
│  Sidecar    │    │  Sidecar    │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Dapr Control  │
                    │     Plane       │
                    └─────────────────┘
```

### Event Types

- `todo.task.created` - New task created
- `todo.task.updated` - Task modified
- `todo.task.completed` - Task marked complete (triggers next recurring instance)
- `todo.task.deleted` - Task removed
- `todo.reminder.due` - Reminder time reached

## Consequences

### Positive

- **Technology Agnostic**: Dapr HTTP API abstracts Kafka complexity; application code has no direct Kafka dependencies
- **Resource Efficient**: Redpanda requires ~1GB RAM vs 3-4GB for Apache Kafka with ZooKeeper, fitting within Always Free tier
- **Observability**: Dapr provides built-in metrics, distributed tracing, and logging for all inter-service communication
- **mTLS by Default**: All service-to-service communication encrypted and authenticated via Dapr sidecar
- **Horizontal Scaling**: Adding backend pods automatically scales event processing via Kafka consumer groups
- **Degraded Mode**: In-memory event buffering allows continued operation during Kafka outages
- **Polyglot Ready**: Event-driven patterns enable future microservices in any language (Go, Rust, Node.js)
- **Developer Experience**: Local development with `dapr run` CLI mirrors production behavior

### Negative

- **Operational Complexity**: Additional infrastructure layer (Dapr control plane, sidecars) increases deployment complexity
- **Latency Overhead**: Dapr sidecar adds ~10-50ms per event publish (acceptable for <100ms SLA)
- **Learning Curve**: Team must understand Dapr concepts (actors, bindings, pub/sub, state management)
- **Debugging Challenges**: Event flow tracing requires tools like Jaeger for distributed tracing
- **Resource Overhead**: Each pod runs daprd sidecar (~50-100MB RAM per instance)
- **Always Free Constraints**: Single Redpanda replica limits throughput; no high availability

## Alternatives Considered

### Alternative A: Direct Kafka Libraries (confluent-kafka-python)

- **Approach**: Use `confluent-kafka-python` directly in FastAPI application
- **Why Rejected**: Tightly couples application code to Kafka; harder to swap message brokers; more complex error handling; no built-in mTLS or service discovery

### Alternative B: AWS MSK + AWS EKS

- **Approach**: Use AWS managed Kafka (MSK) and EKS instead of Oracle OKE
- **Why Rejected**: Not free tier eligible; would incur monthly costs; exceeds hackathon budget constraints

### Alternative C: RabbitMQ with MassTransit

- **Approach**: Use RabbitMQ as message broker with MassTransit-style patterns
- **Why Rejected**: Less suitable for event sourcing (no native log retention); hackathon guidelines explicitly require Kafka

### Alternative D: Apache Kafka with ZooKeeper

- **Approach**: Traditional Kafka deployment with separate ZooKeeper ensemble
- **Why Rejected**: ZooKeeper requires additional resources (~1GB RAM); Redpanda eliminates ZooKeeper while maintaining Kafka compatibility

### Alternative E: In-Memory Event Bus (Redis Pub/Sub)

- **Approach**: Use Redis pub/sub for lightweight event streaming
- **Why Rejected**: No durable message log; events lost if consumer is down; doesn't meet event sourcing requirements

## References

- Feature Spec: [specs/001-cloud-event-driven-deployment/spec.md](../../specs/001-cloud-event-driven-deployment/spec.md)
- Implementation Plan: [specs/001-cloud-event-driven-deployment/plan.md](../../specs/001-cloud-event-driven-deployment/plan.md)
- Research Notes: [specs/001-cloud-event-driven-deployment/research.md](../../specs/001-cloud-event-driven-deployment/research.md)
- Data Model: [specs/001-cloud-event-driven-deployment/data-model.md](../../specs/001-cloud-event-driven-deployment/data-model.md)
- API Contracts: [specs/001-cloud-event-driven-deployment/contracts/api.yaml](../../specs/001-cloud-event-driven-deployment/contracts/api.yaml)
- Quickstart: [specs/001-cloud-event-driven-deployment/quickstart.md](../../specs/001-cloud-event-driven-deployment/quickstart.md)
