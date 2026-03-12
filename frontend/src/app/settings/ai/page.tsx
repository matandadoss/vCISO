import { Settings, Shield, AlertTriangle, ArrowRight } from "lucide-react";

export default function AISettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Configuration & Budgets</h1>
          <p className="text-muted-foreground mt-1">
            Manage your Virtual CISO AI providers, track usage costs, and configure auto-downgrade rules.
          </p>
        </div>

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
              <Shield className="w-5 h-5 mr-2 text-primary" /> Daily Budget
            </h3>
             <div className="space-y-4">
               <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Usage Today</span>
                    <span className="font-semibold">$4.50 / $10.00</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
               </div>
               <div className="pt-2">
                 <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" className="form-checkbox h-4 w-4 text-primary rounded border-border" defaultChecked />
                    <span className="text-sm font-medium">Auto-downgrade tier when budget reached</span>
                 </label>
               </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-primary" /> Cost Breakdown by Workflow
            </h3>
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                    <tr>
                      <th className="px-4 py-3">Workflow</th>
                      <th className="px-4 py-3">Queries Processed</th>
                      <th className="px-4 py-3">Deep Executions</th>
                      <th className="px-4 py-3 text-right">Cost (7d)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="px-4 py-3 font-medium">Correlation Engine</td>
                      <td className="px-4 py-3">1,432</td>
                      <td className="px-4 py-3">120</td>
                      <td className="px-4 py-3 text-right font-medium">$8.45</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="px-4 py-3 font-medium">vCISO Chat</td>
                      <td className="px-4 py-3">54</td>
                      <td className="px-4 py-3">15</td>
                      <td className="px-4 py-3 text-right font-medium">$1.20</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Vulnerability Management</td>
                      <td className="px-4 py-3">4,890</td>
                      <td className="px-4 py-3">0</td>
                      <td className="px-4 py-3 text-right font-medium">$0.50</td>
                    </tr>
                  </tbody>
                </table>
             </div>
        </div>

      </div>
    </div>
  );
}
