import asyncio
import os
import uuid
import random
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.models.domain import (
    Organization, Asset, AssetType, Environment,
    Vulnerability, FindingStatus, Severity,
    Finding, FindingType, WorkflowName, ThreatActor, ThreatSophistication
)
from app.services.graph_service import GraphService

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/vciso")
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def generate_demo_data():
    print("Connecting to DB and Neo4j...")
    graph_service = GraphService(uri=NEO4J_URI, user=NEO4J_USERNAME, password=NEO4J_PASSWORD)
    
    async with AsyncSessionLocal() as session:
        # 1. Create Org
        org_id = uuid.uuid4()
        org = Organization(id=org_id, name="Acme Corp (Demo)", industry="Finance", size="Enterprise")
        session.add(org)
        await session.commit()
        print(f"Created Org: {org.name} [{org.id}]")

        # 2. Create Assets
        assets = []
        for i in range(50):
            asset = Asset(
                id=uuid.uuid4(),
                org_id=org_id,
                asset_type=random.choice(list(AssetType)),
                name=f"asset-{i}",
                identifier=f"eip-{random.randint(100, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}",
                environment=random.choice(list(Environment)),
                business_criticality=random.choice(["critical", "high", "medium", "low"]),
                data_classification=random.choice(["restricted", "confidential", "internal", "public"]),
            )
            session.add(asset)
            assets.append(asset)
            # Sync to Graph
            await graph_service.sync_entity("Asset", {"id": str(asset.id), "name": asset.name, "environment": asset.environment.value, "criticality": asset.business_criticality})
            
        await session.commit()
        print(f"Created {len(assets)} Assets")

        # 3. Create Threat Actor
        ta = ThreatActor(
            id=uuid.uuid4(),
            org_id=org_id,
            name="FIN7",
            sophistication=ThreatSophistication.advanced,
            active=True
        )
        session.add(ta)
        await graph_service.sync_entity("ThreatActor", {"id": str(ta.id), "name": ta.name})
        await session.commit()
        
        # 4. Create Vulnerabilities & Findings
        findings = []
        for i in range(100):
            target_asset = random.choice(assets)
            sev = random.choices(list(Severity), weights=[5, 15, 50, 20, 10])[0]
            finding = Finding(
                id=uuid.uuid4(),
                org_id=org_id,
                finding_type=FindingType.vulnerability,
                title=f"Sample Finding {i}",
                description="Auto-generated demo finding.",
                severity=sev,
                risk_score=random.uniform(10.0, 99.0),
                source_workflow=WorkflowName.vulnerability,
                affected_asset_ids=[str(target_asset.id)],
                status=random.choices(list(FindingStatus), weights=[30, 20, 10, 30, 5, 5])[0],
                detected_at=datetime.utcnow() - timedelta(days=random.randint(0, 30))
            )
            session.add(finding)
            findings.append(finding)
            
            # Graph Sync
            await graph_service.sync_entity("Finding", {"id": str(finding.id), "type": "vulnerability", "severity": finding.severity.value})
            await graph_service.add_relationship("Asset", str(target_asset.id), "HAS_FINDING", "Finding", str(finding.id))
            
            # Create some attack paths
            if sev == Severity.critical and target_asset.environment == Environment.production:
                 await graph_service.add_relationship("Finding", str(finding.id), "EXPLOITED_BY", "ThreatActor", str(ta.id))

        await session.commit()
        print(f"Created {len(findings)} Findings")
        
    await graph_service.close()
    print("Demo data generation complete!")

if __name__ == "__main__":
    # Ensure tables exist first ideally, but assuming DB is migrated
    asyncio.run(generate_demo_data())
