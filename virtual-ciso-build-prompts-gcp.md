# Virtual CISO Platform — GCP Build Prompts (with AI Layer Toggle & Intelligent Routing)

## How to Use This Document

These prompts replace a traditional technical specification. Execute them **in order** — each prompt builds on the output of the previous ones. Feed each prompt to your AI coding assistant in a fresh or continuing session.

The build is organized into 9 phases with 50 prompts total. **Phase 0 (AI Foundation) is new and must be completed before Phase 3.** Phases 1-3 are foundational and must be sequential. Phases 4-6 can be partially parallelized. Phases 7-9 are integration and polish.

### Why Phase 0 Comes First

The AI Provider Abstraction Layer and Query Router are used throughout the application. By building them first, every subsequent prompt that needs AI analysis can reference them. This also prevents cost overruns — the router ensures every AI call uses the cheapest model sufficient for the task.

---

## GCP Service Reference

| Role | GCP Service | AWS Equivalent |
|------|-------------|----------------|
| Container compute | Cloud Run | ECS Fargate / App Runner |
| Relational DB | Cloud SQL (PostgreSQL 16) | RDS PostgreSQL |
| Graph DB | Neo4j Aura (GCP Marketplace) | — |
| Cache/Queue | Memorystore (Redis) | ElastiCache |
| Message bus | Cloud Pub/Sub | SQS + SNS |
| Data warehouse | BigQuery | Redshift / Athena |
| AI/ML — deep analysis | Vertex AI Gemini 2.5 Pro | Amazon Bedrock (Claude 3.5 Sonnet) |
| AI/ML — fast/cheap | Vertex AI Gemini 2.0 Flash | Amazon Bedrock (Nova Lite) |
| AI/ML — direct | Anthropic API (Claude 3.7 Sonnet / Haiku 3.5) | Anthropic API direct |
| Object storage | Cloud Storage (GCS) | S3 |
| Secrets | Secret Manager | Secrets Manager |
| CI/CD | Cloud Build | CodeBuild + CodePipeline |
| Zero-trust access | Identity-Aware Proxy (IAP) | Cognito + ALB |
| Auth | Identity Platform | Cognito |
| SIEM | Chronicle | OpenSearch Security Analytics |
| CSPM | Security Command Center Premium | Security Hub + GuardDuty + Inspector |
| Monitoring | Cloud Monitoring + Cloud Logging + Cloud Trace | CloudWatch + X-Ray |
| IaC | Terraform + Cloud Deployment Manager | Terraform + CloudFormation |
| Cost tracking | Cloud Billing + BigQuery export | Cost Explorer + CUR |

---

## PHASE 0: AI FOUNDATION

*Build the AI abstraction layer before anything else. All AI calls in the application will go through these services. This is what enables the toggle and intelligent routing.*

---

### Prompt 0.1 — AI Provider Abstraction Layer

```
Create /app/core/ai_provider.py for the Virtual CISO platform.

This module provides a single, provider-agnostic interface for all AI calls in the application. The goal is to support multiple AI backends interchangeably and switch between them via environment configuration — without any business logic needing to know which provider is active.

**Supported Providers:**
1. Vertex AI — Gemini 2.5 Pro (`gemini-2.5-pro-preview`) and Gemini 2.0 Flash (`gemini-2.0-flash`)
2. Anthropic API (direct) — Claude 3.7 Sonnet (`claude-sonnet-4-5`) and Claude Haiku 3.5 (`claude-haiku-3-5-20251001`)
3. AWS Bedrock — Claude 3.5 Sonnet on Bedrock (`anthropic.claude-3-5-sonnet-20241022-v2:0`) and Amazon Nova Lite (`amazon.nova-lite-v1:0`)
4. OpenAI (optional/future) — GPT-4o and GPT-4o-mini

**Model Tiers (provider-agnostic):**
Map each provider's models to these four tiers:
- TIER_FAST_CHEAP: Sub-second, lowest cost — Flash / Haiku / Nova Lite / GPT-4o-mini
- TIER_BALANCED: Mid-speed, mid-cost — Gemini Pro (previous gen) / Sonnet 3 / Nova Pro
- TIER_DEEP: Full reasoning, higher cost — Gemini 2.5 Pro / Claude 3.7 Sonnet / GPT-4o
- TIER_SEARCH_ONLY: No LLM at all — returns None, signals caller to use DB only

**Create these classes:**

```python
from enum import Enum
from dataclasses import dataclass
from typing import Any, Optional
import os

class AIProvider(str, Enum):
    VERTEX_AI = "vertex_ai"
    ANTHROPIC_DIRECT = "anthropic_direct"
    AWS_BEDROCK = "aws_bedrock"
    OPENAI = "openai"

class ModelTier(str, Enum):
    SEARCH_ONLY = "search_only"   # No LLM — pure database query
    FAST_CHEAP = "fast_cheap"     # Gemini Flash / Haiku / Nova Lite
    BALANCED = "balanced"          # Gemini Pro / Sonnet / Nova Pro
    DEEP = "deep"                  # Gemini 2.5 Pro / Claude 3.7 / GPT-4o

@dataclass
class AIRequest:
    system_prompt: str
    user_prompt: str
    tier: ModelTier
    structured_output_schema: Optional[dict] = None  # JSON schema for structured output
    max_tokens: int = 4096
    temperature: float = 0.1
    metadata: dict = None  # For cost tracking: {"workflow": "correlation", "query_id": "..."}

@dataclass
class AIResponse:
    content: str
    structured_output: Optional[dict]
    provider_used: AIProvider
    model_used: str
    tier_used: ModelTier
    input_tokens: int
    output_tokens: int
    cost_usd: float
    latency_ms: int

class AIProviderClient:
    """
    Central client for all AI calls. Reads active provider from env var AI_PROVIDER.
    Falls back in order: configured provider → ANTHROPIC_DIRECT → VERTEX_AI.
    """

    # Pricing per 1M tokens (input/output) as of 2025
    PRICING = {
        AIProvider.VERTEX_AI: {
            "gemini-2.5-pro-preview": {"input": 1.25, "output": 10.00},
            "gemini-2.0-flash": {"input": 0.075, "output": 0.30},
        },
        AIProvider.ANTHROPIC_DIRECT: {
            "claude-sonnet-4-5": {"input": 3.00, "output": 15.00},
            "claude-haiku-3-5-20251001": {"input": 0.80, "output": 4.00},
        },
        AIProvider.AWS_BEDROCK: {
            "anthropic.claude-3-5-sonnet-20241022-v2:0": {"input": 3.00, "output": 15.00},
            "amazon.nova-lite-v1:0": {"input": 0.06, "output": 0.24},
        },
    }

    def __init__(self):
        self.active_provider = AIProvider(os.getenv("AI_PROVIDER", "anthropic_direct"))
        self._init_clients()

    def _init_clients(self):
        """Initialize only the configured provider's client. Lazy-load others."""
        # Vertex AI: uses google-cloud-aiplatform
        # Anthropic Direct: uses anthropic Python SDK
        # AWS Bedrock: uses boto3 bedrock-runtime
        ...

    def resolve_model(self, tier: ModelTier) -> tuple[AIProvider, str]:
        """Map a tier to a specific provider+model. Uses active_provider."""
        tier_map = {
            AIProvider.VERTEX_AI: {
                ModelTier.FAST_CHEAP: "gemini-2.0-flash",
                ModelTier.BALANCED: "gemini-1.5-pro",
                ModelTier.DEEP: "gemini-2.5-pro-preview",
            },
            AIProvider.ANTHROPIC_DIRECT: {
                ModelTier.FAST_CHEAP: "claude-haiku-3-5-20251001",
                ModelTier.BALANCED: "claude-sonnet-4-5",
                ModelTier.DEEP: "claude-sonnet-4-5",
            },
            AIProvider.AWS_BEDROCK: {
                ModelTier.FAST_CHEAP: "amazon.nova-lite-v1:0",
                ModelTier.BALANCED: "amazon.nova-pro-v1:0",
                ModelTier.DEEP: "anthropic.claude-3-5-sonnet-20241022-v2:0",
            },
        }
        return self.active_provider, tier_map[self.active_provider][tier]

    async def complete(self, request: AIRequest) -> Optional[AIResponse]:
        """
        Main entry point. Returns None if tier is SEARCH_ONLY.
        Handles structured output (JSON mode) for all providers.
        Records cost to BigQuery via CostTracker.
        """
        if request.tier == ModelTier.SEARCH_ONLY:
            return None

        provider, model = self.resolve_model(request.tier)
        start_ms = now_ms()

        # Dispatch to provider-specific implementation
        if provider == AIProvider.VERTEX_AI:
            raw = await self._complete_vertex(request, model)
        elif provider == AIProvider.ANTHROPIC_DIRECT:
            raw = await self._complete_anthropic(request, model)
        elif provider == AIProvider.AWS_BEDROCK:
            raw = await self._complete_bedrock(request, model)

        cost = self._calculate_cost(provider, model, raw.input_tokens, raw.output_tokens)

        return AIResponse(
            content=raw.content,
            structured_output=self._parse_structured(raw.content, request.structured_output_schema),
            provider_used=provider,
            model_used=model,
            tier_used=request.tier,
            input_tokens=raw.input_tokens,
            output_tokens=raw.output_tokens,
            cost_usd=cost,
            latency_ms=now_ms() - start_ms,
        )
```

**Implement provider-specific methods:**

`_complete_vertex(request, model)`:
- Use `google.generativeai` or `vertexai.generative_models.GenerativeModel`
- Project: from env `GCP_PROJECT_ID`, location: from env `GCP_REGION`
- For structured output: use `response_mime_type="application/json"` and `response_schema`
- Handle `google.api_core.exceptions.ResourceExhausted` with exponential backoff (3 retries)

`_complete_anthropic(request, model)`:
- Use `anthropic.AsyncAnthropic`
- API key from Secret Manager: `projects/{project}/secrets/anthropic-api-key/versions/latest`
- For structured output: use tool_use with a single tool matching the JSON schema
- Handle `anthropic.RateLimitError` with backoff

`_complete_bedrock(request, model)`:
- Use `boto3.client("bedrock-runtime", region_name=AWS_REGION)`
- For Claude on Bedrock: use same message format as Anthropic SDK
- For Nova: use `converse` API
- Handle `ThrottlingException` with backoff

**Also create:**

`/app/core/ai_provider_config.py` — A Pydantic settings model that reads:
- `AI_PROVIDER` — active provider (default: `anthropic_direct`)
- `VERTEX_PROJECT_ID`, `VERTEX_LOCATION`
- `ANTHROPIC_API_KEY` (or Secret Manager ref)
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (for Bedrock)
- `AI_FALLBACK_PROVIDER` — fallback if primary fails (default: `vertex_ai`)
- `AI_MAX_COST_PER_QUERY_USD` — hard cap per query (default: 0.50)

`/app/core/ai_health.py` — Health check endpoint that tests each configured provider with a 1-token ping and returns latency + status.

Store the singleton in `/app/core/dependencies.py` and inject via FastAPI's dependency injection: `ai_client: AIProviderClient = Depends(get_ai_client)`

Write unit tests in `/tests/core/test_ai_provider.py` mocking all three provider calls, verifying correct model selection per tier, and checking cost calculation accuracy.
```

---

### Prompt 0.2 — Query Classifier & Intelligent AI Router

```
Create /app/core/query_router.py for the Virtual CISO platform.

This module classifies every incoming AI request and routes it to the appropriate tier, ensuring we never use an expensive model for a task a cheap model (or a pure database query) can handle. This is the cost-control brain of the system.

**Four Routing Tiers:**

TIER 0 — SEARCH_ONLY (No AI cost)
- Simple lookups: "How many critical findings do I have?", "List open vulnerabilities for asset X", "What is my compliance score for PCI DSS?"
- Answer comes entirely from a parameterized SQL/BigQuery query
- Response time: <100ms
- Cost: $0.00

TIER 1 — FAST_CHEAP (~$0.0001-$0.001 per query)
- Summarization of a small result set: "Summarize my top 5 vulnerabilities"
- Short factual explanations: "What does EPSS score mean?"
- Status updates: "What changed in my risk posture this week?"
- Simple reformatting of data into human language
- Model: Gemini 2.0 Flash / Claude Haiku / Nova Lite

TIER 2 — BALANCED (~$0.005-$0.05 per query)
- Cross-workflow analysis: "Do any of my dark web alerts relate to my open vulnerabilities?"
- Control gap explanations: "Why am I failing PCI requirement CC6.1?"
- Vendor risk summaries: "Give me a risk briefing on my Tier 1 vendors"
- MITRE ATT&CK gap analysis for a specific threat actor
- Model: Gemini 1.5 Pro / Claude Sonnet / Nova Pro

TIER 3 — DEEP (~$0.05-$0.50 per query)
- Full correlation analysis for a critical finding
- Executive risk narrative generation (used for board reports)
- Novel pattern detection across all recent findings
- Remediation prioritization with business impact modeling
- "What is my biggest security risk right now and what should I do about it?"
- Model: Gemini 2.5 Pro / Claude 3.7 Sonnet / GPT-4o

**Create these classes:**

```python
from dataclasses import dataclass
from typing import Optional
import re

