"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Target, 
  Activity, 
  Settings,
  MessageSquare,
  Network,
  Terminal,
  Plug,
  Zap,
  Building2,
  LogOut,
  LogIn,
  UserCircle,
  FlaskConical,
  BookOpen,
  GitMerge,
  ShieldCheck,
  GlobeLock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useRole, Role } from "@/contexts/RoleContext";

type NavGroup = {
  label: string;
  items: { href: string; label: string; icon: any; roles?: Role[] }[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard }, // All
      { href: "/guide", label: "Platform Guide", icon: BookOpen }, // All
      { href: "/chat", label: "vCISO Chat", icon: MessageSquare, roles: ["CISO", "BOARD_MEMBER"] },
    ]
  },
  {
    label: "Active Workflows",
    items: [
      { href: "/workflows/supply-chain", label: "Supply Chain Risk", icon: Building2, roles: ["CISO", "AUDITOR"] },
      { href: "/threat-intel", label: "Threat Management", icon: Target, roles: ["CISO", "SOC_ANALYST"] },
      { href: "/findings", label: "Vulnerability Mgmt", icon: ShieldAlert, roles: ["CISO", "SOC_ANALYST", "AUDITOR"] },
      { href: "/compliance", label: "Framework Compliance", icon: ShieldCheck, roles: ["CISO", "AUDITOR", "BOARD_MEMBER"] },
    ]
  },
  {
    label: "Security Utilities",
    items: [
      { href: "/correlation", label: "Correlation Graph", icon: Network, roles: ["CISO", "SOC_ANALYST"] },
      { href: "/pentest", label: "AI Pentesting", icon: Terminal, roles: ["CISO", "SOC_ANALYST", "SECURITY_ENGINEER"] },
      { href: "/simulator", label: "What-If Simulator", icon: FlaskConical, roles: ["CISO", "SOC_ANALYST"] },
      { href: "/vendor-risk", label: "Vendor Inspect (Legacy)", icon: GlobeLock, roles: ["CISO", "AUDITOR"] },
    ]
  },
  {
    label: "Automation & Data",
    items: [
      { href: "/playbooks", label: "Playbooks (SOAR)", icon: Zap, roles: ["CISO", "SOC_ANALYST", "SECURITY_ENGINEER"] },
      { href: "/workflows", label: "Data Pipeline Config", icon: Activity, roles: ["CISO", "SECURITY_ENGINEER"] },
      { href: "/integrations", label: "Integrations Hub", icon: Plug, roles: ["CISO"] },
    ]
  },
  {
    label: "System",
    items: [
      { href: "/audit-trail", label: "Audit Trail", icon: Terminal, roles: ["CISO", "SOC_ANALYST", "AUDITOR"] },
      { href: "/settings", label: "Settings", icon: Settings, roles: ["CISO"] },
    ]
  }
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, signInWithGoogle, signOut } = useAuth();
  const { role, setRole } = useRole();

  const filteredGroups = NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => !item.roles || item.roles.includes(role))
  })).filter(group => group.items.length > 0);

  return (
    <div className="flex flex-col w-64 border-r border-border bg-card text-card-foreground">
      <div className="py-4 px-6 border-b border-border flex flex-col gap-2">
         <div className="flex items-center">
            <ShieldAlert className="w-6 h-6 text-primary mr-2" />
            <span className="font-bold text-lg tracking-tight">Virtual CISO</span>
         </div>
         {/* Role Switcher (Visible for demo purposes) */}
         <div className="flex items-center gap-2 mt-4 bg-muted/50 p-2 rounded-md border border-border">
            <UserCircle className="w-4 h-4 text-muted-foreground" />
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value as Role)}
              className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer w-full text-foreground appearance-none"
            >
              <option value="CISO">CISO View</option>
              <option value="SOC_ANALYST">SOC Analyst View</option>
              <option value="AUDITOR">Auditor View</option>
              <option value="BOARD_MEMBER">Board View</option>
            </select>
         </div>
      </div>
        <div className="space-y-6 px-3">
          {filteredGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <h4 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {group.label}
              </h4>
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <Icon className={cn("mr-3 h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      <div className="p-4 border-t border-border mt-auto">
        {user ? (
          <div className="w-full">
            <div className="flex items-center mb-4">
              {user.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="ml-3 truncate">
                <p className="text-sm font-medium truncate">{user.displayName || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <button 
              onClick={signOut}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        ) : (
          <button 
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign in with Google
          </button>
        )}
      </div>
    </div>
  );
}
