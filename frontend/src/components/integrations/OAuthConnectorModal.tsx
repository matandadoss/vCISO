"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Fingerprint, RefreshCw, CheckCircle2, Cloud, Database } from "lucide-react";
import { cn } from "@/lib/utils";

export default function OAuthConnectorModal({ 
  isOpen, 
  onClose, 
  idpName, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  idpName: string;
  onSuccess: (idp: string) => void;
}) {
  const [step, setStep] = useState<'idle' | 'requesting' | 'authenticating' | 'syncing' | 'success'>('idle');

  useEffect(() => {
    if (isOpen) setStep('idle');
  }, [isOpen, idpName]);

  const startHandshake = async () => {
    setStep('requesting');
    await new Promise(r => setTimeout(r, 1500));
    setStep('authenticating');
    await new Promise(r => setTimeout(r, 2000));
    setStep('syncing');
    await new Promise(r => setTimeout(r, 2500));
    setStep('success');
    await new Promise(r => setTimeout(r, 1200));
    onSuccess(idpName);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden w-full max-w-md relative"
        >
          {/* Header */}
          <div className="bg-muted/30 p-6 border-b border-border flex flex-col items-center">
             <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20 shadow-inner">
                <Database className="w-8 h-8 text-primary" />
             </div>
             <h2 className="text-xl font-bold text-foreground text-center">Connect {idpName}</h2>
             <p className="text-sm text-muted-foreground text-center mt-1">Authenticate to synchronize shadow IT applications and vendor supply chains.</p>
          </div>

          <div className="p-8">
            {step === 'idle' && (
              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-3 w-full bg-muted/40 p-4 rounded-xl border border-border/50">
                   <Shield className="w-5 h-5 text-muted-foreground" />
                   <p className="text-xs text-muted-foreground leading-relaxed">
                     By connecting, vCISO will request <strong>read-only access</strong> to directory integrations, OAuth tokens, and provisioned SAML metadata to exclusively extract vendor domains.
                   </p>
                </div>
                
                <div className="flex gap-3 w-full">
                  <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                  <button onClick={startHandshake} className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    <Fingerprint className="w-4 h-4" /> Grant Access
                  </button>
                </div>
              </div>
            )}

            {step !== 'idle' && (
              <div className="flex flex-col items-center py-6 min-h-[200px] justify-center space-y-8">
                 <div className="relative">
                    {step === 'success' ? (
                       <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border-4 border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.3)] animate-in zoom-in duration-300">
                          <CheckCircle2 className="w-10 h-10 text-green-500" />
                       </div>
                    ) : (
                       <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border-4 border-primary/20 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                          <RefreshCw className={cn("w-10 h-10 text-primary", "animate-spin")} />
                       </div>
                    )}
                 </div>

                 <div className="text-center space-y-2">
                    <h3 className="font-bold text-foreground text-lg animate-pulse">
                      {step === 'requesting' && `Reaching out to ${idpName}...`}
                      {step === 'authenticating' && "Negotiating OAuth Handshake..."}
                      {step === 'syncing' && "Extracting SAML Definitions..."}
                      {step === 'success' && "Synchronization Complete!"}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      {step === 'requesting' && "Establishing secure TLS connection..."}
                      {step === 'authenticating' && "Exchanging tokens via vCISO Gateway..."}
                      {step === 'syncing' && "Parsing multi-tenant directory objects..."}
                      {step === 'success' && "Closing connection."}
                    </p>
                 </div>
                 
                 <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden mt-4">
                    <motion.div 
                       initial={{ width: "0%" }}
                       animate={{ 
                         width: step === 'requesting' ? "30%" : 
                                step === 'authenticating' ? "60%" : 
                                step === 'syncing' ? "95%" : "100%" 
                       }}
                       transition={{ duration: 0.5 }}
                       className={cn("h-full", step === 'success' ? "bg-green-500" : "bg-primary")}
                    />
                 </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
