"use client";
import { fetchWithAuth } from "@/lib/api";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ShieldAlert, FileWarning, Clock, Info } from "lucide-react";

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
  const router = useRouter();

  useEffect(() => {
    async function fetchAttentionItems() {
      try {
        const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/dashboard/attention?org_id=default`);
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
    <div className="relative bg-card border border-border rounded-lg p-6 flex flex-col h-full">
      <div className="absolute top-4 right-4 group/tooltip z-10">
        <Info className="w-4 h-4 text-muted-foreground cursor-help opacity-50 hover:opacity-100 transition-opacity" />
        <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs rounded shadow-lg p-3 hidden group-hover/tooltip:block pointer-events-none text-left font-normal leading-relaxed z-[60]">
          An automated to-do list prioritizing the most urgent security tasks that require your review or action today.
        </div>
      </div>
      <div className="flex items-center justify-between mb-4 pr-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          Action Needed
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive/10 text-[10px] font-medium text-destructive">
            {items.filter(i => i.isUrgent).length}
          </span>
        </h3>
      </div>
      
      <div className="flex-1 space-y-4 overflow-y-auto pr-2 min-h-[300px]">
        {items.map((item) => {
          // Add custom styling checks for time sensitivity
          const isOverdue = item.timeAgo?.toLowerCase().includes('overdue');
          const isExpiring = item.timeAgo?.toLowerCase().includes('expire');
          
          return (
            <div 
              key={item.id} 
              onClick={() => router.push(`/findings/${item.id}`)}
              className={`p-4 rounded-md border text-sm transition-all hover:bg-accent/50 relative overflow-hidden cursor-pointer ${
                isOverdue ? 'border-destructive bg-destructive/10 ring-1 ring-destructive' :
                item.isUrgent ? 'border-destructive/40 bg-destructive/5' : 
                isExpiring ? 'border-orange-500/40 bg-orange-500/5' :
                'border-border bg-card'
              }`}
            >
              {isOverdue && (
                <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden rounded-tr-md">
                  <div className="absolute transform rotate-45 bg-destructive text-destructive-foreground text-[10px] font-bold py-0.5 right-[-20px] top-[14px] w-[80px] text-center shadow-sm">
                    OVERDUE
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {getIconForType(item.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground flex items-center gap-2">
                    {item.title}
                    {item.type === 'critical_vuln' && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                      </span>
                    )}
                  </span>
                  <span className={`text-xs whitespace-nowrap font-medium ${
                    isOverdue ? 'text-destructive' :
                    isExpiring ? 'text-orange-500' :
                    'text-muted-foreground'
                  }`}>
                    {item.timeAgo}
                  </span>
                </div>
                <p className="text-muted-foreground leading-snug">
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        )})}
      </div>
      
      <button 
        onClick={() => router.push('/findings')}
        className="mt-4 w-full text-sm font-medium text-primary hover:text-primary/80 transition-colors py-2 border border-transparent hover:border-border rounded-md"
      >
        View All Alerts
      </button>
    </div>
  );
}
