"use client";

import { useState, useEffect } from "react";
import { Activity, Power, RefreshCcw, Search, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/api";

interface Workflow {
  id: string;
  name: string;
  status: string;
  last_run: string | null;
  enabled: boolean;
  description: string;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchWorkflows = async () => {
    try {
      const res = await fetchWithAuth(`${"https://vciso-backend-7gkk7pkdya-uc.a.run.app"}/api/v1/workflows`);
      const data = await res.json();
      setWorkflows(data);
    } catch (e) {
      toast.error("Failed to load automation workflows.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
    const interval = setInterval(fetchWorkflows, 5000); // Polling for status updates
    return () => clearInterval(interval);
  }, []);

  const handleToggle = async (id: string) => {
    try {
      const res = await fetchWithAuth(`${"https://vciso-backend-7gkk7pkdya-uc.a.run.app"}/api/v1/workflows/${id}/toggle`, { method: "POST" });
      if (res.ok) {
        toast.success("Workflow toggled successfully");
        fetchWorkflows();
      }
    } catch (e) {
      toast.error("Failed to toggle workflow");
    }
  };

  const handleRun = async (id: string) => {
    try {
      const res = await fetchWithAuth(`${"https://vciso-backend-7gkk7pkdya-uc.a.run.app"}/api/v1/workflows/${id}/run`, { method: "POST" });
      if (res.ok) {
        toast.success("Workflow sync started");
        fetchWorkflows();
      } else {
        const errorData = await res.json();
        if (errorData.status === "already_running") {
           toast.info("Workflow is already running");
        }
      }
    } catch (e) {
      toast.error("Failed to start workflow");
    }
  };

  const filtered = workflows.filter(w => w.name.toLowerCase().includes(search.toLowerCase()) || w.description.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex-1 overflow-y-auto p-8 w-full bg-[#0a0f18] min-h-[calc(100vh-64px)]">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-end">
          <div>
             <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-100">
                <Activity className="h-8 w-8 text-indigo-400" />
                Data Ingestion Workflows
             </h1>
             <p className="text-slate-400 mt-2">
                Manage and monitor the automated connectors syncing data from your cloud and third-party security platforms.
             </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full max-w-md bg-[#121927] border border-slate-800 rounded-md px-3 py-2">
           <Search className="h-4 w-4 text-slate-400" />
           <Input 
             className="bg-transparent border-none focus-visible:ring-0 text-slate-200 placeholder:text-slate-500 shadow-none h-auto p-0"
             placeholder="Search workflows..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
           />
        </div>

        {loading ? (
           <div className="text-center text-slate-500 py-12 animate-pulse">Loading engine configurations...</div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {filtered.map(workflow => (
               <Card key={workflow.id} className="bg-[#121927] border-slate-800 shadow-xl overflow-hidden shadow-black/40 flex flex-col">
                 <div className="p-1 h-1 w-full bg-gradient-to-r from-indigo-500/50 via-purple-500/50 to-emerald-500/50 opacity-50" />
                 <CardHeader className="pb-3">
                   <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-bold text-slate-200">{workflow.name}</CardTitle>
                      <button 
                        onClick={() => handleToggle(workflow.id)}
                        className={`p-1.5 rounded-full transition-colors ${workflow.enabled ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                      >
                         <Power className="h-4 w-4" />
                      </button>
                   </div>
                   <CardDescription className="text-xs text-slate-400 line-clamp-2 mt-1 min-h-[32px]">
                      {workflow.description}
                   </CardDescription>
                 </CardHeader>
                 <CardContent className="flex-1 flex flex-col justify-end pt-2">
                   <div className="flex justify-between items-center mb-4 text-xs font-mono">
                      <span className="text-slate-500">Status:</span>
                      <span className={`px-2 py-0.5 rounded ${workflow.status === 'running' ? 'bg-indigo-500/20 text-indigo-300 animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                        {workflow.status.toUpperCase()}
                      </span>
                   </div>
                   <div className="flex justify-between items-center mb-4 text-xs font-mono text-slate-500">
                      <span>Last Sync:</span>
                      <span>{workflow.last_run ? new Date(workflow.last_run).toLocaleTimeString() : 'Never'}</span>
                   </div>
                   <Button 
                     onClick={() => handleRun(workflow.id)} 
                     disabled={!workflow.enabled || workflow.status === 'running'}
                     variant={workflow.status === 'running' ? 'outline' : 'default'}
                     className={`w-full font-bold shadow-md ${workflow.status === 'running' ? 'border-indigo-500/30 text-indigo-300 bg-transparent' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/50'}`}
                   >
                     {workflow.status === 'running' ? (
                        <><RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> Syncing...</>
                     ) : (
                        <><RefreshCcw className="mr-2 h-4 w-4" /> Trigger Sync</>
                     )}
                   </Button>
                 </CardContent>
               </Card>
             ))}
           </div>
        )}
      </div>
    </div>
  );
}
