'use client' // Error components must be Client Components

import { useEffect, useState } from 'react'
import { AlertTriangle, Home, RefreshCw, TerminalSquare } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [reportId, setReportId] = useState<string | null>(null)
  
  useEffect(() => {
    // Log the error to our backend endpoint for engineering team pickup
    const reportBug = async () => {
      try {
        const payload = {
          error_message: error.message,
          stack_trace: error.stack,
          url: window.location.href,
          route: window.location.pathname,
          frontend_version: '0.1.0'
        };
        
        // Use basic fetch to avoid cyclic dependencies in case api.ts is broken
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/bugs/report`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
        
        if (res.ok) {
          const data = await res.json();
          setReportId(data.id);
        }
      } catch (e) {
        console.error("Failed to forward bug report upstream", e);
      }
    };
    
    reportBug();
  }, [error]);

  return (
    <div className="flex h-full min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-6 rounded-full bg-destructive/10 p-4">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      
      <h2 className="text-2xl font-bold tracking-tight text-foreground">Something went wrong!</h2>
      
      <p className="mt-2 max-w-[600px] text-muted-foreground">
        An unexpected error occurred while rendering this page or component.
      </p>
      
      <div className="mt-6 w-full max-w-lg rounded-md border border-border bg-muted/50 p-4 text-left font-mono text-sm text-muted-foreground">
        <div className="flex items-center gap-2 mb-2">
          <TerminalSquare className="h-4 w-4" />
          <span className="font-semibold text-foreground">Diagnostic Info</span>
        </div>
        <div className="overflow-x-auto">
           {error.message}
        </div>
        {reportId && (
          <div className="mt-3 text-xs text-primary/80 pt-3 border-t border-border/50">
            Automated bug report captured: <span className="font-bold">#{reportId.slice(0, 8)}</span>
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-4">
        <button
          onClick={() => reset()}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          <Home className="h-4 w-4" />
          Go Home
        </Link>
      </div>
    </div>
  )
}
