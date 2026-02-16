"""
Simple script to apply database indexes without alembic complexity.
"""
import asyncio
from sqlalchemy import create_engine, text


async def apply_indexes():
    """Apply database indexes for common queries."""
    database_url = "sqlite:///./todo.db"
    engine = create_engine(database_url)

    with engine.connect() as conn:
        # Index for tasks due_date
        conn.execute(
            text("CREATE INDEX IF NOT EXISTS idx_task_due_date ON task (due_date)")
        )

        # Index for tasks created_at (default sort order)
        conn.execute(
            text("CREATE INDEX IF NOT EXISTS idx_task_created_at ON task (created_at DESC)")
        )

        # Index for tasks updated_at
        conn.execute(
            text("CREATE INDEX IF NOT EXISTS idx_task_updated_at ON task (updated_at DESC)")
        )

        # Index for tasks priority
        conn.execute(
            text("CREATE INDEX IF NOT EXISTS idx_task_priority ON task (priority)")
        )

        # Index for notifications read status (common query)
        conn.execute(
            text("CREATE INDEX IF NOT EXISTS idx_notification_read ON notification (read)")
        )

        # Index for notifications created_at
        conn.execute(
            text("CREATE INDEX IF NOT EXISTS idx_notification_created_at ON notification (created_at DESC)")
        )

        # Index for notifications task_id
        conn.execute(
            text("CREATE INDEX IF NOT EXISTS idx_notification_task_id ON notification (task_id)")
        )

        print("Database indexes created successfully")


if __name__ == "__main__":
    asyncio.run(apply_indexes())
