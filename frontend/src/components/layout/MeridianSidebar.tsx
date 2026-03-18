"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function MeridianSidebar() {
  const pathname = usePathname();
  const [focusMode, setFocusMode] = useState("risk");

  return (
    <div className="hidden md:flex flex-col h-full bg-surface-deep border-r border-border-default p-4 z-20 overflow-y-auto">
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
        <input 
          className="w-full h-8 pl-9 pr-3 rounded-md bg-surface-card border border-border-default text-xs focus:outline-none focus:border-border-strong text-text-primary placeholder:text-text-dim transition-colors"
          placeholder="Search suppliers, risks..." 
        />
      </div>

      <div className="flex flex-col gap-1 mb-6">
        <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-3">Critical suppliers</div>
        <Link href="/workflows/supply-chain?supplier=CX" className="flex items-center gap-2.5 p-2 rounded-md border border-border-default bg-surface-card hover:border-border-strong transition-colors mb-1.5 group cursor-pointer focus:outline-none">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 bg-semantic-critical-soft text-semantic-critical-text">CX</div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate">CoreAxis Payments</div>
            <div className="text-[11px] text-text-tertiary font-light">Payment processing</div>
          </div>
          <div className="text-xs font-mono font-medium text-semantic-critical">D+</div>
        </Link>
        <Link href="/workflows/supply-chain?supplier=NP" className="flex items-center gap-2.5 p-2 rounded-md border border-border-default bg-surface-card hover:border-border-strong transition-colors mb-1.5 group cursor-pointer focus:outline-none">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 bg-semantic-warning-soft text-semantic-warning-text">NP</div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate">NorthPoint Cloud</div>
            <div className="text-[11px] text-text-tertiary font-light">Infrastructure (IaaS)</div>
          </div>
          <div className="text-xs font-mono font-medium text-semantic-warning">C</div>
        </Link>
        <Link href="/workflows/supply-chain?supplier=DV" className="flex items-center gap-2.5 p-2 rounded-md border border-border-default bg-surface-card hover:border-border-strong transition-colors mb-1.5 group cursor-pointer focus:outline-none">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 bg-semantic-success-soft text-semantic-success-text">DV</div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate">DataVault Analytics</div>
            <div className="text-[11px] text-text-tertiary font-light">Data analytics</div>
          </div>
          <div className="text-xs font-mono font-medium text-semantic-success">B+</div>
        </Link>
        <Link href="/workflows/supply-chain?supplier=QL" className="flex items-center gap-2.5 p-2 rounded-md border border-border-default bg-surface-card hover:border-border-strong transition-colors mb-1.5 group cursor-pointer focus:outline-none">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 bg-semantic-success-soft text-semantic-success-text">QL</div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate">QuantumLeap AI</div>
            <div className="text-[11px] text-text-tertiary font-light">ML model provider</div>
          </div>
          <div className="text-xs font-mono font-medium text-semantic-success">B</div>
        </Link>
        <Link href="/workflows/supply-chain?supplier=FR" className="flex items-center gap-2.5 p-2 rounded-md border border-border-default bg-surface-card hover:border-border-strong transition-colors mb-0 group cursor-pointer focus:outline-none">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 bg-accent-blue-soft text-accent-blue-text">FR</div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate">FortressReach</div>
            <div className="text-[11px] text-text-tertiary font-light">Managed SOC</div>
          </div>
          <div className="text-xs font-mono font-medium text-accent-blue-text">A-</div>
        </Link>
      </div>

      <div className="flex flex-col gap-1 mb-6">
        <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-3">Active risk outcomes</div>
        <div className="flex items-center justify-between text-[13px] py-1.5 px-2 rounded-md transition-colors font-medium border border-transparent bg-surface-hover cursor-pointer group">
          <div className="w-1.5 h-1.5 rounded-full mr-2.5 bg-semantic-critical shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
          <span className="truncate flex-1">CoreAxis IAM gaps</span>
          <span className="text-[10px] uppercase tracking-wider font-bold ml-2 text-semantic-critical">Crit</span>
        </div>
        <div className="flex items-center justify-between text-[13px] py-1.5 px-2 rounded-md transition-colors font-medium text-text-secondary hover:bg-surface-hover border border-transparent cursor-pointer group">
          <div className="w-1.5 h-1.5 rounded-full mr-2.5 bg-semantic-warning group-hover:shadow-[0_0_8px_rgba(234,179,8,0.5)]"></div>
          <span className="truncate flex-1">NorthPoint data residency</span>
          <span className="text-[10px] uppercase tracking-wider font-bold ml-2 text-semantic-warning">High</span>
        </div>
        <div className="flex items-center justify-between text-[13px] py-1.5 px-2 rounded-md transition-colors font-medium text-text-secondary hover:bg-surface-hover border border-transparent cursor-pointer group">
          <div className="w-1.5 h-1.5 rounded-full mr-2.5 bg-semantic-info group-hover:shadow-[0_0_8px_rgba(139,92,246,0.5)]"></div>
          <span className="truncate flex-1">QuantumLeap model gov</span>
          <span className="text-[10px] uppercase tracking-wider font-bold ml-2 text-text-dim">New</span>
        </div>
      </div>

      <div className="mt-auto p-3.5 bg-surface-card rounded-xl border border-border-default">
        <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-2">Focus mode</div>
        <div className="flex flex-wrap gap-1">
          {['Risk mgmt', 'Onboarding', 'Incident', 'Audit prep'].map(mode => (
             <button 
               key={mode}
               onClick={() => setFocusMode(mode.toLowerCase())}
               className={`px-2.5 py-1.5 rounded-full text-[11px] border bg-transparent font-medium transition-colors cursor-pointer ${
                 focusMode === mode.toLowerCase() 
                 ? "bg-text-primary text-surface-deep border-transparent hover:opacity-90" 
                 : "border-border-default text-text-tertiary hover:border-border-strong hover:text-text-secondary"
               }`}
             >
               {mode}
             </button>
          ))}
        </div>
      </div>
    </div>
  );
}
