"use client";

import { useState, useCallback } from "react";
import {
  Play, Plus, GitBranch, Layers, History, LayoutTemplate,
  Activity, CheckCircle2, XCircle, Clock, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { DAGEditor, DAGNode } from "@/components/pipelines/DAGEditor";
import { NodeConfigPanel } from "@/components/pipelines/NodeConfigPanel";
import { PipelineTemplates, PipelineTemplate } from "@/components/pipelines/PipelineTemplates";
import { ExecutionLog } from "@/components/pipelines/ExecutionLog";
import { VersionHistory } from "@/components/pipelines/VersionHistory";
import { FeatureStore } from "@/components/pipelines/FeatureStore";
import StatusBadge from "@/components/shared/StatusBadge";

type MainView = "builder" | "templates" | "execution" | "versions" | "features";

const MAIN_VIEWS: { id: MainView; label: string; icon: React.ElementType }[] = [
  { id: "builder",   label: "Pipeline Builder", icon: GitBranch      },
  { id: "templates", label: "Templates",         icon: LayoutTemplate },
  { id: "execution", label: "Execution Log",     icon: Activity       },
  { id: "versions",  label: "Version History",   icon: History        },
  { id: "features",  label: "Feature Store",     icon: Layers         },
];

const PIPELINE_LIST = [
  { id: "pl1", name: "CDR Processing Pipeline",    vertical: "telecom",     status: "running",  lastRun: "Now",    duration: "2.1s" },
  { id: "pl2", name: "Network KPI Aggregation",    vertical: "telecom",     status: "success",  lastRun: "1h ago", duration: "8.4s" },
  { id: "pl3", name: "Video Frame Extraction",     vertical: "security",    status: "success",  lastRun: "3h ago", duration: "12.1s"},
  { id: "pl4", name: "Sensor Normalization",       vertical: "mining",      status: "failed",   lastRun: "2h ago", duration: "—"    },
  { id: "pl5", name: "Inspection Image Pipeline",  vertical: "engineering", status: "pending",  lastRun: "Never",  duration: "—"    },
];

const VERTICAL_COLORS: Record<string, string> = {
  telecom: "#8B5CF6", security: "#F59E0B", mining: "#10B981", engineering: "#EC4899",
};

export default function PipelinesPage() {
  const [activeView, setActiveView] = useState<MainView>("builder");
  const [selectedPipeline, setSelectedPipeline] = useState(PIPELINE_LIST[0]);
  const [selectedNode, setSelectedNode] = useState<DAGNode | null>(null);
  const [nodeConfigs, setNodeConfigs] = useState<Record<string, Partial<DAGNode>>>({});
  const [isRunning, setIsRunning] = useState(false);

  const handleSelectNode = useCallback((node: DAGNode | null) => {
    setSelectedNode(node);
  }, []);

  function handleNodeUpdate(id: string, patch: Partial<DAGNode>) {
    setNodeConfigs(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
    if (selectedNode?.id === id) {
      setSelectedNode(prev => prev ? { ...prev, ...patch } : null);
    }
  }

  function handleApplyTemplate(template: PipelineTemplate) {
    setActiveView("builder");
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-h2 font-display text-white">Pipeline Builder</h1>
          <p className="text-sm text-[var(--etihuku-gray-400)] mt-1">
            Design, execute, and version your data transformation DAGs
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary flex items-center gap-2">
            <Plus size={15} /> New Pipeline
          </button>
          <button
            onClick={() => setIsRunning(r => !r)}
            className={cn(
              "btn flex items-center gap-2",
              isRunning ? "btn-secondary border-red-800 text-red-300" : "btn-primary"
            )}
          >
            {isRunning ? <><XCircle size={15} /> Stop</> : <><Play size={15} /> Run</>}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Pipelines",  value: "5",  color: "text-white"                    },
          { label: "Running",          value: "1",  color: "text-[var(--etihuku-indigo)]"  },
          { label: "Successful Today", value: "2",  color: "text-green-400"                },
          { label: "Failed Today",     value: "1",  color: "text-red-400"                  },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <div className={cn("text-2xl font-display font-bold", s.color)}>{s.value}</div>
            <div className="text-xs text-[var(--etihuku-gray-500)] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Pipeline list sidebar */}
        <div className="xl:col-span-1">
          <div className="text-xs font-medium text-[var(--etihuku-gray-400)] uppercase tracking-wide px-1 mb-3">
            Pipelines
          </div>
          <div className="space-y-1.5">
            {PIPELINE_LIST.map(pl => (
              <button
                key={pl.id}
                onClick={() => setSelectedPipeline(pl)}
                className={cn(
                  "w-full card p-3 text-left transition-all",
                  selectedPipeline.id === pl.id
                    ? "border-[var(--etihuku-indigo)] shadow-glow"
                    : "hover:border-[var(--etihuku-gray-600)]"
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-medium text-white leading-tight">{pl.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: VERTICAL_COLORS[pl.vertical] }} />
                    <span className="text-[10px] text-[var(--etihuku-gray-500)] capitalize">{pl.vertical}</span>
                  </div>
                  <StatusBadge status={pl.status as "success" | "running" | "failed" | "pending"} />
                </div>
                <div className="text-[10px] text-[var(--etihuku-gray-600)] mt-1">{pl.lastRun} · {pl.duration}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="xl:col-span-3 space-y-4">
          {/* View tabs */}
          <div className="flex gap-0 border-b border-[var(--etihuku-gray-800)] overflow-x-auto">
            {MAIN_VIEWS.map(view => {
              const Icon = view.icon;
              return (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap",
                    activeView === view.id
                      ? "border-[var(--etihuku-indigo)] text-[var(--etihuku-indigo)]"
                      : "border-transparent text-[var(--etihuku-gray-400)] hover:text-white"
                  )}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{view.label}</span>
                </button>
              );
            })}
          </div>

          {/* Builder view: DAG + config panel */}
          {activeView === "builder" && (
            <div className="space-y-4">
              {/* Pipeline name + status */}
              <div className="flex items-center gap-3">
                <h2 className="text-h4 font-display text-white">{selectedPipeline.name}</h2>
                <StatusBadge status={selectedPipeline.status as "success" | "running" | "failed" | "pending"} />
              </div>

              {/* DAG + config side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <DAGEditor
                    onSelectNode={handleSelectNode}
                    selectedNodeId={selectedNode?.id ?? null}
                    running={isRunning}
                  />
                </div>
                <div className="lg:col-span-1">
                  <NodeConfigPanel
                    node={selectedNode}
                    onClose={() => setSelectedNode(null)}
                    onUpdate={handleNodeUpdate}
                  />
                </div>
              </div>
            </div>
          )}

          {activeView === "templates" && (
            <div className="card">
              <h2 className="text-h4 font-display text-white mb-4">Pipeline Templates</h2>
              <PipelineTemplates onApply={handleApplyTemplate} />
            </div>
          )}

          {activeView === "execution" && (
            <div className="card">
              <h2 className="text-h4 font-display text-white mb-4">Execution Log</h2>
              <ExecutionLog pipelineName={selectedPipeline.name} />
            </div>
          )}

          {activeView === "versions" && (
            <div className="card">
              <h2 className="text-h4 font-display text-white mb-4">Version History</h2>
              <VersionHistory pipelineName={selectedPipeline.name} />
            </div>
          )}

          {activeView === "features" && (
            <div className="card">
              <h2 className="text-h4 font-display text-white mb-4">Feature Store</h2>
              <FeatureStore />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
