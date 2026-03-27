"use client";
import { fetchWithAuth } from "@/lib/api";

import React, { useEffect, useState } from "react";
import { formatDate, cn } from "@/lib/utils";
import { Search, FileCheck, CheckCircle2, AlertCircle, Clock, Plus, X, Info } from "lucide-react";
import Link from "next/link";
import { useSortableTable } from "@/hooks/useSortableTable";
import { SortableHeader } from "@/components/ui/SortableHeader";

export default function CompliancePage() {
  const [frameworks, setFrameworks] = useState<any[]>([]);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [selectedFramework, setSelectedFramework] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedReq, setExpandedReq] = useState<string | null>(null);
  const [executionSuccess, setExecutionSuccess] = useState<Record<string, boolean>>({});

  const handlePromoteToFinding = async (req: any) => {
    try {
      const payload = {
        requirement_id: req.id,
        title: `Compliance Gap: ${req.requirement_id_code} - ${req.title}`,
        description: `Control failure for ${req.title}. Evidence status: ${req.evidence_status}. Details: ${req.description || 'N/A'}`
      };

      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/findings/from-compliance?org_id=default`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
         setExecutionSuccess(prev => ({ ...prev, [`promote_${req.id}`]: true }));
         setRequirements(prev => prev.map(r => r.id === req.id ? { ...r, status: 'non_compliant' } : r));
      }
    } catch (e) {
      console.error("Failed to promote requirement", e);
    }
  };

  useEffect(() => {
    // Fetch Frameworks
    fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/compliance/frameworks?org_id=default`)
      .then((res) => res.json())
      .then((data) => {
        setFrameworks(data.items || []);
        if (data.items && data.items.length > 0) {
          setSelectedFramework(data.items[0]);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error fetching frameworks:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedFramework) return;

    setLoading(true);
    fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/compliance/frameworks/${selectedFramework.id}/requirements?org_id=default`)
      .then((res) => res.json())
      .then((data) => {
        setRequirements(data.items || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching requirements:", err);
        setLoading(false);
      });
  }, [selectedFramework]);

  const filteredRequirements = requirements.filter(req => 
    !searchQuery || 
    (req.requirement_id_code?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
    (req.title?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const { items: sortedRequirements, requestSort, sortConfig } = useSortableTable(filteredRequirements);

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
          <div className="hidden">
            {/* Title moved to global AppHeader */}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto mt-4 md:mt-0">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search requirements..."
                className="pl-9 pr-4 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-2 ring-primary w-full"
              />
            </div>
            <Link 
              href="/company"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-accent/50 text-foreground border border-border rounded-md text-sm font-medium hover:bg-muted transition w-full sm:w-auto"
            >
              <Info className="w-4 h-4 text-primary" />
              Manage Frameworks in My Company
            </Link>
          </div>
        </div>

        {/* Frameworks Overview */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Active Frameworks</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {frameworks.map((fw: any) => (
              <div
                key={fw.id}
                onClick={() => setSelectedFramework(fw)}
                className={cn(
                  "bg-card border rounded-lg p-6 cursor-pointer transition-all hover:shadow-md",
                  selectedFramework?.id === fw.id ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{fw.framework_name}</h3>
                    {fw.version && <p className="text-xs text-muted-foreground">{fw.version}</p>}
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-muted" style={{ borderColor: `var(--chart-${fw.overall_compliance_pct >= 90 ? '2' : fw.overall_compliance_pct >= 70 ? '4' : '1'})` }}>
                    <span className="text-xs font-bold text-foreground">{Math.round(fw.overall_compliance_pct)}%</span>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="w-full bg-muted rounded-full h-2 text-xs">
                    <div
                      className={cn("h-2 rounded-full", fw.overall_compliance_pct >= 90 ? "bg-green-500" : fw.overall_compliance_pct >= 70 ? "bg-orange-500" : "bg-red-500")}
                      style={{ width: `${fw.overall_compliance_pct}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-muted-foreground mt-6 pt-4 border-t border-border/50">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Next Due: {formatDate(fw.next_assessment_due).split(',')[0]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Requirements Table */}
        {selectedFramework && (
          <div className="pt-4">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
              <span>{selectedFramework.framework_name} Requirements</span>
              <span className="text-sm font-normal text-muted-foreground">Showing {requirements.length} controls</span>
            </h2>
            <div className="bg-card border border-border rounded-lg overflow-x-auto w-full">
              <table className="w-full text-sm text-left min-w-[800px]">
                <thead className="bg-muted text-muted-foreground border-b border-border">
                  <tr>
                    <SortableHeader label="Control ID" sortKey="requirement_id_code" currentSort={sortConfig} requestSort={requestSort} className="w-[120px]" />
                    <SortableHeader label="Requirement" sortKey="title" currentSort={sortConfig} requestSort={requestSort} />
                    <SortableHeader label="Status" sortKey="status" currentSort={sortConfig} requestSort={requestSort} className="text-center" />
                    <SortableHeader label="Evidence" sortKey="evidence_status" currentSort={sortConfig} requestSort={requestSort} className="text-center" />
                    <SortableHeader label="Last Reviewed" sortKey="last_reviewed" currentSort={sortConfig} requestSort={requestSort} className="text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        Loading requirements...
                      </td>
                    </tr>
                  ) : sortedRequirements.map((req: any) => (
                    <React.Fragment key={req.id}>
                      <tr 
                        onClick={() => setExpandedReq(expandedReq === req.id ? null : req.id)}
                        className={cn(
                          "transition-colors cursor-pointer group",
                          expandedReq === req.id ? "bg-accent/50" : "hover:bg-muted/30"
                        )}
                      >
                      <td className="px-6 py-4">
                        <span className="font-mono font-medium text-foreground">{req.requirement_id_code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-foreground max-w-md truncate" title={req.title}>{req.title}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider",
                          req.status === "compliant" ? "bg-green-500/10 text-green-500" :
                            req.status === "partial" ? "bg-yellow-500/10 text-yellow-500" :
                              "bg-red-500/10 text-red-500"
                        )}>
                          {req.status === "compliant" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                          {req.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "text-xs font-medium capitalize",
                          req.evidence_status === "collected" ? "text-green-500" :
                            req.evidence_status === "incomplete" ? "text-yellow-500" :
                              "text-red-500"
                        )}>
                          {req.evidence_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-muted-foreground whitespace-nowrap flex items-center justify-end gap-2">
                        {req.last_reviewed ? formatDate(req.last_reviewed) : "Never"}
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
                          className={cn("h-4 w-4 transition-transform", expandedReq === req.id ? "rotate-180" : "rotate-0")}
                        >
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </td>
                    </tr>
                    {expandedReq === req.id && (
                      <tr className="bg-accent/10 border-b border-border">
                        <td colSpan={5} className="px-0 py-0">
                          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-4 md:col-span-2">
                                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Control Details</h4>
                                <p className="text-sm text-muted-foreground">{req.description || "No description available."}</p>
                                
                                <div className="mt-4 flex gap-3">
                                  <button 
                                      onClick={(e) => { e.stopPropagation(); handlePromoteToFinding(req); }}
                                      disabled={executionSuccess[`promote_${req.id}`] || req.status === 'compliant'}
                                      className="px-4 py-2 bg-card border border-border hover:bg-muted text-sm font-medium rounded transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                      {executionSuccess[`promote_${req.id}`] ? (
                                        <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Promoted to Finding (Risk Tracked)</>
                                      ) : req.status === 'compliant' ? "Compliant - No Risk" : "Promote to Finding (Track Risk)"}
                                  </button>
                                </div>
                            </div>
                            <div className="space-y-4 border-t md:border-t-0 md:border-l border-border/50 md:pl-6">
                                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Evidence Status</h4>
                                <span className={cn(
                                  "text-sm font-medium capitalize",
                                  req.evidence_status === "collected" ? "text-green-500" :
                                    req.evidence_status === "incomplete" ? "text-yellow-500" :
                                      "text-red-500"
                                )}>
                                  {req.evidence_status}
                                </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                  {!loading && requirements.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        No requirements found for this framework.
                      </td>
                    </tr>
                  )}
                  {!loading && requirements.length > 0 && filteredRequirements.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        No requirements matching "{searchQuery}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>


    </div>
  );
}
