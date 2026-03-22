import React from "react";
import { ChevronRight } from "lucide-react";

export default function UserGuidePage() {
  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 lg:p-12 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
      <div className="max-w-4xl mx-auto space-y-12 pb-24">
        
        {/* Antigravity Style Header */}
        <div className="space-y-4">
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            Virtual CISO Documentation
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Welcome to the Virtual Chief Information Security Officer (vCISO) platform. This manual is designed to help business executives, risk officers, and technical operators navigate the system, understand the diverse risk dimensions monitored by the platform, and execute strategic remediation.
          </p>
        </div>

        <hr className="border-border/50" />

        {/* Section: Dashboard */}
        <div className="space-y-6">
          <div className="flex items-center text-sm font-medium text-muted-foreground gap-1.5 mb-2">
            Dashboard <ChevronRight className="w-4 h-4" /> Overview
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Overview</h2>
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-foreground/90">
            <p className="text-base leading-relaxed">
              The <strong>Dashboard</strong> is your organization's central command center, providing a real-time, aggregated snapshot of your active risk landscape. It distills millions of telemetry points into a single, comprehensive <strong>Overall Security Score</strong>.
            </p>
            <p className="text-base leading-relaxed">
              From a business perspective, this score acts much like a corporate credit rating; a high, stable score demonstrates strong resilience against threats that could impact revenue, brand trust, or regulatory compliance. Operationally, it surfaces critical system outages or disconnected data pipelines directly to the top of your feed, ensuring that your team is never flying blind.
            </p>
            <p className="text-base leading-relaxed">
              <strong>Note:</strong> Executives should log in daily to monitor the top-level score and review the <strong>Recent Findings</strong> feed. If high-severity alerts populate, utilize the quick-action buttons to pivot into specific modules for technical remediation.
            </p>
          </div>
        </div>

        <hr className="border-border/50" />

        {/* Section: Findings */}
        <div className="space-y-6">
          <div className="flex items-center text-sm font-medium text-muted-foreground gap-1.5 mb-2">
            Risk <ChevronRight className="w-4 h-4" /> Findings
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Findings</h2>
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-foreground/90">
            <p className="text-base leading-relaxed">
              The <strong>Findings</strong> module acts as your continuously updated, dynamically prioritized vulnerability management queue. It intelligently ingests raw security logs from across your cloud and endpoint environments and distills them into distinct, actionable tickets.
            </p>
            <p className="text-base leading-relaxed">
              This module fundamentally addresses cyber risk by identifying explicit technical flaws—such as unpatched software, exposed databases, or permissive <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border">AWS</code> firewall rules—that threat actors actively scan for. By grouping these alerts based on the <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border">MITRE ATT&CK</code> framework and scoring them by severity, it vastly reduces operational alert fatigue.
            </p>
            
            <h3 className="text-xl font-bold mt-6 mb-3">Triage Workflow</h3>
            <ol className="list-decimal list-outside ml-5 space-y-2 text-base leading-relaxed marker:text-muted-foreground font-medium text-foreground/90">
              <li>Navigate to the <strong>Findings</strong> tab on the left sidebar.</li>
              <li>Sort the table by the <strong>Severity</strong> column (prioritize <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border">Critical</code> and <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border">High</code>).</li>
              <li>Click a specific finding row to open the details pane.</li>
              <li>Review the <strong>Root Cause Analysis</strong> and the exact assets affected.</li>
              <li>Click <strong>Run Automated Action</strong> (if available) or follow the manual remediation steps to securely close the vulnerability.</li>
            </ol>
          </div>
        </div>

        <hr className="border-border/50" />

        {/* Section: Compliance */}
        <div className="space-y-6">
          <div className="flex items-center text-sm font-medium text-muted-foreground gap-1.5 mb-2">
            Risk <ChevronRight className="w-4 h-4" /> Compliance
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Compliance</h2>
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-foreground/90">
            <p className="text-base leading-relaxed">
              The <strong>Compliance</strong> tracker functions as an automated internal auditor, continuously measuring your environment against strict global regulatory frameworks such as <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border">SOC 2</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border">ISO 27001</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border">HIPAA</code>, and <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border">PCI-DSS</code>.
            </p>
            <p className="text-base leading-relaxed">
              Maintaining robust compliance prevents catastrophic regulatory fines, failed external audits, and the subsequent loss of lucrative enterprise contracts that demand strict security adherence. It also drastically replaces manual, error-prone spreadsheet audits with continuous, evidence-backed API monitoring.
            </p>

            <h3 className="text-xl font-bold mt-6 mb-3">Enabling Frameworks</h3>
            <ol className="list-decimal list-outside ml-5 space-y-2 text-base leading-relaxed marker:text-muted-foreground font-medium text-foreground/90">
              <li>Navigate to the <strong>Compliance</strong> module.</li>
              <li>Under the <strong>Available Frameworks</strong> list, locate the standard required by your industry.</li>
              <li>Click <strong>Enable Framework</strong>.</li>
              <li>Allow up to 15 minutes for the AI engine to map your deployed security controls against the framework requirements.</li>
              <li>View your live readiness percentage and click <strong>Export Report</strong> to seamlessly provide cryptographic proof to external auditors.</li>
            </ol>
          </div>
        </div>

        <hr className="border-border/50" />

        {/* Section: Vendor Risk */}
        <div className="space-y-6">
          <div className="flex items-center text-sm font-medium text-muted-foreground gap-1.5 mb-2">
            Risk <ChevronRight className="w-4 h-4" /> Vendor Risk
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Vendor Risk</h2>
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-foreground/90">
            <p className="text-base leading-relaxed">
              The <strong>Vendor Risk</strong> module executes AI-driven, continuous background checks and security posture evaluations on third-party suppliers actively integrated into your corporate workflows.
            </p>
            <p className="text-base leading-relaxed">
              When your organization relies on external vendors, a breach of their systems grants hackers an implicit backdoor access into your proprietary data. This module identifies cyber risk by tracking whether a software vendor is currently experiencing a known outage, a dark-web data leak, or historically poor security hygiene.
            </p>
            <p className="text-base leading-relaxed">
              <strong>Note:</strong> Before your organization procures or connects a new SaaS tool, add the vendor's domain to this module. Procurement teams should enforce strict policies rejecting software that receives a <strong>High Risk</strong> rating.
            </p>
          </div>
        </div>

        <hr className="border-border/50" />

        {/* Section: Threat Intel */}
        <div className="space-y-6">
          <div className="flex items-center text-sm font-medium text-muted-foreground gap-1.5 mb-2">
            Threat Operations <ChevronRight className="w-4 h-4" /> Threat Intel
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Threat Intel</h2>
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-foreground/90">
            <p className="text-base leading-relaxed">
              The <strong>Threat Intel</strong> dashboard acts as your proactive early-warning radar. It continuously monitors global cyber activity, zero-day vulnerability disclosures, and state-sponsored hacker campaigns, instantly cross-referencing these external events against your known internal tech stack.
            </p>
            <p className="text-base leading-relaxed">
              By alerting you the second a zero-day vulnerability is announced that impacts a software version you actively use, this module significantly decreases your "Time to Patch".
            </p>

            <h3 className="text-xl font-bold mt-6 mb-3">Responding to Campaigns</h3>
            <ol className="list-decimal list-outside ml-5 space-y-2 text-base leading-relaxed marker:text-muted-foreground font-medium text-foreground/90">
              <li>Monitor this page for critical <strong>"Your business is affected"</strong> banners.</li>
              <li>Select an active campaign (e.g., <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border">Log4Shell</code> or <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border">MoveIT</code>).</li>
              <li>Read the AI's plain-English breakdown of the threat actor's methodology.</li>
              <li>Review the auto-generated list of vulnerable internal hostname assets.</li>
              <li>Click <strong>Block IoCs</strong> to instantly propagate malicious IP addresses to your firewall.</li>
            </ol>
          </div>
        </div>

        <hr className="border-border/50" />

        {/* Section: Cyber Threat Analyzer */}
        <div className="space-y-6">
          <div className="flex items-center text-sm font-medium text-muted-foreground gap-1.5 mb-2">
            Threat Operations <ChevronRight className="w-4 h-4" /> Cyber Threat Analyzer
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Cyber Threat Analyzer</h2>
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-foreground/90">
            <p className="text-base leading-relaxed">
              Powered by an advanced correlation engine processing over 24 million events daily, the <strong>Cyber Threat Analyzer</strong> maps global threat actor activity directly against your specific infrastructure footprint to surface highly actionable attack paths.
            </p>
            <p className="text-base leading-relaxed">
              This engine bridges the gap between raw data and executive decision-making. It calculates business risk by estimating financial impact, operational risk by determining if an attack disrupts pipelines, and cyber risk by combining CVSS severity with proof of active exploitation. The engine aggregates telemetry across critical domains including OSINT, Dark Web Chatter, Supply Chain, and Cloud Infrastructure (<code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border">AWS</code>/<code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border">GCP</code>).
            </p>
            <p className="text-base leading-relaxed">
              <strong>Note:</strong> Expand any identified attack path in the UI to reveal the exact chronological origin of the threat. For advanced triage, click <strong>Investigate Knowledge Graph</strong> to visually trace the attack path from the external threat actor directly to your internal database.
            </p>
          </div>
        </div>

        <hr className="border-border/50" />

        {/* Section: Security Testing */}
        <div className="space-y-6">
          <div className="flex items-center text-sm font-medium text-muted-foreground gap-1.5 mb-2">
            Threat Operations <ChevronRight className="w-4 h-4" /> Security Testing
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Security Testing</h2>
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-foreground/90">
            <p className="text-base leading-relaxed">
              The <strong>Security Testing</strong> module launches safe, simulated, continuous ethical hacking engagements against your external attack surface to discover logical flaws before criminals do.
            </p>
            <p className="text-base leading-relaxed">
              This continuous validation replaces expensive point-in-time annual human penetration tests, ensuring your organization mathematically validates that firewalls, WAFs, and intrusion detection systems actually function correctly.
            </p>

            <h3 className="text-xl font-bold mt-6 mb-3">Scheduling an Assessment</h3>
            <ol className="list-decimal list-outside ml-5 space-y-2 text-base leading-relaxed marker:text-muted-foreground font-medium text-foreground/90">
              <li>Navigate to the <strong>Security Testing</strong> workspace.</li>
              <li>Click <strong>+ New Campaign</strong>.</li>
              <li>Select an attack library (e.g., <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border">OWASP Top 10 Web Exploits</code>).</li>
              <li>Set the engagement cadence to <strong>Weekly</strong>.</li>
              <li>Once the simulation finishes, assign the successfully breached pathways as high-priority tickets to your engineering team.</li>
            </ol>
          </div>
        </div>

        <hr className="border-border/50" />

        {/* Section: My Company */}
        <div className="space-y-6">
          <div className="flex items-center text-sm font-medium text-muted-foreground gap-1.5 mb-2">
            Console <ChevronRight className="w-4 h-4" /> My Company
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">My Company</h2>
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-foreground/90">
            <p className="text-base leading-relaxed">
              The <strong>My Company</strong> page defines the global context for the AI engine. Here, you establish your organizational footprint, establishing the exact attack surface the vCISO monitors. Accurately maintaining this profile prevents the AI from generating false positives.
            </p>
            
            <h3 className="text-xl font-bold mt-6 mb-2">Centralized Asset & Threat Management</h3>
            <p className="text-base leading-relaxed mb-4">
              All core tracking capabilities are centralized on this page. You can actively Add, Edit (version tracking), and Delete objects across the following domains to keep your environment up-to-date:
            </p>
            
            <ul className="list-disc list-outside ml-5 space-y-2 text-base leading-relaxed marker:text-muted-foreground font-medium text-foreground/90">
              <li><strong>Cloud Infrastructure:</strong> Track your operating environments (e.g., AWS, GCP, Azure) and their versions. The AI correlates this against active zero-days targeting cloud control planes.</li>
              <li><strong>App Stack:</strong> Catalog software frameworks, databases, and dependencies (e.g., React, PostgreSQL). Ensure versions are tracked accurately to enable the AI to detect deeply embedded supply chain vulnerabilities.</li>
              <li><strong>Security Tools:</strong> Inventory deployed defenses (e.g., CrowdStrike, Palo Alto WAF). The correlation engine accounts for these tools when determining if an active threat path is reliably mitigated or not.</li>
              <li><strong>Compliance Frameworks:</strong> Select which regulatory frameworks (e.g., SOC 2, HIPAA) your organization must adhere to. This automatically activates the requirements mapping in the Compliance module.</li>
              <li><strong>Tracked Threat Actors:</strong> Monitor specific cybercriminal groups (e.g., LAPSUS$, Scattered Spider) relevant to your sector. The AI continuously correlates their evolving Tactics, Techniques, and Procedures (TTPs) against your exact architecture.</li>
            </ul>

            <p className="text-base leading-relaxed mt-4">
              <strong>Note:</strong> Any time you update these components, the <strong>Correlation Engine</strong> automatically recalculates your organization's security posture and updates your Findings, active Alerts, and Executive Dashboard scoring in real-time.
            </p>
          </div>
        </div>

        <hr className="border-border/50" />

        {/* Section: Control Tower AI */}
        <div className="space-y-6">
          <div className="flex items-center text-sm font-medium text-muted-foreground gap-1.5 mb-2">
            Intelligence <ChevronRight className="w-4 h-4" /> Control Tower AI
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Control Tower AI</h2>
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-foreground/90">
            <p className="text-base leading-relaxed">
              The <strong>Control Tower</strong> is a context-aware, generative AI assistant deeply integrated into the vCISO platform. It is designed to act as a Tier-3 Security Analyst and Strategic Advisor.
            </p>
            <p className="text-base leading-relaxed">
              When navigating complex modules—such as Threat Intelligence or Cyber Threat Analyzer—you can launch the Control Tower by interacting with objects (e.g., clicking on a specific Threat Actor card). The Assistant automatically ingests the context of the explicit object you are viewing, allowing you to ask hyper-specific questions like <em>"What is our current risk rating against this actor?"</em> without having to manually describe your environment.
            </p>
            <p className="text-base leading-relaxed">
              The Control Tower offers one-click generated query suggestions, real-time risk calculations, and can dynamically cross-reference your tracked <strong>App Stack</strong> against emerging global attacker TTPs to formulate natural-language defense recommendations.
            </p>
          </div>
        </div>

        <hr className="border-border/50" />

        {/* Section: Control Panel */}
        <div className="space-y-6">
          <div className="flex items-center text-sm font-medium text-muted-foreground gap-1.5 mb-2">
            Console <ChevronRight className="w-4 h-4" /> Control Panel
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Control Panel</h2>
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-foreground/90">
            <p className="text-base leading-relaxed">
              The <strong>Control Panel</strong> is the central configuration and operations hub for the platform. Improper configuration here represents a severe insider threat vector. Administrator access to this panel must be tightly controlled using Role-Based Access Control (RBAC).
            </p>
            <p className="text-base leading-relaxed">
              The Control Panel houses the following critical integration cards:
            </p>

            <h3 className="text-xl font-bold mt-6 mb-2">AI & Platform Foundations</h3>
            <p className="text-base leading-relaxed mb-4">
              Configure the underlying AI models (e.g. <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border">GPT-4</code> or <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border">Claude 3.5 Sonnet</code>), routing protocols, and API cost management features.
            </p>

            <h3 className="text-xl font-bold mt-6 mb-2">Threat Intelligence Feeds</h3>
            <p className="text-base leading-relaxed mb-4">
              Manage inbound threat signal streams. Toggling premium feeds (such as <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border">FS-ISAC</code> for finance) ensures the platform digests intelligence tailored to your sector.
            </p>

            <h3 className="text-xl font-bold mt-6 mb-2">User Management & RBAC</h3>
            <p className="text-base leading-relaxed mb-4">
              Invite team members and assign strict platform roles (<code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border">CISO</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border">SOC_ANALYST</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border">AUDITOR</code>). Ensure engineers have permissions to execute scripts, while executives receive read-only reporting access.
            </p>

            <h3 className="text-xl font-bold mt-6 mb-2">Integrations & API Keys</h3>
            <p className="text-base leading-relaxed mb-4">
              Securely connect external platforms like <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border">Jira</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border">CrowdStrike</code>, or <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border">AWS</code>. Providing valid API keys ensures the AI retains continuous telemetry flow from your network.
            </p>

            <h3 className="text-xl font-bold mt-6 mb-2">Data Workflows</h3>
            <p className="text-base leading-relaxed mb-4">
              Manage automated data ingestion connectors and synchronization schedules. Maintaining healthy cron-schedules ensures the platform pipeline is never blind to active attacks.
            </p>

            <h3 className="text-xl font-bold mt-6 mb-2">Notifications & Alerts</h3>
            <p className="text-base leading-relaxed mb-4">
              Set up global SLA rules, <strong>Slack</strong> webhooks, email summaries, and <strong>PagerDuty</strong> escalations to ensure critical alerts reach the correct on-call engineer instantly.
            </p>

            <h3 className="text-xl font-bold mt-6 mb-2">General Security</h3>
            <p className="text-base leading-relaxed mb-4">
              Configure platform-wide Single Sign-On (SSO), enforce Multi-Factor Authentication (MFA), and define session timeouts to defend against account takeover vectors.
            </p>

            <h3 className="text-xl font-bold mt-6 mb-2">Subscription & Service Tier</h3>
            <p className="text-base leading-relaxed mb-4">
              Manage your active financial subscription plan, upgrade your tier, and review billing statements to ensure continuity of the security service.
            </p>

            <h3 className="text-xl font-bold mt-6 mb-2">Playbooks (SOAR)</h3>
            <p className="text-base leading-relaxed mb-4">
              Configure automated response actions (SOAR). By automatically neutralizing low-level threats (like isolating a laptop exhibiting malware signatures via ED integrations), you drastically alleviate operational burden.
            </p>

            <h3 className="text-xl font-bold mt-6 mb-2">Audit Trail</h3>
            <p className="text-base leading-relaxed mb-4">
              Review comprehensive, immutable system logs containing every administrative action and compliance event. This provides cryptographic accountability, which is mandatory for passing regulatory audits.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
