"use client";

import { fetchWithAuth } from "@/lib/api";
import { Building, Layers, ShieldCheck, Plus, CheckCircle2, Database, Users, FileCheck, Trash2, Edit2, Save, Upload, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const INFRA_SUGGESTIONS = ["AWS EC2", "AWS S3", "AWS RDS", "AWS Lambda", "Google Kubernetes Engine (GKE)", "Google Cloud Storage (GCS)", "Alibaba Cloud Container Service (ACK)", "DigitalOcean Droplets", "Azure Virtual Machines", "Azure Blob Storage", "On-Premises Servers", "VMware vSphere"];
const TECH_SUGGESTIONS = ["Node.js", "Python", "React", "PostgreSQL", "MongoDB", "Redis", "Docker", "Kubernetes", "Terraform", "GitHub Actions", "GitLab CI", "Java", "Go", "Rust", "C#", "FastAPI", "Next.js", "Express.js", "Spring Boot", "MySQL", "Elasticsearch"];
const TOOL_SUGGESTIONS = ["SentinelOne", "Datadog", "CrowdStrike Falcon", "Palo Alto Prisma Cloud", "Splunk Enterprise", "Tenable Nessus", "Wiz", "Snyk", "Checkmarx", "TruffleHog", "Rapid7", "Qualys", "Veracode", "SonarQube", "Aqua Security", "Lacework"];
const FRAMEWORK_SUGGESTIONS = ["SOC 2 Type II", "ISO 27001", "HIPAA", "PCI-DSS", "GDPR", "NIST 800-53", "NIST CSF 2.0", "FedRAMP", "CMMC Level 2"];
const THREAT_ACTOR_SUGGESTIONS = ["LAPSUS$", "Scattered Spider", "APT29 (Cozy Bear)", "APT28 (Fancy Bear)", "Lazarus Group", "Sandworm", "LockBit", "BlackBasta", "ALPHV (BlackCat)", "Clop"];

export default function CompanyPage() {
  const [activeInput, setActiveInput] = useState<"infra" | "tech" | "tools" | "frameworks" | "threat-actors" | null>(null);
  const [inputText, setInputText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Local Storage State
  const [providers, setProviders] = useState<any[]>([]);
  const [techStack, setTechStack] = useState<any[]>([]);
  const [securityTools, setSecurityTools] = useState<any[]>([]);

  // API State
  const [threatActors, setThreatActors] = useState<any[]>([]);
  const [frameworks, setFrameworks] = useState<any[]>([]);
  const [loadingApi, setLoadingApi] = useState(true);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVersion, setEditVersion] = useState("");
  
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    try {
      const i = localStorage.getItem("vciso_company_infra");
      const t = localStorage.getItem("vciso_company_tech");
      const ts = localStorage.getItem("vciso_company_tools");
      
      const parsedInfra = i ? JSON.parse(i) : ["Google Cloud Platform", "AWS", "Microsoft Azure"];
      const parsedTech = t ? JSON.parse(t) : ["Node.js", "Python", "React", "PostgreSQL", "MongoDB", "Redis", "Docker", "Kubernetes"];
      
      setProviders(parsedInfra.map((p: any) => typeof p === 'string' ? { name: p, version: "" } : p));
      setTechStack(parsedTech.map((p: any) => typeof p === 'string' ? { name: p, version: "" } : p));
      
      setSecurityTools(ts ? JSON.parse(ts) : [
         { name: "CrowdStrike Falcon", status: "Protected", type: "EDR", connected: true, version: "" },
         { name: "Palo Alto Prisma Cloud", status: "Scanning", type: "CSPM", connected: true, version: "" },
         { name: "Splunk Enterprise", status: "Awaiting API Key", type: "SIEM", connected: false, version: "" },
         { name: "Tenable Nessus", status: "Disconnected", type: "Vuln Scanner", connected: false, version: "" }
      ]);
    } catch(e) {}

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

  // Trigger recalculation when leaving the page so alerts and findings are generated for the new stack
  useEffect(() => {
    return () => {
       try {
           const infraStr = localStorage.getItem("vciso_company_infra") || "[]";
           const techStr = localStorage.getItem("vciso_company_tech") || "[]";
           const toolsStr = localStorage.getItem("vciso_company_tools") || "[]";
           
           if (infraStr !== "[]" || techStr !== "[]" || toolsStr !== "[]") {
             fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/correlation/recalculate?org_id=default`, {
                 method: "POST",
                 keepalive: true,
                 headers: { "Content-Type": "application/json" },
                 body: JSON.stringify({ 
                     infra: JSON.parse(infraStr), 
                     tech: JSON.parse(techStr), 
                     tools: JSON.parse(toolsStr) 
                 })
             }).catch(e => console.error("Recalculation failed", e));
           }
       } catch(e) {}
    };
  }, []);

  const hasMounted = providers.length > 0 || techStack.length > 0 || securityTools.length > 0;

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
     
     if (type === "infra" && !providers.find(p => p.name === textToUse)) setProviders([...providers, { name: textToUse, version: "" }]);
     if (type === "tech" && !techStack.find(t => t.name === textToUse)) setTechStack([...techStack, { name: textToUse, version: "" }]);
     if (type === "tools" && !securityTools.find(t => t.name === textToUse)) setSecurityTools([...securityTools, { name: textToUse, status: "Pending Configuration", type: "Custom Integration", connected: false, version: "" }]);
     
     setInputText("");
     setActiveInput(null);
     setShowSuggestions(false);
  };
  
  const handleAddFramework = async (fwName: string) => {
    if (!fwName.trim()) {
       setActiveInput(null);
       return;
    }
    
    if (frameworks.find(f => f.framework_name === fwName)) {
       setInputText("");
       setActiveInput(null);
       setShowSuggestions(false);
       return;
    }

    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/compliance/frameworks?org_id=default`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ org_id: "default", framework_name: fwName, version: "" })
      });
      if (res.ok) {
         const newFw = await res.json();
         setFrameworks([...frameworks, newFw]);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to add framework");
    } finally {
      setInputText("");
      setActiveInput(null);
      setShowSuggestions(false);
    }
  };

  const handleAddThreatActor = async (taName: string) => {
    if (!taName.trim()) {
       setActiveInput(null);
       return;
    }
    
    if (threatActors.find(a => a.name === taName)) {
       setInputText("");
       setActiveInput(null);
       setShowSuggestions(false);
       return;
    }

    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/threat-intel/actors?org_id=default`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ org_id: "default", name: taName, description: "Dynamically pinned threat actor.", sophistication: "intermediate" })
      });
      if (res.ok) {
         const newTa = await res.json();
         setThreatActors([newTa, ...threatActors]);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to add threat actor");
    } finally {
      setInputText("");
      setActiveInput(null);
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, type: "infra" | "tech" | "tools" | "frameworks" | "threat-actors") => {
     if (e.key === "Enter") {
         if (type === "frameworks") handleAddFramework(inputText);
         else if (type === "threat-actors") handleAddThreatActor(inputText);
         else handleAddSubmit(type as "infra" | "tech" | "tools");
     }
     if (e.key === "Escape") { setInputText(""); setActiveInput(null); setShowSuggestions(false); }
  };
  
  const getFilteredSuggestions = (type: "infra" | "tech" | "tools" | "frameworks" | "threat-actors") => {
     if (!inputText) return [];
     const query = inputText.toLowerCase();
     if (type === "infra") return INFRA_SUGGESTIONS.filter(s => s.toLowerCase().includes(query) && !providers.find(p => p.name === s));
     if (type === "tech") return TECH_SUGGESTIONS.filter(s => s.toLowerCase().includes(query) && !techStack.find(p => p.name === s));
     if (type === "tools") return TOOL_SUGGESTIONS.filter(s => s.toLowerCase().includes(query) && !securityTools.find(t => t.name === s));
     if (type === "frameworks") return FRAMEWORK_SUGGESTIONS.filter(s => s.toLowerCase().includes(query) && !frameworks.find((f:any) => f.framework_name === s));
     if (type === "threat-actors") return THREAT_ACTOR_SUGGESTIONS.filter(s => s.toLowerCase().includes(query) && !threatActors.find((a:any) => a.name === s));
     return [];
  };

  const SuggestionsDropdown = ({ type }: { type: typeof activeInput }) => {
     if (!showSuggestions || !inputText || !type) return null;
     const suggestions = getFilteredSuggestions(type);
     
     let alreadyAdded = false;
     if (type === "infra") alreadyAdded = !!providers.find(p => p.name.toLowerCase() === inputText.trim().toLowerCase());
     if (type === "tech") alreadyAdded = !!techStack.find(p => p.name.toLowerCase() === inputText.trim().toLowerCase());
     if (type === "tools") alreadyAdded = !!securityTools.find(p => p.name.toLowerCase() === inputText.trim().toLowerCase());
     if (type === "frameworks") alreadyAdded = !!frameworks.find(f => f.framework_name.toLowerCase() === inputText.trim().toLowerCase());
     if (type === "threat-actors") alreadyAdded = !!threatActors.find(a => a.name.toLowerCase() === inputText.trim().toLowerCase());

     const exactMatch = suggestions.find(s => s.toLowerCase() === inputText.trim().toLowerCase());
     
     if (suggestions.length === 0 && (exactMatch || alreadyAdded)) return null;
     
     return (
        <div className="absolute top-full left-0 mt-1 w-64 bg-card border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
          {suggestions.map(s => (
             <button
               key={s}
               className="w-full text-left px-3 py-2 text-sm hover:bg-muted text-foreground transition-colors"
               onMouseDown={(e) => {
                   e.preventDefault();
                   setInputText(s);
                   if (type === "frameworks") handleAddFramework(s);
                   else if (type === "threat-actors") handleAddThreatActor(s);
                   else handleAddSubmit(type as "infra" | "tech" | "tools", s);
               }}
             >
               {s}
             </button>
          ))}
          {!exactMatch && !alreadyAdded && inputText.trim() && (
             <button
               className="w-full text-left px-3 py-2 text-sm font-medium text-primary hover:bg-muted transition-colors border-t border-border/50"
               onMouseDown={(e) => {
                   e.preventDefault();
                   if (type === "frameworks") handleAddFramework(inputText.trim());
                   else if (type === "threat-actors") handleAddThreatActor(inputText.trim());
                   else handleAddSubmit(type as "infra" | "tech" | "tools", inputText.trim());
               }}
             >
               Add "{inputText.trim()}"
             </button>
          )}
        </div>
     );
  };

  const handleDelete = async (type: string, idOrName: string) => {
    if (type === "infra") setProviders(providers.filter(p => p.name !== idOrName));
    if (type === "tech") setTechStack(techStack.filter(p => p.name !== idOrName));
    if (type === "tools") setSecurityTools(securityTools.filter(p => p.name !== idOrName));
    
    if (type === "threat-actors") {
      setThreatActors(threatActors.filter(a => a.id !== idOrName));
      try {
        await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/threat-intel/actors/${idOrName}?org_id=default`, { method: "DELETE" });
      } catch (err) { console.error(err); }
    }
    
    if (type === "frameworks") {
      setFrameworks(frameworks.filter(f => f.id !== idOrName));
      try {
        await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/compliance/frameworks/${idOrName}?org_id=default`, { method: "DELETE" });
      } catch (err) { console.error(err); }
    }
  };

  const startEdit = (idOrName: string, currentVersion: string) => {
    setEditingId(idOrName);
    setEditVersion(currentVersion || "");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/organizations/upload-architecture`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        
        let shouldAlert = false;
        if (data.infra && data.infra.length > 0) {
           const newProviders = [...providers];
           data.infra.forEach((i: string) => {
               if(!newProviders.find(p => p.name === i)) newProviders.push({ name: i, version: "" });
           });
           setProviders(newProviders);
           shouldAlert = true;
        }
        
        if (data.tech && data.tech.length > 0) {
           const newTech = [...techStack];
           data.tech.forEach((t: string) => {
               if(!newTech.find(p => p.name === t)) newTech.push({ name: t, version: "" });
           });
           setTechStack(newTech);
           shouldAlert = true;
        }
        
        if (data.tools && data.tools.length > 0) {
           const newTools = [...securityTools];
           data.tools.forEach((t: any) => {
               if(!newTools.find(x => x.name === t.name)) {
                   newTools.push({ name: t.name, status: "Discovered by AI", type: t.type || "Tool", connected: false, version: "" });
               }
           });
           setSecurityTools(newTools);
           shouldAlert = true;
        }
        
        if (shouldAlert) {
            alert("Architecture successfully parsed and merged!");
        } else {
            alert("Upload successful, but AI couldn't detect any explicit infrastructure items.");
        }
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to scan and upload architecture");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to upload architecture diagram");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const saveEdit = async (type: string, idOrName: string) => {
    if (type === "infra") {
      setProviders(providers.map(p => p.name === idOrName ? { ...p, version: editVersion } : p));
    } else if (type === "tech") {
      setTechStack(techStack.map(p => p.name === idOrName ? { ...p, version: editVersion } : p));
    } else if (type === "tools") {
      setSecurityTools(securityTools.map(p => p.name === idOrName ? { ...p, version: editVersion } : p));
    } else if (type === "threat-actors") {
      setThreatActors(threatActors.map(a => a.id === idOrName ? { ...a, version: editVersion } : a));
      try {
        await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/threat-intel/actors/${idOrName}?org_id=default`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ version: editVersion })
        });
      } catch (err) { console.error(err); }
    } else if (type === "frameworks") {
      setFrameworks(frameworks.map(f => f.id === idOrName ? { ...f, version: editVersion } : f));
      try {
        await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/compliance/frameworks/${idOrName}?org_id=default`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ version: editVersion })
        });
      } catch (err) { console.error(err); }
    }
    
    setEditingId(null);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <Tabs defaultValue="stack" className="space-y-6 w-full">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="overflow-x-auto pb-2 -mb-2 xl:pb-0 xl:mb-0">
              <TabsList className="w-full sm:w-auto flex justify-start h-auto flex-wrap">
                <TabsTrigger value="stack" className="flex items-center gap-2"><Layers className="w-4 h-4" /> Cloud Infra</TabsTrigger>
                <TabsTrigger value="app" className="flex items-center gap-2"><Database className="w-4 h-4" /> App Stack</TabsTrigger>
                <TabsTrigger value="tools" className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Security Tools</TabsTrigger>
                <TabsTrigger value="threat-actors" className="flex items-center gap-2"><Users className="w-4 h-4" /> Threat Actors</TabsTrigger>
                <TabsTrigger value="frameworks" className="flex items-center gap-2"><FileCheck className="w-4 h-4" /> Frameworks</TabsTrigger>
              </TabsList>
            </div>
            <div className="flex w-full xl:w-auto relative">
              <label 
                className={cn(
                  "px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium rounded-md shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer w-full md:w-64",
                  uploading ? "opacity-50 cursor-not-allowed" : ""
                )}
              >
                <Upload className="h-4 w-4" />
                {uploading ? "Scanning..." : "Upload Architecture"}
                <input 
                  type="file" 
                  accept=".pdf,image/png,image/jpeg,image/webp" 
                  className="hidden" 
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          <div>
            <p className="text-muted-foreground max-w-2xl text-sm mb-4">
              Define your organizational infrastructure and active security stack. Upload a diagram or SBOM for automatic AI population.
            </p>
            {/* Status Indicator */}
            <div className="bg-green-500/10 border border-green-500/20 text-green-500 px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                Continuous Correlation Engine Active.
            </div>
          </div>

        {/* CLOUD INFRA */}
        <TabsContent value="stack">
           <div className="grid gap-6 animate-in fade-in duration-300 mt-2">
               <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 sm:gap-0 mb-6">
                     <div>
                         <h2 className="text-xl font-bold text-foreground">Infrastructure & Cloud Providers</h2>
                         <p className="text-sm text-muted-foreground mt-1">Select the environments hosting your datasets.</p>
                     </div>
                     {activeInput === "infra" ? (
                        <div className="relative z-10 flex flex-col items-start gap-2">
                           <input type="text" autoFocus className="bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-primary w-64" placeholder="e.g. EC2, ACK, GKE, etc.." value={inputText} onChange={(e) => { setInputText(e.target.value); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} onKeyDown={(e) => handleKeyDown(e, "infra")} />
                           <SuggestionsDropdown type="infra" />
                        </div>
                     ) : (
                        <button onClick={() => setActiveInput("infra")} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 hover:bg-primary/90 transition-colors">
                           <Plus className="w-4 h-4" /> Add Component
                        </button>
                     )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {providers.map(provider => (
                        <div key={provider.name} className="border border-border/50 bg-muted/20 p-4 rounded-lg flex items-center justify-between group hover:border-primary/50 transition-colors">
                            <div className="flex flex-col">
                               <span className="font-medium text-foreground">{provider.name}</span>
                               {editingId === provider.name ? (
                                   <div className="flex items-center gap-2 mt-2">
                                     <input autoFocus type="text" className="bg-background border border-border rounded-sm px-2 py-1 text-xs w-24 focus:outline-none focus:border-primary" placeholder="Version..." value={editVersion} onChange={e => setEditVersion(e.target.value)} onKeyDown={e => e.key === "Enter" && saveEdit("infra", provider.name)} />
                                     <button onClick={() => saveEdit("infra", provider.name)} className="bg-primary text-primary-foreground px-3 py-1 text-xs rounded-md">Save</button>
                                     <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground text-xs font-medium px-2 py-1">Cancel</button>
                                   </div>
                               ) : (
                                   <span className="text-xs text-muted-foreground mt-1">{provider.version ? `v${provider.version.replace(/^v/i, '')}` : ""}</span>
                               )}
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => startEdit(provider.name, provider.version)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"><Edit2 className="w-4 h-4"/></button>
                               <button onClick={() => handleDelete("infra", provider.name)} className="p-1.5 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-md"><Trash2 className="w-4 h-4"/></button>
                            </div>
                        </div>
                     ))}
                  </div>
               </div>
           </div>
        </TabsContent>

        {/* APP STACK */}
        <TabsContent value="app">
           <div className="grid gap-6 animate-in fade-in duration-300 mt-2">
               <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 sm:gap-0 mb-6">
                     <div>
                         <h2 className="text-xl font-bold text-foreground">Core Application Stack</h2>
                         <p className="text-sm text-muted-foreground mt-1">Programming languages, frameworks, and core databases.</p>
                     </div>
                     {activeInput === "tech" ? (
                        <div className="relative z-10 flex flex-col items-start gap-2">
                           <input type="text" autoFocus className="bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-primary w-64" placeholder="e.g. Terraform..." value={inputText} onChange={(e) => { setInputText(e.target.value); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} onKeyDown={(e) => handleKeyDown(e, "tech")} />
                           <SuggestionsDropdown type="tech" />
                        </div>
                     ) : (
                        <button onClick={() => setActiveInput("tech")} className="bg-muted hover:bg-muted-foreground/20 text-foreground px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 transition-colors border border-border">
                           <Plus className="w-4 h-4" /> Add Tech
                        </button>
                     )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {techStack.map(tech => (
                        <div key={tech.name} className="border border-border/50 bg-muted/20 p-4 rounded-lg flex items-center justify-between group hover:border-primary/50 transition-colors">
                            <div className="flex flex-col">
                               <span className="font-medium text-foreground">{tech.name}</span>
                               {editingId === tech.name ? (
                                   <div className="flex items-center gap-2 mt-2">
                                     <input autoFocus type="text" className="bg-background border border-border rounded-sm px-2 py-1 text-xs w-24 focus:outline-none focus:border-primary" placeholder="Version..." value={editVersion} onChange={e => setEditVersion(e.target.value)} onKeyDown={e => e.key === "Enter" && saveEdit("tech", tech.name)} />
                                     <button onClick={() => saveEdit("tech", tech.name)} className="bg-primary text-primary-foreground px-3 py-1 text-xs rounded-md">Save</button>
                                     <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground text-xs font-medium px-2 py-1">Cancel</button>
                                   </div>
                               ) : (
                                   <span className="text-xs text-muted-foreground mt-1">{tech.version ? `v${tech.version.replace(/^v/i, '')}` : ""}</span>
                               )}
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => startEdit(tech.name, tech.version)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"><Edit2 className="w-4 h-4"/></button>
                               <button onClick={() => handleDelete("tech", tech.name)} className="p-1.5 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-md"><Trash2 className="w-4 h-4"/></button>
                            </div>
                        </div>
                     ))}
                  </div>
               </div>
           </div>
        </TabsContent>

        {/* SECURITY TOOLS */}
        <TabsContent value="tools">
           <div className="grid gap-6 animate-in fade-in duration-300 mt-2">
               <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 sm:gap-0 mb-6">
                     <div>
                         <h2 className="text-xl font-bold text-foreground">Active Security Tooling</h2>
                         <p className="text-sm text-muted-foreground mt-1">Integrate telemetry from your existing EDR, SIEM, and vulnerability scanners.</p>
                     </div>
                     {activeInput === "tools" ? (
                        <div className="relative z-10 flex flex-col items-start gap-2">
                           <input type="text" autoFocus className="bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-primary w-64" placeholder="e.g. Datadog..." value={inputText} onChange={(e) => { setInputText(e.target.value); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} onKeyDown={(e) => handleKeyDown(e, "tools")} />
                           <SuggestionsDropdown type="tools" />
                        </div>
                     ) : (
                        <button onClick={() => setActiveInput("tools")} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 hover:bg-primary/90 transition-colors">
                           <Plus className="w-4 h-4" /> Add Tool
                        </button>
                     )}
                  </div>
                  
                  <div className="space-y-4">
                     {securityTools.map(tool => (
                        <div key={tool.name} className="flex flex-col sm:flex-row justify-between gap-4 border border-border/50 bg-muted/10 p-4 rounded-lg group">
                           <div>
                              <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-foreground">{tool.name}</span>
                                  <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{tool.type}</span>
                                  {tool.version && <span className="text-xs text-muted-foreground border border-border px-1.5 py-0.5 rounded bg-muted">v{tool.version.replace(/^v/i, '')}</span>}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                  <div className={cn("w-2 h-2 rounded-full", tool.connected ? "bg-green-500" : "bg-amber-500")}></div>
                                  <span className="text-xs text-muted-foreground">{tool.status}</span>
                              </div>
                              {editingId === tool.name && (
                                   <div className="flex items-center gap-2 mt-4">
                                     <input autoFocus type="text" className="bg-background border border-border rounded-sm px-2 py-1 text-xs w-24 focus:outline-none focus:border-primary" placeholder="Version..." value={editVersion} onChange={e => setEditVersion(e.target.value)} onKeyDown={e => e.key === "Enter" && saveEdit("tools", tool.name)} />
                                     <button onClick={() => saveEdit("tools", tool.name)} className="bg-primary text-primary-foreground px-3 py-1 text-xs rounded-md">Save</button>
                                     <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground text-xs font-medium px-2 py-1">Cancel</button>
                                   </div>
                               )}
                           </div>
                           <div className="flex items-start sm:items-center gap-2 self-start sm:self-center">
                               <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => startEdit(tool.name, tool.version)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"><Edit2 className="w-4 h-4"/></button>
                                  <button onClick={() => handleDelete("tools", tool.name)} className="p-1.5 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-md"><Trash2 className="w-4 h-4"/></button>
                               </div>
                               <button className={cn("px-4 py-1.5 rounded text-sm font-medium border transition-colors ml-2", tool.connected ? "bg-background text-foreground border-border hover:bg-muted" : "bg-primary text-primary-foreground border-primary hover:bg-primary/90")}>
                                   {tool.connected ? "Configure" : "Connect"}
                               </button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
           </div>
        </TabsContent>

        {/* THREAT ACTORS */}
        <TabsContent value="threat-actors">
           <div className="grid gap-6 animate-in fade-in duration-300 mt-2">
               <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 sm:gap-0 mb-6">
                     <div>
                         <h2 className="text-xl font-bold text-foreground">Monitored Threat Actors</h2>
                         <p className="text-sm text-muted-foreground mt-1">Advanced Persistent Threats (APTs) monitored dynamically based on your industry and stack.</p>
                     </div>
                     {activeInput === "threat-actors" ? (
                        <div className="relative z-10 flex flex-col items-start gap-2">
                           <input type="text" autoFocus className="bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-primary w-64" placeholder="e.g. Lazarus Group, Scattered Spider..." value={inputText} onChange={(e) => { setInputText(e.target.value); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} onKeyDown={(e) => handleKeyDown(e, "threat-actors")} />
                           <SuggestionsDropdown type="threat-actors" />
                        </div>
                     ) : (
                        <button onClick={() => setActiveInput("threat-actors")} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 hover:bg-primary/90 transition-colors">
                           <Plus className="w-4 h-4" /> Add Threat Actor
                        </button>
                     )}
                  </div>
                  
                  <div className="space-y-4">
                     {loadingApi ? (
                        <div className="py-8 text-center text-muted-foreground animate-pulse">Loading tracked actors...</div>
                     ) : threatActors.length > 0 ? (
                       threatActors.map((actor: any) => (
                          <div key={actor.id} className="border border-border/50 bg-muted/10 p-4 rounded-lg flex flex-col justify-between group transition-colors">
                              <div className="flex items-start sm:items-center justify-between mb-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-foreground">{actor.name}</span>
                                  {actor.version && <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">v{actor.version.replace(/^v/i, '')}</span>}
                                </div>
                                <div className="flex items-center gap-2 ml-2">
                                  <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider hidden sm:block whitespace-nowrap">
                                    {actor.sophistication?.replace("_", " ")}
                                  </span>
                                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                     <button onClick={() => startEdit(actor.id, actor.version)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"><Edit2 className="w-4 h-4"/></button>
                                     <button onClick={() => handleDelete("threat-actors", actor.id)} className="p-1.5 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-md"><Trash2 className="w-4 h-4"/></button>
                                  </div>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mt-2">{actor.description}</p>
                              {editingId === actor.id && (
                                   <div className="flex items-center gap-2 mt-4">
                                     <input autoFocus type="text" className="bg-background border border-border rounded-sm px-2 py-1 text-xs w-24 focus:outline-none focus:border-primary" placeholder="Version..." value={editVersion} onChange={e => setEditVersion(e.target.value)} onKeyDown={e => e.key === "Enter" && saveEdit("threat-actors", actor.id)} />
                                     <button onClick={() => saveEdit("threat-actors", actor.id)} className="bg-primary text-primary-foreground px-3 py-1 text-xs rounded-md">Save</button>
                                     <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground text-xs font-medium px-2 py-1">Cancel</button>
                                   </div>
                               )}
                          </div>
                       ))
                     ) : (
                       <div className="py-8 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/20">No active threat actors mapped.</div>
                     )}
                  </div>
               </div>
           </div>
        </TabsContent>

        {/* FRAMEWORKS */}
        <TabsContent value="frameworks">
           <div className="grid gap-6 animate-in fade-in duration-300 mt-2">
               <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 sm:gap-0 mb-6">
                     <div>
                         <h2 className="text-xl font-bold text-foreground">Global Compliance Frameworks</h2>
                         <p className="text-sm text-muted-foreground mt-1">Security frameworks actively mapped and enforced across your telemetry.</p>
                     </div>
                     {activeInput === "frameworks" ? (
                        <div className="relative z-10 flex flex-col items-start gap-2">
                           <input type="text" autoFocus className="bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-primary w-64" placeholder="e.g. SOC 2 Type II..." value={inputText} onChange={(e) => { setInputText(e.target.value); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} onKeyDown={(e) => handleKeyDown(e, "frameworks")} />
                           <SuggestionsDropdown type="frameworks" />
                        </div>
                     ) : (
                        <button onClick={() => setActiveInput("frameworks")} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 hover:bg-primary/90 transition-colors">
                           <Plus className="w-4 h-4" /> Enable Framework
                        </button>
                     )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {loadingApi ? (
                        <div className="py-8 text-center text-muted-foreground animate-pulse col-span-full">Loading injected frameworks...</div>
                     ) : frameworks.length > 0 ? (
                       frameworks.map((fw: any) => (
                          <div key={fw.id} className="border border-border/50 bg-muted/10 p-4 rounded-lg flex items-start gap-3 group transition-colors justify-between">
                              <div className="flex gap-3">
                                <div className="p-2 bg-primary/10 rounded-md hidden sm:block shrink-0 h-fit">
                                  <FileCheck className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-foreground flex flex-wrap items-center gap-2">
                                    {fw.framework_name} 
                                    {fw.version && <span className="text-xs font-normal text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded">v{fw.version.replace(/^v/i, '')}</span>}
                                  </span>
                                  {editingId === fw.id && (
                                     <div className="flex items-center gap-2 mt-3 p-1">
                                       <input autoFocus type="text" className="bg-background border border-border rounded-sm px-2 py-1 text-xs w-24 focus:outline-none focus:border-primary" placeholder="Version..." value={editVersion} onChange={e => setEditVersion(e.target.value)} onKeyDown={e => e.key === "Enter" && saveEdit("frameworks", fw.id)} />
                                       <button onClick={() => saveEdit("frameworks", fw.id)} className="bg-primary text-primary-foreground px-3 py-1 text-xs rounded-md">Save</button>
                                       <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground text-xs font-medium px-2 py-1">Cancel</button>
                                     </div>
                                 )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                 <button onClick={() => startEdit(fw.id, fw.version)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"><Edit2 className="w-4 h-4"/></button>
                                 <button onClick={() => handleDelete("frameworks", fw.id)} className="p-1.5 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-md"><Trash2 className="w-4 h-4"/></button>
                              </div>
                          </div>
                       ))
                     ) : (
                       <div className="py-8 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/20 col-span-full">No active frameworks.</div>
                     )}
                  </div>
               </div>
           </div>
        </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}
