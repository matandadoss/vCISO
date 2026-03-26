"use client";
import { fetchWithAuth } from "@/lib/api";
import { useState, useEffect, useRef } from "react";
import { 
  Building2, Search, AlertCircle, CheckCircle2, AlertTriangle, 
  ChevronRight, Server, Shield, Activity, Users, Database, Globe, 
  Smartphone, Cloud, Key, FileCode2, Edit2, Trash2, Upload, Plus
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { useSortableTable } from "@/hooks/useSortableTable";
import { SortableHeader } from "@/components/ui/SortableHeader";

type Vendor = {
  id: string;
  name: string;
  risk_score: number;
  status: "Safe" | "Warning" | "Critical";
  tech_stack: string[];
  last_assessment: string;
};

type InspectionReport = {
  summary: string;
  confidence_score: number;
  threat_insights: string[];
  recommended_action: string;
  generated_at: string;
};

export default function VendorRiskPage() {
  const orgId = "default";

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [inspectingVendor, setInspectingVendor] = useState<Vendor | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [report, setReport] = useState<InspectionReport | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

  // CRUD State
  const [showFormModal, setShowFormModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState({ name: "", risk_score: "50", status: "Warning", tech_stack: "" });
  
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredVendors = vendors.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const { items: sortedVendors, requestSort, sortConfig } = useSortableTable(filteredVendors, { key: "risk_score", direction: "desc" });
  const fetchVendors = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const savedInfra = JSON.parse(localStorage.getItem("vciso_company_infra") || '[]');
      const savedTech = JSON.parse(localStorage.getItem("vciso_company_tech") || '[]');
      const savedTools = JSON.parse(localStorage.getItem("vciso_company_tools") || '[]');
      const extractName = (arr: any[]) => arr.map((item: any) => typeof item === 'string' ? item : item?.name || 'Unknown');
      const allTargets = [...extractName(savedInfra), ...extractName(savedTech), ...extractName(savedTools)].filter(Boolean);

      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/sync?org_id=${orgId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stack_items: allTargets })
      });
      if (res.ok) {
        const data = await res.json();
        setVendors(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [orgId]);

  const handleInspect = async (vendor: Vendor) => {
    if (!orgId) return;
    setInspectingVendor(vendor);
    setReportLoading(true);
    setReport(null);
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendor.id}/inspect?org_id=${orgId}`);
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setReport(data.report);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReportLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!orgId) return;
    if (!confirm("Are you sure you want to delete this vendor?")) return;
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${id}?org_id=${orgId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setVendors(prev => prev.filter(v => v.id !== id));
      } else {
        alert("Failed to delete vendor.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openEdit = (v: Vendor) => {
    setEditingVendor(v);
    setFormData({
      name: v.name,
      risk_score: v.risk_score ? v.risk_score.toString() : "",
      status: v.status || "",
      tech_stack: v.tech_stack ? v.tech_stack.join(", ") : ""
    });
    setShowFormModal(true);
  };

  const openAdd = () => {
    setEditingVendor(null);
    setFormData({ name: "", risk_score: "", status: "", tech_stack: "" });
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    const stack = formData.tech_stack.split(",").map(s => s.trim()).filter(Boolean);
    const payload = {
      name: formData.name,
      risk_score: formData.risk_score ? parseInt(formData.risk_score) : null,
      status: formData.status || null,
      tech_stack: stack
    };

    try {
      const url = editingVendor 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${editingVendor.id}?org_id=${orgId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors?org_id=${orgId}`;
      const method = editingVendor ? "PUT" : "POST";
      
      const res = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowFormModal(false);
        fetchVendors();
      } else {
        alert("Action failed to save.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile || !orgId) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", uploadFile);
    fd.append("org_id", orgId);

    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/upload`, {
        method: "POST",
        body: fd
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Success: ${data.message}`);
        setShowUploadModal(false);
        setUploadFile(null);
        fetchVendors();
      } else {
        alert(`Upload Failed: ${data.detail || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Network error during upload.");
    } finally {
      setUploading(false);
    }
  };

  const getStackIcon = (tech: string) => {
    switch (tech.toLowerCase()) {
      case "aws": return <Cloud className="w-4 h-4 text-orange-500" />;
      case "database": return <Database className="w-4 h-4 text-blue-500" />;
      case "communication": return <Users className="w-4 h-4 text-purple-500" />;
      case "monitoring": return <Activity className="w-4 h-4 text-green-500" />;
      case "mobile": return <Smartphone className="w-4 h-4 text-gray-500" />;
      case "networking": return <Globe className="w-4 h-4 text-cyan-500" />;
      case "active_directory": return <Key className="w-4 h-4 text-blue-700" />;
      case "version_control": return <FileCode2 className="w-4 h-4 text-gray-800 dark:text-gray-200" />;
      case "ci_cd": return <Server className="w-4 h-4 text-pink-500" />;
      default: return <Server className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Safe": return "text-green-500 bg-green-500/10 border-green-500/20";
      case "Warning": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
      case "Critical": return "text-red-500 bg-red-500/10 border-red-500/20";
      default: return "text-muted-foreground bg-muted border-border";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Safe": return <CheckCircle2 className="w-4 h-4 mr-1.5" />;
      case "Warning": return <AlertTriangle className="w-4 h-4 mr-1.5" />;
      case "Critical": return <AlertCircle className="w-4 h-4 mr-1.5" />;
      default: return null;
    }
  };

  return (
    <div className="flex-1 overflow-hidden bg-background flex">
      {/* Main Content Area */}
      <div className={cn("flex-1 overflow-y-auto p-4 md:p-8 transition-all duration-300", inspectingVendor ? "md:mr-96" : "")}>
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                <Building2 className="w-8 h-8 text-primary" />
                Vendor Risk Management
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Track third-party supply chain risk, map partner technology stacks, and run AI threat predictive inspections.
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row flex-wrap items-start md:items-center justify-end gap-4 relative w-full xl:w-auto">
              <div className="flex flex-wrap gap-2 w-full md:w-auto shrink-0">
                 <button onClick={openAdd} className="flex-1 shrink-0 md:flex-none flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition shadow-sm">
                    <Plus className="w-4 h-4" /> Add Vendor
                 </button>
                 <button onClick={() => setShowUploadModal(true)} className="flex-1 shrink-0 md:flex-none flex items-center justify-center gap-2 border border-border text-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-muted transition shadow-sm bg-card">
                    <Upload className="w-4 h-4" /> Bulk Upload Matrix
                 </button>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  autoComplete="off"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSearchSuggestions(true); }}
                  onFocus={() => setShowSearchSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
                  placeholder="Search vendors..." 
                  className="pl-9 pr-4 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary w-full"
                />
              </div>
            </div>
          </div>

          {loading ? (
             <div className="h-64 flex items-center justify-center">
               <span className="animate-pulse text-muted-foreground font-medium">Synchronizing vendor ecosystem...</span>
             </div>
          ) : vendors.length === 0 ? (
             <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center">
                <Building2 className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-lg font-bold text-foreground mb-1">No Vendors Found</h3>
                <p className="text-muted-foreground text-sm max-w-sm mb-6">Upload a structured roster or manually provision your key third-party integrations to begin mapping supply chain risks securely.</p>
                <div className="flex gap-3">
                   <button onClick={openAdd} className="bg-primary text-primary-foreground px-5 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition shadow-sm">Add Vendor</button>
                   <button onClick={() => setShowUploadModal(true)} className="bg-muted text-foreground border border-border px-5 py-2 rounded-md font-medium text-sm hover:bg-muted/80 transition">Bulk Upload</button>
                </div>
             </div>
          ) : (
             <div className="bg-card border border-border rounded-xl shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <SortableHeader label="Vendor Name" sortKey="name" currentSort={sortConfig} requestSort={requestSort} className="py-4 px-6 text-sm" />
                      <SortableHeader label="Status" sortKey="status" currentSort={sortConfig} requestSort={requestSort} className="py-4 px-6 text-sm" />
                      <SortableHeader label="Risk Score" sortKey="risk_score" currentSort={sortConfig} requestSort={requestSort} className="py-4 px-6 text-sm" />
                      <SortableHeader label="Tech Stack Mapping" sortKey="tech_stack" currentSort={sortConfig} requestSort={requestSort} className="py-4 px-6 text-sm" />
                      <SortableHeader label="Last Assessment" sortKey="last_assessment" currentSort={sortConfig} requestSort={requestSort} className="py-4 px-6 text-sm" />
                      <th className="py-4 px-6 font-medium text-sm text-muted-foreground text-right relative min-w-[160px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sortedVendors.map(vendor => (
                      <tr key={vendor.id} className="hover:bg-muted/10 transition-colors group">
                        <td className="py-4 px-6 font-medium text-foreground flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                              {vendor.name.substring(0,2).toUpperCase()}
                           </div>
                           <span className="truncate">{vendor.name}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border", getStatusColor(vendor.status))}>
                             {getStatusIcon(vendor.status)}
                             {vendor.status}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                           <div className="flex items-center gap-2">
                              <span className={cn("font-mono text-sm", vendor.risk_score < 50 ? "text-red-500" : vendor.risk_score < 80 ? "text-yellow-500" : "text-green-500")}>
                                {vendor.risk_score}
                              </span>
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                                 <div 
                                   className={cn("h-full rounded-full", vendor.risk_score < 50 ? "bg-red-500" : vendor.risk_score < 80 ? "bg-yellow-500" : "bg-green-500")}
                                   style={{ width: `${Math.min(vendor.risk_score, 100)}%` }}
                                 />
                              </div>
                           </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5 flex-wrap w-48">
                             {vendor.tech_stack?.length > 0 ? vendor.tech_stack.map(tech => (
                                <div key={tech} className="p-1.5 bg-muted rounded-md border border-border/50 hover:bg-background transition-colors" title={tech}>
                                   {getStackIcon(tech)}
                                </div>
                             )) : <span className="text-xs text-muted-foreground italic">Unmapped</span>}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-muted-foreground font-mono">
                          {formatDate(vendor.last_assessment)}
                        </td>
                        <td className="py-4 px-6 text-right w-64 min-w-[240px]">
                           <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={() => handleInspect(vendor)}
                                className="px-2 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-500 hover:bg-emerald-500/10 rounded-md transition-colors inline-flex items-center gap-1 flex-1 justify-center whitespace-nowrap"
                                title="Run Predictive Scan"
                              >
                                <Activity className="w-3.5 h-3.5" /> Inspect
                              </button>
                              <button 
                                onClick={() => openEdit(vendor)}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                                title="Edit Vendor"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete(vendor.id)}
                                className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                                title="Delete Vendor"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          )}
        </div>
      </div>

      {/* AI Inspection Slide-Over Panel */}
      <div className={cn(
         "fixed top-0 right-0 h-full w-full md:w-96 bg-card border-l border-border shadow-2xl transition-transform duration-300 transform z-50 flex flex-col",
         inspectingVendor ? "translate-x-0" : "translate-x-full"
      )}>
         <div className="p-6 border-b border-border bg-muted/20 flex justify-between items-start">
            <div>
               <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground">AI Inspection Hub</span>
               </div>
               <h2 className="text-xl font-bold text-foreground">{inspectingVendor?.name}</h2>
            </div>
            <button 
              onClick={() => setInspectingVendor(null)}
              className="p-1 text-muted-foreground hover:bg-muted rounded-md transition-colors"
            >
               Close
            </button>
         </div>

         <div className="flex-1 overflow-y-auto p-6">
            {reportLoading ? (
               <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                  <p className="text-sm font-medium animate-pulse text-muted-foreground text-center">
                     Predictive AI is analyzing {inspectingVendor?.name}'s tech stack against current global threat streams...
                  </p>
               </div>
            ) : report ? (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                     <h3 className="font-bold text-primary mb-2 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> {report.summary}
                     </h3>
                     <p className="text-sm text-foreground/80 leading-relaxed">
                        Based on the identified technology stack ({inspectingVendor?.tech_stack.length ? inspectingVendor?.tech_stack.join(", ") : "Unknown"}), our models have generated the following predictive assessment.
                     </p>
                     <div className="mt-4 pt-4 border-t border-primary/10 flex justify-between items-center">
                        <span className="text-xs text-muted-foreground font-mono">Confidence Level</span>
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{report.confidence_score}%</span>
                     </div>
                  </div>

                  <div>
                     <h4 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">Threat Insights</h4>
                     <ul className="space-y-3">
                        {report.threat_insights.map((insight, i) => (
                           <li key={i} className="flex gap-3 text-sm p-3 bg-muted/30 border border-border rounded-lg">
                              <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                              <span className="text-muted-foreground">{insight}</span>
                           </li>
                        ))}
                     </ul>
                  </div>

                  <div>
                     <h4 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">AI Recommended Action</h4>
                     <div className={cn(
                        "p-4 rounded-lg border text-sm font-medium",
                        inspectingVendor?.status === "Critical" ? "bg-red-500/10 border-red-500/30 text-red-500" : "bg-blue-500/10 border-blue-500/30 text-blue-500"
                     )}>
                        {report.recommended_action}
                     </div>
                  </div>
                  
                  <div className="text-[10px] text-muted-foreground font-mono text-center pt-8 border-t border-border">
                     Report generated: {formatDate(report.generated_at)}
                  </div>
               </div>
            ) : (
               <div className="flex h-full items-center justify-center text-sm text-muted-foreground text-center px-4">
                  Select a vendor and initiate an inspection to generate an AI threat report.
               </div>
            )}
         </div>
      </div>

      {/* Manual CRUD Form Modal */}
      {showFormModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in p-4">
            <div className="bg-card w-full max-w-lg rounded-xl border border-border shadow-2xl flex flex-col overflow-hidden">
               <div className="p-6 border-b border-border">
                  <h3 className="text-lg font-bold text-foreground">{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Configure individual vendor metadata constraints manually.</p>
               </div>
               <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-foreground mb-1">Vendor Name</label>
                     <input required autoFocus type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. AWS Europe" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Risk Score (0-100)</label>
                        <input type="number" min="0" max="100" value={formData.risk_score} onChange={e => setFormData({...formData, risk_score: e.target.value})} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Auto-assign" />
                        <p className="text-[11px] text-muted-foreground mt-1">Leave blank to let AI calculate score.</p>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Assessment Status</label>
                        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                           <option value="">Auto-resolve</option>
                           <option value="Safe">Safe</option>
                           <option value="Warning">Warning</option>
                           <option value="Critical">Critical</option>
                        </select>
                        <p className="text-[11px] text-muted-foreground mt-1">System resolves from score if blank.</p>
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-foreground mb-2">Tech Stack Integrations</label>
                     <div className="flex flex-wrap gap-2 mb-3">
                        {["aws", "database", "networking", "monitoring", "communication", "ci_cd", "mobile", "active_directory", "version_control"].map(tech => {
                           const currentStack = formData.tech_stack.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
                           const isSelected = currentStack.includes(tech);
                           return (
                              <button
                                 key={tech}
                                 type="button"
                                 onClick={() => {
                                    let current = formData.tech_stack.split(",").map(s => s.trim()).filter(Boolean);
                                    if (isSelected) {
                                       current = current.filter(t => t.toLowerCase() !== tech);
                                    } else {
                                       current.push(tech);
                                    }
                                    setFormData({...formData, tech_stack: current.join(", ")});
                                 }}
                                 className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5",
                                    isSelected 
                                       ? "bg-primary/10 border-primary text-primary" 
                                       : "bg-background border-border text-muted-foreground hover:border-muted-foreground hover:bg-muted/50"
                                 )}
                              >
                                {tech.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </button>
                           );
                        })}
                        <button
                           type="button"
                           onClick={() => document.getElementById('custom-tech-input')?.focus()}
                           className="px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                           + Custom / Other
                        </button>
                     </div>
                     <input 
                        id="custom-tech-input"
                        type="text" 
                        value={formData.tech_stack} 
                        onChange={e => setFormData({...formData, tech_stack: e.target.value})} 
                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
                        placeholder="Type custom integrations (comma separated)..." 
                     />
                  </div>

                  <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
                     <button type="button" onClick={() => setShowFormModal(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md transition">Cancel</button>
                     <button type="submit" className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition">Save Vendor</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* AI Bulk Upload Modal */}
      {showUploadModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in p-4">
            <div className="bg-card w-full max-w-xl rounded-xl border border-border shadow-2xl overflow-hidden flex flex-col">
               <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                  <div>
                     <h3 className="text-lg font-bold text-foreground flex items-center gap-2"><Upload className="w-5 h-5 text-primary" /> Multi-modal Bulk Uploading</h3>
                     <p className="text-sm text-muted-foreground mt-1">Upload unstructured documents. Gemini automatically maps arrays via Vision.</p>
                  </div>
                  <button onClick={() => { setShowUploadModal(false); setUploadFile(null); }} className="p-1 hover:bg-muted rounded-md text-muted-foreground">Close</button>
               </div>

               <div className="p-8">
                  <div 
                     onDragOver={e => e.preventDefault()} 
                     onDrop={handleFileDrop}
                     className={cn(
                        "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors",
                        uploadFile ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"
                     )}
                  >
                     {uploadFile ? (
                        <>
                           <FileCode2 className="w-12 h-12 text-primary mb-4" />
                           <h4 className="font-bold text-foreground">{uploadFile.name}</h4>
                           <p className="text-sm text-muted-foreground mt-1 mb-4">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                           <button onClick={() => setUploadFile(null)} className="text-xs font-semibold text-red-500 hover:text-red-400">Remove Document</button>
                        </>
                     ) : (
                        <>
                           <Upload className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                           <h4 className="font-bold text-foreground">Drag & Drop Documents Here</h4>
                           <p className="text-sm text-muted-foreground mt-1 mb-6">Supported Formats: PDF, XLSX, CSV, TXT ensuring robust parsing.</p>
                           <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-muted hover:bg-border text-sm font-medium rounded-md transition">
                              Browse Computer
                           </button>
                           <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.txt,.csv,.xlsx" onChange={e => {
                              if (e.target.files && e.target.files[0]) setUploadFile(e.target.files[0]);
                           }} />
                        </>
                     )}
                  </div>

                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-md p-3 mt-6 flex items-start gap-3">
                     <Shield className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                     <div className="text-xs text-orange-600 dark:text-orange-400">
                        <span className="font-bold block mb-1">Active Malware Interception Enabled</span>
                        Every uploaded file executes a synchronous intercept pipeline preventing `.exe` / EICAR payloads from polluting database memory before AI extraction completes.
                     </div>
                  </div>
               </div>

               <div className="p-4 border-t border-border bg-muted/20 flex justify-end">
                  <button 
                     onClick={handleFileUpload} 
                     disabled={!uploadFile || uploading}
                     className="bg-primary text-primary-foreground disabled:opacity-50 px-6 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition hover:bg-primary/90 shadow-sm"
                  >
                     {uploading ? (
                        <><div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent animate-spin rounded-full"></div> AI Ingesting...</>
                     ) : (
                        <><Server className="w-4 h-4" /> Process & Bulk Add Providers</>
                     )}
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
