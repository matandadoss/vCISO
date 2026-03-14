"use client";

import { useState } from "react";
import { WorkflowCanvas, WorkflowStep } from "@/components/workflows/WorkflowCanvas";
import { Building2, Search, Filter, ShieldAlert, ArrowRight } from "lucide-react";

const SUPPLY_CHAIN_STEPS: WorkflowStep[] = [
  { id: "inventory", label: "Inventory", description: "Discover & catalog vendors" },
  { id: "tiering", label: "Risk Tiering", description: "Classify by business impact" },
  { id: "assessment", label: "Assessment", description: "Collect evidence & questionnaires" },
  { id: "monitoring", label: "Monitoring", description: "Continuous attack surface checks" },
  { id: "remediation", label: "Remediation", description: "Assign & fix risk findings" },
];

// Dummy data for different workflow states
const VENDOR_INVENTORY = [
  { id: "v1", name: "Salesforce", status: "Active", dataAccess: "High", added: "2025-01-10" },
  { id: "v2", name: "Stripe", status: "Active", dataAccess: "Critical", added: "2025-02-15" },
  { id: "v3", name: "Slack", status: "Active", dataAccess: "Medium", added: "2024-11-20" },
  { id: "v4", name: "Notion", status: "Pending", dataAccess: "Low", added: "2026-03-01" },
];

export default function SupplyChainWorkflowPage() {
  const [activeStep, setActiveStep] = useState<string>("inventory");

  // Content renderers for each step
  const renderStepContent = () => {
    switch (activeStep) {
      case "inventory":
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Vendor Inventory</h3>
                <p className="text-sm text-muted-foreground">Manage known vendors and discover shadow IT.</p>
              </div>
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
                + Add Vendor
              </button>
            </div>
            
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="p-4 border-b border-border flex gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" placeholder="Search inventory..." className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 ring-primary" />
                </div>
                <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-md text-sm bg-background hover:bg-muted">
                  <Filter className="w-4 h-4" /> Filter
                </button>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Vendor</th>
                    <th className="px-4 py-3 font-medium">Data Access</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Date Added</th>
                    <th className="px-4 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {VENDOR_INVENTORY.map(v => (
                    <tr key={v.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">{v.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          v.dataAccess === 'Critical' ? 'bg-red-500/10 text-red-500' :
                          v.dataAccess === 'High' ? 'bg-orange-500/10 text-orange-500' :
                          v.dataAccess === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-blue-500/10 text-blue-500'
                        }`}>
                          {v.dataAccess}
                        </span>
                      </td>
                      <td className="px-4 py-3">{v.status}</td>
                      <td className="px-4 py-3 text-muted-foreground">{v.added}</td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => setActiveStep("tiering")} 
                          className="text-primary hover:text-primary/80 font-medium flex items-center justify-end gap-1 ml-auto"
                        >
                          Push to Tiering <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case "assessment":
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="flex items-center gap-3 mb-6 bg-orange-500/10 text-orange-600 border border-orange-500/20 p-4 rounded-lg">
                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">You have 2 vendors awaiting manual questionnaire review.</p>
             </div>
             {/* Mock Assessment content */}
             <div className="grid grid-cols-1 gap-4">
               {[1, 2].map(i => (
                 <div key={i} className="bg-card border border-border p-5 rounded-lg flex items-center justify-between">
                   <div>
                     <h4 className="font-semibold text-foreground mb-1">Pending Assessment: Vendor {i}</h4>
                     <p className="text-sm text-muted-foreground">SOC 2 Report received. AI pre-analysis complete.</p>
                   </div>
                   <button className="bg-primary/10 text-primary px-4 py-2 rounded font-medium text-sm hover:bg-primary/20">
                     Review Findings
                   </button>
                 </div>
               ))}
             </div>
          </div>
        );

      default:
        // Placeholder for other steps
        return (
          <div className="py-12 text-center text-muted-foreground animate-in fade-in duration-300 bg-card border border-border rounded-lg border-dashed">
            <h3 className="text-lg font-medium text-foreground mb-2">{SUPPLY_CHAIN_STEPS.find(s => s.id === activeStep)?.label} View</h3>
            <p className="text-sm">This workflow stage handles specific objects and tasks related to {activeStep}.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <WorkflowCanvas
          title="Supply Chain Risk Workflow"
          description="Continuous assessment of third-party software supply chain risk posture across your vendor relationships."
          icon={Building2}
          steps={SUPPLY_CHAIN_STEPS}
          activeStepId={activeStep}
          onStepClick={setActiveStep}
        />

        {/* Content Area corresponding to the active workflow step */}
        <div className="mt-8">
          {renderStepContent()}
        </div>

      </div>
    </div>
  );
}
