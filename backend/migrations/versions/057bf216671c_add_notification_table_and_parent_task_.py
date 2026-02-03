"""Add notification table and parent_task_id for recurrence

Revision ID: 057bf216671c
Revises: c4df718d14ac
Create Date: 2026-01-31 15:12:48.801563

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '057bf216671c'
down_revision: Union[str, Sequence[str], None] = 'c4df718d14ac'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - add notification table and parent_task_id column."""

    # Create notification table
    op.create_table(
        'notification',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=True),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('message', sa.String(length=500), nullable=True),
        sa.Column('read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['task_id'], ['task.id'], name=op.f('fk_notification_task_id_task')),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], name=op.f('fk_notification_user_id_user')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_notification'))
    )

    # Create indexes for notification table
    op.create_index('ix_notification_user_read', 'notification', ['user_id', 'read'], unique=False)
    op.create_index('ix_notification_created_at', 'notification', ['created_at'], unique=False)
    op.create_index('ix_notification_task_id', 'notification', ['task_id'], unique=False)

    # Add parent_task_id column to task table
    op.add_column('task', sa.Column('parent_task_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_task_parent_task_id_task', 'task', 'task',
        ['parent_task_id'], ['id']
    )
    op.create_index('ix_task_parent_id', 'task', ['parent_task_id'], unique=False)

    # Create cleanup function for old notifications
    op.execute("""
        CREATE OR REPLACE FUNCTION cleanup_old_notifications()
        RETURNS void AS $$
        BEGIN
            DELETE FROM notification
            WHERE created_at < NOW() - INTERVAL '90 days';
        END;
        $$ LANGUAGE plpgsql;
    """)


def downgrade() -> None:
    """Downgrade schema - remove notification table and parent_task_id column."""

    # Drop cleanup function
    op.execute("DROP FUNCTION IF EXISTS cleanup_old_notifications()")

    # Drop parent_task_id column and its index/constraint
    op.drop_index('ix_task_parent_id', table_name='task')
    op.drop_constraint('fk_task_parent_task_id_task', 'task', type_='foreignkey')
    op.drop_column('task', 'parent_task_id')

    # Drop notification table and its indexes
    op.drop_index('ix_notification_task_id', table_name='notification')
    op.drop_index('ix_notification_created_at', table_name='notification')
    op.drop_index('ix_notification_user_read', table_name='notification')
    op.drop_table('notification')
