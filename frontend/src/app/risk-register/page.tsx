"use client";
import { fetchWithAuth } from "@/lib/api";
import { useEffect, useState } from "react";
import { formatDate, cn } from "@/lib/utils";
import { Search, Filter, ArrowRight, ShieldAlert, FolderCheck } from "lucide-react";
import Link from "next/link";
import { useSortableTable } from "@/hooks/useSortableTable";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { useSearchParams, useRouter } from 'next/navigation';

export default function RiskRegisterPage() {
  const [risks, setRisks] = useState([]);
  const searchParams = useSearchParams();
  const router = useRouter();

  const severityFilter = searchParams?.get('severity') || '';

  useEffect(() => {
    async function fetchRisks() {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/risk-register`);
        if (res.ok) {
          const data = await res.json();
          let filtered = data;
          if (severityFilter) {
             filtered = filtered.filter((r: any) => r.risk_level.toLowerCase() === severityFilter.toLowerCase());
          }
          setRisks(filtered);
        }
      } catch (err) {
        console.error("Failed to fetch risk register", err);
      }
    }
    fetchRisks();
  }, [severityFilter]);

  const { items: sortedRisks, requestSort, sortConfig } = useSortableTable(risks);

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (newStatus) {
      params.set('severity', newStatus);
    } else {
      params.delete('severity');
    }
    router.push(`/risk-register?${params.toString()}`);
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
               value={severityFilter}
               onChange={handleLevelChange}
               className="px-4 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-2 ring-primary"
             >
               <option value="">All Risk Levels</option>
               <option value="critical">Critical</option>
               <option value="high">High</option>
               <option value="medium">Medium</option>
               <option value="low">Low</option>
             </select>

             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search risk lines..." 
                  className="pl-9 pr-4 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-2 ring-primary"
                />
             </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <SortableHeader label="Risk Line Item" sortKey="title" currentSort={sortConfig} requestSort={requestSort} />
                <SortableHeader label="Level" sortKey="risk_level" currentSort={sortConfig} requestSort={requestSort} />
                <SortableHeader label="Categories" sortKey="risk_categories" currentSort={sortConfig} requestSort={requestSort} />
                <SortableHeader label="Owner" sortKey="owner" currentSort={sortConfig} requestSort={requestSort} />
                <SortableHeader label="Date Entered" sortKey="date_entered" currentSort={sortConfig} requestSort={requestSort} />
                <SortableHeader label="Expires" sortKey="expiration_date" currentSort={sortConfig} requestSort={requestSort} />
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {risks.length === 0 ? (
                 <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                       No risks currently recorded in the registry.
                    </td>
                 </tr>
              ) : sortedRisks.map((r: any) => (
                <tr key={r.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-foreground truncate max-w-sm">{r.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{r.finding_id ? "Linked to Finding" : "Manual Entry"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider",
                      r.risk_level === "critical" ? "bg-destructive/10 text-destructive" :
                      r.risk_level === "high" ? "bg-orange-500/10 text-orange-500" :
                      r.risk_level === "medium" ? "bg-yellow-500/10 text-yellow-500" :
                      "bg-emerald-500/10 text-emerald-500"
                    )}>
                      {r.risk_level}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex flex-wrap gap-1">
                        {r.risk_categories && r.risk_categories.map((cat: string, i: number) => (
                           <span key={i} className="px-2 py-0.5 border border-border rounded bg-muted text-[10px] uppercase font-mono tracking-widest text-muted-foreground">
                             {cat}
                           </span>
                        ))}
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className="text-muted-foreground font-medium">{r.owner || "Unassigned"}</span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {r.date_entered ? formatDate(r.date_entered) : "-"}
                  </td>
                  <td className="px-6 py-4">
                    {r.expiration_date ? (
                        <span className={cn("font-medium", new Date(r.expiration_date) < new Date() ? "text-destructive font-bold animate-pulse" : "text-emerald-500")}>
                           {formatDate(r.expiration_date)}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/risk-register/${r.id}`} className="text-primary hover:text-blue-400 font-medium text-sm flex items-center justify-end w-full">
                      Manage <ArrowRight className="h-4 w-4 ml-1" />
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
