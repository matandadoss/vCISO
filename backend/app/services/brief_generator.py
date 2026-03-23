import json
from datetime import datetime, timedelta
import uuid
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.ai_provider import AIProviderClient, AIRequest, ModelTier

from app.models.domain import Asset, Finding, SecurityControl, AuditLog

async def gather_weekly_telemetry(db: AsyncSession, org_id: uuid.UUID) -> Dict[str, Any]:
    """
    Scans the database for architectural drift and security telemetry over the trailing 7 days.
    """
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    # 1. New Assets (Infrastructure Changes)
    asset_query = select(Asset).where(Asset.org_id == org_id, Asset.first_seen >= seven_days_ago)
    asset_result = await db.execute(asset_query)
    new_assets = asset_result.scalars().all()
    
    # 2. Findings (Threats & Vulnerabilities)
    finding_query = select(Finding).where(Finding.org_id == org_id, Finding.detected_at >= seven_days_ago)
    finding_result = await db.execute(finding_query)
    new_findings = finding_result.scalars().all()
    
    resolved_query = select(Finding).where(Finding.org_id == org_id, Finding.resolved_at >= seven_days_ago)
    resolved_result = await db.execute(resolved_query)
    resolved_findings = resolved_result.scalars().all()
    
    # 3. Security Controls (Tooling Changes)
    control_query = select(SecurityControl).where(SecurityControl.org_id == org_id, SecurityControl.last_validated >= seven_days_ago)
    control_result = await db.execute(control_query)
    updated_controls = control_result.scalars().all()
    
    # Restructure into a clean JSON digest for the LLM
    return {
        "new_assets_deployed": [{"name": a.name, "type": a.asset_type.value if hasattr(a.asset_type, 'value') else a.asset_type, "environment": a.environment.value if hasattr(a.environment, 'value') else a.environment} for a in new_assets],
        "new_findings_detected": [{"title": f.title, "severity": f.severity.value if hasattr(f.severity, 'value') else f.severity, "type": f.finding_type.value if hasattr(f.finding_type, 'value') else f.finding_type} for f in new_findings],
        "findings_resolved": [{"title": f.title, "severity": f.severity.value if hasattr(f.severity, 'value') else f.severity} for f in resolved_findings],
        "controls_updated": [{"name": c.name, "status": c.status, "effectiveness": c.effectiveness_score} for c in updated_controls],
        "timeframe": f"{seven_days_ago.strftime('%Y-%m-%d')} to {datetime.utcnow().strftime('%Y-%m-%d')}"
    }

async def generate_role_specific_brief(raw_data: Dict[str, Any], role: str) -> str:
    """
    Ingests the raw 7-day telemetry JSON and instructs the active `AIProviderClient` to synthesize a concise, 
    role-tailored markdown briefing perfectly tuned to the specific employee persona.
    """
    client = AIProviderClient()
    
    # Determine psychological persona and phrasing format based on RBAC role
    if role in ["admin", "superadmin"]:
        persona = "CISO / Executive Leadership"
        instructions = "Focus strictly on macroeconomic risk vectors, compliance posture shifts, infrastructure drift, and high-level ROI regarding resolved threats."
    elif role == "editor":
        persona = "SOC Analyst / Security Engineer"
        instructions = "Focus strictly on technical telemetry. Provide explicit lists of newly exposed assets, new high/critical severity findings, and failing security controls."
    else:
        persona = "General Business Stakeholder"
        instructions = "Provide a very high-level, non-technical digest highlighting positive security remediations and general platform health."
        
    try:
        req = AIRequest(
            system_prompt=f"You are the vCISO Platform Intelligence Agent. Generate a **Weekly Security Brief** for a reader occupying the '{persona}' role.",
            user_prompt=f"{instructions}\n\nUse the following raw database telemetry from the past 7 days:\n```json\n{json.dumps(raw_data, indent=2)}\n```\n\nOutput strictly in elegant, well-formatted Markdown suitable for email delivery or web rendering. Do not include introductory conversational filler.",
            tier=ModelTier.FAST_CHEAP
        )
        response = await client.complete(req)
        if response:
            return response.content
        return "### Output Empty\nThe AI returned an empty digest."
    except Exception as e:
        return f"### Weekly Brief Generation Failed\nAn error occurred while contacting the AI model: {str(e)}"
