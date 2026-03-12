import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { RiskChart } from "@/components/dashboard/RiskChart";
import { WhatNeedsAttention } from "@/components/dashboard/WhatNeedsAttention";

export default function Home() {
  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Real-time overview of your organizational security posture.
          </p>
        </div>
        
        <DashboardOverview />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="col-span-2 bg-card border border-border rounded-lg p-6 min-h-[400px]">
            <h3 className="text-lg font-semibold mb-4">Risk Over Time</h3>
            <div className="w-full h-full text-muted-foreground mt-4 pb-8">
              <RiskChart />
            </div>
          </div>
          <div className="col-span-1 min-h-[400px]">
            <WhatNeedsAttention />
          </div>
        </div>
      </div>
    </div>
  );
}
