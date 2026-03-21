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
        
        from app.db.seeds import seed_defaults_for_org
        await seed_defaults_for_org(session, test_org_id)

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
