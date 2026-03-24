import asyncio
import os
import sys
import uuid
import random
from datetime import datetime, timedelta

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.ext.asyncio import create_async_engine
from app.models.domain import *
from app.db.session import SessionLocal
from app.main import org_id_ctx
from sqlalchemy import select

async def seed_robust_demo():
    print("Starting robust demo data seed...")
    
    org_id = uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6")
    token = org_id_ctx.set(str(org_id))
    
    try:
        async with SessionLocal() as session:

            print("1. Adding specific users...")
            emails = ["matanda@outlook.com", "matanda.doss@gmail.com"]
            for idx, email in enumerate(emails):
                # check if exists
                result = await session.execute(select(User).where(User.email == email))
                existing = result.scalar_one_or_none()
                if not existing:
                    u = User(
                        org_id=org_id,
                        firebase_uid=f"seed_firebase_{idx}",
                        email=email,
                        full_name=email.split("@")[0].capitalize(),
                        role="admin"
                    )
                    session.add(u)
    
            print("2. Adding Robust Assets...")
            assets_data = [
                ("AWS EC2 Production Fleet", AssetType.server, Environment.production, "high"),
                ("GCP Kubernetes Cluster", AssetType.container, Environment.production, "critical"),
                ("Snowflake Data Warehouse", AssetType.database, Environment.production, "critical"),
                ("Okta IAM Tenants", AssetType.identity, Environment.shared_services, "critical"),
                ("Salesforce CRM", AssetType.saas_app, Environment.production, "medium"),
                ("Development Subnets", AssetType.network_segment, Environment.development, "low")
            ]
            asset_objs = []
            for name, a_type, env, crit in assets_data:
                a = Asset(
                    org_id=org_id,
                    name=name,
                    identifier=f"asset-{uuid.uuid4().hex[:8]}",
                    asset_type=a_type,
                    environment=env,
                    business_criticality=crit,
                    data_classification="confidential",
                    status="active"
                )
                session.add(a)
                asset_objs.append(a)
    
            print("3. Adding Robust Vendors...")
            vendors_data = [
                ("CrowdStrike", "Security", "Tier 1", "Admin", 15),
                ("Slack", "SaaS", "Tier 2", "Internal", 35),
                ("AWS", "IaaS", "Tier 1", "Root", 10),
                ("Datadog", "Monitoring", "Tier 2", "Read-Only", 25),
                ("SolarWinds", "IT Management", "Tier 2", "Admin", 95)
            ]
            vendor_objs = []
            for v_name, v_type, v_tier, acc_lvl, risk in vendors_data:
                v = Vendor(
                    org_id=org_id,
                    name=v_name,
                    vendor_type=v_type,
                    tier=v_tier,
                    data_access_level=acc_lvl,
                    risk_score=risk,
                    assessment_status="completed",
                    status="Warning" if risk > 50 else "Active"
                )
                session.add(v)
                vendor_objs.append(v)
    
            print("4. Adding Robust Threat Actors...")
            threats_data = [
                ("APT29 (Cozy Bear)", ThreatSophistication.nation_state, "Espionage"),
                ("LockBit 3.0", ThreatSophistication.organized_crime, "Financial"),
                ("Lapsus$", ThreatSophistication.advanced, "Chaos & Extortion")
            ]
            threat_objs = []
            for name, soph, mot in threats_data:
                t = ThreatActor(
                    org_id=org_id,
                    name=name,
                    sophistication=soph,
                    motivation=mot
                )
                session.add(t)
                threat_objs.append(t)
    
            print("5. Adding Findings assigned to specific users...")
            await session.flush() # get IDs
            
            findings_details = [
                (FindingType.vulnerability, Severity.critical, 9.8, WorkflowName.infrastructure, "Unauthenticated RCE in public facing load balancer.", "matanda@outlook.com"),
                (FindingType.credential_exposure, Severity.high, 8.5, WorkflowName.dark_web, "Cleartext database credentials leaked on dark web forum.", "matanda.doss@gmail.com"),
                (FindingType.misconfiguration, Severity.medium, 5.5, WorkflowName.compliance, "AWS S3 bucket missing server-side encryption.", "matanda@outlook.com"),
                (FindingType.supply_chain_risk, Severity.high, 7.2, WorkflowName.supply_chain, "Vendor 'SolarWinds' reported critical supply chain compromise.", "matanda.doss@gmail.com"),
                (FindingType.control_gap, Severity.critical, 9.0, WorkflowName.controls, "EDR agent (CrowdStrike) disabled across 15 production Linux servers.", "matanda@outlook.com"),
                (FindingType.vulnerability, Severity.high, 7.8, WorkflowName.vulnerability, "Zero-day exploitation detected in VPN appliances (CVE-2024-XXXX).", "matanda.doss@gmail.com")
            ]
    
            for f_type, sev, r_score, source_wf, desc, assignee in findings_details:
                 f = Finding(
                     org_id=org_id,
                     finding_type=f_type,
                     title=desc.split(".")[0],
                     description=desc,
                     severity=sev,
                     risk_score=r_score,
                     source_workflow=source_wf,
                     status=FindingStatus.new,
                     assigned_to=assignee,
                     detected_at=datetime.utcnow() - timedelta(hours=random.randint(1, 48)),
                     affected_asset_ids={"ids": [str(a.id) for a in random.sample(asset_objs, 2)]} if asset_objs else {},
                     affected_vendor_ids={"ids": [str(v.id) for v in random.sample(vendor_objs, 1)]} if vendor_objs else {}
                 )
                 session.add(f)
    
            print("6. Adding Risk Register Entries...")
            risk_entries = [
                ("Legacy Active Directory Decommission", "Delayed decommissioning of legacy on-prem Active Directory introduces lateral movement risks.", Severity.high, ["Security", "Operational"], "matanda@outlook.com", "Migrate remaining 15 apps to Okta and shutdown AD servers by Q3.", "Internal Audit"),
                ("Third-Party Vendor Access", "Overly permissive access granted to Tier 2 vendors without conditional MFA.", Severity.medium, ["Compliance", "Security"], "matanda.doss@gmail.com", "Implement Zero Trust Network Access (ZTNA) policies for all external contractors.", "Compliance Assessment"),
                ("AI Data Governance", "Lack of clear governance around proprietary source code being uploaded to public LLMs.", Severity.critical, ["Legal", "Reputational"], "matanda@outlook.com", "Deploy DSPM module and enforce enterprise AI usage policy.", "Vulnerability Assessment")
            ]
            
            for title, desc, r_level, r_cats, owner, plan, source in risk_entries:
                rr = RiskRegister(
                    org_id=org_id,
                    title=title,
                    description=desc,
                    risk_level=r_level,
                    risk_categories={"categories": r_cats},
                    owner=owner,
                    action_plan=plan,
                    source=source,
                    date_entered=datetime.utcnow() - timedelta(days=random.randint(5, 30)),
                    expiration_date=datetime.utcnow() + timedelta(days=random.randint(30, 180))
                )
                session.add(rr)

        await session.commit()
        print("Demo data successfully generated and committed for matanda@outlook.com & matanda.doss@gmail.com.")
    finally:
        org_id_ctx.reset(token)

if __name__ == "__main__":
    asyncio.run(seed_robust_demo())
