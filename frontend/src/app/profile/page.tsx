"use client";

import { useAuth } from "@/contexts/AuthContext";
import { User, Shield, Key, Bell, Smartphone, Mail, AlertCircle, Palette } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ProfilePage() {
  const { user } = useAuth();
  
  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <User className="w-8 h-8 text-primary" />
            Personal Account Settings
          </h1>
          <p className="text-muted-foreground mt-2">Manage your active sessions, security preferences, and alert delivery methods.</p>
        </div>

        <div className="grid gap-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
             <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2"><Mail className="w-5 h-5 text-muted-foreground" /> Email & Profile Info</h2>
             <div className="space-y-4">
                 <div className="flex flex-col gap-1">
                     <label className="text-sm font-semibold text-muted-foreground">Registered Email</label>
                     <input type="email" disabled value={user?.email || "user@example.com"} className="bg-muted px-4 py-2 rounded-md font-mono text-sm border border-border/50 text-muted-foreground cursor-not-allowed w-full max-w-md" />
                 </div>
                 <div className="flex flex-col gap-1">
                     <label className="text-sm font-semibold text-muted-foreground">Display Name</label>
                     <input type="text" defaultValue={user?.displayName || "Admin User"} className="bg-background px-4 py-2 rounded-md font-mono text-sm border border-border text-foreground w-full max-w-md focus:border-primary focus:outline-none" />
                 </div>
                 <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm w-max hover:bg-primary/90 transition-colors">Save Changes</button>
             </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
             <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2"><Key className="w-5 h-5 text-muted-foreground" /> Security & Authentication</h2>
             <div className="space-y-4">
                 <p className="text-sm text-muted-foreground">Update your password or configure Two-Factor Authentication (2FA).</p>
                 <button className="bg-muted hover:bg-muted-foreground/20 text-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors border border-border">Send Password Reset Email</button>
             </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
             <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2"><Palette className="w-5 h-5 text-muted-foreground" /> Display & UI Preferences</h2>
             <div className="space-y-4">
                 <p className="text-sm text-muted-foreground">Customize your viewing experience globally across the vCISO platform.</p>
                 <div className="mt-4">
                    <ThemeToggle />
                 </div>
             </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
             <div className="flex justify-between items-start">
                 <div>
                     <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2"><Smartphone className="w-5 h-5 text-muted-foreground" /> SMS & Mobile Alerts</h2>
                     <p className="text-sm text-muted-foreground mb-4">Register a phone number to receive critical severity alerts instantly via SMS.</p>
                 </div>
             </div>
             <div className="flex items-center gap-4">
                 <input type="tel" placeholder="+1 (555) 000-0000" className="bg-background px-4 py-2 rounded-md font-mono text-sm border border-border text-foreground w-full max-w-md focus:border-primary focus:outline-none placeholder:text-muted-foreground/50" />
                 <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm w-max hover:bg-primary/90 transition-colors">Verify Number</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
