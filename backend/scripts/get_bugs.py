import asyncio
from sqlalchemy import select
from app.db.session import SessionLocal
from app.models.domain import InternalBugLog

async def main():
    async with SessionLocal() as db:
        stmt = select(InternalBugLog).order_by(InternalBugLog.created_at.desc()).limit(5)
        res = await db.execute(stmt)
        bugs = res.scalars().all()
        for b in bugs:
            print(f"[{b.created_at}] {b.error_code} - {b.error_message} for {b.user_id}")
            print(f"URL: {b.url}")
            print(f"Context: {b.additional_context}")
            print("---")

if __name__ == "__main__":
    asyncio.run(main())
