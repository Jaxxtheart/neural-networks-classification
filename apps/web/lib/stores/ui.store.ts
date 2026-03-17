"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Vertical = "telecom" | "security" | "mining" | "engineering";

export interface UIState {
  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Active vertical context
  activeVertical: Vertical;
  setActiveVertical: (vertical: Vertical) => void;

  // Mobile sidebar
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),

      activeVertical: "telecom" as Vertical,
      setActiveVertical: (vertical) => set({ activeVertical: vertical }),

      mobileSidebarOpen: false,
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
    }),
    {
      name: "etihuku-ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        activeVertical: state.activeVertical,
      }),
    }
  )
);
