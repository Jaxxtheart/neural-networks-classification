"use client";

import { useState, useRef, useCallback } from "react";
import {
  Square, Pentagon, Minus, Crosshair, ZoomIn, ZoomOut,
  RotateCcw, ChevronDown, Check, X, Trash2, Eye, EyeOff, Tag
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Tool = "bbox" | "polygon" | "polyline" | "point";
type DrawState = "idle" | "drawing";

interface BBox    { id: string; x: number; y: number; w: number; h: number; label: string; color: string; confidence?: number; source: "human" | "ai" }
interface AnnotPoint { x: number; y: number }
interface Polygon { id: string; points: AnnotPoint[]; label: string; color: string; source: "human" | "ai" }

const LABEL_CLASSES = [
  { name: "Vehicle",        color: "#3B82F6" },
  { name: "Person",         color: "#10B981" },
  { name: "Pothole",        color: "#EF4444" },
  { name: "Crack",          color: "#F59E0B" },
  { name: "Equipment",      color: "#8B5CF6" },
  { name: "Hazard Zone",    color: "#EC4899" },
  { name: "Restricted Area",color: "#F97316" },
];

const TOOL_CONFIG: Record<Tool, { icon: React.ElementType; label: string; hotkey: string }> = {
  bbox:     { icon: Square,    label: "Bounding Box", hotkey: "B" },
  polygon:  { icon: Pentagon,  label: "Polygon",      hotkey: "P" },
  polyline: { icon: Minus,     label: "Polyline",     hotkey: "L" },
  point:    { icon: Crosshair, label: "Point",        hotkey: "K" },
};

// Mock pre-annotations from LLM
const MOCK_AI_BBOXES: BBox[] = [
  { id: "ai-1", x: 60,  y: 80,  w: 120, h: 90,  label: "Vehicle",  color: "#3B82F6", confidence: 0.94, source: "ai" },
  { id: "ai-2", x: 280, y: 120, w: 60,  h: 140, label: "Person",   color: "#10B981", confidence: 0.87, source: "ai" },
  { id: "ai-3", x: 380, y: 240, w: 80,  h: 50,  label: "Pothole",  color: "#EF4444", confidence: 0.72, source: "ai" },
];

export function ImageAnnotationCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [activeTool, setActiveTool] = useState<Tool>("bbox");
  const [activeLabel, setActiveLabel] = useState(LABEL_CLASSES[0]);
  const [zoom, setZoom] = useState(100);
  const [bboxes, setBboxes] = useState<BBox[]>(MOCK_AI_BBOXES);
  const [drawing, setDrawing] = useState<{ x: number; y: number } | null>(null);
  const [current, setCurrent] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [showAI, setShowAI] = useState(true);

  const scale = zoom / 100;

  function getRelPos(e: React.MouseEvent) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.round((e.clientX - rect.left) / scale),
      y: Math.round((e.clientY - rect.top) / scale),
    };
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (activeTool !== "bbox") return;
    e.preventDefault();
    const pos = getRelPos(e);
    setDrawing(pos);
    setCurrent({ x: pos.x, y: pos.y, w: 0, h: 0 });
    setSelected(null);
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!drawing) return;
    const pos = getRelPos(e);
    setCurrent({
      x: Math.min(drawing.x, pos.x),
      y: Math.min(drawing.y, pos.y),
      w: Math.abs(pos.x - drawing.x),
      h: Math.abs(pos.y - drawing.y),
    });
  }

  function handleMouseUp() {
    if (!drawing || !current) return;
    if (current.w > 10 && current.h > 10) {
      const newBox: BBox = {
        id: `bbox-${Date.now()}`,
        x: current.x, y: current.y, w: current.w, h: current.h,
        label: activeLabel.name, color: activeLabel.color, source: "human",
      };
      setBboxes(prev => [...prev, newBox]);
      setSelected(newBox.id);
    }
    setDrawing(null);
    setCurrent(null);
  }

  function deleteBox(id: string) {
    setBboxes(prev => prev.filter(b => b.id !== id));
    if (selected === id) setSelected(null);
  }

  function acceptAI(id: string) {
    setBboxes(prev => prev.map(b => b.id === id ? { ...b, source: "human", confidence: undefined } : b));
  }

  function rejectAI(id: string) {
    deleteBox(id);
  }

  function toggleHide(id: string) {
    setHiddenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const visibleBboxes = bboxes.filter(b => showAI || b.source !== "ai");

  return (
    <div className="flex h-full gap-3">
      {/* Left toolbar */}
      <div className="flex flex-col gap-2 shrink-0">
        {(Object.entries(TOOL_CONFIG) as [Tool, typeof TOOL_CONFIG[Tool]][]).map(([t, cfg]) => {
          const Icon = cfg.icon;
          return (
            <button
              key={t}
              onClick={() => setActiveTool(t)}
              title={`${cfg.label} [${cfg.hotkey}]`}
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center transition-all border text-xs font-bold",
                activeTool === t
                  ? "bg-[var(--etihuku-indigo)] border-[var(--etihuku-indigo)] text-white"
                  : "bg-[var(--etihuku-gray-800)] border-[var(--etihuku-gray-700)] text-[var(--etihuku-gray-400)] hover:border-[var(--etihuku-gray-500)]"
              )}
            >
              <Icon size={16} />
            </button>
          );
        })}
        <div className="w-px h-px" />
        <button onClick={() => setZoom(z => Math.min(300, z + 25))} className="w-9 h-9 rounded-lg bg-[var(--etihuku-gray-800)] border border-[var(--etihuku-gray-700)] flex items-center justify-center text-[var(--etihuku-gray-400)] hover:text-white">
          <ZoomIn size={16} />
        </button>
        <button onClick={() => setZoom(z => Math.max(25, z - 25))} className="w-9 h-9 rounded-lg bg-[var(--etihuku-gray-800)] border border-[var(--etihuku-gray-700)] flex items-center justify-center text-[var(--etihuku-gray-400)] hover:text-white">
          <ZoomOut size={16} />
        </button>
        <button onClick={() => setZoom(100)} className="w-9 h-9 rounded-lg bg-[var(--etihuku-gray-800)] border border-[var(--etihuku-gray-700)] flex items-center justify-center text-[var(--etihuku-gray-400)] hover:text-white">
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Canvas area */}
      <div className="flex-1 overflow-auto bg-[var(--etihuku-black)] rounded-lg border border-[var(--etihuku-gray-800)] relative">
        {/* Toolbar bar */}
        <div className="absolute top-2 left-2 right-2 z-10 flex items-center gap-2 flex-wrap">
          {/* Label picker */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[var(--etihuku-gray-900)]/90 backdrop-blur border border-[var(--etihuku-gray-700)] text-xs text-white">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: activeLabel.color }} />
              {activeLabel.name}
              <ChevronDown size={10} />
            </button>
            <div className="hidden group-hover:block absolute top-full left-0 mt-1 bg-[var(--etihuku-gray-900)] border border-[var(--etihuku-gray-700)] rounded-lg shadow-xl z-50 py-1 min-w-40">
              {LABEL_CLASSES.map(lc => (
                <button
                  key={lc.name}
                  onClick={() => setActiveLabel(lc)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-[var(--etihuku-gray-800)] text-white"
                >
                  <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: lc.color }} />
                  {lc.name}
                </button>
              ))}
            </div>
          </div>

          {/* AI toggle */}
          <button
            onClick={() => setShowAI(s => !s)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border transition-all backdrop-blur",
              showAI
                ? "bg-[var(--etihuku-indigo)]/80 border-[var(--etihuku-indigo)] text-white"
                : "bg-[var(--etihuku-gray-900)]/80 border-[var(--etihuku-gray-700)] text-[var(--etihuku-gray-400)]"
            )}
          >
            <Eye size={11} /> AI Suggestions ({MOCK_AI_BBOXES.length})
          </button>

          <span className="ml-auto text-xs text-[var(--etihuku-gray-500)] bg-[var(--etihuku-gray-900)]/80 backdrop-blur px-2 py-1 rounded border border-[var(--etihuku-gray-800)]">
            {zoom}%
          </span>
        </div>

        {/* Image + annotations */}
        <div
          ref={canvasRef}
          className="relative select-none"
          style={{
            width: 560 * scale,
            height: 380 * scale,
            cursor: activeTool === "bbox" ? "crosshair" : "default",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Simulated image - gradient placeholder */}
          <div
            className="absolute inset-0 rounded"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              width: 560,
              height: 380,
              background: "linear-gradient(135deg, #1A1A2E 0%, #2D2D44 30%, #1A1A2E 60%, #0F0F1A 100%)",
            }}
          >
            {/* Fake scene elements */}
            <div className="absolute bottom-8 left-0 right-0 h-24 bg-[#2D2D44]" />
            <div className="absolute top-16 left-14 w-28 h-20 bg-[#3D3D55] rounded opacity-80" />
            <div className="absolute top-24 left-70 w-14 h-32 bg-[#4A4A66] rounded opacity-80" style={{ left: 280 }} />
            <div className="absolute bottom-20 left-1/2 w-20 h-10 bg-[#555570] rounded opacity-70" />
          </div>

          {/* Rendered annotations */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: 560 * scale, height: 380 * scale }}
          >
            {visibleBboxes.filter(b => !hiddenIds.has(b.id)).map(bbox => (
              <g key={bbox.id} onClick={(e) => { e.stopPropagation(); setSelected(bbox.id); }}>
                <rect
                  x={bbox.x * scale} y={bbox.y * scale}
                  width={bbox.w * scale} height={bbox.h * scale}
                  fill={`${bbox.color}20`}
                  stroke={selected === bbox.id ? "#fff" : bbox.color}
                  strokeWidth={selected === bbox.id ? 2 : 1.5}
                  strokeDasharray={bbox.source === "ai" ? "5 3" : undefined}
                  style={{ cursor: "pointer", pointerEvents: "all" }}
                />
                <rect
                  x={bbox.x * scale} y={(bbox.y - 14) * scale}
                  width={Math.max(bbox.label.length * 7 + 16, 60) * scale}
                  height={14 * scale}
                  fill={bbox.color}
                  rx={2 * scale}
                />
                <text
                  x={(bbox.x + 5) * scale} y={(bbox.y - 3.5) * scale}
                  fontSize={9 * scale} fill="white" fontWeight="600"
                  style={{ pointerEvents: "none", fontFamily: "var(--font-body)" }}
                >
                  {bbox.label}{bbox.confidence ? ` ${Math.round(bbox.confidence * 100)}%` : ""}
                </text>
              </g>
            ))}

            {/* Active drawing box */}
            {current && current.w > 2 && current.h > 2 && (
              <rect
                x={current.x * scale} y={current.y * scale}
                width={current.w * scale} height={current.h * scale}
                fill={`${activeLabel.color}15`}
                stroke={activeLabel.color}
                strokeWidth={2}
                strokeDasharray="6 3"
              />
            )}
          </svg>
        </div>
      </div>

      {/* Right panel: annotation list */}
      <div className="w-52 shrink-0 space-y-2 overflow-y-auto">
        <div className="text-[10px] uppercase tracking-wide font-medium text-[var(--etihuku-gray-400)] mb-2">
          Annotations ({bboxes.length})
        </div>

        {bboxes.map(bbox => (
          <div
            key={bbox.id}
            className={cn(
              "p-2 rounded-lg border text-xs cursor-pointer transition-all",
              selected === bbox.id
                ? "border-white bg-[var(--etihuku-gray-800)]"
                : "border-[var(--etihuku-gray-800)] hover:border-[var(--etihuku-gray-600)]"
            )}
            onClick={() => setSelected(selected === bbox.id ? null : bbox.id)}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: bbox.color }} />
              <span className="font-medium text-white flex-1 truncate">{bbox.label}</span>
              {bbox.source === "ai" && (
                <span className="text-[9px] text-[var(--etihuku-indigo)] font-bold">AI</span>
              )}
            </div>

            {bbox.confidence && (
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="flex-1 h-1 bg-[var(--etihuku-gray-700)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--etihuku-indigo)] rounded-full" style={{ width: `${bbox.confidence * 100}%` }} />
                </div>
                <span className="text-[var(--etihuku-gray-500)] text-[9px]">{Math.round(bbox.confidence * 100)}%</span>
              </div>
            )}

            <div className="flex gap-1 justify-end">
              {bbox.source === "ai" && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); acceptAI(bbox.id); }} className="p-1 rounded hover:bg-green-950 text-green-500">
                    <Check size={11} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); rejectAI(bbox.id); }} className="p-1 rounded hover:bg-red-950 text-red-500">
                    <X size={11} />
                  </button>
                </>
              )}
              <button onClick={(e) => { e.stopPropagation(); toggleHide(bbox.id); }} className="p-1 rounded hover:bg-[var(--etihuku-gray-700)] text-[var(--etihuku-gray-500)]">
                {hiddenIds.has(bbox.id) ? <EyeOff size={11} /> : <Eye size={11} />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); deleteBox(bbox.id); }} className="p-1 rounded hover:bg-red-950 text-[var(--etihuku-gray-500)] hover:text-red-400">
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        ))}

        {bboxes.length === 0 && (
          <div className="text-center py-8 text-[var(--etihuku-gray-600)] text-xs">
            No annotations yet.<br />Draw a bounding box.
          </div>
        )}
      </div>
    </div>
  );
}
