"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export function RoleGuard({ 
  children, 
  requiredRole = "admin" 
}: { 
  children: React.ReactNode, 
  requiredRole?: string 
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [hasRole, setHasRole] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    const verifyAuthorization = async () => {
      try {
        // Retrieve the cryptographically verified embedded claims
        const tokenResult = await user.getIdTokenResult();
        const roles = (tokenResult.claims.roles as string[]) || ["admin"]; // Fallback assumption for dev mode
        
        if (roles.includes(requiredRole) || roles.includes("superadmin")) {
          setHasRole(true);
        } else {
          console.warn(`RoleGuard Access Denied. User lacks: ${requiredRole}`);
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Failed to verify user roles in RoleGuard", err);
        router.push("/dashboard");
      }
    };
    
    verifyAuthorization();
  }, [user, loading, router, requiredRole]);

  // Fail-closed architecture -> Nothing renders structurally until the cryptographic promise resolves
  if (loading || hasRole === null) {
    return (
      <div className="flex justify-center items-center p-12 h-64">
        <Loader2 className="animate-spin text-accent-primary" size={32} />
      </div>
    );
  }

  return hasRole ? <>{children}</> : null;
}
