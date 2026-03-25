import os

path = "c:/Users/matan/iCloudDrive/vCISO/frontend/src/app/settings/integrations/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

injection = """         {/* Shadow IT & Vendor Discovery Section (IdP Sync) */}
         <div className="mb-8">
            <h2 className="text-xl font-bold flex items-center gap-3 mb-4 text-foreground">
               <EyeOff className="w-5 h-5 text-purple-500" /> Shadow IT & Vendor Discovery
            </h2>
            <p className="text-sm text-muted-foreground mb-6">Connect your organization's primary Identity Provider (IdP) or Single Sign-On broker to automatically detect third-party vendors, suppliers, and hidden shadow IT across your employees' web activity.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {Object.entries(idpStatus).map(([name, status]) => (
                  <div key={name} className={cn(
                    "border rounded-xl p-6 flex flex-col transition-all relative overflow-hidden",
                    status.connected ? "bg-purple-500/5 border-purple-500/30" : "bg-card border-border hover:border-primary/50"
                  )}>
                     {status.connected && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-primary"></div>}
                     <div className="flex items-center gap-4 mb-5">
                       <div className={cn(
                          "w-12 h-12 rounded-lg flex items-center justify-center border",
                          status.connected ? "bg-background border-purple-500/30 shadow-inner" : "bg-muted border-border/50"
                       )}>
                          <Database className={cn("w-6 h-6", status.connected ? "text-purple-500" : "text-muted-foreground")} />
                       </div>
                       <div>
                          <h3 className="font-bold text-foreground">{name}</h3>
                          <span className={cn(
                             "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded",
                             status.connected ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"
                          )}>
                             {status.connected ? "Sync Active" : "Identity Provider"}
                          </span>
                       </div>
                     </div>
                     
                     {status.connected ? (
                        <div className="flex-1 bg-background border border-border rounded-lg p-3 flex flex-col justify-center items-center gap-1 mb-4">
                           <span className="text-2xl font-black text-foreground">{status.count}</span>
                           <span className="text-xs text-muted-foreground font-medium text-center">Software Vendors Detected</span>
                        </div>
                     ) : (
                        <p className="text-sm text-muted-foreground flex-1 mb-6">Authorize secure OAuth handover to continuously audit SAML assignments and active directory domains.</p>
                     )}
                     
                     <button 
                       onClick={() => !status.connected && setAuthModal({ open: true, idp: name })}
                       disabled={status.connected}
                       className={cn(
                         "w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all",
                         status.connected ? "bg-muted/50 text-muted-foreground border border-border cursor-not-allowed" : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                       )}
                     >
                       {status.connected ? <><CheckCircle2 className="w-4 h-4 text-green-500" /> Monitored</> : "Authenticate via OAuth"}
                     </button>
                  </div>
               ))}
            </div>
         </div>

         <div className="flex items-center gap-3 mb-4 mt-12 w-full border-b border-border pb-4">
            <Plug className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">Standard Integrations</h2>
         </div>

"""

if "Shadow IT & Vendor Discovery Section" not in text:
    text = text.replace("{loading ? (", injection + "         {loading ? (")

modal_injection = """
      <OAuthConnectorModal 
        isOpen={authModal.open}
        onClose={() => setAuthModal({ open: false, idp: "" })}
        idpName={authModal.idp}
        onSuccess={handleIdpSuccess}
      />
"""

if "OAuthConnectorModal" not in text:
    # Handle windows and unix end lines
    if "    </div>\r\n  );\r\n}" in text:
        text = text.replace("    </div>\r\n  );\r\n}", modal_injection + "    </div>\r\n  );\r\n}")
    else:
        text = text.replace("    </div>\n  );\n}", modal_injection + "    </div>\n  );\n}")

with open(path, "w", encoding="utf-8") as f:
    f.write(text)

print("Patch applied successfully.")
