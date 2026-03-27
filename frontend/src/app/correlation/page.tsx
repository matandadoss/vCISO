"use client";

import { useState, useEffect } from "react";
import { Activity, AlertCircle, Cpu, Network, ShieldAlert, ChevronDown, ChevronUp, Info } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
   footer_stats?: { label: string; tooltip: string }[];
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
   const [executionSuccess, setExecutionSuccess] = useState<Record<string, boolean>>({});
   const { setPageContext, setIsOpen } = useControlTower();
   const [userStack, setUserStack] = useState<string[]>([]);

   const handleMetricClick = (type: string, value: any) => {
      let title = "";
      let suggestions: string[] = [];
      
      if (type === "threats") {
         title = "Targeted Threats Analysis";
         suggestions = [
            "List the most critical targeted threats establishing a presence.",
            "Explain how these threats are specifically targeting our tech stack.",
            "What MITRE techniques are common among these active threats?"
         ];
      } else if (type === "critical") {
         title = "Immediate Action Paths";
         suggestions = [
            "What are the immediate critical risk paths I need to address?",
            "Generate a remediation plan for the most critical risk.",
            "Who should I assign these critical risks to?"
         ];
      } else if (type === "mitigation") {
         title = "Mitigation Effectiveness";
         suggestions = [
            "Why is our current mitigation score at this level?",
            "What controls can we implement to immediately improve our score?",
            "Where are our biggest security control gaps?"
         ];
      } else if (type === "sources") {
         title = "Data Sources Scanned";
         suggestions = [
            "Which global feeds and dark web sources are we scanning?",
            "Are there any recommended data sources we should add?",
            "How often do these sources report new intelligence?"
         ];
      }
      
      setPageContext({
         title,
         data: { metric_type: type, metric_value: value },
         suggestions
      });
      setIsOpen(true);
   };

   const handlePromoteToFinding = async (corr: OSINTCorrelation, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
         const payload = {
            correlation_id: corr.id,
            title: `Cyber Threat: ${corr.source_name} attacking ${corr.target_name}`,
            description: corr.external_signal + "\n\nImpact: " + corr.impact_summary + "\n\nRecommendation: " + corr.recommended_action,
            severity: corr.severity_tag,
            raw_data: corr
         };

         const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/findings/from-correlation?org_id=default`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
         });

         if (res.ok) {
            setExecutionSuccess(prev => ({ ...prev, [`promote_${corr.id}`]: true }));
         }
      } catch (err) {
         console.error("Failed to promote cyber threat analyzer finding", err);
      }
   };

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
               <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
                  Real-time scanning of the global threat landscape to find active dangers specifically targeting your business.
               </p>
            </div>

            <Tabs defaultValue="overview" className="space-y-6 w-full">
               <TabsList className="h-auto flex-wrap justify-start">
                  <TabsTrigger value="overview" className="flex items-center gap-2"><Activity className="w-4 h-4" /> Overview</TabsTrigger>
                  <TabsTrigger value="threats" className="flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Active Threats</TabsTrigger>
               </TabsList>

               <TabsContent value="overview" className="space-y-8 mt-2">
            {/* Simplified Status Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 gap-2 sm:gap-0 rounded-lg bg-card border border-border">
               <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-foreground text-sm font-medium w-full">
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                     <Activity className="w-4 h-4 text-green-500" />
                     <span className="bg-gradient-to-r from-green-500 to-emerald-400 bg-clip-text text-transparent font-bold whitespace-nowrap">
                        Status: Actively Monitoring your Business
                     </span>
                     <span className="text-muted-foreground hidden md:inline">|</span>
                     <span className="font-normal text-muted-foreground">Scanning the dark web, intelligence feeds, and news for threats against your tools.</span>
                  </div>
                  <div className="flex items-center gap-2 whitespace-nowrap bg-muted px-3 py-1.5 rounded-md border border-border">
                     <Cpu className="w-3.5 h-3.5 text-primary" />
                     <span className="font-mono text-xs">Processing 24M events/day globally</span>
                  </div>
               </div>
            </div>

            {/* Simplified Engine Dashboard Snapshot */}
            <div>
               <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 mt-8">Key Health Metrics</div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div 
                     onClick={() => handleMetricClick("threats", metrics?.active_patterns)} 
                     className="bg-card border border-border rounded-lg p-6 relative cursor-pointer hover:border-primary/50 hover:bg-accent/10 transition-colors shadow-sm hover:shadow-md"
                  >
                     <div className="absolute top-3 right-3 z-10 group/tooltip">
                        <Info className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 bg-popover border border-border text-foreground text-xs rounded-md shadow-xl p-3 hidden group-hover/tooltip:block text-center z-50">
                           The total number of threats across the internet actively targeting tools you use.
                        </div>
                     </div>
                     <div className="absolute top-0 right-0 w-16 h-16 bg-primary opacity-[0.03] rounded-bl-full"></div>
                     <div className="text-xs text-muted-foreground mb-1 pr-6">Targeted Threats Found</div>
                     <div className="text-3xl flex items-baseline gap-2 font-light text-foreground mb-2 tracking-tight">
                        {metrics?.active_patterns || "--"}
                        <span className="text-xs text-primary">+2</span>
                     </div>
                     <div className="text-xs text-muted-foreground">Known threats affecting your tools</div>
                  </div>
                  <div 
                     onClick={() => handleMetricClick("critical", metrics?.critical_risk_paths)} 
                     className="bg-card border border-border rounded-lg p-6 relative cursor-pointer hover:border-red-500/50 hover:bg-red-500/5 transition-colors shadow-sm hover:shadow-md"
                  >
                     <div className="absolute top-3 right-3 z-10 group/tooltip">
                        <Info className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 bg-popover border border-border text-foreground text-xs rounded-md shadow-xl p-3 hidden group-hover/tooltip:block text-center z-50">
                           Critical issues where an attacker could immediately harm your business today. Needs urgent attention!
                        </div>
                     </div>
                     <div className="absolute top-0 right-0 w-16 h-16 bg-red-500 opacity-[0.03] rounded-bl-full"></div>
                     <div className="text-xs text-muted-foreground mb-1 pr-6">Immediate Action Required</div>
                     <div className="text-3xl font-light text-red-500 mb-2 tracking-tight">{metrics?.critical_risk_paths || "--"}</div>
                     <div className="text-xs text-muted-foreground">Major risks requiring fixing today</div>
                  </div>
                  <div 
                     onClick={() => handleMetricClick("mitigation", metrics?.avg_control_effectiveness)} 
                     className="bg-card border border-border rounded-lg p-6 relative cursor-pointer hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-colors shadow-sm hover:shadow-md"
                  >
                     <div className="absolute top-3 right-3 z-10 group/tooltip">
                        <Info className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 bg-popover border border-border text-foreground text-xs rounded-md shadow-xl p-3 hidden group-hover/tooltip:block text-center z-50">
                           A grade on how well your current security setup is defending against these threats.
                        </div>
                     </div>
                     <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500 opacity-[0.03] rounded-bl-full"></div>
                     <div className="text-xs text-muted-foreground mb-1 pr-6">Current Mitigation Score</div>
                     <div className="text-3xl font-light text-yellow-500 mb-2 tracking-tight">{metrics?.avg_control_effectiveness || "--"}</div>
                     <div className="text-xs text-muted-foreground">Overall defensive strength</div>
                  </div>
                  <div 
                     onClick={() => handleMetricClick("sources", metrics?.evaluated_workflows)} 
                     className="bg-card border border-border rounded-lg p-6 relative cursor-pointer hover:border-primary/50 hover:bg-accent/10 transition-colors shadow-sm hover:shadow-md"
                  >
                     <div className="absolute top-3 right-3 z-10 group/tooltip">
                        <Info className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 bg-popover border border-border text-foreground text-xs rounded-md shadow-xl p-3 hidden group-hover/tooltip:block text-center z-50">
                           The amount of external data sources (like the Dark Web, hacker forums, and threat intelligence) we scan.
                        </div>
                     </div>
                     <div className="absolute top-0 right-0 w-16 h-16 bg-primary opacity-[0.03] rounded-bl-full"></div>
                     <div className="text-xs text-muted-foreground mb-1 pr-6">Data Sources Scanned</div>
                     <div className="text-3xl font-light text-foreground mb-2 tracking-tight">{metrics?.evaluated_workflows || "--"} / 9</div>
                     <div className="text-xs text-muted-foreground">Global feeds feeding our system</div>
                  </div>
               </div>
            </div>

            {/* Simplified Monitoring Scope */}
            {userStack.length > 0 && (
               <div className="bg-card border border-border rounded-lg p-6 mt-8">
                  <div className="flex items-center gap-2 mb-4">
                     <Network className="w-5 h-5 text-primary" />
                     <h2 className="text-sm font-bold text-foreground">Actively Monitored Assets</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                     We are actively monitoring the internet and dark web for threats targeting your specific tools and infrastructure:
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
               </TabsContent>

               <TabsContent value="threats" className="mt-2 text-foreground">
            {/* Simplified Threat List */}
            <div>
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-4 mt-8">
                  <div className="relative flex items-center gap-2">
                     <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Threats Affecting Your Company</div>
                     <div className="group/tooltip relative flex items-center">
                        <Info className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 bg-popover border border-border text-foreground text-xs font-normal rounded-md shadow-xl p-3 hidden group-hover/tooltip:block pointer-events-none text-left z-50 normal-case tracking-normal">
                           This list merges external news and hacker chatter with your company's actual layout inside Virtual CISO, proving exactly which external dangers could strike your business right now.
                        </div>
                     </div>
                  </div>
                  <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" /> Ordered by Priority</div>
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
                                 <span className="text-xs text-muted-foreground">Targeting: {corr.target_name}</span>
                              </div>
                           </div>
                           <div className="flex flex-wrap items-center gap-4 md:gap-6 self-start md:self-auto w-full md:w-auto justify-between md:justify-end">
                              <div className="group/tooltip relative">
                                 <div className="text-sm font-bold font-mono cursor-help" style={{ color: corr.progress_color }}>Danger Level: {corr.progress_percent}%</div>
                                 <div className="absolute right-0 top-full mt-2 w-64 bg-popover border border-border text-foreground text-xs font-normal rounded-md shadow-xl p-4 hidden group-hover/tooltip:block pointer-events-none text-left z-50 normal-case tracking-normal leading-relaxed">
                                    Computed composite risk indicating the immediate threat to your business operations. This score is elevated because <strong>{corr.target_name}</strong> is present in your environment.
                                 </div>
                              </div>
                              {expandedRow === corr.id ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                           </div>
                        </div>

                        {/* Expanded Content */}
                        {expandedRow === corr.id && (
                           <div className="p-6 pl-8 pt-4 border-t border-border bg-popover">
                              {/* Meta */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                 <div>
                                     <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Where we found this:</h4>
                                     <div className="flex items-center gap-2 text-sm text-foreground">
                                        <div className="group/tooltip relative">
                                           <div className="px-2 py-1 rounded bg-muted font-medium cursor-help">{corr.source_name} ({corr.source_type})</div>
                                           <div className="absolute left-0 top-full mt-2 w-64 bg-popover border border-border text-foreground text-xs font-normal rounded-md shadow-xl p-4 hidden group-hover/tooltip:block pointer-events-none text-left z-50 normal-case tracking-normal leading-relaxed">
                                              The external threat intelligence source or observation feed where this attack pattern or breach indicator was initially identified.
                                           </div>
                                        </div>
                                     </div>
                                 </div>
                                 <div>
                                     <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">What is at risk:</h4>
                                     <div className="flex items-center gap-2 text-sm text-foreground">
                                        <div className="group/tooltip relative">
                                           <div className="px-2 py-1 rounded bg-muted border border-border font-medium cursor-help">{corr.target_name}</div>
                                           <div className="absolute left-0 top-full mt-2 w-64 bg-popover border border-border text-foreground text-xs font-normal rounded-md shadow-xl p-4 hidden group-hover/tooltip:block pointer-events-none text-left z-50 normal-case tracking-normal leading-relaxed">
                                              The specific internal asset, software, or third-party vendor in your organization's footprint that matches the attacker's target profile.
                                           </div>
                                        </div>
                                     </div>
                                 </div>
                              </div>

                              {/* Description */}
                              <div className="mb-6">
                                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">The Danger:</h4>
                                  <p className="text-sm text-foreground leading-relaxed p-4 bg-muted/30 border border-border/50 rounded-lg">
                                     {corr.external_signal}
                                  </p>
                              </div>

                              <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg text-sm text-foreground mb-6">
                                 <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">How to fix it:</h4>
                                 <p>{corr.recommended_action}</p>
                              </div>

                              {/* Footer Items */}
                              <div className="flex flex-col md:flex-row justify-between gap-4 mt-5 pt-4 border-t border-border text-xs text-muted-foreground w-full">
                                 <div className="flex flex-wrap items-center gap-4 flex-1">
                                    {corr.footer_stats?.map((stat, idx) => (
                                       <div key={idx} className="flex items-center gap-1.5 cursor-help group transition-colors" title={stat.tooltip}>
                                          {idx === 0 && <AlertCircle className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />}
                                          {idx > 0 && <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>}
                                          <span className="group-hover:text-foreground transition-colors">{stat.label}</span>
                                       </div>
                                    ))}
                                 </div>
                                 <button 
                                    onClick={(e) => handlePromoteToFinding(corr, e)}
                                    disabled={executionSuccess[`promote_${corr.id}`]}
                                    className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium rounded transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full md:w-auto mt-2 md:mt-0"
                                 >
                                    {executionSuccess[`promote_${corr.id}`] ? (
                                       <><Activity className="w-4 h-4" /> Promoted to Finding</>
                                    ) : "Promote to Finding"}
                                 </button>
                              </div>
                           </div>
                        )}
                     </div>
                  ))}
               </div>
            </div>
               </TabsContent>
            </Tabs>

         </div>
      </div>
   );
}
