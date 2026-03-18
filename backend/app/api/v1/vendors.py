from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import datetime
import asyncio
import secrets

router = APIRouter(prefix="/vendors", tags=["vendors"])

class Vendor(BaseModel):
    id: str
    name: str
    risk_score: int
    status: str
    tech_stack: List[str]
    last_assessment: str

MOCK_VENDORS = [
    {
        "id": "v-cloudflare",
        "name": "Cloudflare",
        "risk_score": 98,
        "status": "Safe",
        "tech_stack": ["networking", "waf", "cdn"],
        "last_assessment": (datetime.datetime.utcnow() - datetime.timedelta(days=1)).isoformat()
    },
    {
        "id": "v-mongodb",
        "name": "MongoDB Atlas",
        "risk_score": 72,
        "status": "Warning",
        "tech_stack": ["database", "aws", "analytics"],
        "last_assessment": (datetime.datetime.utcnow() - datetime.timedelta(days=5)).isoformat()
    },
    {
        "id": "v-slack",
        "name": "Slack Enterprise",
        "risk_score": 85,
        "status": "Safe",
        "tech_stack": ["communication", "mobile", "api"],
        "last_assessment": (datetime.datetime.utcnow() - datetime.timedelta(days=2)).isoformat()
    },
    {
        "id": "v-solarwinds",
        "name": "SolarWinds Orion",
        "risk_score": 34,
        "status": "Critical",
        "tech_stack": ["monitoring", "windows", "active_directory"],
        "last_assessment": (datetime.datetime.utcnow() - datetime.timedelta(hours=4)).isoformat()
    },
    {
        "id": "v-github",
        "name": "GitHub",
        "risk_score": 92,
        "status": "Safe",
        "tech_stack": ["version_control", "ci_cd", "ruby"],
        "last_assessment": (datetime.datetime.utcnow() - datetime.timedelta(days=1)).isoformat()
    }
]

@router.get("/", response_model=List[Vendor])
async def get_vendors():
    return MOCK_VENDORS

@router.get("/{vendor_id}/inspect")
async def inspect_vendor(vendor_id: str):
    await asyncio.sleep(2.5) # Simulate AI thinking time
    
    vendor = next((v for v in MOCK_VENDORS if v["id"] == vendor_id), None)
    if not vendor:
        return {"status": "error", "message": "Vendor not found"}

    # Mock AI predictive analysis based on the vendor stack
    threat_intel = []
    if "database" in vendor["tech_stack"]:
        threat_intel.append("Recent CVE-2024-XXX detected in cloud database orchestration layers. High probability of scanning activity.")
    if "monitoring" in vendor["tech_stack"]:
        threat_intel.append("Supply chain alerts active for legacy IT monitoring platforms. Ensure strict network segmentation.")
    if "communication" in vendor["tech_stack"]:
        threat_intel.append("Low risk. Standard phishing and social engineering campaigns are the primary threat vector.")
    if not threat_intel:
        threat_intel.append(f"No active, critical CVEs found trending for {vendor['name']}'s primary tech stack.")

    return {
        "status": "success",
        "vendor_id": vendor_id,
        "report": {
            "summary": f"AI Executive Summary for {vendor['name']}",
            "confidence_score": secrets.SystemRandom().randint(70, 99),
            "threat_insights": threat_intel,
            "recommended_action": "Monitor closely" if vendor["status"] != "Critical" else "URGENT: Initiate incident response protocols and isolate connection.",
            "generated_at": datetime.datetime.utcnow().isoformat()
        }
    }
