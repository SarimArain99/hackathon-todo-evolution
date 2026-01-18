# Quickstart: AI Chatbot Development

**Feature**: 003-ai-chatbot
**Phase**: III - AI Chatbot
**Prerequisites**: Phase II (Web App) complete

## Prerequisites

Before starting development, ensure:

- [ ] Phase II web application is running locally
- [ ] Backend server runs on `http://localhost:8000`
- [ ] Frontend runs on `http://localhost:3000`
- [ ] Better Auth authentication is working
- [ ] Database (Neon PostgreSQL) is accessible
- [ ] OpenAI API key is available

---

## 1. Backend Setup

### 1.1 Install Dependencies

```bash
cd backend

# Add OpenAI Agents SDK and MCP SDK
uv add openai-agents-sdk mcp

# Verify installation
uv pip list | grep -E "agents|mcp"
```

### 1.2 Environment Variables

Add to `backend/.env`:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Existing variables from Phase II
DATABASE_URL=postgresql://...
JWT_SECRET=...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000
```

### 1.3 Create MCP Server Structure

```bash
# Create MCP server directory (may already exist)
mkdir -p backend/app/mcp_server

# Create files
touch backend/app/mcp_server/__init__.py
touch backend/app/mcp_server/server.py
touch backend/app/mcp_server/tools.py
```

### 1.4 Create Conversation Service

```bash
# Create conversation service
touch backend/app/services/conversation_service.py

# Update models.py with Conversation and Message entities
```

---

## 2. Database Migration

### 2.1 Create Migration

```bash
cd backend

# Create new migration
alembic revision --autogenerate -m "Add conversation and message tables"

# Review the generated migration file
# Verify conversation and message tables are created correctly
```

### 2.2 Run Migration

```bash
# Apply migration
alembic upgrade head

# Verify tables created
psql $DATABASE_URL -c "\dt conversation"
psql $DATABASE_URL -c "\dt message"
```

---

## 3. Frontend Setup

### 3.1 Install ChatKit

```bash
cd frontend

# Install OpenAI ChatKit
npm install @openai/chatkit

# Verify installation
grep "@openai/chatkit" package.json
```

### 3.2 Create Chat Components

```bash
# Create chat component directory
mkdir -p frontend/components/chat

# Create component files
touch frontend/components/chat.tsx
touch frontend/components/chat-input.tsx
touch frontend/components/conversation-list.tsx

# Create chat page
mkdir -p frontend/app/\(protected\)/chat
touch frontend/app/\(protected\)/chat/page.tsx
```

### 3.3 Add Chat Navigation

Update `frontend/app/(protected)/layout.tsx` to include chat link:

```tsx
<link href="/chat">Chat Assistant</link>
```

---

## 4. Running the Application

### 4.1 Start Backend

```bash
cd backend

# Option 1: Direct run
uv run uvicorn app.main:app --reload --port 8000

# Option 2: Using script
python -m app.main
```

Verify:
- Backend runs on `http://localhost:8000`
- Health check: `curl http://localhost:8000/health`
- API docs: `http://localhost:8000/docs`

### 4.2 Start Frontend

```bash
cd frontend

npm run dev
```

Verify:
- Frontend runs on `http://localhost:3000`
- Sign in works with existing account
- Navigation shows "Chat" link

---

## 5. Testing the Chatbot

### 5.1 Manual Test Sequence

1. **Navigate to chat page**
   - Go to `http://localhost:3000/chat`
   - Verify chat interface loads

2. **Send first message**
   - Type: "Add a task to buy groceries"
   - Verify: AI responds confirming task creation
   - Check: Task appears in main todo list

3. **List tasks**
   - Type: "What's on my list?"
   - Verify: AI shows all tasks

4. **Complete task**
   - Type: "Mark the grocery task as complete"
   - Verify: Task marked complete in main list

5. **Test conversation memory**
   - Type: "What did I just create?"
   - Verify: AI references previous messages

