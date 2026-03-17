import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { ProfilerPanel } from "@/components/quality/ProfilerPanel";

describe("ProfilerPanel (integration)", () => {
  // ─── Summary stats ──────────────────────────────────────────────────────────
  it("renders column count and patterns found both as 7 in summary", () => {
    render(<ProfilerPanel />);
    // Both "Columns" and "Patterns Found" stats show "7"
    const sevens = screen.getAllByText("7");
    expect(sevens).toHaveLength(2);
  });

  it("renders total rows in summary", () => {
    render(<ProfilerPanel />);
    expect(screen.getByText("12,840")).toBeInTheDocument();
  });

  it("renders average quality score", () => {
    render(<ProfilerPanel />);
    // Average of 98+96+91+99+73+84+61 = 602/7 ≈ 86
    expect(screen.getByText("86/100")).toBeInTheDocument();
  });

  it("renders 'Avg Quality' label", () => {
    render(<ProfilerPanel />);
    expect(screen.getByText("Avg Quality")).toBeInTheDocument();
  });

  // ─── Column list ────────────────────────────────────────────────────────────
  it("renders all column names", () => {
    render(<ProfilerPanel />);
    const columnNames = [
      "customer_id",
      "msisdn",
      "call_duration_sec",
      "event_timestamp",
      "email",
      "data_usage_mb",
      "roaming_country",
    ];
    for (const name of columnNames) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it("shows null percentage for columns with nulls", () => {
    render(<ProfilerPanel />);
    expect(screen.getByText("0.3% null")).toBeInTheDocument();
    expect(screen.getByText("14.7% null")).toBeInTheDocument();
  });

  it("shows 'No nulls' for columns without nulls", () => {
    render(<ProfilerPanel />);
    const noNulls = screen.getAllByText("No nulls");
    expect(noNulls.length).toBeGreaterThan(0);
  });

  // ─── Expand/collapse ────────────────────────────────────────────────────────
  it("starts with call_duration_sec expanded by default", () => {
    render(<ProfilerPanel />);
    // Stats section labels only appear when expanded
    expect(screen.getByText("Min")).toBeInTheDocument();
    expect(screen.getByText("Max")).toBeInTheDocument();
  });

  it("collapses expanded column on click", () => {
    render(<ProfilerPanel />);
    const btn = screen.getByRole("button", { name: /call_duration_sec/ });
    fireEvent.click(btn);
    expect(screen.queryByText("Std Dev")).not.toBeInTheDocument();
  });

  it("expands a collapsed column on click", () => {
    render(<ProfilerPanel />);
    // First collapse the default
    const btn = screen.getByRole("button", { name: /call_duration_sec/ });
    fireEvent.click(btn);
    // Now expand customer_id
    const customerBtn = screen.getByRole("button", { name: /customer_id/ });
    fireEvent.click(customerBtn);
    expect(screen.getByText("Min")).toBeInTheDocument();
  });

  // ─── Pattern badges ─────────────────────────────────────────────────────────
  it("shows 'ID' pattern badge for customer_id", () => {
    render(<ProfilerPanel />);
    expect(screen.getByText("ID")).toBeInTheDocument();
  });

  it("shows 'Email' pattern badge for email column", () => {
    render(<ProfilerPanel />);
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("shows 'Time-series' badge for temporal column", () => {
    render(<ProfilerPanel />);
    expect(screen.getByText("Time-series")).toBeInTheDocument();
  });
});
