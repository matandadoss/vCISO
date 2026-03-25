import asyncio
from sqlalchemy import select
from app.db.session import SessionLocal
from app.models.domain import InternalBugLog

async def main():
    async with SessionLocal() as session:
        result = await session.execute(
            select(InternalBugLog).order_by(InternalBugLog.timestamp.desc()).limit(10)
        )
        for log in result.scalars().all():
            print(f"[{log.timestamp}] Error {log.error_code}: {log.error_message} | URL: {log.url}")
            print(f"Context: {log.additional_context}\n")

if __name__ == "__main__":
    asyncio.run(main())
