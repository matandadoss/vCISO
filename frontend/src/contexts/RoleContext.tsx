"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type Role = "CISO" | "SOC_ANALYST" | "SECURITY_ENGINEER" | "AUDITOR" | "BOARD_MEMBER";

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  // Defaulting to CISO for the full experience initially
  const [role, setRole] = useState<Role>("CISO");

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
