# Virtual CISO Platform - Technical Specification & Manifest

This document serves as the master tracking ledger for all features, capabilities, and the architectural blueprint required to reconstruct the Virtual CISO platform. It defines the explicit Features, Database Schemas, API Contracts, Frontend State Architecture, and Infrastructure configurations.

*Note: All AI agents working in this repository are required to update this document whenever building a new feature or making structural/architectural changes to the codebase. You MUST include the current date (e.g., `[2026-03-27]`) next to any new or modified entries so we can generate release notes.*

---

## 1. Features & Active Modules Tracking

*This section tracks all active capabilities built into the platform since inception.*

### Core Platform Features
*   **Executive Dashboard:** Aggregates real-time risk scores, compliance posture, and urgent security tasks into a unified command center.
*   **Risk & Findings Management:** Dynamic vulnerability tracking system that ingests security logs and allows users to triage, resolve, or accept risks. Handles Jira/ServiceNow ticket creation.
*   **Risk Register:** Formal operational ledger for documenting, approving, and tracking accepted business risks with expiration dates.
*   **Compliance Automation:** Automated auditing against global frameworks (SOC2, ISO27001, HIPAA) by evaluating live security controls and cloud telemetry. Includes Gap Analysis reporting.
*   **Vendor Risk Assessments:** AI-driven continuous background checks tracking the security posture of third-party suppliers. Automatically synchronizes with the internal Company footprint via the `POST /sync` route to implicitly onboard internal technological software as formally tracked Vendor Risk entities. It utilizes an intelligent `infer_tech_stack` function to dynamically map vendors to tech categories, and applies a lazy automated daily risk drift calculation to predict threat streams and auto-assign risk scores.
*   **Audit Trail:** Immutable, cryptographic logging of all user and system administrative actions.
*   **My Company & Asset Inventory:** Centralized modeling of the organization's technical footprint, cloud providers, and active infrastructure.
*   **Global Error Tracking:** Centralized telemetry system that silently captures and routes all unhandled frontend crashes and backend 500 exceptions to a secured database ledger for engineering review.

### Threat Operations Features
*   **Cyber Threat Analyzer:** Advanced correlation engine mapping global threat actor activity and zero-days against the organization's technical footprint. Contains highly optimized nested interactivity (e.g., targeted `(i)` hover tooltips) minimizing UI bloat while mapping complex data directly into the AI Control Tower.
*   **Threat Intelligence:** Early-warning radar monitoring global cyber campaigns, dark web chatter, and emerging vulnerabilities. Includes STIX/TAXII ingestion capabilities and supports the interactive promotion of threat indicators directly into formally tracked Findings within the Risk Engine.
*   **Threat Modeler:** Explicit workflow interface for dynamically analyzing system architectures to predict and mitigate potential vulnerabilities before deployment.
*   **Continuous Security Testing (Simulator & Pentest):** Automated ethical hacking simulations executed against the attack surface. Translates unstructured topological adversarial sequences into a high-density, strictly formatted **Native Attack Path Timeline** (DOM-based Tailwind React elements acting identically to Threat Findings layout) to avert chaotic Force Graph physics entirely.
*   **Playbooks:** Interactive, step-by-step incident response and remediation guides.
*   **Control Tower AI:** A context-aware LLM assistant (slide-out drawer) capable of generating specialized security queries and reasoning over the organization's unique data graph.
*   **Dedicated Workflows:** Specialized operational pipelines for OSINT gathering, Dark Web credential scraping, Infrastructure Scanning, and Vulnerability Lifecycle Management.

### Settings, Integrations & Administration
*   **Integrations Hub:** Configurable webhooks and bi-directional synchronizations with Slack, Jira, and ServiceNow.
*   **AI Settings & Budgeting:** Interface for administrators to select their preferred active LLM provider (e.g., OpenAI, Anthropic), input API keys, and enforce monthly USD spend limits.
*   **Role-Based Access Control (RBAC):** Tiered user permissions (Admin, Editor, Viewer) dynamically shaping the UI and API access points.
*   **Subscription & Billing:** Tracking and enforcement of organization subscription tiers (Basic, Professional, Enterprise).

---

## 2. Database Schema Definitions (SQLAlchemy & PostgreSQL)

The backend utilizes `SQLAlchemy` ORM. All models inherit from a common `BaseModel` featuring UUIDs and timestamps.

