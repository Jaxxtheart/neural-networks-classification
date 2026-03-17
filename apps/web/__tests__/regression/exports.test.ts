/**
 * Regression tests: export shape contracts for shared components.
 *
 * These guard against the recurring bug of named-import vs default-export
 * mismatches that have caused Vercel build failures.
 */
import { describe, it, expect } from "vitest";

describe("Shared component export contracts (regression)", () => {
  it("QualityScore is a default export (not named)", async () => {
    const mod = await import("@/components/shared/QualityScore");
    // Default export must be a function/component
    expect(typeof mod.default).toBe("function");
    // There should be no named 'QualityScore' export
    expect((mod as Record<string, unknown>).QualityScore).toBeUndefined();
  });

  it("StatusBadge is a default export (not named)", async () => {
    const mod = await import("@/components/shared/StatusBadge");
    expect(typeof mod.default).toBe("function");
    expect((mod as Record<string, unknown>).StatusBadge).toBeUndefined();
  });

  it("StatusBadge also exports the Status type (named type export)", async () => {
    // The 'Status' type export won't appear at runtime, but importing the
    // module itself should succeed without error
    const mod = await import("@/components/shared/StatusBadge");
    expect(mod.default).toBeDefined();
  });

  it("ToggleSwitch is a named export", async () => {
    const mod = await import("@/components/shared/ToggleSwitch");
    expect(typeof mod.ToggleSwitch).toBe("function");
    // No default export expected
    expect(mod.default).toBeUndefined();
  });

  it("ProfilerPanel is a named export", async () => {
    const mod = await import("@/components/quality/ProfilerPanel");
    expect(typeof mod.ProfilerPanel).toBe("function");
  });
});

describe("Utility export contracts (regression)", () => {
  it("cn is a named export from lib/utils/cn", async () => {
    const mod = await import("@/lib/utils/cn");
    expect(typeof mod.cn).toBe("function");
  });

  it("format utilities are all named exports", async () => {
    const mod = await import("@/lib/utils/format");
    const expected = [
      "formatBytes",
      "formatNumber",
      "formatZAR",
      "formatDate",
      "formatDateTime",
      "qualityColor",
      "formatRelativeTime",
      "truncate",
    ];
    for (const name of expected) {
      expect(typeof (mod as Record<string, unknown>)[name]).toBe("function");
    }
  });

  it("useUIStore is a named export from lib/stores/ui.store", async () => {
    const mod = await import("@/lib/stores/ui.store");
    expect(typeof mod.useUIStore).toBe("function");
  });
});
