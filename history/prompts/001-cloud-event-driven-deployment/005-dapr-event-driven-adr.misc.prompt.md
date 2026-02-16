---
id: 005
title: dapr-event-driven-adr
stage: misc
date: 2025-02-09
surface: agent
model: claude-opus-4-5-20251101
feature: 001-cloud-event-driven-deployment
branch: 001-cloud-event-driven-deployment
user: sarimarain99
command: /sp.adr dapr-event-driven-architecture
labels: [adr, dapr, event-driven, architecture, decision-record]
links:
  spec: specs/001-cloud-event-driven-deployment/spec.md
  ticket: null
  adr: history/adr/0001-dapr-event-driven-architecture.md
  pr: null
files:
 - history/adr/0001-dapr-event-driven-architecture.md (new, ADR for Dapr event-driven architecture)
tests:
 - Significance checklist: PASSED (impact, alternatives, scope all verified)
---

## Prompt

/sp.adr dapr-event-driven-architecture

## Response snapshot

Created ADR-0001: Dapr Event-Driven Architecture

**Decision Cluster Documented**:
Adopt Dapr as the distributed application runtime with CloudEvents-standard messaging over Redpanda (Kafka-compatible) for event-driven architecture.

**Components**:
- Distributed Runtime: Dapr 1.14+ with sidecar injection
- Message Broker: Redpanda via Helm (ZooKeeper-free)
- Event Format: CloudEvents 1.0 specification
- Pub/Sub API: Dapr HTTP API (no direct Kafka libraries)
- State Management: Dapr PostgreSQL state store
- Secrets: Dapr Kubernetes secret store
- Job Scheduling: Dapr Jobs API for reminders
- Deployment: Oracle Cloud OKE Always Free tier

**Alternatives Considered** (5):
1. Direct Kafka Libraries (confluent-kafka-python) - tight coupling
2. AWS MSK + AWS EKS - not free tier eligible
3. RabbitMQ with MassTransit - no event sourcing
4. Apache Kafka with ZooKeeper - more resource overhead
5. Redis Pub/Sub - not durable

**Positive Consequences**:
- Technology agnostic (abstracts Kafka)
- Resource efficient (Redpanda ~1GB vs 3-4GB)
- Built-in observability and mTLS
- Horizontal scaling via Kafka consumer groups
- Degraded mode operation

**Negative Consequences**:
- Operational complexity (sidecars, control plane)
- Latency overhead (~10-50ms per event)
- Learning curve for Dapr concepts
- Resource overhead per pod (~50-100MB)

## Outcome

- ✅ Impact: Documented architecturally significant decision for event-driven architecture that affects all Phase V features
- 🧪 Tests: Significance checklist PASSED (impact, alternatives, scope all verified)
- 📁 Files: history/adr/0001-dapr-event-driven-architecture.md (new)
- 🔁 Next prompts: Run `/sp.implement` to execute tasks, or `/sp.adr` for additional decisions (cloud deployment, RRULE recurrence)
- 🧠 Reflection: ADR clusters related technologies (Dapr + Redpanda + CloudEvents + Oracle OKE) into a single coherent decision. Alternative analysis thoroughly covers tradeoffs. Decision establishes foundation for event-driven patterns that will scale with application growth.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): Significance checklist: PASS (all three criteria met - long-term architectural impact, multiple viable alternatives with tradeoffs, cross-cutting scope across all services)
- Prompt variant (if applicable): N/A
- Next experiment: Consider additional ADRs for cloud deployment strategy or recurrence handling patterns if team requests deeper documentation
