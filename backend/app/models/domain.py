import uuid
from datetime import datetime
from typing import Optional, Any
from sqlalchemy import Float, Integer, String, Boolean, ForeignKey, Text, Enum as SQLEnum, Index, func, JSON
from sqlalchemy.types import Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import event, text
from app.models.base import BaseModel
import enum

class ThreatSophistication(str, enum.Enum):
    nation_state = "nation_state"
    organized_crime = "organized_crime"
    advanced = "advanced"
    intermediate = "intermediate"
    basic = "basic"

class ServiceTier(str, enum.Enum):
    basic = "basic"
    professional = "professional"
    enterprise = "enterprise"
    elite = "elite"

class IndicatorType(str, enum.Enum):
    ip = "ip"
    domain = "domain"
    url = "url"
    hash_md5 = "hash_md5"
    hash_sha1 = "hash_sha1"
    hash_sha256 = "hash_sha256"
    email = "email"
    cve = "cve"
    mutex = "mutex"
    registry_key = "registry_key"
    user_agent = "user_agent"

class Severity(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"
    informational = "informational"

class FindingStatus(str, enum.Enum):
    new = "new"
    triaged = "triaged"
    in_progress = "in_progress"
    resolved = "resolved"
    accepted = "accepted"
    false_positive = "false_positive"

class FindingType(str, enum.Enum):
    vulnerability = "vulnerability"
    misconfiguration = "misconfiguration"
    threat_indicator = "threat_indicator"
    credential_exposure = "credential_exposure"
    access_sale = "access_sale"
    data_leak = "data_leak"
    control_gap = "control_gap"
    compliance_gap = "compliance_gap"
    supply_chain_risk = "supply_chain_risk"
    osint_exposure = "osint_exposure"
    dark_web_mention = "dark_web_mention"
    correlation_result = "correlation_result"

class WorkflowName(str, enum.Enum):
    supply_chain = "supply_chain"
    infrastructure = "infrastructure"
    vulnerability = "vulnerability"
    threat = "threat"
    osint = "osint"
    dark_web = "dark_web"
    controls = "controls"
    gap_analysis = "gap_analysis"
    compliance = "compliance"
    correlation_engine = "correlation_engine"

class AssetType(str, enum.Enum):
    server = "server"
    endpoint = "endpoint"
    container = "container"
    cloud_resource = "cloud_resource"
    application = "application"
    network_segment = "network_segment"
    saas_app = "saas_app"
    database = "database"
    identity = "identity"
    vendor = "vendor"

class Environment(str, enum.Enum):
    production = "production"
    staging = "staging"
    development = "development"
    shared_services = "shared_services"

class ChatRole(str, enum.Enum):
    user = "user"
    assistant = "assistant"

class Organization(BaseModel):
    __tablename__ = "organizations"
    name: Mapped[str] = mapped_column(String(255))
    industry: Mapped[str] = mapped_column(String(255), nullable=True)
    size: Mapped[str] = mapped_column(String(50), nullable=True)
    gcp_project_id: Mapped[str] = mapped_column(String(255), nullable=True)
    subscription_tier: Mapped[ServiceTier] = mapped_column(SQLEnum(ServiceTier), default=ServiceTier.professional)

class ServiceTierConfig(BaseModel):
    __tablename__ = "service_tier_configs"
    tier: Mapped[ServiceTier] = mapped_column(SQLEnum(ServiceTier), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(50))
    description: Mapped[str] = mapped_column(Text)
    monthly_price: Mapped[int] = mapped_column(Integer)
    price_per_user: Mapped[int] = mapped_column(Integer, default=0)
    max_users: Mapped[str] = mapped_column(String(50))
    features: Mapped[dict] = mapped_column(JSON)
    is_popular: Mapped[bool] = mapped_column(Boolean, default=False)
    color_hex: Mapped[str] = mapped_column(String(20))

class OrgAIBudget(BaseModel):
    __tablename__ = "org_ai_budgets"
    org_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("organizations.id"))
    daily_limit_usd: Mapped[float] = mapped_column(Float, default=10.00)
    monthly_limit_usd: Mapped[float] = mapped_column(Float, default=200.00)
    auto_downgrade_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    active_provider: Mapped[str] = mapped_column(String(50), default="vertex_ai")
    alert_webhook_url: Mapped[str] = mapped_column(String(2048), nullable=True)

