"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type PageContextData = {
  title: string;
  data: any;
};

type ControlTowerContextType = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  pageContext: PageContextData | null;
  setPageContext: (context: PageContextData | null) => void;
};

const ControlTowerContext = createContext<ControlTowerContextType | undefined>(undefined);

export function ControlTowerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pageContext, setPageContext] = useState<PageContextData | null>(null);

  return (
    <ControlTowerContext.Provider value={{ isOpen, setIsOpen, pageContext, setPageContext }}>
      {children}
    </ControlTowerContext.Provider>
  );
}

export function useControlTower() {
  const context = useContext(ControlTowerContext);
  if (context === undefined) {
    throw new Error("useControlTower must be used within a ControlTowerProvider");
  }
  return context;
}
