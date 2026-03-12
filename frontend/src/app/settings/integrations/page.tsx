"use client";

import { useState } from "react";
import { Key, Link as LinkIcon, Plus, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_INTEGRATIONS = [
  { id: "1", name: "Jira Software", category: "Ticketing", status: "Connected", lastSync: "10 mins ago", icon: LinkIcon },
  { id: "2", name: "Slack", category: "Messaging", status: "Connected", lastSync: "Active", icon: LinkIcon },
  { id: "3", name: "AWS CloudTrail", category: "Cloud Security", status: "Error", lastSync: "Failed 2 hrs ago", icon: LinkIcon },
  { id: "4", name: "CrowdStrike Falcon", category: "EDR", status: "Disconnected", lastSync: "-", icon: LinkIcon },
];

export default function IntegrationsSettingsPage() {
  const [integrations, setIntegrations] = useState(MOCK_INTEGRATIONS);

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Key className="h-8 w-8 text-primary" />
              Integrations & API Keys
            </h1>
            <p className="text-muted-foreground mt-2">
              Connect external SaaS platforms, cloud providers, and ticketing systems.
            </p>
          </div>
          <button className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium rounded-md shadow-sm transition-colors flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Integration
          </button>
        </div>

        {/* API Keys Section */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">API Keys</h2>
            <button className="text-sm font-medium text-primary hover:underline">Generate New Key</button>
          </div>
          <div className="rounded-md border border-border overflow-hidden">
             <div className="bg-accent/30 p-4 font-mono text-sm text-foreground flex justify-between items-center">
               <span>vciso_prod_9x8f...</span>
               <span className="text-muted-foreground text-xs">Created Jan 12, 2026</span>
             </div>
             <div className="bg-background p-4 font-mono text-sm text-foreground flex justify-between items-center border-t border-border">
               <span>vciso_dev_2b4a...</span>
               <span className="text-muted-foreground text-xs">Created Mar 01, 2026</span>
             </div>
          </div>
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.map((integration) => (
            <div key={integration.id} className="bg-card border border-border rounded-lg p-6 flex flex-col justify-between shadow-sm hover:border-primary/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-accent/50 rounded-lg">
                    <integration.icon className="h-6 w-6 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{integration.name}</h3>
                    <p className="text-sm text-muted-foreground">{integration.category}</p>
                  </div>
                </div>
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
                  integration.status === 'Connected' ? "bg-emerald-500/10 text-emerald-500" : 
                  integration.status === 'Error' ? "bg-destructive/10 text-destructive" :
                  "bg-muted text-muted-foreground"
                )}>
                  {integration.status === 'Connected' && <CheckCircle2 className="h-3 w-3" />}
                  {integration.status === 'Error' && <AlertCircle className="h-3 w-3" />}
                  {integration.status}
                </span>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" /> Sync: {integration.lastSync}
                </span>
                <button className="text-sm font-medium text-primary hover:underline">Configure</button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