6. **Test conversation persistence**
   - Refresh page
   - Send: "Continue"
   - Verify: Previous context is restored

### 5.2 API Testing with cURL

```bash
# Set auth token (get from browser dev tools)
export TOKEN="your-jwt-token"

# Send message
curl -X POST http://localhost:8000/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Add a task to buy groceries"}'

# List conversations
curl http://localhost:8000/api/chat/conversations \
  -H "Authorization: Bearer $TOKEN"

# Get conversation messages
curl http://localhost:8000/api/chat/conversations/1/messages \
  -H "Authorization: Bearer $TOKEN"
```

---

## 6. Troubleshooting

### Issue: OpenAI API Errors

**Symptom**: "AI service unavailable" error

**Solution**:
1. Check `OPENAI_API_KEY` is set correctly
2. Verify API key has credits
3. Check model name is correct (`gpt-4o-mini`)

### Issue: Conversation Not Persisting

**Symptom**: Messages lost on refresh

**Solution**:
1. Check database tables exist: `\dt conversation`
2. Verify database connection string
3. Check server logs for database errors

### Issue: Tools Not Being Called

**Symptom**: AI responds but no tasks created

**Solution**:
1. Check MCP server is running
2. Verify tools are registered with agent
3. Check agent instructions include tool usage
4. Review agent logs for tool call attempts

### Issue: Cross-Origin Errors

**Symptom**: CORS errors in browser console

**Solution**:
1. Check backend CORS configuration
2. Verify `BETTER_AUTH_URL` matches frontend URL
3. Check JWT middleware configuration

---

## 7. Development Workflow

### Code Organization

```
backend/
├── app/
│   ├── main.py                 # FastAPI app, routes registration
│   ├── models.py               # SQLModel entities (add Conversation, Message)
│   ├── auth.py                 # JWT middleware (existing)
│   ├── database.py             # Database connection (existing)
│   ├── mcp_server/
│   │   ├── server.py           # MCP FastMCP server setup
│   │   └── tools.py            # MCP tools (add_task, list_tasks, etc.)
│   ├── services/
│   │   ├── task_service.py     # Existing task CRUD
│   │   ├── conversation_service.py  # NEW - conversation CRUD
│   │   └── agent_service.py    # NEW - OpenAI Agents orchestration
│   └── routes/
│       ├── tasks.py            # Existing task routes
│       └── chat.py             # NEW - chat endpoints

frontend/
├── app/
│   └── (protected)/
│       └── chat/
│           └── page.tsx        # Chat page
├── components/
│   ├── chat.tsx                # Chat interface
│   ├── chat-input.tsx          # Input component
│   └── conversation-list.tsx   # Sidebar
└── lib/
    └── api/
        └── chat.ts             # Chat API client
```

---

## 8. Next Steps

After setup is complete:

1. **Implement MCP Tools** (`backend/app/mcp_server/tools.py`)
   - add_task, list_tasks, complete_task, delete_task, update_task

2. **Implement Agent Service** (`backend/app/services/agent_service.py`)
   - Create agent with tools
   - Handle conversation context
   - Process messages

3. **Implement Chat Routes** (`backend/app/routes/chat.py`)
   - POST /api/chat
   - GET /api/chat/conversations
   - GET /api/chat/conversations/{id}/messages
   - DELETE /api/chat/conversations/{id}

4. **Implement Chat UI** (`frontend/components/chat.tsx`)
   - Message display
   - Input with send
   - Conversation sidebar
   - Streaming responses

5. **Testing**
   - Unit tests for tools
   - Integration tests for chat endpoint
   - AI accuracy test suite

---

## 9. Production Considerations

Before deploying:

- [ ] Set OpenAI API rate limits
- [ ] Configure request timeouts
- [ ] Add monitoring for AI failures
- [ ] Set up log aggregation
- [ ] Configure CDN for frontend assets
- [ ] Review security headers
- [ ] Set up database backups
- [ ] Configure error tracking (Sentry)
