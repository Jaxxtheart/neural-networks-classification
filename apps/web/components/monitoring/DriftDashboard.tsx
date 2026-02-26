"use client";

import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine, ScatterChart,
  Scatter, ZAxis
} from "recharts";
import { AlertTriangle, TrendingUp, Activity, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type TestType = "ks" | "psi" | "chi2" | "jsd";

interface FeatureDrift {
  feature: string;
  ksScore: number;
  psiScore: number;
  jsdScore: number;
  chi2Score: number | null;
  dtype: "continuous" | "categorical";
  severity: "low" | "medium" | "high" | "critical";
  trend: "stable" | "increasing" | "decreasing";
}

interface DriftTimepoint {
  date: string;
  composite: number;
  call_duration: number;
  data_usage: number;
  roaming_flag: number;
  churn_lag: number;
}

const DRIFT_THRESHOLDS = {
  ks: { low: 0.1, medium: 0.2, high: 0.3 },
  psi: { low: 0.1, medium: 0.2, high: 0.25 },
  jsd: { low: 0.05, medium: 0.1, high: 0.15 },
};

const FEATURE_DRIFT: FeatureDrift[] = [
  { feature: "call_duration_7d_mean", ksScore: 0.18, psiScore: 0.12, jsdScore: 0.07, chi2Score: null,  dtype: "continuous",   severity: "medium",   trend: "increasing" },
  { feature: "data_usage_30d_sum",    ksScore: 0.31, psiScore: 0.28, jsdScore: 0.14, chi2Score: null,  dtype: "continuous",   severity: "high",     trend: "increasing" },
  { feature: "churn_lag_1d",          ksScore: 0.09, psiScore: 0.06, jsdScore: 0.03, chi2Score: null,  dtype: "continuous",   severity: "low",      trend: "stable"     },
  { feature: "roaming_flag",          ksScore: 0,    psiScore: 0,    jsdScore: 0,    chi2Score: 0.42,  dtype: "categorical",  severity: "low",      trend: "stable"     },
  { feature: "international_calls",   ksScore: 0.44, psiScore: 0.38, jsdScore: 0.21, chi2Score: null,  dtype: "continuous",   severity: "critical", trend: "increasing" },
  { feature: "avg_call_cost",         ksScore: 0.22, psiScore: 0.19, jsdScore: 0.09, chi2Score: null,  dtype: "continuous",   severity: "medium",   trend: "increasing" },
  { feature: "network_type",          ksScore: 0,    psiScore: 0,    jsdScore: 0,    chi2Score: 2.14,  dtype: "categorical",  severity: "medium",   trend: "increasing" },
  { feature: "contract_type",         ksScore: 0,    psiScore: 0,    jsdScore: 0,    chi2Score: 0.88,  dtype: "categorical",  severity: "low",      trend: "stable"     },
];

function genDriftTimeline(): DriftTimepoint[] {
  const points = [];
  for (let i = 30; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const driftGrowth = (30 - i) / 30;
    points.push({
      date: d.toLocaleDateString("en-ZA", { day: "2-digit", month: "short" }),
      composite:     Math.min(0.7, 0.08 + driftGrowth * 0.35 + (Math.random() - 0.5) * 0.03),
      call_duration: Math.min(0.5, 0.05 + driftGrowth * 0.18 + (Math.random() - 0.5) * 0.02),
      data_usage:    Math.min(0.7, 0.06 + driftGrowth * 0.30 + (Math.random() - 0.5) * 0.04),
      roaming_flag:  Math.min(0.1, 0.02 + driftGrowth * 0.05 + (Math.random() - 0.5) * 0.01),
      churn_lag:     Math.min(0.15, 0.04 + driftGrowth * 0.07 + (Math.random() - 0.5) * 0.01),
    });
  }
  return points;
}

const DRIFT_TIMELINE = genDriftTimeline();

const SEVERITY_CONFIG = {
  low:      { color: "#10B981", label: "Low"      },
  medium:   { color: "#F59E0B", label: "Medium"   },
  high:     { color: "#EF4444", label: "High"     },
  critical: { color: "#DC2626", label: "Critical" },
};

function DriftCell({ value, max }: { value: number; max: number }) {
  const pct = Math.min(1, value / max);
  const color = pct > 0.7 ? "#DC2626" : pct > 0.5 ? "#EF4444" : pct > 0.3 ? "#F59E0B" : "#10B981";
  return (
    <td className="px-3 py-2.5">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-[var(--etihuku-gray-800)] rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, backgroundColor: color }} />
        </div>
        <span className="text-xs font-mono shrink-0" style={{ color }}>{value.toFixed(2)}</span>
      </div>
    </td>
  );
}