class User(BaseModel):
    __tablename__ = "users"
    org_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("organizations.id"))
    firebase_uid: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(50), default="viewer") # admin, editor, viewer
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    receives_weekly_digest: Mapped[bool] = mapped_column(Boolean, default=True)
    last_login: Mapped[datetime] = mapped_column(nullable=True)


class Asset(BaseModel):
    __tablename__ = "assets"
    org_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("organizations.id"))
    asset_type: Mapped[AssetType] = mapped_column(SQLEnum(AssetType))
    name: Mapped[str] = mapped_column(String(255))
    identifier: Mapped[str] = mapped_column(String(512), unique=True)
    environment: Mapped[Environment] = mapped_column(SQLEnum(Environment))
    business_criticality: Mapped[str] = mapped_column(String(50))
    data_classification: Mapped[str] = mapped_column(String(50))
    owner: Mapped[str] = mapped_column(String(255), nullable=True)
    business_unit: Mapped[str] = mapped_column(String(255), nullable=True)
    regulatory_scope: Mapped[dict] = mapped_column(JSON, nullable=True)
    cloud_provider: Mapped[str] = mapped_column(String(50), nullable=True)
    cloud_region: Mapped[str] = mapped_column(String(50), nullable=True)
    cloud_account_id: Mapped[str] = mapped_column(String(255), nullable=True)
    metadata_data: Mapped[dict] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active")
    first_seen: Mapped[datetime] = mapped_column(nullable=True)
    last_seen: Mapped[datetime] = mapped_column(nullable=True)

    __table_args__ = (
        Index("ix_assets_composite", "org_id", "asset_type", "environment"),
        Index("ix_assets_identifier", "identifier")
    )

class Vulnerability(BaseModel):
    __tablename__ = "vulnerabilities"
    org_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("organizations.id"))
    cve_id: Mapped[str] = mapped_column(String(50), nullable=True)
    title: Mapped[str] = mapped_column(String(512))
    description: Mapped[str] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String(100))
    severity_source_score: Mapped[float] = mapped_column(Float, nullable=True)
    cvss_base_score: Mapped[float] = mapped_column(Float, nullable=True)
    epss_score: Mapped[float] = mapped_column(Float, nullable=True)
    exploit_availability: Mapped[str] = mapped_column(String(50))
    kev_listed: Mapped[bool] = mapped_column(Boolean, default=False)
    affected_asset_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("assets.id"))
    status: Mapped[FindingStatus] = mapped_column(SQLEnum(FindingStatus))
    sla_deadline: Mapped[datetime] = mapped_column(nullable=True)
    resolved_at: Mapped[datetime] = mapped_column(nullable=True)
    remediation_owner: Mapped[str] = mapped_column(String(255), nullable=True)
    scanner_finding_id: Mapped[str] = mapped_column(String(255), nullable=True)
    raw_data: Mapped[dict] = mapped_column(JSON, nullable=True)
    first_detected: Mapped[datetime] = mapped_column(nullable=True)
    last_detected: Mapped[datetime] = mapped_column(nullable=True)

    __table_args__ = (
        Index("ix_vuln_composite", "org_id", "status", "cvss_base_score"),
        Index("ix_vuln_cve", "cve_id", "epss_score")
    )

class ThreatActor(BaseModel):
    __tablename__ = "threat_actors"
    org_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("organizations.id"))
    name: Mapped[str] = mapped_column(String(255))
    aliases: Mapped[dict] = mapped_column(JSON, nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    version: Mapped[str] = mapped_column(String(50), nullable=True)
    motivation: Mapped[str] = mapped_column(String(100), nullable=True)
    sophistication: Mapped[ThreatSophistication] = mapped_column(SQLEnum(ThreatSophistication))
    target_industries: Mapped[dict] = mapped_column(JSON, nullable=True)
    target_regions: Mapped[dict] = mapped_column(JSON, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    first_seen: Mapped[datetime] = mapped_column(nullable=True)
    last_updated: Mapped[datetime] = mapped_column(nullable=True)
    source: Mapped[str] = mapped_column(String(100), nullable=True)
    external_references: Mapped[dict] = mapped_column(JSON, nullable=True)

class ThreatIntelIndicator(BaseModel):
    __tablename__ = "threat_intel_indicators"
    org_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("organizations.id"))
    indicator_type: Mapped[IndicatorType] = mapped_column(SQLEnum(IndicatorType))
    value: Mapped[str] = mapped_column(String(1024))
    threat_actor_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("threat_actors.id"), nullable=True)
    confidence: Mapped[int] = mapped_column(Integer, default=50) # 0-100
    severity: Mapped[Severity] = mapped_column(SQLEnum(Severity))
    tlp_marking: Mapped[str] = mapped_column(String(50))
    valid_from: Mapped[datetime] = mapped_column(nullable=True)
    valid_until: Mapped[datetime] = mapped_column(nullable=True)
    source: Mapped[str] = mapped_column(String(100), nullable=True)
    tags: Mapped[dict] = mapped_column(JSON, nullable=True)
    raw_data: Mapped[dict] = mapped_column(JSON, nullable=True)

    __table_args__ = (
        Index("ix_tii_composite", "indicator_type", "value"),
    )

