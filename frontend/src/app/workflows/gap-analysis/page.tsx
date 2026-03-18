"use client";

import { useState } from "react";
import { WorkflowCanvas, WorkflowStep } from "@/components/workflows/WorkflowCanvas";
import { LineChart, Search, Filter, ShieldAlert, FileText, ArrowRight, Target } from "lucide-react";

const GAP_STEPS: WorkflowStep[] = [
  { id: "threat", label: "Threat Review", description: "What we face" },
  { id: "current_state", label: "Current State", description: "What we have" },
  { id: "gap_id", label: "Gap Identification", description: "Calculate the delta" },
  { id: "risk_quant", label: "Risk Quant.", description: "Score by business impact" },
  { id: "roadmap", label: "Roadmap", description: "Prioritize remediation" },
];

export default function GapAnalysisWorkflowPage() {
  const [activeStep, setActiveStep] = useState<string>("gap_id");

  const renderStepContent = () => {
    switch (activeStep) {
      case "gap_id":
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Gap Identification</h3>
                <p className="text-sm text-muted-foreground">The delta between required security posture and current capabilities.</p>
              </div>
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
                Run Correlation Engine Analysis
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
                  <div className="bg-red-500/10 p-3 rounded-lg"><ShieldAlert className="w-6 h-6 text-red-500" /></div>
                  <div>
                    <h4 className="font-semibold text-foreground">Critical Gaps</h4>
                    <p className="text-3xl font-bold text-red-500 mt-1">4</p>
                    <p className="text-sm text-muted-foreground mt-1">Immediate action required.</p>
                  </div>
               </div>
               
               <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
                  <div className="bg-orange-500/10 p-3 rounded-lg"><Target className="w-6 h-6 text-orange-500" /></div>
                  <div>
                    <h4 className="font-semibold text-foreground">High Gaps</h4>
                    <p className="text-3xl font-bold text-orange-500 mt-1">11</p>
                    <p className="text-sm text-muted-foreground mt-1">Schedule in next 30 days.</p>
                  </div>
               </div>

               <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
                  <div className="bg-blue-500/10 p-3 rounded-lg"><FileText className="w-6 h-6 text-blue-500" /></div>
                  <div>
                    <h4 className="font-semibold text-foreground">Quick Wins</h4>
                    <p className="text-3xl font-bold text-blue-500 mt-1">6</p>
                    <p className="text-sm text-muted-foreground mt-1">Low effort, high impact.</p>
                  </div>
               </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden mt-6">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Identified Gap</th>
                    <th className="px-4 py-3 font-medium">Domain</th>
                    <th className="px-4 py-3 font-medium">Severity</th>
                    <th className="px-4 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">Missing MFA on Legacy VPN</td>
                    <td className="px-4 py-3 text-muted-foreground">Identity & Access</td>
                    <td className="px-4 py-3"><span className="text-red-500 font-semibold bg-red-500/10 px-2 py-1 rounded">Critical</span></td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setActiveStep("roadmap")} className="text-primary hover:text-primary/80 font-medium text-xs flex items-center justify-end gap-1 ml-auto">
                        Add to Roadmap <ArrowRight className="w-3 h-3"/>
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">No EDR coverage on Contractor Subnet</td>
                    <td className="px-4 py-3 text-muted-foreground">Endpoint Security</td>
                    <td className="px-4 py-3"><span className="text-red-500 font-semibold bg-red-500/10 px-2 py-1 rounded">Critical</span></td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setActiveStep("roadmap")} className="text-primary hover:text-primary/80 font-medium text-xs flex items-center justify-end gap-1 ml-auto">
                        Add to Roadmap <ArrowRight className="w-3 h-3"/>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case "roadmap":
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-4">
                <h3 className="text-lg font-semibold text-foreground">Prioritized Remediation Roadmap</h3>
             </div>
             <div className="p-12 border border-border border-dashed rounded-xl bg-card text-center text-muted-foreground">
                <LineChart className="w-12 h-12 mx-auto mb-3 opacity-50 text-blue-500" />
                <p>Generating Gantt Chart and Resource Plan for 6 Quick Wins and 4 Critical Gaps...</p>
             </div>
          </div>
        );

      default:
        return (
          <div className="py-12 text-center text-muted-foreground animate-in fade-in duration-300 bg-card border border-border rounded-lg border-dashed">
            <h3 className="text-lg font-medium text-foreground mb-2">{GAP_STEPS.find(s => s.id === activeStep)?.label} View</h3>
            <p className="text-sm">This workflow stage handles specific objects and tasks related to {activeStep}.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <WorkflowCanvas
          title="Security Gap Analysis"
          description="Cross-referencing the threat landscape, posture, and coverage to identify delta between current and required state."
          icon={LineChart}
          steps={GAP_STEPS}
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
