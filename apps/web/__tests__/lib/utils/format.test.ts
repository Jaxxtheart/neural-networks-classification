import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatBytes,
  formatNumber,
  formatZAR,
  formatDate,
  formatDateTime,
  qualityColor,
  formatRelativeTime,
  truncate,
} from "@/lib/utils/format";

// ─── formatBytes ──────────────────────────────────────────────────────────────
describe("formatBytes", () => {
  it("returns '0 B' for 0", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("formats bytes under 1 KB", () => {
    expect(formatBytes(512)).toBe("512 B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(1024)).toBe("1 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(1024 * 1024)).toBe("1 MB");
  });

  it("formats gigabytes with one decimal", () => {
    expect(formatBytes(1.5 * 1024 * 1024 * 1024)).toBe("1.5 GB");
  });

  it("formats terabytes", () => {
    expect(formatBytes(1024 ** 4)).toBe("1 TB");
  });
});

// ─── formatNumber ─────────────────────────────────────────────────────────────
describe("formatNumber", () => {
  it("formats zero", () => {
    expect(formatNumber(0)).toBe("0");
  });

  it("formats thousands with comma separator (en-ZA uses space or comma)", () => {
    const result = formatNumber(1000);
    // en-ZA may use '\u202f' (narrow no-break space) or ',' depending on environment
    expect(result).toMatch(/1[\s,\u202f]?000/);
  });

  it("formats millions", () => {
    const result = formatNumber(1_000_000);
    expect(result).toMatch(/1/);
  });
});

// ─── formatZAR ────────────────────────────────────────────────────────────────
describe("formatZAR", () => {
  it("includes ZAR or R symbol", () => {
    const result = formatZAR(500);
    expect(result).toMatch(/R|ZAR/);
  });

  it("formats zero amount", () => {
    const result = formatZAR(0);
    expect(result).toMatch(/0/);
  });

  it("omits decimals", () => {
    const result = formatZAR(1234);
    expect(result).not.toMatch(/\.\d{2}/);
  });
});

// ─── formatDate ───────────────────────────────────────────────────────────────
describe("formatDate", () => {
  it("accepts a Date object", () => {
    const result = formatDate(new Date("2024-06-15T00:00:00Z"));
    // Should include day, month, year
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it("accepts a date string", () => {
    const result = formatDate("2024-01-01");
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it("formats month 1 as 01", () => {
    const result = formatDate(new Date("2024-01-15T12:00:00Z"));
    expect(result).toMatch(/01/);
  });
});

// ─── formatDateTime ───────────────────────────────────────────────────────────
describe("formatDateTime", () => {
  it("appends SAST suffix", () => {
    const result = formatDateTime(new Date("2024-06-15T10:00:00Z"));
    expect(result).toContain("SAST");
  });

  it("contains hours and minutes", () => {
    const result = formatDateTime(new Date("2024-06-15T10:30:00Z"));
    // Should contain HH:mm pattern
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});

// ─── qualityColor ─────────────────────────────────────────────────────────────
describe("qualityColor", () => {
  it("returns quality-gold for score >= 90", () => {
    expect(qualityColor(90)).toBe("quality-gold");
    expect(qualityColor(100)).toBe("quality-gold");
    expect(qualityColor(95)).toBe("quality-gold");
  });

  it("returns quality-indigo for score 70–89", () => {
    expect(qualityColor(70)).toBe("quality-indigo");
    expect(qualityColor(89)).toBe("quality-indigo");
  });

  it("returns quality-warning for score 50–69", () => {
    expect(qualityColor(50)).toBe("quality-warning");
    expect(qualityColor(69)).toBe("quality-warning");
  });

  it("returns quality-error for score < 50", () => {
    expect(qualityColor(0)).toBe("quality-error");
    expect(qualityColor(49)).toBe("quality-error");
  });
});

// ─── formatRelativeTime ───────────────────────────────────────────────────────
describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'just now' for recent times (< 60s)", () => {
    const d = new Date("2024-06-15T11:59:30Z");
    expect(formatRelativeTime(d)).toBe("just now");
  });

  it("returns minutes ago", () => {
    const d = new Date("2024-06-15T11:55:00Z");
    expect(formatRelativeTime(d)).toBe("5m ago");
  });

  it("returns hours ago", () => {
    const d = new Date("2024-06-15T09:00:00Z");
    expect(formatRelativeTime(d)).toBe("3h ago");
  });

  it("returns days ago for dates within a week", () => {
    const d = new Date("2024-06-12T12:00:00Z");
    expect(formatRelativeTime(d)).toBe("3d ago");
  });

  it("returns formatted date for dates over 7 days old", () => {
    const d = new Date("2024-06-01T12:00:00Z");
    const result = formatRelativeTime(d);
    // Should fall back to formatDate output
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it("accepts string input", () => {
    const result = formatRelativeTime("2024-06-15T11:59:30Z");
    expect(result).toBe("just now");
  });
});

// ─── truncate ─────────────────────────────────────────────────────────────────
describe("truncate", () => {
  it("returns text unchanged when within limit", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("returns text unchanged when exactly at limit", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });

  it("truncates text with ellipsis when over limit", () => {
    expect(truncate("hello world", 8)).toBe("hello w…");
  });

  it("handles empty string", () => {
    expect(truncate("", 5)).toBe("");
  });

  it("uses single unicode ellipsis character", () => {
    const result = truncate("abcdefgh", 5);
    expect(result).toBe("ab…");
    expect(result.length).toBe(3); // 2 chars + ellipsis char
  });
});
