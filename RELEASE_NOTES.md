# vCISO Platform - Release Notes

## March 26, 2026

### Vendor Risk Management Modernization
- **Automated Tech Stack Mapping:** Implemented an intelligent `infer_tech_stack` function to dynamically map vendor names to relevant technology categories, eliminating hardcoded placeholder values.
- **Dynamic Risk Assessment:** Introduced a background assessment engine that runs daily to automatically evaluate risk drift and update vendor statuses upon data retrieval.
- **Data-Driven Metrics:** Transitioned ecosystem dashboard metrics to utilize live, database-driven calculations and ensured manual vendor inputs persist seamlessly.

### Platform Interface Modernization
- **Standardized Navigation & Rebranding:** Rebranded "Vendor Risk" to "Ecosystem Risk" across the application to better reflect its expanded scope.
- **Tabbed UI Refactoring:** Overhauled complex modules such as Security Testing and the Cyber Threat Analyzer to use a clean, consistent tabbed interface model.
- **Performance Maintenance:** Kept application performance optimal by assigning continuous risk scoring to background batch processes.

## March 27, 2026

### UI Layout Standardization
- **Global AppHeader Architecture:** Mandated a consistent, global header structure by stripping away redundant local `<h1>` page titles across various interfaces.
- **Container Standardization:** Adjusted all page container widths to `max-w-7xl` to secure a unified, professional aesthetic platform-wide.

### Ecosystem Risk Hierarchy Setup
- **Vendor-Product Relationships:** Engineered the backend database schema to strictly distinguish parent Vendors from child Products.
- **Automated Hierarchy Grouping:** Included capability logic for automated type assignments.
- **Hierarchical UI Views:** Redesigned the frontend to display a composite "Name" layout with "Type" classifications, neatly grouping products beneath their parent vendor associations.

### Ticker Navigation Fix
- **Direct Link Routing:** Resolved the news ticker component issue so that users clicking an item now navigate correctly to specific threat intelligence articles rather than hitting the default site homepage.

### Admin Tier Visibility Restoration
- **Active Tier Configurations:** Reconciled frontend and backend linkages for tier components in the Admin UI, reviving the ability for administrators to view and transparently modify active tier restrictions.

### System Error Management Modernization
- **Client-Side Telemetry Enrichment:** Embedded a classification engine directly within the Admin Portal that sorts raw bug logs into logical priorities, severities, and specific error types.
- **Enhanced Datatables:** Upgraded system log interfaces with interactive dropdown filters and sortable table columns to grant elevated operational visibility (without disrupting existing DB migrations).

### Threat Actor Profile Redesign
- **Detailed Criminal Profiles:** Transitioned baseline Threat Actor profiles into data-rich intelligence dossiers encompassing aliases, motivations, and common target industries.
- **Backend Retrofitting:** Expanded backend API endpoints to expose previously inaccessible database fields and populated development layers with enriched mock seed data.
- **Dynamic Presentation:** Restructured the frontend detail pages to professionally and conditionally render dossier fields entirely based on live data availability.

### Deployment & CI/CD Enhancements
- **Deployment Status Verification:** Streamlined methods to confirm repository parity against active production and test environments to ensure zero uncommitted drift.
- **Deployment Tooling Updates:** Evaluated optimal rollout pathways and relocated nested deployment tooling (i.e. bringing `admin-portal/deploy.ps1` to the root as `deploy_admin.ps1`) to strictly conform with other high-level release mechanisms like `deploy_prod.ps1`.
