"use client";

import React, { useState } from "react";
import { X, Send, Users, CheckCircle } from "lucide-react";

interface InviteTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBail: () => void;
}

export default function InviteTeamModal({ isOpen, onClose, onBail }: InviteTeamModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Admin");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("sending");
    
    // Simulate API call to send invite
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setStatus("success");
    setEmail("");
  };

  const handleBail = () => {
    onClose();
    onBail();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
               <Users className="w-5 h-5 text-primary" />
             </div>
             <div>
               <h3 className="text-lg font-bold">Invite Colleague</h3>
               <p className="text-xs text-muted-foreground">Collaborate on the platform setup</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6">
          {status === "success" ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 flex flex-col items-center text-center">
               <CheckCircle className="w-12 h-12 text-emerald-500 mb-3" />
               <h4 className="font-bold text-foreground">Invitation Sent!</h4>
               <p className="text-sm text-muted-foreground mt-2">
                 They will receive an email shortly with instructions to join the workspace.
               </p>
               <button
                  onClick={() => setStatus("idle")}
                  className="mt-6 text-sm text-primary hover:underline font-medium"
               >
                 Send another invite
               </button>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                  placeholder="colleague@company.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Permissions Role</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="Admin">Administrator</option>
                  <option value="Editor">Editor (Read/Write)</option>
                  <option value="Viewer">Viewer (Read Only)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={status === "sending" || !email}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                 <Send className="w-4 h-4" />
                 {status === "sending" ? "Sending..." : "Send Invitation"}
              </button>
            </form>
          )}

          <div className="mt-8 pt-4 border-t border-border flex flex-col text-center">
             <p className="text-xs text-muted-foreground mb-3">
               Can't finish setup right now? You can skip the remaining steps and let your team handle it.
             </p>
             <button
               onClick={handleBail}
               className="py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
             >
               Skip straight to the dashboard
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
