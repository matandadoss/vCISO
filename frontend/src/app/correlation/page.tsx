"use client";
import { fetchWithAuth } from "@/lib/api";

import { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Network, ZoomIn, ZoomOut, Maximize, Filter, AlertTriangle } from "lucide-react";
import dynamic from "next/dynamic";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

export default function CorrelationGraphPage() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [], ai_analysis: "" });
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [executingPlaybook, setExecutingPlaybook] = useState(false);
  const [executionSuccess, setExecutionSuccess] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);

  useEffect(() => {
    // Dynamic sizing for graph
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
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    fetchWithAuth("http://localhost:8000/api/v1/correlation/graph?org_id=default")
      .then((res) => res.json())
      .then((data) => {
        setGraphData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching graph:", err);
        setLoading(false);
      });
  }, []);

  const handleExecuteMitigation = async () => {
    setExecutingPlaybook(true);
    setExecutionSuccess(false);
    try {
      const res = await fetchWithAuth("http://localhost:8000/api/v1/playbooks/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action_name: "Mitigate Attack Path",
          target: "Multiple Assets (prod-db-main, frontend-gateway)",
          parameters: { script: "db_patch.yaml, deny-frontend-egress" }
        })
      });
      if (res.ok) {
         setExecutionSuccess(true);
      }
    } catch (e) {
      console.error("Failed to execute playbook", e);
    } finally {
      setExecutingPlaybook(false);
    }
  };

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
    // Center logic
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 1000);
      graphRef.current.zoom(2, 1000);
    }
  }, []);

  const getNodeColor = (node: any) => {
    switch (node.group) {
      case "Asset": return node.criticality === "high" ? "#ef4444" : "#f97316"; 
      case "Vulnerability": return node.severity === "critical" ? "#ef4444" : "#eab308";
      case "ThreatActor": return "#a855f7";
      case "Indicator": return "#6366f1";
      case "Control": return node.status === "compliant" ? "#22c55e" : "#eab308";
      default: return "#94a3b8";
    }
  };

  const getNodeIconUrl = (group: string) => {
     switch(group) {
        case "Asset": return "/icons/server.svg"; // Mock
        case "Vulnerability": return "/icons/bug.svg";
        case "ThreatActor": return "/icons/hacker.svg";
        default: return null;
     }
  }

  // Custom node rendering logic
  const drawNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.label;
    const fontSize = 12 / globalScale;
    const radius = 6;
    
    // Draw Circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = getNodeColor(node);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 1.5 / globalScale;
    ctx.stroke();

    if (node === selectedNode) {
       ctx.beginPath();
       ctx.arc(node.x, node.y, radius + 3, 0, 2 * Math.PI, false);
       ctx.strokeStyle = "#3b82f6";
       ctx.lineWidth = 2 / globalScale;
       ctx.stroke();
    }

    // Draw Label
    if (globalScale > 1.5) {
      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = node.is_attack_path ? '#ef4444' : 'rgba(255, 255, 255, 0.9)';
      ctx.fillText(label, node.x, node.y + radius + 4 + fontSize);
    }
  }, [selectedNode]);

  // Custom link rendering for labels and attack path styling
  const drawLink = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
     const start = link.source;
     const end = link.target;
     
     if (typeof start !== 'object' || typeof end !== 'object') return;

     // Draw Line
     ctx.beginPath();
     ctx.moveTo(start.x, start.y);
     ctx.lineTo(end.x, end.y);
     ctx.strokeStyle = link.is_attack_path ? "rgba(239, 68, 68, 0.8)" : "rgba(148, 163, 184, 0.4)";
     ctx.lineWidth = link.is_attack_path ? 2 / globalScale : 1 / globalScale;
     if (link.is_attack_path) {
         ctx.setLineDash([4 / globalScale, 4 / globalScale]);
     } else {
         ctx.setLineDash([]);
     }
     ctx.stroke();
     ctx.setLineDash([]); // Reset line dash

     // Draw Edge Label
     if (globalScale > 1.5 && link.label) {
        const midX = start.x + (end.x - start.x) / 2;
        const midY = start.y + (end.y - start.y) / 2;
        const fontSize = 8 / globalScale;
        
        ctx.font = `${fontSize}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Background for text
        const textWidth = ctx.measureText(link.label).width;
        ctx.fillStyle = 'rgba(11, 17, 32, 0.8)';
        ctx.fillRect(midX - textWidth / 2 - 2, midY - fontSize / 2 - 2, textWidth + 4, fontSize + 4);
        
        ctx.fillStyle = link.is_attack_path ? "rgba(239, 68, 68, 0.9)" : "rgba(148, 163, 184, 0.8)";
        ctx.fillText(link.label, midX, midY);
     }
  }, []);

  return (
    <div className="flex-1 overflow-hidden bg-background flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border bg-card/50 px-8 flex-shrink-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Network className="h-7 w-7 text-primary" />
              Dynamic Correlation Engine
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Explore complex attack paths and relationships between assets, threats, and vulnerabilities.
            </p>
          </div>
          <div className="flex gap-4">
             <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-md text-sm font-medium hover:bg-muted transition-colors">
                <Filter className="h-4 w-4" /> Filter Graph
             </button>
             <button 
               onClick={() => setShowAiPanel(true)}
               className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
             >
                <AlertTriangle className="h-4 w-4" /> View AI Path Analysis
             </button>
          </div>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 flex overflow-hidden relative" ref={containerRef}>
        
        {/* Graph Canvas */}
        <div className="flex-1 relative bg-[#0B1120] cursor-grab active:cursor-grabbing">
           {loading ? (
             <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-muted-foreground">Loading topology...</span>
             </div>
           ) : (
             <ForceGraph2D
                ref={graphRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={graphData}
                nodeCanvasObject={drawNode}
                nodeRelSize={6}
                linkCanvasObject={drawLink}
                linkDirectionalArrowLength={3.5}
                linkDirectionalArrowRelPos={1}
                linkDirectionalArrowColor={(link: any) => link.is_attack_path ? "rgba(239, 68, 68, 0.8)" : "rgba(148, 163, 184, 0.4)"}
                onNodeClick={handleNodeClick}
                d3VelocityDecay={0.3}
                cooldownTicks={100}
                backgroundColor="#0B1120"
             />
           )}

           {/* Legend Overlay */}
           <div className="absolute top-6 left-6 bg-card/80 backdrop-blur-md p-4 rounded-lg border border-border shadow-lg space-y-3 pointer-events-none">
             <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Legend</h4>
             <div className="flex items-center gap-2">
                 <span className="w-3 h-3 rounded-full bg-[#f97316]"></span>
                 <span className="text-sm font-medium text-foreground">Asset</span>
             </div>
             <div className="flex items-center gap-2">
                 <span className="w-3 h-3 rounded-full bg-[#eab308]"></span>
                 <span className="text-sm font-medium text-foreground">Vulnerability</span>
             </div>
             <div className="flex items-center gap-2">
                 <span className="w-3 h-3 rounded-full bg-[#a855f7]"></span>
                 <span className="text-sm font-medium text-foreground">Threat Actor</span>
             </div>
             <div className="flex items-center gap-2">
                 <span className="w-3 h-3 rounded-full bg-[#6366f1]"></span>
                 <span className="text-sm font-medium text-foreground">Indicator (IoC)</span>
             </div>
             <div className="flex items-center gap-2">
                 <span className="w-3 h-3 rounded-full bg-[#22c55e]"></span>
                 <span className="text-sm font-medium text-foreground">Security Control</span>
             </div>
             <div className="h-px bg-border/50 my-2"></div>
             <div className="flex items-center gap-2">
                 <span className="w-4 border-t-2 border-dashed border-red-500"></span>
                 <span className="text-sm font-medium text-red-500">Critical Attack Path</span>
             </div>
           </div>

           {/* Graph Controls Overlay */}
           <div className="absolute bottom-6 right-6 flex flex-col gap-2 bg-card/80 backdrop-blur-md p-2 rounded-lg border border-border shadow-lg">
             <button 
               onClick={() => graphRef.current?.zoom(graphRef.current.zoom() * 1.2, 400)}
               className="p-2 hover:bg-muted rounded text-foreground transition-colors"
               title="Zoom In"
             >
                <ZoomIn className="w-5 h-5" />
             </button>
             <button 
               onClick={() => graphRef.current?.zoom(graphRef.current.zoom() / 1.2, 400)}
               className="p-2 hover:bg-muted rounded text-foreground transition-colors"
               title="Zoom Out"
             >
                <ZoomOut className="w-5 h-5" />
             </button>
             <div className="h-px bg-border my-1 w-full relative left-0"></div>
             <button 
               onClick={() => graphRef.current?.zoomToFit(400)}
               className="p-2 hover:bg-muted rounded text-foreground transition-colors"
               title="Fit to Screen"
             >
                <Maximize className="w-5 h-5" />
             </button>
           </div>
        </div>

        {/* AI Analysis Side Panel */}
        <div className={cn(
           "w-96 bg-card border-l border-border flex flex-col transition-all duration-300 transform right-0 h-full fixed z-30 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]",
           showAiPanel ? "translate-x-0" : "translate-x-full"
        )}>
          <div className="p-4 border-b border-border flex justify-between items-center bg-primary/10">
             <h3 className="font-bold text-primary flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> AI Path Analysis
             </h3>
             <button 
               onClick={() => setShowAiPanel(false)}
               className="text-primary hover:text-primary hover:bg-primary/20 text-xl leading-none font-semibold px-2 py-1 rounded transition-colors"
             >
               &times;
             </button>
          </div>
          <div className="p-6 flex-1 overflow-y-auto space-y-6">
             <div className="bg-destructive/10 border border-destructive/20 rounded p-4 text-sm text-destructive leading-relaxed">
               {/* Since ai_analysis string includes markdown, we do a basic split to render strong tags for simplicity */}
               {graphData.ai_analysis && graphData.ai_analysis.split('**').map((text, i) => 
                 i % 2 === 1 ? <strong key={i}>{text}</strong> : <span key={i}>{text}</span>
               )}
             </div>

             <div className="space-y-3 pt-4 border-t border-border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Generated Mitigation Script</h4>
                <div className="bg-muted p-3 rounded border border-border font-mono text-xs text-muted-foreground whitespace-pre overflow-x-auto">
{`# 1. Block malicious IP
iptables -A INPUT -s 198.51.100.42 -j DROP

# 2. Patch prod-db-main 
ansible-playbook -i inventory db_patch.yaml

# 3. Restrict frontend egress
gcloud compute firewall-rules create deny-frontend-egress \\
    --action=DENY \\
    --rules=tcp:5432 \\
    --source-tags=frontend-gateway \\
    --target-tags=prod-db-main`}
                </div>
                {executionSuccess ? (
                   <div className="w-full mt-2 py-2 bg-green-500/10 text-green-600 dark:text-green-400 font-medium flex items-center justify-center gap-2 rounded-md border border-green-500/20 text-sm">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                     Script Executed Automatically
                   </div>
                ) : (
                   <button 
                      onClick={handleExecuteMitigation}
                      disabled={executingPlaybook}
                      className="w-full mt-2 py-2 flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all rounded-md text-sm font-medium shadow disabled:opacity-70"
                   >
                      {executingPlaybook ? (
                        <><AlertTriangle className="w-4 h-4 animate-spin" /> Running Playbooks...</>
                      ) : (
                        "Execute Mitigation Script"
                      )}
                   </button>
                )}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
