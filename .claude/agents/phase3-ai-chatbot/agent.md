# Phase III: AI Chatbot Subagent

**Purpose**: Add AI-powered chat interface using OpenAI Agents SDK and MCP for natural language task management.
**Phase**: III (AI Integration)
**Points**: 200

## Capabilities

This agent specializes in:
- OpenAI Agents SDK with function tools
- MCP (Model Context Protocol) server development
- Chat-based task management
- Natural language processing for todos
- OpenAI ChatKit UI integration

## Skills Referenced

- `.claude/skills/openai-agents-sdk/SKILL.md`
- `.claude/skills/mcp-sdk/SKILL.md`
- `.claude/skills/fastapi/SKILL.md`

## Task Execution Protocol

### 1. MCP Server for Todo Operations

```python
# backend/mcp_server/server.py
from mcp.server.fastmcp import FastMCP
from sqlmodel import Session, select
from app.models import Task, TaskCreate
from app.database import engine

mcp = FastMCP("Todo MCP Server")

@mcp.tool()
def add_task(title: str, description: str = None, priority: str = "medium") -> dict:
    """Add a new task to the todo list.

    Args:
        title: The task title
        description: Optional task description
        priority: Task priority (low, medium, high)
    """
    with Session(engine) as session:
        task = Task(
            title=title,
            description=description,
            priority=priority,
            user_id="current_user"  # Set from context
        )
        session.add(task)
        session.commit()
        session.refresh(task)
        return {
            "id": task.id,
            "title": task.title,
            "message": f"Task '{title}' added successfully!"
        }

@mcp.tool()
def list_tasks(include_completed: bool = False) -> list[dict]:
    """List all tasks in the todo list.

    Args:
        include_completed: Whether to include completed tasks
    """
    with Session(engine) as session:
        statement = select(Task).where(Task.user_id == "current_user")
        if not include_completed:
            statement = statement.where(Task.completed == False)
        tasks = session.exec(statement).all()
        return [
            {
                "id": t.id,
                "title": t.title,
                "completed": t.completed,
                "priority": t.priority,
                "due_date": str(t.due_date) if t.due_date else None
            }
            for t in tasks
        ]

@mcp.tool()
def complete_task(task_id: int) -> dict:
    """Mark a task as completed.

    Args:
        task_id: The ID of the task to complete
    """
    with Session(engine) as session:
        task = session.get(Task, task_id)
        if not task:
            return {"error": f"Task {task_id} not found"}
        task.completed = True
        session.commit()
        return {
            "id": task.id,
            "title": task.title,
            "message": f"Task '{task.title}' marked as completed!"
        }

@mcp.tool()
def delete_task(task_id: int) -> dict:
    """Delete a task from the todo list.

    Args:
        task_id: The ID of the task to delete
    """
    with Session(engine) as session:
        task = session.get(Task, task_id)
        if not task:
            return {"error": f"Task {task_id} not found"}
        title = task.title
        session.delete(task)
        session.commit()
        return {"message": f"Task '{title}' deleted successfully!"}

@mcp.tool()
def set_reminder(task_id: int, remind_at: str) -> dict:
    """Set a reminder for a task.

    Args:
        task_id: The ID of the task
        remind_at: When to remind (ISO format datetime)
    """
    from datetime import datetime
    with Session(engine) as session:
        task = session.get(Task, task_id)
        if not task:
            return {"error": f"Task {task_id} not found"}
        # Store reminder (would trigger notification service)
        return {
            "task_id": task_id,
            "remind_at": remind_at,
            "message": f"Reminder set for '{task.title}' at {remind_at}"
        }

if __name__ == "__main__":
    mcp.run()
```

### 2. OpenAI Agents SDK Integration

