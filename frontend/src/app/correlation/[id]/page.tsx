"use client";

import { useState, useEffect, use } from "react";
import { ArrowLeft, Network, ShieldAlert, Loader2, PlayCircle, CheckCircle2, ChevronRight, CheckSquare } from "lucide-react";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/api";

export default function CorrelationActionPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  
  const [loading, setLoading] = useState(true);
  // Using explicit state here since we aren't using the graph data anymore.
  // In a real app with a backend change, this would pull from a `/details` endpoint, 
  // but for now we'll mock the specific information needed for the actionable view 
  // based on the correlation IDs we laid out.

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Hardcoded content for the 3 demo correlations based on our existing OSINT data
  const getCorrelationDetails = (corrId: string) => {
    switch (corrId) {
      case "corr-1":
        return {
          title: "Vendor breach detected + inherited SBOM vulns = compound exposure to customer payment data.",
          riskScore: 95,
          summary: "Multiple indicators signal an active breach at CoreAxis your primary payment processor. Their credentials have appeared in fresh Dark Web logs from the Redline Stealer. Concurrently, CoreAxis utilizes an unpatched version of a payment module (CVE-2026-1044) that is actively being exploited for initial access.",
          affectedEntities: [
             { type: "Vendor", name: "CoreAxis Payments" },
             { type: "Identity", name: "Service Account (id-1)" },
             { type: "Asset", name: "Payment Module" },
             { type: "Data", name: "Customer PII & Payment Info" }
          ],
          actions: [
            "Temporarily reroute payment processing to backup provider (Stripe).",
            "Trigger emergency incident response protocol with CoreAxis.",
            "Rotate all service account credentials associated with CoreAxis integration.",
            "Scan internal systems for threat signals related to Redline Stealer."
          ]
        };
      case "corr-2":
        return {
          title: "Vuln on public asset + no WAF/EDR coverage = unmitigated active exploit path.",
          riskScore: 75,
          summary: "An internet-facing legacy marketing server is running an outdated Apache Struts version (CVE-2025-4421). Threat intelligence sources note a 300% spike in scanning activity for this CVE. Our telemetry indicates this server lacks both WAF protection and an active EDR agent.",
          affectedEntities: [
             { type: "Asset", name: "Marketing Server (Legacy)" },
             { type: "Vulnerability", name: "CVE-2025-4421 (Apache Struts)" },
             { type: "Control Gap", name: "Missing WAF & EDR" }
          ],
          actions: [
            "Immediately isolate the legacy marketing server from the public internet.",
            "Deploy EDR agent to the server to investigate potential prior compromise.",
            "Apply virtual patching via WAF if isolation is not immediately feasible.",
            "Schedule emergency patching for Apache Struts."
          ]
        };
      case "corr-3":
        return {
          title: "Excessive IAM privileges + phishing campaign targeting role = critical identity exposure.",
          riskScore: 82,
          summary: "A targeted spear-phishing campaign is actively targeting AWS Cloud Administrators within the finance sector. Concurrently, our CSPM checks reveal that 3 IAM roles associated with cloud orchestration have over-privileged 'AdministratorAccess'. A successful phishing attack would grant full tenant control.",
          affectedEntities: [
             { type: "Threat", name: "Sector-specific Spear-phishing" },
             { type: "Identity", name: "Cloud Orchestration Roles (3)" },
             { type: "Cloud Resource", name: "AWS Tenant Administration" },
             { type: "Control Gap", name: "Violation of Least Privilege" }
          ],
          actions: [
            "Revoke 'AdministratorAccess' from the 3 orchestration roles and apply scoped policies.",
            "Force MFA re-authentication for all Cloud Administrators.",
            "Circulate urgent phishing awareness bulletin to all cloud engineering teams.",
            "Review AWS CloudTrail logs for suspicious administrative activity in the last 72 hours."
          ]
        };
      default:
        return null;
    }
  };

  const details = getCorrelationDetails(id);

  if (loading) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0b0c10]">
           <Loader2 className="w-10 h-10 animate-spin text-[#8b5cf6] mb-4" />
           <p className="text-[#6b7280]">Compiling actionable intelligence...</p>
        </div>
     );
  }

  if (!details) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0b0c10] text-[#6b7280]">
           <ShieldAlert className="w-12 h-12 mb-4 opacity-50" />
           <p>No actionable data available for this sequence.</p>
           <Link href="/correlation" className="mt-4 text-[#06b6d4] hover:underline">Return to Public Data Scans</Link>
        </div>
     );
  }

  return (
    <div className="min-h-screen w-full bg-[#0b0c10] font-sans text-[#c5c6c7] pb-24">
      {/* Header */}
      <div className="border-b border-[#2a2f36] bg-[#12141a] sticky top-0 z-20 shadow-lg">
         <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
            <Link href="/correlation" className="flex items-center gap-2 text-[#9ca3af] hover:text-[#e5e7eb] mb-6 text-sm transition-colors w-fit">
               <ArrowLeft className="w-4 h-4" />
               Back to Public Data Scans
            </Link>
            
            <div className="flex items-start justify-between">
               <div className="flex-1 pr-8">
                  <div className="flex items-center gap-3 mb-3">
                     <span className="px-2.5 py-1 bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20 rounded text-xs font-bold tracking-wider uppercase">
                        CRITICAL PRIORITY
                     </span>
                     <span className="text-sm font-mono text-[#6b7280]">{id}</span>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#e5e7eb] leading-tight mb-2">
                     {details.title}
                  </h1>
               </div>
               
               <div className="flex flex-col items-end">
                  <div className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider mb-1">Risk Score</div>
                  <div className="text-4xl font-light text-[#ef4444]">{details.riskScore}<span className="text-xl text-[#6b7280]">/100</span></div>
               </div>
            </div>
         </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 pt-10">
         
         {/* Executive Summary Section */}
         <section className="mb-12">
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#6b7280] mb-4 flex items-center gap-2">
               <Network className="w-4 h-4" />
               Executive Summary
            </h2>
            <div className="p-6 bg-[#181b21] border border-[#2a2f36] rounded-xl text-[15px] leading-relaxed text-[#d4d4d8]">
               {details.summary}
            </div>
         </section>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Left Column: Affected Entities */}
            <div className="col-span-1">
               <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#6b7280] mb-4">
                  Blast Radius
               </h2>
               <div className="bg-[#181b21] border border-[#2a2f36] rounded-xl overflow-hidden">
                  <div className="divide-y divide-[#2a2f36]">
                     {details.affectedEntities.map((entity, i) => (
                        <div key={i} className="p-4 flex flex-col gap-1">
                           <span className="text-[11px] font-mono uppercase text-[#8b5cf6]">{entity.type}</span>
                           <span className="font-medium text-[#e5e7eb]">{entity.name}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Right Column: Required Actions */}
            <div className="col-span-2">
               <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#6b7280] mb-4 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-[#10b981]" />
                  Required Remediation Actions
               </h2>
               <div className="space-y-3">
                  {details.actions.map((action, i) => (
                     <div key={i} className="group flex items-start gap-4 p-5 bg-[#181b21] border border-[#2a2f36] rounded-xl hover:border-[#3f4552] transition-colors relative overflow-hidden">
                        {/* Status indicator line */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#10b981]/50 group-hover:bg-[#10b981] transition-colors"></div>
                        
                        <div className="mt-0.5">
                           <CheckCircle2 className="w-5 h-5 text-[#6b7280] group-hover:text-[#10b981] transition-colors" />
                        </div>
                        <div className="flex-1">
                           <p className="text-[#e5e7eb] font-medium leading-relaxed">{action}</p>
                           
                           {/* Action Actions (Run Playbook, Create Ticket, etc) appearing on hover */}
                           <div className="mt-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs font-medium rounded shadow-sm transition-colors">
                                 <PlayCircle className="w-3.5 h-3.5" />
                                 Run Automation
                              </button>
                              <button className="px-3 py-1.5 bg-[#2a2f36] hover:bg-[#3f4552] text-[#c5c6c7] text-xs font-medium rounded transition-colors">
                                 Create Jira Ticket
                              </button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>

      </div>
    </div>
  );
}
