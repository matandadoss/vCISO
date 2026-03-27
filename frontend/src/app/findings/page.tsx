"use client";
import { fetchWithAuth } from "@/lib/api";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Search, Filter, ArrowRight, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from 'next/navigation';
import { SortableHeader } from "@/components/ui/SortableHeader";

export default function FindingsPage() {
  const [findings, setFindings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Parse state from URL or set defaults
  const page = parseInt(searchParams?.get('page') || '1');
  const limit = 10;
  const statusFilter = searchParams?.get('status') || '';
  const severityFilter = searchParams?.get('severity') || '';
  const sortBy = searchParams?.get('sort_by') || 'detected_at';
  const sortDir = searchParams?.get('sort_dir') || 'desc';

  useEffect(() => {
    async function fetchFindings() {
      try {
        const offset = (page - 1) * limit;
        
        // Build base URL
        let url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/findings?org_id=default&limit=${limit}&offset=${offset}`;
        
        // Append filters if they exist
        if (severityFilter) url += `&severity=${severityFilter}`;
        if (statusFilter) url += `&status=${statusFilter}`;
        url += `&sort_by=${sortBy}&sort_dir=${sortDir}`;

        const res = await fetchWithAuth(url);
        if (res.ok) {
          const data = await res.json();
          setFindings(data.items);
          setTotal(data.total);
        }
      } catch (err) {
        console.error("Failed to fetch findings", err);
      }
    }
    fetchFindings();
  }, [page, statusFilter, severityFilter, sortBy, sortDir]);

  const handleSort = (key: string) => {
    const newDir = (sortBy === key && sortDir === 'asc') ? 'desc' : 'asc';
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('sort_by', key);
    params.set('sort_dir', newDir);
    params.set('page', '1');
    router.push(`/findings?${params.toString()}`);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (newStatus) {
      params.set('status', newStatus);
    } else {
      params.delete('status');
    }
    params.set('page', '1'); // Reset to page 1 on filter
    router.push(`/findings?${params.toString()}`);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="hidden">
            {/* Title moved to global AppHeader */}
          </div>
             <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
              <select 
                value={statusFilter}
                onChange={handleStatusChange}
                className="px-4 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-2 ring-primary"
              >
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="triaged">Reviewed</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="accepted">Risk Accepted</option>
                <option value="false_positive">False Positive</option>
              </select>

               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Search findings..." 
                    className="pl-9 pr-4 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-2 ring-primary"
                  />
               </div>
               <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-md text-sm font-medium hover:bg-muted transition-colors border-dashed">
                  <Filter className="h-4 w-4" /> More Filters
               </button>
            </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <SortableHeader label="Finding" sortKey="title" currentSort={{ key: sortBy, direction: sortDir as any }} requestSort={handleSort as any} />
                <SortableHeader label="Severity" sortKey="severity" currentSort={{ key: sortBy, direction: sortDir as any }} requestSort={handleSort as any} />
                <SortableHeader label="Source" sortKey="source_workflow" currentSort={{ key: sortBy, direction: sortDir as any }} requestSort={handleSort as any} />
                <SortableHeader label="Risk Score" sortKey="risk_score" currentSort={{ key: sortBy, direction: sortDir as any }} requestSort={handleSort as any} />
                <SortableHeader label="Status" sortKey="status" currentSort={{ key: sortBy, direction: sortDir as any }} requestSort={handleSort as any} />
                <SortableHeader label="Detected" sortKey="detected_at" currentSort={{ key: sortBy, direction: sortDir as any }} requestSort={handleSort as any} />
                <SortableHeader label="Fix Deadline" sortKey="sla_deadline" currentSort={{ key: sortBy, direction: sortDir as any }} requestSort={handleSort as any} />
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {findings.map((f: any) => (
                <tr 
                  key={f.id} 
                  onClick={() => router.push(`/findings/${f.id}`)}
                  className="hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <p className="font-semibold text-foreground">{f.title}</p>
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
                     <span className="text-sm font-medium capitalize text-muted-foreground">{f.source_workflow ? f.source_workflow.replace(/_/g, ' ') : 'Manual'}</span>
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
                    <input 
                      type="date"
                      className="px-2 py-1.5 bg-card border border-border hover:border-primary focus:ring-2 focus:ring-primary/50 text-foreground text-xs font-medium rounded-md shadow-sm transition-all cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                      value={f.sla_deadline ? new Date(f.sla_deadline).toISOString().split('T')[0] : ''}
                      onChange={async (e) => {
                        e.stopPropagation();
                        try {
                          const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/findings/${f.id}/deadline?org_id=default`, {
                            method: "PATCH",
                            headers: {"Content-Type": "application/json"},
                            body: JSON.stringify({sla_deadline: e.target.value ? new Date(e.target.value).toISOString() : null})
                          });
                          if (res.ok) {
                            setFindings(prev => prev.map((finding: any) => finding.id === f.id ? {...finding, sla_deadline: e.target.value ? new Date(e.target.value).toISOString() : null} : finding));
                          }
                        } catch (err) {}
                      }}
                    />
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
          
          {/* Pagination Controls */}
          {total > limit && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 px-6 py-4 border-t border-border bg-card">
              <span className="text-sm text-muted-foreground">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} findings
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const params = new URLSearchParams(searchParams?.toString() || '');
                    params.set('page', String(page - 1));
                    router.push(`/findings?${params.toString()}`);
                  }}
                  disabled={page === 1}
                  className="px-3 py-1 bg-card border border-border rounded-md text-sm font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button 
                  onClick={() => {
                    const params = new URLSearchParams(searchParams?.toString() || '');
                    params.set('page', String(page + 1));
                    router.push(`/findings?${params.toString()}`);
                  }}
                  disabled={page * limit >= total}
                  className="px-3 py-1 bg-card border border-border rounded-md text-sm font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
