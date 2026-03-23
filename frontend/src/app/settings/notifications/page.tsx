"use client";

import { useState, useEffect } from "react";
import { Bell, Mail, MessageSquare, AlertTriangle, Smartphone } from "lucide-react";
import api from "@/lib/api";

export default function NotificationsSettingsPage() {
  const [receiveWeeklyDigest, setReceiveWeeklyDigest] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize preference fetch (dummy fetch for now, assumed enabled unless overridden)
  
  const toggleWeeklyDigest = async (enabled: boolean) => {
    try {
      setIsLoading(true);
      setReceiveWeeklyDigest(enabled);
      await api.put("/users/me/preferences", { receives_weekly_digest: enabled });
    } catch (e) {
      console.error("Failed to update preferences", e);
      setReceiveWeeklyDigest(!enabled); // revert on failure
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Bell className="h-8 w-8 text-amber-500" />
            Notifications & Alerts
          </h1>
          <p className="text-muted-foreground mt-2">
            Set up how and where you receive critical platform alerts.
          </p>
        </div>

        <div className="space-y-6">
          
          {/* Email Settings */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
              <Mail className="h-5 w-5 text-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Email Notifications</h2>
            </div>
            <div className="space-y-4">
              <label className={`flex items-center justify-between cursor-pointer ${isLoading ? 'opacity-50' : ''}`}>
                <div>
                  <p className="font-medium text-foreground">Weekly Security Brief (AI Digest)</p>
                  <p className="text-sm text-muted-foreground">Receive a personalized, role-based AI digest highlighting 7-day posture drift and infrastructure updates.</p>
                </div>
                <input 
                  type="checkbox" 
                  className="h-4 w-4 text-primary rounded border-input" 
                  checked={receiveWeeklyDigest}
                  onChange={(e) => toggleWeeklyDigest(e.target.checked)}
                  disabled={isLoading}
                />
              </label>
              <div className="h-px bg-border my-4" />
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-foreground">Daily Digest (Legacy)</p>
                  <p className="text-sm text-muted-foreground">Receive a standard tabular summary of new findings and compliance drifts every morning.</p>
                </div>
                <input type="checkbox" className="h-4 w-4 text-primary rounded border-input" defaultChecked />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-foreground">Critical Alerts</p>
                  <p className="text-sm text-muted-foreground">Immediate emails when Critical severity findings are detected.</p>
                </div>
                <input type="checkbox" className="h-4 w-4 text-primary rounded border-input" defaultChecked />
              </label>
            </div>
          </div>

          {/* Slack/Teams Settings */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-foreground">ChatOps Integration</h2>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="font-medium text-foreground text-sm">Slack Webhook URL</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="https://hooks.slack.com/services/..." className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground" defaultValue="https://hooks.slack.com/services/T0000/B000/XXXX" />
                  <button className="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm font-medium rounded-md transition-colors">Test</button>
                </div>
              </div>
            </div>
          </div>

          {/* Incident Response */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h2 className="text-lg font-semibold text-foreground">Incident Escalation (PagerDuty)</h2>
            </div>
            <div className="flex items-center justify-between mb-4">
               <div>
                  <p className="font-medium text-foreground">PagerDuty Integration is inactive</p>
                  <p className="text-sm text-muted-foreground">Connect PagerDuty to automatically page on-call responders for Severity 1 alerts.</p>
               </div>
               <button className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium rounded-md shadow-sm transition-colors">
                 Connect
               </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
