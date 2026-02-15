"""add reminder_at column

Revision ID: 001
Revises:
Create Date: 2025-02-09

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add reminder_at column to task table with index."""
    # Add the reminder_at column (nullable for existing rows)
    op.add_column(
        'task',
        sa.Column('reminder_at', sa.DateTime(), nullable=True)
    )

    # Create index on reminder_at for efficient querying of upcoming reminders
    op.create_index(
        op.f('ix_task_reminder_at'),
        'task',
        ['reminder_at']
    )


def downgrade() -> None:
    """Remove reminder_at column from task table."""
    op.drop_index(op.f('ix_task_reminder_at'), table_name='task')
    op.drop_column('task', 'reminder_at')
