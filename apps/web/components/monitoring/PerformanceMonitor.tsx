"use client";

import { useState } from "react";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from "recharts";
import { TrendingUp, TrendingDown, Database, Clock, Target } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Period = "7d" | "30d" | "90d";
type MetricSet = "classification" | "regression";

interface MetricPoint {
  date: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  auc: number;
  groundTruthCoverage: number;
}

function genMetrics(n: number): MetricPoint[] {
  let acc = 0.91, prec = 0.89, rec = 0.87;
  return Array.from({ length: n }, (_, i) => {
    const degradation = (i / n) * 0.04;
    acc  = Math.max(0.7, acc  - (i > n * 0.6 ? 0.003 : 0.0005) + (Math.random() - 0.5) * 0.004);
    prec = Math.max(0.7, prec - (i > n * 0.6 ? 0.003 : 0.0005) + (Math.random() - 0.5) * 0.005);
    rec  = Math.max(0.7, rec  - (i > n * 0.6 ? 0.002 : 0.0003) + (Math.random() - 0.5) * 0.004);
    const f1 = 2 * prec * rec / (prec + rec);
    const d = new Date(); d.setDate(d.getDate() - (n - i));
    return {
      date: d.toLocaleDateString("en-ZA", { day: "2-digit", month: "short" }),
      accuracy: Math.round(acc * 1000) / 1000,
      precision: Math.round(prec * 1000) / 1000,
      recall: Math.round(rec * 1000) / 1000,
      f1: Math.round(f1 * 1000) / 1000,
      auc: Math.round(Math.max(0.7, 0.912 - degradation + (Math.random() - 0.5) * 0.005) * 1000) / 1000,
      groundTruthCoverage: Math.min(100, 60 + i * (40 / n)),
    };
  });
}

const METRICS_7  = genMetrics(7);
const METRICS_30 = genMetrics(30);
const METRICS_90 = genMetrics(90);

const METRIC_CONFIG = {
  accuracy:  { color: "#5046E5", label: "Accuracy"  },
  precision: { color: "#10B981", label: "Precision" },
  recall:    { color: "#F59E0B", label: "Recall"    },
  f1:        { color: "#EC4899", label: "F1 Score"  },
  auc:       { color: "#D1A039", label: "AUC"       },
};

type MetricKey = keyof typeof METRIC_CONFIG;

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: string;
}
function ChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--etihuku-gray-900)] border border-[var(--etihuku-gray-700)] rounded-lg p-3 text-xs shadow-xl">
      <div className="text-[var(--etihuku-gray-400)] mb-2 font-medium">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-[var(--etihuku-gray-300)] capitalize">{p.name}</span>
          </div>
          <span className="font-mono font-semibold text-white">{p.value.toFixed(3)}</span>
        </div>
      ))}
    </div>
  );
}

interface PerformanceMonitorProps {
  modelName?: string;
}

