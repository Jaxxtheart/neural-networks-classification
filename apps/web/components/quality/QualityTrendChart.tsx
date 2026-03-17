"use client";

import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend, Area, AreaChart
} from "recharts";
import { cn } from "@/lib/utils/cn";
import { TrendingUp, TrendingDown } from "lucide-react";

type Period = "30" | "90";

function generateDays(n: number, base: number, variance: number) {
  const data = [];
  let val = base;
  for (let i = n; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    val = Math.min(100, Math.max(50, val + (Math.random() - 0.48) * variance));
    data.push({
      date: date.toLocaleDateString("en-ZA", { day: "2-digit", month: "short" }),
      composite: Math.round(val * 10) / 10,
      telecom:     Math.round(Math.min(100, Math.max(50, val + (Math.random() - 0.5) * 4)) * 10) / 10,
      security:    Math.round(Math.min(100, Math.max(50, val + (Math.random() - 0.5) * 6)) * 10) / 10,
      mining:      Math.round(Math.min(100, Math.max(50, val + (Math.random() - 0.5) * 8)) * 10) / 10,
      engineering: Math.round(Math.min(100, Math.max(50, val + (Math.random() - 0.5) * 5)) * 10) / 10,
    });
  }
  return data;
}

const DATA_30 = generateDays(30, 87, 3);
const DATA_90 = generateDays(90, 82, 4);

const LINES = [
  { key: "composite",   label: "Composite",    color: "#D1A039", strokeWidth: 2.5, dashed: false },
  { key: "telecom",     label: "Telecom",       color: "#8B5CF6", strokeWidth: 1.5, dashed: false },
  { key: "security",    label: "Security",      color: "#F59E0B", strokeWidth: 1.5, dashed: false },
  { key: "mining",      label: "Mining",        color: "#10B981", strokeWidth: 1.5, dashed: false },
  { key: "engineering", label: "Engineering",   color: "#EC4899", strokeWidth: 1.5, dashed: false },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--etihuku-gray-900)] border border-[var(--etihuku-gray-700)] rounded-lg p-3 shadow-xl text-xs min-w-36">
      <div className="text-[var(--etihuku-gray-400)] mb-2 font-medium">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-[var(--etihuku-gray-300)] capitalize">{p.name}</span>
          </div>
          <span className="font-mono font-semibold text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function QualityTrendChart() {
  const [period, setPeriod] = useState<Period>("30");
  const [activeLines, setActiveLines] = useState<string[]>(["composite", "telecom", "security", "mining", "engineering"]);

  const data = period === "30" ? DATA_30 : DATA_90;

  // Thin data for 90 days
  const displayData = period === "90"
    ? data.filter((_, i) => i % 3 === 0)
    : data;

  const latest = data[data.length - 1];
  const prev = data[0];
  const trend = latest.composite - prev.composite;

  function toggleLine(key: string) {
    setActiveLines(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className={cn("flex items-center gap-1.5 text-sm font-semibold", trend >= 0 ? "text-green-400" : "text-red-400")}>
            {trend >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {trend >= 0 ? "+" : ""}{trend.toFixed(1)} pts over {period} days
          </div>
          <div className="text-sm text-[var(--etihuku-gray-500)]">
            Now: <span className="text-[var(--etihuku-gold)] font-semibold">{latest.composite}</span>
          </div>
        </div>

        <div className="flex gap-1 p-1 bg-[var(--etihuku-gray-900)] border border-[var(--etihuku-gray-800)] rounded-lg">
          {(["30", "90"] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3 py-1 rounded text-xs font-medium transition-all",
                period === p ? "bg-[var(--etihuku-indigo)] text-white" : "text-[var(--etihuku-gray-400)] hover:text-white"
              )}
            >
              {p}d
            </button>
          ))}
        </div>
      </div>

      {/* Legend toggles */}
      <div className="flex flex-wrap gap-2">
        {LINES.map(line => (
          <button
            key={line.key}
            onClick={() => toggleLine(line.key)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
              activeLines.includes(line.key)
                ? "border-transparent text-white"
                : "border-[var(--etihuku-gray-700)] text-[var(--etihuku-gray-600)] line-through"
            )}
            style={activeLines.includes(line.key) ? { backgroundColor: `${line.color}20`, borderColor: `${line.color}50`, color: line.color } : {}}
          >
            <div className="w-2.5 h-0.5 rounded-full" style={{ backgroundColor: line.color }} />
            {line.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {LINES.map(line => (
                <linearGradient key={line.key} id={`grad-${line.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={line.color} stopOpacity={line.key === "composite" ? 0.15 : 0.05} />
                  <stop offset="95%" stopColor={line.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--etihuku-gray-800)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--etihuku-gray-500)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval={period === "30" ? 6 : 8}
            />
            <YAxis
              domain={[60, 100]}
              tick={{ fill: "var(--etihuku-gray-500)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <ReferenceLine y={90} stroke="var(--etihuku-gold)" strokeDasharray="4 4" strokeOpacity={0.4}
              label={{ value: "Excellent", position: "insideTopRight", fill: "var(--etihuku-gold)", fontSize: 10 }}
            />
            <ReferenceLine y={70} stroke="#F59E0B" strokeDasharray="4 4" strokeOpacity={0.3}
              label={{ value: "Fair", position: "insideTopRight", fill: "#F59E0B", fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip />} />
            {LINES.filter(l => activeLines.includes(l.key)).map(line => (
              <Area
                key={line.key}
                type="monotone"
                dataKey={line.key}
                stroke={line.color}
                strokeWidth={line.strokeWidth}
                fill={`url(#grad-${line.key})`}
                dot={false}
                activeDot={{ r: 4, fill: line.color }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {LINES.slice(1).map(line => {
          const cur = latest[line.key as keyof typeof latest] as number;
          const old = data[0][line.key as keyof typeof data[0]] as number;
          const diff = cur - old;
          return (
            <div key={line.key} className="p-3 rounded-lg bg-[var(--etihuku-gray-800)]">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: line.color }} />
                <span className="text-[10px] uppercase tracking-wide text-[var(--etihuku-gray-400)] capitalize">{line.label}</span>
              </div>
              <div className="text-lg font-display font-bold text-white">{cur}</div>
              <div className={cn("text-xs font-medium", diff >= 0 ? "text-green-400" : "text-red-400")}>
                {diff >= 0 ? "+" : ""}{diff.toFixed(1)} pts
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
