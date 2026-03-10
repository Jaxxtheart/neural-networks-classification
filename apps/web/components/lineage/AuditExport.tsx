"use client";

import { useState, useRef, useEffect } from "react";
import { FileText, Download, Clock, CheckCircle2 } from "lucide-react";
import { ToggleSwitch } from "@/components/shared/ToggleSwitch";
import { cn } from "@/lib/utils/cn";
import { formatDateTime } from "@/lib/utils/format";

interface ExportRecord {
  id: string;
  title: string;
  generatedAt: string;
  generatedBy: string;
  scope: string;
  pages: number;
  status: "ready" | "generating" | "failed";
  format: "PDF" | "JSON" | "CSV";
}

const MOCK_EXPORTS: ExportRecord[] = [
  { id: "e1", title: "Full Lineage Report — Feb 2026",    generatedAt: "2026-02-26 08:00", generatedBy: "Admin",         scope: "All verticals", pages: 42, status: "ready",     format: "PDF"  },
  { id: "e2", title: "Telecom Compliance Lineage",         generatedAt: "2026-02-25 14:30", generatedBy: "J. Smith",      scope: "Telecom",       pages: 18, status: "ready",     format: "PDF"  },
  { id: "e3", title: "POPIA Audit Export — Q1 2026",      generatedAt: "2026-02-24 09:15", generatedBy: "Compliance Mgr",scope: "All verticals", pages: 67, status: "ready",     format: "PDF"  },
  { id: "e4", title: "Raw Lineage Graph Data",             generatedAt: "2026-02-23 11:00", generatedBy: "Data Engineer", scope: "All verticals", pages:  0, status: "ready",     format: "JSON" },
  { id: "e5", title: "Mining Sensor Lineage",              generatedAt: "Generating…",      generatedBy: "Auto-schedule", scope: "Mining",        pages:  0, status: "generating", format: "PDF"  },
];

const SCOPE_OPTIONS = ["All verticals", "Telecom", "Security", "Mining", "Engineering"];
const FORMAT_OPTIONS = ["PDF", "JSON", "CSV"] as const;
const DATE_RANGES = ["Last 7 days", "Last 30 days", "Last 90 days", "Custom"];

export function AuditExport() {
  const [scope, setScope] = useState("All verticals");
  const [format, setFormat] = useState<"PDF" | "JSON" | "CSV">("PDF");
  const [dateRange, setDateRange] = useState("Last 30 days");
  const [includeLineage, setIncludeLineage] = useState(true);
  const [includePOPIA, setIncludePOPIA] = useState(true);
  const [includeAccess, setIncludeAccess] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exports, setExports] = useState<ExportRecord[]>(MOCK_EXPORTS);
  const generateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any in-flight timer on unmount to avoid state-update-on-unmounted-component
  useEffect(() => () => { if (generateTimerRef.current) clearTimeout(generateTimerRef.current); }, []);

  function handleGenerate() {
    if (isGenerating) return;
    setIsGenerating(true);
    const id = `e${Date.now()}`;
    const now = new Date();
    const monthYear = now.toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
    const newExport: ExportRecord = {
      id,
      title: `${scope} Lineage Report — ${monthYear}`,
      generatedAt: "Generating…",
      generatedBy: "You",
      scope,
      pages: 0,
      status: "generating",
      format,
    };
    setExports(prev => [newExport, ...prev]);
    generateTimerRef.current = setTimeout(() => {
      setExports(prev => prev.map(e =>
        e.id === id
          ? { ...e, generatedAt: formatDateTime(new Date()), pages: 28, status: "ready" }
          : e
      ));
      setIsGenerating(false);
    }, 2500);
  }

  return (
    <div className="space-y-5">
      {/* Generate form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border border-[var(--etihuku-gray-700)] bg-[var(--etihuku-gray-900)]/50">
        <div className="space-y-3">
          <div className="text-sm font-semibold text-white">Generate Compliance Report</div>

          <div className="space-y-1">
            <label className="text-xs text-[var(--etihuku-gray-400)]">Scope</label>
            <select className="form-input text-xs" value={scope} onChange={e => setScope(e.target.value)}>
              {SCOPE_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[var(--etihuku-gray-400)]">Format</label>
            <div className="flex gap-1.5">
              {FORMAT_OPTIONS.map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={cn(
                    "px-3 py-1.5 rounded text-xs font-medium border transition-all",
                    format === f
                      ? "border-[var(--etihuku-indigo)] bg-[var(--etihuku-indigo)]/10 text-[var(--etihuku-indigo)]"
                      : "border-[var(--etihuku-gray-700)] text-[var(--etihuku-gray-400)] hover:border-[var(--etihuku-gray-500)]"
                  )}
                >{f}</button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[var(--etihuku-gray-400)]">Date Range</label>
            <select className="form-input text-xs" value={dateRange} onChange={e => setDateRange(e.target.value)}>
              {DATE_RANGES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold text-white opacity-0">·</div>
          <div className="text-xs text-[var(--etihuku-gray-400)] font-medium">Include sections:</div>
          {[
            { label: "Data Lineage Graph",  value: includeLineage, set: setIncludeLineage },
            { label: "POPIA Compliance",     value: includePOPIA,  set: setIncludePOPIA   },
            { label: "Access Control Audit", value: includeAccess, set: setIncludeAccess  },
          ].map(item => (
            <ToggleSwitch key={item.label} checked={item.value} onChange={item.set} label={item.label} />
          ))}

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn btn-primary w-full mt-4 flex items-center justify-center gap-2 text-sm"
          >
            <FileText size={14} />
            {isGenerating ? "Generating…" : "Generate Report"}
          </button>
        </div>
      </div>

      {/* Export history */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-[var(--etihuku-gray-400)] uppercase tracking-wide">Export History</div>
        <div className="space-y-2">
          {exports.map(exp => (
            <div key={exp.id} className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg border transition-all",
              exp.status === "ready"      ? "border-[var(--etihuku-gray-700)] bg-[var(--etihuku-gray-900)]" :
              exp.status === "generating" ? "border-[var(--etihuku-indigo)]/30 bg-[var(--etihuku-indigo)]/5" :
                                           "border-red-800/30 bg-red-950/10"
            )}>
              <div className="shrink-0">
                {exp.status === "ready"      && <CheckCircle2 size={16} className="text-green-400" />}
                {exp.status === "generating" && <Clock size={16} className="text-[var(--etihuku-indigo)] animate-pulse" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{exp.title}</div>
                <div className="text-[10px] text-[var(--etihuku-gray-500)] mt-0.5">
                  {exp.generatedAt} · {exp.generatedBy} · {exp.scope}
                  {exp.pages > 0 && ` · ${exp.pages} pages`}
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-[var(--etihuku-gray-800)] text-[var(--etihuku-gray-400)] border border-[var(--etihuku-gray-700)]">
                  {exp.format}
                </span>
                {exp.status === "ready" && (
                  <button className="btn btn-secondary btn-sm text-xs flex items-center gap-1">
                    <Download size={11} /> Download
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
