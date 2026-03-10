import { cn } from "@/lib/utils/cn";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: "sm" | "md";
  disabled?: boolean;
  label?: string;
  className?: string;
}

/**
 * Reusable toggle switch. Replaces the inline div-based toggle pattern
 * used across governance components.
 */
export function ToggleSwitch({
  checked,
  onChange,
  size = "md",
  disabled = false,
  label,
  className,
}: ToggleSwitchProps) {
  const track =
    size === "sm"
      ? { track: "w-7 h-3.5", thumb: "w-2.5 h-2.5", on: "left-3.5", off: "left-0.5" }
      : { track: "w-8 h-4",   thumb: "w-3 h-3",     on: "left-4",   off: "left-0.5" };

  const toggle = (
    <div
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative rounded-full transition-colors cursor-pointer shrink-0",
        track.track,
        checked ? "bg-[var(--etihuku-indigo)]" : "bg-[var(--etihuku-gray-700)]",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div
        className={cn(
          "absolute top-0.5 rounded-full bg-white transition-all",
          track.thumb,
          checked ? track.on : track.off
        )}
      />
    </div>
  );

  if (!label) return toggle;

  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      {toggle}
      <span className="text-xs text-[var(--etihuku-gray-300)] group-hover:text-white select-none">
        {label}
      </span>
    </label>
  );
}