@dataclass
class QueryClassification:
    tier: ModelTier
    routing_reason: str
    estimated_cost_usd: float
    sql_query: Optional[str]           # Set for TIER 0 — the pre-built query to run
    context_needed: list[str]          # What data to pull from DB before calling AI
    requires_graph: bool               # Whether Neo4j traversal is needed

class QueryRouter:

    # TIER 0 patterns — pure SQL answerable questions
    SEARCH_PATTERNS = [
        (r"how many .*(finding|vuln|risk|alert)", "count_findings"),
        (r"list .*(finding|vuln|asset|vendor)", "list_entities"),
        (r"what is (my |the )?(overall |current )?compliance", "compliance_score"),
        (r"show me .*(critical|high|open)", "filtered_list"),
        (r"status of .*(finding|ticket|remediation)", "finding_status"),
        (r"when (was|is) .*(due|detected|resolved)", "date_lookup"),
        (r"which assets? (are|have) .*(vulnerable|exposed|critical)", "asset_filter"),
    ]

    # TIER 3 triggers — always needs deep analysis
    DEEP_PATTERNS = [
        (r"(biggest|most critical|top|highest) (risk|threat|concern)", "top_risk"),
        (r"(executive|board|ceo|ciso) (summary|report|brief)", "executive_report"),
        (r"(attack|exploit|breach|compromise) (path|chain|scenario)", "attack_path"),
        (r"novel (pattern|threat|attack|trend)", "novel_detection"),
        (r"(remediation|fix|priorit) .*(plan|roadmap|sequence)", "remediation_plan"),
        (r"correlate across", "cross_workflow_correlation"),
    ]

    def classify(self, query: str, context: QueryContext) -> QueryClassification:
        """
        Classify a user query into a routing tier.

        Decision tree:
        1. Check if it matches a TIER 0 pattern → SEARCH_ONLY
        2. Check if it matches a TIER 3 pattern → DEEP
        3. Score complexity (0-10) based on:
           - Number of entities mentioned (assets, vendors, techniques, frameworks)
           - Whether cross-workflow correlation is implied
           - Query length and specificity
           - Whether historical trend analysis is requested
           - Whether a narrative/explanation is requested
        4. Complexity 0-3 → TIER 1 (FAST_CHEAP)
        5. Complexity 4-7 → TIER 2 (BALANCED)
        6. Complexity 8-10 → TIER 3 (DEEP)
        """
        ...

    def _score_complexity(self, query: str, context: QueryContext) -> int:
        """Returns 0-10 complexity score."""
        score = 0

        # +1 for each cross-domain entity mentioned
        domains = ["vulnerability", "threat", "vendor", "compliance", "control", "osint", "dark web", "infrastructure"]
        score += sum(1 for d in domains if d in query.lower())

        # +2 if asking for narrative/story/explanation/summary
        if any(w in query.lower() for w in ["explain", "why", "narrative", "story", "tell me", "describe"]):
            score += 2

        # +2 if asking about correlations/relationships
        if any(w in query.lower() for w in ["correlat", "relat", "connect", "link", "cause", "because"]):
            score += 2

        # +1 if asking about trends over time
        if any(w in query.lower() for w in ["trend", "over time", "compare", "last month", "last week"]):
            score += 1

        # +1 if asking about multiple assets
        asset_count = context.referenced_asset_count or 0
        if asset_count > 5:
            score += 1

        return min(score, 10)

    def build_sql_for_tier0(self, pattern_name: str, query: str, org_id: str) -> str:
        """Generate safe, parameterized SQL for TIER 0 queries."""
        # Map pattern names to SQL templates
        templates = {
            "count_findings": "SELECT severity, COUNT(*) FROM findings WHERE org_id=$1 AND status='open' GROUP BY severity",
            "compliance_score": "SELECT f.framework_name, f.overall_compliance_pct FROM compliance_frameworks f WHERE f.org_id=$1",
            ...
        }
        ...
```

**Also implement:**

`QueryContext` dataclass — snapshot of current org state passed to classifier:
- `org_id`, `user_role`, `open_finding_count`, `critical_finding_count`
- `referenced_asset_ids` (extracted from query via NER), `referenced_asset_count`
- `session_cost_so_far_usd` (running cost in this session — used to auto-downgrade)
- `daily_budget_remaining_usd`

`CostGuard` class:
- `check_budget(tier, org_id) -> (allowed: bool, forced_tier: ModelTier, reason: str)`
- If remaining daily budget < $1.00, cap at TIER 1
- If remaining daily budget < $0.10, force TIER 0
- If estimated_cost > max_cost_per_query, reject with explanation
- Log all budget enforcement events

Create unit tests in `/tests/core/test_query_router.py`:
- Test that "how many critical findings" → SEARCH_ONLY
- Test that "what are my biggest risks" → DEEP
- Test that "summarize my open vulnerabilities" → FAST_CHEAP
- Test that "do my dark web alerts correlate with open CVEs" → BALANCED
- Test budget guard forces tier downgrade correctly
```

---

### Prompt 0.3 — AI Cost Tracking & Budget Dashboard

```
Create /app/core/cost_tracker.py for the Virtual CISO platform.

Every AI call goes through the AIProviderClient which records cost. This module handles persisting that data, aggregating it, and enforcing budgets.

**Storage:** BigQuery dataset `vciso_analytics`, table `ai_query_costs`.

Schema:
- query_id (STRING) — UUID
- org_id (STRING)
- timestamp (TIMESTAMP)
- workflow (STRING) — which part of the app triggered this (e.g., "chat", "correlation", "narrative")
- query_tier (STRING) — search_only / fast_cheap / balanced / deep
- provider_used (STRING)
- model_used (STRING)
- input_tokens (INT64)
- output_tokens (INT64)
- cost_usd (FLOAT64)
- latency_ms (INT64)
- was_downgraded (BOOL) — true if CostGuard forced a lower tier
- downgrade_reason (STRING)
- user_query_hash (STRING) — SHA256 of query for deduplication analysis (not the raw query)

Create `CostTracker` class:

```python
class CostTracker:
    async def record(self, ai_response: AIResponse, workflow: str, org_id: str, was_downgraded: bool = False):
        """Write to BigQuery asynchronously (fire-and-forget, do not block the response)."""

    async def get_daily_spend(self, org_id: str) -> float:
        """Query BigQuery for today's total spend for this org."""

    async def get_monthly_spend(self, org_id: str) -> float:
        """Monthly aggregate."""

    async def get_spend_by_workflow(self, org_id: str, days: int = 30) -> dict[str, float]:
        """Breakdown by workflow: chat, correlation, reporting, etc."""

    async def get_spend_by_tier(self, org_id: str, days: int = 30) -> dict[str, dict]:
        """Breakdown by tier with query counts and avg cost."""

    async def get_budget_status(self, org_id: str) -> BudgetStatus:
        """Returns daily limit, daily spent, monthly limit, monthly spent, status (ok/warning/critical)."""
```

`BudgetStatus` dataclass:
- `daily_limit_usd`, `daily_spent_usd`, `daily_remaining_usd`, `daily_pct_used`
- `monthly_limit_usd`, `monthly_spent_usd`, `monthly_remaining_usd`, `monthly_pct_used`
- `status: Literal["ok", "warning", "critical"]` — warning at 80%, critical at 95%
- `most_expensive_workflow: str`
- `avg_cost_per_query_usd: float`
- `total_queries_today: int`
- `queries_downgraded_today: int`

**Budget configuration** (stored in Cloud SQL `org_ai_budgets` table):
- `org_id`, `daily_limit_usd` (default: $10), `monthly_limit_usd` (default: $200)
- `auto_downgrade_enabled` (default: True)
- `alert_webhook_url` (optional Slack webhook for budget alerts)

**Budget alert flow:** When daily spend crosses 80% of limit, send a Pub/Sub message to topic `ai-budget-alerts`. A Cloud Run subscriber sends a Slack/webhook notification to the configured URL.

**Add API endpoints** to `/app/api/v1/ai_settings.py`:
- `GET /ai/budget-status` — current budget status
- `GET /ai/cost-breakdown` — spend by workflow and tier for last 30 days
- `GET /ai/provider` — currently configured provider
- `PATCH /ai/provider` — update active provider (updates org config, not env var — so it's per-org)
- `GET /ai/models` — list available models per provider with estimated cost per 1K tokens
- `GET /ai/health` — test connectivity to configured provider

Create an Alembic migration for `org_ai_budgets` table.
Create BigQuery DDL for `ai_query_costs` table in `/infrastructure/bigquery/schemas/`.
```

---

## PHASE 1: PROJECT FOUNDATION & DATA MODEL

*GCP-native infrastructure. Cloud Run for compute, Cloud SQL for relational data, Neo4j Aura on GCP Marketplace for graph, Pub/Sub for event bus.*

---

### Prompt 1.1 — GCP Project Scaffolding

```
Create a full-stack monorepo project structure for a security platform called "Virtual CISO" on Google Cloud Platform.

**Stack:**
- Backend: Python 3.12+ with FastAPI deployed to Cloud Run
- Frontend: Next.js 14+ with TypeScript and Tailwind CSS, deployed to Cloud Run (or Firebase Hosting)
- Database: Cloud SQL PostgreSQL 16
- Graph: Neo4j Aura for GCP (provisioned via Terraform from GCP Marketplace)
- Cache: Memorystore for Redis 7
- Message bus: Cloud Pub/Sub (replaces Redis Streams and Kafka)
- Analytics: BigQuery (for cost tracking, trend analysis, audit logs)
- Secrets: Secret Manager
- IaC: Terraform in /infrastructure/terraform/

**Monorepo structure:**
```
/backend
  /app
    /api/v1
    /core          ← AI provider, router, cost tracker, dependencies
    /models        ← SQLAlchemy models
    /schemas       ← Pydantic schemas
    /services
      /workflows
      /correlation
    /connectors
    /workers       ← Pub/Sub subscribers
/frontend
/shared            ← shared TypeScript types
/infrastructure
  /terraform
    /modules
      /cloud-run
      /cloud-sql
      /neo4j-aura
      /pubsub
      /bigquery
      /memorystore
      /iam
  /bigquery
    /schemas       ← BigQuery DDL files
  /cloudbuild      ← Cloud Build configs
/scripts
  /office          ← Document generation utilities
```

**Local development** (Docker Compose for services not available locally):
- PostgreSQL 16 (mock Cloud SQL)
- Redis 7 (mock Memorystore)
- Neo4j 5.x (mock Aura)
- PubSub emulator (google/cloud-sdk with pubsub emulator)

**Cloud Build CI/CD:**
Create `/infrastructure/cloudbuild/cloudbuild.yaml`:
- Step 1: Run tests (pytest + jest)
- Step 2: Build Docker images for backend and frontend
- Step 3: Push to Artifact Registry (`{REGION}-docker.pkg.dev/{PROJECT_ID}/vciso/{service}:{SHORT_SHA}`)
- Step 4: Deploy to Cloud Run (blue-green: deploy new revision, test health, shift traffic)
- Step 5: Run smoke tests against new revision
- Step 6: Notify Slack on success or failure

**Terraform modules to scaffold (stub, detail in Phase 8):**
- `/infrastructure/terraform/main.tf` — project-level config, provider setup
- `/infrastructure/terraform/variables.tf` — all configurable values
- `/infrastructure/terraform/modules/cloud-run/` — Cloud Run service definition
- `/infrastructure/terraform/modules/cloud-sql/` — Cloud SQL instance + databases + users
- `/infrastructure/terraform/modules/pubsub/` — all topics and subscriptions

**Environment configuration:**
`.env.example` with these GCP-specific vars:
```
# GCP Project
GCP_PROJECT_ID=your-project-id
GCP_REGION=us-central1

# AI Provider (vertex_ai | anthropic_direct | aws_bedrock)
AI_PROVIDER=anthropic_direct
AI_FALLBACK_PROVIDER=vertex_ai
AI_MAX_COST_PER_QUERY_USD=0.50

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Vertex AI (uses Application Default Credentials in Cloud Run)
VERTEX_LOCATION=us-central1

# Database (Cloud SQL proxy connection string in prod)
DATABASE_URL=postgresql+asyncpg://...

# Neo4j Aura
NEO4J_URI=neo4j+s://....databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=...

