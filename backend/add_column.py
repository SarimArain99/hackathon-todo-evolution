"""Add parent_task_id column to task table in production database."""
import asyncio
from app.database import async_engine
from sqlalchemy import text

async def add_column():
    # async_engine is already an instance
    async with async_engine.begin() as conn:
        # Add parent_task_id column if it doesn't exist
        sql = text('ALTER TABLE task ADD COLUMN IF NOT EXISTS parent_task_id INTEGER REFERENCES task(id)')
        await conn.execute(sql)
        await conn.commit()
        print('Added parent_task_id column successfully')

asyncio.run(add_column())
