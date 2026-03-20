"use client";

import { FileText, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/api";

interface ThreadEvent {
  time: string;
  title: string;
  text: string;
  state: "past" | "now" | "fut";
  artifacts?: string[];
  action?: string;
}

interface Narrative {
  id: string;
  title: string;
  status_text: string;
  status_color: string;
  threads: ThreadEvent[];
}

export default function ComplianceWorkflowPage() {
  const [data, setData] = useState<{ narratives: Narrative[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/meridian/governance`);
        if (res.ok) {
           const json = await res.json();
           setData(json);
        }
      } catch (err) {
        console.error("Failed to load governance data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);
  return (
    <div className="view on">
      <div className="stagger">
        
        {/* Page Header */}
        <div className="page-header flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
             <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="greeting" style={{fontSize: "24px"}}>Governance & <strong>Reporting</strong></div>
            <div className="ph-sub">Manage inherited regulatory exposure and prepare narrative-driven evidence packages for key stakeholders and governing bodies.</div>
          </div>
        </div>

        <div className="section-label">Active Regulatory Deliverables</div>

        {loading ? (
             <div className="p-8 text-center text-text-dim">Loading active deliverables...</div>
        ) : (
          data?.narratives?.map((narrative) => (
             <div key={narrative.id} className="ncard">
                <div className="ncard-l flex justify-between">
                   <span>{narrative.title}</span>
                   <span className={narrative.status_color}>{narrative.status_text}</span>
                </div>

                <div className="thread">
                   {narrative.threads.map((thread, idx) => (
                      <div key={idx} className={`tn ${thread.state !== 'now' ? 'dim' : ''}`}>
                         <div className={`td ${thread.state}`}>
                            {thread.state === 'past' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>}
                         </div>
                         <div className="t-time">{thread.time}</div>
                         <div className={`t-text ${thread.state === 'fut' ? 'text-text-dim' : ''}`}>
                            <strong>{thread.title}</strong> {thread.text}
                         </div>
                         
                         {/* Optional Artifacts / Attachments Block */}
                         {thread.artifacts && thread.artifacts.length > 0 && (
                            <div className="mt-4 p-4 border border-border-default rounded-md bg-surface-base">
                               <div className="text-sm font-medium mb-2">Required Artifacts for Submission:</div>
                               {thread.artifacts.map((art, aIdx) => (
                                  <div key={aIdx} className="flex items-center gap-3 text-sm text-text-secondary mb-2">
                                     {art.includes('Pending') ? (
                                        <div className="w-4 h-4 rounded-full border border-border-strong flex items-center justify-center text-[8px]"></div>
                                     ) : (
                                        <FileText className="w-4 h-4 text-green-500" />
                                     )}
                                     {art}
                                  </div>
                               ))}
                            </div>
                         )}

                         {/* Action Buttons */}
                         {(thread.state === 'now' || thread.action) && (
                            <div className="flex gap-2 mt-4">
                               <button className="btn btn--primary">{thread.action || "Draft Package"}</button>
                               {!thread.action && <button className="btn btn--ghost">Link Escalation Task</button>}
                            </div>
                         )}
                      </div>
                   ))}
                </div>
             </div>
          ))
        )}

      </div>
    </div>
  );
}
