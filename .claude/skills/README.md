# Hackathon Skills Reference

Skills documentation fetched from **Context7 MCP** for the Hackathon II - Todo Evolution Project.

## Available Skills

| Skill | Directory | Phase | Description |
|-------|-----------|-------|-------------|
| [FastAPI](./fastapi/SKILL.md) | `fastapi/` | II-V | Python REST API framework |
| [Next.js](./nextjs/SKILL.md) | `nextjs/` | II-V | React framework with App Router |
| [SQLModel](./sqlmodel/SKILL.md) | `sqlmodel/` | II-V | Python ORM for SQL databases |
| [OpenAI Agents SDK](./openai-agents-sdk/SKILL.md) | `openai-agents-sdk/` | III-V | AI agent framework with tools |
| [MCP SDK](./mcp-sdk/SKILL.md) | `mcp-sdk/` | III-V | Model Context Protocol servers |
| [Dapr](./dapr/SKILL.md) | `dapr/` | V | Distributed application runtime |
| [Better Auth](./better-auth/SKILL.md) | `better-auth/` | II-V | Authentication library for Next.js |
| [Helm](./helm/SKILL.md) | `helm/` | IV-V | Kubernetes package manager |
| [Kafka Python](./kafka-python/SKILL.md) | `kafka-python/` | V | Event streaming client |

## Phase Technology Mapping

### Phase I: Console App
- Python 3.13+
- UV package manager

### Phase II: Full-Stack Web App
- **Frontend**: Next.js (App Router)
- **Backend**: FastAPI
- **Database**: SQLModel + Neon PostgreSQL
- **Auth**: Better Auth

### Phase III: AI Chatbot
- OpenAI Agents SDK
- MCP SDK
- OpenAI ChatKit

### Phase IV: Local Kubernetes
- Docker
- Helm Charts
- Minikube
- kubectl-ai / kagent

### Phase V: Cloud Deployment
- Dapr (Pub/Sub, State, Secrets)
- Kafka / Redpanda
- AKS / GKE / DOKS

## Usage

Reference these skills when implementing each phase:

```
@.claude/skills/fastapi/SKILL.md - for API development
@.claude/skills/nextjs/SKILL.md - for frontend development
@.claude/skills/sqlmodel/SKILL.md - for database operations
```

## Source

All documentation fetched from Context7 MCP on 2025-12-29.
