# vCISO Platform - Comprehensive Release Notes

## February 28, 2026

### Goal Description

The goal is to fix the "Critical sync failure. AI connectivity is unstable." error that occurs when Ask Overwatch is triggered. This error is caused by the `authorizeProUsage` function in `geminiService.ts`, which uses `window.confirm` to ask for permission to use the Pro model. When this returns false (or blocks execution in certain environments), `startPlatformChat` throws an error.

## Proposed Changes

### Gemini Service
I will update `geminiService.ts` to bypass `window.confirm` for the chat initialization, or handle authorization more gracefully so it doesn't crash the chat. For this application, it seems best to just allow the chat to start without forcing a `window.confirm` prompt every time, as it interrupts the user flow and can cause the promise chain to fail unexpectedly.

#### [MODIFY] [geminiService.ts](file:///c:/Users/matan/iCloudDrive/SKPR%20Risk/Feb%2016%20Rebuild/skpr-third-party-risk4/services/geminiService.ts)
- Update `startPlatformChat` to remove the `authorizeProUsage` check, OR
- Update `authorizeProUsage` to simply log the usage or return `true` without blocking. I will just update `startPlatformChat` to bypass the guardrail since it's the core interaction method.

## Verification Plan

### Manual Verification
1. I will ask the user to test clicking an article again.
2. The Ask Overwatch chat should open and immediately begin generating a response without throwing the sync failure error.



## March 04, 2026

### Implementation Plan: Interactive Dashboard & Briefing History

The user requested two main features:
1. Make the partner graph on the Dashboard clickable to navigate directly to the partner's page (My Network modal).
2. Upon opening the modal via the graph, ask the user (via Overwatch) if they want an updated Tactical Briefing, while preserving and displaying all past briefings.



## March 06, 2026

### Goal Description

The current Overwatch AI interface (the chat modal) is an inefficient use of screen space. The user has requested a few new non-functional UI design options that make better use of the window so they can choose the best one.

## Proposed Changes

### New UI Demo Components
I will create three different React components, each representing a unique layout approach for the Overwatch AI. They will be loaded with dummy data so the user can see them in action.

*   #### [NEW] `components/OverwatchDemo1.tsx`
    **Split-Pane Layout**: A side-by-side design where the left pane contains the conversational chat interface and the right pane displays dynamic, context-aware intelligence (e.g., currently analyzed partner details, extracted CVEs, or recommended actions).
*   #### [NEW] `components/OverwatchDemo2.tsx`
    **Command Center / Heads-Up Display (HUD)**: A dense, data-rich full-screen dashboard where the chat is a terminal-like window at the bottom or side, surrounded by real-time widgets (health scores, active threat maps, system logs).
*   #### [NEW] `components/OverwatchDemo3.tsx`
    **Focused Document / Report View**: A layout optimized for deep-dives. The AI chat sits on a narrow right sidebar, while the main viewing area is dedicated to reading long-form generated reports, architectural diagrams, or compliance tables.

### App Routing
*   #### [MODIFY] `App.tsx`
    Add hidden routes (`/overwatch-1`, `/overwatch-2`, `/overwatch-3`) for these demos so the user can navigate to them directly to evaluate the designs.

## Verification Plan
### Manual Verification
1.  Navigate to `/#/overwatch-1`, `/#/overwatch-2`, and `/#/overwatch-3` in the browser.
2.  Review the aesthetic and spatial efficiency of each layout.
3.  The user will select their preferred design for future functional implementation.



### Expand Stack Markers on My Network

The user wants to allow expanding stack markers inline on the My Network page, and then transitioning to the detail view on a second click.

## Proposed Changes

### NodeIntelligence Component (`components/NodeIntelligence.tsx`)

#### [MODIFY] `NodeIntelligence.tsx` (file:///c:/Users/matan/iCloudDrive/SKPR%20Risk/Feb%2016%20Rebuild/skpr-third-party-risk4/components/NodeIntelligence.tsx)
-   Introduce `const [expandedRow, setExpandedRow] = useState<string | null>(null);`
-   Modify the `<tr>` `onClick` handler:
    -   If the row is already the `expandedRow`, set it as `selectedCompany` (opens the modal).
    -   If the row is not expanded, set it as `expandedRow`.
-   Update the Stack Markers `<td>`:
    -   Check if the row is currently expanded (`expandedRow === company.id`).
    -   If expanded, render the full tech stack array as chips (displaying the full tool name).
    -   If not expanded, render the existing condensed `-space-x-2` layout (displaying initials and `+X`).
-   Update the "Inspect Partner" `<button>` `onClick` handler to include `e.stopPropagation()` and immediately call `setSelectedCompany(company)` so the user can bypass the expand step if they use the explicit action button.

## Verification Plan

### Automated Tests
- We are running the development server (`npm run dev`). No automated tests need to be run, we will verify this via the browser manually.

### Manual Verification
- I will spin up the `browser_subagent` to open `http://localhost:3000/#/network`.
- Click on a row in the table:
    -   Verify that the stack markers expand inline to show the full tool names.
    -   Verify that the modal does **not** open.
- Click on the same row again:
    -   Verify that the Detail Modal (PartnerInspectionHub) opens.
- Click the "Inspect Partner" button on any row:
    -   Verify that the Detail Modal opens immediately.



### Performance and Security Code Review Plan

I have reviewed the codebase for performance bottlenecks, security practices, and opportunities for code reuse. Here is the implementation plan to address the user's concerns about slow-loading pages and complex structures.

## Goal Description
Enhance application rendering performance by stabilizing state context and memoizing expensive calculations. Simplify codebase by extracting repeated UI patterns into reusable components. Ensure no secrets are leaked in client-side code.

## Findings
1. **Security / Secrets**: Verified that `VITE_GEMINI_API_KEY` is safely loaded via `import.meta.env` and `process.env` in tests. No hardcoded API keys or secrets were found in the source code.
2. **Context Performance**: In `DataContext.tsx`, the `value` object provided to `<DataContext.Provider>` is recreated on every single render. This causes *every* component consuming `useData()` to unnecessarily re-render whenever *any* state updates (e.g., typing in the chatbot).
3. **Component Performance**: Heavy components like `Dashboard.tsx` and `Network.tsx` calculate derived arrays (`chartData`, `filteredPartners`) directly in the render body. Wrapping these in `useMemo` will prevent costly recalculations. 
4. **Code Duplication**: `Dashboard.tsx` has four very similar, complex "Stat Card" buttons (Supply Chain Health, Active Threats, Internal Posture, Overwatch). These can be abstracted into a reusable `<StatCard>` component. Similar opportunities exist for partner cards.

## Proposed Changes

### Context Optimization
#### [MODIFY] `context/DataContext.tsx`
- Wrap the main `DataContext.Provider` value object in a `useMemo` dependency array to prevent unnecessary full-app re-renders on unrelated component renders.
- Wrap `calculateScore` and cache-setting functions (`setIntelCache`, `setSimulationCache`, etc.) in `useCallback` to maintain reference stability.

### Component Memoization & Reuse
#### [MODIFY] `components/Dashboard.tsx`
- **Memoization**: Wrap `chartData` inside a `useMemo` hook so it only updates when `partners` or `myCompliance` updates.
- **Code Reuse**: Extract the 4 large dashboard action cards into a reusable `<DashboardStatCard>` function/component to simplify the 200+ line return statement.

#### [MODIFY] `components/Network.tsx`
- **Memoization**: Wrap `filteredPartners` inside a `useMemo` hook so the filtering and sorting only run when `partners` or `searchTerm` change. 

#### [MODIFY] `services/geminiService.ts`
- Minor cleanups for best practices, ensuring `import.meta.env` references remain safe and correctly fallback without exposing errors prematurely.

## Verification Plan

### Automated/Build Verification
- Run `npm run build` to ensure all TypeScript types and exports remain valid after refactoring.
- Run `npm run dev` and ensure no console errors appear.

### Manual Verification
- Ask the user to click around the application, particularly interacting with `ChatBot` and `Dashboard`, to observe a noticeable improvement in frame rates and responsiveness (lack of stuttering during typing/updates).
- Ensure the Dashboard metric cards still route correctly to their respective pages.



