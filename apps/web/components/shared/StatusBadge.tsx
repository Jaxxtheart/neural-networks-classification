import React from "react";
import { cn } from "@/lib/utils/cn";

export type Status = "success" | "running" | "failed" | "warning" | "draft" | "pending";

interface StatusBadgeProps {
  status: Status;
  label?: string;
  className?: string;
  showDot?: boolean;
}

const STATUS_CONFIG: Record<
  Status,
  { label: string; dotColor: string; badgeClass: string }
> = {
  success: {
    label: "Success",
    dotColor: "var(--etihuku-success)",
    badgeClass: "badge-success",
  },
  running: {
    label: "Running",
    dotColor: "var(--etihuku-indigo-light)",
    badgeClass: "badge-running",
  },
  failed: {
    label: "Failed",
    dotColor: "var(--etihuku-error)",
    badgeClass: "badge-failed",
  },
  warning: {
    label: "Warning",
    dotColor: "var(--etihuku-warning)",
    badgeClass: "badge-warning",
  },
  draft: {
    label: "Draft",
    dotColor: "var(--etihuku-gray-400)",
    badgeClass: "badge-draft",
  },
  pending: {
    label: "Pending",
    dotColor: "var(--etihuku-gray-500)",
    badgeClass: "badge-draft",
  },
};

export default function StatusBadge({
  status,
  label,
  className,
  showDot = true,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const displayLabel = label ?? config.label;

  return (
    <span className={cn("badge", config.badgeClass, className)}>
      {showDot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            status === "running" && "animate-pulse"
          )}
          style={{ backgroundColor: config.dotColor }}
        />
      )}
      {displayLabel}
    </span>
  );
}
