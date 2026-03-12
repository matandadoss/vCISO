import { DashboardOverview } from "@/components/dashboard/DashboardOverview";

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
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              [Chart Component Placeholder]
            </div>
          </div>
          <div className="col-span-1 bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Top AI Insights</h3>
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 rounded-md border border-primary/20">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Contextual Correlation:</span> 3 critical vulnerabilities are exposed on assets that have administrative access to production GCP projects. It is recommended to sever this IAM link immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
