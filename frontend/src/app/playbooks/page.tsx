"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Zap, AlertTriangle, Play, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/api";

interface Playbook {
  id: string;
  name: string;
  description: string;
  risk_level: "High" | "Medium" | "Low";
  category: string;
}

export default function PlaybooksPage() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);

  // Form State
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [target, setTarget] = useState("");
  const [reason, setReason] = useState("");

  const fetchPlaybooks = async () => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/playbooks`);
      const data = await res.json();
      setPlaybooks(data.playbooks || []);
    } catch (e) {
      toast.error("Failed to load SOAR playbooks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaybooks();
  }, []);

  const handleExecute = async () => {
    if (!selectedPlaybook || !target) {
      toast.error("Execution Aborted", { description: "You must specify a target identifier." });
      return;
    }
    setExecuting(selectedPlaybook.id);

    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/playbooks/execute`, {
        method: "POST",
        body: JSON.stringify({
          action_name: selectedPlaybook.name,
          target: target,
          parameters: { reason }
        }),
      });
      if (res.ok) {
        toast.success("Playbook Deployed", { description: `Successfully started SOAR action: ${selectedPlaybook.name}` });
        setSelectedPlaybook(null);
        setTarget("");
        setReason("");
      } else {
        toast.error("Execution Error");
      }
    } catch (e) {
      toast.error("API error during playbook execution.");
    } finally {
      setExecuting(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 w-full bg-[#0a0f18] min-h-[calc(100vh-64px)]">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
           <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-100">
              <Zap className="h-8 w-8 text-rose-500" />
              SOAR Automated Playbooks
           </h1>
           <p className="text-slate-400 mt-2">
              Execute pre-configured incident response and containment actions instantly across your connected infrastructure.
           </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
           {/* Left Column: Playbook Grid */}
           <div className="xl:col-span-2 space-y-4">
              <h3 className="text-xl font-semibold text-slate-200 mb-4 border-b border-slate-800 pb-2">Available Actions</h3>
              {loading ? (
                <div className="text-slate-500 animate-pulse text-sm">Loading playbooks...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {playbooks.map(pb => (
                    <Card
                      key={pb.id}
                      onClick={() => setSelectedPlaybook(pb)}
                      className={`cursor-pointer transition-all border ${selectedPlaybook?.id === pb.id ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-[#121927] border-slate-800 hover:border-slate-600'}`}
                    >
                      <CardHeader className="p-4">
                        <div className="flex justify-between items-start mb-2">
                           <span className="text-xs font-mono font-bold text-slate-400 tracking-wider uppercase">{pb.category}</span>
                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${pb.risk_level === 'High' ? 'bg-rose-500/20 text-rose-400' : pb.risk_level === 'Medium' ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                             {pb.risk_level} IMPACT
                           </span>
                        </div>
                        <CardTitle className="text-base text-slate-100">{pb.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <CardDescription className="text-xs text-slate-400 leading-relaxed">
                          {pb.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
           </div>

           {/* Right Column: Execution Form */}
           <div className="xl:col-span-1">
              <div className="sticky top-8">
                 <Card className="bg-[#121927] border border-rose-900/50 shadow-2xl shadow-rose-900/10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-50" />
                    <CardHeader>
                       <CardTitle className="flex items-center gap-2 text-rose-100">
                         <AlertTriangle className="h-5 w-5 text-rose-500" />
                         Action Deployment
                       </CardTitle>
                       <CardDescription className="text-slate-400">
                         {selectedPlaybook ? `Configure parameters for ${selectedPlaybook.name}` : "Select a playbook to deploy"}
                       </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       {selectedPlaybook ? (
                         <>
                            <div className="space-y-2">
                               <Label className="text-slate-300 text-xs font-bold uppercase tracking-wider">Target Identifier</Label>
                               <Input 
                                 placeholder="e.g., 10.0.0.42 or user@domain.com" 
                                 value={target}
                                 onChange={e => setTarget(e.target.value)}
                                 className="bg-[#0a0f18] border-slate-800 focus-visible:ring-rose-500/50 font-mono text-sm"
                               />
                            </div>
                            <div className="space-y-2">
                               <Label className="text-slate-300 text-xs font-bold uppercase tracking-wider">Justification (Optional)</Label>
                               <Input 
                                 placeholder="Incident ID or reasoning..." 
                                 value={reason}
                                 onChange={e => setReason(e.target.value)}
                                 className="bg-[#0a0f18] border-slate-800 focus-visible:ring-rose-500/50"
                               />
                            </div>
                            
                            <div className="pt-4">
                               <Button 
                                 onClick={handleExecute}
                                 disabled={!target || executing === selectedPlaybook.id}
                                 className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg shadow-rose-900/50 flex gap-2"
                               >
                                  {executing === selectedPlaybook.id ? (
                                    <span className="animate-pulse">Deploying Sequence...</span>
                                  ) : (
                                    <><Play className="h-4 w-4" /> FIRE PLAYBOOK</>
                                  )}
                               </Button>
                            </div>
                         </>
                       ) : (
                         <div className="py-12 flex flex-col items-center text-center opacity-50">
                            <CheckCircle2 className="h-12 w-12 text-slate-500 mb-4" />
                            <p className="text-sm text-slate-400">All systems green.</p>
                            <p className="text-xs text-slate-500 mt-1">Select an action on the left to initiate containment protocols.</p>
                         </div>
                       )}
                    </CardContent>
                 </Card>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
