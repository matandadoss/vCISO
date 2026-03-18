"use client";

import { useState } from "react";
import { WorkflowCanvas, WorkflowStep } from "@/components/workflows/WorkflowCanvas";
import { Cloud, Search, Filter, ShieldAlert, CheckCircle2, ServerCog, AlertTriangle } from "lucide-react";

const INFRASTRUCTURE_STEPS: WorkflowStep[] = [
  { id: "discovery", label: "Asset Discovery", description: "Enumerate multi-cloud resources" },
  { id: "assessment", label: "Config Assessment", description: "Evaluate against CIS & policies" },
  { id: "iam", label: "IAM Analysis", description: "Map permissions & cross-account trust" },
  { id: "exposure", label: "Network Exposure", description: "Identify public/ingress risks" },
  { id: "scoring", label: "Risk Scoring", description: "Prioritize by blast radius" },
];

const MOCK_ASSETS = [
  { id: "i1", name: "prod-db-cluster", type: "RDS PostgreSQL", env: "Production", status: "Scanned", alerts: 3, lastScan: "2026-03-14 10:00" },
  { id: "i2", name: "k8s-us-east-worker", type: "EC2 Instance", env: "Production", status: "Scanned", alerts: 0, lastScan: "2026-03-14 09:30" },
  { id: "i3", name: "dev-storage-bucket", type: "S3 Bucket", env: "Development", status: "Action Req", alerts: 1, lastScan: "2026-03-14 08:15" },
  { id: "i4", name: "legacy-app-server", type: "VMware VM", env: "On-Prem", status: "Pending", alerts: 0, lastScan: "2026-03-10 11:00" },
];

export default function InfrastructureWorkflowPage() {
  const [activeStep, setActiveStep] = useState<string>("discovery");

  const renderStepContent = () => {
    switch (activeStep) {
      case "discovery":
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Infrastructure Assets</h3>
                <p className="text-sm text-muted-foreground">Unified visibility across cloud and on-premise environments.</p>
              </div>
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
                Trigger Scan
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
               <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Total Assets</p>
                  <p className="text-2xl font-bold">1,248</p>
               </div>
               <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Unmanaged / Shadow</p>
                  <p className="text-2xl font-bold text-orange-500">42</p>
               </div>
               <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Cloud Accounts</p>
                  <p className="text-2xl font-bold">8</p>
               </div>
               <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Scan Coverage</p>
                  <p className="text-2xl font-bold text-green-500">98%</p>
               </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="p-4 border-b border-border flex gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" placeholder="Search resources..." className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 ring-primary" />
                </div>
                <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-md text-sm bg-background hover:bg-muted">
                  <Filter className="w-4 h-4" /> Filter
                </button>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Resource Name</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Environment</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Last Scan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {MOCK_ASSETS.map(asset => (
                    <tr key={asset.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                        <ServerCog className="w-4 h-4 text-muted-foreground" />
                        {asset.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{asset.type}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          asset.env === 'Production' ? 'bg-purple-500/10 text-purple-500' :
                          asset.env === 'Development' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-muted text-foreground'
                        }`}>
                          {asset.env}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {asset.status === 'Scanned' ? (
                          <span className="flex items-center gap-1 text-green-500"><CheckCircle2 className="w-3 h-3" /> Scanned</span>
                        ) : asset.status === 'Action Req' ? (
                          <span className="flex items-center gap-1 text-orange-500"><AlertTriangle className="w-3 h-3" /> Action Req</span>
                        ) : (
                          <span className="text-muted-foreground">{asset.status}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{asset.lastScan}</td>
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
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-4">
                <h3 className="text-lg font-semibold text-foreground">Configuration Benchmarks</h3>
                <button 
                  onClick={() => setActiveStep("iam")}
                  className="bg-primary/10 text-primary px-4 py-2 rounded text-sm font-medium hover:bg-primary/20"
                >
                  Proceed to IAM Review
                </button>
             </div>
             
             <div className="p-12 border border-border border-dashed rounded-xl bg-card text-center text-muted-foreground">
                <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>CIS Benchmark evaluation is running in the background.</p>
                <p className="text-sm mt-1">Found 18 deviations from baseline. Awaiting Correlation Engine sync.</p>
             </div>
          </div>
        );

      default:
        return (
          <div className="py-12 text-center text-muted-foreground animate-in fade-in duration-300 bg-card border border-border rounded-lg border-dashed">
            <h3 className="text-lg font-medium text-foreground mb-2">{INFRASTRUCTURE_STEPS.find(s => s.id === activeStep)?.label} View</h3>
            <p className="text-sm">This workflow stage handles specific objects and tasks related to {activeStep}.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <WorkflowCanvas
          title="Infrastructure Risk Workflow"
          description="Continuous posture assessment across AWS, GCP, Azure, and hybrid/on-premise environments."
          icon={Cloud}
          steps={INFRASTRUCTURE_STEPS}
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
