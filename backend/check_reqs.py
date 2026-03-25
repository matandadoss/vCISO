import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from app.db.session import SessionLocal
from app.models.domain import ComplianceRequirement, ComplianceFramework
from sqlalchemy import select
from app.api.v1.compliance import list_requirements

async def main():
    async with SessionLocal() as db:
        res = await db.execute(select(ComplianceFramework))
        fws = res.scalars().all()
        for fw in fws:
            print(f"Testing list_requirements for Framework: {fw.framework_name} (ID: {fw.id})")
            try:
                # We need to test the router function locally
                res = await list_requirements(
                    framework_id=str(fw.id),
                    org_id="default",
                    status=None,
                    limit=50,
                    offset=0,
                    db=db,
                    current_user={"org_id": "default"}
                )
                print(f"  Got {res['total']} requirements")
            except Exception as e:
                import traceback
                traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
