"use client";

import { useState, useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceArea, ResponsiveContainer
} from "recharts";
import { Plus, Trash2, ZoomIn, Tag, AlertTriangle, Activity } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface EventAnnotation {
  id: string;
  x1: number;
  x2: number;
  label: string;
  color: string;
  description: string;
  source: "human" | "ai";
}

const EVENT_CLASSES = [
  { name: "Anomaly",         color: "#EF4444" },
  { name: "Maintenance",     color: "#F59E0B" },
  { name: "Peak Load",       color: "#8B5CF6" },
  { name: "Network Fault",   color: "#EC4899" },
  { name: "Normal Segment",  color: "#10B981" },
];

// Generate mock time-series: sensor temperature over 48 hours
function genData() {
  const data = [];
  let temp = 68, vibration = 0.4, power = 420;
  for (let i = 0; i < 96; i++) {
    // Inject anomaly around i=60–70
    const anomaly = i >= 60 && i <= 70;
    temp      = Math.max(40, Math.min(110, temp + (anomaly ? 1.8 : (Math.random() - 0.5) * 1.5)));
    vibration = Math.max(0, Math.min(2,   vibration + (anomaly ? 0.06 : (Math.random() - 0.5) * 0.08)));
    power     = Math.max(300, Math.min(600, power + (anomaly ? 8 : (Math.random() - 0.5) * 12)));
    data.push({
      t: i,
      label: `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`,
      temperature: Math.round(temp * 10) / 10,
      vibration:   Math.round(vibration * 100) / 100,
      power:       Math.round(power),
    });
  }
  return data;
}

const DATA = genData();

