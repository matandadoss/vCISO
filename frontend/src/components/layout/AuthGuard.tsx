"use client";

import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppSidebar } from "./AppSidebar";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      router.push("/login");
    }
  }, [user, loading, isLoginPage, router]);

  if (loading) {
     // Basic loading spinner while checking auth state
     return (
       <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
       </div>
     );
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
      <AppSidebar />
      <main className="flex-1 flex flex-col overflow-hidden relative">
         {children}
      </main>
    </>
  );
}
