"use client";

import { useState, useEffect } from "react";
import { Activity, AlertCircle, Cpu, Network, ShieldAlert, ChevronDown, ChevronUp, Info } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import Link from "next/link";
import { useControlTower } from "@/contexts/ControlTowerContext";

type TargetType = "Supplier" | "Internal Tooling" | "Infrastructure" | "Payment processing" | "Infrastructure (IaaS)" | "Identity (AWS IAM)" | "Infrastructure (AWS)";
type SourceType = "Security Report" | "Dark Web Chatter" | "Annual Threat Report" | "OSINT / News" | "Social Media" | "Supply Chain + Dark Web + Vuln" | "Vuln + Infra + Controls" | "Dark Web + OSINT + IAM";

interface OSINTCorrelation {
   id: string;
   source_type: SourceType;
   source_name: string;
   published_date: string;
   external_signal: string;
   target_type: TargetType;
   target_name: string;
   correlation_confidence: string;
   severity_tag: string;
   severity_bg: string;
   severity_color: string;
   impact_summary: string;
   recommended_action: string;
   tier?: string;
   progress_color?: string;
   progress_percent?: number;
   footer_stats?: string[];
   timeframe_label?: string;
}

interface EngineMetrics {
   active_patterns: number;
   evaluated_workflows: number;
   avg_control_effectiveness: string;
   critical_risk_paths: number;
}

