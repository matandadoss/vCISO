from fastapi import APIRouter, Query, HTTPException, Depends
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from pydantic import BaseModel
from app.core.auth import get_current_user
from app.models.domain import Severity, ThreatSophistication, IndicatorType, ThreatActor, ThreatIntelIndicator
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db

router = APIRouter(prefix="/threat-intel", tags=["threat-intel"])

class ThreatActorResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    sophistication: ThreatSophistication
    active: bool
    first_seen: datetime
    last_updated: datetime
    relevance_score: str = "Medium" # High, Medium, Low
    relevance_reasons: List[str] = []
    mitre_attack_techniques: List[dict] = []

class ThreatIndicatorResponse(BaseModel):
    id: str
    indicator_type: IndicatorType
    value: str
    confidence: int
    severity: Severity
    valid_from: Optional[datetime] = None
    relevance_score: str = "Medium"
    relevance_reasons: List[str] = []
    associated_actor_name: Optional[str] = None
    attack_stages: List[str] = []
    affected_assets: List[dict] = []
    recommended_actions: List[str] = []

class DarkWebAlertResponse(BaseModel):
    id: str
    alert_type: str # e.g. "Credential Exposure", "Data Leak", "Brand Mention"
    title: str
    description: str
    severity: Severity
    source: str # e.g. "Genesis Market", "Pastebin"
    detected_at: datetime
    is_resolved: bool

@router.get("/actors", response_model=dict)
async def list_threat_actors(
    org_id: str,
    active: Optional[bool] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    try:
        org_uuid = uuid.UUID(org_id)
    except ValueError:
        org_uuid = uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6")
        
    stmt = select(ThreatActor).where(ThreatActor.org_id == org_uuid)
    
    # Fetch all existing actor names for this org to dynamically upsert into existing accounts
    existing_names_res = await db.execute(select(ThreatActor.name).where(ThreatActor.org_id == org_uuid))
    existing_names = set(name for (name,) in existing_names_res.all())
    
    default_actors = [
        ("Scattered Spider", "Financially motivated threat group known for social engineering attacks against IT helpdesks.", ThreatSophistication.advanced),
        ("FIN7", "Cybercriminal group primarily targeting the retail and hospitality sectors to steal financial data.", ThreatSophistication.intermediate),
        ("Lazarus Group", "State-sponsored actor associated with cyber espionage and financial theft.", ThreatSophistication.advanced)
    ]
    
    added_any = False
    for name, desc, soph in default_actors:
        if name not in existing_names:
            new_actor = ThreatActor(
                id=uuid.uuid4(),
                org_id=org_uuid,
                name=name,
                description=desc,
                sophistication=soph,
                active=True,
                first_seen=datetime.utcnow()
            )
            db.add(new_actor)
            added_any = True
            
    if added_any:
        await db.commit()
    
    if active is not None:
        stmt = stmt.where(ThreatActor.active == active)
        
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0
    
    stmt = stmt.limit(limit).offset(offset)
    result = await db.execute(stmt)
    actors = result.scalars().all()
    items = []
    for a in actors:
        soph_val = a.sophistication.value if hasattr(a.sophistication, 'value') else a.sophistication
        items.append({
            "id": str(a.id),
            "name": a.name,
            "description": a.description,
            "sophistication": soph_val,
            "active": a.active,
            "relevance_score": "High" if soph_val in ("nation_state", "advanced") else "Medium",
            "first_seen": a.first_seen.isoformat() if a.first_seen else None,
            "last_updated": a.last_updated.isoformat() if a.last_updated else None
        })

    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset
    }

class ThreatActorCreate(BaseModel):
    org_id: str
    name: str
    description: Optional[str] = None
    sophistication: Optional[str] = None

