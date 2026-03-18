"use client";

import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { RiskChart } from "@/components/dashboard/RiskChart";
import { WhatNeedsAttention } from "@/components/dashboard/WhatNeedsAttention";
import { useRole } from "@/contexts/RoleContext";
import { Shield, FileText, Info } from "lucide-react";
import { useEffect } from "react";
import { useControlTower } from "@/contexts/ControlTowerContext";

export default function Home() {
  const { role } = useRole();
  const { setPageContext } = useControlTower();

  useEffect(() => {
    setPageContext({
      title: "Command Dashboard",
      data: {
        currentRole: role,
        overview: "The primary overview for the vCISO platform.",
        modulesVisible: ["RiskChart", "WhatNeedsAttention", "DashboardOverview"]
      }
    });
    return () => setPageContext(null);
  }, [role, setPageContext]);

  return (
    <div className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {role === "BOARD_MEMBER" ? "Executive Dashboard" : 
             role === "AUDITOR" ? "Compliance Overview" : 
             role === "SOC_ANALYST" ? "Security Operations Center" : 
             "Dashboard"}
          </h1>
          <p className="text-muted-foreground mt-1">
             {role === "BOARD_MEMBER" ? "High-level summary of organizational risk posture and mitigation efforts." : "Real-time overview of your organizational security posture."}
          </p>
        </div>
        
        {/* Render for CISO generally sees everything, so we build it dynamically */}
        {role !== "BOARD_MEMBER" && role !== "AUDITOR" && (
           <DashboardOverview />
        )}

        {role === "BOARD_MEMBER" && (
           <div className="relative bg-primary/10 border border-primary/20 rounded-lg p-4 md:p-6 flex flex-col gap-4 shadow-sm mb-8">
               <div className="absolute top-4 right-4 group/tooltip z-10">
                 <Info className="w-5 h-5 text-primary/50 cursor-help hover:text-primary transition-colors" />
                 <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs rounded shadow-lg p-3 hidden group-hover/tooltip:block pointer-events-none text-left font-normal leading-relaxed z-[60]">
                   A high-level, human-readable summary of the most important security metrics and updates for this quarter.
                 </div>
               </div>
               <h3 className="text-xl font-bold text-primary flex items-center gap-2 pr-8">
                 <FileText className="w-6 h-6" /> Executive Summary (Board View)
               </h3>
               <p className="text-foreground text-sm leading-relaxed">
                  The organization has successfully reduced overall critical vulnerabilities by 15% this quarter. The primary residual risks involve unpatched external web services and delayed ISO 27001 control mapping for the third-party integrations. Budget allocation for the AI correlation engine is currently tracking 10% under limits, maximizing SOC efficiency.
               </p>
           </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Risk Over Time: seen by CISO, Board, Auditor */}
          {(role === "CISO" || role === "BOARD_MEMBER" || role === "AUDITOR") && (
            <div className="relative lg:col-span-2 bg-card border border-border rounded-lg p-4 md:p-6 min-h-[400px]">
              <div className="absolute top-4 right-4 group/tooltip z-10">
                <Info className="w-4 h-4 text-muted-foreground cursor-help opacity-50 hover:opacity-100 transition-opacity" />
                <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs rounded shadow-lg p-3 hidden group-hover/tooltip:block pointer-events-none text-left font-normal leading-relaxed z-[60]">
                  A historical timeline showing whether your organization's security health is improving or getting worse over time.
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-4 pr-6">Risk Over Time</h3>
              <div className="w-full h-full text-muted-foreground mt-4 pb-8">
                <RiskChart />
              </div>
            </div>
          )}

          {/* Attention needed: seen by CISO, SOC */}
          {(role === "CISO" || role === "SOC_ANALYST") && (
             <div className="col-span-1 min-h-[400px]">
               <WhatNeedsAttention />
             </div>
          )}
          
          {/* Auditor empty block */}
          {role === "AUDITOR" && (
             <div className="relative lg:col-span-1 bg-card border border-border rounded-lg p-4 md:p-6 min-h-[400px] flex items-center justify-center flex-col text-center">
                 <div className="absolute top-4 right-4 group/tooltip z-10">
                   <Info className="w-4 h-4 text-muted-foreground cursor-help opacity-50 hover:opacity-100 transition-opacity" />
                   <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs rounded shadow-lg p-3 hidden group-hover/tooltip:block pointer-events-none text-left font-normal leading-relaxed z-[60]">
                     Indicates if the organization has successfully completed all necessary tasks to pass an upcoming compliance audit.
                   </div>
                 </div>
                 <Shield className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                 <h3 className="text-lg font-semibold">Audit Ready</h3>
                 <p className="text-sm text-muted-foreground mt-2">No critical pending action items for the current ISO 27001 evaluation phase.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