const MOCK_AI_ANNOTATIONS: EventAnnotation[] = [
  { id: "ann-ai-1", x1: 60, x2: 70, label: "Anomaly", color: "#EF4444", description: "Temperature + vibration spike — possible bearing wear", source: "ai" },
  { id: "ann-ai-2", x1: 30, x2: 34, label: "Peak Load", color: "#8B5CF6", description: "Power draw 15% above baseline", source: "ai" },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--etihuku-gray-900)] border border-[var(--etihuku-gray-700)] rounded-lg p-3 text-xs shadow-xl">
      <div className="text-[var(--etihuku-gray-400)] mb-2 font-medium">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-3 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-[var(--etihuku-gray-300)] capitalize">{p.dataKey}</span>
          <span className="font-mono font-semibold text-white ml-auto">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function TimeSeriesAnnotator() {
  const [annotations, setAnnotations] = useState<EventAnnotation[]>(MOCK_AI_ANNOTATIONS);
  const [activeClass, setActiveClass] = useState(EVENT_CLASSES[0]);
  const [drawing, setDrawing] = useState<{ x1: number } | null>(null);
  const [currentX2, setCurrentX2] = useState<number | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [visibleMetrics, setVisibleMetrics] = useState({ temperature: true, vibration: true, power: false });
  const [activeChannel, setActiveChannel] = useState<"temperature" | "vibration" | "power">("temperature");

  function handleChartMouseDown(e: { activeLabel?: string; activeTooltipIndex?: number }) {
    if (e.activeTooltipIndex === undefined) return;
    setDrawing({ x1: e.activeTooltipIndex });
    setCurrentX2(e.activeTooltipIndex);
  }

  function handleChartMouseMove(e: { activeTooltipIndex?: number }) {
    if (!drawing || e.activeTooltipIndex === undefined) return;
    setCurrentX2(e.activeTooltipIndex);
  }

  function handleChartMouseUp(e: { activeTooltipIndex?: number }) {
    if (!drawing) return;
    const x2 = e.activeTooltipIndex ?? drawing.x1;
    const x1 = Math.min(drawing.x1, x2);
    const x2f = Math.max(drawing.x1, x2);
    if (x2f - x1 >= 2) {
      const ann: EventAnnotation = {
        id: `ann-${Date.now()}`,
        x1, x2: x2f,
        label: activeClass.name,
        color: activeClass.color,
        description: `${activeClass.name} segment annotated by analyst`,
        source: "human",
      };
      setAnnotations(prev => [...prev, ann]);
    }
    setDrawing(null);
    setCurrentX2(null);
  }

  function deleteAnnotation(id: string) {
    setAnnotations(prev => prev.filter(a => a.id !== id));
  }

  const METRIC_CONFIG = {
    temperature: { color: "#EF4444", unit: "°C", domain: [40, 110] as [number, number] },
    vibration:   { color: "#F59E0B", unit: "g",  domain: [0, 2]    as [number, number] },
    power:       { color: "#3B82F6", unit: "W",  domain: [300, 600] as [number, number] },
  };

  const metric = METRIC_CONFIG[activeChannel];

  return (
    <div className="space-y-4">
      {/* Metric selector + class picker */}
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-[var(--etihuku-gray-500)] mb-1.5">Metric Channel</div>
          <div className="flex gap-1">
            {(["temperature", "vibration", "power"] as const).map(m => {
              const mc = METRIC_CONFIG[m];
              return (
                <button
                  key={m}
                  onClick={() => setActiveChannel(m)}
                  className={cn(
                    "px-2.5 py-1 rounded text-xs font-medium border capitalize transition-all",
                    activeChannel === m
                      ? "border-transparent text-white"
                      : "border-[var(--etihuku-gray-700)] text-[var(--etihuku-gray-400)] hover:border-[var(--etihuku-gray-500)]"
                  )}
                  style={activeChannel === m ? { backgroundColor: `${mc.color}25`, borderColor: mc.color, color: mc.color } : {}}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wide text-[var(--etihuku-gray-500)] mb-1.5">Event Class</div>
          <div className="flex gap-1 flex-wrap">
            {EVENT_CLASSES.map(ec => (
              <button
                key={ec.name}
                onClick={() => setActiveClass(ec)}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-medium border transition-all",
                  activeClass.name === ec.name
                    ? "border-transparent text-white"
                    : "border-[var(--etihuku-gray-700)] text-[var(--etihuku-gray-400)] hover:border-[var(--etihuku-gray-500)]"
                )}
                style={activeClass.name === ec.name ? { backgroundColor: `${ec.color}25`, borderColor: ec.color, color: ec.color } : {}}
              >
                {ec.name}
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto text-xs text-[var(--etihuku-gray-500)]">
          Drag on chart to annotate a segment
        </div>
      </div>

      {/* Chart */}
      <div className="card bg-[var(--etihuku-black)]">
        <div className="flex items-center gap-3 mb-3">
          <Activity size={14} className="text-[var(--etihuku-indigo)]" />
          <span className="text-sm font-medium text-white">Sensor Array · Mine Floor Alpha · Last 48h</span>
        </div>

        <div style={{ userSelect: "none" }}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={DATA}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              onMouseDown={handleChartMouseDown}
              onMouseMove={handleChartMouseMove}
              onMouseUp={handleChartMouseUp}
              style={{ cursor: drawing ? "col-resize" : "crosshair" }}
            >
              <defs>
                <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={metric.color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={metric.color} stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--etihuku-gray-800)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "var(--etihuku-gray-500)", fontSize: 10 }} axisLine={false} tickLine={false} interval={11} />
              <YAxis domain={metric.domain} tick={{ fill: "var(--etihuku-gray-500)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />

              {/* Existing annotation bands */}
              {annotations.map(ann => (
                <ReferenceArea
                  key={ann.id}
                  x1={DATA[ann.x1]?.label}
                  x2={DATA[ann.x2]?.label}
                  fill={ann.color}
                  fillOpacity={0.15}
                  stroke={ann.color}
                  strokeOpacity={0.6}
                  strokeWidth={1.5}
                />
              ))}

              {/* Currently drawing band */}
              {drawing && currentX2 !== null && (
                <ReferenceArea
                  x1={DATA[Math.min(drawing.x1, currentX2)]?.label}
                  x2={DATA[Math.max(drawing.x1, currentX2)]?.label}
                  fill={activeClass.color}
                  fillOpacity={0.2}
                  stroke={activeClass.color}
                  strokeDasharray="4 2"
                />
              )}

              <Area
                type="monotone"
                dataKey={activeChannel}
                stroke={metric.color}
                strokeWidth={2}
                fill="url(#metricGrad)"
                dot={false}
                activeDot={{ r: 3 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Annotation list */}
      <div>
        <div className="text-[10px] uppercase tracking-wide text-[var(--etihuku-gray-500)] mb-2">
          Annotations ({annotations.length})
        </div>
        <div className="space-y-2">
          {annotations.map(ann => {
            const duration = ann.x2 - ann.x1;
            const durationLabel = duration <= 2 ? `${duration * 30}m` : duration <= 12 ? `${(duration / 2).toFixed(1)}h` : `${(duration / 2).toFixed(0)}h`;
            return (
              <div
                key={ann.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer group",
                  selected === ann.id ? "border-white bg-[var(--etihuku-gray-800)]" : "border-[var(--etihuku-gray-800)] hover:border-[var(--etihuku-gray-600)]"
                )}
                onClick={() => setSelected(selected === ann.id ? null : ann.id)}
              >
                <div className="w-3 h-3 rounded-sm shrink-0 mt-0.5" style={{ backgroundColor: ann.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-white">{ann.label}</span>
                    {ann.source === "ai" && (
                      <span className="text-[9px] text-[var(--etihuku-indigo)] font-bold bg-[var(--etihuku-indigo)]/10 px-1.5 py-0.5 rounded">
                        AI
                      </span>
                    )}
                    <span className="text-[10px] text-[var(--etihuku-gray-500)] ml-auto">
                      t={ann.x1}–{ann.x2} ({durationLabel})
                    </span>
                  </div>
                  <div className="text-xs text-[var(--etihuku-gray-500)]">{ann.description}</div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); deleteAnnotation(ann.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-950 text-[var(--etihuku-gray-500)] hover:text-red-400 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
          {annotations.length === 0 && (
            <div className="text-center py-8 text-[var(--etihuku-gray-600)] text-sm">
              No annotations yet. Drag on the chart to add one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
