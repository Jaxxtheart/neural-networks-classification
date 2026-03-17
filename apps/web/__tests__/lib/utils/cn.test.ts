import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils/cn";

describe("cn utility", () => {
  it("returns a single class unchanged", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("merges multiple classes", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("omits falsy values", () => {
    expect(cn("foo", false, null, undefined, "bar")).toBe("foo bar");
  });

  it("merges conflicting tailwind classes (last wins)", () => {
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
  });

  it("handles conditional object syntax", () => {
    expect(cn({ "text-red-500": true, "text-blue-500": false })).toBe("text-red-500");
  });

  it("handles array of classes", () => {
    expect(cn(["px-2", "py-2"])).toBe("px-2 py-2");
  });

  it("returns empty string for no arguments", () => {
    expect(cn()).toBe("");
  });

  it("deduplicates conflicting padding", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
