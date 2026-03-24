"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2 p-1 border border-border rounded-lg bg-muted/50 w-max">
      <button
        onClick={() => setTheme("light")}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          theme === "light" 
            ? "bg-background shadow-sm text-foreground border border-border/50" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
        }`}
      >
        <Sun className="h-4 w-4" />
        Light
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          theme === "dark" 
            ? "bg-background shadow-sm text-foreground border border-border/50" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
        }`}
      >
        <Moon className="h-4 w-4" />
        Dark
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          theme === "system" 
            ? "bg-background shadow-sm text-foreground border border-border/50" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
        }`}
      >
        System
      </button>
    </div>
  );
}
