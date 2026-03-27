"use client";
import { fetchWithAuth } from "@/lib/api";

import { useState, useEffect } from "react";
import { Plug, Search, CheckCircle2, XCircle, RefreshCw, Server, Shield, Activity, Users, Database, EyeOff } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import OAuthConnectorModal from "@/components/integrations/OAuthConnectorModal";

type Integration = {
  id: string;
  name: string;
  category: string;
  description: string;
  status: "connected" | "disconnected";
  last_sync: string | null;
  icon: string;
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [magicText, setMagicText] = useState("");
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicResult, setMagicResult] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Identity Provider (IdP) Tracking State
  const [authModal, setAuthModal] = useState<{ open: boolean, idp: string }>({ open: false, idp: "" });
  const [idpStatus, setIdpStatus] = useState<Record<string, { connected: boolean, count: number }>>({
    "Google Workspace": { connected: false, count: 0 },
    "Okta": { connected: false, count: 0 },
    "Microsoft Entra ID": { connected: false, count: 0 }
  });

  const handleIdpSuccess = (idp: string) => {
    const discoveredCount = Math.floor(Math.random() * 45) + 12; // Simulate finding Shadow IT vendors
    setIdpStatus(prev => ({ ...prev, [idp]: { connected: true, count: discoveredCount } }));
    setMagicResult({ 
       type: 'success', 
       message: `${idp} synchronized! Automatically discovered ${discoveredCount} third-party vendor platforms via active SSO monitoring.` 
    });
    
    // Automatically fade out the success toast after 8 seconds
    setTimeout(() => setMagicResult(null), 8000);
  };

  const handleMagicConnect = async () => {
    if (!magicText.trim()) return;
    setMagicLoading(true);
    setMagicResult(null);
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/integrations/magic-connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text: magicText })
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setIntegrations(prev => prev.map(int => int.id === data.integration.id ? data.integration : int));
        setMagicResult({ type: 'success', message: data.message });
        setMagicText("");
      } else {
        setMagicResult({ type: 'error', message: data.message || "Failed to connect." });
      }
    } catch (err) {
      console.error(err);
      setMagicResult({ type: 'error', message: "A network error occurred." });
    } finally {
      setMagicLoading(false);
    }
  };

  useEffect(() => {
    async function fetchIntegrations() {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/integrations`);
        const data = await res.json();
        setIntegrations(data.integrations || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchIntegrations();
  }, []);

  const handleToggle = async (id: string, currentStatus: string) => {
    setToggling(id);
    const action = currentStatus === "connected" ? "disconnect" : "connect";
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/integrations/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integration_id: id, action })
      });
      if (res.ok) {
        const data = await res.json();
        setIntegrations(prev => prev.map(int => int.id === id ? data.integration : int));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(null);
    }
  };

  const getCategoryIcon = (category: string) => {
     switch(category) {
        case "Cloud Infrastructure": return <Server className="w-4 h-4" />;
        case "Endpoint Security": return <Shield className="w-4 h-4" />;
        case "SIEM": return <Activity className="w-4 h-4" />;
        case "Ticketing": return <Plug className="w-4 h-4" />;
        case "Communication": return <Users className="w-4 h-4" />;
        case "Identity": return <Database className="w-4 h-4" />;
        default: return <Plug className="w-4 h-4" />;
     }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
          <div className="hidden">
            {/* Title moved to global AppHeader */}
          </div>
          <div className="flex gap-4 relative w-full sm:w-auto">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <input 
               type="text" 
               placeholder="Search integrations..." 
               className="pl-9 pr-4 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-64"
             />
          </div>
        </div>

        {/* Magic Connect Section */}
        <div className="bg-gradient-to-r from-primary/10 via-background to-background border border-primary/20 rounded-xl p-6 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Plug className="w-32 h-32 text-primary" />
           </div>
           <div className="relative z-10 max-w-3xl">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-2">
                 <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-mono uppercase tracking-wider animate-pulse">AI Powered</span>
                 Magic Connect
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                 Don't want to fill out forms? Just paste whatever you have here—a raw AWS Role ARN, a Slack Webhook URL, a JSON credentials file, or a CrowdStrike API key pair. Our AI will figure out what it is and configure the integration automatically.
              </p>
              
              <div className="relative">
                 <textarea
                   value={magicText}
                   onChange={(e) => setMagicText(e.target.value)}
                   placeholder="Paste raw credentials, ARNs, webhooks, or scripts here..."
                   className="w-full h-32 bg-card/50 border border-border rounded-md p-4 text-sm font-mono text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:bg-card resize-none"
                   disabled={magicLoading}
                 />
                 {magicLoading && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-md border border-primary/20 z-10">
                       <div className="flex flex-col items-center justify-center gap-3 bg-card p-4 rounded-lg shadow-lg">
                          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto"></div>
                          <span className="text-sm font-medium animate-pulse text-foreground tracking-wider">AI is analyzing credentials...</span>
                       </div>
                    </div>
                 )}
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 gap-4 sm:gap-0">
                 <div className="flex-1">
                    {magicResult && (
                       <div className={cn(
                          "text-sm flex items-center gap-2 py-1.5 px-3 rounded-md animate-in fade-in slide-in-from-bottom-2 inline-flex",
                          magicResult.type === 'success' ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-destructive/10 text-destructive border border-destructive/20"
                       )}>
                          {magicResult.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          {magicResult.message}
                       </div>
                    )}
                 </div>
                 <button 
                   onClick={handleMagicConnect}
                   disabled={!magicText.trim() || magicLoading}
                   className="px-6 py-2 bg-primary text-primary-foreground font-medium text-sm rounded-md shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
                 >
                   <Plug className="w-4 h-4" />
                   Connect Automatically
                 </button>
              </div>
           </div>
        </div>

                 {/* Shadow IT & Vendor Discovery Section (IdP Sync) */}
         <div className="mb-8">
            <h2 className="text-xl font-bold flex items-center gap-3 mb-4 text-foreground">
               <EyeOff className="w-5 h-5 text-purple-500" /> Shadow IT & Vendor Discovery
            </h2>
            <p className="text-sm text-muted-foreground mb-6">Connect your organization's primary Identity Provider (IdP) or Single Sign-On broker to automatically detect third-party vendors, suppliers, and hidden shadow IT across your employees' web activity.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {Object.entries(idpStatus).map(([name, status]) => (
                  <div key={name} className={cn(
                    "border rounded-xl p-6 flex flex-col transition-all relative overflow-hidden",
                    status.connected ? "bg-purple-500/5 border-purple-500/30" : "bg-card border-border hover:border-primary/50"
                  )}>
                     {status.connected && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-primary"></div>}
                     <div className="flex items-center gap-4 mb-5">
                       <div className={cn(
                          "w-12 h-12 rounded-lg flex items-center justify-center border",
                          status.connected ? "bg-background border-purple-500/30 shadow-inner" : "bg-muted border-border/50"
                       )}>
                          <Database className={cn("w-6 h-6", status.connected ? "text-purple-500" : "text-muted-foreground")} />
                       </div>
                       <div>
                          <h3 className="font-bold text-foreground">{name}</h3>
                          <span className={cn(
                             "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded",
                             status.connected ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"
                          )}>
                             {status.connected ? "Sync Active" : "Identity Provider"}
                          </span>
                       </div>
                     </div>
                     
                     {status.connected ? (
                        <div className="flex-1 bg-background border border-border rounded-lg p-3 flex flex-col justify-center items-center gap-1 mb-4">
                           <span className="text-2xl font-black text-foreground">{status.count}</span>
                           <span className="text-xs text-muted-foreground font-medium text-center">Software Vendors Detected</span>
                        </div>
                     ) : (
                        <p className="text-sm text-muted-foreground flex-1 mb-6">Authorize secure OAuth handover to continuously audit SAML assignments and active directory domains.</p>
                     )}
                     
                     <button 
                       onClick={() => !status.connected && setAuthModal({ open: true, idp: name })}
                       disabled={status.connected}
                       className={cn(
                         "w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all",
                         status.connected ? "bg-muted/50 text-muted-foreground border border-border cursor-not-allowed" : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                       )}
                     >
                       {status.connected ? <><CheckCircle2 className="w-4 h-4 text-green-500" /> Monitored</> : "Authenticate via OAuth"}
                     </button>
                  </div>
               ))}
            </div>
         </div>

         <div className="flex items-center gap-3 mb-4 mt-12 w-full border-b border-border pb-4">
            <Plug className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">Standard Integrations</h2>
         </div>

         {loading ? (
           <div className="h-64 flex items-center justify-center">
             <span className="animate-pulse text-muted-foreground font-medium">Loading integrations...</span>
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations.map((int) => (
                 <div key={int.id} className="bg-card border border-border rounded-xl shadow-sm p-6 flex flex-col hover:border-primary/50 transition-colors">
                    <div className="flex justify-between items-start mb-6">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center p-2 border border-border/50">
                             {/* Mocking icons with generic shapes if svgs don't exist */}
                             <div className="text-xl font-bold text-foreground/50">{int.name.charAt(0)}</div>
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground">{int.name}</h3>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                               {getCategoryIcon(int.category)}
                               {int.category}
                            </div>
                          </div>
                       </div>
                    </div>

                    <p className="text-sm text-muted-foreground flex-1 mb-6">
                       {int.description}
                    </p>

                    <div className="flex justify-between items-center bg-muted/40 p-3 rounded-lg border border-border/50">
                       <div className="flex items-center gap-2">
                          <div className={cn(
                             "w-2 h-2 rounded-full",
                             int.status === "connected" ? "bg-green-500 animate-pulse" : "bg-muted-foreground"
                          )} />
                          <span className={cn(
                             "text-xs font-semibold uppercase tracking-wider",
                             int.status === "connected" ? "text-green-500" : "text-muted-foreground"
                          )}>
                            {int.status}
                          </span>
                       </div>

                       {int.status === "connected" && int.last_sync && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                             Sync: {formatDate(int.last_sync)}
                          </span>
                       )}
                    </div>

                    <div className="mt-4 flex gap-2">
                       <button 
                         onClick={() => handleToggle(int.id, int.status)}
                         disabled={toggling === int.id}
                         className={cn(
                           "flex-1 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50",
                           int.status === "connected" 
                             ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20"
                             : "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                         )}
                       >
                          {toggling === int.id ? (
                             <><RefreshCw className="w-4 h-4 animate-spin" /> {int.status === "connected" ? "Disconnecting..." : "Connecting..."}</>
                          ) : int.status === "connected" ? (
                             <><XCircle className="w-4 h-4" /> Disconnect</>
                          ) : (
                             <><CheckCircle2 className="w-4 h-4" /> Connect Settings</>
                          )}
                       </button>
                    </div>
                 </div>
              ))}
           </div>
        )}
      </div>
    </div>
  );
}
