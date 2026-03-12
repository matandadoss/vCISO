"use client";

import { useEffect, useState, use } from "react";
import { ArrowLeft, AlertCircle, ShieldAlert, Cpu, Link as LinkIcon, CheckCircle2, Server, Globe, User, CheckCircle, Ticket, ShieldAlert as ShieldIcon } from "lucide-react";
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
  workflow: string;
  root_cause_analysis: string;
  affected_assets: Asset[];
  mitre_attack: MitreTactic[];
  remediation: Remediation;
  linked_items: LinkedItem[];
}

export default function FindingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const [finding, setFinding] = useState<FindingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFinding() {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/findings/${unwrappedParams.id}?org_id=default`);
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
      if (action === "assign") body = { owner_id: "user-123", notes: "Please investigate this priority item." };
      if (action === "accept-risk") body = { justification: "Mitigating controls in place via WAF.", expiration_date: "2024-12-31" };
      if (action === "ticket") body = { integration: "jira", priority: "High" };

      const res = await fetch(`http://localhost:8000/api/v1/findings/${finding.id}/${action}?org_id=default`, {
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
            <div className="flex items-center gap-3">
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
              <span className="text-sm text-muted-foreground font-medium">Risk Score: <span className="text-foreground">{finding.risk_score}</span></span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">{finding.title}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              Detected {formatDate(finding.detected_at)} via <span className="capitalize text-foreground font-medium">{finding.workflow} Workflow</span>
            </p>
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
              <CheckCircle className="h-4 w-4" />
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
              
              {finding.remediation.automated_available && (
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
            </div>

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
                  <div key={mitre.id} className="flex items-center justify-between p-2 rounded-md border border-border/50 hover:bg-accent transition-colors cursor-help">
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

            {/* Related Items */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                Related Items
              </h3>
              <div className="space-y-3">
                {finding.linked_items.map(item => (
                  <Link key={item.id} href="#" className="flex items-start gap-3 p-2 rounded-md hover:bg-accent transition-colors group">
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
