"use client";
import { fetchWithAuth } from "@/lib/api";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Building, Database, FileCheck, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export default function OnboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [org, setOrg] = useState({ name: "", industry: "technology", size: "1-50" });
  const [integrations, setIntegrations] = useState<string[]>([]);
  const [frameworks, setFrameworks] = useState<string[]>([]);

  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const toggleIntegration = (id: string) => {
    setIntegrations(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleFramework = (id: string) => {
    setFrameworks(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleComplete = async () => {
    setLoading(true);
    setStep(4); // Move to baseline generation step
    
    try {
      await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/onboarding/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organization: org, integrations, frameworks })
      });
      // Simulate baseline generation time
      setTimeout(() => {
        router.push("/"); // Redirect to dashboard
      }, 3500);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex-1 min-h-[calc(100vh-4rem)] bg-background flex flex-col items-center justify-center p-4">
      
      <div className="w-full max-w-3xl">
        <div className="hidden">
           {/* Title moved to global AppHeader */}
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-center mb-12">
           <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className="flex items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                    step === s ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : 
                    step > s ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                  </div>
                  {s < 4 && <div className={cn("w-12 h-1 mx-2 rounded-full", step > s ? "bg-primary/50" : "bg-muted")} />}
                </div>
              ))}
           </div>
        </div>

        {/* Card Container */}
        <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden min-h-[450px] flex flex-col relative">
          
          {/* Step 1: Organization */}
          {step === 1 && (
             <div className="p-8 flex-1 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold flex items-center gap-2"><Building className="w-6 h-6 text-primary" /> Organization Profile</h2>
                  <p className="text-muted-foreground mt-2">Help the AI contextualize threats based on your industry and size.</p>
                </div>
                
                <div className="space-y-6 max-w-md mx-auto">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Organization Name</label>
                    <input 
                      type="text" 
                      value={org.name}
                      onChange={e => setOrg({...org, name: e.target.value})}
                      className="w-full bg-background border border-border rounded-md px-4 py-2 focus:ring-2 ring-primary focus:outline-none" 
                      placeholder="e.g. Acme Corp" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Industry Vertical</label>
                    <select 
                      value={org.industry}
                      onChange={e => setOrg({...org, industry: e.target.value})}
                      className="w-full bg-background border border-border rounded-md px-4 py-2 focus:ring-2 ring-primary focus:outline-none"
                    >
                      <option value="technology">Technology & SaaS</option>
                      <option value="finance">Financial Services</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="retail">Retail & E-commerce</option>
                      <option value="manufacturing">Manufacturing</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Employee Count</label>
                    <select 
                      value={org.size}
                      onChange={e => setOrg({...org, size: e.target.value})}
                      className="w-full bg-background border border-border rounded-md px-4 py-2 focus:ring-2 ring-primary focus:outline-none"
                    >
                      <option value="1-50">1 - 50</option>
                      <option value="51-200">51 - 200</option>
                      <option value="201-1000">201 - 1,000</option>
                      <option value="1000+">1,000+</option>
                    </select>
                  </div>
                </div>
             </div>
          )}

          {/* Step 2: Connections */}
          {step === 2 && (
             <div className="p-8 flex-1 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold flex items-center gap-2"><Database className="w-6 h-6 text-primary" /> Connect Data Sources</h2>
                  <p className="text-muted-foreground mt-2">Select the infrastructure and security tools you want the vCISO to ingest.</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                   {[
                     { id: "aws", name: "AWS CloudTrail", type: "Cloud" },
                     { id: "gcp", name: "GCP SCC", type: "Cloud" },
                     { id: "azure", name: "Azure Sentinel", type: "Cloud" },
                     { id: "crowdstrike", name: "CrowdStrike Falcon", type: "EDR" },
                     { id: "okta", name: "Okta Identity", type: "IAM" },
                     { id: "github", name: "GitHub AdvSec", type: "Code" },
                   ].map(source => (
                     <div 
                       key={source.id} 
                       onClick={() => toggleIntegration(source.id)}
                       className={cn(
                         "border rounded-lg p-4 cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-2 h-32 hover:border-primary/50 hover:bg-muted/30",
                         integrations.includes(source.id) ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"
                       )}
                     >
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">{source.type}</div>
                        <span className="font-semibold text-sm">{source.name}</span>
                        {integrations.includes(source.id) && <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-primary" />}
                     </div>
                   ))}
                </div>
             </div>
          )}

          {/* Step 3: Frameworks */}
          {step === 3 && (
             <div className="p-8 flex-1 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold flex items-center gap-2"><FileCheck className="w-6 h-6 text-primary" /> Select Frameworks</h2>
                  <p className="text-muted-foreground mt-2">Choose the compliance frameworks you need to track and report against.</p>
                </div>

                <div className="space-y-4 max-w-lg mx-auto">
                   {[
                     { id: "soc2", name: "SOC 2 Type II", desc: "Security, Availability, Processing Integrity, Confidentiality." },
                     { id: "iso27001", name: "ISO 27001", desc: "Information security management systems standard." },
                     { id: "hipaa", name: "HIPAA", desc: "Health Insurance Portability and Accountability Act." },
                     { id: "gdpr", name: "GDPR", desc: "General Data Protection Regulation." },
                     { id: "cis", name: "CIS Critical Security Controls", desc: "Best practices for securing IT systems and data." },
                   ].map(fw => (
                     <div 
                       key={fw.id} 
                       onClick={() => toggleFramework(fw.id)}
                       className={cn(
                         "border rounded-lg p-4 cursor-pointer transition-all flex items-start gap-4 hover:border-primary/50 hover:bg-muted/30",
                         frameworks.includes(fw.id) ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"
                       )}
                     >
                        <div className={cn(
                          "w-5 h-5 rounded border mt-0.5 flex items-center justify-center",
                          frameworks.includes(fw.id) ? "bg-primary border-primary" : "border-muted-foreground"
                        )}>
                           {frameworks.includes(fw.id) && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <div>
                           <span className="font-bold block">{fw.name}</span>
                           <span className="text-sm text-muted-foreground">{fw.desc}</span>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          )}

          {/* Step 4: Loading Baseline */}
          {step === 4 && (
             <div className="p-16 flex-1 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                <div className="relative mb-8">
                   <div className="w-24 h-24 rounded-full border-4 border-muted border-t-primary animate-spin"></div>
                   <ShieldAlert className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Generating Baseline Posture...</h2>
                <p className="text-muted-foreground max-w-md">
                   The Virtual CISO AI is currently ingesting configurations from your connected sources and mapping them to {frameworks.length > 0 ? frameworks[0].toUpperCase() : 'your selected framework'}.
                </p>
                
                <div className="w-full max-w-xs mt-8 space-y-2">
                   <div className="flex justify-between text-xs text-muted-foreground font-mono">
                      <span>Initializing Graph Database</span>
                      <span>Success</span>
                   </div>
                   <div className="flex justify-between text-xs text-muted-foreground font-mono">
                      <span>Ingesting Cloud Configurations</span>
                      <span>Success</span>
                   </div>
                   <div className="flex justify-between text-xs text-primary font-mono font-bold animate-pulse">
                      <span>Mapping Compliance Controls</span>
                      <span>In Progress...</span>
                   </div>
                </div>
             </div>
          )}

          {/* Footer Controls */}
          {step < 4 && (
            <div className="p-4 border-t border-border bg-muted/10 flex justify-between items-center">
              <button 
                onClick={handleBack}
                disabled={step === 1 || loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              
              {step < 3 ? (
                <button 
                  onClick={handleNext}
                  disabled={step === 1 && !org.name}
                  className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-bold shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={handleComplete}
                  disabled={loading || frameworks.length === 0}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-md text-sm font-bold shadow hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Finish Setup
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
