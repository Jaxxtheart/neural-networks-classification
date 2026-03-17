"use client";

import { useState } from "react";
import {
  BarChart2, Hash, Calendar, Mail, Phone, MapPin,
  AlertTriangle, TrendingUp, ChevronDown, ChevronUp
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { cn } from "@/lib/utils/cn";
import QualityScore from "@/components/shared/QualityScore";

interface ColumnProfile {
  name: string;
  dtype: string;
  min: number | string;
  max: number | string;
  mean: number | null;
  median: number | null;
  stddev: number | null;
  nullPct: number;
  distinctCount: number;
  totalCount: number;
  pattern: "email" | "phone" | "id" | "date" | "numeric" | "text" | "boolean" | null;
  distribution: { bin: string; count: number }[];
  qualityScore: number;
  isTemporal?: boolean;
  temporalFrequency?: string;
}

const MOCK_COLUMNS: ColumnProfile[] = [
  {
    name: "customer_id", dtype: "VARCHAR(36)", min: "—", max: "—", mean: null, median: null, stddev: null,
    nullPct: 0, distinctCount: 12840, totalCount: 12840, pattern: "id",
    distribution: [], qualityScore: 98,
  },
  {
    name: "msisdn", dtype: "VARCHAR(20)", min: "—", max: "—", mean: null, median: null, stddev: null,
    nullPct: 0.3, distinctCount: 12802, totalCount: 12840, pattern: "phone",
    distribution: [], qualityScore: 96,
  },
  {
    name: "call_duration_sec", dtype: "INTEGER", min: 0, max: 7420, mean: 183.4, median: 87, stddev: 246.1,
    nullPct: 1.2, distinctCount: 2847, totalCount: 12840, pattern: "numeric",
    distribution: [
      { bin: "0–30",    count: 3200 }, { bin: "30–60",  count: 2800 },
      { bin: "60–120",  count: 2100 }, { bin: "120–300", count: 1900 },
      { bin: "300–600", count: 1500 }, { bin: "600+",    count: 1340 },
    ],
    qualityScore: 91,
  },
  {
    name: "event_timestamp", dtype: "TIMESTAMPTZ", min: "2026-01-01", max: "2026-02-25", mean: null, median: null, stddev: null,
    nullPct: 0, distinctCount: 12840, totalCount: 12840, pattern: "date",
    distribution: [
      { bin: "Jan 1",  count: 410 }, { bin: "Jan 8",  count: 520 },
      { bin: "Jan 15", count: 490 }, { bin: "Jan 22", count: 580 },
      { bin: "Jan 29", count: 610 }, { bin: "Feb 5",  count: 640 },
      { bin: "Feb 12", count: 700 }, { bin: "Feb 19", count: 720 },
    ],
    qualityScore: 99, isTemporal: true, temporalFrequency: "Events/week",
  },
  {
    name: "email", dtype: "VARCHAR(255)", min: "—", max: "—", mean: null, median: null, stddev: null,
    nullPct: 14.7, distinctCount: 10954, totalCount: 12840, pattern: "email",
    distribution: [], qualityScore: 73,
  },
  {
    name: "data_usage_mb", dtype: "FLOAT", min: 0, max: 102400, mean: 2847.3, median: 1204.5, stddev: 4812.8,
    nullPct: 3.4, distinctCount: 8293, totalCount: 12840, pattern: "numeric",
    distribution: [
      { bin: "0–100",   count: 1800 }, { bin: "100–500",  count: 2200 },
      { bin: "500–1GB", count: 2600 }, { bin: "1–5GB",    count: 3100 },
      { bin: "5–10GB",  count: 1800 }, { bin: "10GB+",    count: 1340 },
    ],
    qualityScore: 84,
  },
  {
    name: "roaming_country", dtype: "VARCHAR(3)", min: "—", max: "—", mean: null, median: null, stddev: null,
    nullPct: 68.2, distinctCount: 47, totalCount: 12840, pattern: "text",
    distribution: [
      { bin: "ZA", count: 4090 }, { bin: "ZW", count: 1820 },
      { bin: "ZM", count: 1340 }, { bin: "BW", count: 980 },
      { bin: "MZ", count: 720 }, { bin: "Other", count: 1890 },
    ],
    qualityScore: 61,
  },
];

const PATTERN_CONFIG = {
  email:   { icon: Mail,         label: "Email",   color: "#3B82F6" },
  phone:   { icon: Phone,        label: "Phone",   color: "#10B981" },
  id:      { icon: Hash,         label: "ID",      color: "#8B5CF6" },
  date:    { icon: Calendar,     label: "Date",    color: "#F59E0B" },
  numeric: { icon: TrendingUp,   label: "Numeric", color: "#5046E5" },
  text:    { icon: BarChart2,    label: "Text",    color: "#94A3B8" },
  boolean: { icon: Hash,         label: "Boolean", color: "#EC4899" },
};

function nullQuality(pct: number) {
  if (pct < 2) return "text-green-400";
  if (pct < 10) return "text-yellow-400";
  return "text-red-400";
}

export function ProfilerPanel() {
  const [expanded, setExpanded] = useState<string | null>("call_duration_sec");

  const avgScore = Math.round(MOCK_COLUMNS.reduce((s, c) => s + c.qualityScore, 0) / MOCK_COLUMNS.length);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryStat label="Columns" value={MOCK_COLUMNS.length.toString()} />
        <SummaryStat label="Total Rows" value="12,840" />
        <SummaryStat label="Avg Quality" value={`${avgScore}/100`} highlight />
        <SummaryStat label="Patterns Found" value={MOCK_COLUMNS.filter(c => c.pattern).length.toString()} />
      </div>

      {/* Column list */}
      <div className="space-y-2">
        {MOCK_COLUMNS.map(col => {
          const isExpanded = expanded === col.name;
          const patternCfg = col.pattern ? PATTERN_CONFIG[col.pattern] : null;
          const PatternIcon = patternCfg?.icon;

          return (
            <div key={col.name} className="card overflow-hidden">
              {/* Header row */}
              <button
                className="w-full flex items-center gap-3 text-left"
                onClick={() => setExpanded(isExpanded ? null : col.name)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-white">{col.name}</span>
                    <span className="text-[10px] font-mono text-[var(--etihuku-gray-500)] bg-[var(--etihuku-gray-800)] px-1.5 py-0.5 rounded">{col.dtype}</span>
                    {patternCfg && PatternIcon && (
                      <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded" style={{ color: patternCfg.color, backgroundColor: `${patternCfg.color}18` }}>
                        <PatternIcon size={9} /> {patternCfg.label}
                      </span>
                    )}
                    {col.isTemporal && (
                      <span className="text-[10px] text-[var(--etihuku-gold)] bg-[var(--etihuku-gold)]/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Calendar size={9} /> Time-series
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--etihuku-gray-500)]">
                    <span className={nullQuality(col.nullPct)}>
                      {col.nullPct === 0 ? "No nulls" : `${col.nullPct}% null`}
                    </span>
                    <span>{col.distinctCount.toLocaleString()} distinct</span>
                  </div>
                </div>

                <QualityScore score={col.qualityScore} size="sm" />

                <div className="text-[var(--etihuku-gray-600)]">
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-[var(--etihuku-gray-800)] grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Stats */}
                  <div className="col-span-2 sm:col-span-1 grid grid-cols-2 gap-3">
                    {[
                      { label: "Min",     value: col.min?.toString() ?? "—"    },
                      { label: "Max",     value: col.max?.toString() ?? "—"    },
                      { label: "Mean",    value: col.mean != null ? col.mean.toLocaleString(undefined, { maximumFractionDigits: 1 }) : "—" },
                      { label: "Median",  value: col.median?.toString() ?? "—" },
                      { label: "Std Dev", value: col.stddev != null ? col.stddev.toLocaleString(undefined, { maximumFractionDigits: 1 }) : "—" },
                      { label: "Nulls",   value: `${col.nullPct}%`             },
                    ].map(stat => (
                      <div key={stat.label} className="bg-[var(--etihuku-gray-800)] rounded p-2">
                        <div className="text-[10px] text-[var(--etihuku-gray-500)] uppercase tracking-wide">{stat.label}</div>
                        <div className="text-sm font-mono font-semibold text-white mt-0.5">{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Histogram */}
                  {col.distribution.length > 0 && (
                    <div className="col-span-2 sm:col-span-3">
                      <div className="text-[10px] text-[var(--etihuku-gray-500)] uppercase tracking-wide mb-2">
                        {col.isTemporal ? col.temporalFrequency : "Distribution"}
                      </div>
                      <ResponsiveContainer width="100%" height={120}>
                        <BarChart data={col.distribution} barCategoryGap="20%">
                          <XAxis dataKey="bin" tick={{ fill: "var(--etihuku-gray-500)", fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis hide />
                          <Tooltip
                            contentStyle={{ background: "var(--etihuku-gray-900)", border: "1px solid var(--etihuku-gray-700)", borderRadius: 6, fontSize: 12 }}
                            itemStyle={{ color: "var(--etihuku-gray-200)" }}
                          />
                          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                            {col.distribution.map((_, i) => (
                              <Cell key={i} fill={col.isTemporal ? "var(--etihuku-gold)" : "var(--etihuku-indigo)"} opacity={0.8} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {col.distribution.length === 0 && (
                    <div className="col-span-2 sm:col-span-3 flex items-center justify-center text-sm text-[var(--etihuku-gray-600)] bg-[var(--etihuku-gray-800)] rounded-lg">
                      <BarChart2 size={14} className="mr-2" /> Histogram not available for this column type
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="card text-center">
      <div className={cn("text-xl font-display font-bold", highlight ? "text-[var(--etihuku-gold)]" : "text-white")}>
        {value}
      </div>
      <div className="text-xs text-[var(--etihuku-gray-500)] mt-0.5">{label}</div>
    </div>
  );
}
