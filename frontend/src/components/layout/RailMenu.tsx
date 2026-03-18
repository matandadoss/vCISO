"use client";

import { Bell, Command, Search, Target, Shield, FileText, Settings, ShieldAlert, LineChart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function RailMenu() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="rail">
      <Link href="/" className="rail__logo">
        <ShieldAlert className="w-5 h-5 text-white" />
      </Link>
      
      <Link href="/" className={`rail__btn ${isActive("/") ? "rail__btn--active" : ""}`} title="Command">
        <Command className="w-5 h-5" />
      </Link>
      
      <Link href="/workflows/supply-chain" className={`rail__btn ${isActive("/workflows/supply-chain") ? "rail__btn--active" : ""}`} title="Supply Chain">
        <LineChart className="w-5 h-5" />
        <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 rounded-full text-[9px] font-bold flex items-center justify-center px-1 bg-semantic-critical text-white">
          6
        </span>
      </Link>

      <Link href="/workflows/threat" className={`rail__btn ${isActive("/workflows/threat") ? "rail__btn--active" : ""}`} title="Threat Intel">
        <Target className="w-5 h-5" />
        <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 rounded-full text-[9px] font-bold flex items-center justify-center px-1 bg-semantic-warning text-black">
          3
        </span>
      </Link>

      <Link href="/workflows/compliance" className={`rail__btn ${isActive("/workflows/compliance") ? "rail__btn--active" : ""}`} title="Governance">
        <Shield className="w-5 h-5" />
      </Link>

      <Link href="/reporting" className={`rail__btn ${isActive("/reporting") ? "rail__btn--active" : ""}`} title="Reporting">
        <FileText className="w-5 h-5" />
      </Link>
      
      <div className="flex-1" />
      
      <Link href="/settings" className={`rail__btn ${isActive("/settings") ? "rail__btn--active" : ""}`} title="Settings">
        <Settings className="w-5 h-5" />
      </Link>
    </div>
  );
}
