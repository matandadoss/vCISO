import { 
  BookOpen, 
  LayoutDashboard, 
  MessageSquare, 
  AlertTriangle, 
  ShieldCheck, 
  Building2, 
  History, 
  Crosshair, 
  GlobeLock, 
  Swords, 
  GitMerge, 
  Zap, 
  Database, 
  Link2, 
  Settings,
  BriefcaseBusiness,
  MousePointerClick
} from "lucide-react";
import React from "react";

interface GuideItem {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  usage: string;
  businessBenefit: string;
  example: string;
}

interface GuideSectionData {
  title: string;
  items: GuideItem[];
}

const guideData: GuideSectionData[] = [
  {
    title: "Overview",
    items: [
      {
        id: "dashboard",
        title: "Command Dashboard",
        icon: LayoutDashboard,
        description: "The central nervous system of the Virtual CISO platform, providing a real-time, consolidated view of your organization's entire security and compliance posture.",
        usage: "As a daily starting point, review the Overall Security Score, Compliance Posture, and Threat Level. Focus immediate attention on the 'Active Risk Outcomes' and the 'Task Priority' feed which outlines urgent items requiring action.",
        businessBenefit: "Reduces cognitive load by condensing millions of data points into a single, actionable pane of glass. It aligns technical security metrics directly with business risk, enabling executives to make rapid, informed decisions without needing to parse complex logs.",
        example: "A CISO notices the Threat Level jumps to 'Elevated'. They immediately look at the 'Active Risk Outcomes' card which highlights a critical zero-day vulnerability in a core asset, allowing them to triage it instantly."
      },
      {
        id: "vciso-chat",
        title: "vCISO Chat",
        icon: MessageSquare,
        description: "An AI-powered, conversational interface that acts as your dedicated Chief Information Security Officer, trained on your specific organizational data, policies, and global threat intelligence.",
        usage: "Interact using natural language to query the system about complex security concepts, request summaries of recent incidents, ask for compliance guidance, or translate technical vulnerabilities into business impact.",
        businessBenefit: "Democratizes cybersecurity expertise. It empowers non-technical executives to understand deeply technical risks and provides IT teams with instant, expert-level guidance on remediation, drastically reducing the time spent researching solutions.",
        example: "User asks: 'We are expanding to the EU next month. What are our top three gaps for GDPR compliance right now?' The AI vCISO instantly analyzes the compliance maps and provides a prioritized list."
      }
    ]
  },
  {
    title: "Risk & Compliance",
    items: [
      {
        id: "findings",
        title: "Findings Management",
        icon: AlertTriangle,
        description: "A centralized ledger of all discovered vulnerabilities, misconfigurations, and security gaps across your entire infrastructure, prioritized dynamically by business risk.",
        usage: "Review the prioritized list of findings. Click into individual findings to view the root cause, affected assets, and recommended remediation steps. Use the interface to assign tasks to team members or initiate automated playbooks.",
        businessBenefit: "Prevents 'alert fatigue' by intelligently prioritizing issues based on actual business context rather than just technical severity (CVSS). Ensures that the most critical risks to the business are addressed first.",
        example: "A finding for 'Publicly exposed S3 bucket containing PII' is flagged as Critical. An analyst clicks 'Auto-Remediate' to trigger a SOAR playbook that immediately makes the bucket private."
      },
      {
        id: "compliance",
        title: "Automated Compliance",
        icon: ShieldCheck,
        description: "A continuous compliance monitoring engine that maps your technical controls and policies against major regulatory frameworks (SOC 2, ISO 27001, HIPAA, GDPR).",
        usage: "Add desired frameworks and monitor the overall completion percentage. Review individual controls that are 'Failing' or require manual evidence gathering. Connect integrations to automatically satisfy technical controls.",
        businessBenefit: "Transforms compliance from an expensive, painful annual audit into a continuous, automated process. Dramatically reduces the time and cost required to achieve and maintain certifications, accelerating enterprise sales cycles.",
        example: "The platform automatically verifies that encryption at rest is enabled on all databases, instantly checking off the corresponding SOC 2 requirement without manual human verification."
      },
      {
        id: "vendor-risk",
        title: "Vendor Risk Management (Supply Chain)",
        icon: Building2,
        description: "An AI-driven analysis tool that assesses the security posture and potential blast radius of third-party vendors and external software dependencies.",
        usage: "Add new vendors before signing contracts. Review the AI-generated inspection reports detailing their tech stack, recent breaches, financial stability, and overall risk rating before approving procurement.",
        businessBenefit: "Protects the organization from third-party breaches (Supply Chain attacks). Ensures that you are not inheriting catastrophic risk through the software and partners you utilize.",
        example: "Before purchasing a new HR tool, the system scans the vendor, identifies a history of data breaches and weak SSL configurations, and flags the procurement as 'High Risk', prompting a security review."
      },
      {
        id: "audit-trail",
        title: "Immutable Audit Trail",
        icon: History,
        description: "A secure, undeletable cryptographic ledger recording every action, change, and automated event that occurs within the Virtual CISO platform.",
        usage: "Use the search and filter functions to investigate past actions, verify who approved specific risk exceptions, or track the timeline of automated playbook executions during an incident.",
        businessBenefit: "Ensures complete accountability and non-repudiation. Critical for post-incident forensics and provides guaranteed proof of actions and approvals required by auditors and regulatory bodies.",
        example: "During an audit, an inspector asks why a firewall rule was changed. The CISO pulls up the Audit Trail to prove that the change was approved by the CTO and executed automatically via a verified playbook."
      }
    ]
  },
  {
    title: "Threat Operations",
    items: [
      {
        id: "threat-intel",
        title: "Threat Intelligence feed",
        icon: Crosshair,
        description: "A real-time aggregator of global cybersecurity threat intel, automatically mapped against your internal asset inventory to determine relevance.",
        usage: "Monitor exactly what new malware, threat actors, and vulnerabilities are actively being exploited globally. Look for alerts where the system explicitly states 'Your organization is vulnerable'.",
        businessBenefit: "Shifts security from reactive to proactive. Instead of waiting to be attacked, the organization is warned ahead of time about emerging campaigns that target their specific infrastructure.",
        example: "A new critical vulnerability in a specific VPN software is announced globally. The Threat Intel page instantly cross-references your inventory, flags that you use that VPN, and raises an emergency alert."
      },
      {
        id: "osint-risk",
        title: "Public Data Scans (Correlation)",
        icon: GlobeLock,
        description: "An advanced correlation engine that synthesizes data from multiple domains (external exposure, internal vulnerabilities, identity risks) to uncover complex multi-stage attack paths.",
        usage: "Review the 'Executive Action View' for synthesized, prioritized threats. Read the 'Blast Radius' analysis to understand exactly what business units or data are at risk from a specific vector.",
        businessBenefit: "Uncovers 'invisible' risks that isolated security tools miss. By connecting the dots between separate minor issues, it prevents catastrophic chain-reaction breaches.",
        example: "The engine notices an employee's leaked password on the dark web (Dark Web), notes they lack MFA (Identity), and sees they have access to the production database (Infrastructure). It correlates these into a critical 'Account Takeover' threat."
      },
      {
        id: "ai-pentest",
        title: "Continuous AI Pentesting",
        icon: Swords,
        description: "Automated, safe, adversarial simulation where AI agents attempt to ethically hack your internal and external perimeters to prove vulnerabilities exist.",
        usage: "Schedule continuous assessments or run on-demand scenarios (e.g., 'Phishing Simulation', 'External Perimeter Breach'). Review the resulting 'Execution Flow' graphs and remediation instructions.",
        businessBenefit: "Replaces expensive, point-in-time human penetration testing with continuous, 24/7 validation. Provides mathematical proof of vulnerabilities rather than theoretical risks.",
        example: "The AI Pentester successfully exploits a misconfigured API endpoint, accesses a simulated secure database, and generates a report proving the vulnerability is real, forcing the engineering team to prioritize the fix."
      },
      {
        id: "what-if",
        title: "What-If Simulator",
        icon: GitMerge,
        description: "A sandbox environment allowing you to model infrastructure changes or security policy updates and mathematically predict their impact on your security posture before deployment.",
        usage: "Input a proposed architectural change, such as migrating a database to a new cloud subnet or disabling a specific firewall rule. Run the simulation to view the predicted change to your Overall Security Score.",
        businessBenefit: "Prevents self-inflicted wounds and disastrous misconfigurations. Allows engineering teams to move fast and deploy changes with confidence knowing they won't accidentally break security.",
        example: "A developer wants to open port 22 on a production server. The simulator warns that this change will expose the server to a known threat group, causing the team to use a secure VPN instead."
      }
    ]
  },
  {
    title: "Automation & Data",
    items: [
      {
        id: "playbooks",
        title: "SOAR Playbooks",
        icon: Zap,
        description: "Security Orchestration, Automation, and Response. A visual workflow builder to automate repetitive security actions and incident responses.",
        usage: "Create 'If This, Then That' rules. Use the visual editor to map out automated responses, such as isolating a compromised laptop from the network or locking a user's account.",
        businessBenefit: "Responds to cyber threats at machine speed, drastically reducing the 'time-to-containment' during a breach. Frees up human analysts from performing repetitive, manual tasks.",
        example: "A playbook is triggered when ransomware is detected: It automatically revokes the user's IAM privileges, snapshots the infected virtual machine, and pages the incident response team at 2 AM."
      },
      {
        id: "data-workflows",
        title: "Data Workflows",
        icon: Database,
        description: "The data ingestion pipelines responsible for securely pulling, normalizing, and storing logs and metrics from your various cloud providers and security tools.",
        usage: "Used by IT administrators to monitor the health and throughput of data streams flowing into the platform from external sources.",
        businessBenefit: "Ensures the vCISO brain has the high-fidelity, real-time data it needs to accurately protect the organization. Unifies fragmented data silos into a single source of truth.",
        example: "An administrator checks the workflows to ensure AWS CloudTrail logs are successfully importing at a rate of 500 events per second."
      },
      {
        id: "integrations",
        title: "Integrations Hub",
        icon: Link2,
        description: "The directory of external API connectors, allowing the Virtual CISO platform to interface directly with your existing corporate technology stack.",
        usage: "Navigate here to authenticate and connect new tools like Google Workspace, AWS, GitHub, Slack, or CrowdStrike using secure OAuth or API keys.",
        businessBenefit: "Maximizes the value of your existing security investments by orchestrating them through a central intelligence hub. Enables automated remediation across your entire tech stack.",
        example: "By connecting the Slack integration, the platform can immediately message the #security-ops channel whenever a Critical finding is discovered."
      }
    ]
  },
  {
    title: "System",
    items: [
      {
        id: "settings",
        title: "Platform Settings",
        icon: Settings,
        description: "Administrative controls for managing the Virtual CISO platform environment.",
        usage: "Manage user access and roles (RBAC), view platform health, configure notification preferences, and monitor AI token usage and budget.",
        businessBenefit: "Provides the necessary governance and cost-controls over the platform itself, ensuring only authorized personnel have access to sensitive security data.",
        example: "The CISO uses this page to grant a new independent auditor 'Read-Only' access to the compliance modules."
      }
    ]
  }
];

