from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
import datetime
import asyncio
import secrets
import uuid
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.models.domain import Vendor as VendorModel
from app.core.ai_provider import AIProviderClient, AIRequest, ModelTier

router = APIRouter(prefix="/vendors", tags=["vendors"])

class VendorResponse(BaseModel):
    id: str
    name: str
    vendor_type: str
    parent_vendor_id: Optional[str] = None
    risk_score: int
    status: str
    tech_stack: List[str]
    last_assessment: str

    model_config = ConfigDict(from_attributes=True)

class VendorCreate(BaseModel):
    name: str
    vendor_type: str = "Vendor"
    parent_vendor_id: Optional[str] = None
    risk_score: Optional[int] = None
    status: Optional[str] = None
    tech_stack: List[str] = []

class VendorUpdate(BaseModel):
    name: Optional[str] = None
    vendor_type: Optional[str] = None
    parent_vendor_id: Optional[str] = None
    risk_score: Optional[int] = None
    status: Optional[str] = None
    tech_stack: Optional[List[str]] = None

class VendorSyncRequest(BaseModel):
    stack_items: List[str]

@router.get("/", response_model=List[VendorResponse])
async def list_vendors(org_id: str, db: AsyncSession = Depends(get_db)):
    try:
        org_uuid = uuid.UUID(org_id)
    except:
        org_uuid = uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6")
        
    result = await db.execute(select(VendorModel).where(VendorModel.org_id == org_uuid))
    db_vendors = result.scalars().all()
    

    
    out = []
    for v in db_vendors:
        out.append({
            "id": str(v.id),
            "name": v.name,
            "vendor_type": v.vendor_type or "Vendor",
            "parent_vendor_id": str(v.parent_vendor_id) if v.parent_vendor_id else None,
            "risk_score": v.risk_score,
            "status": v.status or "Warning",
            "tech_stack": v.tech_stack if v.tech_stack is not None else [],
            "last_assessment": v.last_assessment_date.isoformat() if v.last_assessment_date else datetime.datetime.utcnow().isoformat()
        })
    return out

@router.post("/", response_model=VendorResponse)
async def create_vendor(vendor: VendorCreate, org_id: str, db: AsyncSession = Depends(get_db)):
    try:
        org_uuid = uuid.UUID(org_id)
    except:
        org_uuid = uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6")
        
    if not vendor.tech_stack:
        vendor.tech_stack = infer_tech_stack(vendor.name)
        
    ts_len = len(vendor.tech_stack or [])
    final_score = vendor.risk_score if vendor.risk_score is not None else min(95, max(100 - (ts_len * 10), 0))
    
    if vendor.status is not None:
        final_status = vendor.status
    else:
        if final_score >= 80: final_status = "Safe"
        elif final_score >= 50: final_status = "Warning"
        else: final_status = "Critical"

    new_vendor = VendorModel(
        org_id=org_uuid,
        name=vendor.name,
        risk_score=final_score,
        status=final_status,
        tech_stack=vendor.tech_stack,
        vendor_type=vendor.vendor_type,
        parent_vendor_id=uuid.UUID(vendor.parent_vendor_id) if vendor.parent_vendor_id else None,
        tier="basic",
        data_access_level="low",
        assessment_status=final_status,
        last_assessment_date=datetime.datetime.utcnow()
    )
    db.add(new_vendor)
    await db.commit()
    await db.refresh(new_vendor)
    
    return {
        "id": str(new_vendor.id),
        "name": new_vendor.name,
        "vendor_type": new_vendor.vendor_type,
        "parent_vendor_id": str(new_vendor.parent_vendor_id) if new_vendor.parent_vendor_id else None,
        "risk_score": new_vendor.risk_score,
        "status": new_vendor.status,
        "tech_stack": new_vendor.tech_stack or [],
        "last_assessment": new_vendor.last_assessment_date.isoformat() if new_vendor.last_assessment_date else datetime.datetime.utcnow().isoformat()
    }

