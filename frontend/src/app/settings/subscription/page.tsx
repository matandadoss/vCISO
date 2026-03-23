"use client";
import { fetchWithAuth } from "@/lib/api";

import { useEffect, useState } from "react";
import { Building, ShieldCheck, Zap, Database, Check } from "lucide-react";
import { toast } from "sonner";

export default function SubscriptionPage() {
  const [tier, setTier] = useState<string>("professional");
  const [pricingTiers, setPricingTiers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [targetTier, setTargetTier] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

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

  const initiateCheckout = (newTier: string) => {
    if (newTier === tier) return; // Already on this tier
    setTargetTier(newTier);
    setIsCheckoutModalOpen(true);
  };

  const processFluidpayCheckout = async () => {
    if (!targetTier) return;
    setIsProcessingPayment(true);
    
    // In production, Fluidpay.js would generate this secure PCI-compliant token
    const secureMockToken = "tok_fluidpay_vault_auth_xyz123";
    
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/billing/checkout`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ 
           tier_id: targetTier,
           payment_token: secureMockToken 
         })
      });
      
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setTier(targetTier);
        toast.success(data.detail || `Successfully upgraded to ${targetTier.toUpperCase()}`);
        setIsCheckoutModalOpen(false);
      } else {
        toast.error(data.detail || "Payment declined by the gateway.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to process transaction securely.");
    } finally {
      setIsProcessingPayment(false);
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
                onClick={() => initiateCheckout(t.id)}
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

      {isCheckoutModalOpen && targetTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md p-6 rounded-xl border border-border shadow-lg m-4">
             <h2 className="text-xl font-bold mb-2">Secure Checkout</h2>
             <p className="text-sm text-muted-foreground mb-6">
               You are upgrading your organization to the <strong>{targetTier.toUpperCase()}</strong> tier capability.
             </p>
             
             {/* FluidPay PCI Simulator UI */}
             <div className="space-y-4 mb-8 p-4 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">FluidPay Secure Vaulting</span>
                   <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground ml-1">Card Number</label>
                  <div className="w-full h-10 bg-background border border-border rounded flex items-center px-3 opacity-60">
                     <span className="text-sm text-foreground tracking-widest">•••• •••• •••• 4242</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground ml-1">Expiry</label>
                    <div className="w-full h-10 bg-background border border-border rounded flex items-center px-3 opacity-60">
                       <span className="text-sm text-foreground tracking-widest">12 / 28</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground ml-1">CVC</label>
                    <div className="w-full h-10 bg-background border border-border rounded flex items-center px-3 opacity-60">
                       <span className="text-sm text-foreground tracking-widest">•••</span>
                    </div>
                  </div>
                </div>
             </div>

             <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setIsCheckoutModalOpen(false)}
                  disabled={isProcessingPayment}
                  className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors text-muted-foreground"
                >
                  Cancel
                </button>
                <button 
                  onClick={processFluidpayCheckout}
                  disabled={isProcessingPayment}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {isProcessingPayment && <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />}
                  {isProcessingPayment ? "Vaulting & Processing..." : "Authorize Secure Payment"}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
