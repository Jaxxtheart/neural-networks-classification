"use client";

import { useState } from "react";
import {
  Image, FileText, Activity, Table2, Brain, Zap,
  Users, FolderOpen, ChevronRight, Tag
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ImageAnnotationCanvas } from "@/components/annotations/ImageAnnotationCanvas";
import { TextAnnotationEditor } from "@/components/annotations/TextAnnotationEditor";
import { TimeSeriesAnnotator } from "@/components/annotations/TimeSeriesAnnotator";
import { TabularAnnotator } from "@/components/annotations/TabularAnnotator";
import { ActiveLearningPanel } from "@/components/annotations/ActiveLearningPanel";
import { QAPanel } from "@/components/annotations/QAPanel";

type WorkspaceMode = "image" | "text" | "timeseries" | "tabular";
type TopView = "workspace" | "active-learning" | "qa";

const WORKSPACE_MODES: { id: WorkspaceMode; label: string; icon: React.ElementType; description: string }[] = [
  { id: "image",      label: "Image",      icon: Image,    description: "Bounding box, polygon, point" },
  { id: "text",       label: "Text",       icon: FileText, description: "NER, classification, relations" },
  { id: "timeseries", label: "Time-Series",icon: Activity, description: "Event labeling on charts" },
  { id: "tabular",    label: "Tabular",    icon: Table2,   description: "Row & column annotation" },
];

export default function AnnotationsPage() {
  const [topView, setTopView] = useState<TopView>("workspace");
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("image");

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-h2 font-display text-white">Annotation Studio</h1>
          <p className="text-sm text-[var(--etihuku-gray-400)] mt-1">
            Label datasets with AI pre-annotation powered by Claude, active learning, and QA workflows
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Samples Labelled", value: "1,156",  color: "text-white"                    },
          { label: "AI Pre-annotated", value: "73%",    color: "text-[var(--etihuku-indigo)]"  },
          { label: "Avg Agreement",    value: "κ=0.89", color: "text-[var(--etihuku-gold)]"    },
          { label: "Active Reviewers", value: "4",      color: "text-green-400"                },
        ].map(kpi => (
          <div key={kpi.label} className="card text-center">
            <div className={cn("text-2xl font-display font-bold", kpi.color)}>{kpi.value}</div>
            <div className="text-xs text-[var(--etihuku-gray-500)] mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Top-level navigation */}
      <div className="flex gap-2 flex-wrap">
        {([
          { id: "workspace",      label: "Labeling Workspace",  icon: Tag,    count: null },
          { id: "active-learning",label: "Active Learning",      icon: Brain,  count: 5    },
          { id: "qa",             label: "Quality Assurance",    icon: Users,  count: 2    },
        ] as { id: TopView; label: string; icon: React.ElementType; count: number | null }[]).map(v => {
          const Icon = v.icon;
          return (
            <button
              key={v.id}
              onClick={() => setTopView(v.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                topView === v.id
                  ? "bg-[var(--etihuku-indigo)] border-[var(--etihuku-indigo)] text-white"
                  : "border-[var(--etihuku-gray-700)] text-[var(--etihuku-gray-400)] hover:border-[var(--etihuku-gray-500)] hover:text-white"
              )}
            >
              <Icon size={15} />
              {v.label}
              {v.count !== null && (
                <span className={cn(
                  "text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center",
                  topView === v.id ? "bg-white/20" : "bg-[var(--etihuku-indigo)]/30 text-[var(--etihuku-indigo)]"
                )}>
                  {v.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Workspace view */}
      {topView === "workspace" && (
        <div className="space-y-4">
          {/* Data type switcher */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {WORKSPACE_MODES.map(mode => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => setWorkspaceMode(mode.id)}
                  className={cn(
                    "card p-3 text-left transition-all",
                    workspaceMode === mode.id ? "border-[var(--etihuku-indigo)] bg-[var(--etihuku-indigo)]/5" : "hover:border-[var(--etihuku-gray-600)]"
                  )}
                >
                  <Icon size={18} className={cn("mb-2", workspaceMode === mode.id ? "text-[var(--etihuku-indigo)]" : "text-[var(--etihuku-gray-500)]")} />
                  <div className="text-sm font-medium text-white">{mode.label}</div>
                  <div className="text-[10px] text-[var(--etihuku-gray-500)] mt-0.5">{mode.description}</div>
                </button>
              );
            })}
          </div>

          {/* LLM pre-annotation notice */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--etihuku-indigo)]/5 border border-[var(--etihuku-indigo)]/20">
            <Zap size={16} className="text-[var(--etihuku-indigo)] shrink-0" />
            <div className="flex-1 text-xs text-[var(--etihuku-gray-300)]">
              <strong className="text-white">Claude AI Pre-annotation</strong> active —
              suggestions shown with dashed borders. Accept <kbd className="px-1 py-0.5 rounded bg-[var(--etihuku-gray-800)] font-mono text-[9px]">✓</kbd> or
              reject <kbd className="px-1 py-0.5 rounded bg-[var(--etihuku-gray-800)] font-mono text-[9px]">✗</kbd> each suggestion.
              Accepted labels feed back to improve the pre-annotation model.
            </div>
            <div className="text-xs text-[var(--etihuku-indigo)] font-medium shrink-0">73% acceptance</div>
          </div>

          {/* Annotation workspace */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FolderOpen size={14} className="text-[var(--etihuku-gray-400)]" />
                <span className="text-xs text-[var(--etihuku-gray-400)]">
                  {workspaceMode === "image"      && "Mine Floor CCTV Batch 12 · Image 247/420"}
                  {workspaceMode === "text"       && "Fraud Case Transcripts · Document 032/800"}
                  {workspaceMode === "timeseries" && "Sensor Array Alpha · Batch 2026-02-14"}
                  {workspaceMode === "tabular"    && "Transaction Dataset · Batch Feb 2026"}
                </span>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-secondary btn-sm text-xs">← Prev</button>
                <button className="btn btn-primary btn-sm text-xs">Next →</button>
              </div>
            </div>

            {workspaceMode === "image"      && (
              <div style={{ height: 480 }}>
                <ImageAnnotationCanvas />
              </div>
            )}
            {workspaceMode === "text"       && <TextAnnotationEditor />}
            {workspaceMode === "timeseries" && <TimeSeriesAnnotator />}
            {workspaceMode === "tabular"    && <TabularAnnotator />}
          </div>
        </div>
      )}

      {/* Active learning */}
      {topView === "active-learning" && (
        <div className="card">
          <h2 className="text-h4 font-display text-white mb-4">Active Learning Queue</h2>
          <ActiveLearningPanel />
        </div>
      )}

      {/* QA */}
      {topView === "qa" && (
        <div className="card">
          <h2 className="text-h4 font-display text-white mb-4">Quality Assurance</h2>
          <QAPanel />
        </div>
      )}
    </div>
  );
}
