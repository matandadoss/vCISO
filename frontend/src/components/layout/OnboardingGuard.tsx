"use client";
import { fetchWithAuth } from "@/lib/api";

import { useEffect, useState, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert } from "lucide-react";

export function OnboardingGuard({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    // Only fetch status if the user is authenticated (mock or real)
    // If we're already on the onboard page, no need to redirect loop, just render children.
    if (!user) {
      setLoading(false);
      return;
    }

    const checkOnboardingStatus = async () => {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/onboarding/status`);
        if (res.ok) {
          const data = await res.json();
          setIsOnboarded(data.is_onboarded);
          
          if (!data.is_onboarded && pathname !== "/onboard") {
            router.push("/onboard");
          }
        }
      } catch (e) {
        console.error("Failed to check onboarding status", e);
      } finally {
        setLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [pathname, router, user]);

  if (loading) {
     return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
           <ShieldAlert className="w-12 h-12 text-primary animate-pulse mb-4" />
           <p className="text-muted-foreground font-medium tracking-wide animate-pulse">Initializing Virtual CISO...</p>
        </div>
     );
  }

  // If we are on the onboard page, we don't want to render the AppSidebar 
  // (which is a sibling to children in layout.tsx, but conceptually we want full screen)
  // Since OnboardingGuard wraps both Sidebar and Children, we can conditionally hide the Sidebar.
  if (pathname === "/onboard") {
    // Return children directly (the layout wraps this, we strip out sidebar below if needed)
    return <main className="flex-1 flex flex-col w-full h-screen overflow-hidden">{children}</main>;
  }

  return <>{children}</>;
}
