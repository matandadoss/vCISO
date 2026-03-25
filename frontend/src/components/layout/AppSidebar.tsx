"use client";

import { useState, useEffect } from "react";

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
  Building,
  Building2,
  UserCircle,
  FlaskConical,
  BookOpen,
  X,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Archive
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
    label: "",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard }, // All
    ]
  },
  {
    label: "Risk",
    items: [
      { href: "/risk-register", label: "Risk Register", icon: Archive, roles: ["CISO", "AUDITOR", "BOARD_MEMBER"] },
      { href: "/findings", label: "Findings", icon: ShieldAlert, roles: ["CISO", "SOC_ANALYST", "AUDITOR"] },
      { href: "/compliance", label: "Compliance", icon: Activity, roles: ["CISO", "AUDITOR", "BOARD_MEMBER"] },
      { href: "/vendor-risk", label: "Vendor Risk", icon: Building2, roles: ["CISO", "AUDITOR"] },
    ]
  },
  {
    label: "Threat Operations",
    items: [
      { href: "/threat-intel", label: "Threat Intel", icon: Target, roles: ["CISO", "SOC_ANALYST"] },
      { href: "/correlation", label: "Cyber Threat Analyzer", icon: Network, roles: ["CISO", "SOC_ANALYST"] },
      { href: "/simulator", label: "Security Testing", icon: FlaskConical, roles: ["CISO", "SOC_ANALYST"] },
    ]
  },
  {
    label: "Console",
    items: [
      { href: "/company", label: "My Company", icon: Building }, 
      { href: "/settings", label: "Control Panel", icon: Settings, roles: ["CISO"] },
      { href: "/guide", label: "User Guide", icon: BookOpen }, // All
    ]
  }
];

interface AppSidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export function AppSidebar({ mobileOpen = false, setMobileOpen }: AppSidebarProps) {
  const pathname = usePathname();
  const { role, setRole } = useRole();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/guide")) {
      setIsCollapsed(true);
    }
  }, [pathname]);

  const filteredGroups = NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => !item.roles || item.roles.includes(role))
  })).filter(group => group.items.length > 0);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen?.(false)}
        />
      )}
      
      <div className={cn(
        "flex flex-col border-r border-border bg-card text-card-foreground fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out md:relative md:translate-x-0 h-full",
        mobileOpen ? "translate-x-0 w-64" : "-translate-x-full",
        isCollapsed && !mobileOpen ? "md:w-20" : "md:w-64"
      )}>
        <div className="py-4 px-6 border-b border-border flex flex-col gap-2">
           <div className="flex items-center justify-between">
               <div className="flex items-center">
                 <ShieldAlert className={cn("text-primary min-w-[24px] transition-all", (!isCollapsed || mobileOpen) && "mr-2 w-6 h-6", isCollapsed && !mobileOpen && "w-7 h-7")} />
                 {(!isCollapsed || mobileOpen) && <span className="font-bold text-lg tracking-tight truncate">Virtual CISO</span>}
               </div>
               <div className="flex items-center gap-1">
                 <button 
                   className="hidden md:flex text-muted-foreground hover:text-foreground p-1 transition-colors relative group"
                   onClick={() => setIsCollapsed(!isCollapsed)}
                 >
                   <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                     {isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                   </div>
                   {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
                 </button>
                 <button 
                   className="md:hidden text-muted-foreground hover:text-foreground"
                   onClick={() => setMobileOpen?.(false)}
                 >
                   <X className="w-5 h-5" />
                 </button>
               </div>
            </div>
         {/* Role Switcher (Visible for demo purposes) */}
         <div className={cn("flex items-center gap-2 mt-4 bg-muted/50 p-2 rounded-md border border-border hover:bg-muted/80 transition-colors", isCollapsed && !mobileOpen && "justify-center p-2")}>
            <UserCircle className="w-4 h-4 text-muted-foreground min-w-[16px]" />
            {(!isCollapsed || mobileOpen) && (
               <select 
                 value={role} 
                 onChange={(e) => setRole(e.target.value as Role)}
                 className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer w-full text-foreground/80 hover:text-foreground appearance-none transition-colors"
               >
                 <option value="CISO" className="text-foreground bg-background">CISO View</option>
                 <option value="SOC_ANALYST" className="text-foreground bg-background">Security Team View</option>
                 <option value="AUDITOR" className="text-foreground bg-background">Auditor View</option>
                 <option value="BOARD_MEMBER" className="text-foreground bg-background">Board View</option>
               </select>
            )}
         </div>
      </div>
        <div className="space-y-6 px-3 flex-1 overflow-y-auto overflow-x-hidden thin-scrollbar pb-4">
          {filteredGroups.map((group, index) => (
            <div key={index} className="space-y-1">
              {(!isCollapsed || mobileOpen) ? (
                 group.label && (
                   <h4 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                     {group.label}
                   </h4>
                 )
              ) : (
                 group.label && (
                   <div className="w-full flex justify-center mb-2">
                      <div className="w-4 h-[1px] bg-border" />
                   </div>
                 )
              )}
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
                  
                  return (
                    <div key={item.href} className="relative group/navitem">
                       <Link
                         href={item.href}
                         onClick={() => setMobileOpen?.(false)}
                         className={cn(
                           "flex items-center py-2 text-sm font-medium rounded-md transition-colors",
                           isActive
                             ? "bg-primary/10 text-primary"
                             : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                           (!isCollapsed || mobileOpen) ? "px-3" : "justify-center"
                         )}
                       >
                         <Icon className={cn("h-5 w-5", (!isCollapsed || mobileOpen) ? "mr-3" : "", isActive ? "text-primary" : "text-muted-foreground")} />
                         {(!isCollapsed || mobileOpen) && <span className="truncate">{item.label}</span>}
                       </Link>
                       {/* Floating tooltip when collapsed */}
                       {isCollapsed && !mobileOpen && (
                          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1.5 bg-popover text-popover-foreground text-xs font-medium rounded shadow-md opacity-0 pointer-events-none group-hover/navitem:opacity-100 transition-opacity whitespace-nowrap z-50">
                             {item.label}
                          </div>
                       )}
                    </div>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
