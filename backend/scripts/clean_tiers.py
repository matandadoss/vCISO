import asyncio
from sqlalchemy import select
from app.db.session import SessionLocal
from app.models.domain import ServiceTierConfig

async def clean_database():
    print("Scrubbing Tier Database...")
    async with SessionLocal() as session:
        result = await session.execute(select(ServiceTierConfig))
        configs = result.scalars().all()
        
        for config in configs:
            features = config.features
            new_features = [
                f for f in features 
                if f not in [
                    "Strict Middleware Isolation", 
                    "Least Privilege IAM Runtimes",
                    "PostgreSQL Row-Level Security", 
                    "Isolated CMEK Data Storage"
                ]
            ]
            config.features = new_features
            print(f"[{config.tier.name}] Cleaned down to {len(new_features)} features.")
            
        await session.commit()
    print("Scrub complete.")

if __name__ == "__main__":
    asyncio.run(clean_database())
