"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Filter, ZoomIn, ZoomOut, Maximize2, X, Database, GitBranch, Cpu, BarChart2, Eye } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Vertical } from "@/lib/types/governance";

export type { Vertical };

// ─── Types ────────────────────────────────────────────────────────────────────
export type LineageNodeType = "source" | "pipeline" | "dataset" | "model" | "prediction";

export interface LineageNode {
  id: string;
  label: string;
  type: LineageNodeType;
  vertical: Vertical;
  volume?: string;
  updatedAt?: string;
  description?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface LineageEdge {
  source: string;
  target: string;
  transform?: string;
  latency?: string;
}

// ─── Mock data ─────────────────────────────────────────────────────────────────
const INITIAL_NODES: LineageNode[] = [
  { id: "s1",  label: "CDR Raw DB",          type: "source",     vertical: "telecom",     volume: "4.2M rows/day",  updatedAt: "5m ago",  description: "Ericsson BSS call detail records", x: 80,  y: 120, vx: 0, vy: 0 },
  { id: "s2",  label: "Network Probes",       type: "source",     vertical: "telecom",     volume: "1.8M events/h",  updatedAt: "1m ago",  description: "Cell tower KPI measurements",      x: 80,  y: 260, vx: 0, vy: 0 },
  { id: "s3",  label: "CCTV Stream",          type: "source",     vertical: "security",    volume: "24 fps × 48 cam",updatedAt: "live",    description: "RTSP feeds from site cameras",     x: 80,  y: 400, vx: 0, vy: 0 },
  { id: "s4",  label: "OPC-UA Sensors",       type: "source",     vertical: "mining",      volume: "8k tags @ 1Hz",  updatedAt: "2m ago",  description: "Underground sensor array",         x: 80,  y: 540, vx: 0, vy: 0 },
  { id: "s5",  label: "Drone Images S3",      type: "source",     vertical: "engineering", volume: "~200 images/day",updatedAt: "6h ago",  description: "Inspection drone imagery",         x: 80,  y: 660, vx: 0, vy: 0 },
  { id: "p1",  label: "CDR Processing",       type: "pipeline",   vertical: "telecom",     volume: "3.9M rows",      updatedAt: "4m ago",  description: "Enrichment + feature extraction",  x: 320, y: 120, vx: 0, vy: 0 },
  { id: "p2",  label: "KPI Aggregation",      type: "pipeline",   vertical: "telecom",     volume: "12k records/h",  updatedAt: "3m ago",  description: "Hourly KPI rollup per cell tower", x: 320, y: 260, vx: 0, vy: 0 },
  { id: "p3",  label: "Frame Extraction",     type: "pipeline",   vertical: "security",    volume: "86k frames/day", updatedAt: "1h ago",  description: "RTSP → annotated frame pipeline",  x: 320, y: 400, vx: 0, vy: 0 },
  { id: "p4",  label: "Sensor Normalise",     type: "pipeline",   vertical: "mining",      volume: "690M pts/day",   updatedAt: "2m ago",  description: "Noise filter + normalisation",     x: 320, y: 540, vx: 0, vy: 0 },
  { id: "p5",  label: "Tile Slicer",          type: "pipeline",   vertical: "engineering", volume: "2,400 tiles/day",updatedAt: "5h ago",  description: "Drone image tiling + augmentation",x: 320, y: 660, vx: 0, vy: 0 },
  { id: "d1",  label: "Churn Feature Set",    type: "dataset",    vertical: "telecom",     volume: "3.9M features",  updatedAt: "4m ago",  description: "Ready-for-training churn features",x: 560, y: 160, vx: 0, vy: 0 },
  { id: "d2",  label: "Network KPI Store",    type: "dataset",    vertical: "telecom",     volume: "840k records",   updatedAt: "3m ago",  description: "Aggregated network performance",   x: 560, y: 300, vx: 0, vy: 0 },
  { id: "d3",  label: "CCTV Training Set",    type: "dataset",    vertical: "security",    volume: "86k images",     updatedAt: "1h ago",  description: "Annotated surveillance frames",    x: 560, y: 420, vx: 0, vy: 0 },
  { id: "d4",  label: "Sensor Feature Store", type: "dataset",    vertical: "mining",      volume: "600M pts",       updatedAt: "2m ago",  description: "Normalised sensor features",       x: 560, y: 560, vx: 0, vy: 0 },
  { id: "d5",  label: "Inspection Training",  type: "dataset",    vertical: "engineering", volume: "2,400 tiles",    updatedAt: "5h ago",  description: "Defect-labelled tile dataset",     x: 560, y: 680, vx: 0, vy: 0 },
  { id: "m1",  label: "Churn XGBoost v2.4",  type: "model",      vertical: "telecom",     volume: "F1=0.91",        updatedAt: "1d ago",  description: "Telecom churn prediction model",   x: 780, y: 160, vx: 0, vy: 0 },
  { id: "m2",  label: "Network Anomaly v1",   type: "model",      vertical: "telecom",     volume: "AUC=0.94",       updatedAt: "3h ago",  description: "KPI anomaly detection model",      x: 780, y: 300, vx: 0, vy: 0 },
  { id: "m3",  label: "Intrusion Detect v3",  type: "model",      vertical: "security",    volume: "F1=0.88",        updatedAt: "2d ago",  description: "CCTV intrusion detection model",   x: 780, y: 420, vx: 0, vy: 0 },
  { id: "m4",  label: "PredMaint LightGBM",   type: "model",      vertical: "mining",      volume: "Acc=0.93",       updatedAt: "6h ago",  description: "Equipment failure prediction",     x: 780, y: 560, vx: 0, vy: 0 },
  { id: "m5",  label: "Defect Detect CNN",    type: "model",      vertical: "engineering", volume: "mAP=0.87",       updatedAt: "1d ago",  description: "Structural defect detection",      x: 780, y: 680, vx: 0, vy: 0 },
  { id: "pr1", label: "Churn Scores API",     type: "prediction", vertical: "telecom",     volume: "39k scores/day", updatedAt: "5m ago",  description: "Customer churn risk scores",       x: 980, y: 160, vx: 0, vy: 0 },
  { id: "pr2", label: "Anomaly Alerts",       type: "prediction", vertical: "telecom",     volume: "~120 alerts/h",  updatedAt: "1m ago",  description: "Real-time network anomaly alerts", x: 980, y: 300, vx: 0, vy: 0 },
  { id: "pr3", label: "Threat Events",        type: "prediction", vertical: "security",    volume: "8 events/h",     updatedAt: "10m ago", description: "Security threat detections",       x: 980, y: 420, vx: 0, vy: 0 },
  { id: "pr4", label: "Maintenance Queue",    type: "prediction", vertical: "mining",      volume: "14 tasks/day",   updatedAt: "8m ago",  description: "Predictive work orders",           x: 980, y: 560, vx: 0, vy: 0 },
  { id: "pr5", label: "Defect Report",        type: "prediction", vertical: "engineering", volume: "12 defects/day", updatedAt: "2h ago",  description: "Structural inspection findings",   x: 980, y: 680, vx: 0, vy: 0 },
];

const EDGES: LineageEdge[] = [
  { source: "s1", target: "p1", transform: "Enrich + Window", latency: "~4 min" },
  { source: "s2", target: "p2", transform: "Time-Window Agg", latency: "~8 min" },
  { source: "s3", target: "p3", transform: "Frame Extract",   latency: "~12 min" },
  { source: "s4", target: "p4", transform: "Noise Filter",    latency: "~3 min" },
  { source: "s5", target: "p5", transform: "Tile Slicer",     latency: "~20 min" },
  { source: "p1", target: "d1", transform: "Quality Gate",    latency: "<1 min" },
  { source: "p2", target: "d2", transform: "Schema Check",    latency: "<1 min" },
  { source: "p3", target: "d3", transform: "Quality Gate",    latency: "<1 min" },
  { source: "p4", target: "d4", transform: "Anomaly Gate",    latency: "<1 min" },
  { source: "p5", target: "d5", transform: "Quality Gate",    latency: "<1 min" },
  { source: "d1", target: "m1", transform: "Train XGBoost",   latency: "~45 min" },
  { source: "d2", target: "m2", transform: "Train LightGBM",  latency: "~30 min" },
  { source: "d3", target: "m3", transform: "Fine-tune CNN",   latency: "~3 h" },
  { source: "d4", target: "m4", transform: "Train LightGBM",  latency: "~20 min" },
  { source: "d5", target: "m5", transform: "Train CNN",       latency: "~2 h" },
  { source: "m1", target: "pr1", transform: "Batch Inference", latency: "~5 min" },
  { source: "m2", target: "pr2", transform: "RT Inference",    latency: "<1 s" },
  { source: "m3", target: "pr3", transform: "RT Inference",    latency: "<1 s" },
  { source: "m4", target: "pr4", transform: "Batch Inference", latency: "~10 min" },
  { source: "m5", target: "pr5", transform: "Batch Inference", latency: "~15 min" },
  // Cross-vertical edge for interest
  { source: "d2", target: "m1", transform: "Network Features", latency: "<1 min" },
];

// ─── Style maps ────────────────────────────────────────────────────────────────
const NODE_TYPE_CONFIG: Record<LineageNodeType, { color: string; icon: React.ElementType; label: string }> = {
  source:     { color: "#3B82F6", icon: Database,   label: "Source" },
  pipeline:   { color: "#8B5CF6", icon: GitBranch,  label: "Pipeline" },
  dataset:    { color: "#10B981", icon: Database,   label: "Dataset" },
  model:      { color: "#F59E0B", icon: Cpu,        label: "Model" },
  prediction: { color: "#EC4899", icon: BarChart2,  label: "Prediction" },
};

const VERTICAL_COLORS: Record<Vertical, string> = {
  telecom:     "#8B5CF6",
  security:    "#F59E0B",
  mining:      "#10B981",
  engineering: "#EC4899",
};

// ─── Component ─────────────────────────────────────────────────────────────────
interface LineageGraphProps {
  highlightNode?: string | null;
  filterVertical?: Vertical | "all";
}

export function LineageGraph({ highlightNode, filterVertical = "all" }: LineageGraphProps) {
  const [nodes, setNodes] = useState<LineageNode[]>(() =>
    INITIAL_NODES.map(n => ({ ...n }))
  );
  const [selectedNode, setSelectedNode] = useState<LineageNode | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<LineageEdge | null>(null);
  const [zoom, setZoom] = useState(0.75);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [vertFilter, setVertFilter] = useState<Vertical | "all">(filterVertical);
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Drag a node
  const onNodeMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === id)!;
    setDragging({ id, ox: e.clientX / zoom - node.x, oy: e.clientY / zoom - node.y });
    setSelectedNode(node);
  }, [nodes, zoom]);

  const onSvgMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (dragging) {
      setNodes(prev => prev.map(n =>
        n.id === dragging.id
          ? { ...n, x: e.clientX / zoom - dragging.ox, y: e.clientY / zoom - dragging.oy }
          : n
      ));
    }
    if (isPanning) {
      setPan({
        x: panStart.current.px + e.clientX - panStart.current.x,
        y: panStart.current.py + e.clientY - panStart.current.y,
      });
    }
  }, [dragging, isPanning, zoom]);

  const onSvgMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.target === svgRef.current) {
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    }
  }, [pan]);

  const onMouseUp = useCallback(() => {
    setDragging(null);
    setIsPanning(false);
  }, []);

  // Memoised: recompute highlighted edges only when selected node changes
  const highlightedEdges = useMemo<Set<string> | null>(() => {
    if (!selectedNode) return null;
    const highlighted = new Set<string>();
    const visit = (id: string, direction: "up" | "down") => {
      EDGES.forEach(e => {
        const key = `${e.source}-${e.target}`;
        if (direction === "down" && e.source === id && !highlighted.has(key)) {
          highlighted.add(key);
          visit(e.target, "down");
        }
        if (direction === "up" && e.target === id && !highlighted.has(key)) {
          highlighted.add(key);
          visit(e.source, "up");
        }
      });
    };
    visit(selectedNode.id, "down");
    visit(selectedNode.id, "up");
    return highlighted;
  }, [selectedNode?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleNodes = useMemo(
    () => nodes.filter(n => vertFilter === "all" || n.vertical === vertFilter),
    [nodes, vertFilter]
  );

  const visibleEdges = useMemo(() => {
    const visibleIds = new Set(visibleNodes.map(n => n.id));
    return EDGES.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target));
  }, [visibleNodes]);

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1">
          {(["all", "telecom", "security", "mining", "engineering"] as const).map(v => (
            <button
              key={v}
              onClick={() => setVertFilter(v)}
              className={cn(
                "px-2.5 py-1 rounded text-[10px] font-medium border transition-all capitalize",
                vertFilter === v
                  ? "border-[var(--etihuku-indigo)] bg-[var(--etihuku-indigo)]/10 text-[var(--etihuku-indigo)]"
                  : "border-[var(--etihuku-gray-700)] text-[var(--etihuku-gray-400)] hover:border-[var(--etihuku-gray-500)]"
              )}
              style={v !== "all" && vertFilter === v ? { borderColor: VERTICAL_COLORS[v], backgroundColor: `${VERTICAL_COLORS[v]}15`, color: VERTICAL_COLORS[v] } : {}}
            >
              {v === "all" ? "All" : v}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-1.5">
          <button onClick={() => setZoom(z => Math.min(z + 0.1, 1.5))} className="w-7 h-7 rounded bg-[var(--etihuku-gray-800)] border border-[var(--etihuku-gray-700)] flex items-center justify-center text-[var(--etihuku-gray-400)] hover:text-white">
            <ZoomIn size={12} />
          </button>
          <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.3))} className="w-7 h-7 rounded bg-[var(--etihuku-gray-800)] border border-[var(--etihuku-gray-700)] flex items-center justify-center text-[var(--etihuku-gray-400)] hover:text-white">
            <ZoomOut size={12} />
          </button>
          <button onClick={() => { setZoom(0.75); setPan({ x: 0, y: 0 }); }} className="w-7 h-7 rounded bg-[var(--etihuku-gray-800)] border border-[var(--etihuku-gray-700)] flex items-center justify-center text-[var(--etihuku-gray-400)] hover:text-white">
            <Maximize2 size={12} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap">
        {(Object.entries(NODE_TYPE_CONFIG) as [LineageNodeType, typeof NODE_TYPE_CONFIG[LineageNodeType]][]).map(([type, cfg]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
            <span className="text-[10px] text-[var(--etihuku-gray-400)]">{cfg.label}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        {/* SVG Graph */}
        <div className="flex-1 overflow-hidden rounded-lg border border-[var(--etihuku-gray-800)] bg-[#0A0A12] relative" style={{ height: 500 }}>
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            onMouseMove={onSvgMouseMove}
            onMouseDown={onSvgMouseDown}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            style={{ cursor: isPanning ? "grabbing" : "grab" }}
          >
            {/* Dot grid background */}
            <defs>
              <pattern id="lgDotGrid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.8" fill="#1e1e2e" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#lgDotGrid)" />

            <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
              {/* Edges */}
              {visibleEdges.map(edge => {
                const src = nodes.find(n => n.id === edge.source)!;
                const tgt = nodes.find(n => n.id === edge.target)!;
                if (!src || !tgt) return null;
                const edgeKey = `${edge.source}-${edge.target}`;
                const isHighlighted = highlightedEdges?.has(edgeKey);
                const isHovered = hoveredEdge === edge;
                const midX = (src.x + tgt.x) / 2;
                const midY = (src.y + tgt.y) / 2;
                return (
                  <g key={edgeKey}>
                    <path
                      d={`M ${src.x} ${src.y} C ${src.x + 80} ${src.y} ${tgt.x - 80} ${tgt.y} ${tgt.x} ${tgt.y}`}
                      stroke={isHighlighted ? NODE_TYPE_CONFIG[tgt.type].color : "#2a2a3e"}
                      strokeWidth={isHighlighted ? 2 : 1}
                      fill="none"
                      strokeDasharray={isHighlighted ? "none" : "4,4"}
                      opacity={highlightedEdges && !isHighlighted ? 0.2 : 1}
                    />
                    {/* Invisible wider hit area */}
                    <path
                      d={`M ${src.x} ${src.y} C ${src.x + 80} ${src.y} ${tgt.x - 80} ${tgt.y} ${tgt.x} ${tgt.y}`}
                      stroke="transparent"
                      strokeWidth={12}
                      fill="none"
                      onMouseEnter={() => setHoveredEdge(edge)}
                      onMouseLeave={() => setHoveredEdge(null)}
                      style={{ cursor: "pointer" }}
                    />
                    {isHovered && (
                      <g>
                        <rect x={midX - 52} y={midY - 14} width={104} height={26} rx={4} fill="#1a1a2e" stroke="#3a3a5e" strokeWidth={1} />
                        <text x={midX} y={midY - 3} textAnchor="middle" fill="#a0a0c0" fontSize={8} fontFamily="monospace">{edge.transform}</text>
                        <text x={midX} y={midY + 7} textAnchor="middle" fill="#606080" fontSize={7}>{edge.latency}</text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Nodes */}
              {visibleNodes.map(node => {
                const cfg = NODE_TYPE_CONFIG[node.type];
                const isSelected = selectedNode?.id === node.id;
                const isHighlighted = !highlightedEdges || highlightedEdges.size === 0 ||
                  EDGES.some(e => highlightedEdges.has(`${e.source}-${e.target}`) && (e.source === node.id || e.target === node.id)) ||
                  node.id === selectedNode?.id;
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x},${node.y})`}
                    onMouseDown={e => onNodeMouseDown(e, node.id)}
                    style={{ cursor: "pointer" }}
                    opacity={highlightedEdges && !isHighlighted ? 0.2 : 1}
                  >
                    <rect
                      x={-58} y={-18} width={116} height={36}
                      rx={6}
                      fill={isSelected ? `${cfg.color}25` : "#12121e"}
                      stroke={isSelected ? cfg.color : "#2a2a3e"}
                      strokeWidth={isSelected ? 2 : 1}
                    />
                    <circle cx={-44} cy={0} r={5} fill={cfg.color} />
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                    <text x={-34} y={-4} fill="#e0e0f0" fontSize={9} fontWeight="600" fontFamily="system-ui">{node.label}</text>
                    <text x={-34} y={7} fill="#606080" fontSize={7} fontFamily="monospace">{node.volume}</text>
                    {/* Vertical dot */}
                    <circle cx={50} cy={-10} r={3} fill={VERTICAL_COLORS[node.vertical]} />
                  </g>
                );
              })}
            </g>
          </svg>
          <div className="absolute bottom-2 right-2 text-[10px] text-[var(--etihuku-gray-600)]">
            Zoom: {Math.round(zoom * 100)}% · Drag nodes or canvas to navigate
          </div>
        </div>

        {/* Node detail panel */}
        {selectedNode && (
          <div className="w-64 shrink-0 space-y-3">
            <div className="rounded-lg border border-[var(--etihuku-gray-700)] bg-[var(--etihuku-gray-900)] p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: NODE_TYPE_CONFIG[selectedNode.type].color }} />
                    <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: NODE_TYPE_CONFIG[selectedNode.type].color }}>
                      {NODE_TYPE_CONFIG[selectedNode.type].label}
                    </span>
                  </div>
                  <div className="font-semibold text-sm text-white">{selectedNode.label}</div>
                </div>
                <button onClick={() => setSelectedNode(null)} className="text-[var(--etihuku-gray-500)] hover:text-white">
                  <X size={14} />
                </button>
              </div>
              <p className="text-xs text-[var(--etihuku-gray-400)] mb-3">{selectedNode.description}</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--etihuku-gray-500)]">Volume</span>
                  <span className="text-white font-mono">{selectedNode.volume}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--etihuku-gray-500)]">Updated</span>
                  <span className="text-white">{selectedNode.updatedAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--etihuku-gray-500)]">Vertical</span>
                  <span className="capitalize" style={{ color: VERTICAL_COLORS[selectedNode.vertical] }}>{selectedNode.vertical}</span>
                </div>
              </div>
            </div>

            {/* Upstream / downstream */}
            {(["upstream", "downstream"] as const).map(dir => {
              const related = EDGES
                .filter(e => dir === "upstream" ? e.target === selectedNode.id : e.source === selectedNode.id)
                .map(e => ({ edge: e, node: nodes.find(n => n.id === (dir === "upstream" ? e.source : e.target))! }))
                .filter(r => r.node);
              if (!related.length) return null;
              return (
                <div key={dir} className="rounded-lg border border-[var(--etihuku-gray-700)] bg-[var(--etihuku-gray-900)] p-3">
                  <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--etihuku-gray-400)] mb-2 capitalize">{dir}</div>
                  <div className="space-y-1.5">
                    {related.map(({ edge, node }) => (
                      <div key={node.id} className="flex items-center gap-2 cursor-pointer group" onClick={() => setSelectedNode(node)}>
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: NODE_TYPE_CONFIG[node.type].color }} />
                        <span className="text-xs text-[var(--etihuku-gray-300)] group-hover:text-white">{node.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export { INITIAL_NODES as LINEAGE_NODES, EDGES as LINEAGE_EDGES };
