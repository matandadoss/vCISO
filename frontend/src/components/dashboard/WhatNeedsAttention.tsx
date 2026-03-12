"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert, FileWarning, Clock } from "lucide-react";

interface AttentionItem {
  id: string;
  type: "critical_vuln" | "compliance_gap" | "threat_intel" | "expiring_policy";
  title: string;
  description: string;
  timeAgo: string;
  isUrgent: boolean;
}

export function WhatNeedsAttention() {
  const [items, setItems] = useState<AttentionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAttentionItems() {
      try {
        const response = await fetch('http://localhost:8000/api/v1/dashboard/attention?org_id=default');
        if (!response.ok) {
          throw new Error('Failed to fetch attention items');
        }
        const data = await response.json();
        setItems(data);
      } catch (error) {
        console.error("Error loading attention items:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAttentionItems();
  }, []);

  const getIconForType = (type: AttentionItem["type"]) => {
    switch (type) {
      case "critical_vuln":
        return <ShieldAlert className="h-5 w-5 text-destructive" />;
      case "compliance_gap":
        return <FileWarning className="h-5 w-5 text-amber-500" />;
      case "threat_intel":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "expiring_policy":
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 flex flex-col items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          What Needs My Attention Today
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive/10 text-[10px] font-medium text-destructive">
            {items.filter(i => i.isUrgent).length}
          </span>
        </h3>
      </div>
      
      <div className="flex-1 space-y-4 overflow-y-auto pr-2 min-h-[300px]">
        {items.map((item) => (
          <div 
            key={item.id} 
            className={`p-4 rounded-md border text-sm transition-colors hover:bg-accent/50 ${
              item.isUrgent ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-card'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {getIconForType(item.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">{item.title}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{item.timeAgo}</span>
                </div>
                <p className="text-muted-foreground leading-snug">
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button className="mt-4 w-full text-sm font-medium text-primary hover:text-primary/80 transition-colors py-2 border border-transparent hover:border-border rounded-md">
        View All Alerts
      </button>
    </div>
  );
}
