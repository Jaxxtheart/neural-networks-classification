import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "@/components/shared/StatusBadge";

const ALL_STATUSES = ["success", "running", "failed", "warning", "draft", "pending"] as const;

describe("StatusBadge", () => {
  // ─── Default labels ─────────────────────────────────────────────────────────
  it.each(ALL_STATUSES)("renders default label for status=%s", (status) => {
    render(<StatusBadge status={status} />);
    const capitalised = status.charAt(0).toUpperCase() + status.slice(1);
    expect(screen.getByText(capitalised)).toBeInTheDocument();
  });

  // ─── Custom label ────────────────────────────────────────────────────────────
  it("renders custom label when provided", () => {
    render(<StatusBadge status="success" label="Completed" />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.queryByText("Success")).not.toBeInTheDocument();
  });

  // ─── Dot indicator ──────────────────────────────────────────────────────────
  it("renders dot by default", () => {
    const { container } = render(<StatusBadge status="success" />);
    // The dot is a <span> sibling of the label text
    const spans = container.querySelectorAll("span span");
    expect(spans.length).toBeGreaterThan(0);
  });

  it("hides dot when showDot=false", () => {
    const { container } = render(<StatusBadge status="running" showDot={false} />);
    // No inner span for the dot
    const innerSpans = container.querySelector("span")?.querySelectorAll("span");
    expect(innerSpans?.length ?? 0).toBe(0);
  });

  // ─── Running pulse animation ────────────────────────────────────────────────
  it("applies animate-pulse class for running status", () => {
    const { container } = render(<StatusBadge status="running" />);
    const dot = container.querySelector(".animate-pulse");
    expect(dot).toBeInTheDocument();
  });

  it("does not apply animate-pulse for non-running statuses", () => {
    const { container } = render(<StatusBadge status="success" />);
    expect(container.querySelector(".animate-pulse")).not.toBeInTheDocument();
  });

  // ─── className prop ─────────────────────────────────────────────────────────
  it("applies className to the root span", () => {
    const { container } = render(<StatusBadge status="failed" className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  // ─── All statuses render without crashing ──────────────────────────────────
  it.each(ALL_STATUSES)("renders without error for status=%s", (status) => {
    expect(() => render(<StatusBadge status={status} />)).not.toThrow();
  });
});
