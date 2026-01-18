#!/usr/bin/env python3
"""
Quick migration script to make password_hash nullable in the user table.
Run this directly with: python3 migrate_fix_password_hash.py
"""

import asyncio
import sys
from urllib.parse import urlparse, urlunparse

try:
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy import text
except ImportError:
    print("Installing required dependencies...")
    import subprocess
    subprocess.run([sys.executable, "-m", "pip", "install", "asyncpg", "sqlalchemy"], check=True)
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy import text

DATABASE_URL = "postgresql://neondb_owner:npg_GfLDUkI0HjZ4@ep-tiny-cloud-a4ur5b15-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Convert to async URL and remove sslmode
ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
parsed = urlparse(ASYNC_DATABASE_URL)
query_params = [p for p in parsed.query.split("&") if not p.startswith("sslmode=")]
ASYNC_DATABASE_URL = urlunparse((
    parsed.scheme, parsed.netloc, parsed.path,
    parsed.params, "&".join(query_params), parsed.fragment
))

async def migrate():
    print("Connecting to Neon database...")
    engine = create_async_engine(ASYNC_DATABASE_URL)
    async with engine.begin() as conn:
        print("Applying migration: making password_hash nullable...")
        await conn.execute(text('ALTER TABLE "user" ALTER COLUMN password_hash DROP NOT NULL'))
        print("✓ Migration applied: password_hash is now nullable")
    await engine.dispose()
    print("Done!")

if __name__ == "__main__":
    asyncio.run(migrate())
