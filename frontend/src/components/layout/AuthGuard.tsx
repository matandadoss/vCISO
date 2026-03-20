"use client";

import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      router.push("/login");
    }
  }, [user, loading, isLoginPage, router]);

  if (loading) {
     // Basic loading spinner while checking auth state
     return null;
  }

  if (!user && !isLoginPage) {
     return null; // Will redirect in useEffect
  }

  if (isLoginPage) {
     return <>{children}</>;
  }

  // Authenticated Layout
  return (
    <>
      <AppSidebar mobileOpen={isMobileMenuOpen} setMobileOpen={setIsMobileMenuOpen} />
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
         <AppHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
         {/* Scrollable Content Wrapper */}
         <div className="flex-1 overflow-y-auto">
            {children}
         </div>
      </main>
    </>
  );
}
