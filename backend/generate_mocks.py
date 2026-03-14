import random
from datetime import datetime, timedelta

TITLES = [
    "Unpatched Server", "Exposed Storage Bucket containing PII", "Hardcoded Credentials in Source Code", 
    "Default Passwords in Use", "Open SSH Port to Public Internet", "Missing MFA for Admin Account", 
    "Outdated Apache Struts", "Suspicious Login from Unknown Geolocation", "Unencrypted S3 Bucket", 
    "Unused IAM Roles with High Privileges", "Malicious IP Connection Detected", "Log4j Vulnerability Found",
    "Missing WAF Rules", "Unrotated Access Keys", "Cross-Site Scripting (XSS) on Login Page",
    "SQL Injection in Search Feature", "Privilege Escalation Exploit", "Unsecured Kubernetes API",
    "RDP Brute Force Attempt", "Data Exfiltration Anomaly", "Insecure Direct Object Reference",
    "Third-party Library with CVE", "Disabled Anti-Virus on Endpoint", "Root Account Used without Justification"
]
STATUSES = ["new", "triaged", "in_progress", "resolved", "accepted", "false_positive"]
SEVERITIES = ["critical", "high", "medium", "low", "informational"]
TYPES = ["vulnerability", "misconfiguration", "threat_indicator", "credential_exposure", "access_sale", "compliance_gap", "control_gap"]
WORKFLOWS = ["supply_chain", "infrastructure", "vulnerability", "threat", "osint", "compliance"]

out = []
for i in range(25):
    title = random.choice(TITLES)
    status = random.choice(STATUSES)
    severity = random.choices(SEVERITIES, weights=[15, 30, 35, 15, 5])[0]
    f_type = random.choice(TYPES)
    wf = random.choice(WORKFLOWS)
    
    score_base = {"critical": 85, "high": 70, "medium": 40, "low": 20, "informational": 5}[severity]
    score = score_base + random.uniform(0, 15)
    score = min(100.0, round(score, 1))

    days_ago = random.randint(0, 30)
    
    code = f"""        mock_{i} = FindingCreate(
            org_id=org_uuid,
            title="{title} {i}",
            finding_type=FindingType.{f_type},
            severity=Severity.{severity},
            risk_score={score},
            source_workflow=WorkflowName.{wf},
            status=FindingStatus.{status},
            detected_at=datetime.utcnow() - timedelta(days={days_ago}, hours={random.randint(1,23)})
        )
        await crud_finding.create(db=db, obj_in=mock_{i})"""
    out.append(code)

with open("mock_code.txt", "w") as f:
    f.write("\n".join(out))
