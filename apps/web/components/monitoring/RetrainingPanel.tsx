"use client";

import { useState } from "react";
import {
  RefreshCw, Play, CheckCircle2, Clock, Database, GitBranch,
  ArrowRight, Zap, BarChart2, ChevronRight, AlertTriangle, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

type TriggerType = "manual" | "drift" | "schedule" | "performance";
type RunStatus = "queued" | "preparing" | "training" | "evaluating" | "completed" | "failed";

interface RetrainingRun {
  id: string;
  model: string;
  version: string;
  trigger: TriggerType;
  status: RunStatus;
  startedAt: string;
  completedAt?: string;
  driftScore: number;
  trainDataset: string;
  trainRows: string;
  baselineF1: number;
  newF1?: number;
  promoted: boolean;
  logSteps: { label: string; done: boolean; active: boolean }[];
}

const TRIGGER_CONFIG: Record<TriggerType, { label: string; color: string; icon: React.ElementType }> = {
  manual:      { label: "Manual",      color: "#5046E5", icon: Play          },
  drift:       { label: "Drift Alert", color: "#EF4444", icon: AlertTriangle },
  schedule:    { label: "Scheduled",   color: "#3B82F6", icon: Clock         },
  performance: { label: "Perf Drop",   color: "#F59E0B", icon: TrendingUp    },
};

const STATUS_CONFIG: Record<RunStatus, { label: string; color: string }> = {
  queued:     { label: "Queued",      color: "#6B6B88" },
  preparing:  { label: "Preparing",   color: "#3B82F6" },
  training:   { label: "Training",    color: "#5046E5" },
  evaluating: { label: "Evaluating",  color: "#F59E0B" },
  completed:  { label: "Completed",   color: "#10B981" },
  failed:     { label: "Failed",      color: "#EF4444" },
};

const MOCK_RUNS: RetrainingRun[] = [
  {
    id: "run-1", model: "churn-predictor-v3", version: "3.3.0",
    trigger: "drift", status: "training",
    startedAt: "Today 16:30", driftScore: 0.31,
    trainDataset: "CDR Dataset v2.4 (Dec 2025–Feb 2026)", trainRows: "284K",
    baselineF1: 0.882, promoted: false,
    logSteps: [
      { label: "Generate training set from CDR pipeline", done: true, active: false },
      { label: "Apply feature engineering (24 features)", done: true, active: false },
      { label: "Quality gate: 91.3 / 100 ✓",            done: true, active: false },
      { label: "XGBoost training (300 trees, depth=6)",  done: false, active: true  },
      { label: "Cross-validation (5-fold)",              done: false, active: false },
      { label: "Evaluation vs baseline",                 done: false, active: false },
      { label: "Promotion decision",                     done: false, active: false },
    ],
  },
  {
    id: "run-2", model: "intrusion-classifier", version: "2.2.0",
    trigger: "performance", status: "queued",
    startedAt: "Queued 15:45", driftScore: 0.67,
    trainDataset: "Access Log Dataset (2025 Q4 – 2026 Q1)", trainRows: "142K",
    baselineF1: 0.741, promoted: false,
    logSteps: [
      { label: "Await CDR pipeline completion",           done: false, active: false },
      { label: "Apply access feature extraction",         done: false, active: false },
      { label: "LightGBM training",                      done: false, active: false },
      { label: "Evaluation vs baseline",                 done: false, active: false },
    ],
  },
  {
    id: "run-3", model: "churn-predictor-v3", version: "3.2.1",
    trigger: "schedule", status: "completed",
    startedAt: "2026-01-15 09:00", completedAt: "2026-01-15 10:22",
    driftScore: 0.09, trainDataset: "CDR Dataset v2.3", trainRows: "248K",
    baselineF1: 0.894, newF1: 0.912, promoted: true,
    logSteps: [],
  },
  {
    id: "run-4", model: "network-anomaly-detector", version: "1.4.0",
    trigger: "manual", status: "completed",
    startedAt: "2026-02-01 14:00", completedAt: "2026-02-01 15:48",
    driftScore: 0.12, trainDataset: "Network KPI v2.1", trainRows: "2.1M",
    baselineF1: 0.866, newF1: 0.878, promoted: true,
    logSteps: [],
  },
];

interface ThresholdConfig {
  model: string;
  psiThreshold: number;
  perfThreshold: number;
  autoTrigger: boolean;
}

const THRESHOLDS: ThresholdConfig[] = [
  { model: "churn-predictor-v3",       psiThreshold: 0.25, perfThreshold: 0.88, autoTrigger: true  },
  { model: "intrusion-classifier",      psiThreshold: 0.20, perfThreshold: 0.80, autoTrigger: true  },
  { model: "network-anomaly-detector",  psiThreshold: 0.30, perfThreshold: 0.85, autoTrigger: false },
  { model: "bearing-failure-predictor", psiThreshold: 0.20, perfThreshold: 0.90, autoTrigger: false },
];

export function RetrainingPanel() {
  const [runs] = useState<RetrainingRun[]>(MOCK_RUNS);
  const [thresholds, setThresholds] = useState<ThresholdConfig[]>(THRESHOLDS);
  const [activeRun, setActiveRun] = useState<string>("run-1");
  const [showTrigger, setShowTrigger] = useState(false);

  const selectedRun = runs.find(r => r.id === activeRun);

  function updateThreshold(model: string, key: keyof ThresholdConfig, value: number | boolean) {
    setThresholds(prev => prev.map(t => t.model === model ? { ...t, [key]: value } : t));
  }

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Retraining Runs",  value: runs.length.toString(),                                   color: "text-white"                    },
          { label: "In Progress",      value: runs.filter(r => !["completed","failed"].includes(r.status)).length.toString(), color: "text-[var(--etihuku-indigo)]" },
          { label: "Promoted Models",  value: runs.filter(r => r.promoted).length.toString(),            color: "text-green-400"                },
          { label: "Auto-Triggers",    value: thresholds.filter(t => t.autoTrigger).length.toString(),   color: "text-[var(--etihuku-gold)]"    },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <div className={cn("text-2xl font-display font-bold", s.color)}>{s.value}</div>
            <div className="text-xs text-[var(--etihuku-gray-500)] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Run list */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-[var(--etihuku-gray-400)] uppercase tracking-wide">Retraining Runs</div>
            <button
              onClick={() => setShowTrigger(s => !s)}
              className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs"
            >
              <Play size={11} /> Trigger
            </button>
          </div>

          {runs.map(run => {
            const statusCfg = STATUS_CONFIG[run.status];
            const triggerCfg = TRIGGER_CONFIG[run.trigger];
            const TrigIcon = triggerCfg.icon;

            return (
              <div
                key={run.id}
                onClick={() => setActiveRun(run.id)}
                className={cn(
                  "card p-3 cursor-pointer transition-all",
                  activeRun === run.id ? "border-[var(--etihuku-indigo)] shadow-glow" : "hover:border-[var(--etihuku-gray-600)]"
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-mono text-xs font-semibold text-white truncate">{run.model}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div
                      className={cn("w-2 h-2 rounded-full", run.status === "training" && "animate-pulse")}
                      style={{ backgroundColor: statusCfg.color }}
                    />
                    <span className="text-[10px] font-medium" style={{ color: statusCfg.color }}>{statusCfg.label}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-[var(--etihuku-gray-500)]">
                  <div className="flex items-center gap-1.5">
                    <TrigIcon size={9} style={{ color: triggerCfg.color }} />
                    <span>{triggerCfg.label}</span>
                  </div>
                  <span>{run.version}</span>
                </div>
                {run.newF1 && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[10px]">
                    <span className="text-[var(--etihuku-gray-500)]">F1:</span>
                    <span className="font-mono text-[var(--etihuku-gray-400)]">{run.baselineF1.toFixed(3)}</span>
                    <ArrowRight size={9} className="text-[var(--etihuku-gray-600)]" />
                    <span className="font-mono text-green-400 font-bold">{run.newF1.toFixed(3)}</span>
                    {run.promoted && <span className="text-green-400">· Promoted ✓</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Run detail */}
        <div className="lg:col-span-3 space-y-3">
          {selectedRun && (
            <>
              <div className="card">
                <div className="flex items-center gap-2 mb-3">
                  <RefreshCw size={14} className={cn("text-[var(--etihuku-indigo)]", selectedRun.status === "training" && "animate-spin")} />
                  <span className="font-medium text-white">{selectedRun.model} → {selectedRun.version}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                  {[
                    { label: "Training Dataset", value: selectedRun.trainDataset.slice(0, 28) + "…" },
                    { label: "Training Rows",    value: selectedRun.trainRows                        },
                    { label: "Drift Score",      value: selectedRun.driftScore.toFixed(2)            },
                    { label: "Baseline F1",      value: selectedRun.baselineF1.toFixed(3)            },
                    { label: "New F1",           value: selectedRun.newF1?.toFixed(3) ?? "Pending"  },
                    { label: "Started",          value: selectedRun.startedAt                        },
                  ].map(row => (
                    <div key={row.label} className="bg-[var(--etihuku-gray-800)] rounded p-2">
                      <div className="text-[9px] uppercase tracking-wide text-[var(--etihuku-gray-500)] mb-0.5">{row.label}</div>
                      <div className="text-xs font-mono font-semibold text-white truncate">{row.value}</div>
                    </div>
                  ))}
                </div>

                {/* Progress steps */}
                {selectedRun.logSteps.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] uppercase tracking-wide text-[var(--etihuku-gray-500)] mb-2">Pipeline Steps</div>
                    {selectedRun.logSteps.map((step, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold",
                          step.done   ? "bg-[var(--etihuku-indigo)] text-white" :
                          step.active ? "bg-[var(--etihuku-indigo)]/20 border-2 border-[var(--etihuku-indigo)]" :
                                        "bg-[var(--etihuku-gray-800)] text-[var(--etihuku-gray-600)]"
                        )}>
                          {step.done ? <CheckCircle2 size={11} /> : step.active ? <div className="w-2 h-2 rounded-full bg-[var(--etihuku-indigo)] animate-pulse" /> : i + 1}
                        </div>
                        <span className={cn("text-xs",
                          step.done   ? "text-[var(--etihuku-gray-300)] line-through" :
                          step.active ? "text-white font-medium" :
                                        "text-[var(--etihuku-gray-600)]"
                        )}>
                          {step.label}
                        </span>
                        {step.active && <RefreshCw size={10} className="text-[var(--etihuku-indigo)] animate-spin ml-auto" />}
                      </div>
                    ))}
                  </div>
                )}

                {selectedRun.status === "completed" && selectedRun.newF1 && (
                  <div className={cn(
                    "mt-3 p-3 rounded-lg border",
                    selectedRun.promoted
                      ? "border-green-800 bg-green-950/20"
                      : "border-amber-800 bg-amber-950/20"
                  )}>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className={selectedRun.promoted ? "text-green-400" : "text-amber-400"} />
                      <span className="text-sm font-medium" style={{ color: selectedRun.promoted ? "#10B981" : "#F59E0B" }}>
                        {selectedRun.promoted ? `Promoted to production — F1 ${selectedRun.baselineF1.toFixed(3)} → ${selectedRun.newF1.toFixed(3)} (+${((selectedRun.newF1 - selectedRun.baselineF1) * 100).toFixed(1)}%)` : "Awaiting promotion decision"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Threshold config */}
              <div className="card">
                <div className="text-xs font-medium text-[var(--etihuku-gray-300)] uppercase tracking-wide mb-3">
                  Auto-Trigger Thresholds
                </div>
                <div className="space-y-3">
                  {thresholds.map(t => (
                    <div key={t.model} className="p-3 rounded-lg bg-[var(--etihuku-gray-800)] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-medium text-white">{t.model}</span>
                        <button
                          onClick={() => updateThreshold(t.model, "autoTrigger", !t.autoTrigger)}
                          className={cn(
                            "relative w-8 h-4 rounded-full transition-colors",
                            t.autoTrigger ? "bg-[var(--etihuku-indigo)]" : "bg-[var(--etihuku-gray-700)]"
                          )}
                        >
                          <div className={cn(
                            "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform",
                            t.autoTrigger ? "translate-x-4" : "translate-x-0.5"
                          )} />
                        </button>
                      </div>
                      {t.autoTrigger && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-[9px] text-[var(--etihuku-gray-500)] mb-1">PSI Threshold</div>
                            <div className="flex items-center gap-2">
                              <input type="range" min={0.05} max={0.5} step={0.05}
                                value={t.psiThreshold}
                                onChange={e => updateThreshold(t.model, "psiThreshold", parseFloat(e.target.value))}
                                className="flex-1 accent-[var(--etihuku-indigo)]"
                              />
                              <span className="text-xs font-mono text-[var(--etihuku-gold)] w-8 text-right">{t.psiThreshold.toFixed(2)}</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] text-[var(--etihuku-gray-500)] mb-1">Min F1 Threshold</div>
                            <div className="flex items-center gap-2">
                              <input type="range" min={0.6} max={0.99} step={0.01}
                                value={t.perfThreshold}
                                onChange={e => updateThreshold(t.model, "perfThreshold", parseFloat(e.target.value))}
                                className="flex-1 accent-[var(--etihuku-indigo)]"
                              />
                              <span className="text-xs font-mono text-[var(--etihuku-gold)] w-8 text-right">{t.perfThreshold.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
