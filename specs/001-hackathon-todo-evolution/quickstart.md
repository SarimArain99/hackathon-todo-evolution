# Quickstart Guide: Hackathon Todo Evolution

**Last Updated**: 2025-12-29
**Status**: Ready for Implementation

## Prerequisites

### Required Software

- **Python 3.13+** with UV package manager
- **Node.js 18+** with npm
- **Docker Desktop 4.53+**
- **Minikube** (for Phase IV)
- **kubectl** (for Phase IV-V)
- **Helm 3.x** (for Phase IV-V)

### API Keys & Accounts

- **OpenAI API Key** (for Phase III)
- **Neon Database** account (free tier)
- **Cloud Provider** (DigitalOcean $200 credit, Azure $200 credit, or Oracle free tier)
- **Redpanda Cloud** account (serverless tier, for Phase V)

### Installation Commands

```bash
# Install UV (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install Node.js via nvm (if not installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
nvm install 20

# Install Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install Dapr CLI
curl -fsSL https://raw.githubusercontent.com/dapr/cli/master/install/install.sh | bash
```

## Phase I: Console Application

### Quick Start

```bash
# Initialize project
uv init todo-console
cd todo-console

# Add dependencies
uv add rich pytest

# Create directory structure
mkdir -p src/models src/services src/cli tests/unit

# Run the application
uv run python -m src.cli.main

# Run tests
uv run pytest tests/
```

### Expected Output

```
╔══════════════════════════════════════════╗
║           TODO LIST MANAGER              ║
╠══════════════════════════════════════════╣
║  1. Add Task                             ║
║  2. List Tasks                           ║
║  3. Update Task                          ║
║  4. Delete Task                          ║
║  5. Complete Task                        ║
║  6. Exit                                 ║
╚══════════════════════════════════════════╝
Enter choice (1-6):
```

## Phase II: Full-Stack Web Application

### Backend Setup

```bash
cd backend

# Initialize with UV
uv init .
uv add fastapi uvicorn sqlmodel pydantic pyjwt httpx python-dotenv

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://user:pass@neon.db/todo
BETTER_AUTH_SECRET=your-shared-secret-key
EOF

# Run backend
uv run uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Create Next.js app
npx create-next-app@latest . --typescript --tailwind --app

# Install dependencies
npm install better-auth @better-auth/jwt

# Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_SECRET=your-shared-secret-key
EOF

# Run frontend
npm run dev
```

### Verify Integration

1. Open http://localhost:3000
2. Sign up / Sign in
3. Create a task via UI
4. Verify task appears in list

## Phase III: AI Chatbot

### Add AI Dependencies (Backend)

```bash
cd backend
uv add openai-agents-sdk mcp
```

### Environment Variables

```bash
# Add to .env
OPENAI_API_KEY=sk-your-api-key
```

### Run MCP Server

```bash
# In separate terminal
uv run python -m app.mcp_server.server
```

### Verify Chatbot

1. Open http://localhost:3000/chat
2. Say "Add a task to buy groceries"
3. AI should confirm task creation
4. Say "Show my tasks"
5. AI should list the task

## Phase IV: Local Kubernetes

### Start Minikube

```bash
# Start cluster
minikube start --driver=docker

# Enable ingress
minikube addons enable ingress

# Use Minikube's Docker daemon
eval $(minikube docker-env)
```

### Build Docker Images

```bash
# Build backend
docker build -t todo-backend:latest -f docker/backend.Dockerfile ./backend

# Build frontend
docker build -t todo-frontend:latest -f docker/frontend.Dockerfile ./frontend
```

### Deploy with Helm

```bash
# Install chart
helm install todo ./helm/todo-app \
  --set backend.env.DATABASE_URL="postgresql://..." \
  --set backend.env.BETTER_AUTH_SECRET="secret" \
  --set backend.env.OPENAI_API_KEY="sk-..."

# Verify pods
kubectl get pods

# Access via tunnel
minikube tunnel
```

### Verify Deployment

1. Open http://todo.local (add to /etc/hosts if needed)
2. Complete signup/login flow
3. Test chatbot functionality

## Phase V: Cloud Deployment

### Install Dapr

```bash
# Initialize Dapr on Kubernetes
dapr init -k

# Verify
dapr status -k
```

### Deploy Dapr Components

```bash
kubectl apply -f dapr-components/
```

### Deploy to Cloud K8s

```bash
# DigitalOcean
doctl kubernetes cluster create todo-cluster --region nyc1

# Or Azure
az aks create --resource-group todo-rg --name todo-cluster

# Or Oracle OKE (free tier)
# Use Oracle Cloud Console

# Deploy
helm install todo ./helm/todo-app -f ./helm/todo-app/values-cloud.yaml
```

### Verify Event Streaming

1. Create a recurring task via chatbot
2. Complete the task
3. Verify new instance created automatically
4. Check Kafka topics for events

## Environment Variables Reference

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:pass@neon.db/todo

# Authentication
BETTER_AUTH_SECRET=your-shared-secret-key

# AI
OPENAI_API_KEY=sk-your-api-key

# Kafka (Phase V)
KAFKA_BROKERS=localhost:9092
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_SECRET=your-shared-secret-key
```

## Common Issues & Solutions

### Database Connection Failed

```bash
# Check Neon status at console.neon.tech
# Verify DATABASE_URL format
# Ensure IP is not blocked
```

### JWT Token Invalid

```bash
# Ensure BETTER_AUTH_SECRET matches between frontend and backend
# Check token expiration
```

### Minikube Image Not Found

```bash
# Always run after starting minikube:
eval $(minikube docker-env)

# Then rebuild images
docker build ...
```

### Dapr Sidecar Not Injecting

```bash
# Verify Dapr is initialized
dapr status -k

# Check namespace annotation
kubectl get namespace default -o yaml
```

## Skill References

For implementation patterns, refer to cached skills:

- `.claude/skills/fastapi/SKILL.md` - API patterns
- `.claude/skills/nextjs/SKILL.md` - Frontend patterns
- `.claude/skills/sqlmodel/SKILL.md` - ORM patterns
- `.claude/skills/openai-agents-sdk/SKILL.md` - AI agent patterns
- `.claude/skills/mcp-sdk/SKILL.md` - MCP server patterns
- `.claude/skills/helm/SKILL.md` - Kubernetes patterns
- `.claude/skills/dapr/SKILL.md` - Distributed patterns
- `.claude/skills/kafka-python/SKILL.md` - Event streaming

## Next Steps

After this quickstart:

1. Run `/sp.tasks` to generate detailed task breakdown
2. Run `/sp.implement` to start Phase I implementation
3. Commit after each phase completion
4. Create demo video (90 seconds max)
