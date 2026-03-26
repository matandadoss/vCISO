from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
import datetime
import asyncio
import secrets
import uuid
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.domain import Vendor as VendorModel
from app.core.ai_provider import AIProviderClient, AIRequest, ModelTier

router = APIRouter(prefix="/vendors", tags=["vendors"])

class VendorResponse(BaseModel):
    id: str
    name: str
    risk_score: int
    status: str
    tech_stack: List[str]
    last_assessment: str

    model_config = ConfigDict(from_attributes=True)

class VendorCreate(BaseModel):
    name: str
    risk_score: Optional[int] = None
    status: Optional[str] = None
    tech_stack: List[str] = []

class VendorUpdate(BaseModel):
    name: Optional[str] = None
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
    
    updated_any = False
    now = datetime.datetime.utcnow()
    for v in db_vendors:
        if v.last_assessment_date is None or (now - v.last_assessment_date).days >= 1:
            shift = secrets.SystemRandom().randint(-5, 5)
            new_score = (v.risk_score or 50) + shift
            v.risk_score = min(100, max(0, new_score))
            
            if v.risk_score >= 80:
                v.status = "Critical"
            elif v.risk_score >= 50:
                v.status = "Warning"
            else:
                v.status = "Safe"
                
            v.last_assessment_date = now
            updated_any = True

    if updated_any:
        await db.commit()
    
    out = []
    for v in db_vendors:
        out.append({
            "id": str(v.id),
            "name": v.name,
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
    final_score = vendor.risk_score if vendor.risk_score is not None else min(50 + ts_len * 10, 100)
    
    if vendor.status is not None:
        final_status = vendor.status
    else:
        if final_score >= 80: final_status = "Critical"
        elif final_score >= 50: final_status = "Warning"
        else: final_status = "Safe"

    new_vendor = VendorModel(
        org_id=org_uuid,
        name=vendor.name,
        risk_score=final_score,
        status=final_status,
        tech_stack=vendor.tech_stack,
        vendor_type="software",
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
        "risk_score": new_vendor.risk_score,
        "status": new_vendor.status,
        "tech_stack": new_vendor.tech_stack or [],
        "last_assessment": new_vendor.last_assessment_date.isoformat()
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
    if vendor_in.tech_stack is not None:
        db_vendor.tech_stack = vendor_in.tech_stack
        
    req_dict = vendor_in.model_dump(exclude_unset=True)
    
    if 'risk_score' in req_dict:
        if req_dict['risk_score'] is None:
            ts_len = len(db_vendor.tech_stack or [])
            db_vendor.risk_score = min(50 + ts_len * 10, 100)
        else:
            db_vendor.risk_score = req_dict['risk_score']
            
    if 'status' in req_dict:
        if req_dict['status'] is None:
            if db_vendor.risk_score is not None:
                if db_vendor.risk_score >= 80: db_vendor.status = "Critical"
                elif db_vendor.risk_score >= 50: db_vendor.status = "Warning"
                else: db_vendor.status = "Safe"
            else:
                db_vendor.status = "Warning"
        else:
            db_vendor.status = req_dict['status']
        
    await db.commit()
    return {
        "id": str(db_vendor.id),
        "name": db_vendor.name,
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
        new_calculated_score = min(new_calculated_score + secrets.SystemRandom().randint(10, 25), 100)
    else:
        new_calculated_score = max(new_calculated_score - secrets.SystemRandom().randint(5, 15), 0)

    return {
        "status": "success",
        "vendor_id": vendor_id,
        "report": {
            "summary": f"AI Executive Summary for {db_vendor.name}",
            "confidence_score": secrets.SystemRandom().randint(70, 99),
            "new_risk_score": new_calculated_score,
            "threat_insights": threat_intel,
            "recommended_action": "Monitor closely" if new_calculated_score < 80 else "URGENT: Initiate incident response protocols and isolate connection.",
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
Determine their 'name', predict their associated 'tech_stack' (array of strings from: aws, database, communication, monitoring, mobile, networking, active_directory, version_control, ci_cd), predict their 'risk_score' (int 0-100), and derive their 'status' (string: Safe, Warning, Critical).""",
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
                            "tech_stack": {"type": "array", "items": {"type": "string"}},
                            "risk_score": {"type": "integer"},
                            "status": {"type": "string"}
                        },
                        "required": ["name", "tech_stack", "risk_score", "status"]
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

    extracted_vendors = res.structured_output["vendors"]
    inserted_count = 0
    
    for ev in extracted_vendors:
        new_v = VendorModel(
            org_id=org_uuid,
            name=ev["name"],
            risk_score=ev["risk_score"],
            status=ev["status"],
            tech_stack=ev["tech_stack"],
            vendor_type="software",
            tier="basic",
            data_access_level="low",
            assessment_status=ev["status"],
            last_assessment_date=datetime.datetime.utcnow()
        )
        db.add(new_v)
        inserted_count += 1
        
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

@router.post("/sync", response_model=List[VendorResponse])
async def sync_vendors(req: VendorSyncRequest, org_id: str, db: AsyncSession = Depends(get_db)):
    try:
        org_uuid = uuid.UUID(org_id)
    except:
        org_uuid = uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6")
        
    result = await db.execute(select(VendorModel).where(VendorModel.org_id == org_uuid))
    db_vendors = result.scalars().all()
    existing_names = {v.name.lower() for v in db_vendors}
    
    new_db_vendors = []
    for item in req.stack_items:
        if item.lower() not in existing_names:
            inferred_stack = infer_tech_stack(item)
            new_v = VendorModel(
                org_id=org_uuid,
                name=item,
                risk_score=50,
                status="Safe",
                tech_stack=inferred_stack,
                vendor_type="software",
                tier="basic",
                data_access_level="low",
                assessment_status="Safe",
                last_assessment_date=datetime.datetime.utcnow()
            )
            db.add(new_v)
            new_db_vendors.append(new_v)
            existing_names.add(item.lower())
            
    if new_db_vendors:
        await db.commit()
        result = await db.execute(select(VendorModel).where(VendorModel.org_id == org_uuid))
        db_vendors = result.scalars().all()
        
    updated_any = False
    now = datetime.datetime.utcnow()
    for v in db_vendors:
        if v.last_assessment_date is None or (now - v.last_assessment_date).days >= 1:
            shift = secrets.SystemRandom().randint(-5, 5)
            new_score = (v.risk_score or 50) + shift
            v.risk_score = min(100, max(0, new_score))
            
            if v.risk_score >= 80:
                v.status = "Critical"
            elif v.risk_score >= 50:
                v.status = "Warning"
            else:
                v.status = "Safe"
                
            v.last_assessment_date = now
            updated_any = True

    if updated_any:
        await db.commit()
    
    out = []
    for v in db_vendors:
        out.append({
            "id": str(v.id),
            "name": v.name,
            "risk_score": v.risk_score,
            "status": v.status or "Warning",
            "tech_stack": v.tech_stack if v.tech_stack is not None else [],
            "last_assessment": v.last_assessment_date.isoformat() if v.last_assessment_date else datetime.datetime.utcnow().isoformat()
        })
    return out
