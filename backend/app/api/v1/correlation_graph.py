from fastapi import APIRouter, Query, HTTPException, Depends
from typing import List, Optional, Dict, Any
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from sqlalchemy import select, delete
from app.models.domain import ComplianceFramework, Finding, Severity, FindingStatus, FindingType, WorkflowName, ServiceTier, User, Asset, Vendor
from app.core.auth import require_minimum_tier, get_current_user
import datetime
from pydantic import BaseModel

router = APIRouter(
    prefix="/correlation", 
    tags=["correlation"],
    dependencies=[Depends(require_minimum_tier(ServiceTier.enterprise))]
)

class RecalculateRequest(BaseModel):
    infra: List[Dict[str, Any]]
    tech: List[Dict[str, Any]]
    tools: List[Dict[str, Any]]

@router.post("/recalculate")
async def recalculate_correlation(
    request: RecalculateRequest,
    org_id: str = "default",
    db: AsyncSession = Depends(get_db)
):
    try:
        org_uuid = uuid.UUID(org_id)
    except ValueError:
        org_uuid = uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6")
    
    await db.execute(delete(Finding).where(Finding.org_id == org_uuid))
    
    infra_names = [i.get("name", "").lower() for i in request.infra]
    tech_names = [t.get("name", "").lower() for t in request.tech]
    tool_names = [t.get("name", "").lower() for t in request.tools]
    
    new_findings = []
    
    if any("aws" in i or "ec2" in i or "s3" in i or "lambda" in i for i in infra_names):
        new_findings.append(Finding(
            id=uuid.uuid4(),
            org_id=org_uuid,
            finding_type=FindingType.misconfiguration,
            title="AWS S3 Bucket Publicly Accessible",
            description="A critical AWS storage bucket containing PII has public read access enabled via its bucket policy.",
            severity=Severity.critical,
            risk_score=9.5,
            source_workflow=WorkflowName.infrastructure,
            status=FindingStatus.new,
            detected_at=datetime.datetime.utcnow()
        ))
    
    if any("azure" in i or "gcp" in i or "google" in i for i in infra_names):
        new_findings.append(Finding(
            id=uuid.uuid4(),
            org_id=org_uuid,
            finding_type=FindingType.credential_exposure,
            title="Leaked Cloud Service Account Keys",
            description="Service account keys with Editor permissions were discovered in a public GitHub repository.",
            severity=Severity.critical,
            risk_score=9.8,
            source_workflow=WorkflowName.osint,
            status=FindingStatus.new,
            detected_at=datetime.datetime.utcnow()
        ))
        
    if any("react" in t or "node" in t for t in tech_names):
        new_findings.append(Finding(
            id=uuid.uuid4(),
            org_id=org_uuid,
            finding_type=FindingType.supply_chain_risk,
            title="Malicious NPM Package Installed in React App",
            description="The frontend build process references an actively exploited typo-squatted npm package.",
            severity=Severity.high,
            risk_score=8.1,
            source_workflow=WorkflowName.supply_chain,
            status=FindingStatus.new,
            detected_at=datetime.datetime.utcnow()
        ))
        
    if any("python" in t or "fastapi" in t for t in tech_names):
        new_findings.append(Finding(
            id=uuid.uuid4(),
            org_id=org_uuid,
            finding_type=FindingType.vulnerability,
            title="Vulnerable Python Dependency (PyYAML)",
            description="A critical PyYAML CVE allows arbitrary code execution in the Python backend.",
            severity=Severity.high,
            risk_score=7.9,
            source_workflow=WorkflowName.vulnerability,
            status=FindingStatus.new,
            detected_at=datetime.datetime.utcnow()
        ))
    
    if not any("crowdstrike" in t or "sentinelone" in t or "datadog" in t for t in tool_names):
        new_findings.append(Finding(
            id=uuid.uuid4(),
            org_id=org_uuid,
            finding_type=FindingType.control_gap,
            title="Missing EDR Coverage",
            description="Critical production instances do not have an active Endpoint Detection and Response agent installed.",
            severity=Severity.high,
            risk_score=7.5,
            source_workflow=WorkflowName.controls,
            status=FindingStatus.new,
            detected_at=datetime.datetime.utcnow()
        ))
        
    if not new_findings:
        new_findings.append(Finding(
            id=uuid.uuid4(),
            org_id=org_uuid,
            finding_type=FindingType.vulnerability,
            title="Unauthenticated RCE Detected",
            description="An unknown unauthenticated remote code execution vulnerability was discovered on edge networks.",
            severity=Severity.critical,
            risk_score=10.0,
            source_workflow=WorkflowName.vulnerability,
            status=FindingStatus.new,
            detected_at=datetime.datetime.utcnow()
        ))
        
    for f in new_findings:
        db.add(f)
        
    await db.commit()
    return {"status": "success", "regenerated_count": len(new_findings)}


