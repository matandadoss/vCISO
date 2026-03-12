"use client";

import { Shield, Lock, Smartphone, Globe } from "lucide-react";

export default function SecuritySettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Shield className="h-8 w-8 text-red-500" />
            General Security
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure authentication, session policies, and overall platform security.
          </p>
        </div>

        <div className="space-y-6">
          
          {/* Authentication */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4">Authentication Requirements</h2>
            <div className="space-y-4">
              <div className="flex items-start justify-between p-4 bg-accent/30 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Require Multi-Factor Authentication (MFA)</p>
                    <p className="text-sm text-muted-foreground">Enforce MFA for all users attempting to log into the platform.</p>
                  </div>
                </div>
                <button type="button" className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-primary">
                  <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
                </button>
              </div>
              
              <div className="flex items-start justify-between p-4 bg-background rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Single Sign-On (SSO)</p>
                    <p className="text-sm text-muted-foreground">Configure SAML/OIDC via Okta, Entra ID, or Google Workspace.</p>
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-secondary text-secondary-foreground text-sm font-medium rounded-md hover:bg-secondary/80 transition-colors">Configure</button>
              </div>
            </div>
          </div>

          {/* Session Policies */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4">Session Policies</h2>
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Idle Session Timeout</label>
                <div className="flex items-center gap-3">
                  <select className="flex h-10 w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" defaultValue="60">
                    <option value="15">15 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="60">1 Hour</option>
                    <option value="240">4 Hours</option>
                  </select>
                  <span className="text-sm text-muted-foreground">Automatically log out inactive users.</span>
                </div>
              </div>
              
              <div className="space-y-1.5 border-t border-border pt-6">
                <label className="text-sm font-medium text-foreground">IP Allowlisting</label>
                <p className="text-sm text-muted-foreground mb-2">Restrict platform access to specific corporate IP ranges.</p>
                <textarea 
                  className="w-full flex min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground"
                  placeholder="203.0.113.0/24&#10;198.51.100.14"
                ></textarea>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
             <button className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium rounded-md shadow-sm transition-colors">
               Save Security Policies
             </button>
          </div>

        </div>

      </div>
    </div>
  );
}
