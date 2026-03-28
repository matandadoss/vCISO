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

async def seed_better_minds():
    print("Starting Better Minds Psychology data seed...")
    
    # Generate a unique org_id for Better Minds Psychology
    org_id = uuid.uuid4()
    org_id_str = str(org_id)
    token = org_id_ctx.set(org_id_str)
    
    try:
        async with SessionLocal() as session:
            # 1. Create Organization
            print("1. Creating Organization: Better Minds Psychology...")
            org = Organization(
                id=org_id,
                name="Better Minds Psychology",
                industry="Healthcare/Psychology",
                subscription_tier="enterprise"
            )
            session.add(org)

            # 2. Add Users
            print("2. Mapping Users...")
            email = "matanda.doss@gmail.com"
            result = await session.execute(select(User).where(User.email == email))
            existing_user = result.scalar_one_or_none()
            if existing_user:
                print(f"User {email} already exists, updating org_id to Better Minds...")
                existing_user.org_id = org_id
            else:
                print(f"Creating User {email}...")
                u = User(
                    org_id=org_id,
                    firebase_uid=f"seed_bmp_{uuid.uuid4().hex[:8]}",
                    email=email,
                    full_name="Matanda Doss",
                    role="admin"
                )
                session.add(u)
                
            admin_email = "admin@betterminds.com"
            u2 = User(
                org_id=org_id,
                firebase_uid=f"seed_admin_{uuid.uuid4().hex[:8]}",
                email=admin_email,
                full_name="Systems Administrator",
                role="admin"
            )
            session.add(u2)

            # 3. Add Assets (AWS, EDR, WAF, VDI, Clinics)
            print("3. Adding Assets for 25+ offices and AWS infrastructure...")
            assets_data = [
                ("AWS Primary VPC", AssetType.network_segment, Environment.production, "critical", "AWS Core Networking"),
                ("AWS WAF (Web Application Firewall)", AssetType.security_appliance, Environment.production, "critical", "External perimeter defense"),
                ("AWS EC2 Application Cluster (EMR)", AssetType.server, Environment.production, "high", "Electronic Medical Records Hosting"),
                ("AWS RDS PostgreSQL (Patient Data)", AssetType.database, Environment.production, "critical", "HIPAA Regulated Data"),
                ("AWS WorkSpaces (VDI Fleet)", AssetType.endpoint, Environment.production, "high", "Virtual Desktops for Remote Clinicians"),
                ("CrowdStrike Falcon (EDR)", AssetType.security_appliance, Environment.production, "critical", "Endpoint Protection & Response"),
                ("Okta Single Sign-On", AssetType.identity, Environment.production, "critical", "Identity & Access Management"),
                ("Office 365 Tenant", AssetType.saas_app, Environment.production, "high", "Corporate Mail & Communication"),
                ("Meraki SD-WAN (Headquarters)", AssetType.network_segment, Environment.production, "high", "Primary routing"),
                ("Meraki SD-WAN (Clinic Branches 1-25)", AssetType.network_segment, Environment.production, "medium", "Remote office connectivity")
            ]
            asset_objs = []
            for name, a_type, env, crit, desc in assets_data:
                a = Asset(
                    org_id=org_id,
                    name=name,
                    identifier=f"asset-{uuid.uuid4().hex[:8]}",
                    asset_type=a_type,
                    environment=env,
                    business_criticality=crit,
                    data_classification="confidential" if crit == "critical" else "internal",
                    status="active"
                )
                session.add(a)
                asset_objs.append(a)

            # Flush to get asset IDs
            await session.flush()

            # 4. Add Vendors & Tech Stack (Ecosystem Risk)
            print("4. Adding Ecosystem Vendors...")
            vendors_data = [
                ("Amazon Web Services", "IaaS", "Tier 1", "Root", 15, "Cloud infrastructure provider for all core logic."),
                ("CrowdStrike", "Security", "Tier 1", "Admin", 8, "Primary EDR and NG-AV across all VDI instances."),
                ("Epic Systems", "SaaS", "Tier 1", "Root", 22, "Electronic Medical Records (EMR) software provider."),
                ("Cisco Meraki", "Hardware", "Tier 2", "Admin", 30, "Networking and SD-WAN routing for 25 remote offices."),
                ("Okta", "Identity", "Tier 1", "Admin", 12, "Enterprise authentication and SSO."),
                ("Microsoft", "SaaS", "Tier 2", "Internal", 25, "O365 and corporate productivity."),
                ("Zoom", "SaaS", "Tier 2", "Internal", 45, "Telehealth platform for remote counseling sessions.")
            ]
            vendor_objs = []
            for v_name, v_type, v_tier, acc_lvl, risk, desc in vendors_data:
                v = Vendor(
                    org_id=org_id,
                    name=v_name,
                    vendor_type=v_type,
                    tier=v_tier,
                    data_access_level=acc_lvl,
                    risk_score=risk,
                    assessment_status="completed",
                    status="Warning" if risk > 40 else "Active"
                )
                session.add(v)
                vendor_objs.append(v)
            
            await session.flush()

            # 5. Add Findings / Vulnerabilities
            print("5. Generating Findings...")
            findings_details = [
                (FindingType.vulnerability, Severity.critical, 9.8, WorkflowName.infrastructure, "Unauthenticated RCE in Meraki SD-WAN VPN concentrator (CVE-2026-XXXX).", admin_email),
                (FindingType.misconfiguration, Severity.high, 8.5, WorkflowName.cloud, "AWS RDS PostgreSQL instance accessible via public internet from branch office static IPs.", email),
                (FindingType.credential_exposure, Severity.high, 7.5, WorkflowName.dark_web, "Telehealth practitioner credentials found in dark web infostealer logs.", admin_email),
                (FindingType.control_gap, Severity.high, 8.0, WorkflowName.controls, "AWS WorkSpaces (VDI) instances missing CrowdStrike Falcon sensor.", email),
                (FindingType.misconfiguration, Severity.medium, 5.5, WorkflowName.compliance, "S3 bucket containing anonymized therapy transcripts missing KMS encryption.", admin_email),
                (FindingType.supply_chain_risk, Severity.medium, 6.0, WorkflowName.supply_chain, "Zoom Desktop Client running vulnerable outdated version on 40+ endpoints.", email),
                (FindingType.vulnerability, Severity.medium, 5.0, WorkflowName.vulnerability, "Epic Systems EMR portal TLS certificate expiring in 7 days.", admin_email)
            ]
            
            for f_type, sev, r_score, source_wf, desc, assignee in findings_details:
                 # Map to a random asset and vendor if applicable
                 asset = random.choice(asset_objs)
                 vendor = random.choice(vendor_objs)
                 
                 f = Finding(
                     org_id=org_id,
                     finding_type=f_type,
                     title=desc.split(".")[0],
                     description=desc + " Immediate remediation required to comply with HIPAA mandates.",
                     severity=sev,
                     risk_score=r_score,
                     source_workflow=source_wf,
                     status=FindingStatus.new,
                     assigned_to=assignee,
                     detected_at=datetime.utcnow() - timedelta(hours=random.randint(1, 72)),
                     affected_asset_ids={"ids": [str(asset.id)]},
                     affected_vendor_ids={"ids": [str(vendor.id)]}
                 )
                 session.add(f)

            # 6. Add Risk Register
            print("6. Populating Risk Register...")
            risk_entries = [
                ("Legacy Clinic Workstations", "5 branch clinics still utilize Windows 10 endpoints out of support due to specialized biometric hardware constraints.", Severity.high, ["Security", "Compliance"], email, "Segment clinics onto isolated Meraki VLAN with rigorous CrowdStrike ruleset until hardware refresh in Q4.", "Annual Pen Test"),
                ("Patient Portal MFA Exception", "Elderly patient cognitive constraints resulted in executive approval to bypass SMS MFA on the external appointment portal.", Severity.medium, ["Operational", "Security"], admin_email, "Monitor for brute-force attacks via AWS WAF and restrict logins to US regional IPs only.", "Compliance Audit")
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
                    date_entered=datetime.utcnow() - timedelta(days=random.randint(10, 60)),
                    expiration_date=datetime.utcnow() + timedelta(days=random.randint(45, 120))
                )
                session.add(rr)

            # 7. Add Threat Actors
            print("7. Mapping Threat Actors...")
            threats_data = [
                ("FIN7", ThreatSophistication.advanced, "Financial Extortion via Telehealth"),
                ("Scattered Spider", ThreatSophistication.advanced, "Social Engineering Helpdesks"),
                ("Lazarus Group", ThreatSophistication.nation_state, "Corporate Espionage")
            ]
            # Since threat actors are global but scoped per db currently in seed:
            for name, soph, mot in threats_data:
                # Check if exists in this org
                result = await session.execute(select(ThreatActor).where(ThreatActor.name == name).where(ThreatActor.org_id == org_id))
                if not result.scalar_one_or_none():
                    t = ThreatActor(
                        org_id=org_id,
                        name=name,
                        sophistication=soph,
                        motivation=mot
                    )
                    session.add(t)

            await session.commit()
            print(f"Demo data for Better Minds Psychology successfully committed!")
            print(f"Org ID generated: {org_id_str}")
            print(f"User mapped: {email}")

    finally:
        org_id_ctx.reset(token)

if __name__ == "__main__":
    asyncio.run(seed_better_minds())