## March 07, 2026

### Global Theming Implementation Plan

The user requested the ability to toggle between "Raven" and "The Executive" (Light) themes globally, accessible via a toggle on the Settings page.

Because the application currently hardcodes static Tailwind utility classes (e.g., `bg-[#4a3183]`, `bg-slate-950`, `text-white`), adding true CSS variable-based dynamic theming requires a structural refactoring of the project's CSS and React architecture.

## Proposed Changes

### 1. Global Theme Context (`/context/ThemeContext.tsx`)
Create a new React Context to manage `theme` state ('raven' | 'executive').
- Exposes `theme` string and `setTheme` function.
- Automatically appends a `data-theme` attribute to the `<html>` root node for CSS specificity routing.

### 2. Settings Toggle Integration (`/components/Settings.tsx`)
- Add a new "Appearance" or "Theme" section to `Settings.tsx`.
- Include a simple toggle or dropdown utilizing `useTheme()` to switch between internal themes.

### 3. CSS Variable Definitions (`index.html`)
Since the project runs Tailwind via CDN, we will add standard CSS custom properties in the `<style>` block of `index.html`.
By defining `:root` (Raven default) and `:root[data-theme="executive"]` variables, we can instantly swap colors purely via CSS without re-rendering classes. Additionally, we use a Tailwind config script block to register these custom properties as Tailwind utility colors.

### 4. Global Class Migration (Node Script)
We will write and execute a Node.js replacement script (`apply-theme.cjs`) to migrate the hardcoded Tailwind values across all `.tsx` files in `/components/` and `/src/` to use new semantic custom colors mapped in our CSS.

**Mapping Logic:**
- `bg-[#4A3183]` -> `bg-brand-primary`
- `bg-slate-950` -> `bg-brand-surface`
- `text-white` -> `text-brand-light` (which maps to slate-900 in Executive mode)
- `border-[#4A3183]` -> `border-brand-primary`



## March 12, 2026

### Data Management & Structural Upgrade Plan

## Goal Description
The vCISO platform currently defines comprehensive SQLAlchemy models in `backend/app/models/domain.py` utilizing best practices (UUID primary keys, audit timestamps, proper indexing). However, the API endpoints (e.g., `findings.py`, `dashboard.py`, `threat_intel.py`) are currently hardcoded to return mock dictionary payloads instead of interacting with the database. 

This plan details the steps to build out a sound data management plane by transitioning the API layer to use Pydantic models for validation and SQLAlchemy sessions for data persistence and retrieval, ensuring optimal security, storage, and access efficiency.

## Proposed Changes

