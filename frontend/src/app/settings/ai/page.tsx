"use client";
import { fetchWithAuth } from "@/lib/api";

import { useState, useEffect } from "react";
import { Settings, Shield, AlertTriangle, ArrowRight, TrendingUp, Clock, BarChart3, Save } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AISettingsPage() {
  const [loading, setLoading] = useState(true);
  const [roiData, setRoiData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
       try {
         const [roiRes, trendRes, costRes] = await Promise.all([
            fetchWithAuth('http://localhost:8000/api/v1/ai/roi-metrics?org_id=test-org'),
            fetchWithAuth('http://localhost:8000/api/v1/ai/budget-trends?org_id=test-org&days=7'),
            fetchWithAuth('http://localhost:8000/api/v1/ai/cost-breakdown?org_id=test-org')
         ]);
         
         const roi = await roiRes.json();
         const trend = await trendRes.json();
         const cost = await costRes.json();

         setRoiData(roi);
         setTrendData(trend.trend || []);
         setWorkflows(cost.by_workflow || []);
       } catch (e) {
         console.error(e);
       } finally {
         setLoading(false);
       }
    }
    fetchData();
  }, []);

  const handleUpdateWorkflow = (index: number, field: string, value: any) => {
      const newWorkflows = [...workflows];
      newWorkflows[index] = { ...newWorkflows[index], [field]: value };
      setWorkflows(newWorkflows);
  };

  const handleSaveConfigs = async () => {
     setSaving(true);
     // Mock sending updates to backend
     await new Promise(r => setTimeout(r, 800));
     setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center">
            <Settings className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Loading AI Configuration...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Configuration & Budgets</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Manage your Virtual CISO AI providers, track usage costs, configure auto-downgrade rules, and view ROI.
          </p>
        </div>

        {/* ROI Metrics Top Banner */}
        {roiData && (
          <div className="bg-gradient-to-r from-primary/10 via-background to-background border border-primary/20 rounded-lg p-6 
                          flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
             <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-1">
                   <TrendingUp className="w-5 h-5 text-primary" />
                   AI Return on Investment (This Week)
                </h3>
                <p className="text-sm text-muted-foreground">Quantifiable impact of the AI correlation engine and autonomous triaging.</p>
             </div>
             <div className="flex gap-6">
                <div className="text-center">
                   <p className="text-3xl font-extrabold text-primary">{roiData.estimated_hours_saved}<span className="text-lg">h</span></p>
                   <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mt-1">Hours Saved</p>
                </div>
                <div className="w-px bg-border"></div>
                <div className="text-center">
                   <p className="text-3xl font-extrabold text-foreground">{roiData.incidents_auto_triaged}</p>
                   <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mt-1">Alerts Triaged</p>
                </div>
                <div className="w-px bg-border"></div>
                <div className="text-center">
                   <p className="text-3xl font-extrabold text-foreground">{roiData.compliance_gaps_auto_mapped}</p>
                   <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mt-1">Controls Mapped</p>
                </div>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-primary" /> Active Provider
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 border border-border rounded-md bg-muted/50">
                <span className="font-medium">Primary LLM</span>
                <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">Anthropic Direct</span>
              </div>
              <div className="flex justify-between items-center p-3 border border-border rounded-md bg-muted/50">
                <span className="font-medium">Fallback LLM</span>
                <span className="text-sm bg-muted-foreground/10 text-muted-foreground px-2 py-1 rounded">Vertex AI (Gemini)</span>
              </div>
            </div>
            <button className="mt-6 text-sm text-primary flex items-center hover:underline">
              Change Provider Settings <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-primary" /> Daily Global Budget Trend
            </h3>
             <div className="space-y-4">
               <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Usage Today</span>
                    <span className="font-semibold text-red-400">$8.50 / $10.00</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mb-1">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <p className="text-xs text-red-500 font-medium">Warning: 85% of daily budget consumed.</p>
               </div>
               
               {/* Trend Chart Mockup */}
               <div className="pt-4 mt-4 border-t border-border">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">7-Day Cost History</p>
                  <div className="h-32 flex items-end gap-2">
                     {trendData.map((day, i) => {
                        // Max cost approx $5.00 for scaling height
                        const heightPct = Math.min((day.cost / 5.0) * 100, 100);
                        return (
                           <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 group relative">
                              <div className="w-full bg-primary/20 group-hover:bg-primary/50 transition-colors rounded-t-sm" style={{ height: `${heightPct}%` }}></div>
                              <span className="text-[10px] text-muted-foreground">{day.date}</span>
                              
                              <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border px-2 py-1 rounded text-xs font-medium shadow whitespace-nowrap z-10">
                                 ${day.cost.toFixed(2)}
                              </div>
                           </div>
                        )
                     })}
                  </div>
               </div>

             </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 flex flex-col shadow-sm">
            <div className="flex justify-between items-center mb-6">
               <div>
                 <h3 className="text-lg font-semibold flex items-center">
                   <AlertTriangle className="w-5 h-5 mr-2 text-primary" /> Per-Workflow Controls
                 </h3>
                 <p className="text-sm text-muted-foreground mt-1">Set specific budget caps, alert limits, and model quality per use-case.</p>
               </div>
               <button 
                 onClick={handleSaveConfigs}
                 disabled={saving}
                 className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-70"
               >
                 {saving ? <Settings className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                 Save Changes
               </button>
            </div>
             <div className="overflow-x-auto border rounded-xl border-border bg-background">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                    <tr className="bg-muted/30">
                      <th className="px-4 py-3 border-b border-border">Workflow Name</th>
                      <th className="px-4 py-3 border-b border-border text-center">Current Cost (7d)</th>
                      <th className="px-4 py-3 border-b border-border">Daily Cap ($)</th>
                      <th className="px-4 py-3 border-b border-border pointer-events-auto">Model Mode</th>
                      <th className="px-4 py-3 border-b border-border">Alert Threshold (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {workflows.map((wf, idx) => (
                      <tr key={idx} className="hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-4 font-medium capitalize flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-primary/70"></div>
                           {wf.workflow.replace('_', ' ')}
                        </td>
                        <td className="px-4 py-4 text-center font-mono text-sm">${wf.cost.toFixed(2)}</td>
                        <td className="px-4 py-4">
                           <div className="relative max-w-[120px]">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                              <input 
                                type="number" 
                                className="w-full bg-muted/50 border border-border rounded-md py-1.5 pl-7 pr-3 text-sm focus:border-primary focus:ring-1 ring-primary focus:outline-none"
                                value={wf.cap}
                                onChange={(e) => handleUpdateWorkflow(idx, 'cap', parseFloat(e.target.value))}
                                step="0.5"
                                min="0"
                              />
                           </div>
                        </td>
                        <td className="px-4 py-4">
                           <select 
                             className="bg-muted/50 border border-border rounded-md px-3 py-1.5 text-sm w-full max-w-[180px] focus:border-primary focus:outline-none"
                             value={wf.model_preference}
                             onChange={(e) => handleUpdateWorkflow(idx, 'model_preference', e.target.value)}
                           >
                              <option value="fast_cheap">Fast / Cheap (Small LLM)</option>
                              <option value="balanced">Balanced</option>
                              <option value="deep">Accurate / Expensive (Large LLM)</option>
                           </select>
                        </td>
                        <td className="px-4 py-4">
                           <div className="flex items-center gap-3 max-w-[150px]">
                              <input 
                                type="range" 
                                min="50" max="100" step="5"
                                className="w-full accent-primary"
                                value={wf.alert_threshold}
                                onChange={(e) => handleUpdateWorkflow(idx, 'alert_threshold', parseInt(e.target.value))}
                              />
                              <span className="text-sm font-mono w-10 text-right">{wf.alert_threshold}%</span>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
             <p className="text-xs text-muted-foreground mt-4 italic">
                * Adjusting to "Fast / Cheap" will automatically route queries for that workflow to the configured fallback model (e.g. Gemini Flash or Haiku) to conserve budget.
             </p>
        </div>

      </div>
    </div>
  );
}