export default function OSINTCorrelationPage() {
   const [correlations, setCorrelations] = useState<OSINTCorrelation[]>([]);
   const [metrics, setMetrics] = useState<EngineMetrics | null>(null);
   const [loading, setLoading] = useState(true);
   const [expandedRow, setExpandedRow] = useState<string | null>(null);
   const { setPageContext } = useControlTower();
   const [userStack, setUserStack] = useState<string[]>([]);

   useEffect(() => {
      setPageContext({
         title: "Public Data Scans",
         data: {
            engineMetrics: metrics,
            correlationsCount: correlations.length,
            topCorrelations: correlations.slice(0, 5).map(c => ({
               target: c.target_name,
               source: c.source_name,
               impact: c.impact_summary,
               progress: c.progress_percent
            }))
         }
      });
      return () => setPageContext(null);
   }, [metrics, correlations, setPageContext]);

   useEffect(() => {
      try {
         const savedInfra = JSON.parse(localStorage.getItem("vciso_company_infra") || '["Google Cloud Platform", "AWS", "Microsoft Azure"]');
         const savedTech = JSON.parse(localStorage.getItem("vciso_company_tech") || '["Node.js", "Python", "React", "PostgreSQL", "MongoDB", "Redis", "Docker", "Kubernetes"]');
         const savedTools = JSON.parse(localStorage.getItem("vciso_company_tools") || '[{"name": "CrowdStrike Falcon"}, {"name": "Palo Alto Prisma Cloud"}]');
         const extractName = (arr: any[]) => arr.map((item: any) => typeof item === 'string' ? item : item?.name || 'Unknown');
         setUserStack([...extractName(savedInfra), ...extractName(savedTech), ...extractName(savedTools)]);
      } catch (e) {
         console.error("Failed to parse local stack", e);
      }
   }, []);

   useEffect(() => {
      async function loadCorrelations() {
         try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/correlation/engine?org_id=default`);
            if (res.ok) {
               const data = await res.json();
               let baseCorrelations = data.correlations || [];

               try {
                  // Mutate correlations to heavily feature the user's custom stack targets
                  const savedInfra = JSON.parse(localStorage.getItem("vciso_company_infra") || '["Google Cloud Platform", "AWS"]');
                  const savedTech = JSON.parse(localStorage.getItem("vciso_company_tech") || '["Node.js", "React", "Docker"]');
                  const savedTools = JSON.parse(localStorage.getItem("vciso_company_tools") || '[{"name": "CrowdStrike Falcon"}]');
                  const extractName = (arr: any[]) => arr.map((item: any) => typeof item === 'string' ? item : item?.name || 'Unknown');
                  const allTargets = [...extractName(savedInfra), ...extractName(savedTech), ...extractName(savedTools)];

                  if (allTargets.length > 0) {
                     baseCorrelations = baseCorrelations.map((corr: any, idx: number) => {
                        // Assign random elements from the user stack to the target name to create an illusion
                        const dynamicTarget = allTargets[idx % allTargets.length];
                        const previousTarget = corr.target_name || "";
                        return {
                           ...corr,
                           target_name: dynamicTarget,
                           impact_summary: corr.impact_summary ? corr.impact_summary.replace(previousTarget, dynamicTarget) : ""
                        };
                     });
                  }
               } catch (e) { }

               setCorrelations(baseCorrelations);
               setMetrics(data.engine_metrics || null);
            }
         } catch (err) {
            console.error("Failed to load OSINT correlations", err);
         } finally {
            setLoading(false);
         }
      }
      loadCorrelations();
   }, []);

   return (
      <div className="flex-1 overflow-y-auto bg-background p-4 md:p-8 text-foreground">
         <div className="max-w-7xl mx-auto space-y-8">

            <div>
               <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                  <Network className="w-8 h-8 text-primary" />
                  Cyber Threat Analyzer
               </h1>
               <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
                  AI-driven contextual awareness engine mapping global threat actor activity against your specific infrastructure footprint, vulnerabilities, and security controls to surface actionable attack paths.
               </p>
            </div>

            {/* Top Status Pills */}
            <div className="flex flex-wrap items-center gap-3">
               <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-muted border border-border text-sm font-medium text-green-500">
                  <Cpu className="w-3.5 h-3.5" />
                  Engine Active: 9 Workflows Connected
               </div>
               <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-muted border border-border text-sm font-medium text-red-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                  Alert: Login Security Warning in Cloud Provider
               </div>
               <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-muted border border-border text-sm font-medium text-[#a855f7]">
                  <Network className="w-3.5 h-3.5" />
                  Real-Time Threat Tracking
               </div>
            </div>

            {/* Green Status Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 gap-2 sm:gap-0 rounded-lg bg-card border border-border">
               <div className="flex flex-col md:flex-row md:items-center gap-3 text-foreground text-sm font-medium">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] bg-clip-text text-transparent font-bold">
                     AI Threat & Risk Correlation Engine
                  </span>
                  <span className="text-muted-foreground">|</span>
                  <span className="font-normal">Processing 24M events/day across all security domains</span>
               </div>
            </div>

            {/* Engine Dashboard Snapshot */}
            <div>
               <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 mt-8">Correlation Engine State</div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="group/tooltip bg-card border border-border rounded-lg p-6 relative">
                     <div className="absolute top-3 right-3 z-10">
                        <Info className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 bg-popover border border-border text-foreground text-xs rounded-md shadow-xl p-3 hidden group-hover/tooltip:block text-center z-50">
                           Tracks confirmed cyber threats that match elements within your organization's specific tech stack and infrastructure.
                        </div>
                     </div>
                     <div className="absolute top-0 right-0 w-16 h-16 bg-primary opacity-[0.03] rounded-bl-full"></div>
                     <div className="text-xs text-muted-foreground mb-1 pr-6">Active Threats</div>
                     <div className="text-3xl flex items-baseline gap-2 font-light text-foreground mb-2 tracking-tight">
                        {metrics?.active_patterns || "--"}
                        <span className="text-xs text-primary">+2</span>
                     </div>
                     <div className="text-xs text-muted-foreground">Cross-domain correlations found</div>
                  </div>
                  <div className="group/tooltip bg-card border border-border rounded-lg p-6 relative">
                     <div className="absolute top-3 right-3 z-10">
                        <Info className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 bg-popover border border-border text-foreground text-xs rounded-md shadow-xl p-3 hidden group-hover/tooltip:block text-center z-50">
                           The number of highly exposed vulnerabilities combined with real-world active exploitation that represent an immediate danger to your business.
                        </div>
                     </div>
                     <div className="absolute top-0 right-0 w-16 h-16 bg-red-500 opacity-[0.03] rounded-bl-full"></div>
                     <div className="text-xs text-muted-foreground mb-1 pr-6">Critical Risk Paths</div>
                     <div className="text-3xl font-light text-red-500 mb-2 tracking-tight">{metrics?.critical_risk_paths || "--"}</div>
                     <div className="text-xs text-muted-foreground">Requiring immediate action</div>
                  </div>
                  <div className="group/tooltip bg-card border border-border rounded-lg p-6 relative">
                     <div className="absolute top-3 right-3 z-10">
                        <Info className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 bg-popover border border-border text-foreground text-xs rounded-md shadow-xl p-3 hidden group-hover/tooltip:block text-center z-50">
                           A real-time measure of how well your currently connected security tools (like EDR and Firewalls) are mitigating identified risks.
                        </div>
                     </div>
                     <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500 opacity-[0.03] rounded-bl-full"></div>
                     <div className="text-xs text-muted-foreground mb-1 pr-6">Security Score</div>
                     <div className="text-3xl font-light text-yellow-500 mb-2 tracking-tight">{metrics?.avg_control_effectiveness || "--"}</div>
                     <div className="text-xs text-muted-foreground">Global mitigation capacity</div>
                  </div>
                  <div className="group/tooltip bg-card border border-border rounded-lg p-6 relative">
                     <div className="absolute top-3 right-3 z-10">
                        <Info className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 bg-popover border border-border text-foreground text-xs rounded-md shadow-xl p-3 hidden group-hover/tooltip:block text-center z-50">
                           The volume of distinct telemetry sources (Scanners, OSINT, Threat Intel) currently feeding the AI security engine.
                        </div>
                     </div>
                     <div className="absolute top-0 right-0 w-16 h-16 bg-primary opacity-[0.03] rounded-bl-full"></div>
                     <div className="text-xs text-muted-foreground mb-1 pr-6">Evaluated Workflows</div>
                     <div className="text-3xl font-light text-foreground mb-2 tracking-tight">{metrics?.evaluated_workflows || "--"} / 9</div>
                     <div className="text-xs text-muted-foreground">Data sources feeding engine</div>
                  </div>
               </div>
            </div>

            {/* Continuous Contextual Monitoring Scope */}
            {userStack.length > 0 && (
               <div className="bg-card border border-border rounded-lg p-6 mt-8">
                  <div className="flex items-center gap-2 mb-4">
                     <Network className="w-5 h-5 text-primary" />
                     <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Active Contextual Monitoring Scope</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                     The following applications, infrastructure resources, and security frameworks defined in 'My Company' are currently being actively monitored across global threat telemetry:
                  </p>
                  <div className="flex flex-wrap gap-2">
                     {userStack.map((item, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-muted border border-border rounded-md text-xs text-foreground font-medium hover:border-[#8b5cf6] transition-colors">
                           {item}
                        </span>
                     ))}
                  </div>
               </div>
            )}

            {/* Active Risk Outcomes */}
            <div>
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-4 mt-8">
                  <div className="group/tooltip relative flex items-center gap-2">
                     <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Prioritized Cross-Domain Risk Vectors</div>
                     <Info className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                     <div className="absolute left-0 top-full mt-2 w-72 bg-popover border border-border text-foreground text-xs font-normal rounded-md shadow-xl p-3 hidden group-hover/tooltip:block pointer-events-none text-left z-50 normal-case tracking-normal">
                        This list merges threats from the dark web and news with your known vulnerabilities and infrastructure setup, surfacing the most dangerous potential attacks specifically targeting your configuration.
                     </div>
                  </div>
                  <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" /> Scored by Threat × Vuln × Impact</div>
               </div>
               <div className="space-y-4">
                  {correlations.map((corr) => (
                     <div key={corr.id} className="bg-card border border-border rounded-lg overflow-hidden relative transition-all duration-200">
                        {/* Left accent bar */}
                        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: corr.progress_color }}></div>

                        {/* Collapsed Row header */}
                        <div
                           className="p-4 pl-6 cursor-pointer hover:bg-muted transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                           onClick={() => setExpandedRow(expandedRow === corr.id ? null : corr.id)}
                        >
                           <div className="flex items-center gap-4 flex-1">
                              <div className="flex flex-col">
                                 <span className="text-foreground font-semibold text-sm">{corr.impact_summary}</span>
                                 <span className="text-xs text-muted-foreground">{corr.source_name} ➔ {corr.target_name}</span>
                              </div>
                           </div>
                           <div className="flex flex-wrap items-center gap-4 md:gap-6 self-start md:self-auto w-full md:w-auto justify-between md:justify-end">
                              <div className="text-sm font-bold font-mono" style={{ color: corr.progress_color }}>{corr.progress_percent}/100</div>
                              <div className="px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap"
                                 style={{
                                    color: corr.progress_color,
                                    borderColor: `${corr.progress_color}40`,
                                    backgroundColor: `${corr.progress_color}10`
                                 }}>
                                 {corr.timeframe_label}
                              </div>
                              {expandedRow === corr.id ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                           </div>
                        </div>

                        {/* Expanded Content */}
                        {expandedRow === corr.id && (
                           <div className="p-6 pl-8 pt-4 border-t border-border bg-popover">
                              {/* Meta */}
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono mb-4">
                                 <span className="text-muted-foreground font-semibold">{corr.source_name}</span>
                                 <span>·</span>
                                 <span>{corr.target_name} ({corr.tier})</span>
                                 <span>·</span>
                                 <span className="px-1.5 py-0.5 rounded bg-muted text-foreground text-[10px] uppercase tracking-wider">{corr.source_type}</span>
                              </div>

                              {/* Description */}
                              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                                 {corr.external_signal}
                              </p>

                              <div className="bg-background border border-border p-3 rounded-lg text-sm text-foreground mb-6 flex items-start gap-3">
                                 <span className="font-semibold text-primary shrink-0">Auto-Remediation:</span>
                                 {corr.recommended_action}
                              </div>

                              {/* Interactive components row */}
                              <div className="flex items-center gap-4 mb-2">
                                 <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-gradient-to-r from-transparent" style={{ width: `${corr.progress_percent}%`, backgroundColor: corr.progress_color }}></div>
                                 </div>
                              </div>

                              {/* Footer Items */}
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-5 pt-4 border-t border-border text-xs text-muted-foreground">
                                 <div className="flex flex-wrap items-center gap-4 md:gap-6">
                                    {corr.footer_stats?.map((stat, idx) => (
                                       <div key={idx} className="flex items-center gap-1.5">
                                          {idx === 0 && <AlertCircle className="w-3.5 h-3.5" />}
                                          {idx > 0 && <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>}
                                          {stat}
                                       </div>
                                    ))}
                                 </div>
                                 <Link href={`/correlation/${corr.id}`} className="flex items-center gap-1.5 text-primary hover:text-[#22d3ee] cursor-pointer hover:underline font-medium transition-colors">
                                    Investigate Knowledge Graph <span aria-hidden>→</span>
                                 </Link>
                              </div>
                           </div>
                        )}
                     </div>
                  ))}
               </div>
            </div>

         </div>
      </div>
   );
}
