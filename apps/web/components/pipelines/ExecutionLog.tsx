"use client";

import { useState, useEffect, useRef } from "react";
import {
  Play, Square, RefreshCw, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, AlertCircle, Info, Clock, Zap
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

type LogLevel = "info" | "warn" | "error" | "success" | "debug";

interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  node?: string;
  message: string;
}

const LEVEL_CONFIG: Record<LogLevel, { icon: React.ElementType; color: string; bg: string }> = {
  info:    { icon: Info,         color: "#3B82F6", bg: "bg-blue-950/30"   },
  warn:    { icon: AlertCircle,  color: "#F59E0B", bg: "bg-amber-950/30"  },
  error:   { icon: XCircle,      color: "#EF4444", bg: "bg-red-950/30"    },
  success: { icon: CheckCircle2, color: "#10B981", bg: "bg-green-950/30"  },
  debug:   { icon: Info,         color: "#6B6B88", bg: ""                 },
};

const MOCK_COMPLETED_LOG: LogEntry[] = [
  { id: "l1",  timestamp: "14:22:00.001", level: "info",    node: "CDR Source",     message: "Initiating connection to PostgreSQL prod-db.telco.local:5432" },
  { id: "l2",  timestamp: "14:22:00.234", level: "success", node: "CDR Source",     message: "Connected. Executing query — estimated 12,840 rows" },
  { id: "l3",  timestamp: "14:22:00.891", level: "info",    node: "CDR Source",     message: "Batch 1/3 fetched — 5,000 rows (38.9%)" },
  { id: "l4",  timestamp: "14:22:01.234", level: "info",    node: "CDR Source",     message: "Batch 2/3 fetched — 5,000 rows (77.8%)" },
  { id: "l5",  timestamp: "14:22:01.567", level: "info",    node: "CDR Source",     message: "Batch 3/3 fetched — 2,840 rows (100%)" },
  { id: "l6",  timestamp: "14:22:01.601", level: "success", node: "CDR Source",     message: "Source complete — 12,840 rows loaded in 1.6s" },
  { id: "l7",  timestamp: "14:22:01.605", level: "info",    node: "Join & Enrich",  message: "Starting join on customer_id" },
  { id: "l8",  timestamp: "14:22:01.890", level: "warn",    node: "Join & Enrich",  message: "342 rows (2.7%) unmatched — no customer record found" },
  { id: "l9",  timestamp: "14:22:02.012", level: "success", node: "Join & Enrich",  message: "Join complete — 12,498 rows output" },
  { id: "l10", timestamp: "14:22:02.020", level: "info",    node: "Feature Eng.",   message: "Computing rolling 7-day windows (call_duration, data_usage)" },
  { id: "l11", timestamp: "14:22:02.780", level: "info",    node: "Feature Eng.",   message: "Computing lag features (1d, 3d, 7d)" },
  { id: "l12", timestamp: "14:22:03.100", level: "success", node: "Feature Eng.",   message: "Feature engineering complete — 24 features generated" },
  { id: "l13", timestamp: "14:22:03.105", level: "info",    node: "Quality Check",  message: "Running quality gates — threshold: 85/100" },
  { id: "l14", timestamp: "14:22:03.450", level: "success", node: "Quality Check",  message: "Quality score: 91.3 ✓ Gate passed" },
  { id: "l15", timestamp: "14:22:03.460", level: "info",    node: "Churn Features", message: "Writing 12,498 rows to feature store" },
  { id: "l16", timestamp: "14:22:04.120", level: "success", node: "Churn Features", message: "✓ Pipeline complete — 12,498 rows · 4.1s · 24 features" },
];

const STREAMING_MESSAGES: { level: LogLevel; node: string; message: string }[] = [
  { level: "info",    node: "CDR Source",    message: "Initiating connection to PostgreSQL prod-db.telco.local:5432" },
  { level: "success", node: "CDR Source",    message: "Connected. Executing query — estimated 12,840 rows" },
  { level: "info",    node: "CDR Source",    message: "Batch 1/3 fetched — 5,000 rows" },
  { level: "info",    node: "CDR Source",    message: "Batch 2/3 fetched — 5,000 rows" },
  { level: "success", node: "CDR Source",    message: "Source complete — 12,840 rows in 1.6s" },
  { level: "info",    node: "Join & Enrich", message: "Starting join on customer_id" },
  { level: "warn",    node: "Join & Enrich", message: "342 rows unmatched — no customer record found" },
  { level: "success", node: "Join & Enrich", message: "Join complete — 12,498 rows output" },
  { level: "info",    node: "Feature Eng.", message: "Computing rolling windows and lag features…" },
  { level: "success", node: "Feature Eng.", message: "24 features generated" },
  { level: "info",    node: "Quality Check", message: "Running quality gates (threshold: 85)" },
  { level: "success", node: "Quality Check", message: "Quality score: 91.3 ✓ Gate passed" },
  { level: "success", node: "Destination",   message: "✓ Pipeline complete — 12,498 rows written" },
];

interface ExecutionLogProps {
  pipelineName?: string;
}

