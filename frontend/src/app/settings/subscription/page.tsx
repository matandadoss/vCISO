"use client";
import { fetchWithAuth } from "@/lib/api";

import { useEffect, useState } from "react";
import { Building, ShieldCheck, Zap, Database, Check } from "lucide-react";
import { toast } from "sonner";

export default function SubscriptionPage() {
  const [tier, setTier] = useState<string>("professional");
  const [pricingTiers, setPricingTiers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/organizations/test-org`)
      .then(res => res.json())
      .then(data => {
        if (data.subscription_tier) setTier(data.subscription_tier);
        return fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tiers`);
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
           setPricingTiers(data);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to load subscription data", err);
        setIsLoading(false);
      });
  }, []);

  const handleSave = async (newTier: string) => {
    setTier(newTier);
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/organizations/test-org`, {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ subscription_tier: newTier })
      });
      if (res.ok) {
        toast.success(`Subscription updated to ${newTier.toUpperCase()}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update subscription");
    }
  };

  const getIconForTier = (tierId: string) => {
    switch (tierId) {
      case "basic": return Database;
      case "professional": return ShieldCheck;
      case "enterprise": return Zap;
      case "elite": return Building;
      default: return ShieldCheck;
    }
  };

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading subscription details...</div>;

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Subscription & Service Tier</h1>
          <p className="text-muted-foreground">
            Manage your organization's subscription tier to unlock additional real-time capabilities across the platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {pricingTiers.map((t) => {
              const TierIcon = getIconForTier(t.id);
              return (
              <div 
                key={t.id}
                onClick={() => handleSave(t.id)}
                className={`relative flex flex-col p-6 rounded-xl border-2 transition-all cursor-pointer ${
                  tier === t.id 
                  ? 'border-primary bg-primary/5 shadow-md' 
                  : 'border-border hover:border-primary/50 bg-card hover:shadow-sm'
                }`}
              >
                {tier === t.id && (
                  <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground p-1 rounded-full shadow-sm">
                    <Check className="w-4 h-4" />
                  </div>
                )}
                
                <div className={`p-3 rounded-lg w-fit mb-4 ${tier === t.id ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <TierIcon className="w-6 h-6" />
                </div>
                
                <h3 className={`text-xl font-bold tracking-tight mb-2 ${tier === t.id ? 'text-foreground' : 'text-foreground/80'}`}>
                  {t.name}
                </h3>
                
                <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">
                  {t.description}
                </p>

                <div className="flex flex-col gap-1 mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">${t.monthlyPrice}</span>
                    <span className="text-sm text-muted-foreground">/mo base</span>
                  </div>
                  {(t.pricePerUser > 0 || t.id !== "basic") && (
                    <div className="text-sm font-medium text-accent-success/90">
                      + ${t.pricePerUser} per user /mo
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {t.maxUsers === "Unlimited" ? "Unlimited users allowed" : `Up to ${t.maxUsers} max users`}
                  </div>
                </div>
                
                <div className="mt-auto space-y-3 pt-4 border-t border-border">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Includes:</p>
                  {t.features.map((feature: string, idx: number) => (
                    <div key={idx} className="flex flex-start gap-2">
                       <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                       <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
           )})}
        </div>
      </div>
    </div>
  );
}