interface DriftDashboardProps {
  modelName?: string;
}

export function DriftDashboard({ modelName = "churn-predictor-v3" }: DriftDashboardProps) {
  const [activeTest, setActiveTest] = useState<TestType>("psi");
  const [expandedFeature, setExpandedFeature] = useState<string | null>("international_calls");

  const criticalCount  = FEATURE_DRIFT.filter(f => f.severity === "critical").length;
  const highCount      = FEATURE_DRIFT.filter(f => f.severity === "high").length;
  const latestComposite = DRIFT_TIMELINE[DRIFT_TIMELINE.length - 1].composite;

  const sortedFeatures = [...FEATURE_DRIFT].sort((a, b) => {
    const scoreA = activeTest === "ks"  ? a.ksScore  :
                   activeTest === "psi" ? a.psiScore :
                   activeTest === "jsd" ? a.jsdScore : (a.chi2Score ?? 0);
    const scoreB = activeTest === "ks"  ? b.ksScore  :
                   activeTest === "psi" ? b.psiScore :
                   activeTest === "jsd" ? b.jsdScore : (b.chi2Score ?? 0);
    return scoreB - scoreA;
  });

  return (
    <div className="space-y-5">
      {/* Header stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card text-center">
          <div className={cn("text-2xl font-display font-bold",
            latestComposite > 0.3 ? "text-red-400" : latestComposite > 0.15 ? "text-amber-400" : "text-green-400"
          )}>
            {latestComposite.toFixed(2)}
          </div>
          <div className="text-xs text-[var(--etihuku-gray-500)] mt-0.5">Composite Drift</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-display font-bold text-red-400">{criticalCount + highCount}</div>
          <div className="text-xs text-[var(--etihuku-gray-500)] mt-0.5">High/Critical Features</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-display font-bold text-white">{FEATURE_DRIFT.length}</div>
          <div className="text-xs text-[var(--etihuku-gray-500)] mt-0.5">Features Monitored</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-display font-bold text-[var(--etihuku-gold)]">30d</div>
          <div className="text-xs text-[var(--etihuku-gray-500)] mt-0.5">Observation Window</div>
        </div>
      </div>

      {/* Drift timeline */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-[var(--etihuku-indigo)]" />
            <span className="text-sm font-medium text-white">{modelName} — Drift Over Time (PSI)</span>
          </div>
          <div className="flex gap-1 text-[10px]">
            {[
              { label: "Composite", color: "#EF4444" },
              { label: "Data Usage", color: "#F59E0B" },
              { label: "Call Duration", color: "#5046E5" },
            ].map(l => (
              <span key={l.label} className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--etihuku-gray-800)]" style={{ color: l.color }}>
                <span className="w-2 h-0.5 inline-block rounded" style={{ backgroundColor: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={DRIFT_TIMELINE} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="g-comp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--etihuku-gray-800)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "var(--etihuku-gray-500)", fontSize: 10 }} axisLine={false} tickLine={false} interval={5} />
            <YAxis domain={[0, 0.7]} tick={{ fill: "var(--etihuku-gray-500)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <ReferenceLine y={0.25} stroke="#EF4444" strokeDasharray="4 4" strokeOpacity={0.5}
              label={{ value: "Alert", position: "insideTopRight", fill: "#EF4444", fontSize: 10 }} />
            <ReferenceLine y={0.1} stroke="#F59E0B" strokeDasharray="4 4" strokeOpacity={0.4}
              label={{ value: "Warn", position: "insideTopRight", fill: "#F59E0B", fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "var(--etihuku-gray-900)", border: "1px solid var(--etihuku-gray-700)", borderRadius: 6, fontSize: 11 }}
              formatter={(v: number) => [v.toFixed(3), ""]} />
            <Area type="monotone" dataKey="composite"     stroke="#EF4444" strokeWidth={2.5} fill="url(#g-comp)" dot={false} />
            <Area type="monotone" dataKey="data_usage"    stroke="#F59E0B" strokeWidth={1.5} fill="none"           dot={false} />
            <Area type="monotone" dataKey="call_duration" stroke="#5046E5" strokeWidth={1.5} fill="none"           dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Feature drift table */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--etihuku-gray-800)]">
          <span className="text-sm font-medium text-white">Feature Drift Scores</span>
          <div className="flex gap-1">
            {(["psi", "ks", "jsd", "chi2"] as TestType[]).map(t => (
              <button
                key={t}
                onClick={() => setActiveTest(t)}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-mono font-medium border transition-all uppercase",
                  activeTest === t
                    ? "border-[var(--etihuku-indigo)] bg-[var(--etihuku-indigo)]/10 text-[var(--etihuku-indigo)]"
                    : "border-[var(--etihuku-gray-700)] text-[var(--etihuku-gray-400)] hover:border-[var(--etihuku-gray-500)]"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--etihuku-gray-800)] bg-[var(--etihuku-gray-900)]">
                <th className="px-4 py-2.5 text-left font-medium text-[var(--etihuku-gray-400)] uppercase tracking-wide">Feature</th>
                <th className="px-3 py-2.5 text-left font-medium text-[var(--etihuku-gray-400)] uppercase tracking-wide">PSI</th>
                <th className="px-3 py-2.5 text-left font-medium text-[var(--etihuku-gray-400)] uppercase tracking-wide">KS</th>
                <th className="px-3 py-2.5 text-left font-medium text-[var(--etihuku-gray-400)] uppercase tracking-wide">JSD</th>
                <th className="px-3 py-2.5 text-left font-medium text-[var(--etihuku-gray-400)] uppercase tracking-wide">Severity</th>
                <th className="px-3 py-2.5 text-left font-medium text-[var(--etihuku-gray-400)] uppercase tracking-wide">Trend</th>
              </tr>
            </thead>
            <tbody>
              {sortedFeatures.map(f => {
                const sevCfg = SEVERITY_CONFIG[f.severity];
                return (
                  <tr
                    key={f.feature}
                    className={cn(
                      "border-b border-[var(--etihuku-gray-900)] hover:bg-[var(--etihuku-gray-800)]/50 cursor-pointer transition-colors",
                      f.severity === "critical" && "bg-red-950/10",
                      expandedFeature === f.feature && "bg-[var(--etihuku-gray-800)]"
                    )}
                    onClick={() => setExpandedFeature(expandedFeature === f.feature ? null : f.feature)}
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sevCfg.color }} />
                        <span className="font-mono text-white">{f.feature}</span>
                        <span className="text-[9px] text-[var(--etihuku-gray-600)] capitalize">{f.dtype}</span>
                        {expandedFeature === f.feature ? <ChevronUp size={11} className="text-[var(--etihuku-gray-500)]" /> : <ChevronDown size={11} className="text-[var(--etihuku-gray-500)]" />}
                      </div>
                    </td>
                    <DriftCell value={f.psiScore} max={0.4} />
                    <DriftCell value={f.ksScore}  max={0.5} />
                    <DriftCell value={f.jsdScore} max={0.25} />
                    <td className="px-3 py-2.5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: sevCfg.color, backgroundColor: `${sevCfg.color}20` }}>
                        {sevCfg.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={cn("text-xs",
                        f.trend === "increasing" ? "text-red-400" :
                        f.trend === "decreasing" ? "text-green-400" : "text-[var(--etihuku-gray-500)]"
                      )}>
                        {f.trend === "increasing" ? "↑" : f.trend === "decreasing" ? "↓" : "→"} {f.trend}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
