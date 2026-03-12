"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Network, ZoomIn, ZoomOut, Maximize, Filter, AlertTriangle } from "lucide-react";
import ForceGraph2D from "react-force-graph-2d";

export default function CorrelationGraphPage() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedNode, setSelectedNode] = useState<any>(null);
  
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
    fetch("http://localhost:8000/api/v1/correlation/graph?org_id=default")
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
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText(label, node.x, node.y + radius + 4 + fontSize);
    }
  }, [selectedNode]);

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
             <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
                <AlertTriangle className="h-4 w-4" /> Run AI Analysis
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
                linkColor={() => "rgba(148, 163, 184, 0.4)"}
                linkWidth={1}
                linkLabel="label"
                linkDirectionalArrowLength={3.5}
                linkDirectionalArrowRelPos={1}
                onNodeClick={handleNodeClick}
                d3VelocityDecay={0.3}
                cooldownTicks={100}
                backgroundColor="#0B1120"
             />
           )}

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

        {/* Info Panel Sidebar */}
        <div className={cn(
           "w-80 bg-card border-l border-border flex flex-col transition-all duration-300 transform right-0 h-full fixed z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]",
           selectedNode ? "translate-x-0" : "translate-x-full"
        )}>
          {selectedNode && (
             <>
                <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
                   <h3 className="font-bold text-foreground truncate mr-2" title={selectedNode.label}>
                      {selectedNode.label}
                   </h3>
                   <button 
                     onClick={() => setSelectedNode(null)}
                     className="text-muted-foreground hover:text-foreground text-xl leading-none font-semibold px-2 py-1 rounded hover:bg-muted"
                   >
                     &times;
                   </button>
                </div>
                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                   <div>
                     <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1 font-semibold">Entity Type</p>
                     <div className="flex items-center gap-2">
                       <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getNodeColor(selectedNode) }}></span>
                       <span className="text-sm font-medium text-foreground">{selectedNode.group}</span>
                     </div>
                   </div>

                   <div className="space-y-3">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Metadata Properties</p>
                      
                      {Object.keys(selectedNode).filter(k => !['id', 'label', 'group', 'x', 'y', 'vx', 'vy', 'index', 'fx', 'fy', 'fz', 'color', '_indexColor'].includes(k)).map(key => (
                         <div key={key} className="bg-muted/50 rounded p-3">
                            <span className="text-xs text-muted-foreground capitalize block mb-0.5">{key.replace('_', ' ')}</span>
                            <span className="text-sm text-foreground font-medium capitalize">{String(selectedNode[key])}</span>
                         </div>
                      ))}
                   </div>

                   <div className="pt-4 mt-auto">
                     <button className="w-full py-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all rounded-md text-sm font-medium">
                        View Full Details
                     </button>
                   </div>
                </div>
             </>
          )}
        </div>
      </div>
    </div>
  );
}
