import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToggleSwitch } from "@/components/shared/ToggleSwitch";

describe("ToggleSwitch", () => {
  // ─── Rendering ──────────────────────────────────────────────────────────────
  it("renders a button with role=switch", () => {
    render(<ToggleSwitch checked={false} onChange={() => {}} />);
    const btn = screen.getByRole("switch");
    expect(btn).toBeInTheDocument();
  });

  it("reflects checked=true via aria-checked", () => {
    render(<ToggleSwitch checked={true} onChange={() => {}} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("reflects checked=false via aria-checked", () => {
    render(<ToggleSwitch checked={false} onChange={() => {}} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  // ─── Interaction ────────────────────────────────────────────────────────────
  it("calls onChange with toggled value on click", () => {
    const onChange = vi.fn();
    render(<ToggleSwitch checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("calls onChange(false) when checked=true", () => {
    const onChange = vi.fn();
    render(<ToggleSwitch checked={true} onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  // ─── Disabled state ─────────────────────────────────────────────────────────
  it("does not call onChange when disabled", () => {
    const onChange = vi.fn();
    render(<ToggleSwitch checked={false} onChange={onChange} disabled />);
    const btn = screen.getByRole("switch");
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("has disabled attribute when disabled prop is true", () => {
    render(<ToggleSwitch checked={false} onChange={() => {}} disabled />);
    expect(screen.getByRole("switch")).toBeDisabled();
  });

  // ─── Label ──────────────────────────────────────────────────────────────────
  it("renders label text when provided", () => {
    render(<ToggleSwitch checked={false} onChange={() => {}} label="Enable feature" />);
    expect(screen.getByText("Enable feature")).toBeInTheDocument();
  });

  it("does not render label element when label is omitted", () => {
    const { container } = render(<ToggleSwitch checked={false} onChange={() => {}} />);
    expect(container.querySelector("label")).not.toBeInTheDocument();
  });

  it("wraps in label element when label is provided", () => {
    const { container } = render(
      <ToggleSwitch checked={false} onChange={() => {}} label="My toggle" />
    );
    expect(container.querySelector("label")).toBeInTheDocument();
  });

  // ─── Size variants ──────────────────────────────────────────────────────────
  it("renders with size=sm", () => {
    expect(() =>
      render(<ToggleSwitch checked={false} onChange={() => {}} size="sm" />)
    ).not.toThrow();
  });

  it("renders with size=md (default)", () => {
    expect(() =>
      render(<ToggleSwitch checked={false} onChange={() => {}} size="md" />)
    ).not.toThrow();
  });

  // ─── Keyboard accessibility ─────────────────────────────────────────────────
  it("is a button (receives keyboard focus natively)", () => {
    render(<ToggleSwitch checked={false} onChange={() => {}} />);
    const btn = screen.getByRole("switch");
    expect(btn.tagName).toBe("BUTTON");
  });

  it("has type=button to avoid form submission", () => {
    render(<ToggleSwitch checked={false} onChange={() => {}} />);
    expect(screen.getByRole("switch")).toHaveAttribute("type", "button");
  });
});
