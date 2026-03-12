"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Search, Filter, ArrowRight, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';

export default function FindingsPage() {
  const [findings, setFindings] = useState([]);
  const searchParams = useSearchParams();

  useEffect(() => {
    async function fetchFindings() {
      try {
        const severity = searchParams?.get('severity');
        const status = searchParams?.get('status');
        
        let url = 'http://localhost:8000/api/v1/findings?org_id=default';
        if (severity) url += `&severity=${severity}`;
        if (status) url += `&status=${status}`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setFindings(data.items);
        }
      } catch (err) {
        console.error("Failed to fetch findings", err);
      }
    }
    fetchFindings();
  }, [searchParams]);

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Findings & Alerts</h1>
            <p className="text-muted-foreground mt-1">
              Review and remediate security issues detected across all workflows.
            </p>
          </div>
          <div className="flex gap-4">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search findings..." 
                  className="pl-9 pr-4 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-2 ring-primary"
                />
             </div>
             <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-md text-sm font-medium hover:bg-muted">
                <Filter className="h-4 w-4" /> Filter
             </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Finding</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Severity</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Risk Score</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Detected</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">SLA</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {findings.map((f: any) => (
                <tr key={f.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-foreground">{f.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">{f.workflow} Workflow</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider",
                      f.severity === "critical" ? "bg-destructive/10 text-destructive" :
                      f.severity === "high" ? "bg-orange-500/10 text-orange-500" :
                      "bg-yellow-500/10 text-yellow-500"
                    )}>
                      {f.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-foreground font-medium">{f.risk_score}</span>
                  </td>
                  <td className="px-6 py-4">
                     <span className="text-muted-foreground capitalize">{f.status}</span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {formatDate(f.detected_at)}
                  </td>
                  <td className="px-6 py-4">
                    {f.sla_status && (
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap",
                        f.sla_breached ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-muted text-muted-foreground border border-border"
                      )}>
                        {f.sla_breached ? <AlertCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {f.sla_status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/findings/${f.id}`} className="text-primary hover:text-blue-400 font-medium text-sm flex items-center justify-end w-full">
                      Investigate <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
