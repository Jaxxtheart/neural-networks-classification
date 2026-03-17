"use client";

import { useState } from "react";
import { X, ChevronRight, Settings, Database, Filter, ShieldCheck, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { DAGNode, NodeType } from "./DAGEditor";

// Re-export for external use
export { type DAGNode };

const NODE_SUBTYPES_MAP: Record<NodeType, string[]> = {
  source:       ["PostgreSQL", "Kafka", "AWS S3", "REST API", "OPC-UA", "SFTP", "MongoDB", "MySQL"],
  transform:    ["Filter", "Join", "Aggregate", "Window", "Custom SQL", "Python", "Normalize", "Pivot", "Encode", "Resample"],
  quality_gate: ["Threshold Check", "Schema Validation", "Freshness Gate", "Custom Rule", "Null Check"],
  destination:  ["Data Warehouse", "Model Training Set", "API Export", "S3 Export", "Feature Store"],
};

const TIME_SERIES_OPTS = ["Rolling Mean", "Lag Features", "Resampling", "Interpolation", "Seasonal Decomposition"];
const GEO_OPTS = ["Coordinate Conversion", "Spatial Join", "Proximity Calc", "Geofencing"];
const IMAGE_OPTS = ["Frame Extraction", "Resize", "Augmentation", "Tile Slicing"];
const TABULAR_OPTS = ["Join", "Pivot", "Encoding", "Binning", "Normalization"];

interface NodeConfigPanelProps {
  node: DAGNode | null;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<DAGNode>) => void;
}

export function NodeConfigPanel({ node, onClose, onUpdate }: NodeConfigPanelProps) {
  const [activeTab, setActiveTab] = useState<"config" | "transform" | "advanced">("config");

  if (!node) {
    return (
      <div className="card flex flex-col items-center justify-center h-full text-center py-16">
        <Settings size={32} className="text-[var(--etihuku-gray-700)] mb-3" />
        <p className="text-sm text-[var(--etihuku-gray-500)]">Select a node to configure</p>
        <p className="text-xs text-[var(--etihuku-gray-600)] mt-1">Click any node on the canvas</p>
      </div>
    );
  }

  function update(patch: Partial<DAGNode>) {
    onUpdate(node!.id, patch);
  }

  function updateConfig(key: string, value: unknown) {
    onUpdate(node!.id, { config: { ...node!.config, [key]: value } });
  }

  const cfg = node.config as Record<string, string | number | boolean | string[]>;

  return (
    <div className="card p-0 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--etihuku-gray-800)]">
        <div>
          <div className="text-sm font-semibold text-white">{node.label}</div>
          <div className="text-xs text-[var(--etihuku-gray-500)] capitalize">{node.type.replace("_", " ")}</div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded hover:bg-[var(--etihuku-gray-800)] text-[var(--etihuku-gray-500)] hover:text-white">
          <X size={14} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--etihuku-gray-800)]">
        {(["config", "transform", "advanced"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2 text-xs font-medium capitalize transition-all",
              activeTab === tab
                ? "text-[var(--etihuku-indigo)] border-b-2 border-[var(--etihuku-indigo)]"
                : "text-[var(--etihuku-gray-500)] hover:text-white"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "config" && (
          <ConfigTab node={node} cfg={cfg} update={update} updateConfig={updateConfig} />
        )}
        {activeTab === "transform" && (
          <TransformTab node={node} cfg={cfg} updateConfig={updateConfig} />
        )}
        {activeTab === "advanced" && (
          <AdvancedTab node={node} cfg={cfg} updateConfig={updateConfig} />
        )}
      </div>
    </div>
  );
}

