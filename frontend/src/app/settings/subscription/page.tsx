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
  const [isDowngradeModalOpen, setIsDowngradeModalOpen] = useState(false);
  const [targetTier, setTargetTier] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"card" | "ach" | "apple_pay" | "google_pay">("card");
  const [agreedToPayment, setAgreedToPayment] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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

    const currentTierObj = pricingTiers.find(t => t.id === tier);
    const newTierObj = pricingTiers.find(t => t.id === newTier);

    if (currentTierObj && newTierObj && newTierObj.monthlyPrice < currentTierObj.monthlyPrice) {
      setIsDowngradeModalOpen(true);
    } else {
      setIsCheckoutModalOpen(true);
    }
  };

  const processFluidpayCheckout = async () => {
    if (!targetTier) return;
    setIsProcessingPayment(true);
    
    // In production, Fluidpay.js would generate this secure PCI-compliant token
    const secureMockToken = isDowngradeModalOpen ? "" : "tok_fluidpay_vault_auth_xyz123";
    
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/billing/checkout`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ 
           tier_id: targetTier,
           payment_token: secureMockToken,
           payment_method: selectedPaymentMethod 
         })
      });
      
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setTier(targetTier);
        toast.success(data.detail || `Successfully changed subscription to ${targetTier.toUpperCase()}`);
        setIsCheckoutModalOpen(false);
        setIsDowngradeModalOpen(false);
      } else {
        toast.error(data.detail || "Transaction declined by the gateway.");
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-lg p-6 rounded-xl border border-border shadow-lg flex flex-col max-h-[90vh]">
             <h2 className="text-xl font-bold mb-2">Secure Checkout</h2>
             <p className="text-sm text-muted-foreground mb-6">
               You are upgrading your organization to the <strong>{targetTier.toUpperCase()}</strong> tier capability.
             </p>
             
             {/* Payment Method Selector */}
             <div className="flex bg-muted/50 p-1 rounded-lg mb-6 border border-border/50 flex-wrap gap-1">
               {(["card", "ach", "apple_pay", "google_pay"] as const).map(method => (
                 <button
                   key={method}
                   onClick={() => setSelectedPaymentMethod(method)}
                   className={`flex-1 min-w-[100px] text-xs font-semibold py-2 px-3 rounded-md transition-all ${
                     selectedPaymentMethod === method 
                     ? 'bg-background shadow-sm border border-border/80 text-foreground' 
                     : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                   }`}
                 >
                   {method === "card" && "Credit Card"}
                   {method === "ach" && "Bank Transfer"}
                   {method === "apple_pay" && "Apple Pay"}
                   {method === "google_pay" && "Google Pay"}
                 </button>
               ))}
             </div>

             {/* Dynamic FluidPay PCI Simulator UI */}
             <div className="flex-1 overflow-y-auto pr-2 mb-6">
               <div className="p-5 bg-muted/20 rounded-xl border border-border">
                  <div className="flex justify-between items-center mb-4">
                     <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">FluidPay Secure Vaulting</span>
                     <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  </div>

                  {selectedPaymentMethod === "card" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground ml-1">Card Number</label>
                        <div className="w-full h-10 bg-background border border-border rounded flex items-center px-3 opacity-80 shadow-sm">
                           <span className="text-sm text-foreground tracking-widest">•••• •••• •••• 4242</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground ml-1">Expiry</label>
                          <div className="w-full h-10 bg-background border border-border rounded flex items-center px-3 opacity-80 shadow-sm">
                             <span className="text-sm text-foreground tracking-widest">12 / 28</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground ml-1">CVC</label>
                          <div className="w-full h-10 bg-background border border-border rounded flex items-center px-3 opacity-80 shadow-sm">
                             <span className="text-sm text-foreground tracking-widest">•••</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground ml-1">ZIP / Postal Code</label>
                        <div className="w-full h-10 bg-background border border-border rounded flex items-center px-3 opacity-80 shadow-sm">
                           <span className="text-sm text-foreground tracking-widest">90210</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedPaymentMethod === "ach" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs p-3 rounded-md mb-4 flex items-start gap-2">
                        <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>ACH transfers map directly to Plaid / Fluidpay backend verification routines. This requires up to 3 days to officially settle funds.</span>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground ml-1">Routing Number</label>
                        <div className="w-full h-10 bg-background border border-border rounded flex items-center px-3 opacity-80 shadow-sm">
                           <span className="text-sm text-foreground tracking-widest">110000000</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground ml-1">Account Number</label>
                        <div className="w-full h-10 bg-background border border-border rounded flex items-center px-3 opacity-80 shadow-sm">
                           <span className="text-sm text-foreground tracking-widest">000123456789</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedPaymentMethod === "apple_pay" && (
                     <div className="flex flex-col items-center justify-center py-6 animate-in fade-in zoom-in-95 duration-300 space-y-4">
                       <p className="text-sm text-muted-foreground text-center px-4">Secure biometric checkout mapped natively through macOS / iOS Apple Wallet payloads.</p>
                       <div className="w-full max-w-[240px] h-12 bg-foreground rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:opacity-90 transition-opacity">
                          <span className="text-background font-semibold text-lg"> Pay</span>
                       </div>
                     </div>
                  )}

                  {selectedPaymentMethod === "google_pay" && (
                     <div className="flex flex-col items-center justify-center py-6 animate-in fade-in zoom-in-95 duration-300 space-y-4">
                       <p className="text-sm text-muted-foreground text-center px-4">Fast and secure checkout via Google Wallet and Chrome saved cards.</p>
                       <div className="w-full max-w-[240px] h-12 bg-white rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:opacity-90 transition-opacity border border-gray-200">
                          {/* Emulating standard Google Pay button styling */}
                          <span className="text-gray-800 font-semibold text-lg flex items-center gap-1">
                            <span className="text-blue-500">G</span><span className="text-red-500">o</span><span className="text-yellow-500">o</span><span className="text-blue-500">g</span><span className="text-green-500">l</span><span className="text-red-500">e</span> Pay
                          </span>
                       </div>
                     </div>
                  )}
               </div>
             </div>

             {/* Payment Authorization */}
             <div className="bg-muted/30 border border-border rounded-lg p-4 mb-6 space-y-3">
               <p className="text-xs text-muted-foreground font-medium mb-3">
                 By proceeding, you authorize SKPR.ai to securely vault your payment method and automatically charge the selected amount each month for this subscription tier.
               </p>
               <div className="flex items-start gap-3">
                 <input 
                   type="checkbox" 
                   id="payment-agreement"
                   checked={agreedToPayment}
                   onChange={(e) => setAgreedToPayment(e.target.checked)}
                   className="mt-1 flex-shrink-0" 
                 />
                 <label htmlFor="payment-agreement" className="text-sm text-foreground/90 cursor-pointer">
                   I have read and agree to the <a href="#" className="text-primary hover:underline">Payment Processing Agreement</a>.
                 </label>
               </div>
               <div className="flex items-start gap-3">
                 <input 
                   type="checkbox" 
                   id="terms-of-service"
                   checked={agreedToTerms}
                   onChange={(e) => setAgreedToTerms(e.target.checked)}
                   className="mt-1 flex-shrink-0" 
                 />
                 <label htmlFor="terms-of-service" className="text-sm text-foreground/90 cursor-pointer">
                   I have read and agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Terms of Service</a>.
                 </label>
               </div>
             </div>

             <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button 
                  onClick={() => setIsCheckoutModalOpen(false)}
                  disabled={isProcessingPayment}
                  className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors text-muted-foreground"
                >
                  Cancel
                </button>
                <button 
                  onClick={processFluidpayCheckout}
                  disabled={isProcessingPayment || (selectedPaymentMethod === "apple_pay" || selectedPaymentMethod === "google_pay") || !agreedToPayment || !agreedToTerms}
                  className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                    isProcessingPayment || (selectedPaymentMethod === "apple_pay" || selectedPaymentMethod === "google_pay") || !agreedToPayment || !agreedToTerms
                    ? 'bg-primary/50 text-white cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm'
                  }`}
                  style={selectedPaymentMethod === "apple_pay" || selectedPaymentMethod === "google_pay" ? { display: 'none' } : {}}
                >
                  {isProcessingPayment && <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />}
                  {isProcessingPayment 
                    ? "Vaulting & Processing..." 
                    : selectedPaymentMethod === "ach" ? "Authorize ACH Transfer" : "Authorize Secure Payment"}
                </button>
                
                {selectedPaymentMethod === "apple_pay" && !isProcessingPayment && (
                  <button 
                    onClick={processFluidpayCheckout}
                    disabled={!agreedToPayment || !agreedToTerms}
                    className={`px-5 py-2 w-full max-w-[200px] h-10 text-background text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      !agreedToPayment || !agreedToTerms ? 'bg-foreground/50 cursor-not-allowed' : 'bg-foreground'
                    }`}
                  >
                    Pay with  Pay
                  </button>
                )}

                {selectedPaymentMethod === "google_pay" && !isProcessingPayment && (
                  <button 
                    onClick={processFluidpayCheckout}
                    disabled={!agreedToPayment || !agreedToTerms}
                    className={`px-5 py-2 w-full max-w-[200px] h-10 border text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm ${
                      !agreedToPayment || !agreedToTerms ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' : 'bg-white border-gray-200 text-gray-800'
                    }`}
                  >
                    <span className="text-blue-500">G</span><span className="text-red-500">o</span><span className="text-yellow-500">o</span><span className="text-blue-500">g</span><span className="text-green-500">l</span><span className="text-red-500">e</span> Pay
                  </button>
                )}
             </div>
          </div>
        </div>
      )}

      {isDowngradeModalOpen && targetTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md p-6 rounded-xl border border-border shadow-lg">
             <h2 className="text-xl font-bold mb-2 text-foreground">Confirm Subscription Downgrade</h2>
             <p className="text-sm text-muted-foreground mb-6">
               You are about to downgrade your organization to the <strong>{targetTier.toUpperCase()}</strong> tier capability.
             </p>
             
             <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-lg mb-8 space-y-2">
               <p className="font-semibold mb-1">Warning: Loss of Platform Features</p>
               <p>By executing this downgrade, you will immediately lose access to advanced correlation engines, real-time remediation flows, and potentially exceed your active user maximums.</p>
               <p className="text-xs opacity-80 mt-2 italic">Note: Zero funds will be explicitly charged during this parameter swap.</p>
             </div>

             <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setIsDowngradeModalOpen(false)}
                  disabled={isProcessingPayment}
                  className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors text-muted-foreground"
                >
                  Cancel
                </button>
                <button 
                  onClick={processFluidpayCheckout}
                  disabled={isProcessingPayment}
                  className="px-5 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  {isProcessingPayment && <div className="w-4 h-4 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />}
                  {isProcessingPayment ? "Downgrading..." : "Confirm Downgrade"}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
