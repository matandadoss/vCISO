"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Server, Shield, Globe, Users, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import InviteTeamModal from "./InviteTeamModal";
import { cn } from "@/lib/utils";

const INFRA_SUGGESTIONS = ["AWS EC2", "AWS S3", "AWS RDS", "AWS Lambda", "Google Kubernetes Engine (GKE)", "Google Cloud Storage (GCS)", "Alibaba Cloud Container Service (ACK)", "DigitalOcean Droplets", "Azure Virtual Machines", "Azure Blob Storage", "On-Premises Servers", "VMware vSphere"];
const TECH_SUGGESTIONS = ["Node.js", "Python", "React", "PostgreSQL", "MongoDB", "Redis", "Docker", "Kubernetes", "Terraform", "GitHub Actions", "GitLab CI", "Java", "Go", "Rust", "C#", "FastAPI", "Next.js", "Express.js", "Spring Boot", "MySQL", "Elasticsearch"];
const TOOL_SUGGESTIONS = ["SentinelOne", "Datadog", "CrowdStrike Falcon", "Palo Alto Prisma Cloud", "Splunk Enterprise", "Tenable Nessus", "Wiz", "Snyk", "Checkmarx", "TruffleHog", "Rapid7", "Qualys", "Veracode", "SonarQube", "Aqua Security", "Lacework"];
export type SetupData = {
  companyName: string;
  fullName: string;
  infraStack: string[];
  techStack: string[];
  securityTools: string[];
  regions: string[];
  suppliers: string[];
};

interface SetupWizardProps {
  onComplete: (data: SetupData) => void;
  uid: string;
}

const regionOptions = ["North America (US/CA)", "Europe (EU/UK)", "Asia Pacific (APAC)", "Latin America", "Global"];

