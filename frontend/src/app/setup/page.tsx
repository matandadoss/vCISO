"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import SetupWizard, { SetupData } from "@/components/setup/SetupWizard";

export default function SetupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // If auth is loaded and there is no user, kick them back to login
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    // Check if they already completed setup (using local storage as the database surrogate for now)
    if (user && !loading) {
      const hasCompletedSetup = localStorage.getItem(`vCISO_Setup_${user.uid}`);
      if (hasCompletedSetup === "true") {
        router.push("/"); // Skip to dashboard
      } else {
        setIsReady(true);
      }
    }
  }, [user, loading, router]);

  const handleSetupComplete = async (data: SetupData) => {
    try {
      if (!user) return;
      
      console.log("Saving Org Profile to Backend:", data);
      
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/onboarding/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            organization: data,
            integrations: data.securityTools,
            frameworks: []
          })
        });
        
        if (!res.ok) {
           console.warn("Failed to save org to backend. Continuing with local mock.");
        } else {
           const json = await res.json();
           console.log("Organization created:", json.org_id);
        }
      } catch (e) {
        console.warn("API unreachable. Continuing with local mock.", e);
      }
      
      // Flag completion in local storage
      localStorage.setItem(`vCISO_Setup_${user.uid}`, "true");
      
      // Sync the user's defined stack across the system natively into local storage
      if (data.infraStack.length > 0) localStorage.setItem("vciso_company_infra", JSON.stringify(data.infraStack));
      if (data.techStack.length > 0) localStorage.setItem("vciso_company_tech", JSON.stringify(data.techStack));
      if (data.securityTools.length > 0) {
         const mappedTools = data.securityTools.map(tool => ({
            name: tool,
            status: "Pending Configuration",
            type: "Custom Integration",
            connected: false
         }));
         localStorage.setItem("vciso_company_tools", JSON.stringify(mappedTools));
      }

      // Route immediately to the main dashboard
      router.push("/");
    } catch (err) {
      console.error("Failed to save setup data:", err);
    }
  };

  if (loading || !isReady) {
    return (
      <div className="w-full flex-1 min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // user! is safe here because of the isReady shield
  return <SetupWizard onComplete={handleSetupComplete} uid={user!.uid} />;
}
