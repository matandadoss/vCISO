"use client";
import { fetchWithAuth } from "@/lib/api";

import { useEffect, useState } from "react";
import { formatDate, cn } from "@/lib/utils";
import { Search, FileCheck, CheckCircle2, AlertCircle, Clock, Plus, X } from "lucide-react";

export default function CompliancePage() {
  const [frameworks, setFrameworks] = useState<any[]>([]);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [selectedFramework, setSelectedFramework] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Add Framework Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFrameworkName, setNewFrameworkName] = useState("");
  const [newFrameworkVersion, setNewFrameworkVersion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch Frameworks
    fetchWithAuth("http://localhost:8000/api/v1/compliance/frameworks?org_id=default")
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
     fetchWithAuth(`http://localhost:8000/api/v1/compliance/frameworks/${selectedFramework.id}/requirements?org_id=default`)
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

  const handleAddFramework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFrameworkName) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth("http://localhost:8000/api/v1/compliance/frameworks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: "default",
          framework_name: newFrameworkName,
          version: newFrameworkVersion
        })
      });
      
      const newFw = await res.json();
      setFrameworks([...frameworks, newFw]);
      setSelectedFramework(newFw);
      setIsAddModalOpen(false);
      setNewFrameworkName("");
      setNewFrameworkVersion("");
    } catch (err) {
      console.error("Failed to add framework:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <FileCheck className="h-8 w-8 text-primary" />
              Compliance Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Track frameworks, view compliance posture, and manage evidence collection.
            </p>
          </div>
          <div className="flex gap-4">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search requirements..." 
                  className="pl-9 pr-4 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-2 ring-primary"
                />
             </div>
             <button
               onClick={() => setIsAddModalOpen(true)}
               className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition"
             >
               <Plus className="w-4 h-4" />
               Add Framework
             </button>
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
                  <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-muted" style={{ borderColor: `var(--chart-${fw.overall_compliance_pct >= 90 ? '2' : fw.overall_compliance_pct >= 70 ? '4' : '1'})`}}>
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
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> Next Due: {formatDate(fw.next_assessment_due).split(',')[0]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Requirements Table */}
        {selectedFramework && (
          <div className="pt-4">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center justify-between">
              <span>{selectedFramework.framework_name} Requirements</span>
              <span className="text-sm font-normal text-muted-foreground">Showing {requirements.length} controls</span>
            </h2>
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider w-[120px]">Control ID</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider">Requirement</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-center">Status</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-center">Evidence</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Last Reviewed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {loading ? (
                     <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                          Loading requirements...
                        </td>
                     </tr>
                  ) : requirements.map((req: any) => (
                    <tr key={req.id} className="hover:bg-muted/30 transition-colors group">
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
                      <td className="px-6 py-4 text-right text-muted-foreground whitespace-nowrap">
                        {req.last_reviewed ? formatDate(req.last_reviewed) : "Never"}
                      </td>
                    </tr>
                  ))}
                  {!loading && requirements.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        No requirements found for this framework.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Framework Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border rounded-lg shadow-xl p-6">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-foreground">Add Custom Framework</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
             </div>
             <form onSubmit={handleAddFramework}>
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-foreground mb-1">Framework Name *</label>
                   <input 
                     type="text" 
                     value={newFrameworkName}
                     onChange={(e) => setNewFrameworkName(e.target.value)}
                     required
                     className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 ring-primary"
                     placeholder="e.g. PCI DSS, HIPAA"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-foreground mb-1">Version (Optional)</label>
                   <input 
                     type="text" 
                     value={newFrameworkVersion}
                     onChange={(e) => setNewFrameworkVersion(e.target.value)}
                     className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 ring-primary"
                     placeholder="e.g. v4.0"
                   />
                 </div>
               </div>
               <div className="mt-8 flex justify-end gap-3">
                 <button 
                   type="button" 
                   onClick={() => setIsAddModalOpen(false)}
                   className="px-4 py-2 bg-transparent text-foreground hover:bg-muted font-medium rounded-md transition"
                 >
                   Cancel
                 </button>
                 <button 
                   type="submit" 
                   disabled={isSubmitting || !newFrameworkName}
                   className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition disabled:opacity-50"
                 >
                   {isSubmitting ? "Adding..." : "Add Framework"}
                 </button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