### Core Identity & Access
*   **Organization:** `id`, `name`, `industry`, `gcp_project_id`, `subscription_tier`.
*   **User:** `firebase_uid`, `email`, `role`, `org_id` (FK). Centralized identity mapped via Firebase.
*   **OrgAIBudget:** Tracks LLM API spending (`daily_limit_usd`, `active_provider`, `alert_webhook_url`).

### Risk & Asset Inventory
*   **Asset:** `asset_type`, `environment`, `business_criticality`, `data_classification`, `metadata_data` (JSON).
*   **Vendor:** `tier`, `data_access_level`, `risk_score` (0-100, where 100 is safe and 0 is critical), `tech_stack` (JSON).
*   **Finding:** 
    *   *Core:* `finding_type`, `severity`.
    *   *Context:* `risk_score`, `source_workflow`.
    *   *State:* `status` (new, reviewed, triaged, in_progress, resolved, accepted), `assigned_to`.
    *   *Relations:* `affected_asset_ids` (JSON), `mitre_techniques` (JSON).
*   **RiskRegister:** Formal risk acceptance ledger (`risk_level`, `risk_categories`, `action_plan`, `expiration_date`).

### Threat Operations & Correlation
*   **ThreatActor:** `sophistication`, `target_industries`, `motivation`.
*   **ThreatIntelIndicator:** `indicator_type`, `value`, `confidence`, `severity`, `valid_until`.
*   **Vulnerability:** `cve_id`, `cvss_base_score`, `epss_score`, `kev_listed` (Boolean), `affected_asset_id` (FK).
*   **CorrelationRule:** `graph_query`, `datasets_combined`, `confidence_threshold`, `enabled`.

### Compliance & Telemetry
*   **ComplianceFramework:** `framework_name`, `overall_compliance_pct`.
*   **SecurityControl:** `effectiveness_score`, `mitre_techniques_covered`, `status`.
*   **AuditLog:** Immutable ledger logging `actor`, `action`, `entity_type`, `changes` (JSON).
*   **InternalBugLog:** Centralized repository for tracking unhandled backend 500s and frontend crashes (`error_message`, `stack_trace`, `url`, `status`).
*   **AIQueryLog & ChatMessage:** Tracking LLM interactions (`cost_usd`, `input_tokens`, `prompt_tier`, `routing_reason`).

---

## 3. API Architecture (FastAPI Backend)

The backend is built on **FastAPI** (v0.1.0) and uses standard async request handling.

