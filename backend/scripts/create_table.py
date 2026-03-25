import asyncio
from app.db.session import engine
from app.models.base import BaseModel
from app.models.domain import OrganizationIntegration

async def async_main():
    async with engine.begin() as conn:
        await conn.run_sync(BaseModel.metadata.create_all)

if __name__ == "__main__":
    asyncio.run(async_main())
