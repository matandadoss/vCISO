"use client";

import React, { useState } from "react";
import { 
  ChevronRight, LayoutDashboard, ShieldAlert, Activity, Building2, 
  Target, Network, FlaskConical, Building, Settings, BookOpen, Bot, Plug
} from "lucide-react";
import { cn } from "@/lib/utils";

// Define guide sections
const GUIDE_SECTIONS = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "findings", label: "Findings", icon: ShieldAlert },
  { id: "compliance", label: "Compliance", icon: Activity },
  { id: "vendor-risk", label: "Vendor Risk", icon: Building2 },
  { id: "threat-intel", label: "Threat Intelligence", icon: Target },
  { id: "analyzer", label: "Cyber Threat Analyzer", icon: Network },
  { id: "testing", label: "Security Testing", icon: FlaskConical },
  { id: "company", label: "My Company", icon: Building },
  { id: "integrations", label: "Integrations & Sync", icon: Plug },
  { id: "ai", label: "AI Control Tower", icon: Bot },
  { id: "settings", label: "Control Panel", icon: Settings },
];

export default function UserGuidePage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="flex h-full w-full bg-background overflow-hidden relative">
      {/* Guide Navigation Sidebar */}
      <div className="w-64 border-r border-border bg-card/50 flex-shrink-0 flex flex-col h-full overflow-y-auto">
        <div className="p-6 pb-4 border-b border-border/50 sticky top-0 bg-card/95 backdrop-blur z-10">
          <h2 className="font-bold text-lg text-foreground tracking-tight">User Guide</h2>
          <p className="text-xs text-muted-foreground mt-1">Platform Navigation</p>
        </div>
        <div className="p-3 space-y-1">
          {GUIDE_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeTab === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveTab(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Guide Content Area */}
      <div className="flex-1 overflow-y-auto p-8 lg:p-12 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <div className="max-w-3xl space-y-8 pb-24 mx-auto">
           {/* Render Content Based on Active Tab */}
           {activeTab === "overview" && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
               <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">Welcome to Virtual CISO</h1>
               <p className="text-lg text-muted-foreground leading-relaxed">
                 The Virtual CISO platform is your automated security guard. It works around the clock to organize alerts, watch for hackers, and tell you exactly what you need to fix to keep your business safe, your revenue flowing, and your customers' trust intact.
               </p>
               <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mt-6 shadow-sm">
                 <h3 className="font-bold text-primary mb-2 flex items-center gap-2">
                    <BookOpen className="w-5 h-5"/> How to Use This Guide
                 </h3>
                 <p className="text-base text-foreground/90 leading-relaxed">
                   Click through the sections on the left to learn how each part of the platform works. We've removed complex technical jargon so that anyone—from the CEO to the newest employee—can understand how we protect the company.
                 </p>
               </div>
             </div>
           )}

           {activeTab === "dashboard" && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="flex items-center text-sm font-medium text-muted-foreground gap-1.5 mb-2">
                 Guide <ChevronRight className="w-4 h-4" /> Dashboard
               </div>
               <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
               <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-foreground/90">
                 <p className="text-base leading-relaxed">
                   The <strong>Dashboard</strong> is your daily command center. Think of it like a credit score, but for your company's safety.
                 </p>
                 <h3 className="text-xl font-bold mt-6 mb-2 text-foreground">Measurements Explained:</h3>
                 <ul className="list-disc pl-5 space-y-2 mt-4 text-base">
                   <li><strong>Overall Security Score (0-100):</strong> This represents your corporate risk baseline. It is dynamically dragged down by failing Compliance protocols, new High-Severity Findings, or failing Vendor software. A score under 70 is considered an immediate operational hazard.</li>
                   <li><strong>Risk Trend Indicator:</strong> Displays the points gained or lost over the last 7 days. A consistent negative trend suggests a growing backlog of technical debt.</li>
                 </ul>
                 <p className="text-base leading-relaxed mt-4">
                   Below the score, the Dashboard highlights the most urgent issues—like a broken firewall or an exposed database—so your team knows exactly what to fix first without digging through confusing technical logs.
                 </p>
               </div>
             </div>
           )}

           {activeTab === "findings" && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="flex items-center text-sm font-medium text-muted-foreground gap-1.5 mb-2">
                 Guide <ChevronRight className="w-4 h-4" /> Findings
               </div>
               <h2 className="text-3xl font-bold tracking-tight text-foreground">Findings (Your To-Do List)</h2>
               <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-foreground/90">
                 <p className="text-base leading-relaxed">
                   The <strong>Findings</strong> page represents your security "to-do list." Whenever the system discovers an open door or a weakened lock in your company's network, it puts a ticket here.
                 </p>
                 <h3 className="text-xl font-bold mt-6 mb-2 text-foreground">Measurements & Fields Explained:</h3>
                 <ul className="list-disc pl-5 space-y-2 mt-4 text-base">
                   <li><strong>Severity:</strong> Either Critical, High, Medium, or Low. Critical means drop-everything, emergency patching required. Low usually means to schedule a fix for the next IT sprint.</li>
                   <li><strong>Risk Score (0-10.0):</strong> An explicit, mathematically generated score based on the CVSS (Common Vulnerability Scoring System). A perfect 10.0 indicates remote hackers can immediately compromise the system without passwords.</li>
                   <li><strong>Status:</strong> New (unacknowledged), In Progress (working), Resolved (fixed), or Accepted (the business accepts the risk and moves it to the Risk Register).</li>
                 </ul>
               </div>
             </div>
           )}

           {activeTab === "compliance" && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="flex items-center text-sm font-medium text-muted-foreground gap-1.5 mb-2">
                 Guide <ChevronRight className="w-4 h-4" /> Compliance
               </div>
               <h2 className="text-3xl font-bold tracking-tight text-foreground">Compliance</h2>
               <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-foreground/90">
                 <p className="text-base leading-relaxed">
                   The <strong>Compliance</strong> tracker acts as your automated business auditor. Passing security audits (like SOC 2 or HIPAA) is critical for enterprise sales.
                 </p>
                 <h3 className="text-xl font-bold mt-6 mb-2 text-foreground">Measurements & Fields Explained:</h3>
                 <ul className="list-disc pl-5 space-y-2 mt-4 text-base">
                   <li><strong>Readiness Percentage:</strong> The total percentage of controls perfectly secured out of the required controls in your chosen framework (e.g., passing 80 out of 100 SOC 2 rules yields an 80% Readiness limit).</li>
                   <li><strong>Control Status:</strong> Compliant (rule passed), Partial (passes on some servers, fails on others), Non-Compliant (completely fails the rule).</li>
                   <li><strong>Evidence Status:</strong> "Collected" means the AI successfully pulled cryptographic proof from your AWS/GCP architecture. "Missing" means you must upload manual proof (like an HR policy PDF).</li>
                 </ul>
               </div>
             </div>
           )}

           {activeTab === "vendor-risk" && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="flex items-center text-sm font-medium text-muted-foreground gap-1.5 mb-2">
                 Guide <ChevronRight className="w-4 h-4" /> Vendor Risk
               </div>
               <h2 className="text-3xl font-bold tracking-tight text-foreground">Vendor Risk</h2>
               <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-foreground/90">
                 <p className="text-base leading-relaxed">
                   Your business uses many third-party software tools (like payroll systems, accounting tools). If they get hacked, your company data could easily get stolen too.
                 </p>
                 <h3 className="text-xl font-bold mt-6 mb-2 text-foreground">Measurements & Fields Explained:</h3>
                 <ul className="list-disc pl-5 space-y-2 mt-4 text-base">
                   <li><strong>Risk Rating:</strong> Evaluates external posture into simple buckets (Critical, High, Medium, Low). Vendors scored High have active vulnerabilities or recent data-breach histories. Procurement teams should reject them.</li>
                   <li><strong>Status:</strong> Shows if the vendor is Operational or currently hit by an Outage/Disruption affecting your supply chain.</li>
                 </ul>
               </div>
             </div>
           )}

           {activeTab === "threat-intel" && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="flex items-center text-sm font-medium text-muted-foreground gap-1.5 mb-2">
                 Guide <ChevronRight className="w-4 h-4" /> Threat Intelligence
               </div>
               <h2 className="text-3xl font-bold tracking-tight text-foreground">Threat Intelligence</h2>
               <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-foreground/90">
                 <p className="text-base leading-relaxed">
                   The <strong>Threat Intel</strong> page is your early-warning radar for global cyber attacks. It reads the news 24/7 to track what hackers are doing worldwide.
                 </p>
                 <h3 className="text-xl font-bold mt-6 mb-2 text-foreground">Measurements & Fields Explained:</h3>
                 <ul className="list-disc pl-5 space-y-2 mt-4 text-base">
                   <li><strong>Match Confidence (%):</strong> Represents the mathematical certainty that you use the exact hardware or software the hackers are aggressively targeting worldwide.</li>
                   <li><strong>Severity Level:</strong> Determines how deeply the global threat could disrupt core corporate metrics (Critical vs. High).</li>
                 </ul>
               </div>
             </div>
           )}

           {activeTab === "analyzer" && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="flex items-center text-sm font-medium text-muted-foreground gap-1.5 mb-2">
                 Guide <ChevronRight className="w-4 h-4" /> Cyber Threat Analyzer
               </div>
               <h2 className="text-3xl font-bold tracking-tight text-foreground">Cyber Threat Analyzer</h2>
               <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-foreground/90">
                 <p className="text-base leading-relaxed">
                   This is the core brain behind your Virtual CISO. The <strong>Cyber Threat Analyzer</strong> maps global threat actor activity directly against your specific infrastructure footprint to surface highly actionable attack paths.
                 </p>
                 <h3 className="text-xl font-bold mt-6 mb-2 text-foreground">Key Health Metrics Explained:</h3>
                 <ul className="list-disc pl-5 space-y-2 mt-4 text-base">
                   <li><strong>Targeted Threats Found:</strong> The total number of unique hacker campaigns, dark web breaches, or botnets currently scanning the internet for tools you have told the system your company uses. (A red "+2" means new threats were detected today).</li>
                   <li><strong>Immediate Action Required:</strong> The total count of verified, highly-exploitable attack vectors where a firewall or defense mechanism has failed. This number should absolutely stay at ZERO.</li>
                   <li><strong>Current Mitigation Score (%):</strong> An averaged 'defensive strength' score. If the score is 68%, it means your firewalls, WAFs, and Multi-Factor Auth setups only successfully block 68% of the attack strategies employed by the specific hackers actively targeting you.</li>
                   <li><strong>Data Sources Scanned:</strong> Shows internal connectivity; it represents the number of external news feeds, dark web streams, and government vulnerability databases actively supplying intelligence to the AI.</li>
                 </ul>
                 <h3 className="text-xl font-bold mt-6 mb-2 text-foreground">Threat Listing Fields:</h3>
                 <ul className="list-disc pl-5 space-y-2 mt-4 text-base">
                   <li><strong>Danger Level (%):</strong> Every mapped row displays a percentage (e.g., 95%). This is the composite chance of your business experiencing catastrophic financial or operational failure due specifically to that threat.</li>
                   <li><strong>Promote to Finding:</strong> An action button inside expanded details. It lets you extract these AI predictions and drop them straight into your active IT workflow queue as an actionable Finding.</li>
                 </ul>
               </div>
             </div>
           )}

           {activeTab === "testing" && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="flex items-center text-sm font-medium text-muted-foreground gap-1.5 mb-2">
                 Guide <ChevronRight className="w-4 h-4" /> Security Testing
               </div>
               <h2 className="text-3xl font-bold tracking-tight text-foreground">Security Testing</h2>
               <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-foreground/90">
                 <p className="text-base leading-relaxed">
                   Instead of waiting to get hurt, this tool sends safe, friendly robots to try and break into your website. It tests if your team set up the defenses correctly.
                 </p>
                 <h3 className="text-xl font-bold mt-6 mb-2 text-foreground">Measurements Explained:</h3>
                 <ul className="list-disc pl-5 space-y-2 mt-4 text-base">
                   <li><strong>Findings Discovered:</strong> The absolute number of real vulnerabilities our simulation officially exploited. False positives are weeded out before they reach this metric.</li>
                   <li><strong>Campaign Status:</strong> Can be Scheduled (waiting in queue), Running (actively attacking), or Completed (done, read logs).</li>
                 </ul>
               </div>
             </div>
           )}

           {activeTab === "company" && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="flex items-center text-sm font-medium text-muted-foreground gap-1.5 mb-2">
                 Guide <ChevronRight className="w-4 h-4" /> My Company
               </div>
               <h2 className="text-3xl font-bold tracking-tight text-foreground">My Company</h2>
               <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-foreground/90">
                 <p className="text-base leading-relaxed">
                   The <strong>My Company</strong> page is where you teach the Virtual CISO what stuff you own. By actively listing your servers, websites, security tools, and the rules you must follow, you allow the AI to protect you effectively. If the AI doesn't know you own a specific website, it cannot warn you if that website gets targeted. Keeping this list accurate mathematically prevents false alarms.
                 </p>
               </div>
             </div>
           )}

           {activeTab === "ai" && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="flex items-center text-sm font-medium text-muted-foreground gap-1.5 mb-2">
                 Guide <ChevronRight className="w-4 h-4" /> AI Control Tower
               </div>
               <h2 className="text-3xl font-bold tracking-tight text-foreground">AI Control Tower</h2>
               <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-foreground/90">
                 <p className="text-base leading-relaxed">
                   The <strong>AI Control Tower</strong> is your personal AI assistant. It lives inside the platform and understands everything happening securely about your company's setup behind the scenes. Whenever you don't understand a security alert or an error message, simply open the AI Control Tower on the right side of the screen. You can ask it straight-forward questions like <em>"What does this warning mean for my revenue?"</em> or <em>"How do I rapidly fix this?"</em> and it will explain the answers clearly.
                 </p>
               </div>
             </div>
           )}

           {activeTab === "settings" && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="flex items-center text-sm font-medium text-muted-foreground gap-1.5 mb-2">
                 Guide <ChevronRight className="w-4 h-4" /> Control Panel
               </div>
               <h2 className="text-3xl font-bold tracking-tight text-foreground">Control Panel</h2>
               <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-foreground/90">
                 <p className="text-base leading-relaxed">
                   The <strong>Control Panel</strong> is the engine room. This is where your top administrators safely configure passwords, invite new employees, and manage your billing choices. Because the settings here heavily control the entire platform, access is restricted exclusively to upper management to mathematically defend against accidental disruptions.
                 </p>
               </div>
             </div>
           )}

           {activeTab === "integrations" && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="flex items-center text-sm font-medium text-muted-foreground gap-1.5 mb-2">
                 Guide <ChevronRight className="w-4 h-4" /> Integrations & Sync
               </div>
               <h2 className="text-3xl font-bold tracking-tight text-foreground">Integrations & Vendor Sync</h2>
               <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-foreground/90">
                 <p className="text-base leading-relaxed">
                   The <strong>Integrations Hub</strong> allows Virtual CISO to automatically discover the software your company uses without requiring any manual data entry.
                 </p>
                 <h3 className="text-xl font-bold mt-6 mb-2 text-foreground">How It Works</h3>
                 <p className="text-base leading-relaxed">
                   By clicking "Authenticate via OAuth" on providers like Google Workspace, Okta, or Microsoft Entra ID, you grant Virtual CISO a temporary software token. We use this token to digitally read your company directory and securely map out which third-party applications your employees are actively logging into.
                 </p>
                 <h3 className="text-xl font-bold mt-6 mb-2 text-foreground">Why It Is Safe</h3>
                 <p className="text-base leading-relaxed">
                   This network connection is explicitly <strong>read-only</strong>. Virtual CISO cannot change your passwords, read private emails, or modify your internal company files. The system strictly requests the absolute minimum permissions required to evaluate your software architecture mappings. 
                 </p>
                 <h3 className="text-xl font-bold mt-6 mb-2 text-foreground">The Benefit to Your Business</h3>
                 <p className="text-base leading-relaxed">
                   <strong>Eliminating Software Blindspots:</strong> In modern business, employees frequently adopt SaaS applications that the executive team is completely unaware of (known as "Shadow IT"). If one of these unknown vendors suffers a catastrophic data breach, your company's proprietary data is lost without you even knowing it was at risk. 
                 </p>
                 <p className="text-base leading-relaxed">
                   By synchronizing your Identity Provider, we automatically illuminate these hidden applications, place them into your monitored risk register, and instantly trigger defensive alerts if they ever become compromised—ensuring your security posture is completely bulletproof.
                 </p>
               </div>
             </div>
           )}

        </div>
      </div>
    </div>
  );
}
