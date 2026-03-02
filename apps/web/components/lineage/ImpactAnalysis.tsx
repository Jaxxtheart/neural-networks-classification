"use client";

import { useState } from "react";
import { AlertTriangle, ChevronRight, ChevronDown, Database, GitBranch, Cpu, BarChart2, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { LINEAGE_NODES, LINEAGE_EDGES, LineageNode, LineageNodeType } from "./LineageGraph";

const NODE_TYPE_COLOR: Record<LineageNodeType, string> = {
  source:     "#3B82F6",
  pipeline:   "#8B5CF6",
  dataset:    "#10B981",
  model:      "#F59E0B",
  prediction: "#EC4899",
};

const NODE_TYPE_ICON: Record<LineageNodeType, React.ElementType> = {
  source:     Database,
  pipeline:   GitBranch,
  dataset:    Database,
  model:      Cpu,
  prediction: BarChart2,
};

interface ImpactNode {
  node: LineageNode;
  depth: number;
  transform?: string;
}

function getDownstream(sourceId: string): ImpactNode[] {
  const result: ImpactNode[] = [];
  const visited = new Set<string>();

  function walk(id: string, depth: number) {
    LINEAGE_EDGES
      .filter(e => e.source === id)
      .forEach(e => {
        if (visited.has(e.target)) return;
        visited.add(e.target);
        const node = LINEAGE_NODES.find(n => n.id === e.target);
        if (node) {
          result.push({ node, depth, transform: e.transform });
          walk(e.target, depth + 1);
        }
      });
  }
  walk(sourceId, 0);
  return result;
}

const IMPACT_LEVELS: Record<number, { label: string; color: string; desc: string }> = {
  0: { label: "Direct",   color: "#EF4444", desc: "Immediately affected" },
  1: { label: "Indirect", color: "#F59E0B", desc: "Affected via one step" },
  2: { label: "Tertiary", color: "#3B82F6", desc: "Affected via two steps" },
};

export function ImpactAnalysis() {
  const [query, setQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<LineageNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const sources = LINEAGE_NODES.filter(n =>
    n.type === "source" || n.type === "dataset"
  );
  const filtered = sources.filter(n =>
    n.label.toLowerCase().includes(query.toLowerCase())
  );

  const impact = selectedSource ? getDownstream(selectedSource.id) : [];
  const byDepth = [0, 1, 2].map(d => impact.filter(i => i.depth === d));

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-950/20 border border-amber-800/30">
        <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-medium text-amber-300">Impact Analysis</div>
          <div className="text-xs text-[var(--etihuku-gray-400)] mt-0.5">
            Select a source or dataset to visualize all downstream dependencies — pipelines, models, and predictions that would be affected if this data changes.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Source selector */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-[var(--etihuku-gray-400)] uppercase tracking-wide">
            Select Source / Dataset
          </div>
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--etihuku-gray-500)]" />
            <input
              className="form-input pl-8 text-xs"
              placeholder="Search nodes…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
            {filtered.map(node => {
              const Icon = NODE_TYPE_ICON[node.type];
              const isSelected = selectedSource?.id === node.id;
              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedSource(isSelected ? null : node)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-all text-xs",
                    isSelected
                      ? "bg-[var(--etihuku-indigo)]/10 border border-[var(--etihuku-indigo)] text-white"
                      : "bg-[var(--etihuku-gray-900)] border border-[var(--etihuku-gray-800)] text-[var(--etihuku-gray-300)] hover:border-[var(--etihuku-gray-600)]"
                  )}
                >
                  <Icon size={12} style={{ color: NODE_TYPE_COLOR[node.type] }} className="shrink-0" />
                  <span className="flex-1 truncate">{node.label}</span>
                  <span className="text-[9px] text-[var(--etihuku-gray-600)] capitalize">{node.type}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Impact tree */}
        <div className="md:col-span-2">
          {!selectedSource ? (
            <div className="h-full flex items-center justify-center text-[var(--etihuku-gray-600)] text-sm">
              Select a node on the left to see its impact
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: NODE_TYPE_COLOR[selectedSource.type] }} />
                <span className="text-sm font-semibold text-white">{selectedSource.label}</span>
                <span className="text-xs text-[var(--etihuku-gray-400)]">→ {impact.length} downstream nodes</span>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map(depth => {
                  const cfg = IMPACT_LEVELS[depth];
                  return (
                    <div key={depth} className="rounded-lg border p-2 text-center" style={{ borderColor: `${cfg.color}30`, backgroundColor: `${cfg.color}08` }}>
                      <div className="text-xl font-display font-bold" style={{ color: cfg.color }}>{byDepth[depth].length}</div>
                      <div className="text-[10px] font-medium" style={{ color: cfg.color }}>{cfg.label}</div>
                      <div className="text-[9px] text-[var(--etihuku-gray-500)]">{cfg.desc}</div>
                    </div>
                  );
                })}
              </div>

              {/* Dependency tree */}
              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {impact.map(({ node, depth, transform }) => {
                  const Icon = NODE_TYPE_ICON[node.type];
                  const cfg = IMPACT_LEVELS[Math.min(depth, 2)];
                  return (
                    <div
                      key={node.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-md border text-xs"
                      style={{
                        marginLeft: depth * 20,
                        borderColor: `${cfg.color}20`,
                        backgroundColor: `${cfg.color}05`,
                      }}
                    >
                      {depth > 0 && <ChevronRight size={10} className="shrink-0 text-[var(--etihuku-gray-600)]" />}
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                      <Icon size={11} style={{ color: NODE_TYPE_COLOR[node.type] }} className="shrink-0" />
                      <span className="text-white font-medium">{node.label}</span>
                      <span className="text-[var(--etihuku-gray-500)] capitalize">{node.type}</span>
                      {transform && (
                        <span className="ml-auto text-[9px] text-[var(--etihuku-gray-600)] font-mono">{transform}</span>
                      )}
                      <span className="text-[9px] shrink-0 px-1.5 py-0.5 rounded font-medium" style={{ color: cfg.color, backgroundColor: `${cfg.color}15` }}>
                        {cfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