class Vendor(BaseModel):
    __tablename__ = "vendors"
    org_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("organizations.id"))
    name: Mapped[str] = mapped_column(String(255))
    vendor_type: Mapped[str] = mapped_column(String(100))
    tier: Mapped[str] = mapped_column(String(50))
    data_access_level: Mapped[str] = mapped_column(String(100))
    risk_score: Mapped[int] = mapped_column(Integer, default=50)
    assessment_status: Mapped[str] = mapped_column(String(100))
    last_assessment_date: Mapped[datetime] = mapped_column(nullable=True)
    next_assessment_due: Mapped[datetime] = mapped_column(nullable=True)
    contract_expiry: Mapped[datetime] = mapped_column(nullable=True)
    primary_contact: Mapped[str] = mapped_column(String(255), nullable=True)
    metadata_data: Mapped[dict] = mapped_column(JSON, nullable=True)
    tech_stack: Mapped[dict] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="Warning")

class SecurityControl(BaseModel):
    __tablename__ = "security_controls"
    org_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("organizations.id"))
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, nullable=True)
    control_type: Mapped[str] = mapped_column(String(100))
    category: Mapped[str] = mapped_column(String(100))
    tool_vendor: Mapped[str] = mapped_column(String(100), nullable=True)
    tool_name: Mapped[str] = mapped_column(String(100), nullable=True)
    deployment_coverage_pct: Mapped[float] = mapped_column(Float, default=0.0)
    effectiveness_score: Mapped[float] = mapped_column(Float, default=0.0)
    last_validated: Mapped[datetime] = mapped_column(nullable=True)
    status: Mapped[str] = mapped_column(String(50))
    mitre_techniques_covered: Mapped[dict] = mapped_column(JSON, nullable=True)
    configuration_baseline: Mapped[dict] = mapped_column(JSON, nullable=True)

class ComplianceFramework(BaseModel):
    __tablename__ = "compliance_frameworks"
    org_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("organizations.id"))
    framework_name: Mapped[str] = mapped_column(String(255))
    version: Mapped[str] = mapped_column(String(50), nullable=True)
    applicable: Mapped[bool] = mapped_column(Boolean, default=True)
    scope_description: Mapped[str] = mapped_column(Text, nullable=True)
    overall_compliance_pct: Mapped[float] = mapped_column(Float, default=0.0)
    last_assessed: Mapped[datetime] = mapped_column(nullable=True)
    next_assessment_due: Mapped[datetime] = mapped_column(nullable=True)

class ComplianceRequirement(BaseModel):
    __tablename__ = "compliance_requirements"
    framework_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("compliance_frameworks.id"))
    requirement_id_code: Mapped[str] = mapped_column(String(100))
    title: Mapped[str] = mapped_column(String(512))
    description: Mapped[str] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50))
    evidence_status: Mapped[str] = mapped_column(String(50))
    mapped_control_ids: Mapped[dict] = mapped_column(JSON, nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    last_reviewed: Mapped[datetime] = mapped_column(nullable=True)

class Finding(BaseModel):
    __tablename__ = "findings"
    org_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("organizations.id"))
    finding_type: Mapped[FindingType] = mapped_column(SQLEnum(FindingType))
    title: Mapped[str] = mapped_column(String(512))
    description: Mapped[str] = mapped_column(Text, nullable=True)
    severity: Mapped[Severity] = mapped_column(SQLEnum(Severity))
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    source_workflow: Mapped[WorkflowName] = mapped_column(SQLEnum(WorkflowName))
    source_finding_id: Mapped[str] = mapped_column(String(255), nullable=True)
    affected_asset_ids: Mapped[dict] = mapped_column(JSON, nullable=True)
    affected_vendor_ids: Mapped[dict] = mapped_column(JSON, nullable=True)
    related_threat_actor_ids: Mapped[dict] = mapped_column(JSON, nullable=True)
    related_cve_ids: Mapped[dict] = mapped_column(JSON, nullable=True)
    related_control_ids: Mapped[dict] = mapped_column(JSON, nullable=True)
    mitre_techniques: Mapped[dict] = mapped_column(JSON, nullable=True)
    status: Mapped[FindingStatus] = mapped_column(SQLEnum(FindingStatus))
    assigned_to: Mapped[str] = mapped_column(String(255), nullable=True)
    remediation_notes: Mapped[str] = mapped_column(Text, nullable=True)
    correlated_finding_ids: Mapped[dict] = mapped_column(JSON, nullable=True)
    correlation_explanation: Mapped[str] = mapped_column(Text, nullable=True)
    evidence: Mapped[dict] = mapped_column(JSON, nullable=True)
    raw_data: Mapped[dict] = mapped_column(JSON, nullable=True)
    detected_at: Mapped[datetime] = mapped_column(nullable=True)
    triaged_at: Mapped[datetime] = mapped_column(nullable=True)
    resolved_at: Mapped[datetime] = mapped_column(nullable=True)
    sla_deadline: Mapped[datetime] = mapped_column(nullable=True)

    __table_args__ = (
        Index("ix_finding_composite", "org_id", "source_workflow", "severity", "status"),
        Index("ix_finding_risk_score", "risk_score", "detected_at")
    )

