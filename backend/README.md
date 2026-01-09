# Hackathon Todo Evolution - Backend API

FastAPI backend for the Todo Evolution application with JWT authentication.

## Features

- RESTful API for task management
- JWT authentication (Better Auth compatible)
- Health check endpoints
- CORS enabled for frontend integration
- SQLite database (configurable for PostgreSQL)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `7860` |
| `DATABASE_URL` | Database connection string | `sqlite:///./todo.db` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `HF_PROXY_URL` | Hugging Face proxy URL (optional) | - |
| `JWT_ISSUER` | JWT token issuer | `$FRONTEND_URL` |
| `JWT_AUDIENCE` | JWT token audience | `$FRONTEND_URL` |
| `NEXT_PUBLIC_API_URL` | Better Auth API URL | `http://localhost:3000` |

## API Endpoints

### Health
- `GET /health` - Health check
- `GET /health/with-db` - Health check with database verification

### Auth
- `GET /api/auth/me` - Get current authenticated user

### Tasks
- `GET /api/tasks` - List all tasks (authenticated)
- `POST /api/tasks` - Create a new task (authenticated)
- `GET /api/tasks/{id}` - Get a specific task (authenticated)
- `PUT /api/tasks/{id}` - Update a task (authenticated)
- `DELETE /api/tasks/{id}` - Delete a task (authenticated)
- `POST /api/tasks/{id}/complete` - Mark task as complete (authenticated)

## Running Locally

```bash
# Install dependencies
pip install -e .

# Run the server
uvicorn app.main:app --reload --port 8000
```

## Docker

```bash
# Build
docker build -t todo-backend .

# Run
docker run -p 7860:7860 -e DATABASE_URL=sqlite:///./todo.db todo-backend
```

## API Documentation

Interactive API docs available at `/docs` when running.
