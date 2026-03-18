"use client";

import { useState } from "react";
import { WorkflowCanvas, WorkflowStep } from "@/components/workflows/WorkflowCanvas";
import { Wrench, Search, Filter, ShieldCheck, Zap, Activity } from "lucide-react";

const CONTROL_STEPS: WorkflowStep[] = [
  { id: "inventory", label: "Tool Inventory", description: "EDR, SIEM, WAF list" },
  { id: "coverage", label: "Coverage Mapping", description: "Map to assets & endpoints" },
  { id: "testing", label: "Effectiveness Testing", description: "BAS & Purple Team" },
  { id: "health", label: "Health Monitoring", description: "Agent online rates" },
  { id: "optimization", label: "Optimization", description: "Remove redundancy" },
];

export default function ControlsWorkflowPage() {
  const [activeStep, setActiveStep] = useState<string>("inventory");

  const renderStepContent = () => {
    switch (activeStep) {
      case "inventory":
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Security Controls Inventory</h3>
                <p className="text-sm text-muted-foreground">Manage and track effectiveness of all deployed defensive capabilities.</p>
              </div>
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
                Sync API Connectors
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Total Active Tools</p>
                  <p className="text-2xl font-bold">18</p>
               </div>
               <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Avg Coverage</p>
                  <p className="text-2xl font-bold">82%</p>
               </div>
               <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Offline Agents</p>
                  <p className="text-2xl font-bold text-orange-500">140</p>
               </div>
               <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Tool Redundancy</p>
                  <p className="text-2xl font-bold text-yellow-500">3 areas</p>
               </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden mt-6">
              <div className="p-4 border-b border-border flex gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" placeholder="Search security tools..." className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 ring-primary" />
                </div>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Tool Name</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Coverage</th>
                    <th className="px-4 py-3 font-medium">Health Status</th>
                    <th className="px-4 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary" /> CrowdStrike Falcon
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">EDR</td>
                    <td className="px-4 py-3">94%</td>
                    <td className="px-4 py-3"><span className="text-green-500 flex items-center gap-1"><Zap className="w-3 h-3"/> Healthy</span></td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setActiveStep("testing")} className="text-primary hover:text-primary/80 font-medium text-xs">Test Efficacy</button>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-500" /> Splunk Enterprise
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">SIEM</td>
                    <td className="px-4 py-3">88%</td>
                    <td className="px-4 py-3"><span className="text-orange-500 flex items-center gap-1"><Activity className="w-3 h-3"/> Log Drop</span></td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setActiveStep("health")} className="text-primary hover:text-primary/80 font-medium text-xs">View Agents</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        );
      
      default:
        return (
          <div className="py-12 text-center text-muted-foreground animate-in fade-in duration-300 bg-card border border-border rounded-lg border-dashed">
            <h3 className="text-lg font-medium text-foreground mb-2">{CONTROL_STEPS.find(s => s.id === activeStep)?.label} View</h3>
            <p className="text-sm">This workflow stage handles specific objects and tasks related to {activeStep}.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <WorkflowCanvas
          title="Controls & Tooling Workflow"
          description="Inventory and effectiveness assessment of all deployed security controls and defensive capabilities."
          icon={Wrench}
          steps={CONTROL_STEPS}
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