@router.get("/engine", response_model=Dict[str, Any])
async def get_correlation_engine_insights(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns dynamic AI Correlation Engine data combining findings into unified risk insights.
    """
    result = await db.execute(
        select(Finding).where(Finding.org_id == current_user.org_id)
    )
    findings = result.scalars().all()
    
    correlations = []
    active_patterns = len([f for f in findings if f.status != FindingStatus.resolved])
    critical_paths = len([f for f in findings if f.severity == Severity.critical and f.status != FindingStatus.resolved])
    
    for f in findings:
        if f.status == FindingStatus.resolved:
            continue
            
        progress_pct = int(f.risk_score * 10)
        
        c_color = "#3b82f6"
        c_bg = "var(--semantic-info-soft)"
        c_text = "var(--semantic-info-text)"
        if f.severity == Severity.critical:
            c_color = "#ef4444"
            c_bg = "var(--semantic-critical-soft)"
            c_text = "var(--semantic-critical-text)"
        elif f.severity == Severity.high:
            c_color = "#f97316"
            c_bg = "var(--semantic-warning-soft)"
            c_text = "var(--semantic-warning-text)"
        elif f.severity == Severity.medium:
            c_color = "#eab308"
            c_bg = "var(--semantic-caution-soft)"
            c_text = "var(--semantic-caution-text)"
            
        target_name = "Generic Asset"
        target_type = "Infrastructure"
        
        if f.affected_asset_ids and f.affected_asset_ids.get("ids"):
            asset_id = str(f.affected_asset_ids["ids"][0])
            try:
                asset_res = await db.execute(select(Asset).where(Asset.id == uuid.UUID(asset_id)))
                asset = asset_res.scalar_one_or_none()
                if asset:
                    target_name = asset.name
                    target_type = asset.asset_type.value
            except:
                pass
                
        elif f.affected_vendor_ids and f.affected_vendor_ids.get("ids"):
            vendor_id = str(f.affected_vendor_ids["ids"][0])
            try:
                ven_res = await db.execute(select(Vendor).where(Vendor.id == uuid.UUID(vendor_id)))
                ven = ven_res.scalar_one_or_none()
                if ven:
                    target_name = ven.name
                    target_type = ven.vendor_type
            except:
                pass
            
        correlations.append({
            "id": str(f.id),
            "source_type": f.source_workflow.value.replace("_", " ").title(),
            "source_name": f.title,
            "published_date": f.detected_at.strftime("%Y-%m-%d") if f.detected_at else datetime.datetime.utcnow().strftime("%Y-%m-%d"),
            "external_signal": f.description or "Anomaly detected in monitored logs.",
            "target_type": target_type,
            "target_name": target_name,
            "tier": "Tier-1",
            "correlation_confidence": "High" if f.risk_score > 7 else "Medium",
            "severity_tag": f.severity.value.upper(),
            "severity_bg": c_bg,
            "severity_color": c_text,
            "impact_summary": f.title,
            "recommended_action": f.remediation_notes or "Investigate and apply immediate mitigation protocols.",
            "timeframe_label": "Immediate" if f.severity == Severity.critical else "Standard",
            "progress_color": c_color,
            "progress_percent": progress_pct,
            "footer_stats": [
                {"label": f"Finding Type: {f.finding_type.value.replace('_', ' ').title()}", "tooltip": "Auto-classified by correlation engine"},
                {"label": f"Risk Score: {f.risk_score}/10.0", "tooltip": "Aggregate risk calculation"}
            ]
        })
        
    return {
        "engine_metrics": {
            "active_patterns": active_patterns,
            "evaluated_workflows": 9,
            "avg_control_effectiveness": "68%",
            "critical_risk_paths": critical_paths
        },
        "correlations": sorted(correlations, key=lambda x: x['progress_percent'], reverse=True)
    }

@router.get("/engine/{correlation_id}/graph", response_model=Dict[str, Any])
async def get_correlation_graph(
    correlation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns the node and link structure for the interactive knowledge graph view dynamically.
    """
    nodes = []
    links = []
    
    try:
        f_id = uuid.UUID(correlation_id)
        result = await db.execute(select(Finding).where(Finding.id == f_id).where(Finding.org_id == current_user.org_id))
        finding = result.scalar_one_or_none()
        
        if finding:
            nodes.append({"id": "vuln-1", "name": finding.title, "group": "vuln", "val": 35})
            
            if finding.affected_asset_ids and finding.affected_asset_ids.get("ids"):
                asset_id = str(finding.affected_asset_ids["ids"][0])
                asset_res = await db.execute(select(Asset).where(Asset.id == uuid.UUID(asset_id)))
                asset = asset_res.scalar_one_or_none()
                if asset:
                    nodes.append({"id": "asset-1", "name": asset.name, "group": "asset", "val": 45})
                    links.append({"source": "vuln-1", "target": "asset-1", "label": "affects"})
                    nodes.append({"id": "impact-1", "name": "Business Disruption", "group": "impact", "val": 50})
                    links.append({"source": "asset-1", "target": "impact-1", "label": "leads to"})
            
            elif finding.affected_vendor_ids and finding.affected_vendor_ids.get("ids"):
                vendor_id = str(finding.affected_vendor_ids["ids"][0])
                ven_res = await db.execute(select(Vendor).where(Vendor.id == uuid.UUID(vendor_id)))
                ven = ven_res.scalar_one_or_none()
                if ven:
                    nodes.append({"id": "vendor-1", "name": ven.name, "group": "vendor", "val": 45})
                    links.append({"source": "vuln-1", "target": "vendor-1", "label": "leaks from"})
                    nodes.append({"id": "impact-1", "name": "Supply Chain Breach", "group": "impact", "val": 50})
                    links.append({"source": "vendor-1", "target": "impact-1", "label": "leads to"})
    except:
        pass

    return {
        "nodes": nodes,
        "links": links
    }
