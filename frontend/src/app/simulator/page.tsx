"use client";
import { fetchWithAuth } from "@/lib/api";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FlaskConical, Send, Bot, AlertTriangle, ShieldCheck, ShieldAlert, Zap, ArrowRight, ArrowDown, Activity, TrendingDown, TrendingUp, Network, BookOpen, Layers, Database, Terminal, Loader2, Upload, Cpu, Server } from "lucide-react";
import { toast } from "sonner";

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

  return (
    <div className="flex-1 overflow-hidden bg-background flex flex-col md:flex-row">
      <div className="w-full md:w-96 border-r border-border bg-card flex flex-col z-10 shadow-lg">
        <div className="p-6 border-b border-border bg-primary/5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Proactively test your security posture. Simulate architecture changes, run Hindsight scenarios on historical breaches, or launch AI-driven adversarial pentests against active endpoints.
          </p>
        </div>
        
        <div className="flex-1 p-6 flex flex-col">
           {/* Simulation Type Selector */}
           <Tabs value={simType} onValueChange={(val: any) => { setSimType(val); setQuery(""); setResult(null); }} className="w-full mb-6">
             <TabsList className="w-full flex h-auto p-1">
                <TabsTrigger value="architecture" className="flex-1 flex items-center justify-center gap-2 text-xs py-1.5"><Layers className="w-3.5 h-3.5" /> Architecture</TabsTrigger>
                <TabsTrigger value="breach" className="flex-1 flex items-center justify-center gap-2 text-xs py-1.5"><BookOpen className="w-3.5 h-3.5" /> Hindsight</TabsTrigger>
                <TabsTrigger value="pentest" className="flex-1 flex items-center justify-center gap-2 text-xs py-1.5"><Terminal className="w-3.5 h-3.5" /> Pen Test</TabsTrigger>
             </TabsList>
           </Tabs>

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
            <div className="p-8 max-w-5xl mx-auto">
               <Tabs defaultValue="overview" className="space-y-6 w-full">
                  <TabsList className="h-auto flex-wrap justify-start">
                     <TabsTrigger value="overview" className="flex items-center gap-2"><Activity className="w-4 h-4" /> Assessment Overview</TabsTrigger>
                     <TabsTrigger value="path" className="flex items-center gap-2"><Network className="w-4 h-4" /> Attack Path Topology</TabsTrigger>
                     {result.findings && result.findings.length > 0 && (
                        <TabsTrigger value="findings" className="flex items-center gap-2 text-rose-500 data-[state=active]:text-rose-500"><ShieldAlert className="w-4 h-4" /> Discoveries</TabsTrigger>
                     )}
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-6 mt-2">
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

               {/* Agent Narrative */}
               <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
                 <div className="prose prose-invert max-w-none text-sm md:text-base leading-relaxed">
                   {/* Poor man's markdown renderer for the narrative */}
                   {result.assessment_narrative.split('\n\n').map((paragraph: string, i: number) => {
                      // Special handling for the very first introductory section
                      if (i === 0) {
                          // Strip out all raw markdown bold asterisks and headers to make it clean UI text
                          const cleanText = paragraph.replace(/\*\*(.*?)\*\*/g, '$1').replace('### ', '');
                          return (
                              <div key={i} className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8 shadow-sm">
                                 <div className="flex items-start gap-4">
                                     <div className="bg-primary/10 p-3 rounded-full shrink-0">
                                         <Bot className="w-6 h-6 text-primary" />
                                     </div>
                                     <div>
                                         <h3 className="text-lg font-bold text-foreground mb-2">Simulation Summary</h3>
                                         <p className="text-muted-foreground text-sm leading-relaxed">
                                             {cleanText}
                                         </p>
                                     </div>
                                 </div>
                              </div>
                          );
                      }

                      if (paragraph.startsWith('### ')) {
                         return <h3 key={i} className="text-primary font-bold text-xl mb-4 mt-8 first:mt-0 flex items-center gap-2"><Bot className="w-6 h-6"/> {paragraph.replace('### ', '')}</h3>;
                      }
                      if (paragraph.startsWith('**Critical Findings:**')) {
                         const lines = paragraph.split('\n');
                         return (
                            <div key={i} className="mb-6">
                               <h4 className="font-bold text-lg text-foreground mb-3">{lines[0].replace(/\*\*/g, '')}</h4>
                               <ul className="space-y-2 border-l-2 border-primary/50 pl-4 ml-2">
                                 {lines.slice(1).map((li: string, j: number) => (
                                   <li key={j} className="text-muted-foreground"><span dangerouslySetInnerHTML={{ __html: li.replace(/^\d+\.\s/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} /></li>
                                 ))}
                               </ul>
                            </div>
                         );
                      }
                      if (paragraph.startsWith('**Recommendation:**')) {
                         return (
                            <div key={i} className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg mt-6">
                               <h4 className="font-bold text-destructive mb-2">{paragraph.split('\n')[0].replace(/\*\*/g, '')}</h4>
                               <p className="text-destructive/90"><span dangerouslySetInnerHTML={{ __html: paragraph.split('\n').slice(1).join('\n').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} /></p>
                            </div>
                         );
                      }
                      return <p key={i} className="mb-4 text-muted-foreground"><span dangerouslySetInnerHTML={{ __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} /></p>;
                   })}
                 </div>
               </div>
               </TabsContent>

               <TabsContent value="path" className="mt-2 text-foreground">
               {/* Native Attack Path Timeline View */}
               <div className="bg-[#0B1120] border border-border rounded-xl shadow-inner h-[600px] flex flex-col overflow-y-auto relative p-6">
                 <div className="sticky top-0 z-10 w-fit bg-[#0B1120]/90 backdrop-blur px-3 py-1.5 rounded-md border border-border text-sm font-medium flex items-center gap-2 mb-6 shadow-sm">
                    <Network className="w-4 h-4 text-emerald-400" /> Attack Path Timeline
                 </div>
                 
                 <div className="max-w-xl mx-auto w-full flex flex-col">
                   {result.graph.edges.map((edge: any, idx: number) => {
                       const sourceNode = result.graph.nodes.find((n:any) => n.id === (typeof edge.source === 'object' ? edge.source.id : edge.source));
                       const targetNode = result.graph.nodes.find((n:any) => n.id === (typeof edge.target === 'object' ? edge.target.id : edge.target));
                       
                       if (!sourceNode || !targetNode) return null;
                       
                       return (
                           <div key={idx} className="flex flex-col">
                               {/* Source Card (rendered only once at top of path) */}
                               {idx === 0 && (
                                   <div className="bg-card border border-border rounded-md px-4 py-3 flex items-center justify-between shadow-sm relative z-0">
                                       <div className="flex items-center gap-3">
                                            <div className={cn("p-1.5 rounded-md", sourceNode.status === 'critical' ? 'bg-red-500/10' : 'bg-muted')}>
                                                <Server className={cn("w-4 h-4", sourceNode.status === 'critical' ? 'text-red-500' : 'text-foreground')} />
                                            </div>
                                            <div>
                                               <h3 className="font-semibold text-sm text-foreground">{sourceNode.label}</h3>
                                            </div>
                                       </div>
                                       <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border", sourceNode.status === 'critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-muted text-muted-foreground border-border')}>
                                           {sourceNode.status}
                                       </span>
                                   </div>
                               )}
                               
                               {/* Connecting Edge Traversal */}
                               <div className="flex flex-col items-center my-1 relative">
                                   <div className="w-[1px] h-6 bg-border"></div>
                                   <div className={cn("absolute top-1/2 -translate-y-1/2 bg-background border px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1.5 shadow-sm whitespace-nowrap z-10", edge.isAttackPath ? 'border-red-500/30 text-red-500' : 'border-border text-muted-foreground')}>
                                       <Activity className="w-3 h-3" />
                                       {edge.label || "Traverses To"}
                                   </div>
                                   <div className="w-[1px] h-6 bg-border"></div>
                                   <ArrowDown className="text-border w-4 h-4 -mt-2.5 mb-0.5" />
                               </div>
                               
                               {/* Target Node Card */}
                               <div className="bg-card border border-border rounded-md px-4 py-3 flex items-center justify-between shadow-sm relative z-0">
                                   <div className="flex items-center gap-3">
                                        <div className={cn("p-1.5 rounded-md", targetNode.status === 'critical' ? 'bg-red-500/10' : targetNode.status === 'vulnerable' ? 'bg-orange-500/10' : targetNode.status === 'warning' ? 'bg-yellow-500/10' : 'bg-emerald-500/10')}>
                                            <Server className={cn("w-4 h-4", targetNode.status === 'critical' ? 'text-red-500' : targetNode.status === 'vulnerable' ? 'text-orange-500' : targetNode.status === 'warning' ? 'text-yellow-500' : 'text-emerald-500')} />
                                        </div>
                                        <div>
                                           <h3 className="font-semibold text-sm text-foreground">{targetNode.label}</h3>
                                        </div>
                                   </div>
                                   <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border", targetNode.status === 'critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' : targetNode.status === 'vulnerable' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : targetNode.status === 'warning' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20')}>
                                       {targetNode.status}
                                   </span>
                               </div>
                           </div>
                       );
                   })}
                 </div>
               </div>
               </TabsContent>

               {/* Discovered Findings Cards Loop */}
               {result.findings && result.findings.length > 0 && (
                 <TabsContent value="findings" className="mt-2 text-foreground">
                 <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
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
                 </TabsContent>
               )}
               </Tabs>
            </div>
         )}
      </div>

    </div>
  );
}
