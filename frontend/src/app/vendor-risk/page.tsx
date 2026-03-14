"use client";
import { fetchWithAuth } from "@/lib/api";
import { useState, useEffect } from "react";
import { Building2, Search, AlertCircle, CheckCircle2, AlertTriangle, ChevronRight, Server, Shield, Activity, Users, Database, Globe, Smartphone, Cloud, Key, FileCode2 } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

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
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [inspectingVendor, setInspectingVendor] = useState<Vendor | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [report, setReport] = useState<InspectionReport | null>(null);

  useEffect(() => {
    async function fetchVendors() {
      try {
        const res = await fetchWithAuth("http://localhost:8000/api/v1/vendors");
        const data = await res.json();
        setVendors(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchVendors();
  }, []);

  const handleInspect = async (vendor: Vendor) => {
    setInspectingVendor(vendor);
    setReportLoading(true);
    setReport(null);
    try {
      const res = await fetchWithAuth(`http://localhost:8000/api/v1/vendors/${vendor.id}/inspect`);
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

  const getStackIcon = (tech: string) => {
    switch (tech) {
      case "aws": return <Cloud className="w-4 h-4 text-orange-500" />;
      case "database": return <Database className="w-4 h-4 text-blue-500" />;
      case "communication": return <Users className="w-4 h-4 text-purple-500" />;
      case "monitoring": return <Activity className="w-4 h-4 text-green-500" />;
      case "mobile": return <Smartphone className="w-4 h-4 text-gray-500" />;
      case "networking": return <Globe className="w-4 h-4 text-cyan-500" />;
      case "active_directory": return <Key className="w-4 h-4 text-blue-700" />;
      case "version_control": return <FileCode2 className="w-4 h-4 text-gray-800 dark:text-gray-200" />;
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
      <div className={cn("flex-1 overflow-y-auto p-8 transition-all duration-300", inspectingVendor ? "mr-96" : "")}>
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                <Building2 className="w-8 h-8 text-primary" />
                Vendor Risk Management
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Track third-party supply chain risk, map partner technology stacks, and run AI threat predictive inspections.
              </p>
            </div>
            <div className="flex gap-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search vendors..." 
                className="pl-9 pr-4 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary w-64"
              />
            </div>
          </div>

          {loading ? (
             <div className="h-64 flex items-center justify-center">
               <span className="animate-pulse text-muted-foreground font-medium">Loading vendor ecosystem...</span>
             </div>
          ) : (
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="border-b border-border bg-muted/30">
                     <th className="py-4 px-6 font-medium text-sm text-muted-foreground">Vendor Name</th>
                     <th className="py-4 px-6 font-medium text-sm text-muted-foreground">Status</th>
                     <th className="py-4 px-6 font-medium text-sm text-muted-foreground">Risk Score</th>
                     <th className="py-4 px-6 font-medium text-sm text-muted-foreground">Tech Stack Mapping</th>
                     <th className="py-4 px-6 font-medium text-sm text-muted-foreground">Last Assessment</th>
                     <th className="py-4 px-6 font-medium text-sm text-muted-foreground text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-border">
                   {vendors.map(vendor => (
                     <tr key={vendor.id} className="hover:bg-muted/10 transition-colors group">
                       <td className="py-4 px-6 font-medium text-foreground flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                             {vendor.name.substring(0,2).toUpperCase()}
                          </div>
                          {vendor.name}
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
                             <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={cn("h-full rounded-full", vendor.risk_score < 50 ? "bg-red-500" : vendor.risk_score < 80 ? "bg-yellow-500" : "bg-green-500")}
                                  style={{ width: `${vendor.risk_score}%` }}
                                />
                             </div>
                          </div>
                       </td>
                       <td className="py-4 px-6">
                         <div className="flex items-center gap-1.5 flex-wrap">
                            {vendor.tech_stack.map(tech => (
                               <div key={tech} className="p-1.5 bg-muted rounded-md border border-border/50 group-hover:bg-background transition-colors" title={tech}>
                                  {getStackIcon(tech)}
                               </div>
                            ))}
                         </div>
                       </td>
                       <td className="py-4 px-6 text-sm text-muted-foreground font-mono">
                         {formatDate(vendor.last_assessment)}
                       </td>
                       <td className="py-4 px-6 text-right">
                         <button 
                           onClick={() => handleInspect(vendor)}
                           className="px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-md transition-colors border border-transparent hover:border-primary/20 inline-flex items-center gap-1.5"
                         >
                           Inspect Partner <ChevronRight className="w-3 h-3" />
                         </button>
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
         "fixed top-0 right-0 h-full w-96 bg-card border-l border-border shadow-2xl transition-transform duration-300 transform z-20 flex flex-col",
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
                        Based on the identified technology stack ({inspectingVendor?.tech_stack.join(", ")}), our models have generated the following predictive assessment.
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
    </div>
  );
}
