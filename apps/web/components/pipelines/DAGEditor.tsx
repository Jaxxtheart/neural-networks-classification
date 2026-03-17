"use client";

import { useState, useRef } from "react";
import {
  Database, Filter, ShieldCheck, ArrowUpRight,
  Plus, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type NodeType = "source" | "transform" | "quality_gate" | "destination";
export type NodeStatus = "idle" | "pending" | "running" | "success" | "failed";

export interface DAGNode {
  id: string;
  type: NodeType;
  label: string;
  subtype: string;
  x: number;
  y: number;
  status: NodeStatus;
  config: Record<string, unknown>;
}

export interface DAGEdge {
  id: string;
  source: string;
  target: string;
}

const NODE_WIDTH = 160;
const NODE_HEIGHT = 60;

const NODE_TYPE_CONFIG: Record<NodeType, {
  color: string; bg: string; borderColor: string;
  icon: React.ElementType; label: string;
}> = {
  source:       { color: "#3B82F6", bg: "bg-blue-950",   borderColor: "#3B82F6", icon: Database,    label: "Source"       },
  transform:    { color: "#8B5CF6", bg: "bg-violet-950", borderColor: "#8B5CF6", icon: Filter,       label: "Transform"    },
  quality_gate: { color: "#10B981", bg: "bg-green-950",  borderColor: "#10B981", icon: ShieldCheck,  label: "Quality Gate" },
  destination:  { color: "#F59E0B", bg: "bg-amber-950",  borderColor: "#F59E0B", icon: ArrowUpRight,  label: "Destination"  },
};

const STATUS_CONFIG: Record<NodeStatus, { color: string; pulse: boolean }> = {
  idle:    { color: "#6B6B88", pulse: false },
  pending: { color: "#B0B0C8", pulse: false },
  running: { color: "#5046E5", pulse: true  },
  success: { color: "#10B981", pulse: false },
  failed:  { color: "#EF4444", pulse: false },
};

export const NODE_SUBTYPES: Record<NodeType, string[]> = {
  source:       ["PostgreSQL", "Kafka", "AWS S3", "REST API", "OPC-UA", "SFTP"],
  transform:    ["Filter", "Join", "Aggregate", "Window", "Custom SQL", "Python", "Normalize", "Pivot"],
  quality_gate: ["Threshold Check", "Schema Validation", "Freshness Gate", "Custom Rule"],
  destination:  ["Data Warehouse", "Model Training Set", "API Export", "S3 Export", "Feature Store"],
};

const INITIAL_NODES: DAGNode[] = [
  { id: "n1", type: "source",       label: "CDR Source",     subtype: "PostgreSQL",        x: 40,  y: 120, status: "success", config: {} },
  { id: "n2", type: "source",       label: "Network KPIs",   subtype: "Kafka",             x: 40,  y: 220, status: "success", config: {} },
  { id: "n3", type: "transform",    label: "Join & Enrich",  subtype: "Join",              x: 260, y: 160, status: "success", config: {} },
  { id: "n4", type: "transform",    label: "Feature Eng.",   subtype: "Window",            x: 460, y: 160, status: "running", config: {} },
  { id: "n5", type: "quality_gate", label: "Quality Check",  subtype: "Threshold Check",   x: 660, y: 160, status: "pending", config: {} },
  { id: "n6", type: "destination",  label: "Churn Features", subtype: "Feature Store",     x: 860, y: 100, status: "idle",    config: {} },
  { id: "n7", type: "destination",  label: "DWH Export",     subtype: "Data Warehouse",    x: 860, y: 220, status: "idle",    config: {} },
];

const INITIAL_EDGES: DAGEdge[] = [
  { id: "e1", source: "n1", target: "n3" },
  { id: "e2", source: "n2", target: "n3" },
  { id: "e3", source: "n3", target: "n4" },
  { id: "e4", source: "n4", target: "n5" },
  { id: "e5", source: "n5", target: "n6" },
  { id: "e6", source: "n5", target: "n7" },
];

function getEdgePath(nodes: DAGNode[], source: string, target: string): string {
  const s = nodes.find(n => n.id === source);
  const t = nodes.find(n => n.id === target);
  if (!s || !t) return "";
  const sx = s.x + NODE_WIDTH;
  const sy = s.y + NODE_HEIGHT / 2;
  const tx = t.x;
  const ty = t.y + NODE_HEIGHT / 2;
  const cx = (sx + tx) / 2;
  return `M ${sx} ${sy} C ${cx} ${sy} ${cx} ${ty} ${tx} ${ty}`;
}

interface DAGEditorProps {
  onSelectNode: (node: DAGNode | null) => void;
  selectedNodeId: string | null;
  running: boolean;
}

export function DAGEditor({ onSelectNode, selectedNodeId, running }: DAGEditorProps) {
  const [nodes, setNodes] = useState<DAGNode[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<DAGEdge[]>(INITIAL_EDGES);
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null);
  const [addingNodeType, setAddingNodeType] = useState<NodeType | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const CANVAS_W = 1100;
  const CANVAS_H = 400;

  function handleMouseDown(e: React.MouseEvent, nodeId: string) {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    setDragging({ id: nodeId, ox: e.clientX - node.x, oy: e.clientY - node.y });
    onSelectNode(node);
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    const x = Math.max(0, Math.min(CANVAS_W - NODE_WIDTH, e.clientX - dragging.ox));
    const y = Math.max(0, Math.min(CANVAS_H - NODE_HEIGHT, e.clientY - dragging.oy));
    setNodes(prev => prev.map(n => n.id === dragging.id ? { ...n, x, y } : n));
  }

  function handleMouseUp() {
    setDragging(null);
  }

  function handleCanvasClick() {
    if (addingNodeType) {
      const x = 200 + nodes.length * 30;
      const y = 140 + (nodes.length % 3) * 90;
      const typeCfg = NODE_TYPE_CONFIG[addingNodeType];
      const newNode: DAGNode = {
        id: `n${Date.now()}`,
        type: addingNodeType,
        label: `New ${typeCfg.label}`,
        subtype: NODE_SUBTYPES[addingNodeType][0],
        x, y,
        status: "idle",
        config: {},
      };
      setNodes(prev => [...prev, newNode]);
      setAddingNodeType(null);
      onSelectNode(newNode);
    } else {
      onSelectNode(null);
    }
  }

  function deleteNode(id: string) {
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.source !== id && e.target !== id));
    onSelectNode(null);
  }

  return (
    <div className="card p-0 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--etihuku-gray-800)] flex-wrap">
        <span className="text-xs font-medium text-[var(--etihuku-gray-400)] uppercase tracking-wide">Add Node:</span>
        {(Object.entries(NODE_TYPE_CONFIG) as [NodeType, typeof NODE_TYPE_CONFIG[NodeType]][]).map(([type, cfg]) => {
          const Icon = cfg.icon;
          return (
            <button
              key={type}
              onClick={() => setAddingNodeType(addingNodeType === type ? null : type)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-all",
                addingNodeType === type
                  ? "text-white border-transparent"
                  : "border-[var(--etihuku-gray-700)] text-[var(--etihuku-gray-400)] hover:border-[var(--etihuku-gray-500)]"
              )}
              style={addingNodeType === type ? { borderColor: cfg.color, backgroundColor: `${cfg.color}20`, color: cfg.color } : {}}
            >
              <Icon size={12} /> {cfg.label}
            </button>
          );
        })}
        {addingNodeType && (
          <span className="text-xs text-[var(--etihuku-indigo)] animate-pulse ml-2">
            Click canvas to place node
          </span>
        )}
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative overflow-auto bg-[var(--etihuku-black)] cursor-default select-none"
        style={{ height: 380 }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
      >
        {/* Grid dots */}
        <svg
          style={{ position: "absolute", top: 0, left: 0, width: CANVAS_W, height: CANVAS_H, pointerEvents: "none" }}
        >
          <defs>
            <pattern id="dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="var(--etihuku-gray-800)" />
            </pattern>
          </defs>
          <rect width={CANVAS_W} height={CANVAS_H} fill="url(#dot-grid)" />
        </svg>

        {/* Edges SVG */}
        <svg
          ref={svgRef}
          style={{ position: "absolute", top: 0, left: 0, width: CANVAS_W, height: CANVAS_H, pointerEvents: "none" }}
        >
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="var(--etihuku-gray-600)" />
            </marker>
          </defs>
          {edges.map(edge => {
            const path = getEdgePath(nodes, edge.source, edge.target);
            const targetNode = nodes.find(n => n.id === edge.target);
            const statusColor = targetNode ? STATUS_CONFIG[targetNode.status].color : "#6B6B88";
            return (
              <path
                key={edge.id}
                d={path}
                fill="none"
                stroke={targetNode?.status === "running" ? "var(--etihuku-indigo)" : "var(--etihuku-gray-700)"}
                strokeWidth={targetNode?.status === "running" ? 2 : 1.5}
                strokeDasharray={targetNode?.status === "running" ? "6 3" : undefined}
                markerEnd="url(#arrowhead)"
                opacity={0.8}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        <div style={{ position: "absolute", top: 0, left: 0, width: CANVAS_W, height: CANVAS_H }}>
          {nodes.map(node => {
            const typeCfg = NODE_TYPE_CONFIG[node.type];
            const statusCfg = STATUS_CONFIG[node.status];
            const Icon = typeCfg.icon;
            const isSelected = selectedNodeId === node.id;

            return (
              <div
                key={node.id}
                style={{
                  position: "absolute",
                  left: node.x,
                  top: node.y,
                  width: NODE_WIDTH,
                  height: NODE_HEIGHT,
                  cursor: dragging?.id === node.id ? "grabbing" : "grab",
                }}
                onMouseDown={e => handleMouseDown(e, node.id)}
                onClick={e => { e.stopPropagation(); onSelectNode(node); }}
                className="group"
              >
                <div className={cn(
                  "w-full h-full rounded-lg border-2 flex items-center gap-2.5 px-3 transition-all",
                  "bg-[var(--etihuku-gray-900)]",
                  isSelected ? "shadow-lg" : "hover:brightness-110"
                )}
                  style={{
                    borderColor: isSelected ? typeCfg.color : `${typeCfg.color}50`,
                    boxShadow: isSelected ? `0 0 12px ${typeCfg.color}40` : undefined,
                  }}
                >
                  {/* Status dot */}
                  <div className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    statusCfg.pulse && "animate-pulse"
                  )} style={{ backgroundColor: statusCfg.color }} />

                  {/* Icon + text */}
                  <div className={cn("w-6 h-6 rounded flex items-center justify-center shrink-0", typeCfg.bg)}>
                    <Icon size={12} style={{ color: typeCfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-white truncate">{node.label}</div>
                    <div className="text-[9px] text-[var(--etihuku-gray-500)] truncate">{node.subtype}</div>
                  </div>

                  {/* Delete button */}
                  <button
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); deleteNode(node.id); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-950 text-[var(--etihuku-gray-600)] hover:text-red-400 transition-all shrink-0"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>

                {/* Connection ports */}
                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 rounded-full border-2 border-[var(--etihuku-gray-700)] bg-[var(--etihuku-gray-900)] hover:border-[var(--etihuku-indigo)] transition-colors"
                  style={{ cursor: "crosshair" }}
                />
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-[var(--etihuku-gray-700)] bg-[var(--etihuku-gray-900)]"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-[var(--etihuku-gray-800)]">
        {(Object.entries(STATUS_CONFIG) as [NodeStatus, typeof STATUS_CONFIG[NodeStatus]][]).map(([status, cfg]) => (
          <div key={status} className="flex items-center gap-1.5 text-xs text-[var(--etihuku-gray-500)]">
            <div className={cn("w-2 h-2 rounded-full", cfg.pulse && "animate-pulse")} style={{ backgroundColor: cfg.color }} />
            <span className="capitalize">{status}</span>
          </div>
        ))}
        <div className="ml-auto text-xs text-[var(--etihuku-gray-600)]">
          {nodes.length} nodes · {edges.length} edges
        </div>
      </div>
    </div>
  );
}
