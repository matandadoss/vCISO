import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.ext.asyncio import create_async_engine
from app.db.session import SessionLocal
from sqlalchemy import text

async def run_migration():
    print("Starting database schema migration...")
    async with SessionLocal() as session:
        # Add new columns to organizations
        queries = [
            "ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address VARCHAR(512);",
            "ALTER TABLE organizations ADD COLUMN IF NOT EXISTS website_domain VARCHAR(255);",
            "ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);",
            "ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email_address VARCHAR(255);"
        ]
        
        for q in queries:
            try:
                await session.execute(text(q))
                print(f"Executed: {q}")
            except Exception as e:
                print(f"Error executing {q}: {e}")
                
        await session.commit()
        print("Schema migration completed successfully.")

if __name__ == "__main__":
    asyncio.run(run_migration())
