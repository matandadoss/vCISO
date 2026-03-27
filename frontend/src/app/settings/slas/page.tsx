"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api";
import { Settings, ShieldAlert, Shield, AlertTriangle, AlertCircle, Info, Save, RotateCcw } from "lucide-react";

interface SLASettings {
  critical: number;
  high: number;
  medium: number;
  low: number;
  informational: number;
}

const DEFAULT_SLAS: SLASettings = {
  critical: 3,
  high: 7,
  medium: 30,
  low: 90,
  informational: 180,
};

export default function SLAConfigurationPage() {
  const [slas, setSlas] = useState<SLASettings>(DEFAULT_SLAS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetchWithAuth("/api/v1/organizations/me/sla-settings");
        if (res && res.ok) {
          const data = await res.json();
          setSlas(data);
        }
      } catch (e) {
        console.error("Failed to fetch SLA settings", e);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetchWithAuth("/api/v1/organizations/me/sla-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slas)
      });
      if (res && res.ok) {
        const updated = await res.json();
        setSlas(updated);
        setMessage({ type: "success", text: "Remediation SLAs successfully updated." });
      } else {
        setMessage({ type: "error", text: "Failed to update configurations. Please try again." });
      }
    } catch (e) {
      console.error(e);
      setMessage({ type: "error", text: "Failed to update configurations. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSlas(DEFAULT_SLAS);
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const severityConfigs = [
    { key: "critical", label: "Critical", icon: <ShieldAlert className="w-5 h-5 text-red-500" />, desc: "Immediate threat to business operations or core data." },
    { key: "high", label: "High", icon: <AlertTriangle className="w-5 h-5 text-orange-500" />, desc: "Significant vulnerability requiring urgent remediation." },
    { key: "medium", label: "Medium", icon: <AlertCircle className="w-5 h-5 text-amber-500" />, desc: "Moderate risk that should be addressed in standard cycles." },
    { key: "low", label: "Low", icon: <Shield className="w-5 h-5 text-blue-500" />, desc: "Minor misconfiguration with minimal immediate impact." },
    { key: "informational", label: "Informational", icon: <Info className="w-5 h-5 text-gray-400" />, desc: "Best-practice recommendations and hygiene." },
  ] as const;

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="hidden">
          {/* Title moved to global AppHeader */}
        </div>

        {message && (
          <div className={`p-4 rounded-md border text-sm ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'}`}>
            {message.text}
          </div>
        )}

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/30 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Default Resolution Timelines</h2>
              <p className="text-sm text-muted-foreground">Deadlines are calculated linearly from the initial detection timestamp.</p>
            </div>
            <div className="flex items-center gap-3">
               <button 
                  onClick={handleReset}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border border-border rounded-md hover:bg-muted"
               >
                 <RotateCcw className="w-4 h-4" /> Defaults
               </button>
               <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
               >
                 <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Policies"}
               </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {severityConfigs.map((config) => (
              <div key={config.key} className="flex items-center justify-between p-4 rounded-lg border border-border bg-background hover:border-primary/30 transition-colors group">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-muted rounded-md group-hover:bg-accent/50 transition-colors">
                    {config.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{config.label} Severity</h3>
                    <p className="text-sm text-muted-foreground">{config.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    min="1"
                    max="365"
                    value={slas[config.key]}
                    onChange={(e) => setSlas({ ...slas, [config.key]: parseInt(e.target.value) || 1 })}
                    className="w-24 px-3 py-2 bg-muted border border-border rounded-md text-foreground font-mono focus:border-primary focus:outline-none transition-colors"
                  />
                  <span className="text-sm font-medium text-muted-foreground w-12">days</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
