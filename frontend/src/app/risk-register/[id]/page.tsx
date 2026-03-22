"use client";
import { fetchWithAuth } from "@/lib/api";
import { useEffect, useState, use } from "react";
import { ArrowLeft, AlertCircle, Save, UploadCloud, FileText, User as UserIcon, Tag, CalendarClock } from "lucide-react";
import Link from "next/link";
import { formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";

interface RiskDetail {
  id: string;
  finding_id?: string;
  title: string;
  description?: string;
  risk_level: string;
  risk_categories: string[];
  owner?: string;
  action_plan?: string;
  attachment_url?: string;
  date_entered: string;
  expiration_date?: string;
  source?: string;
}

export default function RiskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const [risk, setRisk] = useState<RiskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Editable states
  const [editLevel, setEditLevel] = useState("");
  const [editCategories, setEditCategories] = useState("");
  const [editOwner, setEditOwner] = useState("");
  const [editActionPlan, setEditActionPlan] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [editSource, setEditSource] = useState("");
  const [extendDate, setExtendDate] = useState("");
  const [extending, setExtending] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  
  const isExpired = risk?.expiration_date ? new Date(risk.expiration_date) < new Date() : false;

  useEffect(() => {
    async function fetchRisk() {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/risk-register/${unwrappedParams.id}`);
        if (!res.ok) throw new Error("Failed to fetch risk details");
        const data = await res.json();
        setRisk(data);
        
        // Initialize editable states
        setEditLevel(data.risk_level);
        setEditCategories(data.risk_categories.join(", "));
        setEditOwner(data.owner || "");
        setEditActionPlan(data.action_plan || "");
        setEditSource(data.source || "");
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchRisk();
  }, [unwrappedParams.id]);

  const handleSave = async () => {
    if (!risk) return;
    setSaving(true);
    try {
      const catsArray = editCategories.split(",").map(c => c.trim()).filter(c => c);
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/risk-register/${risk.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          risk_level: editLevel,
          risk_categories: catsArray,
          owner: editOwner,
          action_plan: editActionPlan,
          source: editSource
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setRisk(updated);
      }
    } catch (err) {
      console.error("Failed to save", err);
    } finally {
      setSaving(false);
    }
  };

  const handleExtend = async () => {
    if (!extendDate || !risk) return;
    setExtending(true);
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/risk-register/${risk.id}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_expiration: extendDate }),
      });
      if (res.ok) {
        const updated = await res.json();
        setRisk(updated);
        setShowExtendDialog(false);
        setExtendDate("");
        toast.success("Risk Acceptance Extended", { description: "The expiration boundary has been updated successfully." });
      } else {
        const err = await res.json();
        toast.error("Extension Failed", { description: err.detail });
      }
    } catch (e) {
      toast.error("Extension Failed");
    } finally {
      setExtending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !risk) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // fetchWithAuth doesn't natively support FormData without stripping Content-Type automatically,
      // so we use standard fetch here with the token, or rely on our wrapper if it handles FormData correctly.
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/risk-register/${risk.id}/attachment`, {
         method: "POST",
         headers: headers,
         body: formData
      });
      
      if (res.ok) {
         const data = await res.json();
         setRisk({ ...risk, attachment_url: data.url });
      }
    } catch (err) {
      console.error("File upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!risk) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background min-h-screen flex-col gap-4">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Risk Register Entry Not Found</h2>
        <Link href="/risk-register" className="text-primary hover:underline flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Risk Register
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <Link href="/risk-register" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Register
        </Link>

        {isExpired && (
           <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <AlertCircle className="w-8 h-8 opacity-80" />
                 <div>
                    <h3 className="font-bold text-sm">ACTION REQUIRED: Risk Acceptance Expired</h3>
                    <p className="text-xs opacity-90">This risk has passed its previously approved lifespan. You must either mitigate the underlying finding immediately or formally extend the acceptance period (Max 1 Year limit).</p>
                 </div>
              </div>
              <button 
                 onClick={() => setShowExtendDialog(!showExtendDialog)}
                 className="px-4 py-2 bg-destructive text-destructive-foreground text-xs font-bold rounded hover:bg-destructive/90 transition-colors shadow-lg shrink-0"
              >
                 Extend Acceptance
              </button>
           </div>
        )}

        {showExtendDialog && (
           <div className="bg-card border border-primary/30 p-5 rounded-lg space-y-3 shadow-lg ring-1 ring-primary/20">
              <h4 className="text-sm font-bold flex items-center gap-2"><CalendarClock className="w-5 h-5 text-primary" /> Request Formal Extension</h4>
              <p className="text-xs text-muted-foreground w-3/4">Select a new expiration date for this risk. Per corporate governance, risk extensions cannot exceed exactly 365 days from today's date.</p>
              <div className="flex items-center gap-3 mt-2">
                 <input 
                    type="date" 
                    value={extendDate}
                    onChange={(e) => setExtendDate(e.target.value)}
                    className="px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 ring-primary text-foreground"
                 />
                 <button 
                    onClick={handleExtend}
                    disabled={extending || !extendDate}
                    className="px-5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded shadow hover:bg-primary/90 transition-colors disabled:opacity-50"
                 >
                    {extending ? "Confirming..." : "Confirm Extension Boundary"}
                 </button>
                 <button 
                    onClick={() => setShowExtendDialog(false)}
                    className="px-4 py-2 text-muted-foreground text-xs font-bold hover:text-foreground transition-colors"
                 >
                    Cancel
                 </button>
              </div>
           </div>
        )}

        {/* Header Section */}
        <div className="bg-card border border-border rounded-lg p-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="space-y-2 flex-1">
             <div className="flex items-center gap-3">
               <span className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                  risk.risk_level === "critical" ? "bg-destructive/10 text-destructive border border-destructive/20" :
                  risk.risk_level === "high" ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" :
                  risk.risk_level === "medium" ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" :
                  "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                )}>
                  {risk.risk_level}
                </span>
                <span className="text-muted-foreground text-sm font-medium border-l border-border pl-3">
                   Entered: {formatDate(risk.date_entered)}
                </span>
                {risk.expiration_date && (
                   <span className={cn(
                       "text-sm font-medium border-l border-border pl-3 flex items-center gap-1.5", 
                       isExpired ? "text-destructive font-bold animate-pulse" : "text-emerald-500"
                   )}>
                      <CalendarClock className="w-4 h-4" /> Expires: {formatDate(risk.expiration_date)}
                   </span>
                )}
             </div>
             <h1 className="text-2xl font-bold text-foreground">{risk.title}</h1>
             {risk.finding_id && (
                <Link href={`/findings/${risk.finding_id}`} className="text-sm text-primary hover:underline flex items-center gap-1 mt-1">
                  View Root Finding
                </Link>
             )}
          </div>
          <div className="flex items-center gap-3 w-full xl:w-auto">
             <button 
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md shadow hover:bg-primary/90 transition-colors flex items-center gap-2"
             >
                <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
             </button>
          </div>
        </div>

        {/* Detailed Edit View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           
           {/* Left Column: Core Data & Action Plan */}
           <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                 <h3 className="text-lg font-semibold flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Risk Details</h3>
                 <p className="text-sm text-muted-foreground">{risk.description || "No specific description provided."}</p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                 <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><ArrowLeft className="w-5 h-5 text-emerald-500 rotate-180" /> Action Plan</h3>
                 </div>
                 <p className="text-xs text-muted-foreground mb-2">Outline the specific mitigation steps, compensating controls, or strategic steps planned against this risk.</p>
                 <textarea 
                    value={editActionPlan}
                    onChange={(e) => setEditActionPlan(e.target.value)}
                    className="w-full h-48 bg-background border border-border rounded-md p-3 text-sm focus:outline-none focus:ring-2 ring-primary resize-y text-foreground font-mono"
                    placeholder="Document the action plan here..."
                 />
              </div>
           </div>

           {/* Right Column: Metadata Editors */}
           <div className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-6 space-y-5">
                 
                 <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5" /> Risk Rating
                    </label>
                    <select 
                       value={editLevel}
                       onChange={(e) => setEditLevel(e.target.value)}
                       className="w-full px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 ring-primary"
                    >
                       <option value="critical">Critical</option>
                       <option value="high">High</option>
                       <option value="medium">Medium</option>
                       <option value="low">Low</option>
                    </select>
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5" /> Macro Categories
                    </label>
                    <p className="text-[10px] text-muted-foreground mb-1">Comma separated (e.g. Operational, Security)</p>
                    <input 
                       type="text" 
                       value={editCategories}
                       onChange={(e) => setEditCategories(e.target.value)}
                       className="w-full px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 ring-primary"
                       placeholder="e.g. Threat Intel, Operational Risk"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <UserIcon className="w-3.5 h-3.5" /> Assigned Owner
                    </label>
                    <input 
                       type="text" 
                       value={editOwner}
                       onChange={(e) => setEditOwner(e.target.value)}
                       className="w-full px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 ring-primary"
                       placeholder="Assign an owner..."
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" /> Source / Origin
                    </label>
                    <select 
                       value={editSource}
                       onChange={(e) => setEditSource(e.target.value)}
                       className="w-full px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 ring-primary"
                    >
                       <option value="">Select an Origin Source...</option>
                       <option value="Security Audit">Security Audit</option>
                       <option value="Penetration Test">Penetration Test</option>
                       <option value="Threat Modeler">Threat Modeler</option>
                       <option value="Automated Scanner">Automated Scanner</option>
                       <option value="Bug Bounty">Bug Bounty</option>
                       <option value="Manual Entry">Manual Entry</option>
                    </select>
                 </div>

              </div>

              {/* Attachments */}
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                 <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                   <UploadCloud className="w-4 h-4 text-primary" /> Supporting Documents
                 </h3>
                 <p className="text-xs text-muted-foreground">Upload formalized action plans, vendor analyses, or PDF evaluations backing this risk acceptance.</p>
                 
                 {risk.attachment_url && (
                    <div className="p-3 bg-accent/30 border border-border rounded flex items-center justify-between">
                       <span className="text-xs font-mono truncate mr-2">{risk.attachment_url.split('/').pop()}</span>
                       <a href={risk.attachment_url} target="_blank" rel="noreferrer" className="text-[10px] uppercase font-bold text-primary hover:underline">View</a>
                    </div>
                 )}

                 <div>
                    <input 
                       type="file" 
                       id="file_upload"
                       className="hidden"
                       onChange={handleFileUpload}
                       disabled={uploading}
                    />
                    <label 
                       htmlFor="file_upload" 
                       className={cn(
                          "flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-border rounded-md cursor-pointer transition-colors text-sm font-medium hover:border-primary/50 hover:bg-accent/30",
                          uploading ? "opacity-50 cursor-not-allowed" : ""
                       )}
                    >
                       {uploading ? "Uploading..." : "Browse Files"}
                    </label>
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}
