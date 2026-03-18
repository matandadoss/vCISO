"use client";

import { useState } from "react";
import { WorkflowCanvas, WorkflowStep } from "@/components/workflows/WorkflowCanvas";
import { Eye, Search, Filter, ShieldAlert, BadgeInfo, AlertTriangle } from "lucide-react";

const DARKWEB_STEPS: WorkflowStep[] = [
  { id: "monitoring", label: "Monitoring", description: "Scrape underground forums" },
  { id: "detection", label: "Mention Detection", description: "Keyword/BIN match" },
  { id: "assessment", label: "Threat Assessment", description: "Evaluate credibility" },
  { id: "classification", label: "Severity Class", description: "Assign risk score" },
  { id: "response", label: "Response", description: "Take down or remediate" },
];

export default function DarkWebWorkflowPage() {
  const [activeStep, setActiveStep] = useState<string>("monitoring");

  const renderStepContent = () => {
    switch (activeStep) {
      case "monitoring":
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Dark Web Mentions</h3>
                <p className="text-sm text-muted-foreground">Continuous surveillance of dark web marketplaces and forums.</p>
              </div>
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
                Update Scanners
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
                  <div className="bg-red-500/10 p-3 rounded-lg"><AlertTriangle className="w-6 h-6 text-red-500" /></div>
                  <div>
                    <h4 className="font-semibold text-foreground">Credential Leak Mention</h4>
                    <p className="text-sm text-muted-foreground mt-1">Found 12 newly published compromised employee emails.</p>
                    <button onClick={() => setActiveStep("detection")} className="text-red-500 text-sm font-medium mt-3">Triage Leak &rarr;</button>
                  </div>
               </div>
               
               <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg"><BadgeInfo className="w-6 h-6 text-primary" /></div>
                  <div>
                    <h4 className="font-semibold text-foreground">Brand Impersonation Chatter</h4>
                    <p className="text-sm text-muted-foreground mt-1">Discussion of a phishing kit mirroring your corporate login portal.</p>
                    <button onClick={() => setActiveStep("assessment")} className="text-primary text-sm font-medium mt-3">Read Intel &rarr;</button>
                  </div>
               </div>
            </div>
          </div>
        );
      
      case "response":
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-4">
                <h3 className="text-lg font-semibold text-foreground">Automated Responses</h3>
             </div>
             <div className="p-12 border border-border border-dashed rounded-xl bg-card text-center text-muted-foreground">
                <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-50 text-red-500" />
                <p>Initiating forced password resets for 12 compromised accounts via Entra ID integration.</p>
                <p className="text-sm mt-1">Executing standard operating procedure...</p>
             </div>
          </div>
        );

      default:
        return (
          <div className="py-12 text-center text-muted-foreground animate-in fade-in duration-300 bg-card border border-border rounded-lg border-dashed">
            <h3 className="text-lg font-medium text-foreground mb-2">{DARKWEB_STEPS.find(s => s.id === activeStep)?.label} View</h3>
            <p className="text-sm">This workflow stage handles specific objects and tasks related to {activeStep}.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <WorkflowCanvas
          title="Dark Web Monitoring"
          description="Focused surveillance of dark web channels for direct threats targeting the organization."
          icon={Eye}
          steps={DARKWEB_STEPS}
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
