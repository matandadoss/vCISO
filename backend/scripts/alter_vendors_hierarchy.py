import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from dotenv import load_dotenv
load_dotenv()
from app.db.session import engine as async_engine

async def alter_vendors_hierarchy():
    print("Connecting to DB to alter vendors table for hierarchy...")
    async with async_engine.begin() as conn:
        print("Executing ALTER TABLE vendors ADD COLUMN parent_vendor_id UUID REFERENCES vendors(id);")
        try:
            await conn.execute(text("ALTER TABLE vendors ADD COLUMN parent_vendor_id UUID REFERENCES vendors(id);"))
            print("Successfully added parent_vendor_id.")
        except Exception as e:
            print(f"Skipping parent_vendor_id (already exists?): {e}")

        # Data cleanup: set existing "software" vendor_type to "Vendor"
        try:
            await conn.execute(text("UPDATE vendors SET vendor_type = 'Vendor' WHERE vendor_type = 'software';"))
            print("Successfully updated existing vendor_types to 'Vendor'.")
        except Exception as e:
            print(f"Skipping data backfill: {e}")

    print("Vendor hierarchy migration completed.")

if __name__ == "__main__":
    asyncio.run(alter_vendors_hierarchy())
