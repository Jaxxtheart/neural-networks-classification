"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
} from "recharts";

export interface SparklinePoint {
  value: number;
}

export interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  description?: string;
  trend?: {
    direction: "up" | "down" | "flat";
    value: string;
    positive?: boolean; // up = good (green) by default; set false when up = bad
  };
  sparkline?: SparklinePoint[];
  sparklineColor?: string;
  icon?: React.ElementType;
  iconColor?: string;
  accentColor?: string;
  badge?: React.ReactNode;
  className?: string;
  valueClassName?: string;
  isGold?: boolean; // Gold accent when quality > 90
  isLoading?: boolean;
}

export default function MetricCard({
  label,
  value,
  unit,
  description,
  trend,
  sparkline,
  sparklineColor = "var(--etihuku-indigo)",
  icon: Icon,
  iconColor = "var(--etihuku-indigo)",
  accentColor,
  badge,
  className,
  valueClassName,
  isGold = false,
  isLoading = false,
}: MetricCardProps) {
  if (isLoading) {
    return (
      <div className={cn("card p-5", className)}>
        <div className="skeleton h-3 w-24 mb-3 rounded" />
        <div className="skeleton h-8 w-32 mb-2 rounded" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
    );
  }

  const trendColor =
    trend?.direction === "flat"
      ? "var(--etihuku-gray-500)"
      : trend?.positive !== false
        ? trend?.direction === "up"
          ? "var(--etihuku-success)"
          : "var(--etihuku-error)"
        : trend?.direction === "up"
          ? "var(--etihuku-error)"
          : "var(--etihuku-success)";

  return (
    <div
      className={cn(
        "card p-5 flex flex-col gap-3 relative overflow-hidden",
        isGold && "border-[rgba(209,160,57,0.3)]",
        className
      )}
    >
      {/* Gold glow for high quality scores */}
      {isGold && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at top right, rgba(209,160,57,0.06) 0%, transparent 70%)",
          }}
        />
      )}

      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <div
              className="w-8 h-8 rounded-[6px] flex items-center justify-center shrink-0"
              style={{
                backgroundColor: accentColor
                  ? `${accentColor}18`
                  : isGold
                    ? "rgba(209,160,57,0.12)"
                    : "rgba(80,70,229,0.12)",
              }}
            >
              <Icon
                size={16}
                style={{ color: accentColor ?? (isGold ? "var(--etihuku-gold)" : iconColor) }}
              />
            </div>
          )}
          <span className="text-label text-[var(--etihuku-gray-500)] truncate">{label}</span>
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-bold leading-none",
            isGold ? "text-[var(--etihuku-gold)]" : "text-[var(--etihuku-white)]",
            valueClassName
          )}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "28px",
          }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-[13px] text-[var(--etihuku-gray-500)] font-mono">
            {unit}
          </span>
        )}
      </div>

      {/* Description / trend row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {trend && (
            <div
              className="flex items-center gap-1 shrink-0"
              style={{ color: trendColor }}
            >
              {trend.direction === "up" ? (
                <TrendingUp size={13} />
              ) : trend.direction === "down" ? (
                <TrendingDown size={13} />
              ) : (
                <Minus size={13} />
              )}
              <span
                className="text-[12px] font-semibold font-mono"
                style={{ color: trendColor }}
              >
                {trend.value}
              </span>
            </div>
          )}
          {description && (
            <span className="text-[12px] text-[var(--etihuku-gray-500)] truncate">
              {description}
            </span>
          )}
        </div>
      </div>

      {/* Sparkline */}
      {sparkline && sparkline.length > 0 && (
        <div className="h-10 -mx-1 mt-auto">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkline} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={isGold ? "var(--etihuku-gold)" : sparklineColor}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={isGold ? "var(--etihuku-gold)" : sparklineColor}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--etihuku-gray-800)",
                  border: "1px solid var(--etihuku-gray-700)",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--etihuku-white)",
                  padding: "4px 8px",
                }}
                itemStyle={{ color: "var(--etihuku-gray-200)" }}
                cursor={false}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={isGold ? "var(--etihuku-gold)" : sparklineColor}
                strokeWidth={1.5}
                fill={`url(#grad-${label})`}
                dot={false}
                activeDot={{ r: 3, fill: isGold ? "var(--etihuku-gold)" : sparklineColor }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
