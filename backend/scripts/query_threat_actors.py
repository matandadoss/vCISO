import asyncio
from sqlalchemy import text
from dotenv import load_dotenv
load_dotenv()
from app.db.session import engine as async_engine

async def query_db():
    print("Connecting to DB to query threat_actors table...")
    async with async_engine.connect() as conn:
        res = await conn.execute(text("SELECT name, aliases, motivation FROM threat_actors;"))
        for row in res.fetchall():
            print(dict(row._mapping))

if __name__ == "__main__":
    asyncio.run(query_db())
