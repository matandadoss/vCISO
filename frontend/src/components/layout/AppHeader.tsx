"use client";

import { useAuth } from "@/contexts/AuthContext";
import { LogOut, LogIn, Menu, ShieldAlert, MessageSquare } from "lucide-react";
import { useControlTower } from "@/contexts/ControlTowerContext";
import Link from "next/link";

interface AppHeaderProps {
  onMenuClick: () => void;
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const { user, signInWithGoogle, signOut } = useAuth();
  const { setIsOpen } = useControlTower();

  return (
    <div className="h-16 border-b border-border bg-card flex items-center justify-between px-4 z-30 shrink-0">
      <div className="flex items-center gap-2">
        {/* Mobile menu button */}
        <button onClick={onMenuClick} className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground outline-none">
          <Menu className="w-6 h-6" />
        </button>
        {/* Mobile title */}
        <div className="md:hidden flex items-center gap-2 ml-2">
           <ShieldAlert className="w-5 h-5 text-primary" />
           <span className="font-bold tracking-tight text-sm sm:text-base">Virtual CISO</span>
        </div>
      </div>

      <div className="flex items-center gap-4 ml-auto">
        {user ? (
          <div className="flex items-center gap-3">
            <button
               onClick={() => setIsOpen(true)}
               className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors mr-2 border border-border/50 bg-background/50 shadow-sm"
            >
               <MessageSquare className="w-4 h-4 text-primary" />
               <span className="text-sm font-medium hidden sm:inline-block">AI Control Tower</span>
            </button>
            <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity" title="Account Settings">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium leading-none text-foreground">{user.displayName || "User"}</span>
                <span className="text-xs text-muted-foreground mt-1">{user.email}</span>
              </div>
              {user.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>
            <button 
              onClick={signOut}
              className="flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button 
            onClick={signInWithGoogle}
            className="flex items-center justify-center px-3 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign in
          </button>
        )}
      </div>
    </div>
  );
}
