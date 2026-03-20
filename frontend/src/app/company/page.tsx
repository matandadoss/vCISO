"use client";

import { fetchWithAuth } from "@/lib/api";
import { Building, Layers, ShieldCheck, Plus, CheckCircle2, Database, Users, FileCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const INFRA_SUGGESTIONS = ["AWS EC2", "AWS S3", "AWS RDS", "AWS Lambda", "Google Kubernetes Engine (GKE)", "Google Cloud Storage (GCS)", "Alibaba Cloud Container Service (ACK)", "DigitalOcean Droplets", "Azure Virtual Machines", "Azure Blob Storage", "On-Premises Servers", "VMware vSphere"];
const TECH_SUGGESTIONS = ["Node.js", "Python", "React", "PostgreSQL", "MongoDB", "Redis", "Docker", "Kubernetes", "Terraform", "GitHub Actions", "GitLab CI", "Java", "Go", "Rust", "C#", "FastAPI", "Next.js", "Express.js", "Spring Boot", "MySQL", "Elasticsearch"];
const TOOL_SUGGESTIONS = ["SentinelOne", "Datadog", "CrowdStrike Falcon", "Palo Alto Prisma Cloud", "Splunk Enterprise", "Tenable Nessus", "Wiz", "Snyk", "Checkmarx", "TruffleHog", "Rapid7", "Qualys", "Veracode", "SonarQube", "Aqua Security", "Lacework"];

export default function CompanyPage() {
  const [activeTab, setActiveTab] = useState<"stack" | "tools" | "app" | "threat-actors" | "frameworks">("stack");
  
  const [activeInput, setActiveInput] = useState<"infra" | "tech" | "tools" | null>(null);
  const [inputText, setInputText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Local Storage State
  const [providers, setProviders] = useState<string[]>([]);
  const [techStack, setTechStack] = useState<string[]>([]);
  const [securityTools, setSecurityTools] = useState<any[]>([]);

  // API State
  const [threatActors, setThreatActors] = useState<any[]>([]);
  const [frameworks, setFrameworks] = useState<any[]>([]);
  const [loadingApi, setLoadingApi] = useState(true);

  useEffect(() => {
    try {
      const i = localStorage.getItem("vciso_company_infra");
      const t = localStorage.getItem("vciso_company_tech");
      const ts = localStorage.getItem("vciso_company_tools");
      setProviders(i ? JSON.parse(i) : ["Google Cloud Platform", "AWS", "Microsoft Azure"]);
      setTechStack(t ? JSON.parse(t) : ["Node.js", "Python", "React", "PostgreSQL", "MongoDB", "Redis", "Docker", "Kubernetes"]);
      setSecurityTools(ts ? JSON.parse(ts) : [
         { name: "CrowdStrike Falcon", status: "Protected", type: "EDR", connected: true },
         { name: "Palo Alto Prisma Cloud", status: "Scanning", type: "CSPM", connected: true },
         { name: "Splunk Enterprise", status: "Awaiting API Key", type: "SIEM", connected: false },
         { name: "Tenable Nessus", status: "Disconnected", type: "Vuln Scanner", connected: false }
      ]);
    } catch(e) {}

    // Fetch API Data to trigger backend injection of defaults
    const fetchApiData = async () => {
      try {
        const [actorsRes, fwRes] = await Promise.all([
          fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/threat-intel/actors?org_id=default`),
          fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/compliance/frameworks?org_id=default`)
        ]);
        
        const actorsData = await actorsRes.json();
        const fwData = await fwRes.json();
        
        setThreatActors(actorsData.items || []);
        setFrameworks(fwData.items || []);
      } catch (err) {
        console.error("Failed to fetch API data", err);
      } finally {
        setLoadingApi(false);
      }
    };
    
    fetchApiData();
  }, []);

  const hasMounted = providers.length > 0 || techStack.length > 0;

  useEffect(() => {
    if (!hasMounted) return;
    try {
      localStorage.setItem("vciso_company_infra", JSON.stringify(providers));
      localStorage.setItem("vciso_company_tech", JSON.stringify(techStack));
      localStorage.setItem("vciso_company_tools", JSON.stringify(securityTools));
    } catch(e) {}
  }, [providers, techStack, securityTools, hasMounted]);

  const handleAddSubmit = (type: "infra" | "tech" | "tools", overrideText?: string) => {
     const textToUse = overrideText || inputText;
     if (!textToUse.trim()) {
        setActiveInput(null);
        return;
     }
     
     if (type === "infra" && !providers.includes(textToUse)) setProviders([...providers, textToUse]);
     if (type === "tech" && !techStack.includes(textToUse)) setTechStack([...techStack, textToUse]);
     if (type === "tools" && !securityTools.find(t => t.name === textToUse)) setSecurityTools([...securityTools, { name: textToUse, status: "Pending Configuration", type: "Custom Integration", connected: false }]);
     
     setInputText("");
     setActiveInput(null);
     setShowSuggestions(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent, type: "infra" | "tech" | "tools") => {
     if (e.key === "Enter") handleAddSubmit(type);
     if (e.key === "Escape") { setInputText(""); setActiveInput(null); setShowSuggestions(false); }
  };
  
  const getFilteredSuggestions = (type: "infra" | "tech" | "tools") => {
     if (!inputText) return [];
     const query = inputText.toLowerCase();
     if (type === "infra") return INFRA_SUGGESTIONS.filter(s => s.toLowerCase().includes(query) && !providers.includes(s));
     if (type === "tech") return TECH_SUGGESTIONS.filter(s => s.toLowerCase().includes(query) && !techStack.includes(s));
     if (type === "tools") return TOOL_SUGGESTIONS.filter(s => s.toLowerCase().includes(query) && !securityTools.find(t => t.name === s));
     return [];
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Building className="w-8 h-8 text-primary" />
            My Company
          </h1>
          <p className="text-muted-foreground mt-2">
            Define your organizational infrastructure and active security stack. This contextual data natively feeds the Cyber Threat Analyzer and Red Team engines to dramatically reduce false positives and zero in on actionable findings.
          </p>
        </div>

        {/* Status Indicator */}
        <div className="bg-green-500/10 border border-green-500/20 text-green-500 px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Continuous Correlation Engine Active. Scanning configurations against incoming threat feeds...
        </div>

        <div className="flex flex-wrap bg-muted p-1 rounded-lg w-fit mb-6 gap-1">
           <button 
             className={cn("text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2 transition-all", activeTab === "stack" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
             onClick={() => setActiveTab("stack")}
           >
              <Layers className="w-4 h-4" /> Cloud Infra
           </button>
           <button 
             className={cn("text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2 transition-all", activeTab === "app" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
             onClick={() => setActiveTab("app")}
           >
              <Database className="w-4 h-4" /> App Stack
           </button>
           <button 
             className={cn("text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2 transition-all", activeTab === "tools" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
             onClick={() => setActiveTab("tools")}
           >
              <ShieldCheck className="w-4 h-4" /> Security Tools
           </button>
           <button 
             className={cn("text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2 transition-all", activeTab === "threat-actors" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
             onClick={() => setActiveTab("threat-actors")}
           >
              <Users className="w-4 h-4" /> Threat Actors
           </button>
           <button 
             className={cn("text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2 transition-all", activeTab === "frameworks" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
             onClick={() => setActiveTab("frameworks")}
           >
              <FileCheck className="w-4 h-4" /> Frameworks
           </button>
        </div>

        {activeTab === "stack" && (
           <div className="grid gap-6 animate-in fade-in duration-300">
               <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 sm:gap-0 mb-6">
                     <div>
                         <h2 className="text-xl font-bold text-foreground">Infrastructure & Cloud Providers</h2>
                         <p className="text-sm text-muted-foreground mt-1">Select the environments hosting your organizational datasets.</p>
                     </div>
                     
                     {activeInput === "infra" ? (
                        <div className="relative z-10 flex items-center gap-2">
                           <input 
                             type="text" 
                             autoFocus 
                             className="bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-primary w-64" 
                             placeholder="e.g. EC2, ACK, GKE, etc.." 
                             value={inputText}
                             onChange={(e) => { setInputText(e.target.value); setShowSuggestions(true); }}
                             onFocus={() => setShowSuggestions(true)}
                             onKeyDown={(e) => handleKeyDown(e, "infra")}
                             onBlur={() => setTimeout(() => handleAddSubmit("infra"), 200)}
                           />
                           
                           {showSuggestions && inputText && getFilteredSuggestions("infra").length > 0 && (
                               <ul className="absolute top-full left-0 mt-1 w-64 bg-card border border-border shadow-lg rounded-md overflow-hidden max-h-60 overflow-y-auto">
                                   {getFilteredSuggestions("infra").map(s => (
                                       <li 
                                          key={s} 
                                          onMouseDown={(e) => { e.preventDefault(); handleAddSubmit("infra", s); }} 
                                          className="px-3 py-2 text-sm text-foreground hover:bg-muted cursor-pointer transition-colors"
                                       >
                                          {s}
                                       </li>
                                   ))}
                               </ul>
                           )}
                        </div>
                     ) : (
                        <button onClick={() => setActiveInput("infra")} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 hover:bg-primary/90 transition-colors">
                           <Plus className="w-4 h-4" /> Add Component
                        </button>
                     )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                     {providers.map(provider => (
                        <div key={provider} className="border border-border/50 bg-muted/20 p-4 rounded-lg flex items-center justify-between group hover:border-primary/50 cursor-pointer transition-colors">
                            <span className="font-medium text-foreground">{provider}</span>
                            <CheckCircle2 className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                        </div>
                     ))}
                  </div>
               </div>
           </div>
        )}

        {activeTab === "app" && (
           <div className="grid gap-6 animate-in fade-in duration-300">
               <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 sm:gap-0 mb-6">
                     <div>
                         <h2 className="text-xl font-bold text-foreground">Core Application Stack</h2>
                         <p className="text-sm text-muted-foreground mt-1">Programming languages, frameworks, and core databases.</p>
                     </div>
                     {activeInput === "tech" ? (
                        <div className="relative z-10 flex items-center gap-2">
                           <input 
                             type="text" 
                             autoFocus 
                             className="bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-primary w-64" 
                             placeholder="e.g. S3, EC2, Terraform..." 
                             value={inputText}
                             onChange={(e) => { setInputText(e.target.value); setShowSuggestions(true); }}
                             onFocus={() => setShowSuggestions(true)}
                             onKeyDown={(e) => handleKeyDown(e, "tech")}
                             onBlur={() => setTimeout(() => handleAddSubmit("tech"), 200)}
                           />
                           
                           {showSuggestions && inputText && getFilteredSuggestions("tech").length > 0 && (
                               <ul className="absolute top-full left-0 mt-1 w-64 bg-card border border-border shadow-lg rounded-md overflow-hidden max-h-60 overflow-y-auto">
                                   {getFilteredSuggestions("tech").map(s => (
                                       <li 
                                          key={s} 
                                          onMouseDown={(e) => { e.preventDefault(); handleAddSubmit("tech", s); }} 
                                          className="px-3 py-2 text-sm text-foreground hover:bg-muted cursor-pointer transition-colors"
                                       >
                                          {s}
                                       </li>
                                   ))}
                               </ul>
                           )}
                        </div>
                     ) : (
                        <button onClick={() => setActiveInput("tech")} className="bg-muted hover:bg-muted-foreground/20 text-foreground px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 transition-colors border border-border">
                           <Plus className="w-4 h-4" /> Add Tech
                        </button>
                     )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                     {techStack.map(tech => (
                        <span key={tech} className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-sm font-medium">
                           {tech}
                        </span>
                     ))}
                  </div>
               </div>
           </div>
        )}

        {activeTab === "tools" && (
           <div className="grid gap-6 animate-in fade-in duration-300">
               <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 sm:gap-0 mb-6">
                     <div>
                         <h2 className="text-xl font-bold text-foreground">Active Security Tooling</h2>
                         <p className="text-sm text-muted-foreground mt-1">Integrate telemetry from your existing EDR, SIEM, and vulnerability scanners.</p>
                     </div>
                     
                     {activeInput === "tools" ? (
                        <div className="relative z-10 flex items-center gap-2">
                           <input 
                             type="text" 
                             autoFocus 
                             className="bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-primary w-64" 
                             placeholder="e.g. Datadog, SentinelOne..." 
                             value={inputText}
                             onChange={(e) => { setInputText(e.target.value); setShowSuggestions(true); }}
                             onFocus={() => setShowSuggestions(true)}
                             onKeyDown={(e) => handleKeyDown(e, "tools")}
                             onBlur={() => setTimeout(() => handleAddSubmit("tools"), 200)}
                           />
                           {showSuggestions && inputText && getFilteredSuggestions("tools").length > 0 && (
                               <ul className="absolute top-full left-0 mt-1 w-64 bg-card border border-border shadow-lg rounded-md overflow-hidden max-h-60 overflow-y-auto">
                                   {getFilteredSuggestions("tools").map(s => (
                                       <li 
                                          key={s} 
                                          onMouseDown={(e) => { e.preventDefault(); handleAddSubmit("tools", s); }} 
                                          className="px-3 py-2 text-sm text-foreground hover:bg-muted cursor-pointer transition-colors"
                                       >
                                          {s}
                                       </li>
                                   ))}
                               </ul>
                           )}
                        </div>
                     ) : (
                        <button onClick={() => setActiveInput("tools")} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 hover:bg-primary/90 transition-colors">
                           <Plus className="w-4 h-4" /> Add Tool
                        </button>
                     )}
                  </div>
                  
                  <div className="space-y-4">
                     {securityTools.map(tool => (
                        <div key={tool.name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 border border-border/50 bg-muted/10 p-4 rounded-lg">
                           <div>
                              <div className="flex items-center gap-2">
                                  <span className="font-bold text-foreground">{tool.name}</span>
                                  <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{tool.type}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                  <div className={cn("w-2 h-2 rounded-full", tool.connected ? "bg-green-500" : "bg-amber-500")}></div>
                                  <span className="text-xs text-muted-foreground">{tool.status}</span>
                              </div>
                           </div>
                           <button className={cn("px-4 py-1.5 rounded text-sm font-medium border transition-colors w-full sm:w-auto", tool.connected ? "bg-background text-foreground border-border hover:bg-muted" : "bg-primary text-primary-foreground border-primary hover:bg-primary/90")}>
                               {tool.connected ? "Configure" : "Connect"}
                           </button>
                        </div>
                     ))}
                  </div>
               </div>
           </div>
        )}

        {activeTab === "threat-actors" && (
           <div className="grid gap-6 animate-in fade-in duration-300">
               <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 sm:gap-0 mb-6">
                     <div>
                         <h2 className="text-xl font-bold text-foreground">Monitored Threat Actors</h2>
                         <p className="text-sm text-muted-foreground mt-1">Advanced Persistent Threats (APTs) monitored dynamically based on your industry and stack.</p>
                     </div>
                  </div>
                  
                  <div className="space-y-4">
                     {loadingApi ? (
                        <div className="py-8 text-center text-muted-foreground animate-pulse">Loading tracked actors...</div>
                     ) : threatActors.length > 0 ? (
                       threatActors.map((actor: any) => (
                          <div key={actor.id} className="border border-border/50 bg-muted/10 p-4 rounded-lg flex flex-col justify-between group hover:border-primary/50 transition-colors">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-foreground">{actor.name}</span>
                                <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                  {actor.sophistication?.replace("_", " ")}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{actor.description}</p>
                          </div>
                       ))
                     ) : (
                       <div className="py-8 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/20">No active threat actors mapped.</div>
                     )}
                  </div>
               </div>
           </div>
        )}

        {activeTab === "frameworks" && (
           <div className="grid gap-6 animate-in fade-in duration-300">
               <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 sm:gap-0 mb-6">
                     <div>
                         <h2 className="text-xl font-bold text-foreground">Global Compliance Frameworks</h2>
                         <p className="text-sm text-muted-foreground mt-1">Security frameworks actively mapped and enforced across your telemetry.</p>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {loadingApi ? (
                        <div className="py-8 text-center text-muted-foreground animate-pulse col-span-full">Loading injected frameworks...</div>
                     ) : frameworks.length > 0 ? (
                       frameworks.map((fw: any) => (
                          <div key={fw.id} className="border border-border/50 bg-muted/10 p-4 rounded-lg flex items-center gap-3 group hover:border-primary/50 transition-colors">
                              <div className="p-2 bg-primary/10 rounded-md">
                                <FileCheck className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <span className="font-bold text-foreground flex items-center gap-2">
                                  {fw.framework_name} 
                                  {fw.version && <span className="text-xs font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{fw.version}</span>}
                                </span>
                              </div>
                          </div>
                       ))
                     ) : (
                       <div className="py-8 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/20 col-span-full">No active frameworks.</div>
                     )}
                  </div>
               </div>
           </div>
        )}

      </div>
    </div>
  );
}
