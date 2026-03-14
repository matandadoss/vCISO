"use client";
import { fetchWithAuth } from "@/lib/api";

import { Activity, ShieldAlert, Target, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export function DashboardOverview() {
  const { getToken } = useAuth();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const token = await getToken();
        if (!token) {
          // Keep mock data if user isn't logged in yet for demonstration
          setData({
            overallRiskScore: 78,
            industryAverage: 62,
            riskBand: "needs_improvement",
            complianceScore: 65,
            openCriticalFindings: 12,
            openHighFindings: 45,
            threatLevel: "Elevated"
          });
          return;
        }

        const res = await fetchWithAuth("http://localhost:8000/api/v1/dashboard/summary?org_id=test-org", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        
        const summary = await res.json();
        setData({
          overallRiskScore: summary.overall_risk_score,
          industryAverage: summary.industry_average,
          riskBand: summary.risk_band,
          complianceScore: summary.compliance_score,
          openCriticalFindings: summary.open_critical_findings,
          openHighFindings: summary.open_high_findings,
          threatLevel: summary.threat_level
        });

      } catch (err: any) {
        console.error(err);
        setError(err.message);
      }
    }
    
    fetchData();
  }, [getToken]);

  if (error) return <div className="p-8 text-destructive">Error loading dashboard: {error}</div>;
  if (!data) return <div className="p-8">Loading dashboard summary...</div>;

  const getRiskBandColor = (band: string) => {
    switch(band) {
      case 'excellent': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'good': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'needs_improvement': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'critical': return 'text-destructive bg-destructive/10 border-destructive/20';
      default: return 'text-primary bg-primary/10 border-border';
    }
  };

  const getRiskBandText = (band: string) => {
    return band.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const riskBandStyles = data.riskBand ? getRiskBandColor(data.riskBand) : getRiskBandColor('');

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Link href="/findings" className={`block bg-card border ${riskBandStyles.split(' ')[2]} rounded-lg p-6 flex items-center justify-between hover:shadow-md transition-all cursor-pointer`}>
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Overall Risk Score</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${riskBandStyles.split(' ')[0]}`}>{data.overallRiskScore}</span>
            <span className="text-sm text-muted-foreground font-medium tracking-wide">/ 100</span>
          </div>
          {data.industryAverage && (
            <p className="text-xs text-muted-foreground mt-2">
              Industry Avg: {data.industryAverage} • <span className={`font-semibold ${riskBandStyles.split(' ')[0]}`}>{getRiskBandText(data.riskBand)}</span>
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${riskBandStyles.split(' ')[1]} ${riskBandStyles.split(' ')[0]}`}>
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
