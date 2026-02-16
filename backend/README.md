# Hackathon Todo Evolution - Backend API

FastAPI backend for the Todo Evolution application with JWT authentication.

## Features

- RESTful API for task management
- JWT authentication (Better Auth compatible)
- Health check endpoints
- CORS enabled for frontend integration
- SQLite database (configurable for PostgreSQL)

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `7860` | No |
| `DATABASE_URL` | Database connection string | `sqlite:///./todo.db` | No |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` | No |
| `HF_PROXY_URL` | Hugging Face proxy URL (optional) | - | No |
| `JWT_ISSUER` | JWT token issuer | `$FRONTEND_URL` | No |
| `JWT_AUDIENCE` | JWT token audience | `$FRONTEND_URL` | No |
| `NEXT_PUBLIC_API_URL` | Better Auth API URL | `http://localhost:3000` | No |
| `OPENAI_API_KEY` | OpenAI API key for AI chatbot | - | **Yes (for chatbot)** |
| `OPENAI_MODEL` | OpenAI model to use | `gpt-4o-mini` | No |
| `OPENAI_TIMEOUT` | OpenAI API timeout (seconds) | `30.0` | No |
| `QDRANT_URL` | Qdrant vector database URL | `http://localhost:6333` | No |
| `QDRANT_API_KEY` | Qdrant API key (if required) | - | No |
| `BETTER_AUTH_SECRET` | Shared secret for Better Auth JWT | - | No |
| `BETTER_AUTH_URL` | Better Auth backend URL | `http://localhost:3000` | No |

## API Endpoints

### Health
- `GET /health` - Health check
- `GET /health/with-db` - Health check with database verification

### Auth
- `GET /api/auth/me` - Get current authenticated user

### Tasks
- `GET /api/tasks` - List all tasks (authenticated)
  - Supports: sorting, filtering, date ranges, presets
  - Query params: `sort_by`, `sort_order`, `filter_start`, `filter_end`, `preset_filter`
- `POST /api/tasks` - Create a new task (authenticated)
  - Supports: recurrence rules (RRULE format)
- `GET /api/tasks/{id}` - Get a specific task (authenticated)
- `PUT /api/tasks/{id}` - Update a task (authenticated)
  - Includes optimistic locking for concurrent edits
- `DELETE /api/tasks/{id}` - Delete a task (authenticated)
- `POST /api/tasks/{id}/complete` - Mark task as complete (authenticated)
  - Creates next instance for recurring tasks

### Notifications
- `GET /api/notifications` - List notifications (authenticated)
- `GET /api/notifications/unread-count` - Get unread count (authenticated)
- `PATCH /api/notifications/{id}/read` - Mark as read (authenticated)
- `DELETE /api/notifications/{id}` - Dismiss notification (authenticated)

## Background Jobs

The application uses APScheduler to run background tasks for due date reminders.

### Due Date Reminders

- **Schedule**: Daily at midnight (00:00 UTC)
- **Function**: Checks for tasks due within 24 hours and creates reminder notifications
- **Implementation**: `due_date_reminder_job()` in `app/main.py`

### Notification Cleanup

To keep the notification table from growing indefinitely, you can set up a periodic cleanup job:

```sql
-- The cleanup_old_notifications() function is defined in the migration
-- Call it periodically to delete notifications older than 90 days:
SELECT cleanup_old_notifications();
```

**Recommended setup for PostgreSQL**:

1. **Manual cleanup** (run occasionally):
   ```bash
   psql $DATABASE_URL -c "SELECT cleanup_old_notifications();"
   ```

2. **Scheduled cleanup** via cron (add to crontab):
   ```bash
   # Run cleanup weekly on Sunday at 2 AM
   0 2 * * 0 psql $DATABASE_URL -c "SELECT cleanup_old_notifications();"
   ```

3. **Using pg_cron** (if available):
   ```sql
   SELECT cron.schedule('weekly-notification-cleanup',
                        '0 2 * * 0',
                        'SELECT cleanup_old_notifications();');
   ```

**Note for SQLite**: The cleanup function is still created, but you'll need to run it manually since SQLite doesn't have built-in job scheduling. Consider using the application's scheduler or external cron.

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

## Hugging Face Spaces Deployment

To deploy on Hugging Face Spaces, you need to configure the following secrets in your Space settings:

### Required Secrets (for chatbot functionality)

1. **OPENAI_API_KEY** - Your OpenAI API key (required for AI chatbot)
   - Get it from: https://platform.openai.com/api-keys

2. **QDRANT_URL** - Qdrant vector database URL
   - Use a hosted Qdrant instance or deploy Qdrant on Hugging Face
   - Example: `https://your-qdrant-instance.qdrant.io`

3. **QDRANT_API_KEY** - Qdrant API key (if your Qdrant instance requires authentication)

4. **BETTER_AUTH_SECRET** - Shared secret for Better Auth JWT validation
   - Generate a random string: `openssl rand -base64 32`

5. **BETTER_AUTH_URL** - Your Better Auth backend URL
   - For local: `http://localhost:3000`
   - For production: `https://your-app.vercel.app`

### Optional Secrets

- **OPENAI_MODEL** - Override the default model (default: `gpt-4o-mini`)
- **DATABASE_URL** - PostgreSQL connection string (defaults to SQLite if not provided)
- **FRONTEND_URL** - Your frontend URL for CORS (default: auto-detected)

### Setting Secrets in Hugging Face

1. Go to your Space settings
2. Navigate to "Variables and secrets"
3. Click "New secret"
4. Add each secret with its name and value
5. Restart the Space after adding secrets

## API Documentation

Interactive API docs available at `/docs` when running.
