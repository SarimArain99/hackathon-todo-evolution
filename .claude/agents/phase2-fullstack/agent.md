# Phase II: Full-Stack Web App Subagent

**Purpose**: Build a full-stack Todo web application with Next.js frontend and FastAPI backend.
**Phase**: II (Web Application)
**Points**: 150

## Capabilities

This agent specializes in:
- Next.js 15 App Router (Server/Client Components)
- FastAPI REST API development
- SQLModel ORM with Neon PostgreSQL
- Better Auth JWT authentication
- TypeScript and Python best practices

## Skills Referenced

- `.claude/skills/fastapi/SKILL.md`
- `.claude/skills/nextjs/SKILL.md`
- `.claude/skills/sqlmodel/SKILL.md`
- `.claude/skills/better-auth/SKILL.md`

## Task Execution Protocol

### 1. Backend Setup (FastAPI + SQLModel)

```python
# backend/app/models.py
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum

class Priority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

class TaskBase(SQLModel):
    title: str
    description: Optional[str] = None
    completed: bool = False
    priority: Priority = Priority.medium
    due_date: Optional[datetime] = None

class Task(TaskBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TaskCreate(TaskBase):
    pass

class TaskRead(TaskBase):
    id: int
    user_id: str
    created_at: datetime
```

```python
# backend/app/database.py
from sqlmodel import create_engine, Session, SQLModel
import os

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL, echo=True)

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
```

```python
# backend/app/main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from .models import Task, TaskCreate, TaskRead
from .database import get_session, init_db
from .auth import get_current_user

app = FastAPI(title="Todo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/api/tasks", response_model=list[TaskRead])
def list_tasks(
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user)
):
    statement = select(Task).where(Task.user_id == user_id)
    return session.exec(statement).all()

@app.post("/api/tasks", response_model=TaskRead)
def create_task(
    task: TaskCreate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user)
):
    db_task = Task(**task.model_dump(), user_id=user_id)
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return db_task

@app.patch("/api/tasks/{task_id}", response_model=TaskRead)
def update_task(
    task_id: int,
    task: TaskCreate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user)
):
    db_task = session.get(Task, task_id)
    if not db_task or db_task.user_id != user_id:
        raise HTTPException(status_code=404, detail="Task not found")
    for key, value in task.model_dump(exclude_unset=True).items():
        setattr(db_task, key, value)
    session.commit()
    session.refresh(db_task)
    return db_task

@app.delete("/api/tasks/{task_id}")
def delete_task(
    task_id: int,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user)
):
    db_task = session.get(Task, task_id)
    if not db_task or db_task.user_id != user_id:
        raise HTTPException(status_code=404, detail="Task not found")
    session.delete(db_task)
    session.commit()
    return {"ok": True}
```

### 2. JWT Authentication

```python
# backend/app/auth.py
from fastapi import HTTPException, Header
import jwt
import os

BETTER_AUTH_SECRET = os.getenv("BETTER_AUTH_SECRET")

def get_current_user(authorization: str = Header(...)) -> str:
    """Extract user_id from Better Auth JWT."""
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, BETTER_AUTH_SECRET, algorithms=["HS256"])
        return payload["sub"]  # user_id
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### 3. Frontend Setup (Next.js + Better Auth)

```typescript
// frontend/lib/auth.ts
import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    jwt({
      algorithm: "HS256",
      expiresIn: "7d",
    }),
  ],
});
```

```typescript
// frontend/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchTasks(token: string) {
  const res = await fetch(`${API_URL}/api/tasks`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function createTask(token: string, task: { title: string }) {
  const res = await fetch(`${API_URL}/api/tasks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
}
```

```tsx
// frontend/app/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TaskList } from "@/components/task-list";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Welcome, {session.user.name}!
      </h1>
      <TaskList userId={session.user.id} />
    </main>
  );
}
```

```tsx
// frontend/components/task-list.tsx
"use client";

import { useState, useEffect } from "react";
import { fetchTasks, createTask } from "@/lib/api";

export function TaskList({ userId }: { userId: string }) {
  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    const token = localStorage.getItem("token");
    if (token) {
      const data = await fetchTasks(token);
      setTasks(data);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (token && newTitle) {
      await createTask(token, { title: newTitle });
      setNewTitle("");
      loadTasks();
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New task..."
          className="border p-2 rounded"
        />
        <button type="submit" className="ml-2 bg-blue-500 text-white p-2 rounded">
          Add
        </button>
      </form>
      <ul>
        {tasks.map((task: any) => (
          <li key={task.id} className="p-2 border-b">
            {task.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Acceptance Criteria

- [ ] FastAPI backend with CRUD endpoints
- [ ] SQLModel models with Neon PostgreSQL
- [ ] JWT authentication via Better Auth
- [ ] User isolation (users see only their tasks)
- [ ] Next.js frontend with App Router
- [ ] Server Components for auth-protected pages
- [ ] Client Components for interactive task list
- [ ] CORS configured for frontend-backend communication
- [ ] Environment variables for secrets

## Environment Variables

```env
# Backend (.env)
DATABASE_URL=postgresql://user:pass@neon.db/todo
BETTER_AUTH_SECRET=your-shared-secret

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_SECRET=your-shared-secret
```

## Handoff to Phase III

Upon completion, this agent provides:
1. REST API endpoints for tasks
2. Database schema and models
3. Authentication flow
4. Frontend components

Phase III agent will:
- Add OpenAI Agents SDK for chat interface
- Create MCP server for tool execution
- Integrate ChatKit UI
