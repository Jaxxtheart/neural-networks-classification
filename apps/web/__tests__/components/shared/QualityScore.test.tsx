import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import QualityScore from "@/components/shared/QualityScore";

describe("QualityScore", () => {
  // ─── Score display ──────────────────────────────────────────────────────────
  it("renders the score value", () => {
    render(<QualityScore score={85} />);
    expect(screen.getByText("85")).toBeInTheDocument();
  });

  it("renders score 0", () => {
    render(<QualityScore score={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renders score 100", () => {
    render(<QualityScore score={100} />);
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("clamps score below 0 to 0", () => {
    render(<QualityScore score={-10} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("clamps score above 100 to 100", () => {
    render(<QualityScore score={150} />);
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  // ─── Labels ─────────────────────────────────────────────────────────────────
  it("shows 'Excellent' label for score >= 90", () => {
    render(<QualityScore score={90} showLabel />);
    expect(screen.getByText("Excellent")).toBeInTheDocument();
  });

  it("shows 'Good' label for score 70–89", () => {
    render(<QualityScore score={75} showLabel />);
    expect(screen.getByText("Good")).toBeInTheDocument();
  });

  it("shows 'Fair' label for score 50–69", () => {
    render(<QualityScore score={60} showLabel />);
    expect(screen.getByText("Fair")).toBeInTheDocument();
  });

  it("shows 'Poor' label for score < 50", () => {
    render(<QualityScore score={40} showLabel />);
    expect(screen.getByText("Poor")).toBeInTheDocument();
  });

  it("hides label when showLabel is false", () => {
    render(<QualityScore score={85} showLabel={false} />);
    expect(screen.queryByText("Good")).not.toBeInTheDocument();
  });

  it("shows label by default (showLabel defaults to true)", () => {
    render(<QualityScore score={91} />);
    expect(screen.getByText("Excellent")).toBeInTheDocument();
  });

  // ─── Sizes ──────────────────────────────────────────────────────────────────
  it("renders with size=sm", () => {
    const { container } = render(<QualityScore score={80} size="sm" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "48");
    expect(svg).toHaveAttribute("height", "48");
  });

  it("renders with size=md (default)", () => {
    const { container } = render(<QualityScore score={80} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "64");
  });

  it("renders with size=lg", () => {
    const { container } = render(<QualityScore score={80} size="lg" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "84");
  });

  // ─── SVG structure ──────────────────────────────────────────────────────────
  it("renders two circles (track + progress)", () => {
    const { container } = render(<QualityScore score={75} />);
    const circles = container.querySelectorAll("circle");
    expect(circles).toHaveLength(2);
  });

  it("applies className prop", () => {
    const { container } = render(<QualityScore score={75} className="test-class" />);
    expect(container.firstChild).toHaveClass("test-class");
  });
});
