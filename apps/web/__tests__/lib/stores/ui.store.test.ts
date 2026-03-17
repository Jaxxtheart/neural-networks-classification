import { describe, it, expect, beforeEach } from "vitest";
import { act } from "@testing-library/react";

// Reset zustand store between tests
beforeEach(() => {
  // Clear persisted state so each test starts fresh
  localStorage.clear();
});

describe("useUIStore", () => {
  // Dynamic import so localStorage is cleared before module initialises
  async function getStore() {
    const { useUIStore } = await import("@/lib/stores/ui.store");
    return useUIStore;
  }

  it("has correct initial state", async () => {
    const useUIStore = await getStore();
    const state = useUIStore.getState();
    expect(state.sidebarCollapsed).toBe(false);
    expect(state.activeVertical).toBe("telecom");
    expect(state.mobileSidebarOpen).toBe(false);
  });

  it("toggleSidebar flips sidebarCollapsed", async () => {
    const useUIStore = await getStore();
    act(() => useUIStore.getState().toggleSidebar());
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
    act(() => useUIStore.getState().toggleSidebar());
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
  });

  it("setSidebarCollapsed sets directly", async () => {
    const useUIStore = await getStore();
    act(() => useUIStore.getState().setSidebarCollapsed(true));
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
    act(() => useUIStore.getState().setSidebarCollapsed(false));
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
  });

  it("setActiveVertical changes the vertical", async () => {
    const useUIStore = await getStore();
    act(() => useUIStore.getState().setActiveVertical("mining"));
    expect(useUIStore.getState().activeVertical).toBe("mining");
  });

  it("setActiveVertical accepts all valid verticals", async () => {
    const useUIStore = await getStore();
    const verticals = ["telecom", "security", "mining", "engineering"] as const;
    for (const v of verticals) {
      act(() => useUIStore.getState().setActiveVertical(v));
      expect(useUIStore.getState().activeVertical).toBe(v);
    }
  });

  it("setMobileSidebarOpen opens and closes", async () => {
    const useUIStore = await getStore();
    act(() => useUIStore.getState().setMobileSidebarOpen(true));
    expect(useUIStore.getState().mobileSidebarOpen).toBe(true);
    act(() => useUIStore.getState().setMobileSidebarOpen(false));
    expect(useUIStore.getState().mobileSidebarOpen).toBe(false);
  });
});
