import asyncio
import os
import sys
import uuid
import datetime

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.future import select
from app.models.domain import Organization, ComplianceFramework, ThreatActor, ThreatSophistication
from app.db.session import SessionLocal

async def seed_defaults_for_all_orgs():
    print("Starting default seeding for all organizations...")
    async with SessionLocal() as session:
        # Get all orgs
        result = await session.execute(select(Organization))
        orgs = result.scalars().all()
        
        if not orgs:
            print("No organizations found in the database.")
            return

        print(f"Found {len(orgs)} organizations.")
        
        defaults_added = 0
        
        for org in orgs:
            print(f"Processing organization: {org.name} ({org.id})")
            
            # Check existing frameworks
            frameworks_result = await session.execute(
                select(ComplianceFramework).where(ComplianceFramework.org_id == org.id)
            )
            existing_framework_names = {f.framework_name for f in frameworks_result.scalars().all()}
            
            # Define default frameworks
            default_frameworks = [
                ("SOC 2 Type II", "2017"),
                ("OWASP Top 10", "2021"),
                ("CIS", "v8"),
                ("NIST CSF", "2.0")
            ]
            
            for fw_name, fw_version in default_frameworks:
                if fw_name not in existing_framework_names:
                    print(f"  Adding missing framework: {fw_name}")
                    new_fw = ComplianceFramework(
                        id=uuid.uuid4(),
                        org_id=org.id,
                        framework_name=fw_name,
                        version=fw_version,
                        applicable=True,
                        overall_compliance_pct=100.0,
                        last_assessed=datetime.datetime.utcnow(),
                        next_assessment_due=datetime.datetime.utcnow() + datetime.timedelta(days=365)
                    )
                    session.add(new_fw)
                    defaults_added += 1

            # Check existing threat actors
            threat_actors_result = await session.execute(
                select(ThreatActor).where(ThreatActor.org_id == org.id)
            )
            existing_ta_names = {ta.name for ta in threat_actors_result.scalars().all()}
            
            # Define default threat actors
            default_threat_actors = [
                (
                    "Scattered Spider",
                    "Financially motivated threat group known for social engineering attacks against IT helpdesks.",
                    ThreatSophistication.advanced
                ),
                (
                    "FIN7",
                    "Cybercriminal group primarily targeting the retail and hospitality sectors to steal financial data.",
                    ThreatSophistication.intermediate
                ),
                (
                    "Lazarus Group",
                    "State-sponsored actor associated with cyber espionage and financial theft.",
                    ThreatSophistication.advanced
                )
            ]
            
            for ta_name, ta_desc, ta_soph in default_threat_actors:
                if ta_name not in existing_ta_names:
                    print(f"  Adding missing threat actor: {ta_name}")
                    new_ta = ThreatActor(
                        id=uuid.uuid4(),
                        org_id=org.id,
                        name=ta_name,
                        description=ta_desc,
                        sophistication=ta_soph,
                        active=True,
                        first_seen=datetime.datetime.utcnow()
                    )
                    session.add(new_ta)
                    defaults_added += 1
        
        if defaults_added > 0:
            print(f"Committing {defaults_added} new records to the database...")
            await session.commit()
            print("Commit successful.")
        else:
            print("All organizations already have the default frameworks and threat actors. Nothing to commit.")

if __name__ == "__main__":
    asyncio.run(seed_defaults_for_all_orgs())
