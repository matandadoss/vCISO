"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

const TIMEOUT_MS = 15 * 60 * 1000; // 15 Minutes

export function SessionTimeoutProvider({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!user) return; // Don't track if not logged in

    timeoutRef.current = setTimeout(async () => {
      console.warn("Session expired due to 15 minutes of inactivity. Forcing physical evict...");
      try {
        await signOut(); // Clear Firebase Local Context
        window.location.href = "/login?expired=true";
      } catch (err) {
        console.error("Purge failure:", err);
      }
    }, TIMEOUT_MS);
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Attach global listeners to capture any interaction pulse
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    
    // Initial start
    resetTimeout();

    const handleActivity = () => {
      // Throttle timeout resets to save main thread performance
      requestAnimationFrame(resetTimeout);
    };

    events.forEach(evt => window.addEventListener(evt, handleActivity));

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleActivity));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [user, isClient]); // Re-bind exclusively when auth state fluctuates

  return <>{children}</>;
}
