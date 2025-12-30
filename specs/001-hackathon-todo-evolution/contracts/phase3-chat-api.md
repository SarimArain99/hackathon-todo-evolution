# Phase III: Chat API Contract

**Type**: REST API with AI Agent
**Base URL**: `http://localhost:8000/api/chat`
**Authentication**: Bearer JWT Token

## Endpoints

### Send Message

```
POST /api/chat
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "message": "Add a task to buy groceries",
  "conversation_id": "conv-uuid"  // optional, creates new if omitted
}

Response 200:
{
  "response": "I've added 'buy groceries' to your todo list with ID 1. Would you like to set a due date or priority?",
  "conversation_id": "conv-uuid",
  "tool_calls": [
    {
      "tool": "add_task",
      "input": {"title": "buy groceries"},
      "output": {"id": 1, "title": "buy groceries", "completed": false}
    }
  ]
}
```

### Get Conversation History

```
GET /api/chat/conversations
Authorization: Bearer <jwt_token>

Response 200:
{
  "conversations": [
    {
      "id": "conv-uuid",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z",
      "message_count": 10
    }
  ]
}
```

### Get Messages

```
GET /api/chat/conversations/{conversation_id}/messages
Authorization: Bearer <jwt_token>

Response 200:
{
  "messages": [
    {
      "id": 1,
      "role": "user",
      "content": "Add a task to buy groceries",
      "created_at": "2025-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "role": "assistant",
      "content": "I've added 'buy groceries' to your todo list...",
      "created_at": "2025-01-01T00:00:01Z"
    }
  ]
}
```

### Delete Conversation

```
DELETE /api/chat/conversations/{conversation_id}
Authorization: Bearer <jwt_token>

Response 200:
{
  "ok": true
}
```

## MCP Tools Available

### add_task

**Description**: Add a new task to the user's todo list

**Input Schema**:
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "priority": "low|medium|high (default: medium)",
  "due_date": "ISO datetime (optional)",
  "tags": "string[] (optional)"
}
```

**Output**:
```json
{
  "id": 1,
  "title": "buy groceries",
  "message": "Task 'buy groceries' added successfully!"
}
```

### list_tasks

**Description**: List all tasks for the current user

**Input Schema**:
```json
{
  "include_completed": "boolean (default: false)",
  "priority": "low|medium|high (optional)",
  "search": "string (optional)"
}
```

**Output**:
```json
{
  "tasks": [
    {"id": 1, "title": "buy groceries", "completed": false, "priority": "high"}
  ],
  "message": "You have 1 pending task"
}
```

### complete_task

**Description**: Mark a task as completed

**Input Schema**:
```json
{
  "task_id": "integer (required)"
}
```

**Output**:
```json
{
  "id": 1,
  "title": "buy groceries",
  "completed": true,
  "message": "Task 'buy groceries' marked as complete!"
}
```

### delete_task

**Description**: Delete a task

**Input Schema**:
```json
{
  "task_id": "integer (required)"
}
```

**Output**:
```json
{
  "message": "Task 'buy groceries' deleted successfully!"
}
```

### update_task

**Description**: Update task details

**Input Schema**:
```json
{
  "task_id": "integer (required)",
  "title": "string (optional)",
  "description": "string (optional)",
  "priority": "low|medium|high (optional)",
  "due_date": "ISO datetime (optional)"
}
```

**Output**:
```json
{
  "id": 1,
  "title": "buy fruits",
  "message": "Task updated successfully!"
}
```

### set_reminder (Phase V)

**Description**: Set a reminder for a task

**Input Schema**:
```json
{
  "task_id": "integer (required)",
  "remind_at": "ISO datetime (required)"
}
```

**Output**:
```json
{
  "task_id": 1,
  "remind_at": "2025-01-02T09:00:00Z",
  "message": "Reminder set for 'buy groceries' at 9:00 AM"
}
```

## Example Conversations

### Adding a Task

```
User: "I need to buy groceries tomorrow"
Assistant: "I've added 'buy groceries' to your todo list with a due date of tomorrow. Would you like to set a priority or any tags?"
```

### Listing Tasks

```
User: "What's on my list?"
Assistant: "Here are your pending tasks:
1. Buy groceries (high priority, due tomorrow)
2. Finish report (medium priority)
3. Call mom (low priority)

You have 3 tasks pending. Would you like to complete any of them?"
```

### Completing a Task

```
User: "I finished buying groceries"
Assistant: "Great! I've marked 'buy groceries' as complete. You now have 2 pending tasks remaining."
```

### Natural Language Understanding

The agent should understand variations:
- "add", "create", "new task", "remind me to"
- "show", "list", "what do I have", "my tasks"
- "done", "finished", "completed", "mark complete"
- "remove", "delete", "cancel"

## Error Handling

### Task Not Found

```
User: "Complete task 99"
Assistant: "I couldn't find a task with ID 99. Would you like me to list your current tasks?"
```

### Ambiguous Input

```
User: "Buy milk"
Assistant: "Would you like me to add 'Buy milk' as a new task, or were you looking for an existing task?"
```
