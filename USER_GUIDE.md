# Virtual CISO Documentation

---

*Dashboard > Overview*

## Overview

The **Dashboard** is your organization's central command center, providing a real-time, aggregated snapshot of your active risk landscape. It distills millions of telemetry points into a single, comprehensive **Overall Security Score**.

### Metrics & Measurements Explained

* **Overall Security Score (0-100):** This is a composite metric calculated dynamically. It acts like a corporate credit rating representing your overall cyber health (100 is perfect security). It is a weighted formula combining your Average Internal Findings Risk (70% weight) and your Average Vendor Supply Chain Risk (30% weight). A score above 70 indicates good resilience; a score dropping below 40 indicates systemic vulnerabilities requiring executive attention.
* **Risk Trend Indicator:** Displays the weekly historical delta of your Security Score (+/-). Consistent negative trends indicate increasing technical debt and degrading security posture.

From a business perspective, a high, stable score demonstrates strong resilience against threats that could impact revenue, brand trust, or regulatory compliance. Operationally, it surfaces critical system outages or disconnected data pipelines directly to the top of your feed, ensuring that your team is never flying blind.

**Note:** Executives should log in daily to monitor the top-level score and review the **Recent Findings** feed. If high-severity alerts populate, utilize the quick-action buttons to pivot into specific modules for technical remediation.

---

*Risk > Findings*

## Findings

The **Findings** module acts as your continuously updated, dynamically prioritized vulnerability management queue. It intelligently ingests raw security logs from across your cloud and endpoint environments and distills them into distinct, actionable tickets.

### Metrics & Measurements Explained

* **Risk Score (0.0 - 10.0):** Based on the standardized CVSS (Common Vulnerability Scoring System). A 10.0 implies an unauthenticated, remote code execution vulnerability that is trivially exploitable.
* **Severity (Critical, High, Medium, Low):** The human-readable translation of the Risk Score. Critical means immediate drop-everything response required; Low means fix during standard maintenance windows.
* **Status:** 
  * `New`: Unacknowledged by your team.
  * `In Progress`: Actively being worked on by engineers.
  * `Resolved`: The underlying issue has been successfully patched and verified.
  * `Accepted`: The business has formally accepted the risk due to operational constraints (adds an entry to the Risk Register).

### Triage Workflow

1. Navigate to the **Findings** tab on the left sidebar.
2. Sort the table by the **Severity** column (prioritize `Critical` and `High`).
3. Click a specific finding row to open the details pane.
4. Review the **Root Cause Analysis** and the exact assets affected.
5. Click **Run Automated Action** (if available) or follow the manual remediation steps to securely close the vulnerability.

---

*Risk > Risk Register*

## Risk Register

The **Risk Register** is the formalized business ledger for vulnerabilities and security issues that the organization has consciously chosen to accept rather than remediate immediately (due to operational constraints, cost, or compensating controls).

### Functionality & AI Categorization
When you accept a risk from the `Findings` module, it transitions here. The platform utilizes contextual AI heuristics to automatically evaluate the finding's title and description, instantaneously stripping it down and categorizing it against your core corporate risk pillars (e.g., **Compliance**, **Cyber**, **Legal**, **Operational**, **Financial**).

### Core Features
* **Expiration Boundaries:** Every risk carries an expiration date. Once a risk expires, the system triggers alerts demanding reassessment. You can formally extend these boundaries up to 365 days.
* **Revert to Finding:** If the underlying environment changes and the risk must now be patched instead of tolerated, you can use the **Revert to Finding** action. This securely revokes the risk entry and transitions the item back to the Findings queue under a `Reviewed` status for immediate triage.
* **Auto-Origin Tracking:** The platform explicitly tracks the `Source / Origin` of the risk (e.g. from a Penetration Test versus the Threat Modeler) so auditors have full context on discovery.

---

*Risk > Compliance*

## Compliance

The **Compliance** tracker functions as an automated internal auditor, continuously measuring your environment against strict global regulatory frameworks such as `SOC 2`, `ISO 27001`, `HIPAA`, and `PCI-DSS`.

### Metrics & Measurements Explained

* **Readiness Percentage:** The ratio of fully compliant security controls versus the total number of controls required by the framework. (e.g., passing 80 out of 100 controls yields an 80% Readiness Percentage).
* **Control Status:**
  * `Compliant`: The control rule is fully satisfied and cryptographically verified.
  * `Partial`: The rule is satisfied in some environments (e.g., AWS) but failing in others (e.g., GCP).
  * `Non-Compliant`: A complete failure to meet the regulatory requirement. (You can click **Promote to Finding** to track the failure formal resolution).
* **Evidence Status:** 
  * `Collected`: API telemetry has successfully attached proof to the control.
  * `Incomplete/Missing`: Manual documentation upload is required to satisfy the auditor.

### Enabling Frameworks

1. Navigate to the **Compliance** module.
2. Under the **Available Frameworks** list, locate the standard required by your industry.
3. Click **Enable Framework**. 
4. Allow up to 15 minutes for the AI engine to map your deployed security controls against the framework requirements.
5. View your live readiness percentage and click **Export Report**.

---

*Risk > Ecosystem Risk*

## Ecosystem Risk

The **Ecosystem Risk** module executes AI-driven, continuous background checks and security posture evaluations on third-party suppliers actively integrated into your corporate workflows. It intelligently infers vendor technology stacks and calculates daily risk drift to provide automated, real-time threat predictability without manual reassessment.

### Metrics & Measurements Explained

