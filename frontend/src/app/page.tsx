"use client";

import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { RiskChart } from "@/components/dashboard/RiskChart";
import { WhatNeedsAttention } from "@/components/dashboard/WhatNeedsAttention";
import { useRole } from "@/contexts/RoleContext";
import { Shield, FileText } from "lucide-react";

export default function Home() {
  const { role } = useRole();

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
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
           <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 flex flex-col gap-4 shadow-sm mb-8">
               <h3 className="text-xl font-bold text-primary flex items-center gap-2">
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
            <div className="col-span-2 bg-card border border-border rounded-lg p-6 min-h-[400px]">
              <h3 className="text-lg font-semibold mb-4">Risk Over Time</h3>
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
             <div className="col-span-1 bg-card border border-border rounded-lg p-6 min-h-[400px] flex items-center justify-center flex-col text-center">
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
