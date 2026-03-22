import asyncio
from sqlalchemy import text
from dotenv import load_dotenv
load_dotenv()
from app.db.session import engine as async_engine

async def alter_vendors():
    print("Connecting to DB to alter vendors table...")
    async with async_engine.begin() as conn:
        print("Executing ALTER TABLE vendors ADD COLUMN tech_stack JSON;")
        try:
            await conn.execute(text("ALTER TABLE vendors ADD COLUMN tech_stack JSON;"))
            print("Successfully added tech_stack.")
        except Exception as e:
            print(f"Skipping tech_stack (already exists?): {e}")

        print("Executing ALTER TABLE vendors ADD COLUMN status VARCHAR(50);")
        try:
            await conn.execute(text("ALTER TABLE vendors ADD COLUMN status VARCHAR(50);"))
            print("Successfully added status.")
        except Exception as e:
            print(f"Skipping status (already exists?): {e}")

        # Seed tech_stack backfilling if old data exists
        try:
            await conn.execute(text("UPDATE vendors SET tech_stack = '[]'::json WHERE tech_stack IS NULL;"))
            await conn.execute(text("UPDATE vendors SET status = assessment_status WHERE status IS NULL;"))
            print("Backfilled existing vendor tables.")
        except Exception as e:
            print(f"Skipping data backfill: {e}")

    print("Vendor schema migration completed.")

if __name__ == "__main__":
    asyncio.run(alter_vendors())
