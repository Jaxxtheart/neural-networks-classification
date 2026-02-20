"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { AlertTriangle, CheckCircle, X } from "lucide-react";

interface DriftAlert {
  id: string;
  model: string;
  feature: string;
  score: number;
  threshold: number;
  test: string;
  detectedAt: string;
  severity: "critical" | "high" | "medium";
}

const MOCK_ALERTS: DriftAlert[] = [
  {
    id: "a-001",
    model: "Churn Predictor v2.3",
    feature: "tenure_months",
    score: 0.28,
    threshold: 0.2,
    test: "PSI",
    detectedAt: "23m ago",
    severity: "critical",
  },
  {
    id: "a-002",
    model: "Network Anomaly Detector",
    feature: "packet_loss_rate",
    score: 0.19,
    threshold: 0.15,
    test: "KS",
    detectedAt: "1h ago",
    severity: "high",
  },
  {
    id: "a-003",
    model: "Equipment Failure Predictor",
    feature: "vibration_rms",
    score: 0.12,
    threshold: 0.1,
    test: "PSI",
    detectedAt: "4h ago",
    severity: "medium",
  },
];

const SEVERITY_CONFIG = {
  critical: {
    color: "var(--etihuku-error)",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.2)",
  },
  high: {
    color: "var(--etihuku-warning)",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
  },
  medium: {
    color: "var(--etihuku-info)",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.2)",
  },
};

export default function DriftAlertsList() {
  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--etihuku-gray-700)]">
        <div className="flex items-center gap-2.5">
          <h3
            className="text-[15px] font-semibold text-[var(--etihuku-white)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Drift Alerts
          </h3>
          <span className="badge badge-failed text-[10px] py-0 px-1.5">
            {MOCK_ALERTS.length} active
          </span>
        </div>
        <a
          href="/monitoring"
          className="text-[12px] text-[var(--etihuku-indigo-light)] hover:text-[var(--etihuku-indigo)] transition-colors"
        >
          View all →
        </a>
      </div>

      {/* Alerts list */}
      <div className="divide-y divide-[var(--etihuku-gray-700)]">
        {MOCK_ALERTS.map((alert) => {
          const cfg = SEVERITY_CONFIG[alert.severity];
          const excess = ((alert.score - alert.threshold) / alert.threshold * 100).toFixed(0);
          return (
            <div
              key={alert.id}
              className="flex items-start gap-3 px-5 py-3.5 hover:bg-[var(--etihuku-gray-800)] transition-colors"
            >
              {/* Icon */}
              <div
                className="w-7 h-7 rounded-[5px] flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
              >
                <AlertTriangle size={13} style={{ color: cfg.color }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[var(--etihuku-gray-100)] truncate">
                      {alert.model}
                    </p>
                    <p className="text-[12px] text-[var(--etihuku-gray-400)] mt-0.5">
                      Feature:{" "}
                      <span
                        className="text-[var(--etihuku-gray-200)]"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {alert.feature}
                      </span>{" "}
                      · {alert.test} test
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className="text-[13px] font-bold"
                      style={{ fontFamily: "var(--font-mono)", color: cfg.color }}
                    >
                      {alert.score.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-[var(--etihuku-gray-500)]">
                      +{excess}% over limit
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-[var(--etihuku-gray-500)] mt-1">
                  Detected {alert.detectedAt} · threshold {alert.threshold.toFixed(2)}
                </p>
              </div>

              {/* Resolve button */}
              <button
                className="shrink-0 mt-0.5 text-[var(--etihuku-gray-600)] hover:text-[var(--etihuku-success)] transition-colors"
                title="Mark resolved"
              >
                <CheckCircle size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