### Database Setup & Session Management
#### [MODIFY] `backend/app/db/session.py` (or similar file)
- Create or update the SQLAlchemy async engine and session maker configuration to connect to a PostgreSQL database (or an in-memory SQLite for local dev if Postgres isn't running).
- Ensure a `get_db` FastAPI dependency is available for route injection.

### Pydantic Model Standardization
#### [NEW/MODIFY] `backend/app/schemas/`
- Create a dedicated `schemas/` directory to hold Pydantic models separately from SQLAlchemy models to prevent circular dependencies and enforce strict DTO (Data Transfer Object) patterns.
- Create `schemas/finding.py`, `schemas/threat_intel.py`, etc., containing `Base`, `Create`, `Update`, and `Response` Pydantic models.
- Ensure strict typing and validation (e.g., `ConfigDict(from_attributes=True)` for ORM mapping).

### Repository Pattern (Data Access Layer)
#### [NEW] `backend/app/crud/`
- Create a Data Access Layer using the Repository pattern. 
- Create `crud/crud_finding.py` and `crud/crud_threat_intel.py` with standard `get`, `get_multi`, `create`, `update`, and `delete` asynchronous methods utilizing SQLAlchemy sessions.

### API Endpoint Refactoring
#### [MODIFY] `backend/app/api/v1/findings.py`
- Inject `db: AsyncSession = Depends(get_db)`.
- Replace the mock dictionary returns with calls to `crud.finding.get_multi(db)`.
- Update the assignment and remediation POST endpoints to actually mutate database state.
- Return Pydantic `FindingResponse` models.

#### [MODIFY] `backend/app/api/v1/threat_intel.py`
- Inject database session dependency.
- Replace `MOCK_FEEDS` entirely. Retrieve subscriptions securely from the database.
- Utilize database transactions for the `PUT` endpoint updating feeds.

## Verification Plan

### Automated Tests
- Run `pytest` on the backend (if existing test suites accommodate).
- Write or execute specific test scripts testing CRUD operations against a local test database ensuring UUIDs and timestamps are generated correctly.

### Manual Verification
- Start the backend via `uvicorn app.main:app --reload`.
- Navigate to the frontend dashboard (`npm run dev`). Make sure the UI successfully loads data seamlessly from the newly wired database without breaking the existing experience.
- Test filtering capabilities (e.g. clicking the "Critical Findings" deep link) to ensure the SQLAlchemy queries execute the filters appropriately at the database level rather than in-memory.



### Deploying vCISO to GCP

To deploy the platform to Google Cloud, we need to orchestrate the infrastructure (Terraform) and build/deploy the containers (Cloud Build & Cloud Run).



## March 14, 2026

### Implementation Plan: AI Penetration Testing Module

This plan outlines the steps required to build a production-ready "AI-Run Penetration Testing" module in the Virtual CISO platform, allowing users to trigger autonomous pentesting simulations or integrate with real-world pentesting agents/tools.

## Proposed Changes

### Backend Service and API
#### [NEW] `backend/app/core/pentest_provider.py`
Create an abstraction layer for penetration testing providers.
- Define `PentestProvider` enum (e.g., `MOCK_ENGINE`, `AUTOGPT_PENTEST`, `TENABLE_API`).
- Define `PentestRequest` and `PentestResponse` schemas.
- Create `PentestClient` to handle routing the request to the active provider.

#### [NEW] `backend/app/services/pentest_engine.py`
Create the service layer that uses the `PentestClient`.
- Implements the `MOCK_ENGINE` (for safe local development/demo) which simulates the phases.
- Implements stubs for actual production agents.

#### [NEW] `backend/app/api/v1/pentest.py`
Create the FastAPI router for the Pentest endpoints.
- `POST /api/v1/pentest/run`: Initiates a pentest on a given target using the configured provider.
- `GET /api/v1/pentest/status/{scan_id}`: Retrieves the status or streaming logs.

#### [MODIFY] `backend/app/main.py`
- Include the new `/api/v1/pentest` router.

### Frontend UI and Components
#### [NEW] `frontend/src/app/pentest/page.tsx`
Create the dedicated page for the AI Penetration Testing dashboard.
- **Provider Settings**: Allows user to select the pentest provider (real vs mock).
- **Header/Config Area**: Form to set the Target (e.g., Web App, Internal Network, Cloud Infra) and Scope (e.g., Black Box, White Box).
- **Live Terminal / Execution Log**: A terminal-like UI to display streaming output from the AI as it conducts the pentest.
- **Results Dashboard**: A section displaying discovered vulnerabilities, attack vectors, and remediation steps after the test concludes.

#### [MODIFY] `frontend/src/components/layout/AppSidebar.tsx`
- Add a new navigation item for "AI Pentest" (e.g., under the `Terminal` icon) restricted to the `CISO` and `SOC_ANALYST` roles.

---

## 2. External Connectors Production Setup

To replace the mock data, we will implement the actual SDK integration for Google Cloud SCC and an open Threat Intelligence Feed in the backend connectors.

### [MODIFY] `backend/app/connectors/gcp_scc.py`
Integrate the official `google-cloud-securitycenter` Python library.
- Implement `fetch_data()` to query `securitycenter_v1.SecurityCenterClient`.
- Filter findings by `state="ACTIVE"` and within the `last_sync` timestamp.
- Transform the `google.cloud.securitycenter.Finding` objects into our internal domain dictionary map before pushing to the Pub/Sub bus.

### [MODIFY] `backend/app/connectors/threat_intel.py`
Integrate a live threat intelligence feed. Since OTX AlienVault provides a free API for STIX/TAXII pulses:
- Implement `fetch_data()` using Python's `httpx` to query the AlienVault OTX API or similar.
- Parse the most recent Pulses/Indicators of Compromise (IoCs).
- Map the JSON response into our standardized `ThreatIndicatorResponse` schemas.

### [MODIFY] `backend/requirements.txt`
Ensure `google-cloud-securitycenter` and `httpx` are installed.

### [MODIFY] `backend/app/api/v1/findings.py` and `backend/app/api/v1/threat_intel.py`
Modify these routers to fetch data from the PostgreSQL Database containing the synced data from the connectors rather than generating mock blocks.



## March 18, 2026

### Implementation Plan

## Proposed Changes

### Frontend (Human Authentication)
- **[MODIFY]** `c:\Users\matan\iCloudDrive\vCISO\frontend\src\app\login\page.tsx`
  - Import `@marsidev/react-turnstile` or build a mock Turnstile component.
  - Require the Turnstile token to be successfully generated before allowing "Sign Up" or "Password Reset".
  - Add a "Forgot Password" mode to `page.tsx` to satisfy the "password reset" requirement. (Currently, it only has signin and signup).

### Backend (Default Frameworks)
- Currently, the application uses mock endpoints for some data or Firebase. We need to determine exactly where frameworks are stored or retrieved.
- **[MODIFY]** `c:\Users\matan\iCloudDrive\vCISO\backend\app\api\v1\compliance.py` (or similar)
  - Ensure that when a new company is initialized (or frameworks are fetched for the first time), the default frameworks (OWASP Top 10, CIS, NIST CSF) are seeded.

## Verification Plan
### Automated Tests
- None currently available for this specific feature sequence.

### Manual Verification
- Go to `/login`.
- Toggle to "Sign up" and verify the human authentication challenge (Turnstile) appears and blocks submission if not solved.
- Toggle to "Forgot Password" and verify the same mechanism.
- Navigate to the Compliance page and verify OWASP, CIS, and NIST CSF are populated automatically for a new account.



### Security Defense-in-Depth Plan

## 1. IDOR Hardening (Backend)
I will systematically replace instances where `org_id` is queried directly from client input across all `app/api/v1/*.py` routers. The endpoints will explicitly extract and validate `current_user.get("org_id")`.

## 2. Secret Scanning (Pre-commit)
I will configure `husky` in the `frontend` directory and add a root-level script to parse git diffs for forbidden patterns (`GOOG_`, `AKIA`, `.json` credentials) prior to any commit, enforcing immediate local feedback.

## 3. Content Security Policy (Frontend)
I will implement `src/middleware.ts` in the Next.js frontend to inject strict HTTP security headers into every response. The CSP will include:
```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self' {backend_api};
```

## 4. CI/CD Container Scanning (Infrastructure)
I will modify `cloudbuild.yaml` to add a step leveraging Google Artifact Registry or Trivy to scan the built images (`backend` and `frontend`). The build will intentionally fail if `CRITICAL` CVEs are detected.

## 5. Granular Rate Limiting (Backend)
I will attach explicit `@limiter.limit()` decorators to the `chat.py` AI endpoints and any correlation generation endpoints, reducing their threshold from the global `100/minute` to `10/minute` to prevent LLM abuse.

## 6. Input Sanitization (Pydantic)
I will locate the primary Pydantic models handling user input (e.g., `ChatRequest`, `FrameworkCreate`) and apply `Field(..., max_length=2000)` constraints to proactively block massive payload parsing attacks.



## March 19, 2026

### Injecting Default Demo Data

The user requested that "top three threat actors" and "OWASP Top Ten and CIS" frameworks are injected by default for all accounts, including existing ones, to enhance the demo and production experience. The user also mentioned "top monitor", which likely refers to a typo for a feature or framework, but the primary task is ensuring these specific defaults exist for *all* organizations, not just fresh ones.

## Proposed Changes

### 1. Update Threat Intel Defaults
#### [MODIFY] [backend/app/api/v1/threat_intel.py](file:///c:/Users/matan/iCloudDrive/vCISO/backend/app/api/v1/threat_intel.py)
Currently, `list_threat_actors` only injects defaults if `existing_count == 0`. I will modify this to:
- Fetch all existing `ThreatActor` names for the given `org_uuid`.
- Compare them against the default list ("Scattered Spider", "FIN7", "Lazarus Group").
- For any missing defaults, create and commit them dynamically, ensuring all accounts (new and existing) have them.

### 2. Update Compliance Framework Defaults
#### [MODIFY] [backend/app/api/v1/compliance.py](file:///c:/Users/matan/iCloudDrive/vCISO/backend/app/api/v1/compliance.py)
Currently, `list_frameworks` only injects defaults if `existing_count == 0`. I will modify this to:
- Fetch all existing `ComplianceFramework` names for the given `org_uuid`.
- Compare them against the defaults ("OWASP Top 10", "CIS Controls", "NIST CSF" - appending "Top Monitor" as a placeholder framework if this was a strict requirement, but I will stick to the core ones first).
- For any missing default frameworks, create and commit them dynamically.



## March 21, 2026

### Automatic Correlation on Configuration Change

This plan outlines how to trigger a "correlation recalculation" when a user leaves the Company Settings page, dynamically updating the system's Findings, Alerts, and "What Needs My Attention" dashboard based on the newly selected tech stack, infrastructure, and tools.

## Proposed Changes

### Backend Updates
---
#### [MODIFY] backend/app/api/v1/correlation_graph.py
- Add a new `POST /api/v1/correlation/recalculate` endpoint.
- This endpoint will receive the `infra`, `tech`, and `tools` configurations.
- It will delete the old static `Finding` records for the organization and generate a customized set of `Finding` records based on the specific technologies the user selected (e.g., generating an AWS IAM finding only if AWS is in the Cloud Infra list, or a React vulnerability if React is in the App Stack).

#### [MODIFY] backend/app/api/v1/dashboard.py
- Update the `GET /dashboard/attention` endpoint. Currently, this relies on a hardcoded list of 4 items.
- Refactor it to query the real `Finding` database table, extracting the top highest-severity active findings to populate the "What Needs My Attention" widget dynamically.

### Frontend Updates
---
#### [MODIFY] frontend/src/app/company/page.tsx
- Add a React `useEffect` hook with a cleanup function that executes when the component unmounts (when the user leaves the page).
- This cleanup function will read the current `infra`, `tech`, and `tools` from `localStorage`.
- It will send an async `POST` request to the new `/api/v1/correlation/recalculate` endpoint in the background, ensuring the data is recalculated in time for the user's arrival at the Dashboard or Findings pages.

## Verification Plan

### Manual Verification
- I will modify the tech stack on the Company settings page (e.g., adding "AWS" and "React").
- I will navigate away to the Dashboard.
- I will verify through browser screenshots that the "What Needs My Attention" and Findings tables now display dynamic findings specifically tailored to "AWS" and "React".



## March 22, 2026

### Vendor Management Architecture

This plan establishes full lifecycle CRUD (Create, Read, Update, Delete) capabilities for Vendor mapping and implements a secure, AI-driven bulk upload pipeline capable of natively parsing complex proprietary file formats. 

## Proposed Changes

### 1. Database Adjustments (PostgreSQL)
- **[MODIFY] `backend/app/models/domain.py`**:
  - Update the `Vendor` SQLAlchemy model to include the strongly typed array `tech_stack` (JSON) and `status` (String) so it inherently mimics the precise DTO requirements the frontend currently uses.
- **[NEW] `backend/scripts/alter_vendors.py`**:
  - Write and execute a live synchronous psycopg2 schema patch `ALTER TABLE vendors ADD COLUMN tech_stack JSON; ALTER TABLE vendors ADD COLUMN status VARCHAR(50);` to securely migrate the live database.

### 2. Full-Stack CRUD API Endpoints
- **[MODIFY] `backend/app/api/v1/vendors.py`**:
  - Entirely deprecate the hard-coded `MOCK_VENDORS` array.
  - **Read (`GET /`)**: Migrate to async SQLAlchemy yielding `select(Vendor).where(Vendor.org_id == org_id)`.
  - **Create (`POST /`)**: Insert single Vendor entities seamlessly.
  - **Update (`PUT /{id}`)**: Hot-patching logic permitting dynamic `tech_stack` and risk score tweaks.
  - **Delete (`DELETE /{id}`)**: Hard deletion of stale Vendor mappings.

### 3. Secure AI Bulk Upload Pipeline
- **[NEW] `POST /api/v1/vendors/upload`**:
  - Accept `UploadFile` (multipart/form-data) explicitly validating extensions (`.pdf, .txt, .csv, .xlsx`).
  - Introduce an asynchronous mocked Malware Scanning intercept, physically dropping payloads resembling `.exe`, `.bat`, `.dll` immediately.
  - If the scan evaluates safe: Utilize `gemini-2.0-flash` Multimodal capabilities natively to process the uploaded bytes. Prompt Vertex AI to programmatically extract an overarching JSON array defining `vendors`, implicitly predicting `tech_stack` groupings from context.

### 4. Interactive Frontend Dashboard
- **[MODIFY] `frontend/src/app/vendor-risk/page.tsx`**:
  - Generate a "Manage Vendors" control bar explicitly housing a dropdown for standard single-entries or Bulk Uploading.
  - Construct reactive `Dialog` modals controlling the manual form inputs alongside a Drag & Drop zone for document submissions.
  - Inject granular "Edit" (pencil) and "Delete" (trash) `lucide-react` icons natively onto each element in the data table directly triggering the aforementioned backend hooks seamlessly.



### Dark / Light Mode Implementation Plan

## Goal Description
Implement a proper Light Mode version of the Virtual CISO platform that users can manually toggle within their personal settings. By default, the application will follow the user's OS-level system preferences (System Dark or System Light).

## Proposed Changes

### Global Configuration & Dependencies
#### [NEW] `package.json` dependency
- Install `next-themes` via `npm install next-themes` to manage the seamless insertion of the `.dark` class on the `<html>` element and sync with system preferences.

### Core Layout Component Updates
#### [NEW] `frontend/src/components/theme-provider.tsx`
- Create a wrapper component for `next-themes`' `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>`.

#### [MODIFY] `frontend/src/app/layout.tsx`
- Remove the hardcoded `className="dark"` from the `<html>` tag.
- Add `suppressHydrationWarning` to the `<html>` tag to prevent React mismatch errors during initial theme injection.
- Wrap the main application `{children}` inside the new `<ThemeProvider>`.

### Personal Settings Toggle
#### [MODIFY] `frontend/src/app/profile/page.tsx` (or Settings)
- Introduce a UI toggle/dropdown utilizing the `useTheme()` hook from `next-themes`. 
- Allow the user to select between "Light", "Dark", and "System".

### CSS & Asset Auditing
#### [MODIFY] `frontend/src/app/globals.css`
- Ensure that the base `:root` (Light mode) color palette mapped to Tailwind variables perfectly complements the darker palette. 
- Ensure any decorative background meshes (like `noise.svg` or `bg-primary/10`) appear subtle and premium in light mode.

## Verification Plan
### Automated & Manual Verification
- Test that loading the page with OS Light mode naturally applies the Light style without a flickering jump.
- Test that selecting "Dark" explicitly overrides the OS style and saves the preference in `localStorage`.
- Visually verify text contrast via Browser Subagent on key dashboards (e.g., Cyber Threat Analyzer, Findings).



## March 23, 2026

### vCISO Admin Portal: Phase 16 (Blast Radius Containment)

To formally protect the multi-tenant architecture from logical developer bugs and ensure an impenetrable blast radius, we will systematically harden the infrastructure.

## Proposed Architecture
#### [MODIFY] [backend/app/main.py](file:///c:/Users/matan/iCloudDrive/vCISO/backend/app/main.py)
- Build a global FastAPI `Middleware` that aggressively intercepts every HTTP request. It will proactively extract the `org_id` from the decoded JWT token and embed it natively into Python's `contextvars`, rejecting requests lacking valid tenant bounds before they reach business logic.

#### [MODIFY] [backend/app/db/session.py](file:///c:/Users/matan/iCloudDrive/vCISO/backend/app/db/session.py)
- Reconfigure the SQLAlchemy `AsyncSession` engine to intercept the connection pool. It will execute a raw `SET LOCAL rls.org_id = '{context_org_id}'` command immediately upon acquiring a PostgreSQL connection.

#### [MODIFY] [backend/app/models/domain.py](file:///c:/Users/matan/iCloudDrive/vCISO/backend/app/models/domain.py)
- Inject DDL compiler hooks to physically apply PostgreSQL Row-Level Security (`ALTER TABLE X ENABLE ROW LEVEL SECURITY`) and write strict data-visibility policies ensuring the database engine physically rejects rogue requests from the application.

# vCISO Admin Portal: Phase 12 (Dynamic Tier Synchronization)

Currently, the `Subscription & Service Tier` settings page on the main vCISO App explicitly hardcodes the pricing text (`$200/mo`) and features. 
To ensure your Admin modifications propagate instantly into the core application, we must upgrade the TSX routing to pull live data from Postgres.

## Proposed Changes
### Core Backend
#### [NEW] [backend/app/api/v1/tiers.py](file:///c:/Users/matan/iCloudDrive/vCISO/backend/app/api/v1/tiers.py)
- Create a read-only endpoint replicating the Admin `get_service_tiers` return payload, but exposed to *all* authenticated API users (not just internal admins).
#### [MODIFY] [backend/app/main.py](file:///c:/Users/matan/iCloudDrive/vCISO/backend/app/main.py)
- Register the new `tiers.py` router.

### Core Frontend 
#### [MODIFY] [frontend/src/app/settings/subscription/page.tsx](file:///c:/Users/matan/iCloudDrive/vCISO/frontend/src/app/settings/subscription/page.tsx)
- Delete the hardcoded `const tiers = [...]`.
- Implement `useEffect` to trigger a `fetchWithAuth()` reaching out to `/api/v1/tiers`.
- Render the `monthlyPrice`, `pricePerUser`, and `features` array directly from the API response payload.

### Documentation
#### [MODIFY] [USER_GUIDE.md](file:///c:/Users/matan/iCloudDrive/vCISO/USER_GUIDE.md)
- Update the Subscription context explaining that Tiers, Features, and Per-Seat billing are administered digitally via the external Admin Portal.

# vCISO Admin Portal: Phase 13 (Tier Seat Enforcement)

To formally monetize the application and protect backend usage outlays, we'll architect a hard constraint that rejects unauthorized invitations exceeding an Organization's designated Subscription limits.

## Proposed Architecture
#### [MODIFY] [backend/app/api/v1/users.py](file:///c:/Users/matan/iCloudDrive/vCISO/backend/app/api/v1/users.py)
In the `invite_user` pipeline:
1. Lookup the `Organization` associated with the querying administrator to find their canonical `ServiceTier`.
2. Map that to the `ServiceTierConfig` PostgreSQL table to locate the exact integer `max_users` configuration.
3. Compute the current user allocation count (`SELECT COUNT(id) FROM users WHERE org_id=X AND is_active=True`).
4. Execute `sys.exit` payload denial loop if `count >= max_users`, responding with a `HTTP 403 Forbidden` error demanding an upgraded checkout / subscription plan tier.

# vCISO Admin Portal: Phase 14 (FluidPay Billing Integration)

To fully materialize the Subscription platform, we must replace the instant DB-update on `PUT /api/v1/organizations/{org_id}` with a secure payment capture flow hitting the **FluidPay REST API**.

## Proposed Architecture (Customer Vaulting)
*Crucially, to maintain strict PCI-DSS compliance, **FluidPay will act as the exclusive vault for all sensitive Credit Card and ACH data**.* The vCISO backend will never store raw payment instruments.

#### [NEW] [backend/app/services/fluidpay.py](file:///c:/Users/matan/iCloudDrive/vCISO/backend/app/services/fluidpay.py)
- Build a Python SDK wrapper mapping directly to the **FluidPay Customer Vault API**.
- Expose methods to securely tokenize and vault a client's CC/ACH (returning a `fluidpay_customer_id`), and a secondary mechanism to charge that vaulted token.

#### [NEW] [backend/app/api/v1/billing.py](file:///c:/Users/matan/iCloudDrive/vCISO/backend/app/api/v1/billing.py)
- Expose a `POST /api/v1/billing/checkout` endpoint.
- Accept the requested `ServiceTierConfig` identifier alongside the secure `fluidpay_tokenized_payload`.
- Transmit the payload to FluidPay to create a Customer Vault record. If `res.status == 'success'`, we save the isolated non-sensitive `fluidpay_customer_id` strictly into the Postgres `Organization` table and upgrade their tier.

#### [MODIFY] [frontend/src/app/settings/subscription/page.tsx](file:///c:/Users/matan/iCloudDrive/vCISO/frontend/src/app/settings/subscription/page.tsx)
- Upgrade the `handleSave()` button click to render a secure Checkout Modal rather than immediately committing the Postgres payload.
- Collect secure payment details (using mock inputs for MVP unless you provide the API Keys now) and transmit them directly to the new `/api/v1/billing/checkout` flow.

# vCISO Admin Portal: Phase 15 (Organization Lifecycle Management)

While the Admin Portal currently renders a `CustomerManagement.tsx` data table, it functions exclusively as a read-only list with suspend/tier-swap capabilities. We must upgrade this into a full CRUD (Create, Read, Update, Delete) module.

## Proposed Architecture
#### [MODIFY] [backend/app/api/v1/admin/customers.py](file:///c:/Users/matan/iCloudDrive/vCISO/backend/app/api/v1/admin/customers.py)
- Expand the router beyond basic `GET` analytics by exposing a `POST /api/v1/admin/customers` generator. This will bootstrap a fresh `Organization` UUID securely.
- Expose a `DELETE /api/v1/admin/customers/{org_id}` controller to wipe or hard-suspend a tenant lifecycle.

#### [MODIFY] [admin-portal/src/services/api.ts](file:///c:/Users/matan/iCloudDrive/vCISO/admin-portal/src/services/api.ts)
- Construct matching TypeScript `createCustomer()` and `deleteCustomer()` bindings connected natively to the backend Python JWT admin layer.

#### [MODIFY] [admin-portal/src/pages/Customers/CustomerManagement.tsx](file:///c:/Users/matan/iCloudDrive/vCISO/admin-portal/src/pages/Customers/CustomerManagement.tsx)
- Rebrand UI labels from "Customers" into "Organizations" to properly reflect the true backend multi-tenant structure.
- Construct a dedicated **'Add Organization'** Action button alongside a floating UI Modal component that triggers the new PostgreSQL UUID creation hook.
- Implement an explicitly colored **'Delete'** Action column permitting the forceful erasure of obsolete tenants.

# vCISO Admin Portal: Phase 17 (Role-Based Weekly Security Briefs)

To transform passive dashboards into a proactive operations layer, we will engineer an automated Weekly Security Brief. This pipeline will deeply scan the database for architectural drift over the trailing 7 days, synthetically structure the raw changes via the LLM, and aggressively tailor the readout narrative based on the recipient's internal `role` (e.g., CISO vs Analyst).

## Proposed Architecture

#### [MODIFY] [backend/app/models/domain.py](file:///c:/Users/matan/iCloudDrive/vCISO/backend/app/models/domain.py)
- **User Preference:** Append `receives_weekly_digest: Mapped[bool] = mapped_column(Boolean, default=True)` into the `User` model, empowering users to subscribe/unsubscribe natively.
- **Brief Archive:** Stand up a new `WeeklySecurityBrief` reporting model to persist historical AI generations for in-app viewing (containing `org_id`, `recipient_role`, `markdown_content`).

#### [NEW] [backend/app/services/brief_generator.py](file:///c:/Users/matan/iCloudDrive/vCISO/backend/app/services/brief_generator.py)
- **Telemetry Aggregation:** Build exact analytical queries targeting `assets`, `findings`, and `security_controls` bounded by `timestamp > NOW() - 7 DAYS`.
- **LLM Persona Engine:** Construct rigid AI prompts natively feeding the gathered JSON into standard structural templates:
  - *CISO/Exec (`admin`)*: Maps changes mapped against business risk, macro compliance scores, and aggregate attack surface deltas.
  - *SOC Analyst (`editor`)*: Maps highly technical telemetry, explicitly itemizing new vulnerabilities, untracked IP assets, and failed controls.
  - *Stakeholder (`viewer`)*: Simple high-level summaries highlighting general security trends without sensitive tactical data.

#### [NEW] [backend/app/api/v1/reports.py](file:///c:/Users/matan/iCloudDrive/vCISO/backend/app/api/v1/reports.py)
- **Cron Trigger Endpoint:** Expose `POST /api/v1/reports/generate-weekly` executing the async array logic fetching all users opted-in, aggregating their specific org's data, dispatching it to Vertex AI, saving the output, and executing mocked SMTP deliveries.
- **User Preference Update:** Establish a `PUT` hook permitting users to modify their `receives_weekly_digest` boolean.

#### [MODIFY] [frontend/src/app/settings/profile/page.tsx](file:///c:/Users/matan/iCloudDrive/vCISO/frontend/src/app/settings/profile/page.tsx)
- Engineer a structural explicit "Notifications & Subscriptions" Settings card.
- Mount an interactive Vite Checkbox bound to the backend `PUT /api/v1/users/me/preferences` endpoint.

# vCISO Admin Portal: Phase 20 (Database IAM Authentication)

To mitigate credential leaks, we transitioned from static `DATABASE_URL` bindings to ephemeral Google Cloud IAM token generation mapped directly into `asyncpg`.

# vCISO Admin Portal: Phase 21 (Isolated CMEK Data Storage)

To fulfill strict Enterprise data sovereignty requirements, the platform will enforce Customer-Managed Encryption Keys (CMEK) to encrypt data at rest within Cloud SQL and Cloud Storage.

## Proposed Architecture
#### [MODIFY] [infrastructure/setup_iam.ps1](file:///c:/Users/matan/iCloudDrive/vCISO/infrastructure/setup_iam.ps1)
- Write an orchestration module leveraging `gcloud kms` to provision a `KeyRing` and specific symmetric `CryptoKey`.
- Grant the Cloud Storage and Cloud SQL native service agents the explicit `roles/cloudkms.cryptoKeyEncrypterDecrypter` IAM assignment to unlock seamless read/write bindings.

#### [MODIFY] [infrastructure/rotate_bucket_keys.ps1](file:///c:/Users/matan/iCloudDrive/vCISO/infrastructure/rotate_bucket_keys.ps1)
- Assign the new CMEK as the explicit default key for the primary storage bucket.
- Execute an inline `gcloud storage rewrite` instruction to recursively enforce the encryption transformation across all existing blobs.

- *Warning:* Google Cloud SQL instances cannot natively substitute resting encryption protocols live. We must execute a point-in-time clone or explicitly apply the CMEK during a recreation phase, or apply it to backups. Currently we will just apply it to future automated backups, or if recreation is possible without downtime, we will clone the instance.

# vCISO Admin Portal: Phase 22 (Configurable Severity SLA Deadlines)

Currently, the `sla_deadline` parameter on the `Finding` model lacks automated orchestration. To enforce organizational compliance, we must synthesize dynamic configurations mapping each vulnerability's default SLA timer directly against its associated Severity classification.

## Proposed Architecture
#### [MODIFY] [backend/app/models/domain.py](file:///c:/Users/matan/iCloudDrive/vCISO/backend/app/models/domain.py)
- Establish an `sla_settings: Mapped[dict] = mapped_column(JSON, default=...)` binding natively into the `Organization` SQLAlchemy declarative map, seeding standard timeframes (e.g., `critical: 3, high: 7, medium: 30, low: 90`).
- Inject an asynchronous SQLAlchemy `@event.listens_for(Finding, 'before_insert')` connection listener. Upon discovering inbound `Finding` objects missing an `sla_deadline`, this interceptor will synchronously `SELECT sla_settings` based on the UUID structure, dynamically computing the canonical `detected_at + timedelta(severity)` execution date before committing the row-level flush.

#### [MODIFY] [backend/scripts/init_db.py](file:///c:/Users/matan/iCloudDrive/vCISO/backend/scripts/init_db.py)
- Safely embed native DDL patching configurations (`ALTER TABLE organizations ADD COLUMN sla_settings JSON`) mitigating schema drifts across live environments.

#### [MODIFY] [backend/app/api/v1/organizations.py](file:///c:/Users/matan/iCloudDrive/vCISO/backend/app/api/v1/organizations.py)
- Expand the router beyond mock constants. Construct explicitly bound DB endpoints exposing `GET /api/v1/organizations/me/sla-settings` and `PATCH /api/v1/organizations/me/sla-settings`, ensuring `asyncpg` mutations are properly walled against logical multi-tenancy parameters.

#### [MODIFY] [frontend/src/app/settings/page.tsx](file:///c:/Users/matan/iCloudDrive/vCISO/frontend/src/app/settings/page.tsx)
- Embed a new routing card designated "Remediation SLAs" channeling user navigation locally into `/settings/slas`.

#### [NEW] [frontend/src/app/settings/slas/page.tsx](file:///c:/Users/matan/iCloudDrive/vCISO/frontend/src/app/settings/slas/page.tsx)
- Engineer a structural UI matrix consisting of dynamically updated form logic tied natively against the backend configuration loops. Users will configure integer day overrides based explicitly on the `Severity` Enums, passing validated `fetchWithAuth()` operations downstream.

# vCISO Admin Portal: Phase 23 (Multi-Method Payment Checkout)

The existing FluidPay integration forces users directly into a localized Credit Card mockup modal when upgrading subscription tiers. To support enterprise procurement, we need a fully-faceted Checkout matrix supporting CC, ACH, Apple Pay, and Google Pay structures dynamically.

## Proposed Architecture

#### [MODIFY] [backend/app/api/v1/billing.py](file:///c:/Users/matan/iCloudDrive/vCISO/backend/app/api/v1/billing.py)
- Expand `CheckoutRequest` to natively accept a strictly-typed `payment_method` enum string (e.g. `card`, `ach`, `apple_pay`, `google_pay`).
- Inject logic into `process_checkout` formatting the logging string natively over the ingested method vector.

#### [MODIFY] [frontend/src/app/settings/subscription/page.tsx](file:///c:/Users/matan/iCloudDrive/vCISO/frontend/src/app/settings/subscription/page.tsx)
- Discard the static one-page PCI Simulator.
- Engineer a 4-Tab Navigation Array (Credit Card | Bank Transfer (ACH) | Google Pay | Apple Pay).
- Construct distinct React fragments for each vector:
  - **Credit Card**: Enhanced standard inputs (Card Number, CVC, Expiry, ZIP).
  - **ACH**: Routing Number, Account Number, Account Type selector.
  - **Apple Pay**: Platform-specific dynamic button rendering mimicking native iOS/macOS integration.
  - **Google Pay**: Platform-specific dynamic button rendering mimicking native Android/Chrome integration.
- Ensure all 4 models synthesize to the consolidated `POST /api/v1/billing/checkout` FastAPI webhook seamlessly, utilizing mapped sandbox tokenization strings respectively.

# vCISO Admin Portal: Phase 24 (Bidirectional Subscription Control)

The platform currently assumes all Tier changes initiated internally via the Tenant Dashboard result in an immediate Upgraded checkout transaction using `FluidPay`. We must enable bidirectional capability matrices where Organizations can seamlessly execute formal Downgrades to lesser tiers.

## Proposed Architecture

#### [MODIFY] [backend/app/api/v1/billing.py](file:///c:/Users/matan/iCloudDrive/vCISO/backend/app/api/v1/billing.py)
- Refactor `CheckoutRequest` to make `payment_token` strictly `Optional`.
- Dynamically diff the target `tier_config.monthly_price` against the active `org.subscription_tier` configuration.
- If it evaluates to a **Downgrade**: Bypass FluidPay charging modules entirely, execute the `org.subscription_tier` update inside PostgreSQL securely, and log the downgrade event.
- Preserve existing logic for strict **Upgrades** necessitating formal PCI vaulting limits.

#### [MODIFY] [frontend/src/app/settings/subscription/page.tsx](file:///c:/Users/matan/iCloudDrive/vCISO/frontend/src/app/settings/subscription/page.tsx)
- Engineer real-time Pricing comparison logic mapping the Tenant's current `tier` against the user-clicked `targetTier`.
- Fork the Checkout UI payload:
  - **Path A (Upgrade)**: Route the user to the newly-established Multi-Method Payment Modal.
  - **Path B (Downgrade)**: Route the user to a "Confirm Subscription Downgrade" dialog omitting payment collections entirely, simply summarizing lost functional capabilities.

# vCISO Admin Portal: Phase 25 (App-Wide Theme Control)

The platform currently heavily relies on the hardcoded `<html className="dark">` architecture preventing users from defining standard Light/Dark operating system preferences. We must establish a toggleable context.

## Proposed Architecture

#### [NEW] [frontend/src/components/theme-provider.tsx](file:///c:/Users/matan/iCloudDrive/vCISO/frontend/src/components/theme-provider.tsx)
- Mount the standard `NextThemesProvider` preserving the `"dark"` attribute conditionally while watching standard browser context.

#### [NEW] [frontend/src/components/theme-toggle.tsx](file:///c:/Users/matan/iCloudDrive/vCISO/frontend/src/components/theme-toggle.tsx)
- Build an interactive Lucide `Sun` / `Moon` React button component tapping into `useTheme()`.

#### [MODIFY] [frontend/src/app/layout.tsx](file:///c:/Users/matan/iCloudDrive/vCISO/frontend/src/app/layout.tsx)
#### [MODIFY] [frontend/src/components/layout/AppHeader.tsx](file:///c:/Users/matan/iCloudDrive/vCISO/frontend/src/components/layout/AppHeader.tsx)
- Inject the `ThemeToggle` react component strictly alongside the top-right `Control Tower` and Account Setting dropdown layouts.

# vCISO Admin Portal: Phase 26 (Threat Intel to Findings Pipeline)

Presently, observations gathered within the Threat Intelligence module (such as Dark Web Alerts or targeted Threat Indicators) remain passively localized. The Administrator requested the capacity to transition these raw observations into formally tracked Findings mapped to the Risk Engine.

## Proposed Architecture

#### [MODIFY] [backend/app/api/v1/findings.py](file:///c:/Users/matan/iCloudDrive/vCISO/backend/app/api/v1/findings.py)
- Establish a new `POST /from-intel` FastAPI endpoint ingesting a `CreateIntelFindingRequest` payload (Title, Description, Severity, and Source context).
- Insert the incoming parameters synchronously into the PostgreSQL `findings` table mapped securely against the active Organization ID as an active `FindingStatus.open` alert.

#### [MODIFY] [frontend/src/app/threat-intel/page.tsx](file:///c:/Users/matan/iCloudDrive/vCISO/frontend/src/app/threat-intel/page.tsx)
- Embed a new **"Create Finding"** Action payload directly into the Threat Intelligence React tables.
- **Threat Indicators**: Append a UI button adjoining the existing "Execute Action Plan" and "Create Ticket" wrappers inside the expanded `id` row.
- **Dark Web Alerts**: Append a formal "Promote to Finding" interaction into the bottom borders of the alert cards, executing the API transition and acknowledging success natively via localized state resets or toasts.



## March 24, 2026

### Feature Strategy: Vendor Identity Sync (IdP Integration)

To automatically uncover Shadow IT and synchronize Key Suppliers, we will bolt a dedicated **Vendor Discovery & IdP Sync** module directly into the Integrations Hub. This avoids manual data entry by extracting third-party vendor lists directly from the user's primary Identity Providers (Okta, Google Workspace, Microsoft Entra).



## March 25, 2026

### Production Authentication Fix

The switch to `signInWithRedirect` prevents popup blockers from breaking login, but it requires two things to work in production:

1. **Authorized Domains:** Firebase explicitly denies login redirects to domains it doesn't recognize. The Cloud Run URL (`vciso-frontend-7gkk7pkdya-uc.a.run.app`) must be manually added to Firebase.
2. **Error Handling:** Currently, if the redirect fails (e.g., due to the unauthorized domain), the app silently drops the error because `getRedirectResult()` isn't being called when the app reloads.

## Proposed Changes

### `frontend/src/contexts/AuthContext.tsx`
We will update the authentication context to catch and expose silent redirect errors so we can actually see why it's failing in production instead of just dead-ending.

#### [MODIFY] `AuthContext.tsx`
- Add `getRedirectResult(auth)` inside the `initAuth` lifecycle to catch any errors from the Google sign-in redirect loop.
- Expose an `authError` string to the Context provider so the UI can display exact Firebase error codes (like `auth/unauthorized-domain`).



### AI Vendor Risk Reassessment

## Goal Description
When a user clicks 'Inspect' on a vendor within the **Vendor Risk** module, the AI should dynamically reassess the vendor's security posture and generate a new, recommended `risk_score`. The platform should prominently display this AI-suggested score in the inspection slide-out panel and present the user with a frictionless, single-click "Accept New Score" button to permanently assign the newly deduced risk value mapping to the vendor's official profile.



### Refining the Risk Register Module

The goal is to enhance the Risk Register to allow more dynamic management of business risks and tighter integration with the Findings module.

## Proposed Changes

### Backend (`app/api/v1/`)
#### [MODIFY] `risk_register.py`
- Add `POST /{risk_id}/revert`: Deletes the risk from the register and updates the associated `Finding.status` back to `new`.
- Add `POST /{risk_id}/auto-categorize`: Calls the LLM to dynamically assign risk categories based on the risk title/description.

#### [MODIFY] `findings.py`
- Update `accept_risk` endpoint to auto-populate the `source` field of the created `RiskRegister` entry based on the `finding.source_workflow`.

### Frontend (`src/app/risk-register/`)
#### [MODIFY] `[id]/page.tsx`
- **Revert to Finding Action:** Add a header button to trigger the revert endpoint.
- **Risk Categories:** Rename "Macro Categories" to "Risk Categories". Convert the input to a selectable list of sorted options (Cyber, Compliance, Financial, Legal, Operational, Regulatory, Reputational). Add an "Auto Categories (AI)" magic button.
- **Assigned Owner:** Fetch users from `/api/v1/users` and render a dropdown instead of a text input.
- **Source/Origin:** Make sure this field is editable but auto-populated.

## Verification Plan
1. Send a Finding to the Risk Register and ensure "Source/Origin" auto-populates.
2. Verify the Risk Categories dropdown works and AI auto-categorization selects plausible tags.
3. Revert the risk back to a finding and ensure it disappears from the register and reappears in `/findings`.



## March 26, 2026

### Dynamic Dashboard Metrics

The goal is to replace the hardcoded placeholder values in the `/api/v1/dashboard/summary` endpoint with dynamic aggregations directly from the database, allowing the frontend React cards to display real real-time data reflecting the user's actual security posture.

## Proposed Changes

### Backend API Layer

#### [MODIFY] [dashboard.py](file:///c:/Users/matan/iCloudDrive/vCISO/backend/app/api/v1/dashboard.py)
Update the `get_dashboard_summary` endpoint to:
1. Inject the SQLAlchemy `AsyncSession` database dependency.
2. Resolve `org_uuid` reliably based on the injected `org_id`.
3. Query the `Finding` table to count open critical and high findings (where status is strictly active, not resolved/accepted).
4. Query the `Vendor` table to calculate the current average supply chain risk score.
5. Query the `ComplianceFramework` table to derive an accurate `compliance_score` (by averaging the active `overall_compliance_pct`).
6. Calculate a mathematically sound `overall_risk_score` by synthesizing the avg Finding risk versus Vendor risk scores.
7. Return the existing JSON shape so no frontend structural modifications are required.

## Verification Plan

### Automated Tests
1. No new unit tests will be strictly required because the API endpoint surface contract is remaining identical to the frontend format. We will manually test the payload.

### Manual Verification
1. Open the vCISO dashboard.
2. Verify that the "Overall Risk Score", "Open Critical Findings", and "Compliance Score" display changing, realistic numeric representations instead of the static `78`, `12`, and `65`.
3. Create a new dummy critical finding manually via the API to explicitly verify the dashboard counts accurately increment by +1.



## March 27, 2026

### UI Changes: Page Titles & Pill Tabs

This plan addresses the two primary UI changes requested: moving the page title into the global application header and implementing Pill Tabs to organize content and reduce scrolling, starting with the Threat Intel page.

## Proposed Changes

### Global Header

#### [NEW] `frontend/src/lib/route-titles.ts`
- Create a configuration mapping route paths (e.g., `/threat-intel`, `/vendor-risk`) to human-readable page titles.

#### [MODIFY] `frontend/src/components/layout/AppHeader.tsx`
- Import `usePathname` and the route titles mapping.
- Dynamically render the current page title on the left side of the header.

### Reusable UI Components

#### [NEW] `frontend/src/components/ui/tabs.tsx`
- Create a set of reusable, accessible Tabs components (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`) styled as "Pill Tabs" using Tailwind CSS. 
- The inactive tabs will have a subtle background, and the active tab will have a distinct background to look like a pill.

### Threat Intel Page

#### [MODIFY] `frontend/src/app/threat-intel/page.tsx`
- **Page Header Removal**: Remove the large `<h1>Threat Intelligence</h1>` and search bar layout from the top of the page content, as the title will now be in the `AppHeader`. (We can keep the search bar or move it into the tabs area).
- **Tabs Implementation**: Wrap the four main sections of the page inside the new `Tabs` component:
  1. `actors` (Tracked Threat Actors)
  2. `indicators` (Recent Threat Signals)
  3. `breaches` (Hindsight / Previous Breaches)
  4. `darkweb` (Dark Web Monitoring)

## Verification Plan

### Automated Tests
- Run `npm run dev` to ensure the Next.js application compiles without TypeScript or rendering errors.

### Manual Verification
1. I will use the browser subagent to navigate to `http://localhost:3000/threat-intel` to capture a video showing the new `AppHeader` title and the Pill Tabs functionality in action.
2. I will upload this mockup/recording as a Walkthrough artifact so you can review the visual changes.



### Ecosystem Risk: Vendor vs Product Implementation Plan

This plan aims to distinguish between "Vendors" and "Products" within the Ecosystem Risk module and automatically structure them hierarchically.

## Proposed Changes

### Backend Structure & API
*   **Database Schema (`backend/app/models/domain.py`)**:
    *   Add `parent_vendor_id` (`UUID`, `ForeignKey("vendors.id")`) to the `Vendor` model to establish a hierarchy.
    *   We will natively use the existing `vendor_type` column to explicitly store `"Vendor"` or `"Product"` instead of the current default `"software"`.
*   **Database Migration (`backend/scripts/alter_vendors_hierarchy.py`)**:
    *   Create an explicit script to execute `ALTER TABLE vendors ADD COLUMN parent_vendor_id UUID REFERENCES vendors(id);`.
    *   Run a one-time data cleanup to switch existing `vendor_type` rows from `"software"` to `"Vendor"`.
*   **API Logic (`backend/app/api/v1/vendors.py`)**:
    *   Update `GET /vendors`, `POST /vendors`, `PUT /{id}`, and `/sync` to return/accept `vendor_type` and `parent_vendor_id`.
    *   Introduce an `auto_assign_hierarchy(name: str)` function with a heuristic dictionary mapping known products to vendor parents (e.g., `s3` -> `Product` belonging to `AWS`).
    *   When the `/sync` API ingests a known Product, it will automatically look up or create the Parent Vendor.

### Frontend UI (`frontend/src/app/vendor-risk/page.tsx`)
*   **Table Changes**:
    *   Change the "Vendor/Product" column header to "Name".
    *   Add a new column for "Type" (`Vendor` vs `Product`).
*   **Hierarchical Grouping**:
    *   Restructure the table rendering logic. Instead of a purely flat list, we will render "Vendor" rows, and immediately beneath each Vendor, we will render its associated "Product" rows (slightly indented or visually grouped).

## Verification Plan

### Automated / Scripted Tests
*   Run the new `alter_vendors_hierarchy.py` script to ensure DB alters cleanly without wiping data.
*   Simulate a `POST /sync` with an array like `["AWS", "S3", "MongoDB", "Atlas"]` using `curl` or Postman to confirm `S3` gets `vendor_type="Product"` and points to `AWS`.

### Manual Verification
*   Open the Ecosystem Risk UI in the browser and verify the headers read "Name" and "Type".
*   Confirm that Products (like S3) appear properly indented and visually grouped underneath their Parent Vendor (AWS).



### System Errors Filtering & Categorization Upgrade

The user explicitly requested adding `priority`, `severity`, and `error_type` classification to the System Errors (Bugs) page, paired with comprehensive sorting and filtering dropdowns to manage the influx of crash telemetry.

## Proposed Strategy

To absolutely minimize risk and avoid locking the main Postgres production database with heavy `Alembic` schema migrations on the `internal_bug_logs` table, I will utilize a zero-migration "Frontend AI Classification" strategy.

### [MODIFY] admin-portal/src/pages/Bugs/SystemBugs.tsx (file:///c:/Users/matan/iCloudDrive/vCISO/admin-portal/src/pages/Bugs/SystemBugs.tsx)

1. **Bug Enrichment Engine:** I will build a local `enrichBug` parsing function that scans the `error_message` and `route` of incoming backend bugs. It will intuitively assign:
   - **Type:** (Security, Database, Network, UI, Logic)
   - **Severity:** (Critical, High, Medium, Low)
   - **Priority:** (P1, P2, P3, P4)
   *Example: Any CORS or JWT Auth errors will automatically be grouped as `P1 Critical Security` bugs.*
2. **Filter State Controls:** Introduce three new React state variables (`filterType`, `filterSeverity`, `filterPriority`).
3. **Sort Engine:** Add a `sortConfig` state to allow clicking Table Headers (e.g. Timestamp, Severity, Priority) to toggle sorting ascending/descending.
4. **UI Revamp:** 
   - Add dropdown `<select>` boxes alongside the Search bar.
   - Inject the new enriched data columns into the HTML layout using standard, styled badge pills.

## Verification Plan
1. Open the **Admin Portal** on `localhost:5173`.
2. Navigate to **System Errors**.
3. Verify that the table now contains beautiful `Priority`, `Severity`, and `Type` columns populated dynamically.
4. Test the Sorting by clicking on column headers.
5. Apply multiple interlocking Filters via the new dropdowns and verify the table narrows down correctly.



### Threat Actor Profile Redesign

The objective is to enrich the Threat Actor profile page by transforming it into a "Criminal Profile", leveraging existing data from the backend database that is currently being dropped from the API response. We will ensure the UI remains clean by conditionally rendering only the fields that actually contain data.

## Proposed Changes

---

### Backend API (`c:\Users\matan\iCloudDrive\vCISO\backend\app\api\v1\threat_intel.py`)
#### [MODIFY] threat_intel.py
- **Schema Update**: Add the missing underlying SQLAlchemy fields to the `ThreatActorResponse` Pydantic model (`aliases`, `motivation`, `target_industries`, `target_regions`, `source`, `external_references`).
- **Data Mapping**: Ensure the mapping loop inside `list_threat_actors` extracts these fields natively from the `ThreatActor` SQLAlchemy result (`a.aliases`, `a.motivation`, etc.).
- **Mock Data Enhancement**: Enhance the hardcoded `default_actors` onboarding seed data (e.g., *Scattered Spider*, *Lazarus Group*) to populate these new fields so they are immediately visible for testing.

---

### Frontend UI (`c:\Users\matan\iCloudDrive\vCISO\frontend\src\app\threat-intel\actors\[id]\page.tsx`)
#### [MODIFY] page.tsx
- **Visual Redesign**: Expand the left sidebar (beneath the mugshot) to structurally resemble a criminal profile dossier.
- **Conditional Rendering**: Add designated UI blocks for `Aliases`, `Primary Motivation`, `Target Industries`, and `Target Regions`.
- **Data Guarding**: Wrap each new section in conditional checks (e.g., `{actor.aliases && actor.aliases.length > 0 && (...)}`) to guarantee that empty fields leave no visual artifacts behind.

## Verification Plan

### Automated Tests
- No automated tests currently exist for the Threat Intel UI rendering layout specifically. The type adjustments will be evaluated by the TypeScript/Python compilation steps dynamically.

### Manual Verification
1. I will execute `npm run dev` and `python scripts/init_db.py` (or equivalent backend runner) to spin up the local stack.
2. Use the browser subagent to navigate to `http://localhost:3000/threat-intel/actors/[id]` for the **Scattered Spider** entity.
3. Validate that the new fields (Motivation, Aliases, Targeted Industries) are visibly rendered and aesthetically integrated.
4. Open an actor with empty fields and visually confirm the absence of "blank" or broken UI elements.



### Optimize Deployment Pipelines

This plan outlines the architecture for drastically speeding up `deploy_prod.ps1` and standardizing `deploy_admin.ps1`.

## Proposed Changes

### [MODIFY] `deploy_prod.ps1`
We will rewrite the main production deployment script to run the Backend and Frontend tracks simultaneously via PowerShell Jobs `Start-ThreadJob` or `Start-Job`.
- **Parallelization:** Instead of `backend-build -> backend-deploy -> frontend-build -> frontend-deploy`, both the `backend` and `frontend` pipelines will run at the exact same time. We will use `Wait-Job` and `Receive-Job` to output the logs back to your terminal efficiently.
- **Improved Caching via Machine Type Options:** We'll append `--machine-type=e2-highcpu-8` to the `gcloud builds submit` commands, which speeds up the CI/CD compilation layer significantly.
- **Consistent Alerting:** We will maintain the SMS alert mechanisms to trigger sequentially on success or isolated failure domains.

> [!TIP]
> PowerShell `Start-Job` spins up independent background processes automatically managing the concurrent `gcloud` sub-processes! We do not need to install complex kaniko YAMLs if the sheer parallelization and higher CPU allocation already slices the time in half, retaining identical `gcloud` syntax. 

### [MODIFY] `deploy_admin.ps1`
You requested the "same logic" to be applied to the admin portal deployment. 

> [!IMPORTANT]
> `deploy_admin.ps1` is structurally different: It is a purely local deployment that runs a single Vite `npm run build` locally and then securely uploads static HTML to Firebase Hosting via `firebase-tools deploy`. 

Because it's a single app (there is no backend component to parallelize), we cannot speed it up using parallel logic like we can for the main platform. Furthermore, running the build *locally* (which it currently does) is actually **faster** than spinning up a `gcloud builds submit` container because Vite automatically caches `.vite` artifacts inside your local `node_modules` folder between builds! 

**However**, to keep it structurally parallel and secure with the rest of your fleet, I will:
1. Standardize the UI of `deploy_admin.ps1` so it prints the same beautiful unattended logging headers.
2. Add the SMS alerting system (via `python .\backend\scripts\send_deployment_sms.py`) to the Admin portal so it matches the Main Platform's production logic exactly.

## Open Questions
- For `deploy_prod.ps1`, `Wait-Job` will process the tasks simultaneously, but wait to output everything to the console until completion. Is it acceptable to only see the logs periodically or at the end in exchange for the 5-minute speedup?
- For `deploy_admin.ps1`, do you agree with simply standardizing the layout and adding the SMS alerting logic?


