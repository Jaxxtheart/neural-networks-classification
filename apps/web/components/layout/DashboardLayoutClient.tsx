"use client";

import React from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { useUIStore } from "@/lib/stores/ui.store";
import { cn } from "@/lib/utils/cn";

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="min-h-screen bg-[var(--etihuku-black)]">
      <Sidebar />
      <TopBar />
      <main
        className={cn(
          "transition-all duration-200 pt-[60px]",
          // Desktop offset for sidebar
          sidebarCollapsed ? "lg:pl-16" : "lg:pl-64",
          // Mobile: no padding (sidebar overlays)
          "pl-0"
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
