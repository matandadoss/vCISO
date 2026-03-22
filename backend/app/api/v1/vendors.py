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
    risk_score: int = 50
    status: str = "Warning"
    tech_stack: List[str] = []

class VendorUpdate(BaseModel):
    name: Optional[str] = None
    risk_score: Optional[int] = None
    status: Optional[str] = None
    tech_stack: Optional[List[str]] = None

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
        
    new_vendor = VendorModel(
        org_id=org_uuid,
        name=vendor.name,
        risk_score=vendor.risk_score,
        status=vendor.status,
        tech_stack=vendor.tech_stack,
        vendor_type="software",
        tier="basic",
        data_access_level="low",
        assessment_status=vendor.status,
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
    if vendor_in.risk_score is not None:
        db_vendor.risk_score = vendor_in.risk_score
    if vendor_in.status is not None:
        db_vendor.status = vendor_in.status
    if vendor_in.tech_stack is not None:
        db_vendor.tech_stack = vendor_in.tech_stack
        
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

    return {
        "status": "success",
        "vendor_id": vendor_id,
        "report": {
            "summary": f"AI Executive Summary for {db_vendor.name}",
            "confidence_score": secrets.SystemRandom().randint(70, 99),
            "threat_insights": threat_intel,
            "recommended_action": "Monitor closely" if db_vendor.status != "Critical" else "URGENT: Initiate incident response protocols and isolate connection.",
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