export default function UserGuidePage() {
  return (
    <div className="flex-1 overflow-y-auto bg-background/50 p-6 lg:p-10 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
      <div className="max-w-6xl mx-auto space-y-12 pb-16">
        
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-8 md:p-12 shadow-sm">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/10 blur-3xl rounded-full pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <BookOpen className="w-4 h-4" /> Comprehensive Documentation
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
                Platform User Guide
              </h1>
              <p className="text-xl text-muted-foreground mt-4 max-w-2xl leading-relaxed">
                A definitive manual covering the capabilities, usage models, and business benefits of every module within the Virtual CISO platform.
              </p>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-16">
          {guideData.map((section, index) => (
            <section key={section.title} className="space-y-6">
              <div className="flex items-center gap-4 border-b border-border/50 pb-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-foreground font-bold text-sm">
                  {index + 1}
                </div>
                <h2 className="text-2xl font-bold text-foreground tracking-tight">{section.title}</h2>
              </div>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id} className="group relative bg-card border border-border rounded-xl p-6 transition-all hover:shadow-md hover:border-primary/30 flex flex-col h-full overflow-hidden">
                      {/* Decorative gradient on hover */}
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary/0 to-transparent group-hover:via-primary/50 transition-all duration-500"></div>
                      
                      <div className="flex items-start gap-4 mb-5">
                        <div className="p-3 bg-muted rounded-lg text-primary group-hover:bg-primary/10 transition-colors">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-foreground">{item.title}</h3>
                        </div>
                      </div>

                      <div className="space-y-5 flex-1 text-sm md:text-base">
                        <div>
                          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                            <BookOpen className="w-3.5 h-3.5" /> What It Does
                          </h4>
                          <p className="text-foreground/90 leading-relaxed">{item.description}</p>
                        </div>

                        <div>
                          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                            <MousePointerClick className="w-3.5 h-3.5" /> How To Use It
                          </h4>
                          <p className="text-foreground/80 leading-relaxed">{item.usage}</p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4 border border-border/50 mt-auto">
                          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-2">
                            <BriefcaseBusiness className="w-3.5 h-3.5" /> Business & Risk Benefit
                          </h4>
                          <p className="text-foreground/90 leading-relaxed mb-3">{item.businessBenefit}</p>
                          
                          <div className="pt-3 border-t border-border/50">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Example Scenario</span>
                            <p className="text-muted-foreground italic leading-relaxed text-sm">"{item.example}"</p>
                          </div>
                        </div>
                      </div>
                      
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

      </div>
    </div>
  );
}
