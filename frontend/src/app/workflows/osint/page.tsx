"use client";

import { useState } from "react";
import { WorkflowCanvas, WorkflowStep } from "@/components/workflows/WorkflowCanvas";
import { GlobeLock, Search, Filter, ShieldAlert, FileText, UploadCloud, AlertCircle } from "lucide-react";

const OSINT_STEPS: WorkflowStep[] = [
  { id: "discovery", label: "Asset Discovery", description: "Find external domains & IPs" },
  { id: "collection", label: "Data Collection", description: "Scan repos & public feeds" },
  { id: "analysis", label: "Analysis", description: "Filter noise & validate" },
  { id: "alerting", label: "Alerting", description: "Trigger notifications" },
  { id: "action", label: "Action", description: "Remediate exposures" },
];

export default function OSINTWorkflowPage() {
  const [activeStep, setActiveStep] = useState<string>("collection");

  const renderStepContent = () => {
    switch (activeStep) {
      case "collection":
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Public Data Scans Collection</h3>
                <p className="text-sm text-muted-foreground">Monitoring public repositories, paste sites, and external attack surfaces.</p>
              </div>
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
                Trigger Deep Scan
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg"><GlobeLock className="w-6 h-6 text-primary" /></div>
                  <div>
                    <h4 className="font-semibold text-foreground">Public-Facing Systems</h4>
                    <p className="text-sm text-muted-foreground mt-1">Found 4 new web addresses and 2 points of entry in the last 24 hours.</p>
                    <button onClick={() => setActiveStep("analysis")} className="text-primary text-sm font-medium mt-3">Analyze Findings &rarr;</button>
                  </div>
               </div>
               
               <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
                  <div className="bg-orange-500/10 p-3 rounded-lg"><FileText className="w-6 h-6 text-orange-500" /></div>
                  <div>
                    <h4 className="font-semibold text-foreground">Code & Secret Leaks</h4>
                    <p className="text-sm text-muted-foreground mt-1">Scanning public GitHub repos. Found 1 potential AWS key exposure.</p>
                    <button onClick={() => setActiveStep("analysis")} className="text-orange-500 text-sm font-medium mt-3">Verify Exposure &rarr;</button>
                  </div>
               </div>
            </div>
          </div>
        );
      
      case "action":
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-4">
                <h3 className="text-lg font-semibold text-foreground">Take Action on Exposures</h3>
             </div>
             <div className="p-12 border border-border border-dashed rounded-xl bg-card text-center text-muted-foreground">
                <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-50 text-orange-500" />
                <p>1 AWS Key Exposure pending remediation.</p>
                <p className="text-sm mt-1">Initiating automated key rotation action plan.</p>
             </div>
          </div>
        );

      default:
        return (
          <div className="py-12 text-center text-muted-foreground animate-in fade-in duration-300 bg-card border border-border rounded-lg border-dashed">
            <h3 className="text-lg font-medium text-foreground mb-2">{OSINT_STEPS.find(s => s.id === activeStep)?.label} View</h3>
            <p className="text-sm">This workflow stage handles specific objects and tasks related to {activeStep}.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <WorkflowCanvas
          title="Public Data Scans"
          description="Identify external threats, brand risks, and data exposures visible to adversaries."
          icon={GlobeLock}
          steps={OSINT_STEPS}
          activeStepId={activeStep}
          onStepClick={setActiveStep}
        />

        <div className="mt-8">
          {renderStepContent()}
        </div>

      </div>
    </div>
  );
}
