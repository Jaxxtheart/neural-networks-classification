"use client";

import { useState } from "react";
import {
  Wand2, Copy, Trash2, TrendingDown, AlertTriangle,
  CheckCircle2, Settings, Play, ChevronDown, ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface RemediationRule {
  id: string;
  name: string;
  type: "dedup" | "null_imputation" | "outlier";
  enabled: boolean;
  appliedTo: string[];
  config: Record<string, string | number | boolean>;
  lastRun: string;
  recordsFixed: number;
}

const INITIAL_RULES: RemediationRule[] = [
  {
    id: "rem-1", name: "Duplicate Record Removal", type: "dedup", enabled: true,
    appliedTo: ["CDR Dataset", "Customer Master"],
    config: { strategy: "keep_last", matchColumns: "customer_id, event_timestamp", threshold: 0.95 },
    lastRun: "1h ago", recordsFixed: 284,
  },
  {
    id: "rem-2", name: "Null Value Imputation", type: "null_imputation", enabled: true,
    appliedTo: ["CDR Dataset"],
    config: { strategy: "median", columns: "data_usage_mb, call_duration_sec", maxNullPct: 15 },
    lastRun: "1h ago", recordsFixed: 1027,
  },
  {
    id: "rem-3", name: "Outlier Capping (IQR)", type: "outlier", enabled: false,
    appliedTo: ["Sensor Readings"],
    config: { method: "iqr", multiplier: 1.5, action: "cap", columns: "sensor_value, temperature" },
    lastRun: "Never", recordsFixed: 0,
  },
];

const TYPE_CONFIG = {
  dedup:           { icon: Copy,        label: "Deduplication",    color: "#8B5CF6", bg: "bg-violet-950" },
  null_imputation: { icon: Wand2,       label: "Null Imputation",  color: "#10B981", bg: "bg-green-950"  },
  outlier:         { icon: TrendingDown,label: "Outlier Handling", color: "#F59E0B", bg: "bg-amber-950"  },
};

const STRATEGIES = {
  dedup: ["keep_first", "keep_last", "keep_highest_quality"],
  null_imputation: ["mean", "median", "mode", "zero", "forward_fill", "backward_fill", "model_predict"],
  outlier: ["iqr", "zscore", "isolation_forest"],
};

const OUTLIER_ACTIONS = ["cap", "flag", "remove", "impute"];

export function RemediationPanel() {
  const [rules, setRules] = useState<RemediationRule[]>(INITIAL_RULES);
  const [expanded, setExpanded] = useState<string | null>("rem-1");
  const [running, setRunning] = useState<string | null>(null);

  function toggleEnabled(id: string) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }

  function runRule(id: string) {
    setRunning(id);
    setTimeout(() => {
      setRules(prev => prev.map(r =>
        r.id === id ? { ...r, lastRun: "just now", recordsFixed: r.recordsFixed + Math.floor(Math.random() * 100) } : r
      ));
      setRunning(null);
    }, 2000);
  }

  function updateConfig(id: string, key: string, value: string | number | boolean) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, config: { ...r.config, [key]: value } } : r));
  }

  const totalFixed = rules.reduce((s, r) => s + r.recordsFixed, 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <div className="text-2xl font-display font-bold text-[var(--etihuku-indigo)]">{rules.filter(r => r.enabled).length}</div>
          <div className="text-xs text-[var(--etihuku-gray-500)] mt-0.5">Active Rules</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-display font-bold text-[var(--etihuku-gold)]">{totalFixed.toLocaleString()}</div>
          <div className="text-xs text-[var(--etihuku-gray-500)] mt-0.5">Records Fixed</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-display font-bold text-green-400">3</div>
          <div className="text-xs text-[var(--etihuku-gray-500)] mt-0.5">Pipelines Protected</div>
        </div>
      </div>

      {/* Rules */}
      <div className="space-y-2">
        {rules.map(rule => {
          const typeCfg = TYPE_CONFIG[rule.type];
          const TypeIcon = typeCfg.icon;
          const isExpanded = expanded === rule.id;

          return (
            <div key={rule.id} className={cn("card overflow-hidden", !rule.enabled && "opacity-60")}>
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", typeCfg.bg)}>
                  <TypeIcon size={18} style={{ color: typeCfg.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm text-white">{rule.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      style={{ color: typeCfg.color, backgroundColor: `${typeCfg.color}15` }}>
                      {typeCfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--etihuku-gray-500)]">
                    <span>{rule.appliedTo.join(", ")}</span>
                    {rule.recordsFixed > 0 && (
                      <span className="text-green-400">{rule.recordsFixed.toLocaleString()} fixed</span>
                    )}
                    <span>· {rule.lastRun}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => runRule(rule.id)}
                    disabled={!rule.enabled || running === rule.id}
                    className={cn(
                      "p-1.5 rounded transition-all",
                      rule.enabled ? "hover:bg-[var(--etihuku-indigo)]/20 text-[var(--etihuku-indigo)]" : "text-[var(--etihuku-gray-700)] cursor-not-allowed"
                    )}
                  >
                    <Play size={14} className={running === rule.id ? "animate-pulse" : ""} />
                  </button>

                  {/* Toggle switch */}
                  <button
                    onClick={() => toggleEnabled(rule.id)}
                    className={cn(
                      "relative w-10 h-5 rounded-full transition-colors",
                      rule.enabled ? "bg-[var(--etihuku-indigo)]" : "bg-[var(--etihuku-gray-700)]"
                    )}
                  >
                    <div className={cn(
                      "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                      rule.enabled ? "translate-x-5" : "translate-x-0.5"
                    )} />
                  </button>

                  <button
                    onClick={() => setExpanded(isExpanded ? null : rule.id)}
                    className="p-1.5 rounded hover:bg-[var(--etihuku-gray-800)] text-[var(--etihuku-gray-500)]"
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Config panel */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-[var(--etihuku-gray-800)] space-y-3">
                  {rule.type === "dedup" && (
                    <>
                      <ConfigRow label="Match Strategy">
                        <select
                          value={rule.config.strategy as string}
                          onChange={e => updateConfig(rule.id, "strategy", e.target.value)}
                          className="form-input"
                        >
                          {STRATEGIES.dedup.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                        </select>
                      </ConfigRow>
                      <ConfigRow label="Match On Columns">
                        <input
                          value={rule.config.matchColumns as string}
                          onChange={e => updateConfig(rule.id, "matchColumns", e.target.value)}
                          placeholder="col1, col2"
                          className="form-input font-mono text-sm"
                        />
                      </ConfigRow>
                      <ConfigRow label="Fuzzy Match Threshold">
                        <div className="flex items-center gap-3">
                          <input
                            type="range" min={0.7} max={1} step={0.01}
                            value={rule.config.threshold as number}
                            onChange={e => updateConfig(rule.id, "threshold", parseFloat(e.target.value))}
                            className="flex-1 accent-[var(--etihuku-indigo)]"
                          />
                          <span className="text-sm font-mono text-[var(--etihuku-gold)] w-10 text-right">
                            {(rule.config.threshold as number).toFixed(2)}
                          </span>
                        </div>
                      </ConfigRow>
                    </>
                  )}

                  {rule.type === "null_imputation" && (
                    <>
                      <ConfigRow label="Imputation Strategy">
                        <select
                          value={rule.config.strategy as string}
                          onChange={e => updateConfig(rule.id, "strategy", e.target.value)}
                          className="form-input"
                        >
                          {STRATEGIES.null_imputation.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                        </select>
                      </ConfigRow>
                      <ConfigRow label="Target Columns">
                        <input
                          value={rule.config.columns as string}
                          onChange={e => updateConfig(rule.id, "columns", e.target.value)}
                          placeholder="col1, col2"
                          className="form-input font-mono text-sm"
                        />
                      </ConfigRow>
                      <ConfigRow label="Max Null % to Impute">
                        <div className="flex items-center gap-3">
                          <input
                            type="range" min={1} max={50} step={1}
                            value={rule.config.maxNullPct as number}
                            onChange={e => updateConfig(rule.id, "maxNullPct", parseInt(e.target.value))}
                            className="flex-1 accent-[var(--etihuku-indigo)]"
                          />
                          <span className="text-sm font-mono text-[var(--etihuku-gold)] w-12 text-right">
                            {rule.config.maxNullPct}%
                          </span>
                        </div>
                      </ConfigRow>
                    </>
                  )}

                  {rule.type === "outlier" && (
                    <>
                      <ConfigRow label="Detection Method">
                        <select
                          value={rule.config.method as string}
                          onChange={e => updateConfig(rule.id, "method", e.target.value)}
                          className="form-input"
                        >
                          {STRATEGIES.outlier.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                        </select>
                      </ConfigRow>
                      <ConfigRow label="Action on Outlier">
                        <select
                          value={rule.config.action as string}
                          onChange={e => updateConfig(rule.id, "action", e.target.value)}
                          className="form-input"
                        >
                          {OUTLIER_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </ConfigRow>
                      {rule.config.method === "iqr" && (
                        <ConfigRow label="IQR Multiplier">
                          <div className="flex items-center gap-3">
                            <input
                              type="range" min={1} max={3} step={0.1}
                              value={rule.config.multiplier as number}
                              onChange={e => updateConfig(rule.id, "multiplier", parseFloat(e.target.value))}
                              className="flex-1 accent-[var(--etihuku-indigo)]"
                            />
                            <span className="text-sm font-mono text-[var(--etihuku-gold)] w-8 text-right">
                              {(rule.config.multiplier as number).toFixed(1)}
                            </span>
                          </div>
                        </ConfigRow>
                      )}
                      <ConfigRow label="Target Columns">
                        <input
                          value={rule.config.columns as string}
                          onChange={e => updateConfig(rule.id, "columns", e.target.value)}
                          placeholder="col1, col2"
                          className="form-input font-mono text-sm"
                        />
                      </ConfigRow>
                    </>
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

function ConfigRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 items-center gap-3">
      <label className="text-xs font-medium text-[var(--etihuku-gray-400)] col-span-1">{label}</label>
      <div className="col-span-2">{children}</div>
    </div>
  );
}
