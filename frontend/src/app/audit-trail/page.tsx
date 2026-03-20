"use client";
import { fetchWithAuth } from "@/lib/api";

import { useState, useEffect } from "react";
import { ShieldAlert, Terminal, CheckCircle2, Clock, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

type LogEntry = {
    id: string;
    action_name: string;
    target: string;
    status: string;
    executed_by: string;
    timestamp: string;
    details: string;
};

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAuditTrail() {
       try {
         const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/playbooks/audit`);
         const data = await res.json();
         setLogs(data.audit_trail || []);
       } catch (e) {
         console.error(e);
       } finally {
         setLoading(false);
       }
    }
    fetchAuditTrail();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
               <Terminal className="w-8 h-8 text-primary" />
               Automated Remediation Audit Trail
            </h1>
            <p className="text-muted-foreground mt-1">
              Immutable log of all automated playbooks, scripts, and containment actions executed by the vCISO platform or SOC analysts.
            </p>
          </div>
          <div className="flex gap-2">
             <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-md text-sm font-medium hover:bg-muted transition-colors">
                <Filter className="w-4 h-4" /> Filter
             </button>
             <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                Export Evidence
             </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
           <div className="p-4 border-b border-border flex gap-4 bg-muted/30">
              <div className="relative flex-1 max-w-md">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <input 
                   type="text" 
                   placeholder="Search commands, IPs, or actors..." 
                   className="w-full bg-background border border-border rounded-md py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-primary"
                 />
              </div>
           </div>
           
           {loading ? (
              <div className="p-12 text-center text-muted-foreground animate-pulse font-medium">Loading audit logs...</div>
           ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Timestamp</th>
                    <th className="px-6 py-4 font-semibold">Action Executed</th>
                    <th className="px-6 py-4 font-semibold">Target Asset/IP</th>
                    <th className="px-6 py-4 font-semibold">Executed By</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors group cursor-pointer">
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground border-l-2 border-transparent group-hover:border-primary transition-colors">
                         {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                         {log.action_name}
                         <div className="text-xs font-normal text-muted-foreground mt-1 truncate max-w-xs">{log.details}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-primary/80 bg-primary/5 rounded px-2 w-fit">
                         {log.target}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-medium">
                         {log.executed_by}
                      </td>
                      <td className="px-6 py-4">
                         <span className={cn(
                           "px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 w-fit",
                           log.status === "success" ? "bg-green-500/10 text-green-500" :
                           log.status === "pending" ? "bg-yellow-500/10 text-yellow-500" :
                           "bg-red-500/10 text-red-500"
                         )}>
                           {log.status === "success" && <CheckCircle2 className="w-3.5 h-3.5" />}
                           {log.status === "pending" && <Clock className="w-3.5 h-3.5" />}
                           {log.status.toUpperCase()}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           )}
        </div>
      </div>
    </div>
  );
}
