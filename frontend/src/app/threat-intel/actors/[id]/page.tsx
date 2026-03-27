"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, UserX, Skull, ShieldAlert, Activity, AlertTriangle, Crosshair, Target } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

export default function ThreatActorProfile() {
  const params = useParams();
  const router = useRouter();
  const actorId = params.id as string;
  
  const [actor, setActor] = useState<any>(null);
  const [indicators, setIndicators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all actors and find the one that matches
        const actorsRes = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/threat-intel/actors?org_id=default&limit=100`);
        const actorsData = await actorsRes.json();
        const found = actorsData.items?.find((a: any) => a.id === actorId);
        if (found) {
          setActor(found);
        }

        // Fetch specific indicators for this actor
        const indRes = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/threat-intel/indicators?org_id=default&threat_actor_id=${actorId}`);
        const indData = await indRes.json();
        setIndicators(indData.items || []);

      } catch (err) {
        console.error("Failed to load actor profile:", err);
      } finally {
        setLoading(false);
      }
    };

    if (actorId) {
      fetchData();
    }
  }, [actorId]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-muted-foreground animate-pulse p-8">
        <Activity className="w-10 h-10 mb-4 animate-spin text-red-500/50" /> 
        <span className="font-mono text-xs uppercase tracking-widest text-red-500/70">Decrypting Classified Dossier...</span>
      </div>
    );
  }

  if (!actor) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-foreground p-8">
        <Skull className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">Subject Not Found</h2>
        <p className="text-muted-foreground mb-6 text-sm">The requested threat actor profile has been expunged or does not exist.</p>
        <button onClick={() => router.push('/threat-intel')} className="px-4 py-2 bg-muted hover:bg-muted/80 rounded transition-colors text-xs uppercase font-bold tracking-wider">Return to Intel Hub</button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-8 min-h-full">
      <div className="max-w-7xl mx-auto">
        
        {/* Dossier Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 border-b border-red-900/40 pb-6">
          <div className="flex items-start sm:items-center gap-4">
            <button 
              onClick={() => router.push('/threat-intel')}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors text-slate-400 hover:text-white shrink-0 mt-1 sm:mt-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-red-500 text-[10px] md:text-xs font-mono font-bold tracking-[0.2em] uppercase mb-1">
                <ShieldAlert className="w-3.5 h-3.5" /> 
                Classified Dossier /// Eyes Only
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight flex flex-wrap items-center gap-3">
                Subject: {actor.name}
                {actor.active && (
                  <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] md:text-xs uppercase font-black tracking-widest rounded shadow-sm">Active Threat</span>
                )}
              </h1>
            </div>
          </div>
          <div className="hidden lg:flex flex-col items-end">
             <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Network Designation ID:</span>
             <span className="text-sm font-mono text-slate-400">{actor.id.split('-')[0]}-X-{actor.id.split('-')[1]}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Rap Sheet Vitals */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Mugshot Polaroids */}
            <div className="bg-slate-900 shadow-xl border border-slate-800 p-5 rounded-sm lg:rotate-[-2deg] relative hover:rotate-0 transition-transform duration-500 mx-auto max-w-sm lg:max-w-none">
               <div className="absolute top-2 right-4 flex gap-1 transform rotate-[8deg]">
                 <div className="w-4 h-12 bg-red-900/20 mix-blend-multiply tape-strip absolute -top-2"></div>
               </div>
               <div className="aspect-[4/5] bg-slate-950 border border-slate-800 flex items-center justify-center mb-5 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800/50 to-slate-950 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                 
                 {/* Mugshot Grid lines effect */}
                 <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDM5LjVoNDBNMzkuNSAwdi00MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] opacity-50"></div>
                 <div className="absolute inset-x-0 top-1/2 h-px bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                 <div className="absolute inset-y-0 left-1/2 w-px bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>

                 <UserX className="w-40 h-40 text-slate-800 relative z-10" />
                 
                 <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20">
                   <div className="bg-slate-950/80 backdrop-blur-sm border border-slate-700 font-mono text-slate-400 text-[10px] px-4 py-1.5 tracking-[0.3em] font-bold">
                     FILE: {actor.id.split('-')[4] || 'UNKNOWN'}
                   </div>
                 </div>
               </div>

               <div className="space-y-5">
                 <h2 className="text-2xl font-black text-white uppercase tracking-widest text-center">{actor.name}</h2>
                 <div className="w-full h-px bg-slate-800"></div>
                 <div className="flex flex-col gap-4 text-xs">
                    <div className="flex flex-col">
                      <span className="text-slate-500 font-mono text-[10px] uppercase tracking-widest mb-1">Class / Sophistication</span>
                      <span className={cn(
                        "font-bold uppercase tracking-widest text-sm",
                        actor.sophistication === "nation_state" ? "text-red-400" :
                        actor.sophistication === "advanced" ? "text-orange-400" :
                        "text-yellow-400"
                      )}>{actor.sophistication.replace("_", " ")}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 font-mono text-[10px] uppercase tracking-widest mb-1">Target Relevance</span>
                      <span className={cn(
                        "font-bold uppercase tracking-widest text-sm",
                        actor.relevance_score === "High" ? "text-red-500" : "text-amber-500"
                      )}>{actor.relevance_score}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-slate-500 font-mono text-[10px] uppercase tracking-widest mb-1">First Observed</span>
                        <span className="text-slate-300 font-medium">{actor.first_seen ? formatDate(actor.first_seen) : 'Unknown'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 font-mono text-[10px] uppercase tracking-widest mb-1">Current Status</span>
                        <span className={cn("font-bold uppercase tracking-widest", actor.active ? "text-red-500" : "text-slate-400")}>{actor.active ? 'At Large' : 'Dormant'}</span>
                      </div>
                    </div>
                 </div>
               </div>
            </div>

            {/* Motives & Intel Summary */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-bl-full pointer-events-none"></div>
               <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <Target className="w-3.5 h-3.5" /> Analyst Synopsis
               </h3>
               <p className="text-sm text-slate-300 leading-relaxed font-medium">
                 {actor.description || 'No detailed abstract available.'}
               </p>
            </div>
            
          </div>

          {/* Right Column: Rap Sheet Details */}
          <div className="lg:col-span-8 space-y-6">
             
             {/* The "Charges" (Relevance Reasons) */}
             <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 lg:p-8 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 rounded-bl-full pointer-events-none"></div>
               <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-3 pb-3 border-b border-slate-800">
                 <AlertTriangle className="w-5 h-5 text-red-500" /> Warrants & Risk Factors
               </h3>
               {actor.relevance_reasons && actor.relevance_reasons.length > 0 ? (
                 <ul className="space-y-4">
                   {actor.relevance_reasons.map((reason: string, i: number) => (
                     <li key={i} className="flex items-start gap-4 bg-slate-950 border border-slate-800 rounded p-4 text-sm text-slate-200">
                        <Crosshair className="w-5 h-5 text-red-500/70 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{reason}</span>
                     </li>
                   ))}
                 </ul>
               ) : (
                 <p className="text-sm text-slate-500 p-6 bg-slate-950 border border-dashed border-slate-800 rounded italic text-center font-mono">
                   No specific organizational warrants logged for this entity.
                 </p>
               )}
             </div>

             {/* Modus Operandi (TTPs) */}
             <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 lg:p-8 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-bl-full pointer-events-none"></div>
               <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-3 pb-3 border-b border-slate-800">
                 <Activity className="w-5 h-5 text-blue-500" /> Modus Operandi
               </h3>
               {actor.mitre_attack_techniques && actor.mitre_attack_techniques.length > 0 ? (
                 <div className="flex flex-wrap gap-3">
                   {actor.mitre_attack_techniques.map((ttp: any, i: number) => (
                      <div key={i} className="flex flex-col gap-1.5 p-4 bg-slate-950 border border-slate-800 rounded-md hover:bg-slate-800 transition-colors w-full sm:w-[calc(50%-0.75rem)] text-sm group cursor-help relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-800 group-hover:bg-blue-500 transition-colors"></div>
                        <div className="flex justify-between items-center pl-2">
                          <span className="font-mono font-bold text-blue-400 group-hover:text-blue-300 transition-colors">{ttp.id}</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">{ttp.tactic}</span>
                        </div>
                        <span className="text-slate-300 pl-2 mt-1">{ttp.name}</span>
                      </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-sm text-slate-500 p-6 bg-slate-950 border border-dashed border-slate-800 rounded flex flex-col items-center justify-center gap-3">
                   <Target className="w-8 h-8 text-slate-700/50" />
                   <p className="italic text-center font-mono">TTP evidence log unavailable or highly classified.</p>
                 </div>
               )}
             </div>

             {/* Evidence Log (Indicators) */}
             <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 lg:p-8 shadow-sm">
               <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-3 pb-3 border-b border-slate-800">
                 <ShieldAlert className="w-5 h-5 text-orange-500" /> Confirmed Evidence Evidence Log
               </h3>
               {indicators.length > 0 ? (
                 <div className="overflow-x-auto rounded border border-slate-800">
                   <table className="w-full text-sm text-left">
                     <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-800">
                       <tr>
                         <th className="px-5 py-4">IOC Type</th>
                         <th className="px-5 py-4">Corroborated Value</th>
                         <th className="px-5 py-4 text-center">Confidence Index</th>
                         <th className="px-5 py-4 text-right">Threat Severity</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-800/50 bg-slate-900">
                       {indicators.map((ind: any) => (
                         <tr key={ind.id} className="hover:bg-slate-800/50 transition-colors group">
                           <td className="px-5 py-4 font-mono text-[10px] tracking-widest text-slate-400 group-hover:text-slate-300">{ind.indicator_type?.toUpperCase()}</td>
                           <td className="px-5 py-4 font-mono font-bold text-slate-200">{ind.value}</td>
                           <td className="px-5 py-4">
                             <div className="flex items-center justify-center gap-3">
                               <div className="w-20 bg-slate-950 rounded-full h-1.5 shadow-inner">
                                 <div 
                                   className={cn("h-1.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]", ind.confidence >= 90 ? "bg-red-500" : ind.confidence >= 70 ? "bg-orange-500" : "bg-blue-500")}
                                   style={{ width: `${ind.confidence}%` }}
                                 ></div>
                               </div>
                               <span className="text-[10px] font-mono text-slate-400 w-8 text-right">{ind.confidence}%</span>
                             </div>
                           </td>
                           <td className="px-5 py-4 text-right">
                             <span className={cn(
                                "px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest",
                                ind.severity === "critical" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                                ind.severity === "high" ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" :
                                "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                             )}>
                               {ind.severity}
                             </span>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               ) : (
                 <p className="text-sm text-slate-500 p-6 bg-slate-950 border border-dashed border-slate-800 rounded italic text-center font-mono">
                   No specific evidence or IoCs tracked for this subject in the active monitoring window.
                 </p>
               )}
             </div>

          </div>

        </div>
      </div>
    </div>
  );
}