@router.put("/{vendor_id}", response_model=VendorResponse)
async def update_vendor(vendor_id: str, vendor_in: VendorUpdate, org_id: str, db: AsyncSession = Depends(get_db)):
    try:
        v_uuid = uuid.UUID(vendor_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid vendor ID")
        
    result = await db.execute(select(VendorModel).where(VendorModel.id == v_uuid))
    db_vendor = result.scalar_one_or_none()
    if not db_vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
        
    if vendor_in.name is not None:
        db_vendor.name = vendor_in.name
    if vendor_in.vendor_type is not None:
        db_vendor.vendor_type = vendor_in.vendor_type
    if vendor_in.parent_vendor_id is not None:
        db_vendor.parent_vendor_id = uuid.UUID(vendor_in.parent_vendor_id) if vendor_in.parent_vendor_id else None
    if vendor_in.tech_stack is not None:
        db_vendor.tech_stack = vendor_in.tech_stack
        
    req_dict = vendor_in.model_dump(exclude_unset=True)
    
    if 'risk_score' in req_dict:
        if req_dict['risk_score'] is None:
            ts_len = len(db_vendor.tech_stack or [])
            db_vendor.risk_score = min(95, max(100 - (ts_len * 10), 0))
        else:
            db_vendor.risk_score = req_dict['risk_score']
            
    if 'status' in req_dict:
        if req_dict['status'] is None:
            if db_vendor.risk_score is not None:
                if db_vendor.risk_score >= 80: db_vendor.status = "Safe"
                elif db_vendor.risk_score >= 50: db_vendor.status = "Warning"
                else: db_vendor.status = "Critical"
            else:
                db_vendor.status = "Warning"
        else:
            db_vendor.status = req_dict['status']
        
    await db.commit()
    return {
        "id": str(db_vendor.id),
        "name": db_vendor.name,
        "vendor_type": db_vendor.vendor_type,
        "parent_vendor_id": str(db_vendor.parent_vendor_id) if db_vendor.parent_vendor_id else None,
        "risk_score": db_vendor.risk_score,
        "status": db_vendor.status,
        "tech_stack": db_vendor.tech_stack or [],
        "last_assessment": db_vendor.last_assessment_date.isoformat() if db_vendor.last_assessment_date else datetime.datetime.utcnow().isoformat()
    }

@router.delete("/{vendor_id}")
async def delete_vendor(vendor_id: str, org_id: str, db: AsyncSession = Depends(get_db)):
    try:
        v_uuid = uuid.UUID(vendor_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid vendor ID")
        
    result = await db.execute(select(VendorModel).where(VendorModel.id == v_uuid))
    db_vendor = result.scalar_one_or_none()
    if not db_vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
        
    await db.delete(db_vendor)
    await db.commit()
    return {"status": "success"}

@router.get("/{vendor_id}/inspect")
async def inspect_vendor(vendor_id: str, org_id: str, db: AsyncSession = Depends(get_db)):
    try:
        v_uuid = uuid.UUID(vendor_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid vendor ID")
        
    result = await db.execute(select(VendorModel).where(VendorModel.id == v_uuid))
    db_vendor = result.scalar_one_or_none()
    if not db_vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
        
    await asyncio.sleep(2.5) # Simulate AI thinking time

    threat_intel = []
    ts = db_vendor.tech_stack or []
    if "database" in ts:
        threat_intel.append("Recent CVE-2024-XXX detected in cloud database orchestration layers. High probability of scanning activity.")
    if "monitoring" in ts:
        threat_intel.append("Supply chain alerts active for legacy IT monitoring platforms. Ensure strict network segmentation.")
    if "communication" in ts:
        threat_intel.append("Low risk. Standard phishing and social engineering campaigns are the primary threat vector.")
    if not threat_intel:
        threat_intel.append(f"No active, critical CVEs found trending for {db_vendor.name}'s primary tech stack.")

    new_calculated_score = db_vendor.risk_score
    if db_vendor.risk_score is None:
        new_calculated_score = 50
    
    # Simulate an AI reassessment shift based on findings
    if threat_intel and "No active, critical CVEs" not in threat_intel[0]:
        new_calculated_score = max(new_calculated_score - secrets.SystemRandom().randint(10, 25), 0)
    else:
        new_calculated_score = min(new_calculated_score + secrets.SystemRandom().randint(5, 15), 95)

    return {
        "status": "success",
        "vendor_id": vendor_id,
        "report": {
            "summary": f"AI Executive Summary for {db_vendor.name}",
            "confidence_score": secrets.SystemRandom().randint(70, 99),
            "new_risk_score": new_calculated_score,
            "threat_insights": threat_intel,
            "recommended_action": "Monitor closely" if new_calculated_score >= 50 else "URGENT: Initiate incident response protocols and isolate connection.",
            "generated_at": datetime.datetime.utcnow().isoformat()
        }
    }

@router.post("/upload")
async def upload_vendors_bulk(
    org_id: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    valid_extensions = (".pdf", ".txt", ".csv", ".xlsx")
    ext = f".{file.filename.split('.')[-1].lower()}" if "." in file.filename else ""
    
    if ext not in valid_extensions:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {valid_extensions}")
        
    file_bytes = await file.read()
    
    # Mock Malware Scan Intercept
    if "eicar" in file.filename.lower() or b"X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*" in file_bytes:
        raise HTTPException(status_code=406, detail="MALWARE_DETECTED: Upload terminated by Active Scanning Engine.")

    mime_map = {
        ".pdf": "application/pdf",
        ".txt": "text/plain",
        ".csv": "text/csv",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }

    ai = AIProviderClient()
    req = AIRequest(
        system_prompt="You are an incredibly robust IT Vendor Data Extractor bridging unstructured human payloads to a backend database.",
        user_prompt="""Extract every single vendor entity mentioned or detailed in this attached document. 
Determine their 'name', predict their associated 'tech_stack' (array of strings from: aws, database, communication, monitoring, mobile, networking, active_directory, version_control, ci_cd), predict their cyber health 'risk_score' (int 0-100, but capped at 95 practically since no vendor is perfectly safe), and derive their 'status' (string: Safe, Warning, Critical based on that score).""",
        tier=ModelTier.DEEP,
        file_parts=[{"data": file_bytes, "mime_type": mime_map[ext]}],
        structured_output_schema={
            "type": "object",
            "properties": {
                "vendors": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "vendor_type": {"type": "string", "description": "Vendor or Product"},
                            "parent_vendor_name": {"type": "string", "description": "If Product, the name of the parent Vendor company (e.g. AWS). Otherwise leave blank."},
                            "tech_stack": {"type": "array", "items": {"type": "string"}},
                            "risk_score": {"type": "integer"},
                            "status": {"type": "string"}
                        },
                        "required": ["name", "vendor_type", "tech_stack", "risk_score", "status"]
                    }
                }
            },
            "required": ["vendors"]
        }
    )

    try:
        org_uuid = uuid.UUID(org_id)
    except:
        org_uuid = uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6")

    res = await ai.complete(req)
    if not res or not res.structured_output or "vendors" not in res.structured_output:
        raise HTTPException(status_code=500, detail="AI Extraction failed to parse document boundaries.")

    # First, gather existing vendors to link parents
    result = await db.execute(select(VendorModel).where(VendorModel.org_id == org_uuid))
    db_vendors_list = result.scalars().all()
    vendor_name_map = {v.name.lower(): v for v in db_vendors_list}

    extracted_vendors = res.structured_output["vendors"]
    inserted_count = 0
    
    for ev in extracted_vendors:
        parent_id = None
        p_name = ev.get("parent_vendor_name")
        if p_name and p_name.lower() in vendor_name_map:
            parent_id = vendor_name_map[p_name.lower()].id
            
        new_v = VendorModel(
            org_id=org_uuid,
            name=ev["name"],
            risk_score=ev["risk_score"],
            status=ev["status"],
            tech_stack=ev["tech_stack"],
            vendor_type=ev.get("vendor_type", "Vendor"),
            parent_vendor_id=parent_id,
            tier="basic",
            data_access_level="low",
            assessment_status=ev["status"],
            last_assessment_date=datetime.datetime.utcnow()
        )
        db.add(new_v)
        inserted_count += 1
        vendor_name_map[new_v.name.lower()] = new_v
        
    await db.commit()
    
    return {
        "status": "success",
        "message": f"Successfully parsed and ingested {inserted_count} vendors seamlessly via Google Gemini Multimodal APIs.",
        "vendors_extracted": inserted_count
    }

def infer_tech_stack(name: str) -> List[str]:
    name_lower = name.lower()
    stack = []
    
    mapping = {
        "aws": ["aws", "amazon", "ec2", "s3"],
        "database": ["sql", "mongo", "db", "redis", "postgres", "oracle", "mysql"],
        "networking": ["network", "cisco", "palo alto", "vpn", "firewall", "cloudflare", "fortinet"],
        "monitoring": ["datadog", "splunk", "monitor", "grafana", "prometheus", "new relic"],
        "communication": ["slack", "teams", "zoom", "mail", "discord", "webex"],
        "ci_cd": ["github", "gitlab", "jenkins", "circleci", "deployment", "github actions"],
        "mobile": ["ios", "android", "mobile", "app", "react native", "flutter"],
        "active_directory": ["ad", "active directory", "azure ad", "okta", "auth0", "identity", "ping"],
        "version_control": ["git", "bitbucket", "svn", "version_control"]
    }
    
    for tech, keywords in mapping.items():
        if any(kw in name_lower for kw in keywords):
            stack.append(tech)
            
    if not stack:
        stack.append("custom")
        
    return stack

async def auto_assign_hierarchy(name: str, org_uuid: uuid.UUID, db: AsyncSession, vendor_name_map: dict):
    name_l = name.lower()
    product_map = {
        "s3": "AWS", "ec2": "AWS", "rds": "AWS", "lambda": "AWS", "dynamodb": "AWS", "cloudfront": "AWS",
        "mongodb": "MongoDB", "atlas": "MongoDB",
        "azure ad": "Microsoft", "active directory": "Microsoft", "office 365": "Microsoft", "azure": "Microsoft",
        "gcp": "Google", "g suite": "Google", "workspace": "Google", "bigquery": "Google", "cloud sql": "Google",
        "cloudflare": "Cloudflare",
        "salesforce": "Salesforce",
        "github": "GitHub", "actions": "GitHub",
        "gitlab": "GitLab",
        "datadog": "Datadog",
        "splunk": "Splunk",
        "slack": "Slack",
        "jira": "Atlassian", "confluence": "Atlassian", "bitbucket": "Atlassian",
        "okta": "Okta", "auth0": "Okta",
        "postgresql": "PostgreSQL",
        "mysql": "Oracle"
    }

    # First check direct matches
    parent_name = None
    if name_l in product_map:
        parent_name = product_map[name_l]
    else:
        for prod, p_name in product_map.items():
            if prod in name_l.split() or f"{prod} " in name_l or f" {prod}" in name_l:
                parent_name = p_name
                break

    if not parent_name:
        return "Vendor", None

    if parent_name.lower() == name_l:
        return "Vendor", None

    # Check if parent exists
    parent_id = None
    if parent_name.lower() in vendor_name_map:
        parent_id = vendor_name_map[parent_name.lower()].id
    else:
        # Create parent
        new_parent = VendorModel(
            org_id=org_uuid,
            name=parent_name,
            risk_score=95,
            status="Safe",
            tech_stack=infer_tech_stack(parent_name),
            vendor_type="Vendor",
            tier="basic",
            data_access_level="low",
            assessment_status="Safe",
            last_assessment_date=datetime.datetime.utcnow()
        )
        db.add(new_parent)
        await db.flush()
        vendor_name_map[parent_name.lower()] = new_parent
        parent_id = new_parent.id

    return "Product", parent_id


@router.post("/sync", response_model=List[VendorResponse])
async def sync_vendors(req: VendorSyncRequest, org_id: str, db: AsyncSession = Depends(get_db)):
    try:
        org_uuid = uuid.UUID(org_id)
    except:
        org_uuid = uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6")
        
    result = await db.execute(select(VendorModel).where(VendorModel.org_id == org_uuid))
    db_vendors = result.scalars().all()
    vendor_name_map = {v.name.lower(): v for v in db_vendors}
    
    new_db_vendors = []
    # Auto-assign hierarchy requires await inside loop
    for item in req.stack_items:
        if item.lower() not in vendor_name_map:
            v_type, p_id = await auto_assign_hierarchy(item, org_uuid, db, vendor_name_map)
            
            inferred_stack = infer_tech_stack(item)
            new_v = VendorModel(
                org_id=org_uuid,
                name=item,
                risk_score=95,
                status="Safe",
                tech_stack=inferred_stack,
                vendor_type=v_type,
                parent_vendor_id=p_id,
                tier="basic",
                data_access_level="low",
                assessment_status="Safe",
                last_assessment_date=datetime.datetime.utcnow()
            )
            db.add(new_v)
            new_db_vendors.append(new_v)
            vendor_name_map[item.lower()] = new_v
            
    if new_db_vendors:
        await db.commit()
        result = await db.execute(select(VendorModel).where(VendorModel.org_id == org_uuid))
        db_vendors = result.scalars().all()
        
    out = []
    for v in db_vendors:
        out.append({
            "id": str(v.id),
            "name": v.name,
            "vendor_type": v.vendor_type or "Vendor",
            "parent_vendor_id": str(v.parent_vendor_id) if v.parent_vendor_id else None,
            "risk_score": v.risk_score,
            "status": v.status or "Warning",
            "tech_stack": v.tech_stack if v.tech_stack is not None else [],
            "last_assessment": v.last_assessment_date.isoformat() if v.last_assessment_date else datetime.datetime.utcnow().isoformat()
        })
    return out