class CorrelationRule(BaseModel):
    __tablename__ = "correlation_rules"
    org_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("organizations.id"))
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, nullable=True)
    rule_type: Mapped[str] = mapped_column(String(50))
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    severity_output: Mapped[Severity] = mapped_column(SQLEnum(Severity))
    datasets_combined: Mapped[dict] = mapped_column(JSON, nullable=True)
    rule_logic: Mapped[dict] = mapped_column(JSON, nullable=True)
    graph_query: Mapped[str] = mapped_column(Text, nullable=True)
    confidence_threshold: Mapped[float] = mapped_column(Float, default=0.8)
    last_triggered: Mapped[datetime] = mapped_column(nullable=True)
    trigger_count: Mapped[int] = mapped_column(Integer, default=0)
    false_positive_count: Mapped[int] = mapped_column(Integer, default=0)

class ChatSession(BaseModel):
    __tablename__ = "chat_sessions"
    org_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("organizations.id"))
    user_id: Mapped[str] = mapped_column(String(255))
    title: Mapped[str] = mapped_column(String(255), nullable=True)

class ChatMessage(BaseModel):
    __tablename__ = "chat_messages"
    session_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("chat_sessions.id"))
    role: Mapped[ChatRole] = mapped_column(SQLEnum(ChatRole))
    content: Mapped[str] = mapped_column(Text)
    query_tier: Mapped[str] = mapped_column(String(50))
    model_used: Mapped[str] = mapped_column(String(100), nullable=True)
    cost_usd: Mapped[float] = mapped_column(Float, default=0.0)
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=True)
    sql_executed: Mapped[str] = mapped_column(Text, nullable=True)
    routing_reason: Mapped[str] = mapped_column(Text, nullable=True)

    __table_args__ = (
        Index("ix_chat_message_session", "session_id", "created_at"),
    )

class AuditLog(BaseModel):
    __tablename__ = "audit_logs"
    org_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("organizations.id"))
    actor: Mapped[str] = mapped_column(String(255))
    action: Mapped[str] = mapped_column(String(100))
    entity_type: Mapped[str] = mapped_column(String(100))
    entity_id: Mapped[str] = mapped_column(String(255))
    changes: Mapped[dict] = mapped_column(JSON, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(server_default=func.now())

class ThreatFeedSubscription(BaseModel):
    __tablename__ = "threat_feed_subscriptions"
    org_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("organizations.id"))
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    provider: Mapped[str] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    last_synced: Mapped[datetime] = mapped_column(nullable=True)

class AIQueryLog(BaseModel):
    __tablename__ = "ai_query_logs"
    org_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("organizations.id"))
    timestamp: Mapped[datetime] = mapped_column(server_default=func.now())
    workflow: Mapped[str] = mapped_column(String(100))
    query_tier: Mapped[str] = mapped_column(String(50))
    provider_used: Mapped[str] = mapped_column(String(100))
    model_used: Mapped[str] = mapped_column(String(100))
    input_tokens: Mapped[int] = mapped_column(Integer, default=0)
    output_tokens: Mapped[int] = mapped_column(Integer, default=0)
    cost_usd: Mapped[float] = mapped_column(Float, default=0.0)
    latency_ms: Mapped[int] = mapped_column(Integer, default=0)
    was_downgraded: Mapped[bool] = mapped_column(Boolean, default=False)
    downgrade_reason: Mapped[str] = mapped_column(String(255), nullable=True)
    user_query_hash: Mapped[str] = mapped_column(String(255), nullable=True)

    __table_args__ = (
        Index("ix_ai_query_logs_composite", "org_id", "workflow", "timestamp"),
    )

