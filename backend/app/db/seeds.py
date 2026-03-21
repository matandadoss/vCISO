import uuid
import datetime
from sqlalchemy.future import select
from app.models.domain import ComplianceFramework, ThreatActor, ThreatSophistication

async def seed_defaults_for_org(session, org_id: uuid.UUID):
    """
    Seeds the default frameworks and threat actors for a specific organization if they do not exist.
    """
    # 1. Seed Compliance Frameworks
    # Check existing frameworks
    frameworks_result = await session.execute(
        select(ComplianceFramework).where(ComplianceFramework.org_id == org_id)
    )
    existing_framework_names = {f.framework_name for f in frameworks_result.scalars().all()}
    
    default_frameworks = [
        ("SOC 2 Type II", "2017"),
        ("OWASP Top 10", "2021"),
        ("CIS", "v8"),
        ("NIST CSF", "2.0")
    ]
    
    for fw_name, fw_version in default_frameworks:
        if fw_name not in existing_framework_names:
            new_fw = ComplianceFramework(
                id=uuid.uuid4(),
                org_id=org_id,
                framework_name=fw_name,
                version=fw_version,
                applicable=True,
                overall_compliance_pct=100.0,
                last_assessed=datetime.datetime.utcnow(),
                next_assessment_due=datetime.datetime.utcnow() + datetime.timedelta(days=365)
            )
            session.add(new_fw)

    # 2. Seed Threat Actors
    # Check existing threat actors
    threat_actors_result = await session.execute(
        select(ThreatActor).where(ThreatActor.org_id == org_id)
    )
    existing_ta_names = {ta.name for ta in threat_actors_result.scalars().all()}
    
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
            new_ta = ThreatActor(
                id=uuid.uuid4(),
                org_id=org_id,
                name=ta_name,
                description=ta_desc,
                sophistication=ta_soph,
                active=True,
                first_seen=datetime.datetime.utcnow()
            )
            session.add(new_ta)