# Pub/Sub
PUBSUB_PROJECT_ID=${GCP_PROJECT_ID}
PUBSUB_EMULATOR_HOST=localhost:8085   # local dev only

# Redis (Memorystore)
REDIS_URL=redis://...

# BigQuery
BIGQUERY_DATASET=vciso_analytics

# Budgets
AI_DAILY_BUDGET_USD=10.00
AI_MONTHLY_BUDGET_USD=200.00
```

Create a `Makefile` with: `dev-up`, `dev-down`, `backend-start`, `frontend-start`, `migrate`, `test`, `deploy-staging`, `deploy-prod`, `terraform-plan`, `terraform-apply`.

Do not add business logic yet. This is infrastructure scaffolding only.
```

---

### Prompt 1.2 — Core Data Models (Cloud SQL / PostgreSQL)

```
Using the GCP project from the previous step, create SQLAlchemy 2.0 async models and Alembic migrations for the Virtual CISO platform against Cloud SQL PostgreSQL 16.

Use `asyncpg` as the async driver. Configure SQLAlchemy to use the Cloud SQL Python Connector (`cloud-sql-python-connector`) in production and a standard async URL in local dev (controlled by `USE_CLOUD_SQL_CONNECTOR` env var).

Create these models in /app/models/:

1. **Organization** — id (UUID), name, industry, size, gcp_project_id (nullable — for orgs with their own GCP), created_at.

2. **OrgAIBudget** — org_id (FK), daily_limit_usd (default 10.00), monthly_limit_usd (default 200.00), auto_downgrade_enabled (default True), active_provider (enum: vertex_ai/anthropic_direct/aws_bedrock, default anthropic_direct), alert_webhook_url (nullable), updated_at.

3. **Asset** — id (UUID), org_id (FK), asset_type (enum: server, endpoint, container, cloud_resource, application, network_segment, saas_app, database, identity, vendor), name, identifier (unique external ID — AWS ARN, GCP resource name, hostname), environment (enum: production, staging, development, shared_services), business_criticality (enum: critical, high, medium, low), data_classification (enum: restricted, confidential, internal, public), owner, business_unit, regulatory_scope (JSONB array), cloud_provider (enum: gcp, aws, azure, on_prem, saas, nullable), cloud_region (nullable), cloud_account_id (nullable), metadata (JSONB), status (enum: active, decommissioned, unknown), first_seen, last_seen, created_at, updated_at.

4. **Vulnerability** — id (UUID), org_id (FK), cve_id (nullable), title, description, source (enum: network_scanner, sast, dast, sca, container_scanner, cloud_native, pentest, bug_bounty, manual), severity_source_score (float), cvss_base_score (float), epss_score (float), exploit_availability (enum: none, poc, weaponized, actively_exploited), kev_listed (bool), affected_asset_id (FK), status (enum: open, in_progress, resolved, accepted, false_positive), sla_deadline, resolved_at, remediation_owner, scanner_finding_id, raw_data (JSONB), first_detected, last_detected, created_at, updated_at.

5. **ThreatActor** — id (UUID), org_id (FK), name, aliases (JSONB), description, motivation (enum), sophistication (enum: nation_state, organized_crime, advanced, intermediate, basic), target_industries (JSONB), target_regions (JSONB), active (bool), first_seen, last_updated, source, external_references (JSONB).

6. **ThreatIntelIndicator** — id (UUID), org_id (FK), indicator_type (enum: ip, domain, url, hash_md5, hash_sha1, hash_sha256, email, cve, mutex, registry_key, user_agent), value, threat_actor_id (FK nullable), confidence (int 0-100), severity (enum), tlp_marking (enum: white, green, amber, red), valid_from, valid_until, source, tags (JSONB), raw_data (JSONB), created_at.

7. **Vendor** — id (UUID), org_id (FK), name, vendor_type (enum: saas, infrastructure, software_component, service_provider, data_processor, consulting), tier (enum: tier_1_critical, tier_2_significant, tier_3_standard), data_access_level (enum: none, metadata, internal, confidential, restricted), risk_score (int 0-100), assessment_status (enum: not_assessed, in_progress, assessed, overdue), last_assessment_date, next_assessment_due, contract_expiry, primary_contact, metadata (JSONB), created_at, updated_at.

8. **SecurityControl** — id (UUID), org_id (FK), name, description, control_type (enum: preventive, detective, corrective, deterrent, compensating), category (enum: identity, endpoint, network, cloud, data, application, email, physical, governance), tool_vendor, tool_name, deployment_coverage_pct (float 0-100), effectiveness_score (float 0-100), last_validated, status (enum: active, degraded, inactive, planned), mitre_techniques_covered (JSONB), assets_covered (many-to-many via asset_controls), configuration_baseline (JSONB), created_at, updated_at.

9. **ComplianceFramework** — id (UUID), org_id (FK), framework_name, version, applicable (bool), scope_description, overall_compliance_pct (float), last_assessed, next_assessment_due, created_at, updated_at.

10. **ComplianceRequirement** — id (UUID), framework_id (FK), requirement_id_code, title, description, status (enum: compliant, partially_compliant, non_compliant, not_assessed, not_applicable), evidence_status (enum: current, stale, missing), mapped_control_ids (JSONB), notes, last_reviewed, created_at, updated_at.

11. **Finding** — id (UUID), org_id (FK), finding_type (enum: vulnerability, misconfiguration, threat_indicator, credential_exposure, access_sale, data_leak, control_gap, compliance_gap, supply_chain_risk, osint_exposure, dark_web_mention, correlation_result), title, description, severity (enum: critical, high, medium, low, informational), risk_score (float 0-100), source_workflow (enum: supply_chain, infrastructure, vulnerability, threat, osint, dark_web, controls, gap_analysis, compliance, correlation_engine), source_finding_id, affected_asset_ids (JSONB), affected_vendor_ids (JSONB), related_threat_actor_ids (JSONB), related_cve_ids (JSONB), related_control_ids (JSONB), mitre_techniques (JSONB), status (enum: new, triaged, in_progress, resolved, accepted, false_positive), assigned_to, remediation_notes, correlated_finding_ids (JSONB), correlation_explanation (TEXT), evidence (JSONB), raw_data (JSONB), detected_at, triaged_at, resolved_at, sla_deadline, created_at, updated_at.

12. **CorrelationRule** — id (UUID), org_id (FK), name, description, rule_type (enum: deterministic, graph_pattern, ml_model, llm_analysis), enabled (bool), severity_output (enum), datasets_combined (JSONB), rule_logic (JSONB), graph_query (TEXT), confidence_threshold (float), last_triggered, trigger_count (int), false_positive_count (int), created_at, updated_at.

13. **ChatSession** — id (UUID), org_id (FK), user_id (FK), created_at, updated_at, title (auto-generated from first message).

14. **ChatMessage** — id (UUID), session_id (FK), role (enum: user, assistant), content (TEXT), query_tier (enum: search_only, fast_cheap, balanced, deep), model_used (nullable), cost_usd (float, default 0), latency_ms (int, nullable), sql_executed (TEXT, nullable — for TIER 0, the query that was run), routing_reason (TEXT), created_at.

15. **AuditLog** — id (UUID), org_id (FK), actor, action, entity_type, entity_id, changes (JSONB), timestamp.

Add indexes:
- Finding: composite (org_id, source_workflow, severity, status), index on risk_score, detected_at
- Asset: composite (org_id, asset_type, environment), index on identifier
- Vulnerability: composite (org_id, status, severity), index on cve_id, epss_score
- ThreatIntelIndicator: composite index on (indicator_type, value)
- ChatMessage: index on session_id, created_at
- All tables: index on org_id, created_at

Generate Alembic migration. Create Pydantic v2 schemas (Create, Update, Response variants) for each model.
```

---

### Prompt 1.3 — Graph Data Model (Neo4j Aura on GCP)

```
Using the same project, create the Neo4j graph data model and Python service. This uses Neo4j Aura (managed Neo4j on GCP Marketplace).

Connection: Use the `neo4j` Python async driver. Connection details come from Secret Manager:
- `neo4j-uri`: `neo4j+s://{instance}.databases.neo4j.io`
- `neo4j-username`: `neo4j`
- `neo4j-password`: the Aura-generated password

Create /app/services/graph_service.py.

Node types (id, name, type — full data in Cloud SQL):
- (:Asset {id, name, type, environment, criticality, cloud_provider})
- (:Vulnerability {id, cve_id, severity, epss_score, exploit_status})
- (:ThreatActor {id, name, motivation, sophistication})
- (:Indicator {id, type, value, confidence})
- (:Vendor {id, name, tier, risk_score})
- (:Control {id, name, type, category, effectiveness})
- (:Identity {id, name, role, privilege_level, mfa_enabled})
- (:Finding {id, type, severity, risk_score, source_workflow})
- (:Framework {id, name, compliance_pct})
- (:Technique {id, mitre_id, name, tactic})
- (:GCPProject {id, project_id, display_name, org_node_id}) ← GCP-specific

Relationship types:
- (Asset)-[:HAS_VULNERABILITY]->(Vulnerability)
- (Asset)-[:PROTECTED_BY]->(Control)
- (Asset)-[:OWNED_BY]->(Identity)
- (Asset)-[:PROVIDED_BY]->(Vendor)
- (Asset)-[:COMMUNICATES_WITH {port, protocol, direction}]->(Asset)
- (Asset)-[:DEPENDS_ON]->(Asset)
- (Asset)-[:IN_SCOPE_OF]->(Framework)
- (Asset)-[:IN_PROJECT]->(GCPProject) ← GCP-specific
- (GCPProject)-[:HAS_IAM_BINDING {role, member}]->(Identity) ← GCP-specific
- (Vulnerability)-[:EXPLOITED_BY]->(ThreatActor)
- (Vulnerability)-[:MAPPED_TO]->(Technique)
- (ThreatActor)-[:USES]->(Technique)
- (ThreatActor)-[:TARGETS]->(Asset)
- (ThreatActor)-[:ASSOCIATED_WITH]->(Indicator)
- (Indicator)-[:OBSERVED_ON]->(Asset)
- (Identity)-[:HAS_ACCESS_TO {privilege_level, last_used, mfa_protected}]->(Asset)
- (Identity)-[:EXPOSED_IN]->(Finding)
- (Vendor)-[:SUPPLIES_COMPONENT]->(Asset)
- (Control)-[:DETECTS]->(Technique)
- (Control)-[:PREVENTS]->(Technique)
- (Finding)-[:AFFECTS]->(Asset)
- (Finding)-[:CORRELATED_WITH]->(Finding)
- (Finding)-[:ATTRIBUTED_TO]->(ThreatActor)

Methods in graph_service.py:
- sync_entity(entity_type, entity_data) — upsert node from Cloud SQL data
- add_relationship(from_type, from_id, rel_type, to_type, to_id, properties={})
- remove_relationship(from_type, from_id, rel_type, to_type, to_id)
- find_attack_paths(asset_id) — paths from external exposure to target asset
- find_blast_radius(asset_id) — compromise propagation via identity/network
- find_risk_clusters() — community detection using GDS library
- find_credential_chains() — Identity → exposed credentials → critical assets without MFA
- get_threat_actor_coverage(threat_actor_id) — covered vs. gap techniques
- get_entity_neighborhood(entity_type, entity_id, depth=2)
- find_gcp_cross_project_paths(project_id) — GCP-specific: IAM paths across project boundaries

Include connection pooling (pool_size=5), async session management, and a health check.

Create /scripts/neo4j_constraints.cypher with all UNIQUE and index constraints.
Create a seed script that applies constraints and creates GCP technique nodes from MITRE ATT&CK Cloud matrix.
```

---

### Prompt 1.4 — Shared Constants, Enums, and Scoring

```
Create /app/core/constants.py and /app/core/scoring.py.

In constants.py:

SLA_THRESHOLDS (hours): critical: 24, high: 168, medium: 720, low: 2160

WORKFLOW_NAMES enum: supply_chain, infrastructure, vulnerability, threat, osint, dark_web, controls, gap_analysis, compliance, correlation_engine

MITRE_TACTICS: ordered list of 14 MITRE ATT&CK Enterprise tactics

RISK_BUCKETS: critical (85-100), high (70-84), medium (40-69), low (0-39)

DATA_SENSITIVITY_WEIGHTS: restricted: 1.0, confidential: 0.8, internal: 0.4, public: 0.1

ENVIRONMENT_WEIGHTS: production: 1.0, shared_services: 0.8, staging: 0.3, development: 0.1

AI_TIER_DESCRIPTIONS: human-readable descriptions of each tier for UI display:
  search_only: "Database lookup — no AI cost"
  fast_cheap: "Fast AI summary — ~$0.001"
  balanced: "Standard AI analysis — ~$0.02"
  deep: "Deep AI analysis — ~$0.10-0.50"

