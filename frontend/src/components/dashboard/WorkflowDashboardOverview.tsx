"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, ChevronDown, ChevronRight, MessageSquare, AlertTriangle, ShieldAlert } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";

export function WorkflowDashboardOverview() {
  const [expandedOutcomes, setExpandedOutcomes] = useState<Record<string, boolean>>({});
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/meridian/command`);
        if (res.ok) {
           const json = await res.json();
           setData(json);
        }
      } catch (err) {
        console.error("Failed to load command overview data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleOutcome = (id: string) => {
    setExpandedOutcomes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="view on">
      <div className="stagger">
        {/* Page Header */}
        <div className="page-header">
          <div className="greeting">Good afternoon, <strong>{data?.greeting_name || "Leader"}</strong></div>
          <div className="header-sub">{data?.sub_headline || "Calculating risk exposure..."}</div>
        </div>

        {/* Intent Bar */}
        <div className="intent-bar">
          <input className="intent-input" placeholder="What supply chain risk are you managing?" />
          <button className="intent-submit">
            <svg viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>

        {loading ? (
             <div className="p-8 text-center text-text-dim">Synchronizing with Meridian command...</div>
        ) : (
          <>
            {/* Cognitive Load */}
            <div className="cog-load">
              <div className="cog-load__ring">
                <svg viewBox="0 0 40 40">
                  <circle className="track" cx="20" cy="20" r="16" />
                  <circle className="fill" cx="20" cy="20" r="16" strokeDasharray="100.5" strokeDashoffset={data?.cognitive_load?.level === 'high' ? '20' : '45'} stroke={data?.cognitive_load?.level === 'low' ? '#22C55E' : '#EAB308'} />
                </svg>
                <span className="cog-load__ring-label">{data?.cognitive_load?.score || "0/5"}</span>
              </div>
              <div>
                <div className="cog-load__title">{data?.cognitive_load?.level === 'high' ? 'High' : data?.cognitive_load?.level === 'moderate' ? 'Moderate' : 'Low'} cognitive load</div>
                <div className="cog-load__hint">{data?.cognitive_load?.description}</div>
              </div>
            </div>

            {/* Status Chips */}
            <div className="status-strip">
               {data?.alerts?.map((alert: any, i: number) => (
                  <div key={i} className={`status-chip status-chip--${alert.type === 'grn' ? 'green' : alert.type === 'rd' ? 'red' : 'amber'}`}>
                     <div className="status-chip__pulse"></div> {alert.text}
                  </div>
               ))}
            </div>

            {/* Resolved Banner */}
            {data?.resolved_event && (
              <div className="resolved-banner">
                <CheckCircle2 strokeWidth={3} /> {data.resolved_event}
              </div>
            )}

            {/* Portfolio Stats */}
            <div className="section-label">Portfolio state</div>
            <div className="port-grid">
               {data?.momentum?.stats?.map((stat: any, i: number) => (
                  <div key={i} className="port-stat">
                     <div className="port-stat-l">{stat.label}</div>
                     <div className="port-stat-n" style={{color: stat.color}}>{stat.value}</div>
                     {i === 0 ? <div className="port-stat-s">Trending upward ↑</div> : null}
                  </div>
               ))}
            </div>

            <div className="section-label">Active risk outcomes</div>

            {/* Outcomes List */}
            <div className="outcomes">
               {data?.active_outcomes?.map((outcome: any) => (
                  <div key={outcome.id} className={`outcome-card outcome-card--${outcome.importance} ${expandedOutcomes[outcome.id] ? 'outcome-card--expanded' : ''}`} onClick={() => toggleOutcome(outcome.id)}>
                     <div className="outcome-card__accent"></div>
                     <div className="outcome-card__body">
                        <div className="outcome-card__header">
                           <div style={{flex: 1}}>
                              <div className="outcome-card__supplier">
                                 <div className={`sidebar__dot ${outcome.supplier_dot_color}`}></div> {outcome.supplier}
                              </div>
                              <div className="outcome-card__title">{outcome.title}</div>
                           </div>
                           <div className="outcome-card__tag" style={{background: outcome.tag_bg, color: outcome.tag_color}}>{outcome.tag_text}</div>
                        </div>
                        <div className="outcome-card__why">
                          <strong>This matters because:</strong> {outcome.why}
                        </div>
                        <div className="outcome-card__progress">
                           <div className="progress-bar"><div className="progress-bar__fill" style={{width: `${outcome.progress_pct}%`, background: outcome.progress_color}}></div></div>
                           <div className="progress-bar__pct">{outcome.progress_pct}%</div>
                        </div>
                        
                        {outcome.meta && outcome.meta.length > 0 && (
                          <div className="outcome-card__meta">
                             {outcome.meta.map((m: any, idx: number) => (
                                <span key={idx}>
                                   {m.icon === 'MessageSquare' ? <MessageSquare /> : <AlertTriangle />} {m.text}
                                </span>
                             ))}
                          </div>
                        )}
                     </div>

                     {outcome.steps && outcome.steps.length > 0 && (
                        <div className="outcome-card__steps" onClick={(e) => e.stopPropagation()}>
                          <div className="steps-divider"></div>
                          {outcome.steps.map((step: any, idx: number) => (
                             <div key={idx} className="step">
                                <div className={`step__dot step__dot--${step.status}`}>
                                   {step.status === 'done' ? '✓' : step.number}
                                </div>
                                <div style={{flex: 1}}>
                                   <div className="step__title">{step.title}</div>
                                   <div className="step__desc">{step.desc}</div>
                                   {step.why && (
                                     <div className="step__why step__why--critical">
                                        <strong>{step.why_strong}</strong> {step.why}
                                     </div>
                                   )}
                                   {step.actions && step.actions.length > 0 && (
                                     <div style={{display: 'flex', gap: '8px', marginTop: '10px'}}>
                                        {step.actions.map((act: string, aIdx: number) => (
                                           <button key={aIdx} className={`btn btn--${aIdx === 0 ? 'primary' : 'ghost'}`}>{act}</button>
                                        ))}
                                     </div>
                                   )}
                                </div>
                             </div>
                          ))}
                        </div>
                     )}
                  </div>
               ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
