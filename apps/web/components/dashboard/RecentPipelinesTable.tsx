"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import StatusBadge, { type Status } from "@/components/shared/StatusBadge";
import { Radio, Lock, Mountain, Wrench, Play, RotateCcw } from "lucide-react";
import type { Vertical } from "@/lib/stores/ui.store";

interface PipelineRow {
  id: string;
  name: string;
  vertical: Vertical;
  status: Status;
  lastRun: string;
  duration: string;
  records: string;
}

const VERTICAL_ICONS: Record<Vertical, React.ElementType> = {
  telecom:     Radio,
  security:    Lock,
  mining:      Mountain,
  engineering: Wrench,
};

const VERTICAL_COLORS: Record<Vertical, string> = {
  telecom:     "#8B5CF6",
  security:    "#F59E0B",
  mining:      "#10B981",
  engineering: "#EC4899",
};

const MOCK_PIPELINES: PipelineRow[] = [
  {
    id: "p-001",
    name: "CDR Processing & Enrichment",
    vertical: "telecom",
    status: "running",
    lastRun: "just now",
    duration: "4m 12s",
    records: "2,341,089",
  },
  {
    id: "p-002",
    name: "Network KPI Aggregation",
    vertical: "telecom",
    status: "success",
    lastRun: "18m ago",
    duration: "1m 44s",
    records: "892,441",
  },
  {
    id: "p-003",
    name: "Video Frame Extraction",
    vertical: "security",
    status: "failed",
    lastRun: "34m ago",
    duration: "—",
    records: "0",
  },
  {
    id: "p-004",
    name: "Sensor Normalization",
    vertical: "mining",
    status: "success",
    lastRun: "1h ago",
    duration: "6m 02s",
    records: "14,872,300",
  },
  {
    id: "p-005",
    name: "Inspection Image Pipeline",
    vertical: "engineering",
    status: "success",
    lastRun: "2h ago",
    duration: "12m 38s",
    records: "48,220",
  },
  {
    id: "p-006",
    name: "Access Log Fusion",
    vertical: "security",
    status: "warning",
    lastRun: "3h ago",
    duration: "3m 19s",
    records: "5,123,004",
  },
];

export default function RecentPipelinesTable() {
  return (
    <div className="card overflow-hidden">
      {/* Table header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--etihuku-gray-700)]">
        <h3
          className="text-[15px] font-semibold text-[var(--etihuku-white)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Recent Pipeline Runs
        </h3>
        <a
          href="/pipelines"
          className="text-[12px] text-[var(--etihuku-indigo-light)] hover:text-[var(--etihuku-indigo)] transition-colors"
        >
          View all →
        </a>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Pipeline</th>
              <th>Status</th>
              <th className="hidden sm:table-cell">Last Run</th>
              <th className="hidden md:table-cell">Duration</th>
              <th className="hidden lg:table-cell text-right">Records</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_PIPELINES.map((pipeline) => {
              const Icon = VERTICAL_ICONS[pipeline.vertical];
              const color = VERTICAL_COLORS[pipeline.vertical];
              return (
                <tr key={pipeline.id}>
                  {/* Pipeline name + vertical */}
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-6 h-6 rounded-[4px] flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${color}18` }}
                      >
                        <Icon size={12} style={{ color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-[var(--etihuku-gray-100)] truncate">
                          {pipeline.name}
                        </p>
                        <p
                          className="text-[11px] capitalize"
                          style={{ color }}
                        >
                          {pipeline.vertical}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    <StatusBadge status={pipeline.status} />
                  </td>

                  {/* Last run */}
                  <td className="hidden sm:table-cell">
                    <span className="mono text-[var(--etihuku-gray-400)]">
                      {pipeline.lastRun}
                    </span>
                  </td>

                  {/* Duration */}
                  <td className="hidden md:table-cell">
                    <span className="mono text-[var(--etihuku-gray-300)]">
                      {pipeline.duration}
                    </span>
                  </td>

                  {/* Records */}
                  <td className="hidden lg:table-cell text-right">
                    <span className="mono text-[var(--etihuku-gray-200)]">
                      {pipeline.records}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {pipeline.status === "failed" ? (
                        <button
                          className="btn btn-sm btn-ghost gap-1 text-[var(--etihuku-error)] hover:bg-[rgba(239,68,68,0.08)]"
                          title="Retry"
                        >
                          <RotateCcw size={12} />
                          <span className="hidden sm:inline">Retry</span>
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-ghost gap-1"
                          title="Run now"
                        >
                          <Play size={12} />
                          <span className="hidden sm:inline">Run</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