### Global Middleware & Security
1.  **Firebase Auth Dependency:** All routes (except `/bugs` and `/health`) require a valid Firebase ID Token intercepted by the `Depends(get_current_user)` injection.
2.  **Rate Limiting:** `SlowAPIMiddleware` limits bursts per IP globally to prevent automated scraping.
3.  **Security Headers:** Injects `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.
4.  **CORS:** Explicitly allows `localhost` and specific Firebase/Cloud Run front-end domains.

### Core API Routers (`/api/v1/*`)
*   **`dashboard.py` & `reports.py`:** Aggregates macro-level metrics and orchestrates PDF/CSV report generation. The dashboard explicitly calculates the Overall Cyber Health Score on an inverted scale (0-100, where 100 represents perfect security).
*   **`findings.py`:** Paginated GET requests `?limit=50&offset=0&severity=high`. Includes specialized POST actions like `/{id}/assign`, `/{id}/accept-risk` (which runs AI categorization heuristics to promote a finding), and `/{id}/ticket` (ServiceNow/Jira).
*   **`risk_register.py`:** Manages the formalized business risk ledger. Includes extend expiration actions and `/{id}/revert` to transition risks back into findings.
*   **`simulator.py` & `pentest.py`:** Endpoints triggering ethical hacking workflows and fetching payload results.
*   **`correlation_graph.py`:** Executes complex Graph traversal queries comparing `Assets` + `Vulnerabilities` + `ThreatActors` to generate attack paths.
*   **`chat.py` & `ws.py`:** Handles the 'Control Tower' AI assistant (Text generation and WebSocket streaming responses).
*   **`compliance.py`:** Validates `SecurityControls` against specific `ComplianceRequirements` to generate readiness scores.
*   **`threat_intel.py`:** Ingestion webhooks for receiving STIX/TAXII feeds and managing subscriptions.
*   **`workflows.py` & `playbooks.py`:** Orchestrates step-by-step UI processes and predefined remediation pipelines.
*   **`integrations.py` & `ai_settings.py`:** Handles third-party system handshakes and LLM credential storage.
*   **`organizations.py`, `users.py`, `tiers.py`, `billing.py`, `vendors.py`:** Administrative scaffolding, tenant management, and automated third-party technology synchronization (`/sync`). `vendors.py` includes AI-driven tech stack inference (`infer_tech_stack`) and daily lazy risk drift assessments.
*   **`bugs.py`:** Provides the `/api/v1/bugs/report` ingestion endpoint to securely receive crash payloads.

---

## 4. Frontend Architecture (Next.js & React)

Built on **Next.js (App Router)** utilizing a heavily modular Tailwind CSS component structure.

### Context Providers (Global State)
*   `AuthProvider`: Centralizes Firebase initialization and state. Exports `signInWithGoogle()`, `signInWithMicrosoft()`, `getToken()`. It natively implements a **hybrid authentication flow** (`signInWithPopup` gracefully falling back to `signInWithRedirect`) to bypass Safari/Incognito third-party cookie restrictions. Handles simulated mode fallback for local development.
*   `RoleContext`: Interprets the active user's role (admin, viewer) and selectively mounts or disables sensitive UI components.
*   `ControlTowerContext`: Manages the state of the right-hand AI slide-out drawer across all routes. Contains context-aware query generation based on the current page (`window.location.pathname`).
*   `GlobalErrorTracker` (`lib/errorTracking.ts`): Injected directly into the `RootLayout` to silently monitor `window.onerror` and unhandled promise rejections, streaming raw crash data to the backend.

### Layout & Routing
*   **Root Layout (`/layout.tsx`):** Wraps all routes in `AuthGuard` (redirects unauthenticated users to `/login`) and `OnboardingGuard` (redirects authenticated but unconfigured users to `/setup`).
*   **Global AppHeader:** Dynamically resolves and mounts unified page titles directly into the global header using `lib/route-titles.ts`, officially deprecating localized, hardcoded page headers to optimize vertical layout density across the platform.
*   **Main Modules:**
    *   `/dashboard`: Aggregates `/api/v1/dashboard` metrics.
    *   `/findings/[id]`: Interactive investigation view displaying Root Cause Analysis and Remediation steps.
    *   `/compliance`, `/vendor-risk`, `/threat-intel` (with dedicated criminal dossier sub-routes at `/threat-intel/actors/[id]`), `/playbooks`, `/simulator`, `/correlation`, `/risk-register`, `/audit-trail`, `/company`.
    *   `/workflows/*`: Contains dedicated interfaces for `threat`, `darkweb`, `osint`, `infrastructure`, and `vulnerability` processes.
    *   `/settings/*`: Granular management pages for Integrations, AI configurations, SLAs, and Users.

### Separate Repositories
*   **Admin Portal (`/admin-portal`):** Dedicated Vite/React application (deployed to `gen-lang-client-0873796692.web.app`) for internal vCISO staff. It contains dashboards for Customer Management, Tier Assignments, Revenue Reports, and real-time **System Error Logs** (`/bugs` route) tied into the global database telemetry.

### UI & Core Dependencies
*   **Styling & Theming:** Uses Tailwind CSS v4, globally configured via `app/globals.css`. It strictly defines all app colors via CSS variables (`--background`, `--popover`, `--card`, etc.) in standard `:root` and `.dark` blocks, and maps them to utility colors inside the `@theme inline` directive to maintain uniform styling across custom components (like contextual tooltips).
*   **Interactivity:** Heavy utilization of `lucide-react` for dynamic, context-aware icons, and built-in Tailwind `group/tooltip` utility classes for conveying nested logic metadata. Heavily integrates a unified accessible **Pill Tabs** component (`src/components/ui/tabs.tsx`) across Threat Operations (`/threat-intel`, `/correlation`, `/simulator`) and Console modules (`/company`) to partition high-density data flows and minimize vertical scrolling.

---

## 5. Infrastructure & Deployment (GCP Cloud Build)

The CI/CD pipeline is strictly enforced via `cloudbuild.yaml` running on Google Cloud Platform.

1.  **Testing Phase:** Executes `pytest` (Backend) and `jest` (Frontend) on Node 20 and Python 3.12 containers.
2.  **Containerization:** Builds isolated Docker images for both `backend` and `frontend`.
3.  **Artifact Registry:** Pushes images to `${_REGION}-docker.pkg.dev/${PROJECT_ID}/vciso/`.
4.  **SDLC Vulnerability Scanning:** Executes `gcloud artifacts docker images scan` on the backend container. Fails the build if `CRITICAL` or `HIGH` OS-level vulnerabilities are detected by Security Command Center (SCC).
5.  **Deployment:** Follows Blue-Green deployment to **Google Cloud Run** for serverless, auto-scaling execution.
6.  **Notification:** Dispatches deployment status to internal Slack channels.

*End of Technical Specification.*

---

## 6. Changelog & Release Notes

*Track significant feature additions, architectural changes, and bug fixes below, tagged with the date of the change.*

*   **[2026-03-27]** Synchronized Dashboard metrics: updated the `/attention` endpoint to utilize unified `active_statuses` DB filtering identical to the core Findings widget, preventing artificial inflation from dummy records.
*   **[2026-03-27]** Fixed Risk Over Time chart plotting: Rewrote the `GET /api/v1/dashboard/trends` endpoint to anchor the visual timeline precisely to the true dynamic `overall_risk_score` calculation rather than hardcoded baselines.
*   **[2026-03-27]** Implemented a dedicated "Threat Actor Dossier" (Criminal Rap Sheet) page at `/threat-intel/actors/[id]` for deep-dive analysis of threat actor vitals, warrants, and evidence logs.
*   **[2026-03-27]** Deployed an "Intel Summary" aggregation dashboard tab to the Threat Intel page to display a high-level grid of active actors, critical signals, and real-time intelligence priority metrics.
*   **[2026-03-27]** Remounted the global `NewsTicker` to fixedly span the absolute full width of the bottom viewport, stretching underneath both the primary content area and the application navigation sidebar to ensure uninhibited visibility.
*   **[2026-03-27]** Added "Intel Briefing" Report Tab to the Cyber Threat Analyzer, allowing executives to view an aggregated summary of active external threats correlated directly to their current tech stack.
*   **[2026-03-27]** Refactored the Security Testing dashboard layout into a modular Tab component (Assessment Overview, Attack Path Topology, Discoveries) for cleaner threat path analysis.
*   **[2026-03-27]** Rebranded "Vendor Risk" to "Ecosystem Risk" throughout the platform UI, navigating schema, and table nomenclatures to reflect broader supplier supply chain tracking.
*   **[2026-03-27]** Implemented Ecosystem Risk hierarchical data modeling: Added `parent_vendor_id` and `vendor_type` to `Vendor` database model to distinguish Vendors from Products. Auto-assignment logic parses technical components (e.g. S3) and groups them visually under parent Vendors (e.g. AWS) on the frontend table layout.
*   **[2026-03-27]** Increased the scrolling animation speed of the global Threat Intelligence News Ticker (`tailwind.config.ts`) to improve readability of streaming vulnerability telemetry.
*   **[2026-03-27]** Standardized platform UI layout: Transitioned all main application modules and settings pages to utilize `AppHeader` as the single source of truth for page titles, stripping redundant local `<h1>` headers. Applied unified `max-w-7xl` or `max-w-6xl` containers across modules.
*   **[2026-03-27]** Added Changelog section to track platform changes for release notes.
*   **[2026-03-28]** Modernized System Error Management in the Admin Portal: Implemented dynamic client-side telemetry enrichment to categorize raw bug logs into Priority, Severity, and Error Type. Added interactive filter dropdowns and sortable table headers.
*   **[2026-03-28]** Renamed the Admin Portal deployment script from `admin-portal/deploy.ps1` to a root-level `deploy_admin.ps1` for standardized CI/CD orchestration.
*   **[2026-03-28]** Resolved Dashboard API routing issues leading to frontend 404 errors by verifying backend route configurations and environment variable pointers.
*   **[2026-03-28]** Added "Recent Events & Chatter" log to the Threat Actor Dossier page, injecting dynamically generated threat signals contextualized by the `/api/v1/threat-intel/actors` API route.
*   **[2026-03-28]** Enhanced Intelligence Summary dashboard interactivity by making top-level KPI metric cards clickable, allowing localized tab state navigation.