In scoring.py, implement:

def calculate_risk_score(
    threat_likelihood: float,       # 0.0 - 1.0
    vulnerability_exposure: float,  # 0.0 - 1.0
    control_effectiveness: float,   # 0.0 - 1.0
    business_impact: float          # 0.0 - 1.0
) -> float:
    # Risk = Threat_Likelihood × Vulnerability_Exposure × (1 - Control_Effectiveness) × Business_Impact × 100

def calculate_threat_likelihood(active_campaigns_targeting, threat_actor_sophistication,
    epss_score, dark_web_signals, days_since_exploit_published) -> float:
    # Weights: epss_score × 0.35, active_campaigns × 0.30, dark_web_signals_normalized × 0.20,
    # sophistication_factor × 0.10, recency_factor × 0.05

def calculate_vulnerability_exposure(cvss_base, exploit_availability,
    network_exposure, affected_asset_count) -> float:
    # Weights: network_exposure_factor × 0.40, exploit_availability_factor × 0.35,
    # cvss_normalized × 0.15, scale_factor × 0.10

def calculate_control_effectiveness(relevant_controls, defense_depth, last_validation_days) -> float:
    # Weighted average of control effectiveness scores, penalized for stale validation

def calculate_business_impact(data_classification, environment, asset_criticality,
    regulatory_scope, revenue_impact_estimate) -> float:
    # Uses DATA_SENSITIVITY_WEIGHTS and ENVIRONMENT_WEIGHTS

Each function must return float 0.0-1.0 with documented weighting logic.
```

---

## PHASE 2: WORKFLOW ENGINES

*Same workflow logic as the original, but events publish to Cloud Pub/Sub instead of Redis Streams. Each workflow publishes to `findings-events` topic. Correlation engine subscribes via a push subscription to a Cloud Run worker.*

---

### Prompt 2.1 — Base Workflow Engine (Pub/Sub)

```
Create the abstract base workflow engine at /app/services/workflows/base.py.

Same lifecycle as before, but using Cloud Pub/Sub for events:

1. Ingest from connectors
2. Normalize to internal data model
3. Create/update Findings in Cloud SQL
4. Sync entities and relationships to Neo4j Aura
5. Trigger risk scoring
6. Publish events to Pub/Sub topic `findings-events`

class BaseWorkflow(ABC):
    workflow_name: str  # from WORKFLOW_NAMES enum
    pubsub_client: PublisherClient
    topic_path: str  # projects/{project_id}/topics/findings-events

    async def execute(self, org_id: str) -> WorkflowResult:
        raw_data = await self.ingest()
        normalized = await self.normalize(raw_data)
        findings = await self.create_findings(normalized)
        await self.sync_graph(findings)
        await self.score_findings(findings)
        await self.emit_events(findings)
        return WorkflowResult(...)

    async def emit_events(self, findings: list[Finding]):
        """Publish to Pub/Sub findings-events topic."""
        for finding in findings:
            message = {
                "event_type": "finding_created",
                "org_id": str(finding.org_id),
                "finding_id": str(finding.id),
                "severity": finding.severity,
                "source_workflow": finding.source_workflow,
                "risk_score": finding.risk_score,
                "timestamp": finding.created_at.isoformat(),
            }
            self.pubsub_client.publish(
                self.topic_path,
                json.dumps(message).encode(),
                severity=finding.severity,
                workflow=finding.source_workflow,
            )

Also create NormalizedFinding dataclass, WorkflowResult dataclass, and WorkflowScheduler using Cloud Scheduler jobs (one job per workflow, configurable cadence).

Create Pub/Sub topics and subscriptions in /infrastructure/terraform/modules/pubsub/main.tf:
- Topic: `findings-events`
- Topic: `correlation-triggers`
- Topic: `ai-budget-alerts`
- Subscription: `correlation-worker` (push to Cloud Run worker URL, max_delivery_attempts: 5, ack_deadline: 300s)
- Subscription: `budget-alert-handler` (push to budget alert handler)
- Dead letter topic: `findings-events-dead-letter`
```

---

### Prompt 2.2 — Vulnerability Management Workflow

```
Create /app/services/workflows/vulnerability.py implementing BaseWorkflow.

GCP-specific connector: Add `GCPSCCVulnerabilityConnector` that ingests from Security Command Center Premium:
- Source: SCC findings with category in (VULNERABILITIES, CONTAINER_SCANNING, WEB_SECURITY_SCANNER)
- Use `google.cloud.securitycenter_v1` Python client
- Map SCC severity (CRITICAL/HIGH/MEDIUM/LOW) to internal enum
- Map resource_name to Asset.identifier

Other connectors (abstract, real API integration in Phase 6):
1. NetworkScannerConnector (Qualys/Nessus shape)
2. ContainerScannerConnector (Trivy/Grype shape)
3. SCAConnector (Snyk/Dependabot shape)
4. SASTConnector (Semgrep/SonarQube shape)
5. PentestConnector (manual import)

