"use client";
import { fetchWithAuth } from "@/lib/api";

import { useEffect, useState } from "react";
import { Building, ShieldCheck, Zap, Database, Check } from "lucide-react";
import { toast } from "sonner";

export default function SubscriptionPage() {
  const [tier, setTier] = useState<string>("professional");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/organizations/test-org`)
      .then(res => res.json())
      .then(data => {
        if (data.subscription_tier) setTier(data.subscription_tier);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch org", err);
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

  const tiers = [
    { 
      id: "basic", 
      name: "Basic", 
      description: "Essential manual risk assessment.",
      features: ["Manual infrastructure diagramming", "Manual compliance tracking", "Weekly threat digests"],
      icon: Database 
    },
    { 
      id: "professional", 
      name: "Professional", 
      description: "Basic real-time visibility.",
      features: ["Basic real-time cloud sync", "Standard What-If simulations", "Daily threat alerts"],
      icon: ShieldCheck 
    },
    { 
      id: "enterprise", 
      name: "Enterprise", 
      description: "Advanced contextual analytics.",
      features: ["Advanced real-time correlation", "Complex Hindsight simulations", "Automated compliance evidence"],
      icon: Zap 
    },
    { 
      id: "elite", 
      name: "Elite", 
      description: "Full automated platform capabilities.",
      features: ["Full real-time correlation graphs", "Automated AI remediation", "Continuous Red Teaming"],
      icon: Building 
    },
  ];

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
           {tiers.map((t) => (
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
                  <t.icon className="w-6 h-6" />
                </div>
                
                <h3 className={`text-xl font-bold tracking-tight mb-2 ${tier === t.id ? 'text-foreground' : 'text-foreground/80'}`}>
                  {t.name}
                </h3>
                
                <p className="text-sm text-muted-foreground mb-6 min-h-[40px]">
                  {t.description}
                </p>
                
                <div className="mt-auto space-y-3 pt-4 border-t border-border">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Includes:</p>
                  {t.features.map((feature, idx) => (
                    <div key={idx} className="flex flex-start gap-2">
                       <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                       <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
           ))}
        </div>
      </div>
    </div>
  );
}
