# Zenith - Todo Evolution

<p align="center">
  <img src="https://img.shields.io/badge/Phase-I%20Console%20App-1000%20pts-blue" alt="Phase I">
  <img src="https://img.shields.io/badge/Phase-II%20Web%20App-150%20pts-green" alt="Phase II">
  <img src="https://img.shields.io/badge/Spec-Driven%20Development-SDD-yellow" alt="SDD">
</p>

> A 5-phase spec-driven development hackathon project that evolves a simple in-memory Todo console application into a fully-featured, cloud-native AI-powered chatbot deployed on Kubernetes.

**Current Version**: Fullstack web application with FastAPI backend + Next.js 16 frontend

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Frontend Documentation](#frontend-documentation)
- [Backend Documentation](#backend-documentation)
- [Usage](#usage)
- [Phases](#phases)
- [Development](#development)
- [Tech Stack](#tech-stack)

---

## Features

### Phase I - Console Application (Completed ✅)
- Add, list, update, delete tasks
- Search, filter, sort tasks
- Calendar views and reminders
- Recurring tasks and progress tracking

### Phase II - Web Application (In Progress 🔄)
- **Backend**: FastAPI REST API with JWT authentication
- **Frontend**: Next.js 16 + React 19 with TypeScript
- **Authentication**: Better Auth integration
- **Theme System**: Light/Dark/System theme switching
- **Animations**: Smooth Framer Motion transitions
- **Notifications**: Sonner toast system
- **Components**: shadcn/ui component library

---

## Quick Start

### Prerequisites

- **Backend**: Python 3.13+, UV package manager
- **Frontend**: Node.js 20+, npm

### Installation

```bash
# Clone the repository
git clone https://github.com/SarimArain99/hackathon-todo-evolution.git
cd hackathon-todo-evolution
```

### Backend Setup

```bash
cd backend

# Install dependencies
uv pip install -e .

# Run the backend server
uvicorn app.main:app --reload
```

Backend runs on: `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend runs on: `http://localhost:3000`

---

## Project Structure

```
hackathon-todo-evolution/
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── models.py       # SQLAlchemy models
│   │   ├── auth.py         # JWT authentication
│   │   └── database.py     # Database connection
│   ├── tests/              # Backend tests
│   └── pyproject.toml      # Python dependencies
│
├── frontend/               # Next.js Frontend
│   ├── app/
│   │   ├── (auth)/        # Auth pages (sign-in, sign-up)
│   │   ├── (protected)/   # Protected dashboard
│   │   ├── api/           # API routes
│   │   └── globals.css    # Global styles
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── motion/       # Framer Motion animations
│   │   ├── theme-provider.tsx
│   │   ├── theme-toggle.tsx
│   │   ├── task-list.tsx
│   │   ├── task-item.tsx
│   │   └── task-form.tsx
│   ├── lib/
│   │   ├── api.ts        # API client
│   │   ├── toast.ts      # Toast helpers
│   │   └── theme.ts      # Theme utilities
│   └── package.json      # Node dependencies
│
├── specs/                 # Spec-driven artifacts
│   ├── 001-hackathon-todo-evolution/
│   └── 002-ui-ux-enhancement/
│
├── history/               # Prompt history & ADRs
├── .specify/              # Spec-Kit Plus config
└── README.md
```

---

## Frontend Documentation

### Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.1 | React framework |
| React | 19.2.3 | UI library |
| TypeScript | 5+ | Type safety |
| Tailwind CSS | 4 | Styling |
| next-themes | 0.4.6 | Theme management |
| Framer Motion | 12.24.12 | Animations |
| Sonner | 2.0.7 | Toast notifications |
| shadcn/ui | - | Component library |
| Better Auth | 1.4.10 | Authentication |

### Theme System

The application supports three themes:
- **Light**: Clean, bright interface
- **Dark**: Easy on the eyes in low light
- **System**: Follows OS preference

**Usage**:
```tsx
import { useTheme } from "next-themes"

function MyComponent() {
  const { theme, setTheme } = useTheme()
  return <button onClick={() => setTheme("dark")}>Dark Mode</button>
}
```

### Animations

Framer Motion provides smooth transitions throughout the app:

```tsx
import { motion } from "framer-motion"

<motion.div
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2 }}
>
  Content
</motion.div>
```

### Toast Notifications

Use the toast helpers for user feedback:

```tsx
import { taskToasts } from "@/lib/toast"

// Success toast
taskToasts.created("Task name")

// Error toast
taskToasts.error("create task", "Something went wrong")
```

### Components

Available shadcn/ui components:
- Button, Input, Card, Dialog, Sonner (Toaster)

Custom components:
- `TaskList` - Main task list with filters
- `TaskItem` - Individual task card
- `TaskForm` - Create/edit task form
- `ThemeToggle` - Theme selector dropdown
- `LogoutButton` - User logout

---

## Backend Documentation

### Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| FastAPI | 0.115+ | Web framework |
| Uvicorn | 0.32+ | ASGI server |
| SQLModel | 0.0.22+ | ORM |
| Pydantic | 2.10+ | Data validation |
| python-jose | 3.3+ | JWT tokens |
| aiosqlite | 0.20+ | Async SQLite |
| Pytest | 8.0+ | Testing |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List all tasks |
| POST | `/api/tasks` | Create new task |
| GET | `/api/tasks/{id}` | Get task by ID |
| PUT | `/api/tasks/{id}` | Update task |
| DELETE | `/api/tasks/{id}` | Delete task |
| POST | `/api/tasks/{id}/complete` | Mark task complete |
| POST | `/api/tasks/{id}/uncomplete` | Mark task incomplete |

### Authentication

JWT-based authentication with EdDSA algorithm:

```python
# Login endpoint
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

# Returns JWT token
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

### Running Tests

```bash
cd backend
uv run pytest
```

---

## Usage

### Web Application

1. Navigate to `http://localhost:3000`
2. Sign up for a new account
3. Create tasks using the form
4. Filter by status, priority, or search
5. Toggle between light/dark themes

### API Usage

```bash
# Get all tasks
curl http://localhost:8000/api/tasks

# Create a task
curl -X POST http://localhost:8000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries", "priority": "medium"}'
```

---

## Phases

| Phase | Description | Status | Points |
|-------|-------------|--------|--------|
| I | Console Application | ✅ Complete | 100 |
| II | Web Application | 🔄 In Progress | 150 |
| III | AI Chatbot | 📋 Planned | 200 |
| IV | Local Kubernetes | 📋 Planned | 250 |
| V | Cloud Deployment | 📋 Planned | 300 |

**Total Points: 1000** (+700 bonus available)

---

## Development

### Spec-Driven Development Workflow

1. **Specify** → Create feature specification
2. **Clarify** → Resolve ambiguities
3. **Plan** → Generate technical plan
4. **Tasks** → Break down into executable tasks
5. **Implement** → Execute tasks (TDD)
6. **Analyze** → Validate artifacts

### Available Slash Commands

| Command | Description |
|---------|-------------|
| `/sp.specify` | Create feature specification |
| `/sp.plan` | Generate implementation plan |
| `/sp.tasks` | Break down into tasks |
| `/sp.implement` | Execute implementation |
| `/sp.analyze` | Analyze artifacts |
| `/sp.adr` | Create Architecture Decision Record |
| `/sp.git.commit_pr` | Commit and create PR |

---

## Tech Stack

### Backend

| Technology | Purpose |
|------------|---------|
| Python 3.13+ | Core language |
| FastAPI | Web framework |
| SQLModel | ORM |
| Uvicorn | ASGI server |
| Pytest | Testing |

### Frontend

| Technology | Purpose |
|------------|---------|
| Next.js 16 | React framework |
| React 19 | UI library |
| TypeScript | Type safety |
| Tailwind CSS 4 | Styling |
| next-themes | Theme management |
| Framer Motion | Animations |
| Sonner | Notifications |
| shadcn/ui | Components |
| Better Auth | Authentication |

---

## License

MIT License

---

## Author

**SarimArain99**

- GitHub: [@SarimArain99](https://github.com/SarimArain99)

---

<p align="center">
  Built with Spec-Driven Development using Claude Code & Spec-Kit Plus
</p>