The normalize() method:
- Map all scanners' severity to internal enum
- Deduplicate: same CVE on same asset from different scanners = one Finding (keep highest severity)
- Enrich CVEs with EPSS score (call https://api.first.org/data/v1/epss) and CISA KEV catalog
- Set SLA deadlines using SLA_THRESHOLDS
- Classify exploit_availability

Sample data generator: 200 vulns across 50 assets, realistic CVE IDs and CVSS scores.
```

---

### Prompt 2.3 — Infrastructure Risk Workflow

```
Create /app/services/workflows/infrastructure.py implementing BaseWorkflow.

GCP-specific connectors:

1. GCPSCCConnector — Security Command Center Premium findings:
   - Categories: MISCONFIGURATION, ANOMALOUS_IAM_GRANT, OPEN_FIREWALL, EXPOSED_SERVICE
   - Use `google.cloud.securitycenter_v1`
   - Map to Finding types: misconfiguration, credential_exposure, control_gap

2. GCPCloudAssetInventoryConnector — Cloud Asset Inventory:
   - Use `google.cloud.asset_v1.AssetServiceClient`
   - Fetch all compute instances, Cloud SQL instances, Cloud Storage buckets, IAM policies
   - Identify over-privileged service accounts (roles/editor, roles/owner on non-admin accounts)
   - Identify public GCS buckets (allUsers ACL)
   - Identify Cloud SQL instances without SSL, with public IP, without backups

3. GCPIAMPolicyAnalyzerConnector — IAM Policy Analyzer:
   - Use `google.cloud.policy_analyzer_v1`
   - Find service accounts with cross-project roles
   - Find unused roles (last used > 90 days)
   - Find primitive roles (roles/owner, roles/editor) granted to non-service-account members

4. GCPAuditLogConnector — Cloud Logging (Audit logs):
   - Use `google.cloud.logging_v2`
   - Query for: admin activity in last 7 days, data access anomalies, IAM policy changes

5. Generic CSPMConnector (for AWS/Azure via Wiz or Prisma Cloud API)

6. IaCDriftConnector (Terraform state vs. Cloud Asset Inventory diff)

Normalize to Findings. Build graph relationships in Neo4j:
- Asset -[:COMMUNICATES_WITH]-> Asset (from VPC firewall rules)
- Identity -[:HAS_ACCESS_TO]-> Asset (from IAM policies)
- Asset -[:IN_PROJECT]-> GCPProject
- GCPProject -[:HAS_IAM_BINDING]-> Identity

Sample data: 100 GCP resources, 30 identities, 15 misconfigs, 5 IAM risk findings, 3 network exposure findings.
```

---

### Prompt 2.4 — Supply Chain Risk Workflow

```
Create /app/services/workflows/supply_chain.py implementing BaseWorkflow.

GCP-specific connector: GCPArtifactRegistryConnector:
- Use `google.cloud.artifactregistry_v1`
- Fetch all Docker images and packages in Artifact Registry
- Cross-reference with known CVEs (via Container Analysis API)
- Use `google.cloud.containeranalysis_v1` to get vulnerability occurrences attached to images

Other connectors (abstract):
1. SBOMConnector — ingests CycloneDX or SPDX formatted SBOMs for each vendor
2. VendorAssessmentConnector — integrates with SecurityScorecard or RiskRecon API
3. OSVConnector — queries https://api.osv.dev/v1/query for vulnerabilities in open source dependencies
4. NVDConnector — cross-references CPE data with vendor product inventory

Normalize to Findings:
- Vendor with critical CVE in their product → supply_chain_risk Finding
- Vendor with SecurityScorecard below threshold → supply_chain_risk Finding
- SBOM component with actively exploited CVE → critical supply_chain_risk Finding
- Expired/expiring vendor contract + unresolved security issues → escalated risk

Build graph relationships:
- Vendor -[:SUPPLIES_COMPONENT]-> Asset
- Asset -[:HAS_VULNERABILITY {via: vendor}]-> Vulnerability

Sample data: 30 vendors across tiers, 5 SBOM manifests, 10 supply chain findings.
```

---

### Prompt 2.5 — Threat Management Workflow

```
Create /app/services/workflows/threat.py implementing BaseWorkflow.

Connectors (abstract, real integration in Phase 6):
1. ThreatIntelPlatformConnector — STIX/TAXII feed ingestion (MISP, OpenCTI, commercial feeds)
2. RecordedFutureConnector — Recorded Future API for threat actor tracking and CVE intelligence
3. ChronicleConnector — Chronicle SIEM for IOC matching against internal logs:
   - Use Chronicle's Unified Data Model (UDM) API
   - Query: `SELECT * FROM entity_graph WHERE ip IN (threat_intel_ips) LIMIT 1000`
   - Identify assets that communicated with known bad IPs/domains in last 30 days
4. VirusTotalConnector — hash/IP/domain reputation enrichment

Normalize to Findings:
- IOC match on internal asset → critical threat_indicator Finding
- Threat actor actively targeting industry → threat Finding with affected asset list
- New CVE with weaponized exploit matching internal vuln → escalate existing vuln Finding

Build graph relationships:
- ThreatActor -[:USES]-> Technique
- ThreatActor -[:TARGETS]-> Asset
- Indicator -[:OBSERVED_ON]-> Asset
- Vulnerability -[:EXPLOITED_BY]-> ThreatActor

Update ThreatActor and ThreatIntelIndicator tables.

Sample data: 5 threat actors, 50 indicators, 10 threat findings, 3 IOC matches.
```

---

### Prompt 2.6 — OSINT Workflow

```
Create /app/services/workflows/osint.py implementing BaseWorkflow.

Connectors:
1. GitHubDorkConnector — searches GitHub for leaked secrets matching org domain/keywords
   - API: GitHub Search API with `dorks`: `{org_domain} password`, `{org_name} secret`, etc.
   - Enrichment: GitGuardian API for confirmed secret detections
2. ShodanConnector — discovers internet-exposed assets not in inventory
   - Query: `org:"{org_name}" OR ssl.cert.subject.cn:*.{domain}`
   - Compare with known Asset inventory — flag unknowns as shadow IT
3. CertificateTransparencyConnector — CT log monitoring for new subdomains
   - API: crt.sh API for certificate issuance
   - Flag unexpected subdomains, expiring certificates, wildcard certs on sensitive subdomains
4. BreachDataConnector — HaveIBeenPwned Enterprise API or HIBP for known breaches
5. GoogleDorkConnector — custom search for exposed files, login pages, error pages

Normalize to Findings of type: osint_exposure, credential_exposure

Build graph relationships:
- Asset -[:HAS_VULNERABILITY {type: "exposed_service"}]-> Vulnerability

Sample data: 15 OSINT findings, 3 credential exposures, 5 shadow IT assets discovered.
```

---

### Prompt 2.7 — Dark Web Scanning Workflow

```
Create /app/services/workflows/dark_web.py implementing BaseWorkflow.

Connectors (abstract — real API keys needed at runtime):
1. RecordedFutureDarkWebConnector — Recorded Future dark web intelligence:
   - Monitor for access sales, data leaks, credential auctions
   - Filter by org domain, brand names, executive names, IP ranges
2. FlashpointConnector — Flashpoint intelligence platform API
3. DarkOwlConnector — DarkOwl Vision API for dark web monitoring
4. GenericDarkWebConnector — normalized interface any vendor can implement

Normalize to Findings:
- "Access sale" mention → critical dark_web_mention Finding (attacker selling access to org)
- "Data dump" with org domain → critical dark_web_mention Finding (data leak)
- "Credential" with org email pattern → high credential_exposure Finding
- "Threat actor discussion" targeting org industry → medium dark_web_mention Finding

Build graph relationships:
- Finding -[:ATTRIBUTED_TO]-> ThreatActor (when actor is identified)

Expose dark_web_signal_count to the threat likelihood scoring function.

Sample data: 8 dark web findings including 1 access sale simulation, 2 credential leaks.
```

---

### Prompt 2.8 — Controls & Coverage Workflow

```
Create /app/services/workflows/controls.py implementing BaseWorkflow.

Connectors:
1. MDMConnector — Jamf/Intune for endpoint agent coverage
   - Track: EDR agent installed, encryption enabled, OS patching status, MDM managed
2. EDRConnector — CrowdStrike/SentinelOne API for endpoint protection coverage
   - Track: sensor installed, policy assigned, last seen, threat detections
3. SIEMConnector — Chronicle for log source coverage
   - Which assets are sending logs vs. which are silent (not covered by SIEM)
   - Use Chronicle's asset coverage API
4. IdentityConnector — Okta/Azure AD for MFA coverage
   - Identify users without MFA, stale accounts (>90 days), admin accounts
5. VulnScannerCoverageConnector — which assets are being scanned vs. not

For each SecurityControl in the database:
- Calculate deployment_coverage_pct: (assets with control deployed / total assets) × 100
- Calculate effectiveness_score based on control configuration quality and last validation
- Map covered assets to MITRE techniques via ATT&CK Navigator data

Produce Findings of type: control_gap
- Control coverage < 80% on critical assets → high Finding
- Control not validated in > 180 days → medium Finding
- Critical asset with zero detective controls → critical Finding

Sample data: 15 controls, coverage metrics, 8 gap findings.
```

---

### Prompt 2.9 — Security Gap Analysis & Compliance Workflows

```
Create /app/services/workflows/gap_analysis.py and /app/services/workflows/compliance.py.

**Gap Analysis Workflow:**

Inputs: output from controls workflow + all Finding data
Analysis:
1. MITRE ATT&CK Coverage Gap: which techniques have no detective or preventive control?
2. Asset coverage gap: which critical assets have fewer than N security controls?
3. Redundancy analysis: are there controls with >90% overlap? (over-investment)
4. Regulatory gap: for each framework in scope, which requirements have no mapped control?

Produce Findings of type: control_gap, compliance_gap
Map gaps to the specific compliance requirements they affect.

**Compliance Workflow:**

Connectors:
1. GRCConnector — Vanta, Drata, or Tugboat Logic API for automated evidence collection
2. GCPOrganizationPolicyConnector — GCP Organization Policy Service:
   - Use `google.cloud.orgpolicy_v2`
   - Verify policy constraints like `constraints/compute.requireShieldedVm`, `constraints/storage.uniformBucketLevelAccess`
3. ManualEvidenceConnector — ingests evidence records from a spreadsheet or manual upload

For each ComplianceRequirement:
- Determine status based on: mapped control effectiveness, existing Findings affecting that control, and available evidence
- Set status: compliant / partially_compliant / non_compliant / not_assessed

Produce Findings of type: compliance_gap for non-compliant or partially-compliant requirements.
Update ComplianceFramework.overall_compliance_pct.

Sample data: 3 frameworks (NIST CSF 2.0, SOC 2 Type II, PCI DSS 4.0), 60 requirements total.
```

---

## PHASE 3: CORRELATION ENGINE

*The correlation engine consumes Pub/Sub events, runs three analysis layers, and uses the AIProviderClient and QueryRouter from Phase 0 for all AI dispatch decisions.*

---

### Prompt 3.1 — Deterministic Correlation Rules Engine

```
Create /app/correlation/rule_engine.py for the Virtual CISO platform.

class DeterministicRuleEngine:
    async def evaluate_all(self, findings: list[Finding], db) -> list[CorrelatedFinding]:
        """Run all enabled rules against the new findings. Return correlations found."""

Implement these 9 correlation rules (plus the GCP-specific one):

RULE 1: EXPLOIT_PATH_DETECTION
Trigger: New vulnerability with exploit_availability in (weaponized, actively_exploited)
Check: Is the affected asset reachable from the internet (network_exposure = internet_facing)?
AND: Is the CVE in the CISA KEV catalog?
AND: EPSS score > 0.5?
AND: Is there no detective control covering the relevant MITRE technique?
If ALL true: create critical CorrelatedFinding with title "Actively Exploitable Internet-Facing Asset"

RULE 2: THREAT_VULN_ALIGNMENT
Trigger: New ThreatIntelIndicator OR new Vulnerability
Check: Does any active ThreatActor have this CVE in their known exploitation repertoire?
If true: escalate vulnerability Finding severity, create correlation linking both

RULE 3: CREDENTIAL_CHAIN_RISK
Trigger: New credential_exposure Finding from OSINT or dark web
Check: Does the exposed credential belong to an identity with admin access to critical assets?
AND: Is that identity missing MFA?
If true: critical correlated Finding "Credential Chain Risk: Exposed Admin Credential"

RULE 4: SUPPLY_CHAIN_CASCADE
Trigger: New supply_chain_risk Finding against a Tier 1 vendor
Check: Which internal assets use that vendor's software/service?
AND: Do those assets have open vulnerabilities related to the vendor's CVE?
If true: create high CorrelatedFinding linking all affected assets

RULE 5: DETECTION_BLIND_SPOT
Trigger: New critical or high vulnerability Finding
Check: Is the affected asset sending logs to the SIEM?
AND: Does any current rule detect exploitation of the relevant MITRE technique?
If both false: create high CorrelatedFinding "Undetectable Exploitation Path"

RULE 6: COMPLIANCE_IMPACT_PATH
Trigger: New critical Finding on any asset
Check: Is the affected asset in regulatory scope (PCI, HIPAA, SOX)?
AND: Does the relevant MITRE technique map to a compliance requirement currently marked compliant?
If true: create Finding "Compliance Status at Risk" and update ComplianceRequirement status

RULE 7: LATERAL_MOVEMENT_RISK
Trigger: New threat_indicator Finding (IOC match on internal asset)
Check: Via graph — what other assets can the compromised asset reach via COMMUNICATES_WITH?
AND: Do those reachable assets contain sensitive data?
If true: create critical CorrelatedFinding with blast radius map

RULE 8: BRAND_ATTACK_CONVERGENCE
Trigger: New dark_web Finding AND new OSINT Finding in same 24-hour window
Check: Both reference same brand keywords or executive names
If true: create high "Coordinated Brand Attack" CorrelatedFinding

RULE 9: SLA_BREACH_RISK
Trigger: Scheduled (hourly scan, not event-driven)
Check: Findings where sla_deadline < now() + 48 hours AND status not in (resolved, accepted)
If true: create medium escalation Finding and trigger notification

RULE 10: GCP_CROSS_PROJECT_ESCALATION (GCP-specific)
Trigger: New credential_exposure or misconfiguration Finding on a service account
Check: Via graph — does this service account have IAM bindings in multiple GCP projects?
AND: Does any of those projects contain production assets?
If true: critical CorrelatedFinding "Cross-Project Privilege Escalation Risk"

Store all results using bulk upsert via SQLAlchemy. Track false_positive_count and trigger_count on CorrelationRule table.
```

---

### Prompt 3.2 — Graph-Based Pattern Detection

```
Create /app/correlation/graph_engine.py for the Virtual CISO platform.

class GraphCorrelationEngine:
    def __init__(self, graph_service: GraphService, db):

    async def run_all_analyses(self, org_id: str) -> list[CorrelatedFinding]:
        """Run all graph pattern analyses. Called hourly by orchestrator."""
        results = []
        results += await self.detect_attack_paths(org_id)
        results += await self.detect_credential_chains(org_id)
        results += await self.detect_risk_clusters(org_id)
        results += await self.detect_blast_radii(org_id)
        return results

Implement 4 graph analyses using Cypher queries against Neo4j Aura:

1. ATTACK PATH DETECTION
Cypher:
MATCH path = (exposed:Asset {environment: 'production'})-[:HAS_VULNERABILITY]->(v:Vulnerability)
             -[:EXPLOITED_BY]->(ta:ThreatActor)
WHERE v.exploit_status IN ['weaponized', 'actively_exploited']
AND NOT EXISTS((exposed)-[:PROTECTED_BY]->(:Control)-[:PREVENTS]->(:Technique)<-[:USES]-(ta))
RETURN path, length(path) as path_length, ta.name as actor
ORDER BY path_length ASC
LIMIT 20

For each path found, create a CorrelatedFinding with a serialized attack path visualization.

2. CREDENTIAL CHAIN DETECTION
Cypher:
MATCH (i:Identity)-[:EXPOSED_IN]->(f:Finding)
WHERE f.type = 'credential_exposure' AND f.status = 'open'
WITH i
MATCH (i)-[r:HAS_ACCESS_TO {mfa_protected: false}]->(a:Asset)
WHERE a.criticality IN ['critical', 'high'] AND r.privilege_level IN ['admin', 'power_user']
RETURN i, a, r

For each match, create a critical CorrelatedFinding.

3. RISK CLUSTER DETECTION
Use Neo4j GDS (Graph Data Science) library for community detection:
CALL gds.louvain.stream({
  nodeProjection: ['Asset', 'Vulnerability', 'ThreatActor', 'Vendor'],
  relationshipProjection: {
    HAS_VULNERABILITY: {orientation: 'UNDIRECTED'},
    PROVIDED_BY: {orientation: 'UNDIRECTED'},
    EXPLOITED_BY: {orientation: 'UNDIRECTED'}
  }
})
YIELD nodeId, communityId
RETURN communityId, collect(nodeId) as members, count(*) as cluster_size
ORDER BY cluster_size DESC LIMIT 10

For clusters with aggregate risk_score > 70, create a CorrelatedFinding.

4. BLAST RADIUS ANALYSIS
For each compromised asset (status = 'new' or 'in_progress'):
MATCH (compromised:Asset {id: $asset_id})-[:COMMUNICATES_WITH*1..3]->(reachable:Asset)
WHERE reachable.criticality = 'critical'
RETURN reachable, length(path) as hops
UNION
MATCH (compromised:Asset {id: $asset_id})<-[:HAS_ACCESS_TO]-(i:Identity)-[:HAS_ACCESS_TO]->(other:Asset)
WHERE other.criticality = 'critical'
RETURN other as reachable, 2 as hops

Serialize results as JSON and store in correlated Finding evidence field.
```

---

### Prompt 3.3 — AI-Powered Contextual Analysis (Provider-Agnostic)

```
Create /app/correlation/llm_engine.py for the Virtual CISO platform.

IMPORTANT: This engine uses the AIProviderClient from Phase 0 — it does NOT hardcode any specific AI provider or model. All AI dispatch goes through the abstraction layer. The QueryRouter determines which tier to use for each analysis type.

class LLMCorrelationEngine:
    def __init__(self, ai_client: AIProviderClient, query_router: QueryRouter, db):
        self.ai = ai_client
        self.router = query_router

    async def analyze_finding(self, finding: Finding, context: CorrelationContext) -> LLMAnalysisResult:
        """
        Deep analysis of a single critical/high finding with full cross-domain context.
        Uses TIER 3 (DEEP) — only called for critical findings by the orchestrator.
        """
        request = AIRequest(
            system_prompt=load_prompt("finding_analysis_system"),
            user_prompt=self._build_finding_prompt(finding, context),
            tier=ModelTier.DEEP,  # Always DEEP for critical finding analysis
            structured_output_schema=LLMAnalysisResult.model_json_schema(),
            metadata={"workflow": "correlation", "finding_id": str(finding.id)},
        )
        response = await self.ai.complete(request)
        return LLMAnalysisResult.model_validate_json(response.structured_output)

    async def generate_risk_narrative(self, top_findings: list[Finding]) -> str:
        """
        Weekly executive summary. Uses TIER 3 (DEEP).
        Input: top 10 correlated risk findings.
        Output: 3-paragraph board-level narrative with KRIs and recommendations.
        """
        request = AIRequest(
            system_prompt=load_prompt("risk_narrative_system"),
            user_prompt=self._build_narrative_prompt(top_findings),
            tier=ModelTier.DEEP,
            metadata={"workflow": "reporting"},
        )
        response = await self.ai.complete(request)
        return response.content

    async def suggest_remediation_priorities(self, findings: list[Finding], constraints: dict) -> list[RemediationRecommendation]:
        """
        Remediation roadmap given organizational constraints.
        Uses TIER 2 (BALANCED) — structured output, moderate complexity.
        """
        request = AIRequest(
            system_prompt=load_prompt("remediation_system"),
            user_prompt=self._build_remediation_prompt(findings, constraints),
            tier=ModelTier.BALANCED,
            structured_output_schema=RemediationRecommendation.list_schema(),
            metadata={"workflow": "remediation"},
        )
        response = await self.ai.complete(request)
        return [RemediationRecommendation.model_validate(r) for r in response.structured_output]

    async def detect_novel_patterns(self, recent_findings: list[Finding], historical_findings: list[Finding]) -> list[CorrelatedFinding]:
        """
        Look for emergent patterns rules and graph haven't caught.
        Uses TIER 3 (DEEP) — called on weekly schedule, not per-event.
        """
        request = AIRequest(
            system_prompt=load_prompt("novel_pattern_system"),
            user_prompt=self._build_pattern_prompt(recent_findings, historical_findings),
            tier=ModelTier.DEEP,
            structured_output_schema=NovelPatternResult.list_schema(),
            metadata={"workflow": "pattern_detection"},
        )
        response = await self.ai.complete(request)
        return self._convert_to_correlated_findings(response.structured_output)

    async def answer_security_question(self, question: str, context: QueryContext) -> ChatAnswerResult:
        """
        Answer a user question from the vCISO chat interface.
        Tier is determined by QueryRouter — NOT hardcoded here.
        This enables smart routing: simple questions skip AI entirely.
        """
        classification = self.router.classify(question, context)

        # TIER 0: Pure SQL — no AI needed
        if classification.tier == ModelTier.SEARCH_ONLY:
            results = await self._execute_search_query(classification.sql_query, context.org_id)
            return ChatAnswerResult(
                answer=self._format_search_results(results, question),
                tier_used=ModelTier.SEARCH_ONLY,
                cost_usd=0.0,
                routing_reason=classification.routing_reason,
                sql_executed=classification.sql_query,
            )

        # Load relevant context data for AI tiers
        db_context = await self._load_context(classification.context_needed, context.org_id)

        request = AIRequest(
            system_prompt=load_prompt("vciso_chat_system"),
            user_prompt=self._build_chat_prompt(question, db_context),
            tier=classification.tier,
            metadata={"workflow": "chat"},
        )
        response = await self.ai.complete(request)

        return ChatAnswerResult(
            answer=response.content,
            tier_used=classification.tier,
            model_used=response.model_used,
            cost_usd=response.cost_usd,
            routing_reason=classification.routing_reason,
        )

Create prompt templates in /app/correlation/prompts/ as separate .md files:
- finding_analysis_system.md
- risk_narrative_system.md
- remediation_system.md
- novel_pattern_system.md
- vciso_chat_system.md

Each template must include:
1. The AI's role as a Virtual CISO analyst
2. Output format instructions (JSON schema for structured outputs)
3. Guidance to be concise and business-focused
4. Instructions to flag uncertainty rather than hallucinate

Define Pydantic output models:
- LLMAnalysisResult: narrative (str), risk_level (str), recommendations (list[str]), time_to_compromise_estimate (str), non_obvious_connections (list[str])
- RemediationRecommendation: priority (int), action (str), effort (str), risk_reduction_pct (float), dependencies (list[str])
- NovelPatternResult: pattern_type (str), description (str), affected_entities (list), confidence (float)
- ChatAnswerResult: answer (str), tier_used (ModelTier), model_used (Optional[str]), cost_usd (float), routing_reason (str), sql_executed (Optional[str])
```

---

### Prompt 3.4 — Correlation Orchestrator (Router-Aware)

```
Create /app/correlation/orchestrator.py for the Virtual CISO platform.

The orchestrator now uses the QueryRouter from Phase 0 to make intelligent dispatch decisions, rather than always calling the LLM for every critical finding.

class CorrelationOrchestrator:
    def __init__(self, rule_engine, graph_engine, llm_engine: LLMCorrelationEngine,
                 query_router: QueryRouter, ai_client: AIProviderClient,
                 db, pubsub_client):

    async def process_new_findings(self, findings: list[Finding]):
        """Main entry point. Triggered by Pub/Sub push from findings-events topic."""

        # Step 1: Run deterministic rules (fast, always runs, no AI cost)
        rule_results = await self.rule_engine.evaluate_all(findings, self.db)

        # Step 2: Run graph correlations (no AI cost — pure Neo4j Cypher)
        affected_org_ids = {f.org_id for f in findings}
        graph_results = []
        for org_id in affected_org_ids:
            graph_results += await self.graph_engine.run_all_analyses(org_id)

        # Step 3: Deduplicate across engines
        merged = self.deduplicate_correlations(rule_results + graph_results)

        # Step 4: Score all correlated findings
        for finding in merged:
            finding.risk_score = await self.score_correlated_finding(finding)

        # Step 5: Route critical findings to AI — but ONLY if budget allows
        critical_findings = [f for f in merged if f.severity == "critical"]
        for finding in critical_findings:
            budget_check = await self.ai_client.cost_guard.check_budget(
                ModelTier.DEEP, finding.org_id
            )
            if budget_check.allowed:
                context = await self.build_context(finding)
                llm_result = await self.llm_engine.analyze_finding(finding, context)
                finding.correlation_explanation = llm_result.narrative
                finding.remediation_notes = "\n".join(llm_result.recommendations)
            else:
                # Budget exceeded — log and use rule engine's explanation instead
                finding.correlation_explanation = (
                    f"[AI analysis skipped: {budget_check.reason}. "
                    f"Rule-based correlation: {finding.correlation_explanation}]"
                )
                await self.notify_budget_constraint(finding.org_id, budget_check)

        # Step 6: Store all correlated findings
        await self.store_findings(merged)

        # Step 7: Route alerts based on severity
        await self.route_alerts(merged)

        # Step 8: Update BigQuery materialized data for dashboards
        await self.refresh_dashboard_data(affected_org_ids)

    async def run_scheduled_analysis(self):
        """Runs hourly. Full graph re-analysis + AI trend detection (budget permitting)."""
        for org_id in await self.get_active_orgs():
            await self.graph_engine.run_all_analyses(org_id)

            budget = await self.ai_client.cost_guard.check_budget(ModelTier.DEEP, org_id)
            if budget.allowed:
                recent = await self.get_recent_findings(org_id, days=7)
                historical = await self.get_historical_sample(org_id)
                await self.llm_engine.detect_novel_patterns(recent, historical)

    async def run_weekly_narrative(self):
        """Runs weekly. Generates board-level risk narrative. Uses DEEP tier."""
        for org_id in await self.get_active_orgs():
            top_findings = await self.get_top_findings(org_id, limit=10)
            narrative = await self.llm_engine.generate_risk_narrative(top_findings)
            await self.store_narrative(org_id, narrative)

    async def route_alerts(self, findings: list[Finding]):
        """
        Pub/Sub-based alerting:
        Critical → immediate Pub/Sub publish to alert-critical topic → Cloud Run webhook handler → Slack + PagerDuty + Jira
        High → Pub/Sub → Slack + Jira (within 1 hour via scheduled batch)
        Medium → daily digest
        Low → weekly report
        """
        ...

    def deduplicate_correlations(self, findings):
        """Same source findings → keep richer explanation, merge referenced IDs."""
        ...

Create:
- /app/correlation/pubsub_consumer.py — Cloud Run HTTP handler for Pub/Sub push delivery
  - Endpoint: POST /internal/correlation/process
  - Validates Pub/Sub message envelope
  - Deserializes finding events
  - Calls orchestrator.process_new_findings()
  - Returns 200 on success, 4xx for invalid messages, 5xx for retryable errors

- /app/correlation/scheduler.py — Cloud Scheduler trigger endpoints:
  - POST /internal/correlation/hourly — hourly graph analysis
  - POST /internal/correlation/weekly — weekly narrative generation

- Management command: `python -m app.correlation.run --org-id {id} --full`
```

---

## PHASE 4: API LAYER

*REST API, WebSocket, and the new Conversational vCISO Chat Interface — with intelligent query routing built in.*

---

### Prompt 4.1 — REST API Endpoints

```
Create the FastAPI router structure at /app/api/v1/.

Route files:

1. /app/api/v1/dashboard.py
   - GET /dashboard/risk-overview — total findings by severity, risk score trend (30 days), top 5 correlated risks, compliance posture
   - GET /dashboard/risk-heatmap — MITRE ATT&CK heatmap data
   - GET /dashboard/workflow-status — last run time, findings count, health per workflow
   - GET /dashboard/kpis — MTTR by severity, SLA compliance rate, open findings trend, vulnerability density

2. /app/api/v1/findings.py
   - GET /findings — paginated with filters: severity, status, source_workflow, asset_id, date_range, risk_score_min
   - GET /findings/{id} — full detail including correlations, affected assets, remediation history
   - PATCH /findings/{id} — update status, assign, add notes
   - GET /findings/{id}/correlations — correlated findings with explanation
   - GET /findings/{id}/timeline
   - POST /findings/{id}/accept-risk

3. /app/api/v1/assets.py
   - GET /assets — paginated with filters
   - GET /assets/{id}
   - GET /assets/{id}/risk-profile
   - GET /assets/{id}/blast-radius — graph visualization data

4. /app/api/v1/threats.py
   - GET /threats/actors
   - GET /threats/actors/{id}
   - GET /threats/campaigns
   - GET /threats/coverage-matrix — MITRE ATT&CK: defended vs. gap

5. /app/api/v1/compliance.py
   - GET /compliance/frameworks
   - GET /compliance/frameworks/{id}/requirements
   - GET /compliance/cross-framework — shared controls
   - GET /compliance/audit-readiness/{framework_id}

6. /app/api/v1/vendors.py
   - GET /vendors
   - GET /vendors/{id}
   - GET /vendors/concentration-risk

7. /app/api/v1/correlation.py
   - GET /correlation/rules
   - GET /correlation/attack-paths
   - GET /correlation/risk-clusters
   - POST /correlation/run
   - GET /correlation/narrative

8. /app/api/v1/reports.py
   - POST /reports/executive-summary
   - POST /reports/board-deck
   - GET /reports/trend/{metric}

9. /app/api/v1/ai_settings.py (from Phase 0 Prompt 0.3)
   - GET /ai/budget-status
   - GET /ai/cost-breakdown
   - GET /ai/provider
   - PATCH /ai/provider
   - GET /ai/models
   - GET /ai/health

All endpoints: require org_id from auth context, standard pagination, consistent response envelopes, OpenAPI docs with examples.

Use Cloud IAP (Identity-Aware Proxy) for authentication. Extract the `X-Goog-Authenticated-User-Email` and `X-Goog-Authenticated-User-Id` headers from IAP. Create a FastAPI dependency `get_current_user` that validates these headers.

Create a `RateLimiter` using Memorystore (Redis) that limits:
- AI-backed endpoints to 20 requests/minute per user
- Reporting endpoints to 5 requests/minute per user
- Standard read endpoints to 200 requests/minute per user
```

---

### Prompt 4.2 — WebSocket Real-Time Feed

```
Add WebSocket support to the FastAPI application for real-time updates.

Create /app/api/v1/ws.py:

1. WebSocket /ws/findings-feed
   - On connect: authenticate via IAP token, subscribe to org's finding stream
   - Messages: {type: "new_finding" | "finding_updated" | "correlation_detected", data: Finding}
   - Support filter parameters on connect: min_severity, source_workflows

2. WebSocket /ws/dashboard-updates
   - KPI changes pushed as they're calculated
   - Risk score changes for top findings
   - AI cost/budget updates (useful for showing live cost tracking in the UI)

3. WebSocket /ws/chat/{session_id}
   - Streams chat responses from the vCISO interface in real-time (token by token for AI-backed responses)
   - For TIER 0 responses, sends the complete answer immediately
   - For AI-backed responses, streams content as it arrives from the provider

Create /app/services/event_bus.py:
- Backed by Cloud Pub/Sub in production, in-memory for local dev
- Pub/Sub topic `realtime-updates` with per-org subscriber
- WebSocket connections maintain a local mapping of org_id → [websocket connections]
- Include connection cleanup on disconnect

For streaming chat responses: use SSE (Server-Sent Events) as an alternative to WebSocket for the chat endpoint, since SSE is simpler for one-directional streaming and works through Cloud Load Balancer without special config. Create POST /chat/{session_id}/stream that returns a StreamingResponse.
```

---

### Prompt 4.3 — Conversational vCISO Chat Interface (API)

```
Create /app/api/v1/chat.py — the API backend for the intelligent vCISO chat interface.

This is the primary user-facing AI feature. Users ask natural language questions about their security posture, and the system routes intelligently: simple questions get instant database answers, complex questions get AI analysis.

**API Endpoints:**

POST /chat/sessions — create a new chat session
  Request: {org_id (from auth), initial_message (optional)}
  Response: {session_id, created_at}

GET /chat/sessions — list recent sessions (last 20)
  Response: {sessions: [{session_id, title, last_message_at, message_count, total_cost_usd}]}

GET /chat/sessions/{session_id}/messages — get message history
  Response: {messages: [ChatMessage with tier_used, cost_usd, routing_reason visible]}

POST /chat/sessions/{session_id}/messages — send a message
  Request: {content: str}
  Response (immediate, non-streaming): ChatMessageResponse

POST /chat/sessions/{session_id}/stream — send a message with streaming response
  Request: {content: str}
  Response: text/event-stream (SSE)
  Events:
    - {type: "routing", tier: "fast_cheap", reason: "Simple summarization request", estimated_cost: 0.001}
    - {type: "sql_result", query: "SELECT ...", row_count: 42} (for TIER 0 only)
    - {type: "token", content: "The"} (streamed tokens for AI responses)
    - {type: "done", cost_usd: 0.0032, model_used: "gemini-2.0-flash", latency_ms: 847}
    - {type: "error", message: "Budget limit reached. Showing database results only."}

DELETE /chat/sessions/{session_id} — delete session and all messages

**Service layer — create /app/services/chat_service.py:**

class ChatService:
    def __init__(self, llm_engine: LLMCorrelationEngine, query_router: QueryRouter,
                 cost_tracker: CostTracker, db):

    async def handle_message(self, session_id: str, content: str, org_id: str) -> AsyncGenerator[ChatEvent, None]:
        """
        Full message handling pipeline with streaming:

        1. Build QueryContext from current org state (open finding counts, etc.)
        2. Classify query using QueryRouter
        3. Emit routing event (so UI can show the routing decision immediately)
        4. For TIER 0: execute SQL, format results, emit immediately
        5. For AI tiers: stream response tokens as they arrive
        6. Track cost in BigQuery via CostTracker
        7. Persist ChatMessage to Cloud SQL with tier, cost, routing_reason
        8. Return final ChatAnswerResult
        """

    async def _build_query_context(self, org_id: str) -> QueryContext:
        """
        Snapshot of current org state for the router:
        - Open finding counts by severity
        - Compliance scores
        - Budget status
        - Last active session context (for follow-up question detection)
        """

    async def _extract_entity_references(self, query: str, org_id: str) -> list[str]:
        """
        Fast NER pass (TIER 1 model, <50ms) to extract asset names, CVE IDs,
        vendor names from the query for context loading.
        Only fires if query length > 20 chars and not a TIER 0 match.
        """

    def _format_tier0_response(self, sql_results: list[dict], original_question: str) -> str:
        """Format raw SQL results into a readable plain-English answer."""
        # E.g. "You have 3 critical, 12 high, 28 medium, and 45 low open findings."
        # Use templates rather than AI — this is the zero-cost path

**Streaming implementation:**
For Vertex AI (Gemini): use `generate_content_async(stream=True)` and yield each chunk
For Anthropic: use `stream=True` on `messages.create()` and yield from `text_stream`
For Bedrock: use `invoke_model_with_response_stream` and parse event stream

**Pre-built question suggestions:**
Return a GET /chat/suggestions endpoint that returns 6 suggested questions based on current org state:
- Always include 2 TIER 0 questions (fast database lookups)
- Always include 2 TIER 1 questions (quick summaries)
- Include 2 TIER 2/3 questions for deeper analysis
- Personalize based on top open findings and recent changes

Example suggestions:
- "How many critical findings are open right now?" (TIER 0)
- "Which assets are overdue on SLA?" (TIER 0)
- "Summarize my biggest risks this week" (TIER 1)
- "What changed in my compliance posture?" (TIER 1)
- "Do my dark web alerts relate to any open CVEs?" (TIER 2)
- "What should I prioritize fixing this sprint?" (TIER 3)

Write integration tests in /tests/api/test_chat.py:
- Test TIER 0 routing returns no AI cost
- Test streaming events arrive in correct order
- Test budget guard triggers downgrade correctly
- Test session history is persisted
```

---

## PHASE 5: FRONTEND APPLICATION

---

### Prompt 5.1 — Application Shell, Navigation & AI Settings

```
Build the Next.js frontend shell for the Virtual CISO platform.

Sidebar navigation (collapsible, dark theme):
- Dashboard
- vCISO Chat (NEW — primary user entry point, place near top)
- Findings (with critical badge count)
- Assets
- Threat Intelligence
- Vulnerabilities
- Supply Chain
- OSINT & Dark Web
- Controls & Coverage
- Compliance
- Gap Analysis
- Correlation Engine
- Reports
- Settings (with AI Provider sub-section)

Top bar:
- Organization name
- Global search
- AI cost indicator (shows today's AI spend vs budget — e.g., "$2.31 / $10.00")
- Notification bell (WebSocket-based)
- User avatar/menu

Design system (dark theme):
- Background: #0f1117
- Surface: #1a1d27
- Borders: #2e3348
- Accent: purple (#6c5ce7), teal (#00cec9), pink (#fd79a8), yellow (#fdcb6e), green (#55efc4), red (#ff6b6b)
- Text: #e4e6ef (primary), #8b8fa3 (secondary)

Reusable components: Card, Badge (severity), DataTable, StatCard, RiskScore gauge, StatusPill, Modal, Drawer, EmptyState, LoadingSkeleton.

NEW — AI Routing Indicator component:
- Small pill that shows the tier used for any AI-backed response
- TIER 0: gray "DB Search" pill
- TIER 1: green "Fast AI" pill with ~cost
- TIER 2: yellow "Standard AI" pill with ~cost
- TIER 3: orange "Deep AI" pill with ~cost
- Tooltip on hover: shows full routing reason, model used, actual cost

NEW — AI Settings Panel in /app/settings/ai:
Create a full settings page with:
1. AI Provider selector (dropdown):
   - Vertex AI (Gemini 2.5 Pro / Flash)
   - Anthropic Direct (Claude 3.7 Sonnet / Haiku)
   - AWS Bedrock (Claude 3.5 Sonnet / Nova Lite)
   Each option shows: estimated cost per query tier, latency rating, data residency note

2. Budget Configuration:
   - Daily budget input ($ per day)
   - Monthly budget input ($ per month)
   - Auto-downgrade toggle (when budget low, use cheaper models)
   - Alert webhook URL input (for Slack budget alerts)

3. Cost Dashboard (read-only):
   - Today's spend vs daily budget (progress bar)
   - This month's spend vs monthly budget
   - Spend by workflow (bar chart using recharts)
   - Queries by tier (donut chart: TIER 0 / 1 / 2 / 3 breakdown)
   - Average cost per query
   - Queries downgraded due to budget this month

4. Model Testing:
   - Send a test query to each tier
   - Shows actual latency and cost for the configured provider

Typed API client in /lib/api-client.ts with all endpoints typed from Pydantic schemas.
```

---

### Prompt 5.2 — Dashboard & Risk Overview

```
Build the main dashboard page at /app/dashboard.

Components:
1. Risk Score Gauge — large circular gauge showing overall org risk score (0-100)
2. Findings by Severity — row of 4 stat cards (Critical/High/Medium/Low) with 7-day trend
3. SLA Compliance Rate — percentage of findings resolved within SLA, trend
4. MITRE ATT&CK Heatmap — grid of techniques vs. coverage status (covered/partial/uncovered)
   Color: green = covered, yellow = partial, red = uncovered/gap
5. Top 5 Correlated Risks — ranked list with risk score, source workflows, and one-line explanation
6. Workflow Health Status — grid showing last run time and finding count per workflow

Data fetching: use SWR with 30-second revalidation for most widgets, WebSocket subscription for real-time finding count updates.

The Top 5 Correlated Risks widget shows a small AI Routing Indicator pill next to each explanation, showing what tier generated the correlation explanation.
```

---

### Prompt 5.3 — Findings Explorer & Detail

```
Build the findings pages:

/app/findings — Explorer page:
- DataTable with columns: Severity, Title, Source Workflow, Risk Score, Asset, SLA Status, Detected Date, Status
- Filter panel (sidebar): severity multi-select, workflow multi-select, status, date range, risk score slider
- Bulk actions: assign, change status, export to CSV
- Sort by risk_score by default
- Each row expandable to show brief summary

/app/findings/[id] — Detail page (or slide-over Drawer):
- Header: severity badge, title, risk score gauge, SLA countdown
- Tabs: Overview | Correlations | Assets | Evidence | Timeline | Remediation
- Overview: description, source, detection date, MITRE techniques
- Correlations: list of related findings with relationship type and explanation
  - Each correlation shows the AI Routing Indicator for how the correlation was generated
- Assets: all affected assets with links to asset profiles
- Timeline: chronological events (detected, correlated, triaged, assigned, etc.)
- Remediation: AI-suggested remediation steps (shows tier indicator — could be TIER 1 for standard remediations)
```

---

### Prompt 5.4 — Asset Risk Profile & Attack Path Visualizer

```
Build /app/assets/[id] — Asset Risk Profile page.

Sections:
1. Asset Header — name, type, environment, criticality, owner, business unit
2. Risk Score Breakdown — shows threat likelihood, vulnerability exposure, control effectiveness, business impact as gauge components
3. Open Findings — DataTable of all findings for this asset
4. Controls Coverage — which controls are deployed on this asset (with effectiveness scores)
5. Attack Path Visualization — interactive graph showing:
   - This asset as center node
   - All connected threat actors, vulnerabilities, and indicators
   - Path highlighting: red path = active exploit path, yellow = potential path
   Use React Flow (reactflow library) for the graph visualization
6. Blast Radius Preview — if compromised, what else can be reached (shown as concentric circles with asset names)

Data: fetched from GET /assets/{id}/risk-profile and GET /assets/{id}/blast-radius
```

---

### Prompt 5.5 — Compliance & Threat Intelligence Pages

```
Build:

/app/compliance — Compliance Overview:
- Framework cards with overall compliance % and trend
- Click a framework → requirements table with status, evidence status, mapped controls
- Cross-framework matrix: shared controls shown as overlap visual

/app/threats — Threat Intelligence:
- Active threat actors targeting org's industry (cards with sophistication indicator)
- IOC feed: recent indicators with match status (matched/unmatched against internal logs)
- MITRE ATT&CK coverage matrix: colored grid showing which techniques are defended
- Click a technique → shows which controls defend it, which threat actors use it

/app/vendors — Vendor Risk:
- Vendor table with risk scores, tier badges, assessment status
- Concentration risk chart: pie chart of which vendors serve critical functions
- Click a vendor → detail with SBOM findings, assessment history, contact info
```

---

### Prompt 5.6 — Correlation Explorer & Reports

```
Build:

/app/correlation — Correlation Engine Explorer:
- Rule list with enable/disable toggle, trigger count, false positive rate
- Attack paths list with path length, severity, affected assets
- Risk clusters visualization (force-directed graph using D3)
- Latest AI narrative (full text, with generation date and model used)
- Manual "Run Correlation" button (with cost estimate shown before executing — uses TIER 3)

/app/reports — Reports:
- Generate Executive Summary button (shows cost estimate: ~$0.25 for TIER 3 generation)
- Generate Board Deck button (PDF export — triggers TIER 3 narrative + layout)
- Pre-built trend charts for MTTR, risk score, SLA compliance (last 90 days)
- Scheduled report configuration: weekly digest, monthly board report (with next send date)
```

---

### Prompt 5.7 — vCISO Chat Interface

```
Build /app/chat — the primary vCISO conversational interface.

This page is the main way users interact with AI analysis. Design it like a professional security operations chat assistant.

Layout:
- Left sidebar (240px): session history list with session titles and timestamps
  - "New Chat" button at top
  - List of past sessions with last message preview
  - Each session shows a small cost badge (total cost for the session)
- Main area: chat messages
- Right sidebar (optional, 280px, collapsible): context panel showing current query context (open findings, budget status, suggested follow-ups)

Message display:
- User messages: right-aligned, dark background
- Assistant messages: left-aligned, with:
  - Small AI Routing Indicator pill at the top of each response
    - "DB Search" (gray) for TIER 0 — "Answered from database, $0.00"
    - "Fast AI · gemini-2.0-flash · $0.001" (green) for TIER 1
    - "Standard AI · claude-haiku · $0.018" (yellow) for TIER 2
    - "Deep AI · claude-sonnet-4-5 · $0.127" (orange) for TIER 3
  - For TIER 0: show the SQL query in a collapsible code block ("View query")
  - For AI responses: show model name and latency on hover
  - Markdown rendering for formatted responses
  - Tables rendered as proper HTML tables
  - Code blocks syntax-highlighted

Streaming UX:
- While AI is generating: show animated typing indicator first
- Then stream tokens with smooth character-by-character reveal
- Show routing decision immediately (before the answer arrives): "Routing to Fast AI (Gemini Flash)..."
- Cost shown in real-time as tokens arrive (estimate, updated to exact on done)

Input area:
- Large textarea (auto-expand, max 4 rows)
- Send button
- Keyboard shortcut: Enter to send, Shift+Enter for newline
- Below input: "Estimated tier: Fast AI (~$0.001)" shown as query is typed (updates after 500ms debounce using a classification preview endpoint)

Suggested questions panel (appears when chat is empty):
- 6 suggestion chips arranged in 2 columns
- Shows tier badge on each chip so user knows the cost before clicking
  Example: "How many critical findings? [DB Search]" vs "What's my biggest risk? [Deep AI]"

Session cost tracker:
- Floating badge in bottom-right: "Session: $0.034 / $10.00 daily budget"
- Progress bar turns yellow at 80%, red at 95%

Keyboard shortcuts:
- Cmd/Ctrl + K — open new chat
- Cmd/Ctrl + / — toggle suggestions
- Esc — clear input

Use SSE (Server-Sent Events) for streaming: connect to POST /chat/sessions/{id}/stream and parse the event stream.

Make the whole page work on mobile: sidebar becomes a bottom sheet on small screens.
```

---

## PHASE 6: CONNECTOR FRAMEWORK

---

### Prompt 6.1 — Connector Framework & GCP-Native Connectors

```
Create the production connector framework in /app/connectors/.

Base class /app/connectors/base.py:
class BaseConnector(ABC):
    connector_name: str
    required_config_keys: list[str]

    async def test_connection(self) -> ConnectionTestResult
    async def fetch_data(self, org_id: str, since: datetime) -> list[dict]
    async def get_schema(self) -> dict  # describes the shape of data returned

Connector registry in /app/connectors/registry.py:
- Stores connector configuration per org (encrypted in Secret Manager)
- Provides get_connector(org_id, connector_name) factory

Implement GCP-native connectors (real API integration):

1. GCPSecurityCommandCenterConnector
   - Use google.cloud.securitycenter_v1 async client
   - Auth: Application Default Credentials (works automatically in Cloud Run)
   - Fetch active findings from SCC Premium
   - Support incremental sync: only findings updated_time > last_sync

2. ChronicleConnector
   - Use Chronicle UDM Search API (REST)
   - Auth: Service account credentials from Secret Manager
   - Search for IOC matches: POST https://backstory.googleapis.com/v2/udm/searches
   - Support asset lookup: which assets communicated with threat IPs

3. GCPCloudAssetInventoryConnector
   - Use google.cloud.asset_v1 async client
   - Fetch all resources via SearchAllResources
   - Support organization-level or project-level scope

4. GCPIAMPolicyAnalyzerConnector
   - Use google.cloud.policy_analyzer_v1 async client
   - Find all effective IAM policies granting access to resources

5. GCPArtifactRegistryConnector + GCPContainerAnalysisConnector
   - Use google.cloud.artifactregistry_v1
   - Use google.cloud.containeranalysis_v1 for vulnerability occurrences on images

6. GCPOrganizationPolicyConnector
   - Use google.cloud.orgpolicy_v2 async client
   - Check constraints on all projects

7. GCPRecommenderConnector
   - Use google.cloud.recommender_v1 for IAM recommender output
   - Surfaced unused roles and excess permissions

Each connector: retry logic with exponential backoff, rate limiting, error classification (retryable vs. permanent), Cloud Logging for all API calls, metrics published to Cloud Monitoring.

Also stub out (config + schema only, no real API calls yet):
- QualysConnector
- CrowdStrikeConnector
- WizConnector
- SnykConnector
- RecordedFutureConnector
- OktaConnector
```

---

## PHASE 7: TESTING & DEMO DATA

---

### Prompt 7.1 — End-to-End Tests & Demo Data Generator

```
Create a comprehensive test suite and a realistic demo data generator.

E2E Tests in /tests/e2e/:
1. test_full_workflow_run.py — run all 9 workflows end-to-end with sample data, verify Findings created correctly
2. test_correlation_pipeline.py — inject sample findings, verify correlation rules fire, verify graph patterns detected
3. test_chat_routing.py — send 10 diverse questions, verify each routes to the expected tier
4. test_ai_cost_tracking.py — run AI calls across all tiers, verify costs recorded in BigQuery
5. test_budget_guard.py — set budget to $0.01, verify all AI calls get downgraded to TIER 0
6. test_pubsub_integration.py — publish mock finding events to emulator, verify correlation consumer processes them
7. test_compliance_scoring.py — verify compliance scores update correctly when findings are created/resolved

Integration tests in /tests/integration/:
- test_ai_provider.py — test each configured provider (mock responses)
- test_graph_queries.py — test all Neo4j Cypher queries against local Neo4j instance
- test_cost_tracker_bigquery.py — verify BigQuery writes work correctly

Demo Data Generator at /scripts/generate_demo_data.py:

Generates a realistic 90-day security scenario for a fictional company "AcmeCorp" (fintech, 500 employees):
- 150 assets (50 GCP, 30 AWS, 20 SaaS, 25 servers, 25 endpoints)
- 8 vendors (2 Tier 1, 3 Tier 2, 3 Tier 3) with mixed assessment statuses
- 350 vulnerabilities with realistic CVE distribution
- 4 threat actors targeting fintech sector with MITRE TTPs
- 75 threat indicators with 8 IOC matches on internal assets
- 25 OSINT findings (3 credential exposures, shadow IT)
- 12 dark web findings (1 access sale, 2 data leaks)
- 15 security controls (90% endpoint coverage, 60% network coverage, gaps in cloud)
- 3 compliance frameworks with 60% average compliance
- 30 correlated findings (2 critical attack paths, 5 credential chain risks)

The demo data should tell a coherent security story: a campaign by "FIN7-adjacent" actor targeting a known fintech CVE, with an exposed credential that chains to a critical payment processing asset.

Run with: python scripts/generate_demo_data.py --org-id demo --reset
```

---

## PHASE 8: CLOUD DEPLOYMENT (TERRAFORM + CLOUD RUN)

---

### Prompt 8.1 — Terraform Infrastructure

```
Create the complete Terraform infrastructure in /infrastructure/terraform/ for deploying the Virtual CISO platform on GCP.

/infrastructure/terraform/main.tf — provider config, project-level settings
/infrastructure/terraform/variables.tf — all variables with descriptions and defaults
/infrastructure/terraform/outputs.tf — service URLs, connection strings (references to Secret Manager)

Module: /infrastructure/terraform/modules/cloud-run/
- Cloud Run service with min_instances=1 for backend
- Cloud Run service for frontend
- Cloud Run service for Pub/Sub correlation worker
- Service accounts for each with minimum IAM permissions
- Environment variables from Secret Manager via valueFrom
- CPU and memory limits (backend: 2 CPU / 2GB, worker: 1 CPU / 1GB)
- VPC connector for private Cloud SQL access
- Cloud Armor security policy (rate limiting + WAF rules)

Module: /infrastructure/terraform/modules/cloud-sql/
- Cloud SQL PostgreSQL 16 instance (db-g1-small for dev, db-n1-standard-2 for prod)
- Private IP only (no public IP)
- Automatic backups (daily, 7 days retention)
- Read replica for prod
- Database + user creation
- IAM database authentication enabled

Module: /infrastructure/terraform/modules/neo4j-aura/
- Note: Neo4j Aura is provisioned via GCP Marketplace, not Terraform directly
- Create Secret Manager secrets for connection details
- Create a placeholder that outputs instructions for manual Aura provisioning
- Document: "Go to GCP Marketplace → Neo4j Aura → Subscribe → Create instance → paste credentials into Secret Manager"

Module: /infrastructure/terraform/modules/pubsub/
- Topics: findings-events, correlation-triggers, ai-budget-alerts, realtime-updates, findings-events-dead-letter
- Subscriptions with push configs pointing to Cloud Run service URLs
- IAM bindings: Cloud Run service accounts as Pub/Sub subscribers

Module: /infrastructure/terraform/modules/bigquery/
- Dataset: vciso_analytics
- Tables: ai_query_costs, finding_events, audit_log_export (partitioned by day)
- Scheduled queries: daily cost aggregation, weekly trend computation
- IAM: service account with bigquery.dataEditor role on dataset

Module: /infrastructure/terraform/modules/memorystore/
- Redis 7 instance (1GB, private IP)
- VPC peering config

Module: /infrastructure/terraform/modules/iam/
- Service accounts: backend, frontend, worker, bigquery-writer, scc-reader
- Roles per service account with principle of least privilege
- Workload Identity bindings for Cloud Run → GCP APIs (eliminates need for key files)

Enable APIs in main.tf:
- run.googleapis.com, sql-component.googleapis.com, sqladmin.googleapis.com
- pubsub.googleapis.com, bigquery.googleapis.com, redis.googleapis.com
- secretmanager.googleapis.com, cloudscheduler.googleapis.com
- securitycenter.googleapis.com, cloudasset.googleapis.com
- artifactregistry.googleapis.com, containeranalysis.googleapis.com

Create /infrastructure/terraform/environments/:
- dev.tfvars — small instances, single region, no read replicas
- staging.tfvars — medium instances
- prod.tfvars — high availability, multi-region, read replicas

Include detailed README with deployment sequence and estimated monthly costs.
```

---

### Prompt 8.2 — Cloud Build CI/CD Pipeline

```
Create /infrastructure/cloudbuild/cloudbuild.yaml for the full CI/CD pipeline.

Pipeline stages:

1. Test (parallel):
   - Backend: pip install, pytest with coverage, fail if <80% coverage
   - Frontend: pnpm install, jest, fail if tests fail

2. Build:
   - Backend: docker build, tag as {REGION}-docker.pkg.dev/{PROJECT_ID}/vciso/backend:{SHORT_SHA}
   - Frontend: docker build, tag as {REGION}-docker.pkg.dev/{PROJECT_ID}/vciso/frontend:{SHORT_SHA}
   - Worker: docker build, tag as {REGION}-docker.pkg.dev/{PROJECT_ID}/vciso/worker:{SHORT_SHA}

3. Push: push all three images to Artifact Registry

4. Deploy (sequential):
   - gcloud run deploy vciso-backend --image ... --no-traffic (new revision, zero traffic)
   - gcloud run deploy vciso-frontend --image ...
   - gcloud run deploy vciso-worker --image ...
   - Run smoke tests against --no-traffic revisions
   - If smoke tests pass: gcloud run services update-traffic vciso-backend --to-latest

5. Notify: Slack notification on success or failure (use Cloud Build trigger with Pub/Sub notification)

Create Cloud Build trigger (via Terraform):
- Trigger on push to `main` branch → deploy to production
- Trigger on push to `develop` branch → deploy to staging
- Trigger on pull request → run tests only, no deploy

Create /infrastructure/cloudbuild/smoketest.sh:
- Hit /health endpoints on all services
- Create a test org via API
- Run a test workflow
- Send a test chat message (TIER 0 only — no AI cost in smoke tests)
- Verify cost tracker recorded the session
- Delete test org
```

---

### Prompt 8.3 — Notifications, Alerts & Final Quality Pass

```
Finalize notifications and run a quality pass on the full platform.

Notification system using Cloud Run services:

1. /app/services/notifications/slack_notifier.py
   - Send findings to Slack channels based on severity
   - Slack Block Kit format with severity emoji, risk score, and direct link
   - Rate limiting: max 10 Slack messages per minute per org

2. /app/services/notifications/pagerduty_notifier.py
   - PagerDuty Events API v2
   - Only for Critical severity findings
   - Include dedup_key based on finding.id to prevent duplicate alerts

3. /app/services/notifications/jira_notifier.py
   - Jira Cloud REST API
   - Create issue for High+ findings
   - Map severity to Jira priority
   - Include finding link and correlated findings list

4. /app/services/notifications/budget_alert_notifier.py
   - Triggered by Pub/Sub ai-budget-alerts topic
   - Sends Slack message: "⚠️ AI budget at 80% ($8.00 of $10.00 daily limit). Auto-downgrade enabled."
   - Sends to configured webhook URL from OrgAIBudget.alert_webhook_url

Quality pass checklist (implement fixes for any of these found):
- All async database operations use async sessions (no blocking calls)
- All Pub/Sub publish calls are fire-and-forget (don't block API response)
- All AI calls have timeout set to 30 seconds max
- Structured logging everywhere: use Google Cloud Logging format (JSON with severity, trace_id)
- All secrets fetched from Secret Manager (no hardcoded credentials)
- All Cloud Run services have liveness and readiness probes
- BigQuery writes are batched (not per-row) using InsertRowsResponse buffering
- Neo4j queries use parameterized Cypher (no string interpolation)
- All API endpoints return correct HTTP status codes (no 200 on error)
- Rate limiting enforced on all AI-backed endpoints
- CORS headers configured correctly for Cloud Run domains

Final: create a RUNBOOK.md in the project root documenting:
- How to add a new AI provider (3 steps: add to AIProvider enum, implement _complete_xxx method, add pricing entry)
- How to adjust budget limits per org
- How to add a new correlation rule
- How to enable/disable a workflow
- How to run the correlation pipeline manually
- Cost optimization tips: what to switch off to reduce monthly bill to minimum
```

