import asyncio
import sys
import os
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

from app.db.session import engine
from sqlalchemy import text

async def main():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE risk_register ADD COLUMN expiration_date TIMESTAMP NULL"))
            print("Added expiration_date column successfully.")
        except Exception as e:
            print(f"Error adding expiration_date (might already exist): {e}")
            
        try:
            await conn.execute(text("ALTER TABLE risk_register ADD COLUMN source VARCHAR(255) NULL"))
            print("Added source column successfully.")
        except Exception as e:
            print(f"Error adding source (might already exist): {e}")

if __name__ == "__main__":
    asyncio.run(main())
