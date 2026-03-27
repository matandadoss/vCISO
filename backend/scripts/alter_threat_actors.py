import asyncio
from sqlalchemy import text
from dotenv import load_dotenv
load_dotenv()
from app.db.session import engine as async_engine

async def alter_threat_actors():
    print("Connecting to DB to alter threat_actors table...")
    async with async_engine.begin() as conn:
        cols = {
            "aliases": "JSON",
            "motivation": "VARCHAR(100)",
            "target_industries": "JSON",
            "target_regions": "JSON",
            "source": "VARCHAR(100)",
            "external_references": "JSON"
        }
        for col, dtype in cols.items():
            try:
                await conn.execute(text(f"ALTER TABLE threat_actors ADD COLUMN {col} {dtype};"))
                print(f"Successfully added {col}.")
            except Exception as e:
                print(f"Skipping {col} (already exists?): {e}")
                
        # Force update the existing seeded actors to wipe out NULLs and allow the new upsert logic
        try:
            await conn.execute(text("UPDATE threat_actors SET aliases = '[]'::json WHERE aliases IS NULL AND name IN ('Scattered Spider', 'FIN7', 'Lazarus Group');"))
        except:
             pass

    print("Threat actor schema migration completed.")

if __name__ == "__main__":
    asyncio.run(alter_threat_actors())
