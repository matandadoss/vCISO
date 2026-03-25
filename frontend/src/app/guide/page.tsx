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
                 <p className="text-base leading-relaxed">
                   At the top, you will see your <strong>Overall Security Score</strong>. A high score means your business is well-protected against attacks that could cause downtime or leak customer data. A dropping score means a new risk has appeared and needs your attention.
                 </p>
                 <p className="text-base leading-relaxed">
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
                 <p className="text-base leading-relaxed">
                   Instead of blasting you with thousands of confusing alerts, the platform automatically groups related problems together and organizes them from most dangerous to least dangerous. 
                 </p>
                 <div className="bg-muted border border-border rounded-lg p-6 mt-6">
                   <h3 className="text-xl font-bold mt-0 mb-3 text-foreground">How to secure an issue:</h3>
                   <ol className="list-decimal list-outside ml-5 space-y-2 text-base leading-relaxed marker:text-muted-foreground font-medium text-foreground/90 mb-0">
                     <li>Open the <strong>Findings</strong> tab.</li>
                     <li>Look for anything labeled <span className="text-red-500 font-bold">Critical</span> or <span className="text-orange-500 font-bold">High</span>.</li>
                     <li>Click the issue to see a simple explanation of what went wrong.</li>
                     <li>Send the provided step-by-step repair instructions directly to your IT team.</li>
                   </ol>
                 </div>
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
                   The <strong>Compliance</strong> tracker acts as your automated business auditor. Passing security audits (like SOC 2 or HIPAA) is often required to win big enterprise contracts and avoid massive government fines.
                 </p>
                 <p className="text-base leading-relaxed">
                   Instead of spending weeks filling out confusing spreadsheets, this page automatically checks your systems against the official rulebooks 24/7.
                 </p>
                 <p className="text-base leading-relaxed">
                   When you need to prove your safety to a client or an auditor, simply visit this page and click <strong>Export Report</strong> to instantly generate official proof that you are following the rules safely.
                 </p>
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
                   Your business uses many third-party software tools (like payroll systems, accounting tools, or email providers). If they get hacked, your company data could easily get stolen too.
                 </p>
                 <p className="text-base leading-relaxed">
                   The <strong>Vendor Risk</strong> module continuously performs background checks on your external partners. If a software company you use suffers a data breach or an outage, this page turns red to warn you. By doing this, your procurement team can accurately refuse to buy dangerous software before it's even installed on your employees' laptops.
                 </p>
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
                 <p className="text-base leading-relaxed">
                   If a new hacking trick is discovered on the internet, the Virtual CISO automatically checks to see if your company happens to use the targeted equipment. If you are vulnerable to the breaking headline, a massive banner will warn you instantly: <strong>"Your business is affected."</strong>
                 </p>
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
                   This is the core brain behind your Virtual CISO. The <strong>Cyber Threat Analyzer</strong> acts like an expert detective connecting the dots.
                 </p>
                 <p className="text-base leading-relaxed">
                   It looks at a hacker's strategy, looks at an open door on your network, and draws a red line showing exactly how an attack could happen. By showing the visual path of a potential disaster before it ever occurs, you can confidently block the hacker before they even try.
                 </p>
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
                   The <strong>Security Testing</strong> page answers the ultimate question: "Do our locks actually work in the real world?" 
                 </p>
                 <p className="text-base leading-relaxed">
                   Instead of waiting to get hurt, this tool sends safe, friendly robots to try and break into your website. It tests if your team set up the defenses correctly. If our robots can break in, it proves that real thieves can too. We will hand you a detailed list of everything we bypassed so you can patch the holes safely and cleanly.
                 </p>
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
                   The <strong>My Company</strong> page is where you teach the Virtual CISO what stuff you own. 
                 </p>
                 <p className="text-base leading-relaxed">
                   By actively listing your servers, websites, security tools, and the rules you must follow, you allow the AI to protect you effectively. If the AI doesn't know you own a specific website, it cannot warn you if that website gets targeted. Keeping this list accurate mathematically prevents false alarms.
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
                   The <strong>AI Control Tower</strong> is your personal AI assistant. It lives inside the platform and understands everything happening securely about your company's setup behind the scenes. 
                 </p>
                 <p className="text-base leading-relaxed">
                   Whenever you don't understand a security alert or an error message, simply open the AI Control Tower on the right side of the screen. You can ask it straight-forward questions like <em>"What does this warning mean for my revenue?"</em> or <em>"How do I rapidly fix this?"</em> and it will explain the answers clearly.
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
                   The <strong>Control Panel</strong> is the engine room. This is where your top administrators safely configure passwords, invite new employees, and manage your billing choices.
                 </p>
                 <p className="text-base leading-relaxed">
                   Because the settings here heavily control the entire platform, access is restricted exclusively to upper management to mathematically defend against accidental disruptions.
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
