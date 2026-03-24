"use client";
import { fetchWithAuth } from "@/lib/api";

import { useEffect, useState, use } from "react";
import { ArrowLeft, AlertCircle, ShieldAlert, Cpu, Link as LinkIcon, CheckCircle2, Server, Globe, User, Ticket, Clock, ShieldAlert as ShieldIcon, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { formatDate, cn } from "@/lib/utils";

interface Asset {
  id: string;
  name: string;
  type: string;
  criticality: string;
}

interface MitreTactic {
  id: string;
  name: string;
  tactic: string;
}

interface LinkedItem {
  id: string;
  type: string;
  name: string;
}

interface ComplianceControl {
  framework: string;
  control: string;
  description: string;
}

interface Remediation {
  manual_steps: string[];
  automated_available: boolean;
  automated_description?: string;
}

interface FindingDetail {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  risk_score: number;
  status: string;
  description: string;
  detected_at: string;
  source_workflow: string;
  root_cause_analysis: string;
  affected_assets: Asset[];
  mitre_attack: MitreTactic[];
  remediation: Remediation;
  linked_items: LinkedItem[];
  compliance_controls: ComplianceControl[];
  sla_deadline?: string;
  sla_status?: string;
  sla_breached?: boolean;
}

export default function FindingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const [finding, setFinding] = useState<FindingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFinding() {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/findings/${unwrappedParams.id}?org_id=default`);
        if (!res.ok) throw new Error("Failed to fetch finding details");
        const data = await res.json();
        setFinding(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchFinding();
  }, [unwrappedParams.id]);

  const handleAction = async (action: "assign" | "remediate" | "accept-risk" | "ticket") => {
    if (!finding) return;
    
    setActionLoading(action);
    try {
      let body: any = {};
      if (action === "assign") {
          const email = window.prompt("Enter Assignee Email Address:");
          if (!email) { setActionLoading(null); return; }
          body = { owner_id: email, notes: "Please investigate this priority item." };
      }
      if (action === "accept-risk") body = { justification: "Mitigating controls in place via WAF.", expiration_date: "2024-12-31" };
      if (action === "ticket") body = { integration: "jira", priority: "High" };

      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/findings/${finding.id}/${action}?org_id=default`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Failed to ${action}`);
      const result = await res.json();
      
      // Optimistically update the local status if applicable
      setFinding({
        ...finding,
        status: result.new_status || finding.status,
      });
      
      // Could show a toast notification here
      console.log(`Successfully completed action: ${action}`, result);
    } catch (error) {
      console.error(`Error executing action ${action}:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!finding) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background min-h-screen flex-col gap-4">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Finding not found</h2>
        <Link href="/findings" className="text-primary hover:underline flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to findings
        </Link>
      </div>
    );
  }

  const getAssetIcon = (type: string) => {
    if (type.toLowerCase().includes('kubernetes') || type.toLowerCase().includes('server')) return <Server className="h-4 w-4 text-blue-500" />;
    if (type.toLowerCase().includes('load balancer') || type.toLowerCase().includes('network')) return <Globe className="h-4 w-4 text-emerald-500" />;
    return <Cpu className="h-4 w-4 text-muted-foreground" />;
  };

  const getLinkForItem = (item: LinkedItem) => {
    const t = item.type.toLowerCase();
    if (t.includes('finding')) return `/findings/${item.id}`;
    if (t.includes('correlation') || t.includes('graph')) return `/correlation/${item.id}`;
    if (t.includes('asset')) return `/company?asset=${item.id}`;
    return "#";
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb */}
        <Link href="/findings" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to all findings
        </Link>

        {/* Header Section */}
        <div className="bg-card border border-border rounded-lg p-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <span className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                finding.severity === "critical" ? "bg-destructive/10 text-destructive border border-destructive/20" :
                finding.severity === "high" ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" :
                "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
              )}>
                {finding.severity}
              </span>
              <span className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                finding.status === "remediated" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                finding.status === "risk_accepted" ? "bg-muted text-muted-foreground border-border" :
                "bg-accent text-accent-foreground border-border"
              )}>
                {finding.status.replace('_', ' ')}
              </span>
              <span className="text-sm text-muted-foreground font-medium border-r border-border pr-3">
                Risk Score: <span className="text-foreground">{finding.risk_score}</span>
              </span>
              {finding.sla_status && (
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider",
                  finding.sla_breached ? "bg-destructive text-destructive-foreground shadow-sm animate-pulse" : "bg-muted text-muted-foreground border border-border"
                )}>
                  {finding.sla_breached ? <AlertCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                  SLA: {finding.sla_status}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground">{finding.title}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              Detected {formatDate(finding.detected_at)} via <span className="capitalize text-foreground font-medium">{finding.source_workflow ? finding.source_workflow.replace(/_/g, ' ') : 'Manual'} Workflow</span>
            </p>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-500 flex items-center gap-1.5 mt-1 border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 rounded w-fit">
              <Globe className="h-3.5 w-3.5" /> Source: {(finding as any).raw_data?.source || (finding as any).source_finding_id || (finding.source_workflow ? finding.source_workflow.replace(/_/g, ' ') : 'System')}
            </p>
            {(finding as any).assigned_to && (
               <p className="text-sm font-medium text-emerald-600 dark:text-emerald-500 flex items-center gap-1.5 mt-1 border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 rounded w-fit">
                 <User className="h-3.5 w-3.5" /> Assigned to: {(finding as any).assigned_to}
               </p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 w-full xl:w-auto mt-2 xl:mt-0">
            <button 
              onClick={() => handleAction('assign')}
              disabled={actionLoading !== null}
              className="px-3 py-2 bg-card border border-border hover:bg-accent text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
            >
              <User className="h-4 w-4" />
              {actionLoading === 'assign' ? 'Assigning...' : 'Assign to Owner'}
            </button>
            <button 
              onClick={() => handleAction('ticket')}
              disabled={actionLoading !== null}
              className="px-3 py-2 bg-card border border-border hover:bg-accent text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
            >
              <Ticket className="h-4 w-4" />
              {actionLoading === 'ticket' ? 'Creating...' : 'Create Ticket'}
            </button>
            <button 
              onClick={() => handleAction('accept-risk')}
              disabled={actionLoading !== null}
              className="px-3 py-2 bg-card border border-border hover:bg-accent text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
            >
              <ShieldIcon className="h-4 w-4" />
              {actionLoading === 'accept-risk' ? 'Accepting...' : 'Accept Risk'}
            </button>
            <button 
              onClick={() => handleAction('remediate')}
              disabled={actionLoading !== null || finding.status === 'remediated'}
              className="px-3 py-2 bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-medium rounded-md transition-colors shadow-sm flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {actionLoading === 'remediate' ? 'Updating...' : finding.status === 'remediated' ? 'Remediated' : 'Mark Remediated'}
            </button>
          </div>
        </div>

        {/* Two Column Layout layout for detail widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content (Left Column) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Description & Root Cause */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div>
                <h3 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
                   Description
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{finding.description}</p>
              </div>
              <hr className="border-border" />
              <div>
                <h3 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-primary" /> Root Cause Analysis
                </h3>
                <div className="bg-accent/50 p-4 rounded-md border text-sm text-muted-foreground leading-relaxed">
                  {finding.root_cause_analysis}
                </div>
              </div>
            </div>

            {/* Remediation Steps */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Remediation Plan
              </h3>
              
              {finding.remediation?.automated_available && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-md flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Automated Remediation Available</h4>
                    <p className="text-sm text-muted-foreground mt-1">{finding.remediation.automated_description}</p>
                    <button className="mt-3 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded transition-colors shadow-sm">
                      Execute Automation
                    </button>
                  </div>
                </div>
              )}

              {finding.remediation?.manual_steps && finding.remediation.manual_steps.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-sm font-medium text-foreground">Manual Steps:</h4>
                  <div className="space-y-2">
                    {finding.remediation.manual_steps.map((step, idx) => (
                      <div key={idx} className="flex gap-3 text-sm p-3 rounded bg-accent/30 border border-transparent hover:border-border transition-colors">
                        <span className="text-muted-foreground min-w-[1.5rem] font-mono">{idx + 1}.</span>
                        <span className="text-muted-foreground">{step.replace(/^\d+\.\s*/, '')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Generated Raw Reports (Used for AI Threat Models) */}
            {(finding as any).raw_data?.full_report && (
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-emerald-500" /> Full Threat Model Report
                </h3>
                <div className="bg-[#0a0f18] text-gray-300 p-5 rounded-md border border-border overflow-x-auto text-sm leading-relaxed whitespace-pre-wrap font-mono relative">
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/20 via-primary/20 to-transparent"></div>
                   {(finding as any).raw_data?.full_report}
                </div>
              </div>
            )}

          </div>

          {/* Sidebar Content (Right Column) */}
          <div className="space-y-6">
            
            {/* Affected Assets */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Affected Assets</h3>
              <div className="space-y-3">
                {finding.affected_assets.map(asset => (
                  <div key={asset.id} className="flex items-start gap-3 p-3 rounded-md border bg-accent/30">
                     <div className="mt-0.5">{getAssetIcon(asset.type)}</div>
                     <div>
                       <div className="text-sm font-medium text-foreground">{asset.name}</div>
                       <div className="text-xs text-muted-foreground flex gap-2">
                         <span>{asset.type}</span>
                         <span>•</span>
                         <span className={asset.criticality === 'high' ? 'text-destructive' : ''}>{asset.criticality} criticality</span>
                       </div>
                     </div>
                  </div>
                ))}
              </div>
            </div>

            {/* MITRE ATT&CK Mapping */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                MITRE ATT&CK
              </h3>
              <div className="space-y-2">
                {finding.mitre_attack.map(mitre => (
                  <div key={mitre.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 p-2 rounded-md border border-border/50 hover:bg-accent transition-colors cursor-help">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-foreground">{mitre.id}</span>
                      <span className="text-xs text-muted-foreground line-clamp-1" title={mitre.name}>{mitre.name}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-primary/10 text-primary rounded">
                      {mitre.tactic}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Compliance Impact Mapping */}
            {(finding.compliance_controls && finding.compliance_controls.length > 0) && (
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Compliance Impact
                </h3>
                <div className="space-y-3">
                  {finding.compliance_controls.map((ctrl, idx) => (
                    <div key={idx} className="flex flex-col gap-1 p-3 rounded-md border border-border/50 bg-accent/20">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                        <span className="text-xs font-bold text-foreground bg-background px-2 py-0.5 rounded border w-fit">
                          {ctrl.framework}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">{ctrl.control}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {ctrl.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Items */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                Related Items
              </h3>
              <div className="space-y-3">
                {finding.linked_items.map(item => (
                  <Link key={item.id} href={getLinkForItem(item)} className="flex items-start gap-3 p-2 rounded-md hover:bg-accent transition-colors group">
                    <LinkIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.type}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
