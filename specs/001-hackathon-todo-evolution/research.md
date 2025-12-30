# Research: Hackathon Todo Evolution

**Phase**: 0 - Research & Discovery
**Date**: 2025-12-29
**Status**: Complete

## Research Questions Resolved

### 1. Python Console Framework Selection

**Question**: What framework/library to use for console UI?

**Decision**: Rich library for Python console output

**Rationale**:
- Rich provides beautiful tables, progress bars, and styled text
- Works seamlessly with Python 3.13+
- No additional complexity for simple menu-driven interface
- Already included in Phase I skill documentation

**Alternatives Considered**:
- Click: More suited for CLI argument parsing, overkill for menu interface
- Textual: Full TUI framework, too complex for basic CRUD app
- Plain input/print: Works but lacks visual appeal

### 2. Database Selection for Phase II-V

**Question**: Which PostgreSQL provider to use?

**Decision**: Neon Serverless PostgreSQL

**Rationale**:
- Free tier sufficient for hackathon
- Serverless model reduces operational overhead
- Native PostgreSQL compatibility with SQLModel
- Built-in connection pooling for Kubernetes deployments
- Hackathon documentation explicitly requires Neon

**Alternatives Considered**:
- Supabase: Good but would add another auth layer
- PlanetScale: MySQL-based, not PostgreSQL
- Self-hosted: Too much operational overhead

### 3. Authentication Strategy

**Question**: How to implement authentication across frontend and backend?

**Decision**: Better Auth with JWT plugin

**Rationale**:
- Single auth solution for Next.js frontend
- JWT tokens can be verified by FastAPI backend independently
- Shared secret enables stateless verification
- Hackathon specification requires Better Auth

**Technical Implementation**:
1. Better Auth runs on Next.js frontend
2. Issues JWT tokens on login
3. Frontend sends JWT in `Authorization: Bearer <token>` header
4. FastAPI backend verifies JWT signature with shared secret
5. User ID extracted from token for data isolation

**Alternatives Considered**:
- NextAuth: Good but Better Auth is specifically required
- Clerk: External service, adds dependency
- Custom JWT: More work, less features

### 4. AI Agent Architecture

**Question**: How to integrate AI chatbot with task management?

**Decision**: OpenAI Agents SDK + MCP Server architecture

**Rationale**:
- OpenAI Agents SDK provides structured tool calling
- MCP (Model Context Protocol) exposes tools as standard interface
- Stateless design enables horizontal scaling
- Conversation history in database for persistence

**Architecture**:
```
ChatKit UI → POST /api/chat → Agent (with MCP tools) → Database
                                    ↓
                              MCP Server
                              - add_task
                              - list_tasks
                              - complete_task
                              - delete_task
                              - update_task
```

**Alternatives Considered**:
- LangChain: More complex, not required by spec
- Direct OpenAI API: Loses structured tool calling
- Custom agent: Reinventing the wheel

### 5. Event Streaming Platform

**Question**: Kafka or alternative for Phase V?

**Decision**: Redpanda Cloud (Kafka-compatible) with Dapr abstraction

**Rationale**:
- Redpanda has generous free tier
- Kafka-compatible protocol
- No Zookeeper dependency
- Dapr provides abstraction layer (can swap to real Kafka if needed)

**Event Topics**:
| Topic | Producer | Consumers | Purpose |
|-------|----------|-----------|---------|
| task-events | Chat API | Recurring Service, Audit | All CRUD operations |
| reminders | Chat API | Notification Service | Due date triggers |
| task-updates | Chat API | WebSocket Service | Real-time sync |

**Alternatives Considered**:
- Confluent Cloud: $400 credit expires
- Self-hosted Strimzi: More setup complexity
- CloudKarafka: Limited free tier

### 6. Kubernetes Distribution

**Question**: Which Kubernetes distribution for local and cloud?

