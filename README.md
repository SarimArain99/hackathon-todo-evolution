---
title: Hackathon Todo Evolution
emoji: ✅
colorFrom: blue
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# ✅ Hackathon Todo Evolution

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)

A 5-phase spec-driven development (SDD) hackathon project building a modern task management application with full-stack TypeScript, React 19, and FastAPI.

---

## 🚀 Deployment Architecture

The application uses a distributed architecture for scalability:

- **Frontend**: Deployed on [Vercel](https://vercel.com) for edge-optimized delivery.
- **Backend API**: Hugging Face Docker Space (containerized FastAPI).
- **Database**: SQLite (ephemeral, see note below).

### ⚠️ Data Persistence Note

**Phase II Limitation**: The Docker container uses SQLite storage which is **ephemeral**:
- Data is lost on every new deployment
- Data is lost when the Hugging Face Space "sleeps" (~48hr inactivity)
- This is acceptable for Phase II hackathon submission

**Phase III Solution**: Migrate to [Neon Serverless Postgres](https://neon.tech) for persistent cloud storage.

---

## 🛠️ Tech Stack

### Backend
- **FastAPI**: High-performance async Python framework
- **Docker**: Multi-stage production builds
- **SQLModel**: Modern data validation and ORM
- **JWT Authentication**: Better Auth compatible

### Frontend
- **Next.js 16**: React 19 with App Router
- **Tailwind CSS 4**: Utility-first styling
- **Framer Motion**: UI animations
- **Better Auth**: Authentication library
- **shadcn/ui**: Component library

---

## 📂 Project Structure

```text
.
├── backend/                # FastAPI Dockerized Backend
│   ├── app/                # Application logic & routes
│   ├── tests/              # Backend tests
│   ├── Dockerfile          # Production Dockerfile
│   └── pyproject.toml      # Python dependencies
├── frontend/               # Next.js 16 Application
│   ├── app/                # App router (pages & API)
│   ├── components/         # UI components
│   └── lib/                # Utilities & auth
├── .github/workflows/      # CI/CD
│   └── sync_to_hf.yml      # Sync to Hugging Face
└── README.md
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | Health check |
| `GET` | `/health/with-db` | Health with DB verification |
| `GET` | `/api/tasks` | List all tasks (auth) |
| `POST` | `/api/tasks` | Create a task (auth) |
| `GET` | `/api/tasks/{id}` | Get specific task (auth) |
| `PUT` | `/api/tasks/{id}` | Update task (auth) |
| `DELETE` | `/api/tasks/{id}` | Delete task (auth) |
| `POST` | `/api/tasks/{id}/complete` | Mark complete (auth) |

Interactive docs: `/docs` (Swagger) or `/redoc`

---

## 🏆 Hackathon Roadmap

| Phase | Description | Status | Points |
| --- | --- | --- | --- |
| **I** | Console Application | ✅ Complete | 100 |
| **II** | Web Application (Fullstack) | 🚀 In Progress | 150 |
| **III** | AI Productivity Agent | 📋 Planned | 200 |
| **IV** | Kubernetes | 📋 Planned | 250 |
| **V** | Cloud Native | 📋 Planned | 300 |

---

## 📄 License

MIT License - see LICENSE file for details.

---

<p align="center">
Built with ❤️ by <b>SarimArain99</b> using Spec-Driven Development.
</p>