"use client";

import { useEffect } from "react";

// In a real production deployment, this would be an environment variable.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

let trackingInitialized = false;

/**
 * Sends caught error payload securely to the vCISO backend /bugs API
 */
export const captureException = async (error: Error, additionalContext?: Record<string, any>) => {
  try {
    const payload = {
      error_message: error.message || String(error),
      stack_trace: error.stack,
      url: typeof window !== "undefined" ? window.location.href : "SSR",
      route: typeof window !== "undefined" ? window.location.pathname : "SSR",
      frontend_version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
      additional_context: additionalContext
    };

    // We do not await this heavily or use fetchWithAuth to avoid recursive crashing
    // For production, we may need a lightweight auth token extraction if the route requires it
    fetch(`${API_URL}/api/v1/bugs/report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }).catch(e => {
       // Suppress network failure of the error reporter itself
       console.warn("Failed to send telemetry to bug tracker", e);
    });
  } catch (e) {
    console.warn("Error tracking failed to format payload", e);
  }
};

/**
 * Optional Drop-in component to initialize global listeners at the root of the app
 */
export function GlobalErrorTracker() {
  useEffect(() => {
    if (typeof window === "undefined" || trackingInitialized) return;
    trackingInitialized = true;

    // Catch Unhandled Exceptions (Sync)
    const handleWindowError = (event: ErrorEvent) => {
      // Ignore some noise
      if (event.message === "Script error.") return;
      
      captureException(event.error || new Error(event.message), {
         colno: event.colno,
         lineno: event.lineno,
         filename: event.filename
      });
    };

    // Catch Unhandled Promise Rejections (Async / API failures)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      let errorObj = event.reason;
      if (!(errorObj instanceof Error)) {
         errorObj = new Error(typeof errorObj === "string" ? errorObj : "Unhandled Promise Rejection");
      }
      captureException(errorObj, { type: "unhandledrejection" });
    };

    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      trackingInitialized = false;
    };
  }, []);

  return null;
}
