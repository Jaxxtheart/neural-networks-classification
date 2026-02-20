"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

interface QualityScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 90) return "#D1A039"; // gold
  if (score >= 70) return "#7B73FF"; // indigo-light
  if (score >= 50) return "#F59E0B"; // warning
  return "#EF4444";                   // error
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Poor";
}

const SIZE_CONFIG = {
  sm: { size: 48, stroke: 4, fontSize: "10px", lineHeight: "12px" },
  md: { size: 64, stroke: 5, fontSize: "14px", lineHeight: "16px" },
  lg: { size: 84, stroke: 6, fontSize: "18px", lineHeight: "20px" },
};

export default function QualityScore({
  score,
  size = "md",
  showLabel = true,
  className,
}: QualityScoreProps) {
  const config = SIZE_CONFIG[size];
  const color = getScoreColor(score);
  const label = getScoreLabel(score);
  const clamped = Math.max(0, Math.min(100, score));

  const radius = (config.size - config.stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clamped / 100) * circumference;
  const center = config.size / 2;

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="relative" style={{ width: config.size, height: config.size }}>
        <svg
          width={config.size}
          height={config.size}
          viewBox={`0 0 ${config.size} ${config.size}`}
          className="-rotate-90"
        >
          {/* Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--etihuku-gray-700)"
            strokeWidth={config.stroke}
          />
          {/* Progress */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        {/* Score label */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <span
            className="font-bold text-white leading-none"
            style={{ fontSize: config.fontSize, color }}
          >
            {clamped}
          </span>
        </div>
      </div>
      {showLabel && (
        <span
          className="text-caption"
          style={{ color }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
