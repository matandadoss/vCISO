"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Search, ShieldAlert, Activity, Users } from "lucide-react";

export default function ThreatIntelPage() {
  const [actors, setActors] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Threat Actors
    fetch("http://localhost:8000/api/v1/threat-intel/actors?org_id=default")
      .then((res) => res.json())
      .then((data) => {
        setActors(data.items || []);
      })
      .catch((err) => console.error("Error fetching actors:", err));

    // Fetch Threat Indicators
    fetch("http://localhost:8000/api/v1/threat-intel/indicators?org_id=default")
      .then((res) => res.json())
      .then((data) => {
        setIndicators(data.items || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching indicators:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <ShieldAlert className="h-8 w-8 text-primary" />
              Threat Intelligence
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor active threat actors and known indicators of compromise (IoCs).
            </p>
          </div>
          <div className="flex gap-4">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search intelligence..." 
                  className="pl-9 pr-4 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-2 ring-primary"
                />
             </div>
          </div>
        </div>

        {/* Threat Actors Cards */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" /> 
            Tracked Threat Actors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {actors.map((actor: any) => (
              <div key={actor.id} className="bg-card border border-border rounded-lg p-6 flex flex-col hover:border-primary/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-foreground">{actor.name}</h3>
                  <span className={cn(
                    "px-2 py-1 text-xs font-semibold rounded-full uppercase tracking-wide",
                    actor.sophistication === "nation_state" ? "bg-red-500/20 text-red-500" :
                    actor.sophistication === "advanced" ? "bg-orange-500/20 text-orange-500" :
                    "bg-yellow-500/20 text-yellow-500"
                  )}>
                    {actor.sophistication.replace("_", " ")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-6 flex-1">{actor.description}</p>
                <div className="flex justify-between items-center text-xs text-muted-foreground mt-auto pt-4 border-t border-border/50">
                  <span>First seen: {formatDate(actor.first_seen)}</span>
                  <span className={cn("flex items-center gap-1 font-medium", actor.active ? "text-green-500" : "text-muted-foreground")}>
                    <span className={cn("w-2 h-2 rounded-full", actor.active ? "bg-green-500" : "bg-muted-foreground")}></span>
                    {actor.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
            {actors.length === 0 && !loading && (
               <div className="col-span-full h-32 flex items-center justify-center text-muted-foreground border border-dashed border-border rounded-lg">
                 No threat actors tracked.
               </div>
            )}
          </div>
        </div>

        {/* Indicators Table */}
        <div className="pt-4">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" /> 
            Recent Indicators of Compromise
          </h2>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Indicator Type</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Value</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Severity</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Confidence</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Valid From</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {indicators.map((ind: any) => (
                  <tr key={ind.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded text-foreground uppercase">
                        {ind.indicator_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-foreground font-medium">{ind.value}</span>
                    </td>
                    <td className="px-6 py-4">
                       <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider",
                        ind.severity === "critical" ? "bg-destructive/10 text-destructive" :
                        ind.severity === "high" ? "bg-orange-500/10 text-orange-500" :
                        "bg-yellow-500/10 text-yellow-500"
                      )}>
                        {ind.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-muted rounded-full h-1.5 max-w-[80px]">
                          <div 
                            className={cn("h-1.5 rounded-full", ind.confidence >= 90 ? "bg-red-500" : ind.confidence >= 70 ? "bg-orange-500" : "bg-blue-500")}
                            style={{ width: `${ind.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-muted-foreground">{ind.confidence}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground">
                      {ind.valid_from ? formatDate(ind.valid_from) : "Unknown"}
                    </td>
                  </tr>
                ))}
                {indicators.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No indicators found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
