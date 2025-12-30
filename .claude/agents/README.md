# Hackathon Subagents

Specialized subagents for the **Hackathon II - Todo Spec-Driven Development** project.

## Overview

Each subagent is designed to handle a specific phase of the hackathon, with specialized knowledge, code patterns, and acceptance criteria.

## Agent Index

| Phase | Agent                                               | Points | Skills                                  |
| ----- | --------------------------------------------------- | ------ | --------------------------------------- |
| I     | [Phase 1: Console App](./phase1-console/agent.md)   | 100    | Python, UV, Rich                        |
| II    | [Phase 2: Full-Stack](./phase2-fullstack/agent.md)  | 150    | FastAPI, Next.js, SQLModel, Better Auth |
| III   | [Phase 3: AI Chatbot](./phase3-ai-chatbot/agent.md) | 200    | OpenAI Agents SDK, MCP SDK              |
| IV    | [Phase 4: Kubernetes](./phase4-kubernetes/agent.md) | 250    | Docker, Helm, Minikube                  |
| V     | [Phase 5: Cloud](./phase5-cloud/agent.md)           | 300    | Dapr, Kafka, Cloud K8s                  |

**Total Points**: 1000

## Agent Structure

Each agent folder contains:

```
.claude/agents/
├── phase1-console/
│   └── agent.md          # Console app implementation guide
├── phase2-fullstack/
│   └── agent.md          # Full-stack web app guide
├── phase3-ai-chatbot/
│   └── agent.md          # AI chatbot integration guide
├── phase4-kubernetes/
│   └── agent.md          # Container orchestration guide
├── phase5-cloud/
│   └── agent.md          # Cloud deployment guide
└── README.md             # This file
```

## Agent Contents

Each `agent.md` includes:

1. **Purpose**: What the agent builds
2. **Capabilities**: What it specializes in
3. **Skills Referenced**: Links to `.claude/skills/` documentation
4. **Task Execution Protocol**: Step-by-step implementation code
5. **Acceptance Criteria**: Checkboxes for completion validation
6. **Handoff**: What gets passed to the next phase

## Usage Pattern

### Sequential Execution

```
Phase I → Phase II → Phase III → Phase IV → Phase V
```

Each phase builds on the previous:

- Phase I provides Task model and CRUD patterns
- Phase II adds persistence and web interface
- Phase III adds AI chat capabilities
- Phase IV containerizes everything
- Phase V adds distributed cloud features

### Invoking an Agent

Reference the agent when starting a phase:

```
@.claude/agents/phase1-console/agent.md
Implement the console Todo app following the agent protocol.
```

### Parallel Work (Advanced)

Some tasks within phases can be parallelized:

- Phase II: Backend and Frontend can be developed in parallel
- Phase IV: Docker images can be built in parallel
- Phase V: Dapr components can be configured independently

## Dependencies

| Phase | Depends On                            |
| ----- | ------------------------------------- |
| I     | None                                  |
| II    | Phase I (Task model)                  |
| III   | Phase II (REST API, Database)         |
| IV    | Phase III (All services)              |
| V     | Phase IV (Helm charts, Docker images) |

## Skills Cross-Reference

| Skill             | Phases Used    |
| ----------------- | -------------- |
| FastAPI           | II, III, IV, V |
| Next.js           | II, III, IV, V |
| SQLModel          | II, III        |
| OpenAI Agents SDK | III            |
| MCP SDK           | III            |
| Better Auth       | II, III        |
| Helm              | IV, V          |
| Kafka Python      | V              |
| Dapr              | V              |

## Bonus Points

- **Subagent Development**: +200 points for using specialized agents (this!)
- **Cross-cutting Concerns**: Agents handle auth, error handling, testing patterns

## Validation

Each agent has acceptance criteria with checkboxes. Mark items complete as you implement:

```markdown
## Acceptance Criteria

- [x] Project initialized with UV
- [x] Task dataclass with all fields
- [ ] Unit tests passing
```

## Handoff Protocol

When completing a phase, ensure:

1. All acceptance criteria are checked
2. Tests pass
3. Documentation is updated
4. Next phase can access required artifacts

Example handoff from Phase II to Phase III:

- REST API running at `/api/tasks`
- Database schema deployed
- JWT authentication working
- Frontend serving at port 3000
