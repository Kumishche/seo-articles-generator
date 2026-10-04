"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "./AppSidebar";

const SidebarContext = createContext<{ open: () => void }>({ open: () => {} });

export function useSidebar() {
  return useContext(SidebarContext);
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const open = useCallback(() => setMobileOpen(true), []);

  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <SidebarContext.Provider value={{ open }}>
      <AppSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-h-[100dvh] flex-col lg:pl-60">{children}</div>
    </SidebarContext.Provider>
  );
}
