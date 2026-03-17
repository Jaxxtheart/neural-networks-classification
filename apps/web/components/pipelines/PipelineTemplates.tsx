"use client";

import { useState } from "react";
import {
  Radio, Lock, Mountain, Wrench, ChevronRight, Star,
  Database, Filter, ShieldCheck, ArrowUpRight, Layers
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Vertical = "telecom" | "security" | "mining" | "engineering";

export interface PipelineTemplate {
  id: string;
  name: string;
  vertical: Vertical;
  description: string;
  useCase: string;
  nodeCount: number;
  estimatedRuntime: string;
  tags: string[];
  nodes: { label: string; type: string }[];
  popular?: boolean;
}

const VERTICAL_CONFIG: Record<Vertical, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  telecom:     { icon: Radio,   color: "#8B5CF6", bg: "bg-violet-950", label: "Telecommunications" },
  security:    { icon: Lock,    color: "#F59E0B", bg: "bg-amber-950",  label: "Security"            },
  mining:      { icon: Mountain,color: "#10B981", bg: "bg-green-950",  label: "Mining"              },
  engineering: { icon: Wrench,  color: "#EC4899", bg: "bg-pink-950",   label: "Engineering"         },
};

const TEMPLATES: PipelineTemplate[] = [
  {
    id: "t1", vertical: "telecom", name: "CDR Processing Pipeline",
    description: "End-to-end Call Detail Record ingestion, enrichment, and feature extraction for churn modeling.",
    useCase: "Churn Prediction",
    nodeCount: 7, estimatedRuntime: "~4 min", popular: true,
    tags: ["CDR", "Feature Engineering", "Churn"],
    nodes: [
      { label: "CDR Source", type: "source" }, { label: "Enrich w/ Customer", type: "transform" },
      { label: "Window Features", type: "transform" }, { label: "Quality Gate", type: "quality_gate" },
      { label: "Churn Feature Set", type: "destination" },
    ],
  },
  {
    id: "t2", vertical: "telecom", name: "Network KPI Aggregation",
    description: "Aggregate raw network probe data into hourly/daily KPIs per cell tower and region.",
    useCase: "Network Ops",
    nodeCount: 5, estimatedRuntime: "~8 min",
    tags: ["KPI", "Cell Tower", "Aggregation"],
    nodes: [
      { label: "Kafka Stream", type: "source" }, { label: "Time-Window Agg", type: "transform" },
      { label: "Quality Check", type: "quality_gate" }, { label: "DWH", type: "destination" },
    ],
  },
  {
    id: "t3", vertical: "security", name: "Video Frame Extraction",
    description: "RTSP stream ingestion with frame extraction, preprocessing, and annotation-ready export.",
    useCase: "Surveillance AI",
    nodeCount: 6, estimatedRuntime: "~12 min", popular: true,
    tags: ["RTSP", "Computer Vision", "Frames"],
    nodes: [
      { label: "RTSP Source", type: "source" }, { label: "Frame Extract", type: "transform" },
      { label: "Resize & Augment", type: "transform" }, { label: "Quality Gate", type: "quality_gate" },
      { label: "Annotation Export", type: "destination" },
    ],
  },
  {
    id: "t4", vertical: "security", name: "Access Log Fusion",
    description: "Fuse physical access logs, CCTV events, and IT logs into a unified security timeline.",
    useCase: "Threat Detection",
    nodeCount: 8, estimatedRuntime: "~6 min",
    tags: ["Access Logs", "Fusion", "Timeline"],
    nodes: [
      { label: "Access DB", type: "source" }, { label: "CCTV Events", type: "source" },
      { label: "Log Join", type: "transform" }, { label: "Timeline Build", type: "transform" },
      { label: "Quality Gate", type: "quality_gate" }, { label: "Threat DB", type: "destination" },
    ],
  },
  {
    id: "t5", vertical: "mining", name: "Sensor Data Normalization",
    description: "OPC-UA sensor ingestion with noise filtering, normalization, and anomaly detection.",
    useCase: "Predictive Maintenance",
    nodeCount: 6, estimatedRuntime: "~3 min", popular: true,
    tags: ["OPC-UA", "IoT", "Normalization"],
    nodes: [
      { label: "OPC-UA Source", type: "source" }, { label: "Noise Filter", type: "transform" },
      { label: "Normalize", type: "transform" }, { label: "Anomaly Gate", type: "quality_gate" },
      { label: "Sensor Feature Store", type: "destination" },
    ],
  },
  {
    id: "t6", vertical: "mining", name: "Geological Data Processing",
    description: "Process drill-core data, geochemical assays, and geospatial surveys into unified geological datasets.",
    useCase: "Resource Estimation",
    nodeCount: 9, estimatedRuntime: "~15 min",
    tags: ["Geology", "Geospatial", "Assay"],
    nodes: [
      { label: "Assay SFTP", type: "source" }, { label: "Geo Join", type: "transform" },
      { label: "Coord Convert", type: "transform" }, { label: "Quality Gate", type: "quality_gate" },
      { label: "Geological DWH", type: "destination" },
    ],
  },
  {
    id: "t7", vertical: "engineering", name: "Inspection Image Pipeline",
    description: "Drone imagery and manual inspection photo ingestion with tile slicing and defect annotation.",
    useCase: "Structural Inspection",
    nodeCount: 7, estimatedRuntime: "~20 min",
    tags: ["Drone", "Inspection", "Image"],
    nodes: [
      { label: "S3 Drone Images", type: "source" }, { label: "Tile Slicer", type: "transform" },
      { label: "Augment", type: "transform" }, { label: "Quality Gate", type: "quality_gate" },
      { label: "Training Set", type: "destination" },
    ],
  },
  {
    id: "t8", vertical: "engineering", name: "BIM Data Extraction",
    description: "Extract structured data from BIM/IFC files for digital twin construction and asset management.",
    useCase: "Digital Twin",
    nodeCount: 5, estimatedRuntime: "~7 min",
    tags: ["BIM", "IFC", "Digital Twin"],
    nodes: [
      { label: "BIM Source", type: "source" }, { label: "IFC Parse", type: "transform" },
      { label: "Schema Validate", type: "quality_gate" }, { label: "Asset DB", type: "destination" },
    ],
  },
];

