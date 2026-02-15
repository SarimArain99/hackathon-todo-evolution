"""Add database indexes for common query patterns.

Revision ID: add_indexes
Revises:
Create Date: 2026-02-14

"""
from alembic import op
from sqlalchemy import text

# Common indexes for performance
def upgrade():
    # Index on tasks for due_date filtering (commonly used in reminders)
    op.execute(
        text("CREATE INDEX IF NOT EXISTS idx_task_due_date ON task (due_date)")
    )

    # Index on tasks for created_at sorting (default sort order)
    op.execute(
        text("CREATE INDEX IF NOT EXISTS idx_task_created_at ON task (created_at DESC)")
    )

    # Index on tasks for updated_at sorting
    op.execute(
        text("CREATE INDEX IF NOT EXISTS idx_task_updated_at ON task (updated_at DESC)")
    )

    # Index on tasks for priority filtering
    op.execute(
        text("CREATE INDEX IF NOT EXISTS idx_task_priority ON task (priority)")
    )

    # Index on notifications for read status filtering (common query)
    op.execute(
        text("CREATE INDEX IF NOT EXISTS idx_notification_read ON notification (read)")
    )

    # Index on notifications for created_at sorting
    op.execute(
        text("CREATE INDEX IF NOT EXISTS idx_notification_created_at ON notification (created_at DESC)")
    )

    # Index on notifications for task_id lookups
    op.execute(
        text("CREATE INDEX IF NOT EXISTS idx_notification_task_id ON notification (task_id)")
    )

    print("Database indexes created successfully")