export default function SetupWizard({ onComplete, uid }: SetupWizardProps) {
  const [cloudProviders, setCloudProviders] = useState(["Google Cloud Platform", "AWS", "Microsoft Azure", "On-Premises", "Other"]);
  const [coreTechStack, setCoreTechStack] = useState(["Node.js", "Python", "React", "PostgreSQL", "MongoDB", "Redis", "Docker", "Kubernetes"]);
  const [securityIntegrations, setSecurityIntegrations] = useState([
    { name: "CrowdStrike Falcon", type: "EDR" },
    { name: "Palo Alto Prisma Cloud", type: "CSPM" },
    { name: "Splunk Enterprise", type: "SIEM" },
    { name: "Tenable Nessus", type: "Vuln Scanner" }
  ]);
  
  const [activeInput, setActiveInput] = useState<"infra" | "tech" | "tools" | null>(null);
  const [inputText, setInputText] = useState("");
  const [step, setStep] = useState(1);
  const [data, setData] = useState<SetupData>({
    companyName: "",
    fullName: "",
    infraStack: [],
    techStack: [],
    securityTools: [],
    regions: [],
    suppliers: [],
  });
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 5;

  const handleNext = () => {
    if (step === 1 && (!data.companyName.trim() || !data.fullName.trim())) {
       setError("Name and Company Name are required.");
       return;
    }
    setError(null);
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) setStep(step - 1);
  };

  const handleSkip = () => {
    setError(null);
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setFinalizing(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    onComplete(data);
  };

  const toggleArrayItem = (field: keyof SetupData, item: string) => {
    const arr = data[field] as string[];
    if (arr.includes(item)) {
      setData({ ...data, [field]: arr.filter(i => i !== item) });
    } else {
      setData({ ...data, [field]: [...arr, item] });
    }
  };

  const handleAddSubmit = (type: "infra" | "tech" | "tools") => {
     if (!inputText.trim()) {
        setActiveInput(null);
        return;
     }
     
     if (type === "infra") {
         setCloudProviders([...cloudProviders, inputText]);
         toggleArrayItem("infraStack", inputText);
     }
     if (type === "tech") {
         setCoreTechStack([...coreTechStack, inputText]);
         toggleArrayItem("techStack", inputText);
     }
     if (type === "tools") {
         setSecurityIntegrations([...securityIntegrations, { name: inputText, type: "Custom Integration" }]);
         toggleArrayItem("securityTools", inputText);
     }
     
     setInputText("");
     setActiveInput(null);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent, type: "infra" | "tech" | "tools") => {
     if (e.key === "Enter") handleAddSubmit(type);
     if (e.key === "Escape") { setInputText(""); setActiveInput(null); }
  };

  const currentStepIsRequired = step === 1;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/30 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/20 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="w-full max-w-3xl z-10">
        {/* Progress Bar Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Setup Step {step} of {totalSteps}
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsInviteModalOpen(true)}
                className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-full transition-colors font-medium border border-primary/20"
              >
                <Users className="w-3.5 h-3.5" />
                Invite Team
              </button>
            </div>
          </div>
          <div className="h-2 w-full bg-border rounded-full overflow-hidden flex">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div 
                key={i} 
                className={`flex-1 h-full transition-all duration-500 ${i < step ? "bg-primary" : "bg-transparent"} ${i < totalSteps - 1 ? "border-r border-background/20" : ""}`}
              />
            ))}
          </div>
        </div>

        {/* Wizard Container */}
        <div className="bg-card border border-border shadow-2xl rounded-2xl overflow-hidden relative min-h-[450px] flex flex-col">
          {error && (
            <div className="bg-red-500/10 border-b border-red-500/20 p-3 flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="p-8 flex-1 flex flex-col">
            <AnimatePresence mode="wait">
              
              {/* --- STEP 1: PROFILE --- */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col"
                >
                  <div className="mb-8">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 border border-primary/20">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to Virtual CISO</h1>
                    <p className="text-muted-foreground">Let's set up your organization's security profile. We'll start with the basics.</p>
                  </div>
                  
                  <div className="space-y-5 flex-1">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Your Full Name *</label>
                      <input 
                        type="text" 
                        value={data.fullName}
                        onChange={(e) => setData({...data, fullName: e.target.value})}
                        className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                        placeholder="Jane Doe"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Company Name *</label>
                      <input 
                        type="text" 
                        value={data.companyName}
                        onChange={(e) => setData({...data, companyName: e.target.value})}
                        className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                        placeholder="Acme Corp"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* --- STEP 2: INFRASTRUCTURE --- */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col"
                >
                  <div className="mb-6">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 border border-blue-500/20">
                      <Server className="w-6 h-6 text-blue-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Infrastructure Stack</h1>
                    <p className="text-muted-foreground">Where does your data live? Select all environments that apply.</p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-6">
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-3">
                         <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">Infrastructure & Cloud Providers</h3>
                         {activeInput === "infra" ? (
                            <div className="flex items-center gap-1.5">
                              <input 
                                type="text" 
                                autoFocus 
                                className="bg-background border border-border rounded-md px-2 py-1 text-xs focus:outline-none focus:border-primary max-w-[150px]" 
                                placeholder="e.g. EC2, ACK, GKE, etc.." 
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, "infra")}
                              />
                              <button onClick={() => handleAddSubmit("infra")} className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium hover:bg-primary/90 transition-colors">Add</button>
                              <button onClick={() => { setInputText(""); setActiveInput(null); }} className="text-muted-foreground hover:text-foreground px-1.5 py-1 text-xs font-medium transition-colors">✕</button>
                            </div>
                         ) : (
                            <button onClick={() => setActiveInput("infra")} className="text-xs text-primary hover:text-primary/80 font-medium">+ Add Component</button>
                         )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {cloudProviders.map(provider => (
                          <button
                            key={provider}
                            onClick={() => toggleArrayItem("infraStack", provider)}
                            className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between text-sm
                              ${data.infraStack.includes(provider) 
                                ? "bg-blue-500/10 border-blue-500/50 text-foreground" 
                                : "bg-background border-border text-muted-foreground hover:border-muted-foreground/50"}`}
                          >
                            <span className="font-medium">{provider}</span>
                            {data.infraStack.includes(provider) && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                         <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">Core Application Stack</h3>
                         {activeInput === "tech" ? (
                            <div className="flex items-center gap-1.5">
                              <input 
                                type="text" 
                                autoFocus 
                                list="setup-tech"
                                className="bg-background border border-border rounded-md px-2 py-1 text-xs focus:outline-none focus:border-primary max-w-[150px]" 
                                placeholder="e.g. S3, Terraform..." 
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, "tech")}
                              />
                              <datalist id="setup-tech">
                                {TECH_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                              </datalist>
                              <button onClick={() => handleAddSubmit("tech")} className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium hover:bg-primary/90 transition-colors">Add</button>
                              <button onClick={() => { setInputText(""); setActiveInput(null); }} className="text-muted-foreground hover:text-foreground px-1.5 py-1 text-xs font-medium transition-colors">✕</button>
                            </div>
                         ) : (
                            <button onClick={() => setActiveInput("tech")} className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors">+ Add to App Stack</button>
                         )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {coreTechStack.map(tech => (
                          <button
                            key={tech}
                            onClick={() => toggleArrayItem("techStack", tech)}
                            className={`py-2 px-3 rounded-lg border text-center transition-all text-xs font-medium
                              ${data.techStack.includes(tech) 
                                ? "bg-blue-500/10 border-blue-500/50 text-blue-500" 
                                : "bg-background border-border text-muted-foreground hover:border-muted-foreground/50"}`}
                          >
                            {tech}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* --- STEP 3: SECURITY TOOLS --- */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 border border-emerald-500/20">
                          <Shield className="w-6 h-6 text-emerald-500" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Security Tooling</h1>
                        <p className="text-muted-foreground">Which categories of security tools do you currently utilize?</p>
                    </div>
                  </div>
                  
                  {activeInput === "tools" && (
                      <div className="mb-4 bg-muted/20 border border-border rounded-xl p-4 flex gap-3">
                         <input 
                           type="text" 
                           autoFocus 
                           list="setup-tools"
                           className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary" 
                           placeholder="Type a custom security integration... (e.g. SentinelOne, Datadog)" 
                           value={inputText}
                           onChange={(e) => setInputText(e.target.value)}
                           onKeyDown={(e) => handleKeyDown(e, "tools")}
                         />
                         <datalist id="setup-tools">
                           {TOOL_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                         </datalist>
                         <button onClick={() => handleAddSubmit("tools")} className="bg-primary text-primary-foreground px-4 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">Integrate</button>
                         <button onClick={() => { setInputText(""); setActiveInput(null); }} className="px-3 hover:bg-muted rounded-md text-muted-foreground transition-colors text-sm font-medium">Cancel</button>
                      </div>
                  )}
                  
                  <div className="grid grid-cols-1 gap-3 flex-1 overflow-y-auto pr-2 pb-4">
                    {activeInput !== "tools" && (
                       <button onClick={() => setActiveInput("tools")} className="p-4 rounded-xl border border-dashed border-border/70 hover:border-primary/50 text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                          <span className="text-lg">+</span> Add Tool
                       </button>
                    )}
                    {securityIntegrations.map(tool => (
                      <button
                        key={tool.name}
                        onClick={() => toggleArrayItem("securityTools", tool.name)}
                        className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between group
                          ${data.securityTools.includes(tool.name) 
                            ? "bg-emerald-500/10 border-emerald-500/50 text-foreground" 
                            : "bg-background border-border hover:border-muted-foreground/50"}`}
                      >
                        <div>
                           <div className="flex items-center gap-2">
                               <span className={cn("font-bold text-sm", data.securityTools.includes(tool.name) ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>{tool.name}</span>
                               <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{tool.type}</span>
                           </div>
                           <div className="flex items-center gap-2 mt-1.5">
                               <div className={cn("w-1.5 h-1.5 rounded-full", data.securityTools.includes(tool.name) ? "bg-emerald-500" : "bg-muted-foreground/30")}></div>
                               <span className="text-[11px] text-muted-foreground">{data.securityTools.includes(tool.name) ? "Selected for Integration" : "Click to Select"}</span>
                           </div>
                        </div>
                        {data.securityTools.includes(tool.name) && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 ml-4" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* --- STEP 4: REGIONS --- */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col"
                >
                  <div className="mb-6">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 border border-purple-500/20">
                      <Globe className="w-6 h-6 text-purple-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Operating Regions</h1>
                    <p className="text-muted-foreground">Select regions where you operate to tailor your compliance and data residency requirements.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 flex-1 overflow-y-auto pr-2">
                    {regionOptions.map(region => (
                      <button
                        key={region}
                        onClick={() => {
                          if (region === "Global") {
                             if (data.regions.includes("Global")) {
                               setData({ ...data, regions: [] });
                             } else {
                               setData({ ...data, regions: [...regionOptions] });
                             }
                          } else {
                             let newRegions = [...data.regions];
                             if (newRegions.includes(region)) {
                               // Remove the region and also remove 'Global' since it's no longer global
                               newRegions = newRegions.filter(r => r !== region && r !== "Global");
                             } else {
                               newRegions.push(region);
                               // Check if all native regions are now selected, if so, auto-select Global
                               const allOthers = regionOptions.filter(r => r !== "Global");
                               const hasAllOthers = allOthers.every(r => newRegions.includes(r));
                               if (hasAllOthers && !newRegions.includes("Global")) {
                                 newRegions.push("Global");
                               }
                             }
                             setData({ ...data, regions: newRegions });
                          }
                        }}
                        className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between
                          ${data.regions.includes(region) 
                            ? "bg-purple-500/10 border-purple-500/50 text-foreground" 
                            : "bg-background border-border text-muted-foreground hover:border-muted-foreground/50"}`}
                      >
                        <span className="font-medium">{region}</span>
                        {data.regions.includes(region) && <CheckCircle2 className="w-5 h-5 text-purple-500" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* --- STEP 5: VENDORS --- */}
              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col"
                >
                  <div className="mb-6">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4 border border-amber-500/20">
                      <Building2 className="w-6 h-6 text-amber-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Key Suppliers</h1>
                    <p className="text-muted-foreground">Identify critical third-party vendors for initial supply-chain risk mapping.</p>
                  </div>
                  
                  <div className="space-y-4 flex-1">
                     <p className="text-sm border border-border bg-muted/40 p-4 rounded-lg">
                        <strong>Feature Note:</strong> Vendor intelligence connection will automatically sync your existing procurement software once setup is complete. For now, you can skip this step.
                     </p>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-border bg-muted/20 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={step === 1 || finalizing}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                step === 1 || finalizing ? "opacity-0 cursor-default" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              Back
            </button>

            <div className="flex gap-3">
              {!currentStepIsRequired && (
                <button
                  onClick={handleSkip}
                  disabled={finalizing}
                  className="px-6 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  Skip
                </button>
              )}
              
              <button
                onClick={handleNext}
                disabled={finalizing}
                className="px-8 py-2.5 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm"
              >
                {finalizing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Finalizing...</>
                ) : (
                  step === totalSteps ? "Finish Setup" : "Next Step"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Invite Modal */}
      <InviteTeamModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
        onBail={() => handleComplete()} 
      />
    </div>
  );
}