```python
# backend/app/chat_agent.py
from agents import Agent, Runner, function_tool
from sqlmodel import Session, select
from .models import Task
from .database import engine

@function_tool
def add_task(title: str, description: str = None, priority: str = "medium") -> str:
    """Add a new task to the user's todo list."""
    with Session(engine) as session:
        task = Task(
            title=title,
            description=description,
            priority=priority,
            user_id="current_user"
        )
        session.add(task)
        session.commit()
        return f"Created task: {title} (ID: {task.id})"

@function_tool
def list_tasks(include_completed: bool = False) -> str:
    """List all tasks in the todo list."""
    with Session(engine) as session:
        statement = select(Task).where(Task.user_id == "current_user")
        if not include_completed:
            statement = statement.where(Task.completed == False)
        tasks = session.exec(statement).all()
        if not tasks:
            return "No tasks found."
        result = "Your tasks:\n"
        for t in tasks:
            status = "done" if t.completed else "pending"
            result += f"- [{t.id}] {t.title} ({t.priority}, {status})\n"
        return result

@function_tool
def complete_task(task_id: int) -> str:
    """Mark a task as completed."""
    with Session(engine) as session:
        task = session.get(Task, task_id)
        if not task:
            return f"Task {task_id} not found"
        task.completed = True
        session.commit()
        return f"Completed: {task.title}"

@function_tool
def delete_task(task_id: int) -> str:
    """Delete a task."""
    with Session(engine) as session:
        task = session.get(Task, task_id)
        if not task:
            return f"Task {task_id} not found"
        title = task.title
        session.delete(task)
        session.commit()
        return f"Deleted: {title}"

# Create the Todo Agent
todo_agent = Agent(
    name="TodoAssistant",
    instructions="""You are a helpful todo list assistant. Help users manage their tasks by:
    - Adding new tasks when they mention things to do
    - Listing their current tasks when asked
    - Marking tasks as complete
    - Deleting tasks they no longer need

    Be friendly and proactive. If a user mentions something that sounds like a task,
    offer to add it. Keep responses concise and helpful.""",
    tools=[add_task, list_tasks, complete_task, delete_task]
)

async def chat(message: str, conversation_history: list = None) -> str:
    """Process a chat message and return the assistant's response."""
    history = conversation_history or []
    history.append({"role": "user", "content": message})

    result = await Runner.run(todo_agent, history)

    return result.final_output
```

### 3. Chat API Endpoint

```python
# backend/app/routes/chat.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..chat_agent import chat
from ..auth import get_current_user

router = APIRouter(prefix="/api/chat", tags=["chat"])

class ChatMessage(BaseModel):
    message: str
    conversation_id: str = None

class ChatResponse(BaseModel):
    response: str
    conversation_id: str

# In-memory conversation storage (use Redis/DB in production)
conversations: dict[str, list] = {}

@router.post("/", response_model=ChatResponse)
async def send_message(
    body: ChatMessage,
    user_id: str = Depends(get_current_user)
):
    conv_id = body.conversation_id or f"{user_id}_{len(conversations)}"
    history = conversations.get(conv_id, [])

    response = await chat(body.message, history)

    # Update conversation history
    history.append({"role": "user", "content": body.message})
    history.append({"role": "assistant", "content": response})
    conversations[conv_id] = history

    return ChatResponse(response=response, conversation_id=conv_id)
```

### 4. Frontend Chat Component

```tsx
// frontend/components/chat.tsx
"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage,
          conversation_id: conversationId,
        }),
      });

      const data = await res.json();
      setConversationId(data.conversation_id);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[600px] border rounded-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me to manage your tasks..."
            className="flex-1 p-2 border rounded"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
```

## Acceptance Criteria

- [ ] MCP server with todo tools (add, list, complete, delete, reminder)
- [ ] OpenAI Agents SDK agent with function tools
- [ ] Chat API endpoint with conversation history
- [ ] Natural language task creation ("remind me to buy milk")
- [ ] Context-aware responses
- [ ] Frontend chat component
- [ ] Conversation persistence
- [ ] Tool execution visible in responses

## Example Conversations

```
User: "I need to buy groceries tomorrow"
Assistant: I've added "Buy groceries" to your todo list with a due date of tomorrow. Would you like me to set a reminder?

User: "What do I have on my list?"
Assistant: Here are your current tasks:
- [1] Buy groceries (medium, pending) - due tomorrow
- [2] Finish report (high, pending)

User: "I finished the report"
Assistant: Great! I've marked "Finish report" as completed. You have 1 remaining task.
```

## Handoff to Phase IV

Upon completion, this agent provides:
1. MCP server for todo operations
2. OpenAI Agents integration
3. Chat API with history
4. Frontend chat component

Phase IV agent will:
- Containerize all services with Docker
- Create Helm charts for Kubernetes
- Deploy to Minikube
