"use client";

import { Activity, ShieldAlert, Target, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

export function DashboardOverview() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // In a real app this would call /api/v1/dashboard/summary
    setData({
      overallRiskScore: 78,
      complianceScore: 65,
      openCriticalFindings: 12,
      openHighFindings: 45,
      threatLevel: "Elevated"
    });
  }, []);

  if (!data) return <div className="p-8">Loading dashboard summary...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Link href="/findings" className="block bg-card border border-border rounded-lg p-6 flex items-center justify-between hover:shadow-md hover:border-primary/50 transition-all cursor-pointer">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Overall Risk Score</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{data.overallRiskScore}</span>
            <span className="text-sm text-yellow-500 font-medium tracking-wide">/ 100</span>
          </div>
        </div>
        <div className="p-3 bg-primary/10 rounded-full text-primary">
          <Activity className="w-6 h-6" />
        </div>
      </Link>
      
      <Link href="/compliance" className="block bg-card border border-border rounded-lg p-6 flex items-center justify-between hover:shadow-md hover:border-primary/50 transition-all cursor-pointer">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Compliance Posture</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{data.complianceScore}%</span>
          </div>
        </div>
        <div className="p-3 bg-primary/10 rounded-full text-primary">
          <ShieldAlert className="w-6 h-6" />
        </div>
      </Link>

      <Link href="/findings?severity=critical&status=new" className="block bg-card border border-destructive/20 rounded-lg p-6 flex items-center justify-between hover:shadow-md hover:border-destructive/50 transition-all cursor-pointer">
        <div>
          <p className="text-sm font-medium text-destructive mb-1">Critical Findings</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-destructive">{data.openCriticalFindings}</span>
          </div>
        </div>
        <div className="p-3 bg-destructive/10 rounded-full text-destructive">
          <AlertTriangle className="w-6 h-6" />
        </div>
      </Link>

      <Link href="/threat-intel" className="block bg-card border border-border rounded-lg p-6 flex items-center justify-between hover:shadow-md hover:border-primary/50 transition-all cursor-pointer">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Threat Level</p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-orange-500">{data.threatLevel}</span>
          </div>
        </div>
        <div className="p-3 bg-orange-500/10 rounded-full text-orange-500">
          <Target className="w-6 h-6" />
        </div>
      </Link>
    </div>
  );
}
