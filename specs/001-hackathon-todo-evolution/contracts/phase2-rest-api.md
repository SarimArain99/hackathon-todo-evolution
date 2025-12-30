# Phase II: REST API Contract

**Type**: RESTful HTTP API
**Base URL**: `http://localhost:8000/api`
**Authentication**: Bearer JWT Token

## Authentication

All endpoints (except health) require:
```
Authorization: Bearer <jwt_token>
```

JWT payload contains:
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "exp": 1735689600
}
```

## Endpoints

### Health Check

```
GET /health

Response 200:
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

### Tasks

#### List Tasks

```
GET /api/tasks
GET /api/tasks?completed=false
GET /api/tasks?priority=high
GET /api/tasks?search=groceries

Response 200:
{
  "tasks": [
    {
      "id": 1,
      "title": "Buy groceries",
      "description": "Get milk and bread",
      "completed": false,
      "priority": "high",
      "tags": ["shopping"],
      "due_date": "2025-01-02T10:00:00Z",
      "recurrence_rule": null,
      "user_id": "user-uuid",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 1
}
```

#### Get Task

```
GET /api/tasks/{task_id}

Response 200:
{
  "id": 1,
  "title": "Buy groceries",
  ...
}

Response 404:
{
  "detail": "Task not found"
}
```

#### Create Task

```
POST /api/tasks
Content-Type: application/json

{
  "title": "Buy groceries",
  "description": "Get milk and bread",
  "priority": "high",
  "tags": ["shopping"],
  "due_date": "2025-01-02T10:00:00Z"
}

Response 201:
{
  "id": 1,
  "title": "Buy groceries",
  ...
}

Response 422:
{
  "detail": [
    {
      "loc": ["body", "title"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

#### Update Task

```
PATCH /api/tasks/{task_id}
Content-Type: application/json

{
  "title": "Buy fruits",
  "priority": "medium"
}

Response 200:
{
  "id": 1,
  "title": "Buy fruits",
  "priority": "medium",
  ...
}

Response 404:
{
  "detail": "Task not found"
}
```

#### Delete Task

```
DELETE /api/tasks/{task_id}

Response 200:
{
  "ok": true
}

Response 404:
{
  "detail": "Task not found"
}
```

#### Complete Task

```
POST /api/tasks/{task_id}/complete

Response 200:
{
  "id": 1,
  "completed": true,
  ...
}
```

#### Uncomplete Task

```
POST /api/tasks/{task_id}/uncomplete

Response 200:
{
  "id": 1,
  "completed": false,
  ...
}
```

## Error Responses

### 401 Unauthorized

```json
{
  "detail": "Invalid or expired token"
}
```

### 403 Forbidden

```json
{
  "detail": "Not authorized to access this resource"
}
```

### 404 Not Found

```json
{
  "detail": "Task not found"
}
```

### 422 Validation Error

```json
{
  "detail": [
    {
      "loc": ["body", "title"],
      "msg": "ensure this value has at least 1 characters",
      "type": "value_error.any_str.min_length"
    }
  ]
}
```

### 500 Internal Server Error

```json
{
  "detail": "Internal server error"
}
```

## CORS Configuration

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## OpenAPI Schema

Available at: `GET /docs` (Swagger UI) and `GET /openapi.json`
