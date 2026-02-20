"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Radio, Lock, Mountain, Wrench, ArrowRight } from "lucide-react";
import type { Vertical } from "@/lib/stores/ui.store";

interface VerticalStats {
  vertical: Vertical;
  datasets: number;
  pipelines: number;
  qualityScore: number;
  alerts: number;
}

const VERTICAL_CONFIG: Record<
  Vertical,
  { label: string; color: string; icon: React.ElementType }
> = {
  telecom:     { label: "Telecommunications", color: "#8B5CF6", icon: Radio },
  security:    { label: "Security",           color: "#F59E0B", icon: Lock },
  mining:      { label: "Mining",             color: "#10B981", icon: Mountain },
  engineering: { label: "Engineering",        color: "#EC4899", icon: Wrench },
};

function QualityBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[var(--etihuku-gray-700)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span
        className="text-[11px] font-bold w-7 text-right shrink-0"
        style={{ fontFamily: "var(--font-mono)", color }}
      >
        {score}
      </span>
    </div>
  );
}

export default function VerticalBreakdownCard({
  stats,
}: {
  stats: VerticalStats;
}) {
  const cfg = VERTICAL_CONFIG[stats.vertical];
  const Icon = cfg.icon;

  return (
    <div
      className="card p-4 flex flex-col gap-3 hover:cursor-pointer group"
      style={{
        borderColor:
          stats.alerts > 0 ? `${cfg.color}30` : "var(--etihuku-gray-700)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-[6px] flex items-center justify-center"
            style={{ backgroundColor: `${cfg.color}18` }}
          >
            <Icon size={16} style={{ color: cfg.color }} />
          </div>
          <span
            className="text-[13px] font-semibold text-[var(--etihuku-gray-100)]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {cfg.label}
          </span>
        </div>
        <ArrowRight
          size={14}
          className="text-[var(--etihuku-gray-600)] group-hover:text-[var(--etihuku-gray-400)] transition-colors"
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Datasets",  value: stats.datasets },
          { label: "Pipelines", value: stats.pipelines },
          { label: "Alerts",    value: stats.alerts, highlight: stats.alerts > 0 },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col gap-0.5">
            <span
              className="font-bold text-[16px] leading-none"
              style={{
                fontFamily: "var(--font-mono)",
                color: stat.highlight
                  ? "var(--etihuku-error)"
                  : "var(--etihuku-white)",
              }}
            >
              {stat.value}
            </span>
            <span className="text-label text-[var(--etihuku-gray-500)]">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Quality bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-label text-[var(--etihuku-gray-500)]">
            Quality Score
          </span>
        </div>
        <QualityBar score={stats.qualityScore} color={cfg.color} />
      </div>
    </div>
  );
}