class InternalBugLog(BaseModel):
    __tablename__ = "internal_bug_logs"
    org_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("organizations.id"), nullable=True)
    user_id: Mapped[str] = mapped_column(String(255), nullable=True)
    error_code: Mapped[str] = mapped_column(String(100), nullable=True)
    error_message: Mapped[str] = mapped_column(Text)
    stack_trace: Mapped[str] = mapped_column(Text, nullable=True)
    url: Mapped[str] = mapped_column(String(2048), nullable=True)
    route: Mapped[str] = mapped_column(String(512), nullable=True)
    frontend_version: Mapped[str] = mapped_column(String(50), nullable=True)
    additional_context: Mapped[dict] = mapped_column(JSON, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(server_default=func.now())
    status: Mapped[str] = mapped_column(String(50), default="open") # open, investigated, fixed

    __table_args__ = (
        Index("ix_internal_bug_logs_status", "status", "timestamp"),
    )

class RiskRegister(BaseModel):
    __tablename__ = "risk_register"
    org_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("organizations.id"))
    finding_id: Mapped[str] = mapped_column(String(255), nullable=True) # Optional link back to the source vulnerability
    title: Mapped[str] = mapped_column(String(512))
    description: Mapped[str] = mapped_column(Text, nullable=True)
    risk_level: Mapped[Severity] = mapped_column(SQLEnum(Severity)) # Leveraging existing low/med/high
    risk_categories: Mapped[dict] = mapped_column(JSON) # e.g. ["Operational", "Security", "Reputational"]
    owner: Mapped[str] = mapped_column(String(255), nullable=True)
    action_plan: Mapped[str] = mapped_column(Text, nullable=True)
    attachment_url: Mapped[str] = mapped_column(String(2048), nullable=True)
    date_entered: Mapped[datetime] = mapped_column(server_default=func.now())
    expiration_date: Mapped[datetime] = mapped_column(nullable=True)
    source: Mapped[str] = mapped_column(String(255), nullable=True)
    
    __table_args__ = (
        Index("ix_risk_register_composite", "org_id", "risk_level", "date_entered"),
    )

class WeeklySecurityBrief(BaseModel):
    __tablename__ = "weekly_security_briefs"
    org_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("organizations.id"))
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"))
    role_targeted: Mapped[str] = mapped_column(String(50))
    markdown_content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    __table_args__ = (
        Index("ix_security_briefs_composite", "org_id", "user_id", "created_at"),
    )

def apply_rls_ddl(target, connection, **kw):
    """
    SQLAlchemy metadata hook that executes immediately after database schema creation.
    It loops through tables containing an 'org_id' column and enforces physical PostgreSQL
    Row-Level Security rules blocking any queries lacking proper ContextVars constraints.
    """
    if connection.dialect.name != "postgresql":
        return
        
    tables_to_protect = [
        "users", "assets", "vulnerabilities", "threat_actors",
        "threat_intel_indicators", "vendors", "security_controls",
        "compliance_frameworks", "findings", "correlation_rules",
        "chat_sessions", "audit_logs", "threat_feed_subscriptions",
        "ai_query_logs", "internal_bug_logs", "risk_register", "org_ai_budgets",
        "weekly_security_briefs"
    ]
    
    for table in tables_to_protect:
        try:
            connection.execute(text(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;"))
            connection.execute(text(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY;"))
            
            # Idempotency safety buffer
            connection.execute(text(f"DROP POLICY IF EXISTS tenant_isolation_{table} ON {table};"))
            
            # Restrictive policy: blocks access unless rls.org_id exists AND physically matches
            connection.execute(text(f"""
                CREATE POLICY tenant_isolation_{table} ON {table}
                AS RESTRICTIVE FOR ALL TO PUBLIC
                USING (
                    current_setting('rls.org_id', true) IS NOT NULL 
                    AND current_setting('rls.org_id', true) != ''
                    AND org_id = current_setting('rls.org_id', true)::uuid
                );
            """))
        except Exception as e:
            print(f"Failed configuring Tenant Isolation Row-Level Security on {table}: {e}")

event.listen(BaseModel.metadata, "after_create", apply_rls_ddl)

