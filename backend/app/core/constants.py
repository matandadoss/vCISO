SLA_THRESHOLDS = {
    "critical": 24,
    "high": 168,
    "medium": 720,
    "low": 2160
}

WORKFLOW_NAMES = [
    "supply_chain",
    "infrastructure",
    "vulnerability",
    "threat",
    "osint",
    "dark_web",
    "controls",
    "gap_analysis",
    "compliance",
    "correlation_engine"
]

MITRE_TACTICS = [
    "Reconnaissance",
    "Resource Development",
    "Initial Access",
    "Execution",
    "Persistence",
    "Privilege Escalation",
    "Defense Evasion",
    "Credential Access",
    "Discovery",
    "Lateral Movement",
    "Collection",
    "Command and Control",
    "Exfiltration",
    "Impact"
]

RISK_BUCKETS = {
    "critical": {"min": 85, "max": 100},
    "high": {"min": 70, "max": 84},
    "medium": {"min": 40, "max": 69},
    "low": {"min": 0, "max": 39}
}

DATA_SENSITIVITY_WEIGHTS = {
    "restricted": 1.0,
    "confidential": 0.8,
    "internal": 0.4,
    "public": 0.1
}

ENVIRONMENT_WEIGHTS = {
    "production": 1.0,
    "shared_services": 0.8,
    "staging": 0.3,
    "development": 0.1
}

AI_TIER_DESCRIPTIONS = {
    "search_only": "Database lookup — no AI cost",
    "fast_cheap": "Fast AI summary — ~$0.001",
    "balanced": "Standard AI analysis — ~$0.02",
    "deep": "Deep AI analysis — ~$0.10-0.50"
}
