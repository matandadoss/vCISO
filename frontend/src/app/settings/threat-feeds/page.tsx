"use client";
import { fetchWithAuth } from "@/lib/api";

import { useEffect, useState } from "react";
import { Shield, Rss, AlertCircle, Server, RefreshCw, CheckCircle2 } from "lucide-react";

interface FeedSubscription {
  id: string;
  name: string;
  description: string;
  provider: string;
  is_active: boolean;
  last_synced: string | null;
}

export default function ThreatFeedsSettingsPage() {
  const [feeds, setFeeds] = useState<FeedSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function fetchFeeds() {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/threat-intel/feeds?org_id=default`);
        if (res.ok) {
          const data = await res.json();
          setFeeds(data);
        }
      } catch (err) {
        console.error("Failed to fetch feeds:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchFeeds();
  }, []);

  const handleToggle = (feedId: string) => {
    setFeeds(current =>
      current.map(feed =>
        feed.id === feedId ? { ...feed, is_active: !feed.is_active } : feed
      )
    );
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const activeFeedIds = feeds.filter(f => f.is_active).map(f => f.id);
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/threat-intel/feeds?org_id=default`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feed_ids: activeFeedIds }),
      });
      
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error("Failed to save");
      }
    } catch (err) {
      console.error("Error saving feeds:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="hidden">
          {/* Title moved to global AppHeader */}
        </div>

        {/* Feeds Configuration Card */}
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border bg-accent/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Active Subscriptions</h2>
              <p className="text-sm text-muted-foreground">Manage your inbound threat signals, known attack methods, and vulnerability streams.</p>
            </div>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium rounded-md shadow-sm transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Save Configuration"}
            </button>
          </div>

          {saveSuccess && (
            <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Feed subscriptions successfully updated. System correlation engine reflecting changes.
            </div>
          )}

          <div className="divide-y divide-border">
            {feeds.map(feed => (
              <div key={feed.id} className="p-6 flex items-start gap-4 hover:bg-accent/30 transition-colors">
                
                {/* Custom Toggle Switch */}
                <button 
                  type="button"
                  role="switch"
                  aria-checked={feed.is_active}
                  onClick={() => handleToggle(feed.id)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mt-1 ${
                    feed.is_active ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    feed.is_active ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{feed.name}</h3>
                    <span className="inline-flex items-center rounded-md bg-accent px-2 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border">
                      {feed.provider}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{feed.description}</p>
                  
                  {feed.is_active && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                       {feed.last_synced ? (
                         <>
                          <RefreshCw className="h-3 w-3 text-emerald-500" /> 
                          Last synced: {new Date(feed.last_synced).toLocaleString()}
                         </>
                       ) : (
                         <>
                          <AlertCircle className="h-3 w-3 text-yellow-500" />
                          Pending initial sync
                         </>
                       )}
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