function ConfigTab({ node, cfg, update, updateConfig }: {
  node: DAGNode;
  cfg: Record<string, string | number | boolean | string[]>;
  update: (p: Partial<DAGNode>) => void;
  updateConfig: (k: string, v: unknown) => void;
}) {
  const subtypes = NODE_SUBTYPES_MAP[node.type];

  return (
    <>
      <PanelField label="Node Label">
        <input
          value={node.label}
          onChange={e => update({ label: e.target.value })}
          className="form-input text-sm"
        />
      </PanelField>

      <PanelField label="Type">
        <select
          value={node.subtype}
          onChange={e => update({ subtype: e.target.value })}
          className="form-input text-sm"
        >
          {subtypes.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </PanelField>

      {node.type === "source" && (
        <>
          <PanelField label="Query / Topic / Path">
            <textarea
              rows={3}
              value={(cfg.query as string) ?? ""}
              onChange={e => updateConfig("query", e.target.value)}
              placeholder={
                node.subtype === "Kafka" ? "topic-name" :
                node.subtype === "AWS S3" ? "s3://bucket/prefix/" :
                "SELECT * FROM table WHERE condition"
              }
              className="form-input font-mono text-xs resize-none"
            />
          </PanelField>
          <PanelField label="Batch Size">
            <input type="number" value={(cfg.batchSize as number) ?? 10000}
              onChange={e => updateConfig("batchSize", parseInt(e.target.value))}
              className="form-input text-sm" />
          </PanelField>
        </>
      )}

      {node.type === "transform" && node.subtype === "Filter" && (
        <PanelField label="Filter Expression">
          <input
            value={(cfg.expression as string) ?? ""}
            onChange={e => updateConfig("expression", e.target.value)}
            placeholder="column > 0 AND status = 'active'"
            className="form-input font-mono text-xs"
          />
        </PanelField>
      )}

      {node.type === "transform" && node.subtype === "Join" && (
        <>
          <PanelField label="Join Type">
            <select value={(cfg.joinType as string) ?? "inner"} onChange={e => updateConfig("joinType", e.target.value)} className="form-input text-sm">
              {["inner", "left", "right", "full outer", "cross"].map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </PanelField>
          <PanelField label="Join Keys">
            <input value={(cfg.joinKeys as string) ?? ""} onChange={e => updateConfig("joinKeys", e.target.value)} placeholder="left.id = right.id" className="form-input font-mono text-xs" />
          </PanelField>
        </>
      )}

      {node.type === "transform" && node.subtype === "Aggregate" && (
        <>
          <PanelField label="Group By">
            <input value={(cfg.groupBy as string) ?? ""} onChange={e => updateConfig("groupBy", e.target.value)} placeholder="col1, col2" className="form-input font-mono text-xs" />
          </PanelField>
          <PanelField label="Aggregations">
            <input value={(cfg.aggregations as string) ?? ""} onChange={e => updateConfig("aggregations", e.target.value)} placeholder="sum(revenue), avg(duration), count(*)" className="form-input font-mono text-xs" />
          </PanelField>
        </>
      )}

      {node.type === "transform" && node.subtype === "Window" && (
        <>
          <PanelField label="Window Size">
            <input value={(cfg.windowSize as string) ?? "7d"} onChange={e => updateConfig("windowSize", e.target.value)} placeholder="7d / 24h / 30m" className="form-input text-sm" />
          </PanelField>
          <PanelField label="Window Function">
            <select value={(cfg.windowFn as string) ?? "rolling_mean"} onChange={e => updateConfig("windowFn", e.target.value)} className="form-input text-sm">
              {TIME_SERIES_OPTS.map(o => <option key={o} value={o.toLowerCase().replace(/ /g, "_")}>{o}</option>)}
            </select>
          </PanelField>
        </>
      )}

      {node.type === "quality_gate" && (
        <>
          <PanelField label="Minimum Quality Score">
            <div className="flex items-center gap-3">
              <input type="range" min={0} max={100} value={(cfg.threshold as number) ?? 85}
                onChange={e => updateConfig("threshold", parseInt(e.target.value))}
                className="flex-1 accent-[var(--etihuku-indigo)]" />
              <span className="text-sm font-mono text-[var(--etihuku-gold)] w-10 text-right">{(cfg.threshold as number) ?? 85}</span>
            </div>
          </PanelField>
          <PanelField label="On Failure">
            <select value={(cfg.onFail as string) ?? "halt"} onChange={e => updateConfig("onFail", e.target.value)} className="form-input text-sm">
              {["halt", "alert_and_continue", "quarantine", "retry"].map(o => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
            </select>
          </PanelField>
        </>
      )}

      {node.type === "destination" && (
        <>
          <PanelField label="Target">
            <input value={(cfg.target as string) ?? ""} onChange={e => updateConfig("target", e.target.value)} placeholder="schema.table / bucket/path" className="form-input font-mono text-xs" />
          </PanelField>
          <PanelField label="Write Mode">
            <select value={(cfg.writeMode as string) ?? "append"} onChange={e => updateConfig("writeMode", e.target.value)} className="form-input text-sm">
              {["append", "overwrite", "upsert", "merge"].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </PanelField>
        </>
      )}
    </>
  );
}

function TransformTab({ node, cfg, updateConfig }: {
  node: DAGNode;
  cfg: Record<string, string | number | boolean | string[]>;
  updateConfig: (k: string, v: unknown) => void;
}) {
  if (node.type !== "transform") {
    return (
      <div className="text-center py-8 text-sm text-[var(--etihuku-gray-500)]">
        Transform options only available for Transform nodes.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-xs text-[var(--etihuku-gray-400)] uppercase tracking-wide font-medium">Transform Category</div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Time-Series", options: TIME_SERIES_OPTS },
          { label: "Geospatial",  options: GEO_OPTS         },
          { label: "Image/Video", options: IMAGE_OPTS        },
          { label: "Tabular",     options: TABULAR_OPTS      },
        ].map(cat => (
          <button
            key={cat.label}
            onClick={() => updateConfig("transformCategory", cat.label)}
            className={cn(
              "p-2.5 rounded-lg border text-left text-xs transition-all",
              cfg.transformCategory === cat.label
                ? "border-[var(--etihuku-indigo)] bg-[var(--etihuku-indigo)]/10 text-[var(--etihuku-indigo)]"
                : "border-[var(--etihuku-gray-800)] text-[var(--etihuku-gray-400)] hover:border-[var(--etihuku-gray-600)]"
            )}
          >
            <div className="font-medium mb-1">{cat.label}</div>
            <div className="text-[10px] opacity-70">{cat.options.slice(0, 2).join(", ")}…</div>
          </button>
        ))}
      </div>

      {cfg.transformCategory && (
        <PanelField label="Operation">
          <select className="form-input text-sm" value={(cfg.operation as string) ?? ""} onChange={e => updateConfig("operation", e.target.value)}>
            {(cfg.transformCategory === "Time-Series" ? TIME_SERIES_OPTS :
              cfg.transformCategory === "Geospatial"  ? GEO_OPTS :
              cfg.transformCategory === "Image/Video" ? IMAGE_OPTS : TABULAR_OPTS
            ).map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </PanelField>
      )}

      {(node.subtype === "Custom SQL" || node.subtype === "Python") && (
        <PanelField label={node.subtype === "Python" ? "Python Code" : "SQL Expression"}>
          <textarea
            rows={6}
            value={(cfg.code as string) ?? ""}
            onChange={e => updateConfig("code", e.target.value)}
            placeholder={node.subtype === "Python"
              ? "def transform(df):\n    # Your pandas/polars code\n    return df"
              : "SELECT *, (col_a / col_b) AS ratio FROM {input}"
            }
            className="form-input font-mono text-xs resize-none leading-relaxed"
          />
        </PanelField>
      )}
    </div>
  );
}

function AdvancedTab({ node, cfg, updateConfig }: {
  node: DAGNode;
  cfg: Record<string, string | number | boolean | string[]>;
  updateConfig: (k: string, v: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      <PanelField label="Parallelism">
        <div className="flex items-center gap-3">
          <input type="range" min={1} max={16} value={(cfg.parallelism as number) ?? 4}
            onChange={e => updateConfig("parallelism", parseInt(e.target.value))}
            className="flex-1 accent-[var(--etihuku-indigo)]" />
          <span className="text-sm font-mono text-white w-8 text-right">{(cfg.parallelism as number) ?? 4}</span>
        </div>
      </PanelField>

      <PanelField label="Retry On Failure">
        <div className="flex items-center gap-3">
          <input type="range" min={0} max={5} value={(cfg.retries as number) ?? 2}
            onChange={e => updateConfig("retries", parseInt(e.target.value))}
            className="flex-1 accent-[var(--etihuku-indigo)]" />
          <span className="text-sm font-mono text-white w-8 text-right">{(cfg.retries as number) ?? 2}x</span>
        </div>
      </PanelField>

      <PanelField label="Timeout (minutes)">
        <input type="number" value={(cfg.timeoutMin as number) ?? 30}
          onChange={e => updateConfig("timeoutMin", parseInt(e.target.value))}
          className="form-input text-sm" />
      </PanelField>

      <PanelField label="Memory Limit">
        <select value={(cfg.memoryLimit as string) ?? "2Gi"} onChange={e => updateConfig("memoryLimit", e.target.value)} className="form-input text-sm">
          {["512Mi", "1Gi", "2Gi", "4Gi", "8Gi", "16Gi"].map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </PanelField>

      <div className="p-3 rounded-lg bg-[var(--etihuku-gray-800)] space-y-2">
        <div className="text-xs font-medium text-[var(--etihuku-gray-300)] uppercase tracking-wide">Node ID</div>
        <div className="font-mono text-xs text-[var(--etihuku-indigo)]">{node.id}</div>
      </div>
    </div>
  );
}

function PanelField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-medium text-[var(--etihuku-gray-400)] uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}
