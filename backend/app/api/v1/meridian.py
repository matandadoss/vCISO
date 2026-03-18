from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from app.core.auth import get_current_user
from app.models.domain import User

router = APIRouter(
    prefix="/meridian",
    tags=["meridian"],
)

@router.get("/supply-chain")
async def get_supply_chain_posture(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Returns the comprehensive supplier posture matrix mapped to CRI FSP,
    along with remediation velocity and concentration risk insights.
    """
    return {
        "insight_pattern": "Your Tier-1 suppliers (CoreAxis, NorthPoint) carry the highest business impact AND the weakest security posture. This is your supply chain concentration risk...",
        "suppliers": [
            { "id": "CX", "name": "CoreAxis Payments", "type": "Payment processing", "tier": 1, "overall": "D+", "scores": ["md", "md", "hi", "lo", "lo", "lo"], "remediation_velocity_pct": 8 },
            { "id": "NP", "name": "NorthPoint Cloud", "type": "Infrastructure (IaaS)", "tier": 1, "overall": "C", "scores": ["hi", "md", "md", "lo", "lo", "lo"], "remediation_velocity_pct": 22 },
            { "id": "DV", "name": "DataVault Analytics", "type": "Data analytics", "tier": 2, "overall": "B+", "scores": ["hi", "hi", "md", "md", "hi", "md"], "remediation_velocity_pct": 88 },
            { "id": "SW", "name": "Sentinel Workforce", "type": "HR SaaS platform", "tier": 2, "overall": "C+", "scores": ["md", "hi", "lo", "md", "md", "md"], "remediation_velocity_pct": 55 },
            { "id": "QL", "name": "QuantumLeap AI", "type": "ML model provider", "tier": 2, "overall": "B", "scores": ["md", "hi", "hi", "md", "hi", "md"], "remediation_velocity_pct": 72 },
            { "id": "FR", "name": "FortressReach", "type": "Managed SOC", "tier": 3, "overall": "A-", "scores": ["hi", "hi", "hi", "hi", "hi", "md"], "remediation_velocity_pct": 95 },
        ]
    }

@router.get("/threats")
async def get_threat_landscape(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Returns active intelligence mapped to the supply chain demonstrating downstream risk.
    """
    return {
        "threats": [
            {
                "id": "T1",
                "title": "Credential stuffing campaign targeting payment processors",
                "severity_tag": "Active threat",
                "severity_color": "var(--red)",
                "severity_bg": "var(--red-s)",
                "description_strong": "Supply chain impact:",
                "description": "CoreAxis's API authentication matches the attack pattern in this NCSC advisory exactly. Their missing MFA on service accounts means a successful credential stuff at CoreAxis could give an attacker access to YOUR customer payment data within minutes...",
                "exposed_suppliers": [
                    { "name": "CoreAxis", "exposure": "direct exposure", "level": "hi" },
                    { "name": "FortressReach", "exposure": "monitoring for you", "level": "lo" }
                ],
                "tags": ["MITRE T1110.004", "NCSC advisory", "2 days ago", "Payment processors"]
            },
            {
                "id": "T2",
                "title": "Critical vulnerability in widely used cloud infrastructure component",
                "severity_tag": "Verify exposure",
                "severity_color": "var(--amber)",
                "severity_bg": "var(--amber-s)",
                "description_strong": "Supply chain impact:",
                "description": "Affects the container orchestration layer used by NorthPoint Cloud. If unpatched, an attacker could escape container isolation and access other tenants' data - including yours. NorthPoint's 2 unpatched edge nodes from your vulnerability tracker may be related.",
                "exposed_suppliers": [
                    { "name": "NorthPoint", "exposure": "likely exposed", "level": "hi" },
                    { "name": "Sentinel", "exposure": "verify container setup", "level": "md" }
                ],
                "tags": ["CVE-2026-XXXX", "CVSS 9.1", "Yesterday", "Cloud infrastructure"]
            },
            {
                "id": "T3",
                "title": "Adversarial attacks on third-party ML models in financial services",
                "severity_tag": "ATLAS",
                "severity_color": "var(--purple-t)",
                "severity_bg": "var(--purple-s)",
                "description_strong": "Supply chain impact:",
                "description": "MITRE ATLAS AML.T0051 describes attacks on exactly the type of models QuantumLeap provides - fraud detection and risk scoring. If an adversary poisons QuantumLeap's training data, your fraud detection degrades silently.",
                "exposed_suppliers": [
                    { "name": "QuantumLeap", "exposure": "direct relevance", "level": "hi" }
                ],
                "tags": ["MITRE ATLAS AML.T0051", "MITRE ATLAS AML.T0043", "Emerging", "Financial ML"]
            }
        ]
    }

@router.get("/governance")
async def get_governance_posture(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Returns third-party governance posture.
    """
    return {
        "narratives": [
            {
                "id": "N1",
                "title": "FCA Operational Resilience Submissions",
                "status_text": "Due in 18 days",
                "status_color": "text-semantic-warning",
                "threads": [
                    { "time": "Q3 2025", "title": "Initial supplier mapping completed.", "text": "Identified 3 Tier-1 suppliers handling critical customer payment rails governed by FCA operational resilience mandates.", "state": "past" },
                    { "time": "14 Feb 2026", "title": "Supplier assessments distributed.", "text": "CoreAxis Payments, NorthPoint Cloud, and DataVault Analytics requested to provide updated SOC 2 Type II reports and pentest artifacts.", "state": "past" },
                    { "time": "02 Mar 2026", "title": "Evidence package returned with critical gap.", "text": "CoreAxis Pentest ID 4402 reveals systematic MFA bypass on admin interfaces affecting our data silos.", "state": "past" },
                    { "time": "Present", "title": "Draft FCA Evidence Package.", "text": "The regulator requires proof of active risk management. We must package the CoreAxis finding alongside our contractual escalation as evidence of our continuous monitoring procedures.", "state": "now", "artifacts": ["CoreAxis SLA agreement (Attached)", "Pentest ID 4402 Excerpt (Attached)", "Escalation correspondence (Pending)"] },
                    { "time": "01 Apr 2026", "title": "Final Submission.", "text": "Delivery to the Risk Committee for board-level sign-off prior to regulator transmission.", "state": "fut" }
                ]
            },
            {
                "id": "N2",
                "title": "EU AI Act — Supplier Compliance",
                "status_text": "Monitoring",
                "status_color": "text-text-tertiary",
                "threads": [
                    { "time": "Last Quarter", "title": "QuantumLeap AI onboarded.", "text": "Designated as a High-Risk system under Annex III of the EU AI Act based on its integration with our hiring platform.", "state": "past" },
                    { "time": "Present", "title": "Establish Deployer Obligations.", "text": "As the deployer of the high-risk system, we must ensure QuantumLeap AI completes their conformity assessment before production go-live.", "state": "now", "action": "Request Conformity Declaration" }
                ]
            }
        ]
    }

@router.get("/command")
async def get_command_overview(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Returns the daily cockpit (cognitive load, active risk outcomes, momentum).
    """
    return {
        "greeting_name": current_user.full_name.split()[0] if current_user.full_name else "Matanda",
        "sub_headline": "You're tracking 6 suppliers across your supply chain. Two carry critical risk that needs action this week — one has a regulatory dimension. Your cognitive load is moderate.",
        "cognitive_load": {
            "level": "moderate",
            "score": "3/5",
            "description": "3 active risk threads across 3 suppliers. One is time-critical (regulatory)."
        },
        "alerts": [
            { "type": "grn", "text": "No active supply chain incidents" },
            { "type": "rd", "text": "CoreAxis: FCA scrutiny in 18 days" },
            { "type": "amb", "text": "NorthPoint contract renewal in 30 days" }
        ],
        "resolved_event": "DataVault Analytics — annual security assessment completed. No critical findings. Posture confirmed at B+.",
        "momentum": {
            "trend": "Strong progress",
            "pct": 68,
            "stats": [
                { "value": "19", "label": "Supplier vulns fixed", "color": "var(--green)" },
                { "value": "3", "label": "Active risk outcomes", "color": "var(--blue)" },
                { "value": "1", "label": "Clean assessments", "color": "var(--green)" },
                { "value": "C+", "label": "Avg posture (was C)", "color": "var(--green)" }
            ]
        },
        "active_outcomes": [
            {
                "id": "o1",
                "importance": "critical",
                "supplier": "CoreAxis Payments · Tier-1 · Payment processing",
                "supplier_dot_color": "bg-semantic-critical",
                "title": "Remediate IAM bypass vulnerability before FCA review",
                "tag_text": "18 Days left",
                "tag_bg": "var(--semantic-critical-soft)",
                "tag_color": "var(--semantic-critical)",
                "why": "CoreAxis processes 85% of our customer transactions. A breach here triggers immediate FCA notification requirements and halts our primary revenue flow. Their recent pentest revealed systematic MFA bypass on admin interfaces.",
                "progress_pct": 35,
                "progress_color": "var(--blue)",
                "meta": [
                    { "icon": "MessageSquare", "text": "Last contact: 2 days ago" },
                    { "icon": "AlertTriangle", "text": "High concentration risk" }
                ],
                "steps": [
                    { "status": "done", "title": "Issue formal remediation request", "desc": "Sent via vendor portal citing Pentest ID 4402." },
                    { "status": "active", "number": "2", "title": "Enforce SLA deadline", "desc": "CoreAxis has stalled for 14 days claiming resource constraints.", "why_strong": "Contractual leverage:", "why": "Schedule 4, Section 2b mandates 10-day remediation for critical findings. Escalate to their CISO threatening payment withholding.", "actions": ["Draft Escalation", "View Contract"] },
                    { "status": "pending", "number": "3", "title": "Verify implementation via re-test", "desc": "Requires independent validation before closing." }
                ]
            },
            {
                "id": "o2",
                "importance": "spotlight",
                "supplier": "All Tier-1 Suppliers",
                "supplier_dot_color": "bg-text-dim",
                "title": "Ensure EU AI Act compliance coverage",
                "tag_text": "Planning",
                "tag_bg": "var(--accent-blue-soft)",
                "tag_color": "var(--accent-blue)",
                "why": "The organisation uses supplier AI models to process client data. Under the EU AI Act, we are classified as 'Deployers' and carry liability if our suppliers have not fulfilled 'Provider' requirements.",
                "progress_pct": 60,
                "progress_color": "var(--blue)",
                "meta": [],
                "steps": []
            }
        ]
    }
