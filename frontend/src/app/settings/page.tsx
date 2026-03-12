"use client";

import { Settings, Shield, Cpu, Users, Bell, Key, Rss, ArrowRight } from "lucide-react";
import Link from "next/link";

const settingModules = [
  {
    title: "AI & Platform Foundations",
    description: "Configure the underlying AI models, routing protocols, and cost management.",
    icon: <Cpu className="h-6 w-6 text-blue-500" />,
    href: "/settings/ai",
    status: "Active"
  },
  {
    title: "Threat Intelligence Feeds",
    description: "Manage inbound IoC streams, vulnerability feeds, and subscription status.",
    icon: <Rss className="h-6 w-6 text-orange-500" />,
    href: "/settings/threat-feeds",
    status: "Active"
  },
  {
    title: "User Management & RBAC",
    description: "Invite team members, assign roles, and manage access policies.",
    icon: <Users className="h-6 w-6 text-emerald-500" />,
    href: "/settings/users",
    status: "Coming Soon"
  },
  {
    title: "Integrations & API Keys",
    description: "Connect external SaaS platforms, cloud providers, and ticketing systems.",
    icon: <Key className="h-6 w-6 text-purple-500" />,
    href: "/settings/integrations",
    status: "Coming Soon"
  },
  {
    title: "Notifications & Alerts",
    description: "Set up Slack webhooks, email summaries, and PagerDuty escalations.",
    icon: <Bell className="h-6 w-6 text-amber-500" />,
    href: "/settings/notifications",
    status: "Coming Soon"
  },
  {
    title: "General Security",
    description: "Configure SSO, MFA enforcement, and session timeouts.",
    icon: <Shield className="h-6 w-6 text-red-500" />,
    href: "/settings/security",
    status: "Coming Soon"
  }
];

export default function SettingsHubPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Settings className="h-8 w-8 text-primary" />
              Settings
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Central configuration hub for the Virtual CISO platform.
            </p>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingModules.map((module) => (
            <Link 
              key={module.title}
              href={module.status === "Active" ? module.href : "#"}
              className={`block bg-card border rounded-lg p-6 transition-all duration-200 group ${
                module.status === "Active" 
                  ? "border-border hover:border-primary/50 hover:shadow-sm cursor-pointer" 
                  : "border-border/50 opacity-70 cursor-not-allowed"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-accent/50 rounded-lg">
                  {module.icon}
                </div>
                {module.status !== "Active" && (
                  <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                    {module.status}
                  </span>
                )}
              </div>
              
              <h3 className={`text-lg font-semibold mb-2 group-hover:text-primary transition-colors ${
                module.status !== "Active" ? "text-muted-foreground" : "text-foreground"
              }`}>
                {module.title}
              </h3>
              
              <p className="text-sm text-muted-foreground mb-4">
                {module.description}
              </p>

              {module.status === "Active" && (
                <div className="flex items-center text-sm font-medium text-primary group-hover:underline">
                  Configure <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              )}
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