* **Risk Score & Status (100 = Safe, 0 = Critical):** A dynamic health score tracking the baseline security of the vendor. The score begins at 100 and degrades downward inherently based on the size of the vendor's technology footprint, shifted daily by simulated background threat drift. 
* **Predictive AI Inspections:** When an inspection is run, the score is further degraded if current global intelligence identifies active campaigns matching the vendor's tech stack (dropping status ratings into `Warning` or `Critical`). If no current threats exist, the score improves upwards toward 100.
* **Status (Operational vs. Disrupted):** Real-time monitoring of the vendor's service availability. If a crucial payroll vendor shows "Disrupted", your internal SLA metrics might be severely impacted.

**Note:** Before your organization procures or connects a new SaaS tool, add the vendor/product to this module. Procurement teams should enforce strict policies rejecting software that receives a **High Risk** rating.

---

*Threat Operations > Threat Intel*

## Threat Intel

The **Threat Intel** dashboard acts as your proactive early-warning radar. It continuously monitors global cyber activity. The view is cleanly partitioned into specific intelligence tabs (**Intel Summary**, **Threat Actors**, **Threat Signals**, **Hindsight**, and **Dark Web**) to organize active threat streams. Clicking on any specific threat actor transitions the module into a dedicated **Criminal Dossier / Rap Sheet** detailing their specific Modus Operandi and explicit evidence logs.

### Metrics & Measurements Explained

* **Severity Level:** Defines the potential catastrophic impact of the threat campaign.
* **Match Confidence (%):** Shows the AI's certainty that this specific cyber campaign directly affects your organization (e.g., a 99% match means the attacker uses exploits explicitly targeting software installed in your environment).
* **Targeted Assets:** A dynamic count of internal hostnames and applications currently susceptible to the traced intelligence campaign.

---

*Threat Operations > Cyber Threat Analyzer*

## Cyber Threat Analyzer

Powered by an advanced correlation engine processing over 24 million events daily, the **Cyber Threat Analyzer** maps global threat actor activity directly against your specific infrastructure footprint to surface highly actionable attack paths. The interface is optimized into three primary tabs: **Overview** (telemetry and scopes), **Active Threats** (the correlated hazard list), and **Intel Briefing** (an aggregated executive summary report).

### Metrics & Measurements Explained

The engine provides several complex measurements to quantify operational risk:

* **Targeted Threats Found (Active Patterns):** The absolute number of unique threat actors, ransomware variants, or exploitation campaigns that are actively matching targets inside your "My Company" asset list. A red "+X" denotes new campaigns detected since your previous session.
* **Immediate Action Required (Critical Risk Paths):** A count of validated attack vectors where an external danger has a direct, unmitigated path to a critical internal asset. This number should ideally sit at **zero**.
* **Current Mitigation Score (Average Control Effectiveness):** A percentage grade (e.g., 68%) grading the mathematical strength of your current defensive layout (Firewalls, WAFs, EDR plugins) against the specific threat patterns the engine has mapped.
* **Data Sources Scanned (Evaluated Workflows):** The total number of active external telemetry feeds (e.g., Dark Web nodes, CISA reports, OSINT scraping points) currently feeding intel into the AI correlation engine.
* **Danger Level (%):** Displayed on each individual threat row. This is a composite, weighted algorithm reflecting the exact probability of an exploit succeeding combined with the financial/operational impact if the specific asset goes down. High percentages require immediate "Promote to Finding" actions.

**Note:** Expand any identified attack path in the UI to reveal the exact chronological origin of the threat. You can transition these signals into operational tickets by utilizing the **Promote to Finding** action inside the expanded details.

---

*Threat Operations > Security Testing*

## Security Testing

The **Security Testing** module launches safe, simulated, continuous ethical hacking engagements against your external attack surface to discover logical flaws before criminals do. Results are explicitly visualized in a high-density tabbed layout containing the **Assessment Overview**, the chronological **Attack Path Topology**, and a dedicated **Discoveries** extraction tab. Users can easily pivot simulation strategies by toggling between the **Architecture**, **Hindsight**, and **Pen Test** operation tabs.

### Metrics & Measurements Explained

* **Campaign Status:** `Scheduled`, `Running`, or `Completed`. 
* **Findings Discovered:** Count of confirmed vulnerabilities actually exploited during the ethical hack sequence, skipping false positives entirely.

---

*Console > My Company*

## My Company

The **My Company** page defines the global context for the AI engine. Here, you establish your organizational footprint, including your specific industry, cloud providers, and operational zones.

Accurately maintaining this profile prevents the AI engine from generating false positives. If your profile incorrectly states you use `Azure` instead of `AWS`, the system may suppress critical AWS specific vulnerability alerts. Furthermore, the explicit technologies and tools you define in this section are automatically actively synchronized (`/sync`) into your **Ecosystem Risk** module, ensuring that internal supply-chain software is proactively tracked as a primary threat vector without manual data entry. The footprint is categorized across dedicated layout tabs (**Cloud Infra**, **App Stack**, **Security Tools**, **Threat Actors**, and **Frameworks**) for precise modeling.

---

*Console > Control Panel*

## Control Panel

The **Control Panel** is the central configuration and operations hub for the platform. Improper configuration here represents a severe insider threat vector. Administrator access to this panel must be tightly controlled using Role-Based Access Control (RBAC).

---

*Console > User Guide*

## User Guide

The *User Guide* (this document) provides the authoritative reference manual for navigating the vCISO platform. By explicitly outlining the purpose and risks associated with every page, it ensures your team extracts the maximum defensive value from the software.

[Previous: Control Panel](#) | [Next: Dashboard Overview](#)