**Decision**:
- Local: Minikube
- Cloud: DigitalOcean DOKS (primary), Azure AKS or Oracle OKE (alternatives)

**Rationale**:
- Minikube is standard for local K8s development
- DOKS: $200 credit for 60 days
- AKS: $200 credit for 30 days
- Oracle OKE: Always free tier (4 OCPUs, 24GB RAM)

**Alternatives Considered**:
- Kind: Simpler but less production-like
- K3s: Good but Minikube more mainstream
- EKS: More expensive, complex IAM

### 7. CI/CD Pipeline

**Question**: How to automate deployments?

**Decision**: GitHub Actions

**Rationale**:
- Native GitHub integration
- Free for public repositories
- Supports Docker, Helm, and kubectl
- Can target multiple cloud providers

**Pipeline Stages**:
1. Lint and test
2. Build Docker images
3. Push to container registry
4. Deploy to Kubernetes via Helm
5. Run smoke tests

### 8. Dapr Components Selection

**Question**: Which Dapr building blocks to use?

**Decision**: Full Dapr stack for Phase V

| Building Block | Component Type | Purpose |
|---------------|----------------|---------|
| Pub/Sub | pubsub.kafka | Event streaming |
| State | state.postgresql | Conversation state |
| Secrets | secretstores.kubernetes | API keys, credentials |
| Service Invocation | N/A (built-in) | Frontend → Backend |

**Benefits**:
- Single HTTP API for all infrastructure
- Swap components via YAML config
- Built-in retries and circuit breakers
- No direct Kafka client code needed

## Technology Stack Summary

### Phase I
| Component | Technology | Version |
|-----------|------------|---------|
| Language | Python | 3.13+ |
| Package Manager | UV | Latest |
| Console UI | Rich | Latest |
| Testing | pytest | Latest |

### Phase II
| Component | Technology | Version |
|-----------|------------|---------|
| Backend Framework | FastAPI | 0.115+ |
| ORM | SQLModel | 0.0.22+ |
| Database | Neon PostgreSQL | Latest |
| Frontend | Next.js | 15+ |
| Auth | Better Auth | Latest |
| CSS | Tailwind CSS | 3.x |

### Phase III
| Component | Technology | Version |
|-----------|------------|---------|
| AI Agent | OpenAI Agents SDK | Latest |
| Tool Server | MCP SDK | Latest |
| Chat UI | OpenAI ChatKit | Latest |

### Phase IV
| Component | Technology | Version |
|-----------|------------|---------|
| Containers | Docker | 27+ |
| K8s Package | Helm | 3.x |
| Local K8s | Minikube | Latest |
| AIOps | kubectl-ai, kagent | Latest |

### Phase V
| Component | Technology | Version |
|-----------|------------|---------|
| Events | Kafka/Redpanda | Latest |
| Runtime | Dapr | 1.14+ |
| Cloud K8s | DOKS/AKS/GKE | Latest |
| CI/CD | GitHub Actions | N/A |

## Skill References

All research has been consolidated into cached skills:

- `.claude/skills/fastapi/SKILL.md` - FastAPI patterns
- `.claude/skills/nextjs/SKILL.md` - Next.js App Router
- `.claude/skills/sqlmodel/SKILL.md` - SQLModel ORM
- `.claude/skills/better-auth/SKILL.md` - JWT authentication
- `.claude/skills/openai-agents-sdk/SKILL.md` - Agent SDK
- `.claude/skills/mcp-sdk/SKILL.md` - MCP server
- `.claude/skills/helm/SKILL.md` - Kubernetes packaging
- `.claude/skills/kafka-python/SKILL.md` - Event streaming
- `.claude/skills/dapr/SKILL.md` - Distributed runtime

## Outstanding Questions

None - all NEEDS CLARIFICATION items resolved.

## Next Phase

Proceed to Phase 1: Design & Contracts
- Generate data-model.md
- Generate contracts/ directory
- Generate quickstart.md