export function PerformanceMonitor({ modelName = "churn-predictor-v3" }: PerformanceMonitorProps) {
  const [period, setPeriod]   = useState<Period>("30d");
  const [activeMetrics, setActiveMetrics] = useState<Set<MetricKey>>(new Set(["accuracy", "f1", "auc"]));

  const data = period === "7d" ? METRICS_7 : period === "30d" ? METRICS_30 : METRICS_90;
  const displayData = period === "90d" ? data.filter((_, i) => i % 3 === 0) : data;
  const latest = data[data.length - 1];
  const earliest = data[0];

  function toggleMetric(k: MetricKey) {
    setActiveMetrics(prev => {
      const n = new Set(prev);
      if (n.has(k)) { if (n.size > 1) n.delete(k); }
      else n.add(k);
      return n;
    });
  }

  return (
    <div className="space-y-5">
      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(Object.entries(METRIC_CONFIG) as [MetricKey, typeof METRIC_CONFIG[MetricKey]][]).map(([key, cfg]) => {
          const current = latest[key];
          const prev    = earliest[key];
          const delta   = current - prev;
          const isActive = activeMetrics.has(key);

          return (
            <button
              key={key}
              onClick={() => toggleMetric(key)}
              className={cn(
                "card text-left transition-all",
                isActive ? "border-2" : "opacity-60 hover:opacity-80"
              )}
              style={isActive ? { borderColor: cfg.color } : {}}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wide text-[var(--etihuku-gray-500)] font-medium">{cfg.label}</span>
                {delta < -0.01 && <TrendingDown size={12} className="text-red-400" />}
                {delta >= -0.01 && delta <= 0.01 && <div className="w-3 h-0.5 rounded bg-[var(--etihuku-gray-600)]" />}
                {delta > 0.01 && <TrendingUp size={12} className="text-green-400" />}
              </div>
              <div className="text-xl font-display font-bold" style={{ color: cfg.color }}>
                {current.toFixed(3)}
              </div>
              <div className={cn("text-[10px] font-medium mt-0.5", delta < -0.01 ? "text-red-400" : delta > 0.01 ? "text-green-400" : "text-[var(--etihuku-gray-500)]")}>
                {delta >= 0 ? "+" : ""}{delta.toFixed(3)} vs {period}
              </div>
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <span className="text-sm font-medium text-white">{modelName} — Performance Metrics</span>
          <div className="flex gap-1 p-1 bg-[var(--etihuku-gray-900)] border border-[var(--etihuku-gray-800)] rounded-lg">
            {(["7d", "30d", "90d"] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1 rounded text-xs font-medium transition-all",
                  period === p ? "bg-[var(--etihuku-indigo)] text-white" : "text-[var(--etihuku-gray-400)] hover:text-white"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={displayData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--etihuku-gray-800)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "var(--etihuku-gray-500)", fontSize: 10 }} axisLine={false} tickLine={false} interval={Math.floor(displayData.length / 6)} />
            <YAxis domain={[0.72, 0.96]} tick={{ fill: "var(--etihuku-gray-500)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <ReferenceLine y={0.85} stroke="var(--etihuku-indigo)" strokeDasharray="4 4" strokeOpacity={0.4}
              label={{ value: "SLA", position: "insideTopRight", fill: "var(--etihuku-indigo)", fontSize: 10 }} />
            <Tooltip content={<ChartTooltip />} />
            {(Object.entries(METRIC_CONFIG) as [MetricKey, typeof METRIC_CONFIG[MetricKey]][]).filter(([key]) => activeMetrics.has(key)).map(([key, cfg]) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={cfg.color}
                strokeWidth={key === "auc" ? 2.5 : 1.5}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Ground truth ingestion */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database size={14} className="text-[var(--etihuku-indigo)]" />
            <span className="text-sm font-medium text-white">Ground Truth Coverage</span>
          </div>
          <span className="text-xs text-[var(--etihuku-gray-500)]">
            Delayed labels available for {Math.round(latest.groundTruthCoverage)}% of production predictions
          </span>
        </div>

        <ResponsiveContainer width="100%" height={100}>
          <AreaChart data={METRICS_30} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gt-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: "var(--etihuku-gray-600)", fontSize: 9 }} axisLine={false} tickLine={false} interval={5} />
            <YAxis domain={[0, 100]} tick={{ fill: "var(--etihuku-gray-600)", fontSize: 9 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "var(--etihuku-gray-900)", border: "1px solid var(--etihuku-gray-700)", borderRadius: 6, fontSize: 11 }}
              formatter={(v: number) => [`${v.toFixed(0)}%`, "Coverage"]} />
            <Area type="monotone" dataKey="groundTruthCoverage" stroke="#10B981" strokeWidth={2} fill="url(#gt-grad)" dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>

        <div className="mt-3 p-3 bg-[var(--etihuku-indigo)]/5 rounded-lg border border-[var(--etihuku-indigo)]/20 text-xs text-[var(--etihuku-gray-400)]">
          <Target size={11} className="inline mr-1.5 text-[var(--etihuku-indigo)]" />
          Ground truth labels arrive with 7–14 day delay via the delayed label ingestion pipeline.
          Proxy metrics (call outcomes, complaint rate) are used in the interim.
        </div>
      </div>
    </div>
  );
}
