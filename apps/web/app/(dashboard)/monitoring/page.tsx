"use client";

import { useState } from "react";
import { Cpu, Activity, Bell, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ModelRegistry, MOCK_MODELS, RegisteredModel } from "@/components/monitoring/ModelRegistry";
import { DriftDashboard } from "@/components/monitoring/DriftDashboard";
import { PerformanceMonitor } from "@/components/monitoring/PerformanceMonitor";
import { AlertsPanel } from "@/components/monitoring/AlertsPanel";
import { RetrainingPanel } from "@/components/monitoring/RetrainingPanel";

type MonitoringView = "registry" | "drift" | "performance" | "alerts" | "retraining";

const VIEWS: { id: MonitoringView; label: string; icon: React.ElementType }[] = [
  { id: "registry",    label: "Model Registry",    icon: Cpu       },
  { id: "drift",       label: "Drift Detection",   icon: Activity  },
  { id: "performance", label: "Performance",        icon: Activity  },
  { id: "alerts",      label: "Alerts",            icon: Bell      },
  { id: "retraining",  label: "Retraining",        icon: RefreshCw },
];

export default function MonitoringPage() {
  const [activeView, setActiveView] = useState<MonitoringView>("registry");
  const [selectedModel, setSelectedModel] = useState<RegisteredModel | null>(null);

  function handleSelectModel(model: RegisteredModel | null) {
    setSelectedModel(model);
    if (model) setActiveView("drift");
  }

  const degradedCount = MOCK_MODELS.filter(m => m.status === "degraded").length;
  const productionCount = MOCK_MODELS.filter(m => m.status === "production").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-h2 font-display text-white">Model Monitoring</h1>
          <p className="text-sm text-[var(--etihuku-gray-400)] mt-1">
            Track drift, performance degradation, alerts, and retraining pipelines
          </p>
        </div>
        {degradedCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-950/30 border border-red-800/50">
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span className="text-sm text-red-300 font-medium">{degradedCount} model{degradedCount > 1 ? "s" : ""} degraded</span>
          </div>
        )}
      </div>

      {/* Platform stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Registered Models",    value: MOCK_MODELS.length.toString(),  color: "text-white"                    },
          { label: "In Production",        value: productionCount.toString(),       color: "text-green-400"                },
          { label: "Degraded",             value: degradedCount.toString(),         color: "text-red-400"                  },
          { label: "Firing Alerts",        value: "2",                              color: "text-amber-400"                },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <div className={cn("text-2xl font-display font-bold", s.color)}>{s.value}</div>
            <div className="text-xs text-[var(--etihuku-gray-500)] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex gap-0 border-b border-[var(--etihuku-gray-800)] overflow-x-auto">
        {VIEWS.map(view => {
          const Icon = view.icon;
          const hasAlert = view.id === "alerts";
          return (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap relative",
                activeView === view.id
                  ? "border-[var(--etihuku-indigo)] text-[var(--etihuku-indigo)]"
                  : "border-transparent text-[var(--etihuku-gray-400)] hover:text-white"
              )}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{view.label}</span>
              {hasAlert && (
                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                  2
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected model context */}
      {selectedModel && activeView !== "registry" && (
        <div className="flex items-center gap-3 px-4 py-2 bg-[var(--etihuku-indigo)]/5 rounded-lg border border-[var(--etihuku-indigo)]/20">
          <Cpu size={14} className="text-[var(--etihuku-indigo)]" />
          <span className="text-xs text-[var(--etihuku-gray-300)]">
            Viewing: <strong className="text-white font-mono">{selectedModel.name}</strong> {selectedModel.version}
          </span>
          <button
            onClick={() => { setSelectedModel(null); setActiveView("registry"); }}
            className="text-xs text-[var(--etihuku-indigo)] hover:underline ml-auto"
          >
            ← All Models
          </button>
        </div>
      )}

      {/* Content */}
      {activeView === "registry" && (
        <div className="card">
          <h2 className="text-h4 font-display text-white mb-4">Model Registry</h2>
          <ModelRegistry onSelectModel={handleSelectModel} selectedId={selectedModel?.id ?? null} />
        </div>
      )}

      {activeView === "drift" && (
        <div className="card">
          <h2 className="text-h4 font-display text-white mb-4">Data Drift Detection</h2>
          <DriftDashboard modelName={selectedModel?.name} />
        </div>
      )}

      {activeView === "performance" && (
        <div className="card">
          <h2 className="text-h4 font-display text-white mb-4">Performance Monitoring</h2>
          <PerformanceMonitor modelName={selectedModel?.name} />
        </div>
      )}

      {activeView === "alerts" && (
        <div className="card">
          <h2 className="text-h4 font-display text-white mb-4">Alert Management</h2>
          <AlertsPanel />
        </div>
      )}

      {activeView === "retraining" && (
        <div className="card">
          <h2 className="text-h4 font-display text-white mb-4">Retraining Triggers & Lineage</h2>
          <RetrainingPanel />
        </div>
      )}
    </div>
  );
}
