import asyncio
import os
import sys


# Add backend directory to sys.path so app modules can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.ext.asyncio import create_async_engine
from app.models.base import BaseModel
from app.models.domain import * # Import all models to ensure metadata is populated
from app.db.session import SQLALCHEMY_DATABASE_URL, SessionLocal

async def init_db():
    print(f"Connecting to database: {SQLALCHEMY_DATABASE_URL}")
    engine = create_async_engine(SQLALCHEMY_DATABASE_URL, echo=True)
    
    # Create all tables
    print("Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(BaseModel.metadata.drop_all) # Optional: reset for clean slate MVP
        await conn.run_sync(BaseModel.metadata.create_all)
    
    print("Tables created successfully.")
    
    print("Seeding default data...")
    import datetime
    async with SessionLocal() as session:
        # Seed test organization
        test_org_id = uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6")
        org = Organization(
            id=test_org_id,
            name="Acme Corp",
            industry="Technology",
            size="Enterprise",
            gcp_project_id="acme-security-prod",
            subscription_tier="enterprise"
        )
        session.add(org)
        
        # Seed AI Budget
        budget = OrgAIBudget(
            org_id=test_org_id,
            daily_limit_usd=50.0,
            monthly_limit_usd=1000.0,
            active_provider="anthropic_direct"
        )
        session.add(budget)
        
        # Seed Compliance Framework
        soc_id = uuid.uuid4()
        cf1 = ComplianceFramework(
            id=soc_id,
            org_id=test_org_id,
            framework_name="SOC 2 Type II",
            version="2017",
            applicable=True,
            overall_compliance_pct=85.5,
            last_assessed=datetime.datetime.utcnow(),
            next_assessment_due=datetime.datetime.utcnow() + datetime.timedelta(days=365)
        )
        session.add(cf1)
        
        cr1 = ComplianceRequirement(
            framework_id=soc_id,
            requirement_id_code="CC1.1",
            title="COSO Principle 1: Demonstrates commitment to integrity and ethical values",
            status="compliant",
            evidence_status="collected",
            last_reviewed=datetime.datetime.utcnow()
        )
        session.add(cr1)
        
        cr2 = ComplianceRequirement(
            framework_id=soc_id,
            requirement_id_code="CC1.2",
            title="COSO Principle 2: Exercises oversight responsibility",
            status="non_compliant",
            evidence_status="missing",
            last_reviewed=datetime.datetime.utcnow()
        )
        session.add(cr2)
        
        # Seed OWASP Top 10
        owasp_id = uuid.uuid4()
        cf_owasp = ComplianceFramework(
            id=owasp_id,
            org_id=test_org_id,
            framework_name="OWASP Top 10",
            version="2021",
            applicable=True,
            overall_compliance_pct=100.0,
            last_assessed=datetime.datetime.utcnow(),
            next_assessment_due=datetime.datetime.utcnow() + datetime.timedelta(days=365)
        )
        session.add(cf_owasp)

        # Seed CIS Controls
        cis_id = uuid.uuid4()
        cf_cis = ComplianceFramework(
            id=cis_id,
            org_id=test_org_id,
            framework_name="CIS",
            version="v8",
            applicable=True,
            overall_compliance_pct=100.0,
            last_assessed=datetime.datetime.utcnow(),
            next_assessment_due=datetime.datetime.utcnow() + datetime.timedelta(days=365)
        )
        session.add(cf_cis)

        # Seed NIST CSF
        nist_id = uuid.uuid4()
        cf_nist = ComplianceFramework(
            id=nist_id,
            org_id=test_org_id,
            framework_name="NIST CSF",
            version="2.0",
            applicable=True,
            overall_compliance_pct=100.0,
            last_assessed=datetime.datetime.utcnow(),
            next_assessment_due=datetime.datetime.utcnow() + datetime.timedelta(days=365)
        )
        session.add(cf_nist)

        # Seed Threat Actors
        ta1_id = uuid.uuid4()
        ta1 = ThreatActor(
            id=ta1_id,
            org_id=test_org_id,
            name="Scattered Spider",
            description="Financially motivated threat group known for social engineering attacks against IT helpdesks.",
            sophistication=ThreatSophistication.advanced,
            active=True,
            first_seen=datetime.datetime.utcnow()
        )
        session.add(ta1)

        ta2_id = uuid.uuid4()
        ta2 = ThreatActor(
            id=ta2_id,
            org_id=test_org_id,
            name="FIN7",
            description="Cybercriminal group primarily targeting the retail and hospitality sectors to steal financial data.",
            sophistication=ThreatSophistication.intermediate,
            active=True,
            first_seen=datetime.datetime.utcnow()
        )
        session.add(ta2)

        ta3_id = uuid.uuid4()
        ta3 = ThreatActor(
            id=ta3_id,
            org_id=test_org_id,
            name="Lazarus Group",
            description="State-sponsored actor associated with cyber espionage and financial theft.",
            sophistication=ThreatSophistication.advanced,
            active=True,
            first_seen=datetime.datetime.utcnow()
        )
        session.add(ta3)

        # Seed Findings
        f1 = Finding(
            id=uuid.uuid4(),
            org_id=test_org_id,
            finding_type=FindingType.vulnerability,
            title="S3 Bucket Publicly Accessible",
            description="A critical storage bucket containing PII has public read access enabled via its bucket policy.",
            severity=Severity.critical,
            risk_score=9.5,
            source_workflow=WorkflowName.infrastructure,
            status=FindingStatus.new,
            detected_at=datetime.datetime.utcnow()
        )
        session.add(f1)
        
        f2 = Finding(
            id=uuid.uuid4(),
            org_id=test_org_id,
            finding_type=FindingType.misconfiguration,
            title="IAM User without MFA",
            description="The administrative user 'root.admin' does not have multi-factor authentication enabled.",
            severity=Severity.high,
            risk_score=7.8,
            source_workflow=WorkflowName.infrastructure,
            status=FindingStatus.new,
            detected_at=datetime.datetime.utcnow() - datetime.timedelta(days=2)
        )
        session.add(f2)
        
        await session.commit()
    print("Database initialization complete.")

if __name__ == "__main__":
    asyncio.run(init_db())