const NODE_TYPE_COLORS: Record<string, string> = {
  source:       "#3B82F6",
  transform:    "#8B5CF6",
  quality_gate: "#10B981",
  destination:  "#F59E0B",
};

interface PipelineTemplatesProps {
  onApply: (template: PipelineTemplate) => void;
}

export function PipelineTemplates({ onApply }: PipelineTemplatesProps) {
  const [activeVertical, setActiveVertical] = useState<Vertical | "all">("all");
  const [preview, setPreview] = useState<PipelineTemplate | null>(null);

  const filtered = TEMPLATES.filter(t => activeVertical === "all" || t.vertical === activeVertical);

  return (
    <div className="space-y-4">
      {/* Vertical filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveVertical("all")}
          className={cn(
            "px-3 py-1.5 rounded-md text-xs font-medium border transition-all",
            activeVertical === "all"
              ? "border-[var(--etihuku-indigo)] bg-[var(--etihuku-indigo)]/10 text-[var(--etihuku-indigo)]"
              : "border-[var(--etihuku-gray-700)] text-[var(--etihuku-gray-400)] hover:border-[var(--etihuku-gray-500)]"
          )}
        >
          All Verticals
        </button>
        {(Object.entries(VERTICAL_CONFIG) as [Vertical, typeof VERTICAL_CONFIG[Vertical]][]).map(([v, cfg]) => {
          const Icon = cfg.icon;
          return (
            <button
              key={v}
              onClick={() => setActiveVertical(v)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all",
                activeVertical === v
                  ? "border-transparent text-white"
                  : "border-[var(--etihuku-gray-700)] text-[var(--etihuku-gray-400)] hover:border-[var(--etihuku-gray-500)]"
              )}
              style={activeVertical === v ? { borderColor: cfg.color, backgroundColor: `${cfg.color}20`, color: cfg.color } : {}}
            >
              <Icon size={12} /> {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map(template => {
          const vCfg = VERTICAL_CONFIG[template.vertical];
          const VIcon = vCfg.icon;
          const isPreview = preview?.id === template.id;

          return (
            <div key={template.id} className={cn(
              "card overflow-hidden transition-all cursor-pointer",
              isPreview ? "border-[var(--etihuku-indigo)] shadow-glow" : "hover:border-[var(--etihuku-gray-600)]"
            )} onClick={() => setPreview(isPreview ? null : template)}>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", vCfg.bg)}>
                    <VIcon size={16} style={{ color: vCfg.color }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">{template.name}</span>
                      {template.popular && <Star size={11} className="text-[var(--etihuku-gold)] fill-[var(--etihuku-gold)]" />}
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: vCfg.color }}>{template.useCase}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-[var(--etihuku-gray-400)]">{template.nodeCount} nodes</div>
                  <div className="text-[10px] text-[var(--etihuku-gray-600)]">{template.estimatedRuntime}</div>
                </div>
              </div>

              <p className="text-xs text-[var(--etihuku-gray-500)] leading-relaxed mb-3">{template.description}</p>

              {/* Node preview */}
              <div className="flex items-center gap-1 mb-3 flex-wrap">
                {template.nodes.map((node, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div
                      className="px-2 py-0.5 rounded text-[9px] font-medium"
                      style={{
                        color: NODE_TYPE_COLORS[node.type],
                        backgroundColor: `${NODE_TYPE_COLORS[node.type]}15`,
                      }}
                    >
                      {node.label}
                    </div>
                    {i < template.nodes.length - 1 && (
                      <ChevronRight size={10} className="text-[var(--etihuku-gray-700)]" />
                    )}
                  </div>
                ))}
              </div>

              {/* Tags */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1 flex-wrap">
                  {template.tags.map(t => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--etihuku-gray-800)] text-[var(--etihuku-gray-500)] uppercase tracking-wide">
                      {t}
                    </span>
                  ))}
                </div>
                {isPreview && (
                  <button
                    onClick={e => { e.stopPropagation(); onApply(template); }}
                    className="btn btn-primary btn-sm text-xs px-3 py-1"
                  >
                    Use Template
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
