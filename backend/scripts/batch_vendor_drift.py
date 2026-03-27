import asyncio
import datetime
import secrets
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.db.session import SessionLocal
from app.models.domain import Vendor as VendorModel
from sqlalchemy import select

async def run_global_vendor_drift():
    print(f"[{datetime.datetime.utcnow().isoformat()}] Starting Global Vendor Risk Drift Batch Processing...")
    
    async with SessionLocal() as db:
        result = await db.execute(select(VendorModel))
        all_vendors = result.scalars().all()
        
        updated_count = 0
        now = datetime.datetime.utcnow()
        for v in all_vendors:
            if v.last_assessment_date is None or (now - v.last_assessment_date).days >= 1:
                # Apply +/- 5 daily drift
                shift = secrets.SystemRandom().randint(-5, 5)
                new_score = (v.risk_score or 50) + shift
                
                # Ceiling 95 logic: no vendor is perfectly safe
                v.risk_score = min(95, max(0, new_score))
                
                # Inverted Health Rating Bands
                if v.risk_score >= 80:
                    v.status = "Safe"
                elif v.risk_score >= 50:
                    v.status = "Warning"
                else:
                    v.status = "Critical"
                    
                v.last_assessment_date = now
                updated_count += 1
                
        if updated_count > 0:
            await db.commit()
            print(f"[{datetime.datetime.utcnow().isoformat()}] Successfully drifted {updated_count} vendors across all tenants.")
        else:
            print(f"[{datetime.datetime.utcnow().isoformat()}] Nightly pass complete. No vendors required drift updates.")

if __name__ == "__main__":
    asyncio.run(run_global_vendor_drift())
