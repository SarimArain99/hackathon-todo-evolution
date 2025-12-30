# hackathon-todo-evolution

<p align="center">
  <img src="https://img.shields.io/badge/Phase-I%20Console%20App-1000%20pts-blue" alt="Phase I">
  <img src="https://img.shields.io/badge/Python-3.13+-green" alt="Python">
  <img src="https://img.shields.io/badge/Spec-Driven%20Development-SDD-yellow" alt="SDD">
</p>

> A 5-phase spec-driven development hackathon project that evolves a simple in-memory Todo console application into a fully-featured, cloud-native AI-powered chatbot deployed on Kubernetes.

---

## 📋 Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [Phases](#phases)
- [Development](#development)
- [Tech Stack](#tech-stack)

---

## ✨ Features

### Phase I - Console Application (Completed ✅)

| Feature | Description |
|---------|-------------|
| ✅ Add Tasks | Create tasks with title, description, priority, due date |
| ✅ List Tasks | View all tasks in a rich table format |
| ✅ Update Tasks | Edit task titles and details |
| ✅ Delete Tasks | Remove tasks with confirmation |
| ✅ Complete Tasks | Mark tasks as complete/incomplete |
| ✅ Search | Search tasks by ID or keyword |
| ✅ Filter | Filter by status, priority, due date |
| ✅ Sort | Sort by priority, due date, created date |
| ✅ Calendar Views | Daily and weekly task views |
| ✅ Reminders | Set reminder notifications for tasks |
| ✅ Recurring Tasks | Automatic task recurrence (daily, weekly, monthly) |
| ✅ Progress Tracking | Visual progress percentage |

---

## 🚀 Quick Start

### Prerequisites

- Python 3.13+
- UV package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/SarimArain99/hackathon-todo-evolution.git
cd hackathon-todo-evolution

# Install dependencies
uv pip install -e .
```

### Run the CLI

```bash
# Option 1: Using the console script
todo-cli

# Option 2: Run as module
cd /home/sarimarain99/Dev/hackathon_2
PYTHONPATH=/home/sarimarain99/Dev/hackathon_2 .venv/bin/python -m src.cli.main

# Option 3: Direct execution
cd /home/sarimarain99/Dev/hackathon_2
PYTHONPATH=/home/sarimarain99/Dev/hackathon_2 .venv/bin/python src/cli/main.py
```

### Run Tests

```bash
uv run pytest
```

---

## 📁 Project Structure

```
hackathon-todo-evolution/
├── src/
│   ├── __init__.py          # Package metadata
│   ├── cli/
│   │   ├── __init__.py      # CLI exports
│   │   └── main.py          # Main CLI application
│   ├── models/
│   │   ├── __init__.py      # Model exports
│   │   └── task.py          # Task, Priority, TaskStatus, etc.
│   └── services/
│       ├── __init__.py      # Service exports
│       └── task_store.py    # In-memory task storage
├── tests/
│   ├── unit/                # Unit tests
│   └── integration/         # Integration tests
├── specs/
│   └── 001-hackathon-todo-evolution/  # Spec-driven artifacts
│       ├── spec.md          # Feature specification
│       ├── plan.md          # Technical plan
│       ├── tasks.md         # Implementation tasks
│       ├── data-model.md    # Entity definitions
│       ├── quickstart.md    # Integration scenarios
│       ├── research.md      # Technical decisions
│       └── checklists/      # Quality checklists
├── history/
│   ├── prompts/             # Prompt History Records (PHRs)
│   └── adr/                 # Architecture Decision Records
├── .specify/                # Spec-Kit Plus configuration
│   ├── templates/           # SDD templates
│   └── scripts/             # Automation scripts
├── CLAUDE.md                # Project rules
├── pyproject.toml           # Python project config
└── uv.lock                  # Dependency lock file
```

---

## 🎮 Usage

### Main Menu Options

```
TASK OPERATIONS
1  Add New Task        4  Delete Task
2  List All Tasks      5  Complete Task
3  Update Task         6  Mark In Progress

VIEW & ORGANIZE
7  Search Tasks        c  Calendar Views
8  Filter Tasks        r  Reminders
9  Sort Tasks

0  Exit Application
```

### Example Workflow

```
# Add a task
1 → "Buy groceries" → "Milk and bread" → medium → 2025-01-15

# List tasks
2 → View all tasks in table format

# Complete a task
5 → Enter task ID → Mark as complete

# Search for a task
7 → 1 → Search by ID
7 → 2 → Search by keyword

# Filter tasks
8 → 1 → Filter by status (Pending/In Progress/Completed)
8 → 2 → Filter by priority (Low/Medium/High)
8 → 3 → Filter by due date (Today/This Week/Overdue)
```

---

## 📊 Phases

| Phase | Description | Status | Points |
|-------|-------------|--------|--------|
| I | Console Application | ✅ Complete | 100 |
| II | Web Application | 🔄 In Progress | 150 |
| III | AI Chatbot | 📋 Planned | 200 |
| IV | Local Kubernetes | 📋 Planned | 250 |
| V | Cloud Deployment | 📋 Planned | 300 |

**Total Points: 1000** (+700 bonus available)

---

## 🛠️ Development

### Spec-Driven Development Workflow

This project follows the Spec-Driven Development (SDD) methodology:

1. **Specify** → `/sp.specify` - Create feature specification
2. **Clarify** → `/sp.clarify` - Resolve ambiguities
3. **Plan** → `/sp.plan` - Generate technical plan
4. **Tasks** → `/sp.tasks` - Break down into tasks
5. **Implement** → `/sp.implement` - Execute tasks (TDD)
6. **Analyze** → `/sp.analyze` - Validate artifacts

### Available Slash Commands

| Command | Description |
|---------|-------------|
| `/sp.specify` | Create a new feature specification |
| `/sp.plan` | Generate implementation plan |
| `/sp.tasks` | Break down into executable tasks |
| `/sp.implement` | Execute implementation |
| `/sp.analyze` | Analyze artifacts for quality |
| `/sp.clarify` | Resolve specification ambiguities |
| `/sp.phr` | Record Prompt History Record |
| `/sp.adr` | Create Architecture Decision Record |

---

## 🏗️ Tech Stack

### Current (Phase I)

| Technology | Purpose |
|------------|---------|
| Python 3.13+ | Core language |
| Rich | Terminal UI framework |
| UV | Package manager |
| Pytest | Testing framework |

### Upcoming (Phase II-V)

| Technology | Purpose |
|------------|---------|
| FastAPI | Web framework |
| Next.js | Frontend framework |
| Better Auth | Authentication |
| Neon DB | Serverless PostgreSQL |
| OpenAI | AI/Chatbot |
| Dapr | Distributed runtime |
| Kafka | Event streaming |
| Kubernetes | Container orchestration |

---

## 📝 License

MIT License

---

## 👤 Author

**SarimArain99**

- GitHub: [@SarimArain99](https://github.com/SarimArain99)

---

<p align="center">
  Built with Spec-Driven Development using Claude Code & Spec-Kit Plus
</p>
