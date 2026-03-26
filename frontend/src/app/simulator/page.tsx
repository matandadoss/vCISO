"use client";
import { fetchWithAuth } from "@/lib/api";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { FlaskConical, Send, Bot, AlertTriangle, ShieldCheck, ShieldAlert, Zap, ArrowRight, Activity, TrendingDown, TrendingUp, Network, BookOpen, Layers, Database, Terminal, Loader2, Upload, Cpu } from "lucide-react";
import dynamic from "next/dynamic";
import { toast } from "sonner";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

export default function SimulatorPage() {
  const [query, setQuery] = useState("");
  const [simulating, setSimulating] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [simType, setSimType] = useState<"architecture" | "breach" | "pentest">("architecture");
  const [tier, setTier] = useState<string>("professional");

  const initRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    // Fetch tier
    fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/organizations/test-org`)
      .then(res => res.json())
      .then(data => {
        if (data.subscription_tier) setTier(data.subscription_tier);
      })
      .catch(err => console.error(err));

    // Only run on client after mount to prevent hydration mismatch and avoid Next.js Suspense warnings
    const params = new URLSearchParams(window.location.search);
    const qParam = params.get("q");
    if (qParam && !initRef.current) {
      initRef.current = true;
      setQuery(qParam);
      // Auto-switch to breach mode if the query looks like a breach simulation
      if (qParam.toLowerCase().includes("simulate") && (qParam.toLowerCase().includes("attack") || qParam.toLowerCase().includes("breach"))) {
          setSimType("breach");
      } else if (qParam.toLowerCase().includes("scan") || qParam.toLowerCase().includes("pentest") || qParam.toLowerCase().includes("exploit")) {
          setSimType("pentest");
      }
      runSimulation(qParam);
    }
  }, []);
  
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    // Trigger update once result is rendered to ensure canvas fits container
    if (result) {
       setTimeout(updateDimensions, 100);
    }
    return () => window.removeEventListener("resize", updateDimensions);
  }, [result]);

  const handleSimulate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    runSimulation(query);
  };

  const handleCommitFindings = async () => {
    if (!result || !result.findings) return;
    setCommitting(true);
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/simulator/findings/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.findings)
      });
      if (!res.ok) throw new Error("Failed to commit findings");
      
      toast.success("Discoveries Moved to Findings", {
        description: "Official mitigation tickets have been created."
      });
      router.push("/findings");
    } catch (err) {
      console.error(err);
      toast.error("Failed to move discoveries");
    } finally {
      setCommitting(false);
    }
  };

  const runSimulation = async (simulationQuery: string) => {
    if (!simulationQuery.trim()) return;
    
    setSimulating(true);
    setResult(null);

    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/simulator/simulate`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ query: simulationQuery })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Simulation failed", err);
    } finally {
      setSimulating(false);
    }
  };



  const getNodeColor = (node: any) => {
    switch (node.status) {
      case "critical": return "#ef4444"; 
      case "vulnerable": return "#f97316";
      case "warning": return "#eab308";
      case "secure": return "#22c55e";
      default: return "#94a3b8";
    }
  };

  const drawNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.label;
    const fontSize = 12 / globalScale;
    const radius = 6;
    
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = getNodeColor(node);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 1.5 / globalScale;
    ctx.stroke();

    if (globalScale > 1.5) {
      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText(label, node.x, node.y + radius + 4 + fontSize);
    }
  }, []);

  const drawLink = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
     const start = link.source;
     const end = link.target;
     if (typeof start !== 'object' || typeof end !== 'object') return;

     ctx.beginPath();
     ctx.moveTo(start.x, start.y);
     ctx.lineTo(end.x, end.y);
     ctx.strokeStyle = link.isAttackPath ? "rgba(239, 68, 68, 0.9)" : "rgba(148, 163, 184, 0.5)";
     ctx.lineWidth = link.isAttackPath ? 2.5 / globalScale : 1 / globalScale;
     if (link.isAttackPath) {
         ctx.setLineDash([4 / globalScale, 4 / globalScale]);
     } else {
         ctx.setLineDash([]);
     }
     ctx.stroke();
     ctx.setLineDash([]); 

     if (globalScale > 1.5 && link.label) {
        const midX = start.x + (end.x - start.x) / 2;
        const midY = start.y + (end.y - start.y) / 2;
        const fontSize = 8 / globalScale;
        
        ctx.font = `${fontSize}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const textWidth = ctx.measureText(link.label).width;
        ctx.fillStyle = 'rgba(11, 17, 32, 0.8)';
        ctx.fillRect(midX - textWidth / 2 - 2, midY - fontSize / 2 - 2, textWidth + 4, fontSize + 4);
        
        ctx.fillStyle = link.isAttackPath ? "rgba(239, 68, 68, 1)" : "rgba(148, 163, 184, 0.9)";
        ctx.fillText(link.label, midX, midY);
     }
  }, []);

  return (
    <div className="flex-1 overflow-hidden bg-background flex flex-col md:flex-row">
      <div className="w-full md:w-96 border-r border-border bg-card flex flex-col z-10 shadow-lg">
        <div className="p-6 border-b border-border bg-primary/5">
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 mb-2">
            <FlaskConical className="h-6 w-6 text-primary" />
            Red Team Operations
          </h1>
          <p className="text-sm text-muted-foreground">
            Proactively test your security posture. Simulate architecture changes, run Hindsight scenarios on historical breaches, or launch AI-driven adversarial pentests against active endpoints.
          </p>
        </div>
        
        <div className="flex-1 p-6 flex flex-col">
           {/* Simulation Type Selector */}
           <div className="flex bg-muted p-1 rounded-lg mb-6">
              <button 
                className={cn("flex-1 text-xs font-medium py-1.5 rounded-md flex items-center justify-center gap-2 transition-all", simType === "architecture" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                onClick={() => { setSimType("architecture"); setQuery(""); setResult(null); }}
              >
                 <Layers className="w-3.5 h-3.5" /> Architecture
              </button>
              <button 
                className={cn("flex-1 text-xs font-medium py-1.5 rounded-md flex items-center justify-center gap-2 transition-all", simType === "breach" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                onClick={() => { setSimType("breach"); setQuery(""); setResult(null); }}
              >
                 <BookOpen className="w-3.5 h-3.5" /> Hindsight
              </button>
              <button 
                className={cn("flex-1 text-xs font-medium py-1.5 rounded-md flex items-center justify-center gap-2 transition-all", simType === "pentest" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                onClick={() => { setSimType("pentest"); setQuery(""); setResult(null); }}
              >
                 <Terminal className="w-3.5 h-3.5" /> Pen Test
              </button>
           </div>

           {tier === "basic" ? (
             <div className="flex flex-col items-center justify-center flex-1 bg-background border border-border rounded-lg p-6 text-center">
               <Database className="w-12 h-12 text-muted-foreground mb-4" />
               <h3 className="text-lg font-bold text-foreground mb-2">Manual Upload Mode</h3>
               <p className="text-sm text-muted-foreground mb-6">
                 Basic tier organizations do not have access to real-time integration or pathfinding simulation engines. You must upload your existing infrastructure and proposed changes manually.
               </p>
               <button className="bg-muted hover:bg-muted-foreground/20 text-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors border border-border">
                 Upload Architecture File (.json)
               </button>
             </div>
           ) : (
             <form onSubmit={handleSimulate} className="flex flex-col flex-1 h-[calc(100%-3rem)]">
             <label className="text-sm font-semibold mb-2">
               {simType === "architecture" ? "Proposed Architecture Change" : 
                simType === "breach" ? "Select a Breach Scenario to Test Against Your Architecture" : 
                "Define Adversarial Campaign or Target Vectors"}
             </label>
             <textarea 
               className="w-full bg-background border border-border rounded-md p-3 text-sm flex-1 min-h-[120px] max-h-[200px] resize-none focus:ring-1 focus:ring-primary focus:border-primary outline-none"
               placeholder={simType === "architecture" ? "e.g. Move the customer database from the private subnet to a public DMZ, but put it behind a new WAF." : 
                           simType === "breach" ? "e.g. Simulate the 2023 MGM Ransomware Attack against our proposed DMZ architecture to see if we are vulnerable." : 
                           "e.g. Attempt lateral movement from compromised HR workstation to core banking databases using Pass-the-Hash."}
               value={query}
               onChange={(e) => setQuery(e.target.value)}
             />
             
             {simType === "architecture" ? (
                 <div className="mt-4 flex flex-wrap gap-2">
                   <span className="text-xs text-muted-foreground w-full mb-1">Examples:</span>
                   <button type="button" onClick={() => setQuery("Generate a comprehensive Threat Model using MITRE ATT&CK for the current architecture.")} className="text-[11px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 px-2 py-1 rounded text-left transition-colors truncate">
                     "Generate Threat Model (MITRE)"
                   </button>
                   <button type="button" onClick={() => setQuery("Open port 22 on all staging servers for contractors.")} className="text-[11px] bg-muted hover:bg-muted-foreground/20 px-2 py-1 rounded text-left transition-colors truncate">
                     "Open port 22 on all staging servers..."
                   </button>
                   <button type="button" onClick={() => setQuery("Add Okta MFA to the legacy admin console.")} className="text-[11px] bg-muted hover:bg-muted-foreground/20 px-2 py-1 rounded text-left transition-colors truncate">
                     "Add Okta MFA to legacy admin console."
                   </button>
                 </div>
             ) : simType === "breach" ? (
                 <div className="mt-4 flex flex-col gap-2">
                   <span className="text-xs text-muted-foreground w-full mb-1">Available Breaches:</span>
                   <button type="button" onClick={() => setQuery("Simulate the 2023 MGM Ransomware Attack against our architecture to see if we are vulnerable.")} className="text-[11px] bg-primary/20 hover:bg-primary/30 text-primary-foreground px-2 py-2 rounded text-left transition-colors border border-primary/30 flex justify-between items-center group">
                     <span>2023 MGM Ransomware Attack</span>
                     <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                   </button>
                   <button type="button" onClick={() => setQuery("Simulate the Target supply chain HVAC breach against our architecture.")} className="text-[11px] bg-primary/20 hover:bg-primary/30 text-primary-foreground px-2 py-2 rounded text-left transition-colors border border-primary/30 flex justify-between items-center group">
                     <span>2013 Target Supply Chain Breach</span>
                     <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                   </button>
                 </div>
             ) : (
                 <div className="mt-4 flex flex-col gap-2">
                   <span className="text-xs text-muted-foreground w-full mb-1">Campaign Strategies:</span>
                   <button type="button" onClick={() => setQuery("Pen test: Scan external perimeter mapping OWASP Top 10 against active web endpoints.")} className="text-[11px] bg-red-500/10 hover:bg-red-500/20 text-red-500 px-2 py-2 rounded text-left transition-colors border border-red-500/20 flex justify-between items-center group">
                     <span>External OWASP Web Assessment</span>
                     <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                   </button>
                   <button type="button" onClick={() => setQuery("Pen test: Test Internal Active Directory traversal from standard user node.")} className="text-[11px] bg-red-500/10 hover:bg-red-500/20 text-red-500 px-2 py-2 rounded text-left transition-colors border border-red-500/20 flex justify-between items-center group">
                     <span>Internal AD Privilege Escalation</span>
                     <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                   </button>
                 </div>
             )}

             <button 
               type="submit" 
               disabled={!query.trim() || simulating}
               className="mt-6 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
             >
               {simulating ? (
                 <><FlaskConical className="w-4 h-4 animate-bounce" /> Simulating Topology...</>
               ) : (
                 <><Zap className="w-4 h-4 text-yellow-400" /> Run Simulation</>
               )}
             </button>
           </form>
           )}


        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-muted/20 relative">
         {simulating ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm z-20">
               <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
               <h3 className="text-lg font-bold text-foreground">Agent Constructing Alternate Reality</h3>
               <p className="text-sm text-muted-foreground mt-2 max-w-sm text-center">
                 Evaluating zero-day implications, compliance mappings, and routing topologies...
               </p>
            </div>
         ) : !result ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
               <Bot className="w-16 h-16 mb-4 opacity-20" />
               <p>Enter a query to run a proactive risk simulation.</p>
            </div>
         ) : (
            <div className="p-8 max-w-5xl mx-auto space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Risk Card */}
                 <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
                    <div>
                      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" /> Risk Score Impact
                      </h3>
                      <div className="flex items-end gap-3 mt-4">
                         <span className="text-4xl font-extrabold text-muted-foreground">{result.metrics.risk_score_before}</span>
                         <ArrowRight className="w-5 h-5 mb-2 text-muted-foreground" />
                         <span className={cn(
                           "text-4xl font-extrabold", 
                           result.metrics.risk_delta > 0 ? "text-red-500" : "text-green-500"
                         )}>
                           {result.metrics.risk_score_after}
                         </span>
                      </div>
                    </div>
                    <div className={cn(
                      "px-4 py-2 rounded-full font-bold text-lg flex items-center gap-1",
                      result.metrics.risk_delta > 0 ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                    )}>
                       {result.metrics.risk_delta > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                       {result.metrics.risk_delta > 0 ? "+" : ""}{result.metrics.risk_delta}
                    </div>
                 </div>

                 {/* Compliance Card */}
                 <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
                    <div>
                      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-blue-500" /> Compliance Impact
                      </h3>
                      <div className="flex items-end gap-3 mt-4">
                         <span className="text-4xl font-extrabold text-muted-foreground">{result.metrics.compliance_before}%</span>
                         <ArrowRight className="w-5 h-5 mb-2 text-muted-foreground" />
                         <span className={cn(
                           "text-4xl font-extrabold", 
                           result.metrics.compliance_delta < 0 ? "text-red-500" : "text-green-500"
                         )}>
                           {result.metrics.compliance_after}%
                         </span>
                      </div>
                    </div>
                    <div className={cn(
                      "px-4 py-2 rounded-full font-bold text-lg flex items-center gap-1",
                      result.metrics.compliance_delta < 0 ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                    )}>
                       {result.metrics.compliance_delta < 0 ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                       {result.metrics.compliance_delta > 0 ? "+" : ""}{result.metrics.compliance_delta}%
                    </div>
                 </div>
               </div>

               {/* Graph Viewer */}
               <div className="bg-[#0B1120] border border-border rounded-xl shadow-inner h-[400px] flex flex-col overflow-hidden relative" ref={containerRef}>
                 <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur px-3 py-1.5 rounded-md border border-border text-sm font-medium flex items-center gap-2">
                    <Activity className="w-4 h-4 text-rose-500" /> Threat Graph (IOC & Progression)
                 </div>
                 <ForceGraph2D
                    ref={graphRef}
                    width={dimensions.width}
                    height={dimensions.height}
                    graphData={{ nodes: result.graph.nodes, links: result.graph.edges }}
                    nodeCanvasObject={drawNode}
                    nodeRelSize={6}
                    linkCanvasObject={drawLink}
                    linkDirectionalArrowLength={3.5}
                    linkDirectionalArrowRelPos={1}
                    d3VelocityDecay={0.3}
                    cooldownTicks={100}
                    backgroundColor="#0B1120"
                 />
                 {/* Legend */}
                 <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur p-3 rounded-md border border-border text-xs space-y-2 pointer-events-none">
                     <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#ef4444]"></span> Critical Threat / Attacker</div>
                     <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#f97316]"></span> Active IOC / Vulnerable</div>
                     <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#eab308]"></span> Suspicious</div>
                     <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#22c55e]"></span> Secure Asset</div>
                     <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border"><span className="w-4 border-t-2 border-dashed border-[#ef4444]"></span> Attacker Progression</div>
                 </div>
               </div>

               {/* Agent Narrative */}
               <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
                 <div className="prose prose-invert max-w-none text-sm md:text-base leading-relaxed">
                   {/* Poor man's markdown renderer for the narrative */}
                   {result.assessment_narrative.split('\n\n').map((paragraph: string, i: number) => {
                      if (paragraph.startsWith('### ')) {
                         return <h3 key={i} className="text-primary font-bold text-xl mb-4 mt-8 first:mt-0 flex items-center gap-2"><Bot className="w-6 h-6"/> {paragraph.replace('### ', '')}</h3>;
                      }
                      if (paragraph.startsWith('**Critical Findings:**')) {
                         const lines = paragraph.split('\n');
                         return (
                            <div key={i} className="mb-6">
                               <h4 className="font-bold text-lg text-foreground mb-3">{lines[0].replace(/\*\*/g, '')}</h4>
                               <ul className="space-y-2 border-l-2 border-primary/50 pl-4 ml-2">
                                 {lines.slice(1).map((li, j) => (
                                   <li key={j} className="text-muted-foreground">{li.replace(/^\d+\.\s/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>
                                 ))}
                               </ul>
                            </div>
                         );
                      }
                      if (paragraph.startsWith('**Recommendation:**')) {
                         return (
                            <div key={i} className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg mt-6">
                               <h4 className="font-bold text-destructive mb-2">{paragraph.split('\n')[0].replace(/\*\*/g, '')}</h4>
                               <p className="text-destructive/90">{paragraph.split('\n').slice(1).join('\n').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
                            </div>
                         );
                      }
                      return <p key={i} className="mb-4 text-muted-foreground">{paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>;
                   })}
                 </div>
               </div>

               {/* Discovered Findings Cards Loop */}
               {result.findings && result.findings.length > 0 && (
                 <div className="bg-card border border-border rounded-xl p-8 shadow-sm mt-6">
                   <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-rose-400">
                     <ShieldAlert className="w-5 h-5" /> Detailed Discoveries
                   </h3>
                   <div className="space-y-4 mb-8">
                     {result.findings.map((f: any, i: number) => (
                       <div key={i} className="p-4 bg-red-950/20 border border-red-900/50 rounded-lg">
                         <div className="flex justify-between items-start mb-2">
                           <h4 className="font-semibold text-rose-300 text-base">{f.title}</h4>
                           <span className="text-xs font-mono bg-red-900/50 px-2 py-0.5 rounded text-red-200 uppercase tracking-widest">
                             {f.severity}
                           </span>
                         </div>
                         <p className="text-sm text-muted-foreground mb-4">{f.description}</p>
                         <div className="text-xs font-mono text-gray-400 flex flex-col gap-1.5 bg-background/50 p-3 rounded border border-border/50">
                           <span><strong className="text-gray-300">Target Asset:</strong> {f.affected_asset}</span>
                           <span className="text-blue-300"><strong className="text-blue-200">Mitre Tactic:</strong> {f.mitre_tactic}</span>
                           <span className="text-emerald-400 mt-1"><strong className="text-emerald-300">Remediation:</strong> {f.remediation}</span>
                         </div>
                       </div>
                     ))}
                   </div>
                   
                   <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                     <div>
                       <h4 className="font-bold text-primary mb-1">Would you like me to move these discoveries to the Findings list for mitigation?</h4>
                       <p className="text-sm text-muted-foreground">This will create official tracking tickets in your risk dashboard for your engineering team to mitigate.</p>
                     </div>
                     <button
                       onClick={handleCommitFindings}
                       disabled={committing}
                       className="shrink-0 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                     >
                       {committing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                       Move to Findings
                     </button>
                   </div>
                 </div>
               )}

            </div>
         )}
      </div>

    </div>
  );
}