export function ExecutionLog({ pipelineName = "CDR Processing Pipeline" }: ExecutionLogProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>(MOCK_COMPLETED_LOG.slice(0, 8));
  const [showAll, setShowAll] = useState(false);
  const [filterLevel, setFilterLevel] = useState<LogLevel | "all">("all");
  const [elapsedMs, setElapsedMs] = useState(4100);
  const logEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  function startRun() {
    setIsRunning(true);
    setLogs([]);
    setElapsedMs(0);
    startTimeRef.current = Date.now();

    // Elapsed timer
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 100);

    // Stream log entries
    STREAMING_MESSAGES.forEach((msg, i) => {
      setTimeout(() => {
        const now = new Date();
        const ts = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}.${String(now.getMilliseconds()).padStart(3, "0")}`;
        setLogs(prev => [...prev, { id: `live-${i}`, timestamp: ts, level: msg.level, node: msg.node, message: msg.message }]);

        if (i === STREAMING_MESSAGES.length - 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsRunning(false);
        }
      }, i * 350 + Math.random() * 80);
    });
  }

  function stopRun() {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setLogs(prev => [...prev, {
      id: "stop", timestamp: new Date().toISOString().slice(11, 23).replace("T", ""),
      level: "warn", message: "Execution stopped by user"
    }]);
  }

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const filteredLogs = logs.filter(l => filterLevel === "all" || l.level === filterLevel);
  const displayedLogs = showAll ? filteredLogs : filteredLogs.slice(-20);

  const errorCount = logs.filter(l => l.level === "error").length;
  const warnCount = logs.filter(l => l.level === "warn").length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-2.5 h-2.5 rounded-full",
            isRunning ? "bg-[var(--etihuku-indigo)] animate-pulse" : logs.some(l => l.level === "error") ? "bg-red-500" : "bg-green-500"
          )} />
          <span className="text-sm font-medium text-white">{pipelineName}</span>
          <span className="text-xs text-[var(--etihuku-gray-500)] font-mono">
            {isRunning ? `${(elapsedMs / 1000).toFixed(1)}s` : `${(elapsedMs / 1000).toFixed(1)}s`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Stats */}
          {warnCount > 0 && (
            <span className="text-xs text-amber-400 flex items-center gap-1">
              <AlertCircle size={12} /> {warnCount}
            </span>
          )}
          {errorCount > 0 && (
            <span className="text-xs text-red-400 flex items-center gap-1">
              <XCircle size={12} /> {errorCount}
            </span>
          )}

          {/* Level filter */}
          <select
            value={filterLevel}
            onChange={e => setFilterLevel(e.target.value as LogLevel | "all")}
            className="form-input text-xs py-1 px-2 h-7"
          >
            <option value="all">All Levels</option>
            {(["info", "success", "warn", "error", "debug"] as LogLevel[]).map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          {isRunning ? (
            <button onClick={stopRun} className="flex items-center gap-1.5 px-3 py-1 rounded bg-red-950 border border-red-800 text-red-300 text-xs hover:bg-red-900 transition-all">
              <Square size={12} /> Stop
            </button>
          ) : (
            <button onClick={startRun} className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs">
              <Play size={12} /> Run Now
            </button>
          )}
        </div>
      </div>

      {/* Log output */}
      <div className="bg-[var(--etihuku-black)] rounded-lg border border-[var(--etihuku-gray-800)] overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--etihuku-gray-800)]">
          <span className="text-[10px] text-[var(--etihuku-gray-600)] font-mono uppercase tracking-wider">
            Execution Log — {logs.length} entries
          </span>
          {filteredLogs.length > 20 && (
            <button onClick={() => setShowAll(s => !s)} className="text-[10px] text-[var(--etihuku-indigo)] hover:underline flex items-center gap-1">
              {showAll ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              {showAll ? "Show recent" : `Show all ${filteredLogs.length}`}
            </button>
          )}
        </div>

        <div className="max-h-72 overflow-y-auto font-mono text-xs">
          {displayedLogs.length === 0 && (
            <div className="text-center py-10 text-[var(--etihuku-gray-600)]">
              No log entries yet. Click Run Now to start.
            </div>
          )}
          {displayedLogs.map(entry => {
            const levelCfg = LEVEL_CONFIG[entry.level];
            const LevelIcon = levelCfg.icon;
            return (
              <div
                key={entry.id}
                className={cn(
                  "flex items-start gap-3 px-3 py-1.5 border-b border-[var(--etihuku-gray-900)] last:border-0 hover:bg-[var(--etihuku-gray-900)]/50 transition-colors",
                  entry.level === "error" && "bg-red-950/10",
                  entry.level === "warn" && "bg-amber-950/10",
                )}
              >
                <span className="text-[var(--etihuku-gray-700)] shrink-0 mt-px">{entry.timestamp}</span>
                <LevelIcon size={11} className="shrink-0 mt-0.5" style={{ color: levelCfg.color }} />
                {entry.node && (
                  <span className="shrink-0 text-[var(--etihuku-gray-500)]">[{entry.node}]</span>
                )}
                <span style={{ color: entry.level === "error" ? "#EF4444" : entry.level === "warn" ? "#F59E0B" : entry.level === "success" ? "#10B981" : "var(--etihuku-gray-300)" }}>
                  {entry.message}
                </span>
              </div>
            );
          })}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* Run history */}
      <div>
        <div className="text-xs font-medium text-[var(--etihuku-gray-400)] uppercase tracking-wide mb-2">Recent Runs</div>
        <div className="space-y-1">
          {[
            { time: "14:22:00", duration: "4.1s", status: "success", records: "12,498" },
            { time: "13:07:00", duration: "4.4s", status: "success", records: "11,923" },
            { time: "12:00:00", duration: "7.2s", status: "failed",  records: "—"      },
            { time: "11:00:00", duration: "3.9s", status: "success", records: "13,102" },
          ].map((run, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[var(--etihuku-gray-800)] transition-colors">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                run.status === "success" ? "bg-green-500" : "bg-red-500"
              )} />
              <span className="text-xs font-mono text-[var(--etihuku-gray-400)]">{run.time}</span>
              <span className="text-xs font-mono text-[var(--etihuku-gray-600)]">{run.duration}</span>
              <span className="flex-1 text-xs text-[var(--etihuku-gray-500)]">{run.records} rows</span>
              <span className={cn("text-xs font-medium", run.status === "success" ? "text-green-400" : "text-red-400")}>
                {run.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
