"use client";

import { useState } from "react";
import {
  Layers, Database, Clock, ChevronRight, Zap, Calendar,
  TrendingUp, Search, Filter, ArrowUpRight, GitBranch, Activity
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import QualityScore from "@/components/shared/QualityScore";

type ServingMode = "batch" | "realtime" | "both";
type Vertical = "telecom" | "security" | "mining" | "engineering";

interface Feature {
  id: string;
  name: string;
  featureSet: string;
  dtype: string;
  description: string;
  vertical: Vertical;
  servingMode: ServingMode;
  sourceDataset: string;
  sourcePipeline: string;
  lastComputed: string;
  entityKey: string;
  qualityScore: number;
  batchLatencyMs?: number;
  realtimeLatencyMs?: number;
  version: string;
  tags: string[];
}

const MOCK_FEATURES: Feature[] = [
  {
    id: "f1", name: "call_duration_7d_mean", featureSet: "churn_features",
    dtype: "FLOAT64", description: "Rolling 7-day mean call duration per subscriber",
    vertical: "telecom", servingMode: "both", sourceDataset: "CDR Dataset",
    sourcePipeline: "CDR Processing Pipeline", lastComputed: "2m ago",
    entityKey: "msisdn", qualityScore: 94, batchLatencyMs: 12, realtimeLatencyMs: 3,
    version: "v2.1", tags: ["rolling", "cdr", "churn"],
  },
  {
    id: "f2", name: "data_usage_30d_sum", featureSet: "churn_features",
    dtype: "FLOAT64", description: "Total data usage over last 30 days in MB",
    vertical: "telecom", servingMode: "batch", sourceDataset: "CDR Dataset",
    sourcePipeline: "CDR Processing Pipeline", lastComputed: "2m ago",
    entityKey: "msisdn", qualityScore: 91, batchLatencyMs: 18,
    version: "v2.0", tags: ["aggregate", "data", "churn"],
  },
  {
    id: "f3", name: "churn_probability_score", featureSet: "churn_features",
    dtype: "FLOAT64", description: "Model-predicted churn probability (0–1)",
    vertical: "telecom", servingMode: "realtime", sourceDataset: "CDR Dataset",
    sourcePipeline: "CDR Processing Pipeline", lastComputed: "15s ago",
    entityKey: "msisdn", qualityScore: 88, realtimeLatencyMs: 8,
    version: "v1.4", tags: ["model", "churn", "realtime"],
  },
  {
    id: "f4", name: "sensor_temp_anomaly_score", featureSet: "mine_sensor_features",
    dtype: "FLOAT32", description: "IQR-based anomaly score for sensor temperature readings",
    vertical: "mining", servingMode: "realtime", sourceDataset: "Sensor Readings",
    sourcePipeline: "Sensor Normalization Pipeline", lastComputed: "30s ago",
    entityKey: "sensor_id", qualityScore: 96, realtimeLatencyMs: 2,
    version: "v1.1", tags: ["anomaly", "iot", "maintenance"],
  },
  {
    id: "f5", name: "access_event_count_1h", featureSet: "security_features",
    dtype: "INTEGER", description: "Number of physical access events in last 1 hour",
    vertical: "security", servingMode: "realtime", sourceDataset: "Access Logs",
    sourcePipeline: "Access Log Fusion Pipeline", lastComputed: "10s ago",
    entityKey: "employee_id", qualityScore: 99, realtimeLatencyMs: 1,
    version: "v1.0", tags: ["access", "security", "realtime"],
  },
  {
    id: "f6", name: "inspection_defect_density", featureSet: "eng_inspection_features",
    dtype: "FLOAT64", description: "Defect density per m² from latest inspection batch",
    vertical: "engineering", servingMode: "batch", sourceDataset: "Inspection Images",
    sourcePipeline: "Inspection Image Pipeline", lastComputed: "1h ago",
    entityKey: "asset_id", qualityScore: 83, batchLatencyMs: 45,
    version: "v1.2", tags: ["inspection", "structural", "defect"],
  },
];

const VERTICAL_COLORS: Record<Vertical, string> = {
  telecom:     "#8B5CF6",
  security:    "#F59E0B",
  mining:      "#10B981",
  engineering: "#EC4899",
};

const SERVING_CONFIG: Record<ServingMode, { label: string; color: string; icon: React.ElementType }> = {
  batch:    { label: "Batch",     color: "#3B82F6", icon: Database  },
  realtime: { label: "Real-time", color: "#10B981", icon: Zap       },
  both:     { label: "Both",      color: "#8B5CF6", icon: Activity  },
};

interface FeatureStoreProps {
  compact?: boolean;
}

export function FeatureStore({ compact = false }: FeatureStoreProps) {
  const [search, setSearch] = useState("");
  const [filterVertical, setFilterVertical] = useState<Vertical | "all">("all");
  const [filterServing, setFilterServing] = useState<ServingMode | "all">("all");
  const [selected, setSelected] = useState<Feature | null>(null);

  const filtered = MOCK_FEATURES.filter(f => {
    const matchSearch = search === "" ||
      f.name.includes(search.toLowerCase()) ||
      f.featureSet.includes(search.toLowerCase()) ||
      f.tags.some(t => t.includes(search.toLowerCase()));
    const matchV = filterVertical === "all" || f.vertical === filterVertical;
    const matchS = filterServing === "all" || f.servingMode === filterServing || f.servingMode === "both";
    return matchSearch && matchV && matchS;
  });

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Features",       value: MOCK_FEATURES.length.toString(),    color: "text-white"                            },
          { label: "Feature Sets",   value: "3",                                 color: "text-[var(--etihuku-indigo)]"          },
          { label: "Real-time",      value: MOCK_FEATURES.filter(f => f.servingMode !== "batch").length.toString(), color: "text-green-400" },
          { label: "Avg Latency",    value: "4ms",                               color: "text-[var(--etihuku-gold)]"            },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <div className={cn("text-xl font-display font-bold", s.color)}>{s.value}</div>
            <div className="text-xs text-[var(--etihuku-gray-500)] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--etihuku-gray-500)]" />
          <input
            placeholder="Search features..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input pl-8 text-sm w-full"
          />
        </div>
        <select
          value={filterVertical}
          onChange={e => setFilterVertical(e.target.value as Vertical | "all")}
          className="form-input text-sm w-auto"
        >
          <option value="all">All Verticals</option>
          {(["telecom", "security", "mining", "engineering"] as Vertical[]).map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        <select
          value={filterServing}
          onChange={e => setFilterServing(e.target.value as ServingMode | "all")}
          className="form-input text-sm w-auto"
        >
          <option value="all">All Serving</option>
          <option value="batch">Batch</option>
          <option value="realtime">Real-time</option>
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Feature list */}
        <div className="xl:col-span-2 space-y-2">
          {filtered.map(feature => {
            const servingCfg = SERVING_CONFIG[feature.servingMode];
            const ServingIcon = servingCfg.icon;
            const isSelected = selected?.id === feature.id;

            return (
              <button
                key={feature.id}
                onClick={() => setSelected(isSelected ? null : feature)}
                className={cn(
                  "w-full card text-left hover:border-[var(--etihuku-indigo)]/50 transition-all",
                  isSelected && "border-[var(--etihuku-indigo)] shadow-glow"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-mono text-sm font-semibold text-[var(--etihuku-indigo)]">{feature.name}</span>
                      <span className="text-[9px] font-mono text-[var(--etihuku-gray-500)] bg-[var(--etihuku-gray-800)] px-1.5 py-0.5 rounded">
                        {feature.dtype}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--etihuku-gray-400)] mb-1">
                      {feature.featureSet} · {feature.description.slice(0, 60)}…
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
                        style={{ color: servingCfg.color, backgroundColor: `${servingCfg.color}15` }}>
                        <ServingIcon size={9} /> {servingCfg.label}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
                        style={{ color: VERTICAL_COLORS[feature.vertical], backgroundColor: `${VERTICAL_COLORS[feature.vertical]}15` }}>
                        {feature.vertical}
                      </span>
                      <span className="text-[10px] text-[var(--etihuku-gray-600)] flex items-center gap-1">
                        <Clock size={9} /> {feature.lastComputed}
                      </span>
                      {feature.realtimeLatencyMs && (
                        <span className="text-[10px] text-green-400 flex items-center gap-1">
                          <Zap size={9} /> {feature.realtimeLatencyMs}ms
                        </span>
                      )}
                    </div>
                  </div>
                  <QualityScore score={feature.qualityScore} size="sm" />
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="card text-center py-10 text-sm text-[var(--etihuku-gray-500)]">
              No features match your search.
            </div>
          )}
        </div>

        {/* Feature detail */}
        <div>
          {selected ? (
            <div className="card h-full space-y-4">
              <div>
                <div className="font-mono text-sm font-bold text-[var(--etihuku-indigo)] mb-1">{selected.name}</div>
                <div className="text-xs text-[var(--etihuku-gray-400)] leading-relaxed">{selected.description}</div>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Feature Set",    value: selected.featureSet        },
                  { label: "Entity Key",     value: selected.entityKey         },
                  { label: "Data Type",      value: selected.dtype             },
                  { label: "Version",        value: selected.version           },
                  { label: "Source Dataset", value: selected.sourceDataset     },
                  { label: "Source Pipeline",value: selected.sourcePipeline    },
                  { label: "Last Computed",  value: selected.lastComputed      },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-xs">
                    <span className="text-[var(--etihuku-gray-500)]">{row.label}</span>
                    <span className="text-white font-medium truncate max-w-32 text-right">{row.value}</span>
                  </div>
                ))}
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wide font-medium text-[var(--etihuku-gray-400)] mb-2">Serving Endpoints</div>
                {selected.batchLatencyMs && (
                  <div className="flex items-center justify-between text-xs p-2 rounded bg-[var(--etihuku-gray-800)] mb-1.5">
                    <div className="flex items-center gap-2">
                      <Database size={11} className="text-blue-400" />
                      <span className="text-[var(--etihuku-gray-300)]">Batch</span>
                    </div>
                    <span className="font-mono text-blue-400">{selected.batchLatencyMs}ms</span>
                  </div>
                )}
                {selected.realtimeLatencyMs && (
                  <div className="flex items-center justify-between text-xs p-2 rounded bg-[var(--etihuku-gray-800)]">
                    <div className="flex items-center gap-2">
                      <Zap size={11} className="text-green-400" />
                      <span className="text-[var(--etihuku-gray-300)]">Real-time</span>
                    </div>
                    <span className="font-mono text-green-400">{selected.realtimeLatencyMs}ms</span>
                  </div>
                )}
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wide font-medium text-[var(--etihuku-gray-400)] mb-2">Tags</div>
                <div className="flex flex-wrap gap-1">
                  {selected.tags.map(t => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--etihuku-gray-800)] text-[var(--etihuku-gray-400)] uppercase tracking-wide">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--etihuku-gray-800)] flex gap-2">
                <button className="btn btn-primary btn-sm flex-1 text-xs">Retrieve Features</button>
                <button className="btn btn-secondary btn-sm text-xs px-2">
                  <GitBranch size={12} />
                </button>
              </div>
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center h-full py-16 text-center">
              <Layers size={28} className="text-[var(--etihuku-gray-700)] mb-3" />
              <p className="text-sm text-[var(--etihuku-gray-500)]">Select a feature</p>
              <p className="text-xs text-[var(--etihuku-gray-600)] mt-1">View lineage, serving endpoints, and metadata</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
