"use client";

import { useState } from "react";
import {
  GitCommit, GitBranch, RotateCcw, Eye, Plus, Minus,
  ChevronDown, ChevronUp, User, Clock, Tag
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface PipelineVersion {
  id: string;
  shortId: string;
  message: string;
  author: string;
  timestamp: string;
  tags: string[];
  diff: {
    added: string[];
    removed: string[];
    modified: string[];
  };
}

const MOCK_VERSIONS: PipelineVersion[] = [
  {
    id: "a3f7c9d2", shortId: "a3f7c9d",
    message: "Add quality gate threshold 85 → 90 and retry policy",
    author: "T. Ndlovu", timestamp: "Today, 14:18",
    tags: ["latest", "v1.3"],
    diff: {
      added: ["Quality Gate: min threshold set to 90", "Retry policy: 3x with exponential backoff"],
      removed: ["Old threshold: 85"],
      modified: ["Node: Quality Check — updated config"],
    },
  },
  {
    id: "b8e12f4a", shortId: "b8e12f4",
    message: "Feature engineering: add lag features (1d, 3d, 7d) and 30-day rolling window",
    author: "S. Botha", timestamp: "Today, 11:02",
    tags: [],
    diff: {
      added: ["Lag feature: 1d", "Lag feature: 3d", "Lag feature: 7d", "Rolling window: 30d"],
      removed: [],
      modified: ["Node: Feature Eng. — expanded transform config"],
    },
  },
  {
    id: "c4a87b31", shortId: "c4a87b3",
    message: "Switched Network KPIs source from REST to Kafka stream",
    author: "T. Ndlovu", timestamp: "Yesterday, 16:45",
    tags: ["v1.2"],
    diff: {
      added: ["Source: Kafka — network-events topic"],
      removed: ["Source: REST API — /api/v2/kpis"],
      modified: [],
    },
  },
  {
    id: "d9c23e86", shortId: "d9c23e8",
    message: "Initial pipeline scaffold from CDR Processing template",
    author: "A. Dlamini", timestamp: "26/01/2026 09:00",
    tags: ["v1.0", "initial"],
    diff: {
      added: ["Source: CDR PostgreSQL", "Transform: Join & Enrich", "Transform: Feature Eng.", "Quality Gate", "Destination: Churn Features"],
      removed: [],
      modified: [],
    },
  },
];

interface VersionHistoryProps {
  pipelineName?: string;
}

export function VersionHistory({ pipelineName = "CDR Processing Pipeline" }: VersionHistoryProps) {
  const [expanded, setExpanded] = useState<string | null>("a3f7c9d2");
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);

  function handleCompare(id: string) {
    if (compareA === null) {
      setCompareA(id);
    } else if (compareB === null && id !== compareA) {
      setCompareB(id);
    } else {
      setCompareA(id);
      setCompareB(null);
    }
  }

  const comparingVersions = compareA && compareB
    ? [MOCK_VERSIONS.find(v => v.id === compareA)!, MOCK_VERSIONS.find(v => v.id === compareB)!]
    : null;

  return (
    <div className="space-y-4">
      {/* Branch indicator */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--etihuku-gray-800)] border border-[var(--etihuku-gray-700)]">
        <GitBranch size={14} className="text-[var(--etihuku-indigo)]" />
        <span className="text-xs font-mono text-[var(--etihuku-gray-300)]">main</span>
        <span className="text-xs text-[var(--etihuku-gray-600)]">·</span>
        <span className="text-xs text-[var(--etihuku-gray-500)]">{MOCK_VERSIONS.length} versions</span>
        <span className="text-xs text-[var(--etihuku-gray-500)]">· {pipelineName}</span>
        {compareA && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-[var(--etihuku-gold)]">
              {compareB ? "Comparing 2 versions" : "Select second version"}
            </span>
            <button onClick={() => { setCompareA(null); setCompareB(null); }} className="text-xs text-[var(--etihuku-gray-500)] hover:text-white">
              ✕ Clear
            </button>
          </div>
        )}
      </div>

      {/* Compare view */}
      {comparingVersions && (
        <div className="card border-[var(--etihuku-indigo)]/30 bg-[var(--etihuku-indigo)]/5">
          <div className="text-xs font-medium text-[var(--etihuku-indigo)] uppercase tracking-wide mb-3">
            Diff: {comparingVersions[1].shortId} → {comparingVersions[0].shortId}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {comparingVersions.map((v, vi) => (
              <div key={v.id}>
                <div className="text-[10px] font-mono text-[var(--etihuku-gray-500)] mb-2">{v.shortId} — {v.message.slice(0, 40)}…</div>
                <div className="space-y-1">
                  {v.diff.added.map((a, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-green-400">
                      <Plus size={10} className="shrink-0 mt-0.5" /> {a}
                    </div>
                  ))}
                  {v.diff.removed.map((r, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-red-400">
                      <Minus size={10} className="shrink-0 mt-0.5" /> {r}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Version list */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-4 bottom-4 w-px bg-[var(--etihuku-gray-800)]" />

        <div className="space-y-3">
          {MOCK_VERSIONS.map((version, idx) => {
            const isExpanded = expanded === version.id;
            const isCompareA = compareA === version.id;
            const isCompareB = compareB === version.id;
            const isLatest = idx === 0;

            return (
              <div key={version.id} className="flex gap-4">
                {/* Commit dot */}
                <div className="flex flex-col items-center shrink-0 z-10">
                  <div className={cn(
                    "w-[14px] h-[14px] rounded-full border-2 mt-1",
                    isLatest ? "bg-[var(--etihuku-indigo)] border-[var(--etihuku-indigo)]" :
                    isCompareA || isCompareB ? "bg-[var(--etihuku-gold)] border-[var(--etihuku-gold)]" :
                    "bg-[var(--etihuku-gray-900)] border-[var(--etihuku-gray-600)]"
                  )} />
                </div>

                {/* Commit card */}
                <div className={cn(
                  "flex-1 card mb-1 transition-all",
                  isCompareA && "border-[var(--etihuku-gold)]/50",
                  isCompareB && "border-[var(--etihuku-gold)]/50",
                )}>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-[10px] text-[var(--etihuku-gray-500)] bg-[var(--etihuku-gray-800)] px-1.5 py-0.5 rounded">
                          {version.shortId}
                        </span>
                        {version.tags.map(t => (
                          <span key={t} className={cn(
                            "text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded flex items-center gap-0.5",
                            t === "latest" ? "bg-[var(--etihuku-indigo)]/20 text-[var(--etihuku-indigo)]" :
                                            "border border-[var(--etihuku-gray-700)] text-[var(--etihuku-gray-500)]"
                          )}>
                            {t !== "latest" && <Tag size={7} />} {t}
                          </span>
                        ))}
                      </div>
                      <div className="text-sm text-white font-medium mb-1 leading-snug">{version.message}</div>
                      <div className="flex items-center gap-3 text-xs text-[var(--etihuku-gray-500)]">
                        <span className="flex items-center gap-1"><User size={10} /> {version.author}</span>
                        <span className="flex items-center gap-1"><Clock size={10} /> {version.timestamp}</span>
                      </div>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleCompare(version.id)}
                        className={cn(
                          "p-1.5 rounded text-xs transition-all",
                          isCompareA || isCompareB
                            ? "bg-[var(--etihuku-gold)]/20 text-[var(--etihuku-gold)]"
                            : "hover:bg-[var(--etihuku-gray-800)] text-[var(--etihuku-gray-500)] hover:text-white"
                        )}
                        title="Compare"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        className="p-1.5 rounded hover:bg-[var(--etihuku-gray-800)] text-[var(--etihuku-gray-500)] hover:text-amber-400 transition-all"
                        title="Restore this version"
                      >
                        <RotateCcw size={13} />
                      </button>
                      <button
                        onClick={() => setExpanded(isExpanded ? null : version.id)}
                        className="p-1.5 rounded hover:bg-[var(--etihuku-gray-800)] text-[var(--etihuku-gray-500)] hover:text-white transition-all"
                      >
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* Diff preview */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-[var(--etihuku-gray-800)] space-y-2">
                      {version.diff.added.map((item, i) => (
                        <div key={`add-${i}`} className="flex items-start gap-2 text-xs text-green-400">
                          <Plus size={12} className="shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                      {version.diff.removed.map((item, i) => (
                        <div key={`rem-${i}`} className="flex items-start gap-2 text-xs text-red-400">
                          <Minus size={12} className="shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                      {version.diff.modified.map((item, i) => (
                        <div key={`mod-${i}`} className="flex items-start gap-2 text-xs text-[var(--etihuku-gold)]">
                          <span className="shrink-0">±</span>
                          <span>{item}</span>
                        </div>
                      ))}
                      {version.diff.added.length === 0 && version.diff.removed.length === 0 && version.diff.modified.length === 0 && (
                        <div className="text-xs text-[var(--etihuku-gray-600)]">No structural changes in this commit</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
