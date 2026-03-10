"use client";

import { useState } from "react";
import {
  BoxSelect, Tag, Calendar, Database, Cpu, ChevronRight,
  Activity, TrendingUp, TrendingDown, Plus, ExternalLink, GitBranch
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import StatusBadge from "@/components/shared/StatusBadge";

type ModelStatus = "production" | "staging" | "archived" | "degraded";
type Framework = "scikit-learn" | "pytorch" | "tensorflow" | "xgboost" | "lightgbm" | "huggingface";

interface RegisteredModel {
  id: string;
  name: string;
  version: string;
  framework: Framework;
  vertical: string;
  status: ModelStatus;
  trainedOn: string;
  deployedAt: string;
  featuresUsed: string[];
  trainingDataset: string;
  primaryMetric: string;
  primaryMetricValue: number;
  baselineValue: number;
  driftScore: number;
  totalPredictions: string;
  avgLatencyMs: number;
  description: string;
}

const MOCK_MODELS: RegisteredModel[] = [
  {
    id: "m1", name: "churn-predictor-v3", version: "3.2.1",
    framework: "xgboost", vertical: "telecom", status: "production",
    trainedOn: "2026-01-15", deployedAt: "2026-01-20",
    featuresUsed: ["call_duration_7d_mean", "data_usage_30d_sum", "churn_lag_1d", "roaming_flag"],
    trainingDataset: "CDR Dataset v2.1 (Jan 2025–Dec 2025)",
    primaryMetric: "AUC", primaryMetricValue: 0.912, baselineValue: 0.894,
    driftScore: 0.14, totalPredictions: "4.2M", avgLatencyMs: 8,
    description: "XGBoost churn probability model trained on 12 months of CDR data",
  },
  {
    id: "m2", name: "network-anomaly-detector", version: "1.4.0",
    framework: "pytorch", vertical: "telecom", status: "production",
    trainedOn: "2026-02-01", deployedAt: "2026-02-05",
    featuresUsed: ["packet_loss", "latency_p99", "throughput_ratio"],
    trainingDataset: "Network KPI Dataset (Oct 2025–Jan 2026)",
    primaryMetric: "F1", primaryMetricValue: 0.878, baselineValue: 0.882,
    driftScore: 0.31, totalPredictions: "18.7M", avgLatencyMs: 3,
    description: "LSTM-based network anomaly detection on real-time KPI streams",
  },
  {
    id: "m3", name: "intrusion-classifier", version: "2.1.0",
    framework: "lightgbm", vertical: "security", status: "degraded",
    trainedOn: "2025-10-01", deployedAt: "2025-10-15",
    featuresUsed: ["access_count_1h", "failed_attempts", "geo_anomaly_score"],
    trainingDataset: "Access Log Dataset (2025 Q3)",
    primaryMetric: "Precision", primaryMetricValue: 0.741, baselineValue: 0.831,
    driftScore: 0.67, totalPredictions: "892K", avgLatencyMs: 12,
    description: "Physical access intrusion classification — requires retraining",
  },
  {
    id: "m4", name: "bearing-failure-predictor", version: "1.0.3",
    framework: "scikit-learn", vertical: "mining", status: "staging",
    trainedOn: "2026-02-10", deployedAt: "2026-02-20",
    featuresUsed: ["sensor_temp_anomaly_score", "vibration_7d_mean", "power_spike_count"],
    trainingDataset: "Sensor Readings v3 (2025 Q4)",
    primaryMetric: "Recall", primaryMetricValue: 0.934, baselineValue: 0.900,
    driftScore: 0.08, totalPredictions: "44K", avgLatencyMs: 4,
    description: "Predictive maintenance model for mining equipment bearing failures",
  },
  {
    id: "m5", name: "structural-defect-detector", version: "0.9.0",
    framework: "huggingface", vertical: "engineering", status: "staging",
    trainedOn: "2026-01-28", deployedAt: "—",
    featuresUsed: ["tile_embedding", "defect_density", "crack_width"],
    trainingDataset: "Inspection Images Batch 1–11",
    primaryMetric: "mAP@0.5", primaryMetricValue: 0.683, baselineValue: 0.650,
    driftScore: 0.05, totalPredictions: "—", avgLatencyMs: 280,
    description: "Vision transformer for structural defect detection from drone imagery",
  },
];

const STATUS_CONFIG: Record<ModelStatus, { label: string; color: string; bg: string }> = {
  production: { label: "Production", color: "#10B981", bg: "bg-green-950/30"  },
  staging:    { label: "Staging",    color: "#3B82F6", bg: "bg-blue-950/30"   },
  archived:   { label: "Archived",   color: "#6B6B88", bg: ""                 },
  degraded:   { label: "Degraded",   color: "#EF4444", bg: "bg-red-950/20"    },
};

const FRAMEWORK_COLORS: Record<Framework, string> = {
  "scikit-learn":  "#F59E0B",
  "pytorch":       "#EC4899",
  "tensorflow":    "#EF4444",
  "xgboost":       "#10B981",
  "lightgbm":      "#3B82F6",
  "huggingface":   "#8B5CF6",
};

const VERTICAL_COLORS: Record<string, string> = {
  telecom: "#8B5CF6", security: "#F59E0B", mining: "#10B981", engineering: "#EC4899",
};

interface ModelRegistryProps {
  onSelectModel: (model: RegisteredModel | null) => void;
  selectedId: string | null;
}

export function ModelRegistry({ onSelectModel, selectedId }: ModelRegistryProps) {
  const [filterStatus, setFilterStatus] = useState<ModelStatus | "all">("all");
  const [filterVertical, setFilterVertical] = useState("all");

  const filtered = MOCK_MODELS.filter(m =>
    (filterStatus === "all" || m.status === filterStatus) &&
    (filterVertical === "all" || m.vertical === filterVertical)
  );

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Registered",  value: MOCK_MODELS.length,                                         color: "text-white"                    },
          { label: "Production",  value: MOCK_MODELS.filter(m => m.status === "production").length,  color: "text-green-400"                },
          { label: "Degraded",    value: MOCK_MODELS.filter(m => m.status === "degraded").length,    color: "text-red-400"                  },
          { label: "Avg Latency", value: "27ms",                                                      color: "text-[var(--etihuku-gold)]"    },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <div className={cn("text-2xl font-display font-bold", s.color)}>{s.value}</div>
            <div className="text-xs text-[var(--etihuku-gray-500)] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "production", "staging", "degraded", "archived"] as (ModelStatus | "all")[]).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={cn(
              "px-3 py-1 rounded text-xs font-medium border capitalize transition-all",
              filterStatus === s
                ? "border-[var(--etihuku-indigo)] bg-[var(--etihuku-indigo)]/10 text-[var(--etihuku-indigo)]"
                : "border-[var(--etihuku-gray-700)] text-[var(--etihuku-gray-400)] hover:border-[var(--etihuku-gray-500)]"
            )}
          >
            {s} {s !== "all" && `(${MOCK_MODELS.filter(m => m.status === s).length})`}
          </button>
        ))}
        <select
          value={filterVertical}
          onChange={e => setFilterVertical(e.target.value)}
          className="form-input text-xs py-1 px-2 h-7 w-auto ml-auto"
        >
          <option value="all">All Verticals</option>
          {["telecom", "security", "mining", "engineering"].map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>

      {/* Model cards */}
      <div className="space-y-2">
        {filtered.map(model => {
          const statusCfg = STATUS_CONFIG[model.status];
          const isSelected = selectedId === model.id;
          const metricDelta = model.primaryMetricValue - model.baselineValue;
          const vColor = VERTICAL_COLORS[model.vertical] ?? "#6B6B88";
          const fwColor = FRAMEWORK_COLORS[model.framework];

          return (
            <div
              key={model.id}
              onClick={() => onSelectModel(isSelected ? null : model)}
              className={cn(
                "card cursor-pointer transition-all hover:border-[var(--etihuku-indigo)]/50",
                isSelected && "border-[var(--etihuku-indigo)] shadow-glow",
                statusCfg.bg
              )}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-[var(--etihuku-gray-800)] flex items-center justify-center shrink-0">
                  <Cpu size={20} className="text-[var(--etihuku-indigo)]" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono font-semibold text-white">{model.name}</span>
                    <span className="text-[10px] font-mono text-[var(--etihuku-gray-500)] bg-[var(--etihuku-gray-800)] px-1.5 py-0.5 rounded">{model.version}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                      style={{ color: fwColor, backgroundColor: `${fwColor}15` }}>
                      {model.framework}
                    </span>
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded capitalize"
                      style={{ color: vColor, backgroundColor: `${vColor}15` }}>
                      {model.vertical}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--etihuku-gray-500)] mb-2">{model.description}</div>

                  <div className="flex items-center gap-4 flex-wrap text-xs">
                    <div>
                      <span className="text-[var(--etihuku-gray-500)]">{model.primaryMetric}: </span>
                      <span className="font-mono font-bold text-white">{model.primaryMetricValue.toFixed(3)}</span>
                      <span className={cn("ml-1 font-medium", metricDelta >= 0 ? "text-green-400" : "text-red-400")}>
                        {metricDelta >= 0 ? "+" : ""}{metricDelta.toFixed(3)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--etihuku-gray-500)]">Drift: </span>
                      <span className={cn("font-mono font-bold",
                        model.driftScore < 0.2 ? "text-green-400" :
                        model.driftScore < 0.5 ? "text-amber-400" : "text-red-400"
                      )}>
                        {model.driftScore.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-[var(--etihuku-gray-500)]">
                      {model.totalPredictions} predictions · {model.avgLatencyMs}ms
                    </div>
                    <div className="text-[var(--etihuku-gray-500)]">
                      Deployed: {model.deployedAt}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="shrink-0">
                  <div
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ color: statusCfg.color, backgroundColor: `${statusCfg.color}20` }}
                  >
                    {statusCfg.label}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { MOCK_MODELS };
export type { RegisteredModel };