@router.post("/actors", response_model=dict)
async def create_threat_actor(
    request: ThreatActorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if request.org_id != "default" and str(request.org_id) != str(current_user.get("org_id")):
        raise HTTPException(status_code=403, detail="Unauthorized to access this organization's data")
        
    try:
        org_uuid = uuid.UUID(request.org_id)
    except ValueError:
        org_uuid = uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6")
        
    soph_enum = ThreatSophistication.intermediate
    if request.sophistication:
        try:
            soph_enum = ThreatSophistication(request.sophistication.lower())
        except ValueError:
            pass
            
    actor = ThreatActor(
        org_id=org_uuid,
        name=request.name,
        description=request.description or "Dynamically tracked threat actor profile.",
        sophistication=soph_enum,
        active=True,
        first_seen=datetime.utcnow()
    )
    
    db.add(actor)
    await db.commit()
    await db.refresh(actor)
    
    soph_val = actor.sophistication.value if hasattr(actor.sophistication, 'value') else actor.sophistication
    return {
        "id": str(actor.id),
        "name": actor.name,
        "description": actor.description,
        "sophistication": soph_val,
        "active": actor.active,
        "relevance_score": "High" if soph_val in ("nation_state", "advanced") else "Medium",
        "first_seen": actor.first_seen.isoformat() if actor.first_seen else None,
        "last_updated": actor.last_updated.isoformat() if actor.last_updated else None
    }

class ThreatActorUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    version: Optional[str] = None

@router.put("/actors/{actor_id}", response_model=dict)
async def update_threat_actor(
    actor_id: str,
    request: ThreatActorUpdate,
    org_id: str,
    db: AsyncSession = Depends(get_db)
):
    try:
        actor_uuid = uuid.UUID(actor_id)
        org_uuid = uuid.UUID(org_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID")

    stmt = select(ThreatActor).where(ThreatActor.id == actor_uuid, ThreatActor.org_id == org_uuid)
    result = await db.execute(stmt)
    actor = result.scalar_one_or_none()
    
    if not actor:
        # Fallback to test org for UI compatibility if needed
        try:
            test_org_uuid = uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6")
            stmt_test = select(ThreatActor).where(ThreatActor.id == actor_uuid, ThreatActor.org_id == test_org_uuid)
            actor = (await db.execute(stmt_test)).scalar_one_or_none()
        except:
            pass
            
    if not actor:
        raise HTTPException(status_code=404, detail="Threat actor not found")

    if request.name is not None:
        actor.name = request.name
    if request.description is not None:
        actor.description = request.description
    if request.version is not None:
        actor.version = request.version
        
    actor.last_updated = datetime.utcnow()
    await db.commit()
    
    soph_val = actor.sophistication.value if hasattr(actor.sophistication, 'value') else actor.sophistication
    return {
        "id": str(actor.id),
        "name": actor.name,
        "description": actor.description,
        "version": actor.version,
        "sophistication": soph_val,
        "active": actor.active
    }

@router.delete("/actors/{actor_id}")
async def delete_threat_actor(
    actor_id: str,
    org_id: str,
    db: AsyncSession = Depends(get_db)
):
    try:
        actor_uuid = uuid.UUID(actor_id)
        org_uuid = uuid.UUID(org_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID")

    stmt = select(ThreatActor).where(ThreatActor.id == actor_uuid, ThreatActor.org_id == org_uuid)
    result = await db.execute(stmt)
    actor = result.scalar_one_or_none()
    
    if not actor:
        # Fallback to test org
        try:
            test_org_uuid = uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6")
            stmt_test = select(ThreatActor).where(ThreatActor.id == actor_uuid, ThreatActor.org_id == test_org_uuid)
            actor = (await db.execute(stmt_test)).scalar_one_or_none()
        except:
            pass
            
    if not actor:
        raise HTTPException(status_code=404, detail="Threat actor not found")
        
    await db.delete(actor)
    await db.commit()
    return {"status": "success"}

@router.get("/indicators", response_model=dict)
async def list_threat_indicators(
    org_id: str,
    threat_actor_id: Optional[str] = None,
    severity: Optional[Severity] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    try:
        org_uuid = uuid.UUID(org_id)
    except ValueError:
        org_uuid = uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6")
        
    stmt = select(ThreatIntelIndicator).where(ThreatIntelIndicator.org_id == org_uuid)
    
    if threat_actor_id:
        stmt = stmt.where(ThreatIntelIndicator.threat_actor_id == uuid.UUID(threat_actor_id))
    if severity:
        stmt = stmt.where(ThreatIntelIndicator.severity == severity)
        
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0
    
    stmt = stmt.limit(limit).offset(offset)
    result = await db.execute(stmt)
    indicators = result.scalars().all()
    
    return {
        "items": indicators,
        "total": total,
        "limit": limit,
        "offset": offset
    }

@router.get("/dark-web", response_model=dict)
async def list_dark_web_alerts(
    org_id: str,
    limit: int = 50,
    offset: int = 0
):
    # Stub: return mock data
    alerts = [
        {
            "id": str(uuid.uuid4()),
            "alert_type": "Credential Exposure",
            "title": "Corporate Credentials Found in Stealer Logs",
            "description": "24 credentials associated with @example.com were identified in a recent RedLine stealer log dump.",
            "severity": Severity.critical,
            "source": "Russian Market",
            "detected_at": datetime.now(timezone.utc).isoformat(),
            "is_resolved": False
        },
        {
            "id": str(uuid.uuid4()),
            "alert_type": "Data Leak",
            "title": "Possible Customer Data Paste",
            "description": "A paste containing what appears to be a list of user emails and hashed passwords matches your domain nomenclature.",
            "severity": Severity.high,
            "source": "Pastebin",
            "detected_at": datetime.now(timezone.utc).isoformat(),
            "is_resolved": False
        },
        {
            "id": str(uuid.uuid4()),
            "alert_type": "Brand Mention",
            "title": "Discussing Exploitation on Forum",
            "description": "Threat actors on a prominent cybercrime forum are discussing potential vulnerabilities in your custom web application.",
            "severity": Severity.medium,
            "source": "XSS.is Forum",
            "detected_at": (datetime.now(timezone.utc)).isoformat(),
            "is_resolved": False
        }
    ]
    
    return {
        "items": alerts,
        "total": len(alerts),
        "limit": limit,
        "offset": offset
    }

@router.get("/breach-reports", response_model=dict)
async def list_breach_reports(
    org_id: str,
    limit: int = 4,
    offset: int = 0
):
    all_reports = [
        {
            "id": "br-1",
            "title": "Change Healthcare Ransomware Incident (2024)",
            "date": "2024-02-21",
            "summary": "ALPHV/BlackCat deployed ransomware on Change Healthcare's systems, causing nationwide pharmacy and hospital billing outages.",
            "threat_actor": "ALPHV/BlackCat",
            "industry": "Healthcare",
            "simulation_query": "Simulate the ALPHV Change Healthcare ransomware attack on our network."
        },
        {
            "id": "br-2",
            "title": "Snowflake Credential Stuffing Campaign (2024)",
            "date": "2024-05-15",
            "summary": "UNS and UNC5537 compromised hundreds of Snowflake customer environments using stolen credentials bypassing accounts lacking MFA.",
            "threat_actor": "UNC5537",
            "industry": "Cloud/Data Services",
            "simulation_query": "Simulate Snowflake MFA bypass and unchecked credential stuffing."
        },
        {
            "id": "br-3",
            "title": "AnyDesk Production Network Breach (2024)",
            "date": "2024-02-02",
            "summary": "Attackers breached AnyDesk's production systems, stealing source code and private code signing keys.",
            "threat_actor": "Unknown",
            "industry": "Software",
            "simulation_query": "Simulate supply chain attack via compromised code signing certificates."
        },
        {
            "id": "br-4",
            "title": "Microsoft Midnight Blizzard Exchange Breach (2024)",
            "date": "2024-01-12",
            "summary": "Russian state-sponsored actor used a password spray attack to compromise a legacy, non-MFA test tenant account, eventually accessing corporate email accounts including senior leadership.",
            "threat_actor": "Midnight Blizzard (APT29)",
            "industry": "Technology",
            "simulation_query": "Simulate password spraying against legacy identity tenants."
        },
        {
            "id": "br-5",
            "title": "Ivanti Connect Secure Zero-Days (2024)",
            "date": "2024-01-10",
            "summary": "Multiple threat actors, including suspected Chinese state-sponsored groups, exploited zero-day vulnerabilities in Ivanti VPN devices to bypass authentication.",
            "threat_actor": "Multiple APTs",
            "industry": "Networking",
            "simulation_query": "Simulate edge VPN authentication bypass exploits."
        },
        {
            "id": "br-6",
            "title": "Okta Support System Breach (2023)",
            "date": "2023-10-20",
            "summary": "Threat actor gained access to Okta's customer support system using stolen credentials and stole HAR files containing session tokens of 134 customers.",
            "threat_actor": "Unknown",
            "industry": "Identity Provider",
            "simulation_query": "Simulate session token theft and replay from support environments."
        },
        {
            "id": "br-7",
            "title": "MGM Resorts Ransomware Attack (2023)",
            "date": "2023-09-11",
            "summary": "Scattered Spider compromised Okta Identity provider via social engineering the IT Helpdesk, leading to lateral movement, vSphere compromise, and ransomware deployment.",
            "threat_actor": "Scattered Spider",
            "industry": "Hospitality",
            "simulation_query": "Simulate the 2023 MGM Ransomware Attack against our architecture."
        },
        {
            "id": "br-8",
            "title": "Caesars Entertainment Ransomware (2023)",
            "date": "2023-09-07",
            "summary": "Similar to MGM, Scattered Spider used social engineering against an outsourced IT support vendor to breach the network and demand a massive ransom.",
            "threat_actor": "Scattered Spider",
            "industry": "Hospitality",
            "simulation_query": "Simulate outsourced IT vendor social engineering compromise."
        },
        {
            "id": "br-9",
            "title": "MOVEit Transfer Mass Exploitation (2023)",
            "date": "2023-05-27",
            "summary": "cl0p ransomware gang exploited a zero-day SQL injection vulnerability in Progress MOVEit Transfer to steal data from thousands of organizations globally.",
            "threat_actor": "cl0p",
            "industry": "Software",
            "simulation_query": "Simulate unauthenticated SQL injection on managed file transfer edge devices."
        },
        {
            "id": "br-10",
            "title": "3CX Supply Chain Attack (2023)",
            "date": "2023-03-22",
            "summary": "North Korean hackers successfully compromised the 3CX desktop app via an earlier supply chain breach of Trading Technologies, trojanizing the application update servers.",
            "threat_actor": "Lazarus Group",
            "industry": "Telecommunications",
            "simulation_query": "Simulate nested supply chain software update trojan."
        },
        {
            "id": "br-11",
            "title": "LastPass Source Code and Vault Breach (2022)",
            "date": "2022-08-11",
            "summary": "Threat actor gained access to LastPass's developer environment, stole source code, and subsequently used it to target a senior DevOps engineer and steal encrypted customer password vaults.",
            "threat_actor": "Unknown",
            "industry": "Security",
            "simulation_query": "Simulate developer environment breach and subsequent employee targeting."
        },
        {
            "id": "br-12",
            "title": "SolarWinds Sunburst (2020)",
            "date": "2020-12-13",
            "summary": "Russian intelligence injected malware into SolarWinds Orion updates, compromising thousands of government and enterprise networks globally.",
            "threat_actor": "APT29",
            "industry": "IT Management",
            "simulation_query": "Simulate IT monitoring software supply chain compromise."
        }
    ]
    
    # Sort descending by date to ensure the most recent is always first
    all_reports.sort(key=lambda x: x["date"], reverse=True)
    
    paginated_reports = all_reports[offset:offset+limit]
    
    return {
        "items": paginated_reports,
        "total": len(all_reports),
        "limit": limit,
        "offset": offset,
        "has_more": offset + limit < len(all_reports)
    }

from app.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud import threat_feed as crud_threat_feed
from app.schemas.threat_intel import ThreatFeedSubscriptionCreate, ThreatFeedSubscriptionResponse

class UpdateFeedSubscriptionsRequest(BaseModel):
    feed_ids: List[str] # List of feed UUIDs that should be active

@router.get("/feeds", response_model=List[ThreatFeedSubscriptionResponse])
async def get_threat_feeds(org_id: str, db: AsyncSession = Depends(get_db)):
    """Get the configuration and status of available threat intel feeds."""
    try:
        org_uuid = uuid.UUID(org_id)
    except ValueError:
        org_uuid = uuid.uuid4()
        
    feeds = await crud_threat_feed.get_by_org(db=db, org_id=org_uuid)
    
    if not feeds and org_id == "default":
        # Seed defaults
        defaults = [
            ThreatFeedSubscriptionCreate(
                org_id=org_uuid,
                name="CISA KEV",
                description="Known Exploited Vulnerabilities Catalog from CISA.",
                provider="Gov",
                is_active=True,
                last_synced=datetime.now(timezone.utc)
            ),
            ThreatFeedSubscriptionCreate(
                org_id=org_uuid,
                name="FS-ISAC",
                description="Financial Services Information Sharing and Analysis Center.",
                provider="ISAC",
                is_active=True,
                last_synced=datetime.now(timezone.utc)
            ),
            ThreatFeedSubscriptionCreate(
                org_id=org_uuid,
                name="CrowdStrike Falcon Intel",
                description="Premium commercial threat intelligence signals.",
                provider="Commercial",
                is_active=False,
                last_synced=None
            ),
            ThreatFeedSubscriptionCreate(
                org_id=org_uuid,
                name="AlienVault OTX",
                description="Open Threat Exchange community indicator feed.",
                provider="Community",
                is_active=False,
                last_synced=None
            )
        ]
        for d in defaults:
            await crud_threat_feed.create(db=db, obj_in=d)
        feeds = await crud_threat_feed.get_by_org(db=db, org_id=org_uuid)
        
    return feeds

@router.put("/feeds")
async def update_threat_feeds(request: UpdateFeedSubscriptionsRequest, org_id: str, db: AsyncSession = Depends(get_db)):
    """Update which threat feeds are actively ingested."""
    try:
        org_uuid = uuid.UUID(org_id)
    except ValueError:
        org_uuid = uuid.uuid4()
        
    feeds = await crud_threat_feed.get_by_org(db=db, org_id=org_uuid)
    
    for feed in feeds:
        is_now_active = str(feed.id) in request.feed_ids
        if feed.is_active != is_now_active:
            await crud_threat_feed.update(
                db=db, 
                db_obj=feed, 
                obj_in={"is_active": is_now_active, "last_synced": datetime.now(timezone.utc) if is_now_active else None}
            )
    
    return {"status": "success", "message": "Feed subscriptions updated successfully."}
