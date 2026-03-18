"use client";
import { fetchWithAuth } from "@/lib/api";

import React, { useEffect, useState } from "react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Search, ShieldAlert, Activity, Users, BookOpen, FlaskConical } from "lucide-react";
import Link from "next/link";

export default function ThreatIntelPage() {
  const [actors, setActors] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [darkWebAlerts, setDarkWebAlerts] = useState([]);
  const [breachReports, setBreachReports] = useState<any[]>([]);
  const [breachOffset, setBreachOffset] = useState(0);
  const [breachHasMore, setBreachHasMore] = useState(false);
  const [loadingMoreBreaches, setLoadingMoreBreaches] = useState(false);
  const BREACH_LIMIT = 4;
  
  const [loading, setLoading] = useState(true);
  const [expandedIoc, setExpandedIoc] = useState<string | null>(null);
  
  // Playbook execution state
  const [executingIoc, setExecutingIoc] = useState<string | null>(null);
  const [executionSuccess, setExecutionSuccess] = useState<Record<string, boolean>>({});

  const toggleIoc = (id: string) => {
    setExpandedIoc(expandedIoc === id ? null : id);
  };

  const executePlaybook = async (ind: any) => {
    setExecutingIoc(ind.id);
    try {
      const res = await fetchWithAuth(`/api/v1/playbooks/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action_name: `Block ${ind.indicator_type.toUpperCase()}`,
          target: ind.value,
          parameters: { severity: ind.severity }
        })
      });
      if (res.ok) {
         setExecutionSuccess(prev => ({ ...prev, [ind.id]: true }));
      }
    } catch (e) {
      console.error("Failed to execute playbook", e);
    } finally {
      setExecutingIoc(null);
    }
  };

  const fetchBreaches = async (offset: number) => {
    try {
      const res = await fetchWithAuth(`/api/v1/threat-intel/breach-reports?org_id=default&limit=${BREACH_LIMIT}&offset=${offset}`);
      if (res.ok) {
        const data = await res.json();
        if (offset === 0) {
          setBreachReports(data.items || []);
        } else {
          setBreachReports(prev => [...prev, ...(data.items || [])]);
        }
        setBreachHasMore(data.has_more);
      }
    } catch (err) {
      console.error("Error fetching breach reports:", err);
    }
  };

  const handleLoadMoreBreaches = async () => {
    setLoadingMoreBreaches(true);
    const nextOffset = breachOffset + BREACH_LIMIT;
    await fetchBreaches(nextOffset);
    setBreachOffset(nextOffset);
    setLoadingMoreBreaches(false);
  };

  useEffect(() => {
    // Fetch Threat Actors
    fetchWithAuth(`/api/v1/threat-intel/actors?org_id=default`)
      .then((res) => res.json())
      .then((data) => {
        setActors(data.items || []);
      })
      .catch((err) => console.error("Error fetching actors:", err));

    // Fetch Threat Indicators
    fetchWithAuth(`/api/v1/threat-intel/indicators?org_id=default`)
      .then((res) => res.json())
      .then((data) => {
        setIndicators(data.items || []);
      })
      .catch((err) => console.error("Error fetching indicators:", err));

    // Fetch Breach Reports
    fetchBreaches(0);

    // Fetch Dark Web Alerts
    fetchWithAuth(`/api/v1/threat-intel/dark-web?org_id=default`)
      .then((res) => res.json())
      .then((data) => {
        setDarkWebAlerts(data.items || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching dark web alerts:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <ShieldAlert className="h-8 w-8 text-primary" />
              Threat Intelligence
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor active threat actors and known threat signals.
            </p>
          </div>
          <div className="flex w-full xl:w-auto relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <input 
               type="text" 
               placeholder="Search intelligence..." 
               className="pl-9 pr-4 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-2 ring-primary w-full md:w-64"
             />
          </div>
        </div>

        {/* Threat Actors Cards */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" /> 
            Tracked Threat Actors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {actors.map((actor: any) => (
              <div key={actor.id} className={cn(
                "bg-card border rounded-lg p-6 flex flex-col hover:border-primary/50 transition-colors relative",
                actor.relevance_score === "High" ? "border-red-500/30" : "border-border"
              )}>
                {/* Relevance Badge */}
                {actor.relevance_score && (
                  <div className={cn(
                    "absolute -top-2.5 -right-2.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border shadow-sm",
                    actor.relevance_score === 'High' ? "bg-red-500 text-white border-red-600" :
                    actor.relevance_score === 'Medium' ? "bg-orange-500 text-white border-orange-600" :
                    "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                  )}>
                    {actor.relevance_score} Relevance
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-foreground">{actor.name}</h3>
                  <span className={cn(
                    "px-2 py-1 text-xs font-semibold rounded-full uppercase tracking-wide",
                    actor.sophistication === "nation_state" ? "bg-red-500/20 text-red-500" :
                    actor.sophistication === "advanced" ? "bg-orange-500/20 text-orange-500" :
                    "bg-yellow-500/20 text-yellow-500"
                  )}>
                    {actor.sophistication.replace("_", " ")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{actor.description}</p>
                
                {/* Relevance Reasons Box */}
                {actor.relevance_reasons && actor.relevance_reasons.length > 0 && (
                  <div className="mb-4 flex-1 bg-accent/30 border border-border/50 rounded p-3">
                    <p className="text-xs font-semibold text-foreground mb-1 0">Why it matters to you:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      {actor.relevance_reasons.map((reason: string, i: number) => (
                        <li key={i} className="text-xs text-muted-foreground">{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* MITRE ATT&CK TTPs Box */}
                {actor.mitre_attack_techniques && actor.mitre_attack_techniques.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
                      Known Attack Methods
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {actor.mitre_attack_techniques.map((ttp: any, i: number) => (
                        <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 border border-border/50 rounded text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground cursor-help transition-colors" title={ttp.tactic}>
                          <span className="font-mono font-bold text-primary/80">{ttp.id}</span>
                          <span className="truncate max-w-[140px]">{ttp.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs text-muted-foreground mt-auto pt-4 border-t border-border/50">
                  <span>First seen: {formatDate(actor.first_seen)}</span>
                  <span className={cn("flex items-center gap-1 font-medium", actor.active ? "text-green-500" : "text-muted-foreground")}>
                    <span className={cn("w-2 h-2 rounded-full", actor.active ? "bg-green-500" : "bg-muted-foreground")}></span>
                    {actor.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
            {actors.length === 0 && !loading && (
               <div className="col-span-full h-32 flex items-center justify-center text-muted-foreground border border-dashed border-border rounded-lg">
                 No threat actors tracked.
               </div>
            )}
          </div>
        </div>

        {/* Indicators Table */}
        <div className="pt-4">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" /> 
            Recent Threat Signals
          </h2>
          <div className="bg-card border border-border rounded-lg overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Indicator Type</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Value</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Severity</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Relevance</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Confidence</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Valid From</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {indicators.map((ind: any) => (
                  <React.Fragment key={ind.id}>
                    <tr 
                      onClick={() => toggleIoc(ind.id)}
                      className={cn(
                        "transition-colors cursor-pointer",
                        expandedIoc === ind.id ? "bg-accent/50" : "hover:bg-muted/30"
                      )}
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded text-foreground uppercase">
                          {ind.indicator_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-foreground font-medium">{ind.value}</span>
                      </td>
                      <td className="px-6 py-4">
                         <span className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider",
                          ind.severity === "critical" ? "bg-destructive/10 text-destructive" :
                          ind.severity === "high" ? "bg-orange-500/10 text-orange-500" :
                          "bg-yellow-500/10 text-yellow-500"
                        )}>
                          {ind.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {ind.relevance_score && (
                          <div className="flex flex-col gap-1">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider w-fit border",
                              ind.relevance_score === 'High' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                              ind.relevance_score === 'Medium' ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                              "bg-muted text-muted-foreground border-border"
                            )}>
                              {ind.relevance_score}
                            </span>
                            {ind.relevance_reasons?.[0] && (
                              <span className="text-[10px] text-muted-foreground line-clamp-1 max-w-[200px]" title={ind.relevance_reasons[0]}>
                                {ind.relevance_reasons[0]}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-muted rounded-full h-1.5 max-w-[80px]">
                            <div 
                              className={cn("h-1.5 rounded-full", ind.confidence >= 90 ? "bg-red-500" : ind.confidence >= 70 ? "bg-orange-500" : "bg-blue-500")}
                              style={{ width: `${ind.confidence}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-muted-foreground">{ind.confidence}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-muted-foreground flex items-center justify-end gap-2">
                        {ind.valid_from ? formatDate(ind.valid_from) : "Unknown"}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={cn("h-4 w-4 transition-transform", expandedIoc === ind.id ? "rotate-180" : "rotate-0")}
                        >
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </td>
                    </tr>
                    
                    {/* Expanded Detail Row */}
                    {expandedIoc === ind.id && (
                      <tr className="bg-accent/10 border-b border-border">
                        <td colSpan={6} className="px-0 py-0">
                          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            
                            {/* Associated Actor & Stages */}
                            <div className="space-y-4 lg:col-span-1">
                              <div>
                                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Associated Actor</h4>
                                {ind.associated_actor_name ? (
                                  <div className="flex items-center gap-2 text-sm text-primary font-medium">
                                    <Users className="h-4 w-4" />
                                    {ind.associated_actor_name}
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">Unknown</span>
                                )}
                              </div>
                              
                              {ind.attack_stages && ind.attack_stages.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Attack Stages</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {ind.attack_stages.map((stage: string, i: number) => (
                                      <span key={i} className="px-2 py-1 bg-background border border-border rounded text-xs text-muted-foreground">
                                        {stage}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Affected Assets */}
                            <div className="space-y-4 lg:col-span-1 border-t md:border-t-0 md:border-l border-border/50 md:pl-6">
                              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Local Environment Impact</h4>
                              {ind.affected_assets && ind.affected_assets.length > 0 ? (
                                <div className="space-y-2">
                                  {ind.affected_assets.map((asset: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-2 rounded border border-destructive/20 bg-destructive/5">
                                      <div className="flex flex-col">
                                        <span className="text-sm font-medium text-destructive">{asset.name}</span>
                                        <span className="text-xs text-muted-foreground">{asset.type}</span>
                                      </div>
                                      <span className="text-[10px] uppercase font-bold text-destructive px-1.5 py-0.5 bg-destructive/10 rounded">
                                        {asset.status}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 p-3 rounded border border-emerald-500/20 bg-emerald-500/5 text-sm text-emerald-600 dark:text-emerald-400">
                                  <ShieldAlert className="h-4 w-4" />
                                  No internal assets exposed.
                                </div>
                              )}
                            </div>

                            {/* Recommended Actions */}
                            <div className="space-y-4 lg:col-span-2 border-t lg:border-t-0 lg:border-l border-border/50 lg:pl-6">
                              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                                Recommended Actions
                              </h4>
                              {ind.recommended_actions && ind.recommended_actions.length > 0 ? (
                                <div className="space-y-2">
                                  {ind.recommended_actions.map((action: string, i: number) => (
                                    <div key={i} className="flex items-start gap-3 p-3 bg-background border border-border rounded">
                                      <Activity className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                      <span className="text-sm text-foreground">{action}</span>
                                    </div>
                                  ))}
                                  <div className="pt-2 flex gap-3">
                                    {executionSuccess[ind.id] ? (
                                       <div className="px-4 py-2 bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium rounded shadow-sm flex items-center gap-2">
                                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                         Executed Successfully
                                       </div>
                                    ) : (
                                       <button 
                                         onClick={(e) => { e.stopPropagation(); executePlaybook(ind); }}
                                         disabled={executingIoc === ind.id}
                                         className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium rounded shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70"
                                       >
                                         {executingIoc === ind.id ? (
                                           <><Activity className="w-4 h-4 animate-spin" /> Executing...</>
                                         ) : (
                                           "Execute Action Plan"
                                         )}
                                       </button>
                                    )}
                                    <button className="px-4 py-2 bg-card border border-border hover:bg-muted text-sm font-medium rounded transition-colors">
                                      Create Ticket
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">Monitor for activity.</span>
                              )}
                            </div>
                            
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {indicators.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      No indicators found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Breach Reports Section */}
        <div className="pt-4">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-500" /> 
            Hindsight
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {breachReports.map((report: any) => (
              <div key={report.id} className="bg-card border border-border rounded-lg p-6 flex flex-col hover:border-primary/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-foreground">{report.title}</h3>
                  <span className="px-2 py-1 bg-muted text-muted-foreground text-[10px] font-bold uppercase rounded">
                    {report.industry}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mb-4 flex gap-4">
                  <span>Actor: {report.threat_actor}</span>
                  <span>Date: {report.date}</span>
                </div>
                <p className="text-sm text-foreground/80 mb-6 flex-1">
                  {report.summary}
                </p>
                <div className="border-t border-border/50 pt-4 mt-auto">
                  <Link 
                    href={`/simulator?q=${encodeURIComponent(report.simulation_query)}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary transition-colors rounded font-medium text-xs border border-primary/20"
                  >
                    <FlaskConical className="w-3.5 h-3.5" />
                    What-If: Simulate on Our Architecture
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {breachHasMore && (
            <div className="flex justify-center mt-6">
              <button 
                onClick={handleLoadMoreBreaches}
                disabled={loadingMoreBreaches}
                className="px-6 py-2 bg-muted text-foreground hover:bg-accent hover:text-accent-foreground border border-border rounded-full text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
              >
                {loadingMoreBreaches ? (
                  <><Activity className="w-4 h-4 animate-spin" /> Loading more...</>
                ) : (
                  "Load More Previous Breaches"
                )}
              </button>
            </div>
          )}
        </div>

        {/* Dark Web Monitoring Section */}
        <div className="pt-4">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-4.05 3.01-7.4 6.95-7.93v2.03C8.1 6.55 6 9.04 6 12c0 3.31 2.69 6 6 6s6-2.69 6-6c0-2.96-2.1-5.45-4.95-5.9v-2.03C16.99 4.6 20 7.95 20 12c0 4.41-3.59 8-8 8zm-1-6h2v2h-2v-2zm0-8h2v6h-2V6z"/>
            </svg>
            Dark Web Monitoring
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {darkWebAlerts.map((alert: any) => (
              <div key={alert.id} className="bg-card border border-border rounded-lg p-6 flex flex-col hover:border-primary/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-mono text-muted-foreground uppercase">{alert.alert_type}</span>
                    <h3 className="text-base font-bold text-foreground line-clamp-2" title={alert.title}>{alert.title}</h3>
                  </div>
                  <span className={cn(
                    "px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border shadow-sm",
                    alert.severity === "critical" ? "bg-red-500 text-white border-red-600" :
                    alert.severity === "high" ? "bg-orange-500 text-white border-orange-600" :
                    "bg-yellow-500 text-white border-yellow-600"
                  )}>
                    {alert.severity}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground mb-6 flex-1 bg-accent/30 p-3 rounded border border-border/50">
                  {alert.description}
                </p>
                
                <div className="flex justify-between items-center text-xs text-muted-foreground mt-auto pt-4 border-t border-border/50">
                  <span className="flex items-center gap-1 font-medium text-foreground bg-muted px-2 py-1 rounded">
                    Source: {alert.source}
                  </span>
                  <span>{formatDate(alert.detected_at)}</span>
                </div>
              </div>
            ))}
            {darkWebAlerts.length === 0 && !loading && (
               <div className="col-span-full py-8 text-center text-muted-foreground border border-dashed border-border rounded-lg bg-card/50">
                 No dark web alerts detected.
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
