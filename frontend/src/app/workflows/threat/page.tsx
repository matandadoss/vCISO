"use client";

import { Target, Search, Filter } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/api";

interface ExposedSupplier {
  name: string;
  exposure: string;
  level: "hi" | "md" | "lo";
}

interface Threat {
  id: string;
  title: string;
  severity_tag: string;
  severity_color: string;
  severity_bg: string;
  description_strong: string;
  description: string;
  exposed_suppliers: ExposedSupplier[];
  tags: string[];
}

export default function ThreatIntelMeridianPage() {
  const [search, setSearch] = useState("");
  const [threats, setThreats] = useState<Threat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/meridian/threats`);
        if (res.ok) {
           const json = await res.json();
           setThreats(json.threats || []);
        }
      } catch (err) {
        console.error("Failed to load threats data", err);
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
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
             <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="greeting" style={{fontSize: "24px"}}>Threat <strong>Intelligence</strong></div>
            <div className="ph-sub">Threats mapped specifically to your supply chain. Every intelligence card highlights downstream business impact based on your tracked suppliers.</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
           <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
              <input 
                type="text" 
                placeholder="Search threats, campaigns, or suppliers..." 
                className="w-full pl-9 pr-4 py-2.5 bg-surface-card border border-border-default rounded-md text-sm focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/30 transition-all text-text-primary placeholder:text-text-dim"
              />
           </div>
           <button className="flex items-center gap-2 px-4 py-2 border border-border-default rounded-md text-sm bg-surface-card hover:bg-surface-hover transition-colors text-text-secondary">
             <Filter className="w-4 h-4" /> Filter by MITRE Tactic
           </button>
        </div>

        <div className="section-label">Active Supply Chain Threats</div>

        {/* Threat Cards */}
        {loading ? (
             <div className="p-8 text-center text-text-dim">Loading active threats...</div>
        ) : (
          threats.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))).map((threat) => (
             <div key={threat.id} className="tc border-l-3" style={{ borderLeftColor: threat.severity_color }}>
                <div className="flex justify-between items-start">
                  <div>
                     <div className="text-sm font-medium text-text-primary mb-1 text-lg">{threat.title}</div>
                     <div className="text-xs text-text-tertiary font-mono">INTEL-2026-{threat.id}</div>
                  </div>
                  <div className="px-3 py-1 text-xs rounded-full font-bold" style={{ backgroundColor: threat.severity_bg, color: threat.severity_color }}>
                     {threat.severity_tag}
                  </div>
                </div>
                
                <div className="tc-rel">
                   <strong>{threat.description_strong}</strong> {threat.description}
                </div>

                <div className="tc-sups">
                   {threat.exposed_suppliers.map((sup, idx) => (
                      <span key={idx} className={`tc-sup-pill ${sup.level}`}>{sup.name} — {sup.exposure}</span>
                   ))}
                </div>

                <div className="tc-tags">
                   {threat.tags.map((tag, idx) => (
                      <span key={idx} className="ttag">{tag}</span>
                   ))}
                </div>
             </div>
          ))
        )}


      </div>
    </div>
  );
}
