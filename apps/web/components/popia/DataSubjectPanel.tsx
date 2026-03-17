"use client";

import { useState, useMemo } from "react";
import { User, Download, Trash2, Edit2, Send, Clock, CheckCircle2, AlertTriangle, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type DSRType = "access" | "deletion" | "rectification" | "portability" | "objection";
type DSRStatus = "new" | "in-progress" | "awaiting-verification" | "completed" | "rejected" | "escalated";

interface DSR {
  id: string;
  subject: string;
  email: string;
  type: DSRType;
  status: DSRStatus;
  submittedAt: string;
  dueAt: string;
  assignedTo: string;
  notes?: string;
  datasets: string[];
  overdue: boolean;
}

const DSR_TYPE_CONFIG: Record<DSRType, { label: string; icon: React.ElementType; color: string; slaHours: number }> = {
  access:          { label: "Right of Access",       icon: Download, color: "#3B82F6", slaHours: 240 },
  deletion:        { label: "Right to Erasure",      icon: Trash2,   color: "#EF4444", slaHours: 240 },
  rectification:   { label: "Right to Rectify",      icon: Edit2,    color: "#F59E0B", slaHours: 240 },
  portability:     { label: "Data Portability",       icon: Send,     color: "#8B5CF6", slaHours: 240 },
  objection:       { label: "Right to Object",        icon: AlertTriangle, color: "#EC4899", slaHours: 120 },
};

const DSR_STATUS_CONFIG: Record<DSRStatus, { label: string; color: string }> = {
  "new":                  { label: "New",                 color: "#6B7280" },
  "in-progress":          { label: "In Progress",         color: "#3B82F6" },
  "awaiting-verification":{ label: "Awaiting Verification",color: "#F59E0B"},
  "completed":            { label: "Completed",           color: "#10B981" },
  "rejected":             { label: "Rejected",            color: "#EF4444" },
  "escalated":            { label: "Escalated",           color: "#EC4899" },
};

const WORKFLOW_STEPS: Record<DSRType, string[]> = {
  access:        ["Verify identity", "Locate all data", "Compile report", "Review & redact", "Send to subject"],
  deletion:      ["Verify identity", "Locate all data", "Check retention obligations", "Delete from systems", "Confirm deletion"],
  rectification: ["Verify identity", "Identify incorrect data", "Update records", "Notify downstream systems", "Confirm with subject"],
  portability:   ["Verify identity", "Collect structured data", "Convert to JSON/CSV", "Encrypt transfer", "Send to subject"],
  objection:     ["Verify identity", "Assess grounds", "Pause processing", "Legal review", "Notify outcome"],
};

const MOCK_DSRS: DSR[] = [
  { id: "dsr1", subject: "Jane Doe",    email: "jane@example.com", type: "access",        status: "in-progress",           submittedAt: "2026-02-20", dueAt: "2026-03-02", assignedTo: "A. Smith", datasets: ["Customer DWH", "CDR Raw DB"], overdue: false },
  { id: "dsr2", subject: "T. Khumalo", email: "t.k@gmail.com",   type: "deletion",      status: "awaiting-verification", submittedAt: "2026-02-18", dueAt: "2026-02-28", assignedTo: "B. Jones", datasets: ["Customer DWH", "Mineworker DB", "CDR Raw DB"], overdue: false },
  { id: "dsr3", subject: "A. Naidoo",  email: "a.n@hotmail.com", type: "portability",   status: "completed",             submittedAt: "2026-02-10", dueAt: "2026-02-20", assignedTo: "A. Smith", datasets: ["Customer DWH"], overdue: false },
  { id: "dsr4", subject: "M. van Wyk", email: "mvw@work.co.za",  type: "rectification", status: "new",                   submittedAt: "2026-02-25", dueAt: "2026-03-07", assignedTo: "Unassigned", datasets: ["Customer DWH"], overdue: false },
  { id: "dsr5", subject: "L. Dlamini", email: "l.d@mobile.co",   type: "objection",     status: "escalated",             submittedAt: "2026-02-12", dueAt: "2026-02-17", assignedTo: "Legal Team", datasets: ["Customer DWH", "CDR Raw DB"], overdue: true },
  { id: "dsr6", subject: "P. Mokoena", email: "p.m@net.co.za",   type: "deletion",      status: "new",                   submittedAt: "2026-02-26", dueAt: "2026-03-08", assignedTo: "Unassigned", datasets: ["Customer DWH"], overdue: false },
];

export function DataSubjectPanel() {
  const [dsrs, setDsrs] = useState<DSR[]>(MOCK_DSRS);
  const [selected, setSelected] = useState<DSR | null>(null);
  const [filterStatus, setFilterStatus] = useState<DSRStatus | "all">("all");
  const [activeStep, setActiveStep] = useState<Record<string, number>>({});

  const filtered = useMemo(
    () => dsrs.filter(d => filterStatus === "all" || d.status === filterStatus),
    [dsrs, filterStatus]
  );

  const { overdue, openCount } = useMemo(() => ({
    overdue:   dsrs.filter(d => d.overdue).length,
    openCount: dsrs.filter(d => d.status !== "completed" && d.status !== "rejected").length,
  }), [dsrs]);

  function advanceStep(dsrId: string) {
    setActiveStep(prev => ({ ...prev, [dsrId]: (prev[dsrId] ?? 0) + 1 }));
    if ((activeStep[dsrId] ?? 0) >= (WORKFLOW_STEPS[selected!.type].length - 1)) {
      setDsrs(prev => prev.map(d => d.id === dsrId ? { ...d, status: "completed" } : d));
      setSelected(prev => prev ? { ...prev, status: "completed" } : null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Open Requests",  value: openCount, color: "#3B82F6" },
          { label: "Overdue",        value: overdue,   color: "#EF4444" },
          { label: "Completed (30d)",value: dsrs.filter(d => d.status === "completed").length, color: "#10B981" },
          { label: "Avg Days to Close",value: "8.2",   color: "#F59E0B" },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-[var(--etihuku-gray-800)] bg-[var(--etihuku-gray-900)] p-3 text-center">
            <div className="text-2xl font-display font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] text-[var(--etihuku-gray-500)] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* List */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex gap-1 flex-wrap">
              {(["all", "new", "in-progress", "awaiting-verification", "completed", "escalated"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={cn(
                    "px-2 py-0.5 rounded text-[9px] font-medium border transition-all capitalize",
                    filterStatus === s
                      ? "border-[var(--etihuku-indigo)] bg-[var(--etihuku-indigo)]/10 text-[var(--etihuku-indigo)]"
                      : "border-[var(--etihuku-gray-700)] text-[var(--etihuku-gray-400)]"
                  )}
                >{s === "all" ? "All" : DSR_STATUS_CONFIG[s]?.label}</button>
              ))}
            </div>
          </div>

          {filtered.map(dsr => {
            const tCfg = DSR_TYPE_CONFIG[dsr.type];
            const sCfg = DSR_STATUS_CONFIG[dsr.status];
            const Icon = tCfg.icon;
            return (
              <div
                key={dsr.id}
                onClick={() => setSelected(dsr)}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-all",
                  selected?.id === dsr.id
                    ? "border-[var(--etihuku-indigo)] bg-[var(--etihuku-indigo)]/5"
                    : "border-[var(--etihuku-gray-700)] bg-[var(--etihuku-gray-900)] hover:border-[var(--etihuku-gray-600)]",
                  dsr.overdue && "border-red-800/50 bg-red-950/10"
                )}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon size={12} style={{ color: tCfg.color }} />
                  <span className="text-xs font-medium text-white">{dsr.subject}</span>
                  {dsr.overdue && <span className="text-[9px] text-red-400 font-medium ml-auto">OVERDUE</span>}
                </div>
                <div className="text-[10px] text-[var(--etihuku-gray-400)]">{tCfg.label}</div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[9px] font-medium" style={{ color: sCfg.color }}>{sCfg.label}</span>
                  <span className="text-[9px] text-[var(--etihuku-gray-600)]">Due {dsr.dueAt}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail */}
        <div className="lg:col-span-3">
          {!selected ? (
            <div className="h-full flex items-center justify-center text-[var(--etihuku-gray-600)] text-sm">
              Select a request to view workflow
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-[var(--etihuku-gray-700)] bg-[var(--etihuku-gray-900)]">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{selected.subject}</div>
                    <div className="text-xs text-[var(--etihuku-gray-400)]">{selected.email}</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ color: DSR_TYPE_CONFIG[selected.type].color, backgroundColor: `${DSR_TYPE_CONFIG[selected.type].color}15` }}>
                    {DSR_TYPE_CONFIG[selected.type].label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-[var(--etihuku-gray-500)]">Submitted:</span> <span className="text-white">{selected.submittedAt}</span></div>
                  <div><span className="text-[var(--etihuku-gray-500)]">Due:</span> <span className="text-white">{selected.dueAt}</span></div>
                  <div><span className="text-[var(--etihuku-gray-500)]">Assigned:</span> <span className="text-white">{selected.assignedTo}</span></div>
                  <div><span className="text-[var(--etihuku-gray-500)]">SLA:</span> <span className="text-white">{DSR_TYPE_CONFIG[selected.type].slaHours / 24}d</span></div>
                </div>
                <div className="mt-3">
                  <div className="text-[10px] text-[var(--etihuku-gray-500)] mb-1">Affected datasets:</div>
                  <div className="flex flex-wrap gap-1">
                    {selected.datasets.map(ds => (
                      <span key={ds} className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--etihuku-gray-800)] text-[var(--etihuku-gray-400)] border border-[var(--etihuku-gray-700)]">{ds}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Workflow */}
              <div className="p-4 rounded-lg border border-[var(--etihuku-gray-700)] bg-[var(--etihuku-gray-900)]">
                <div className="text-xs font-medium text-[var(--etihuku-gray-400)] uppercase tracking-wide mb-3">Workflow</div>
                <div className="space-y-2">
                  {WORKFLOW_STEPS[selected.type].map((step, i) => {
                    const current = activeStep[selected.id] ?? 0;
                    const done = i < current;
                    const active = i === current;
                    return (
                      <div key={step} className="flex items-center gap-3">
                        <div className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold",
                          done   ? "bg-green-500 text-white" :
                          active ? "bg-[var(--etihuku-indigo)] text-white animate-pulse" :
                                   "bg-[var(--etihuku-gray-800)] text-[var(--etihuku-gray-500)]"
                        )}>
                          {done ? "✓" : i + 1}
                        </div>
                        <span className={cn("text-xs", done ? "text-[var(--etihuku-gray-500)] line-through" : active ? "text-white font-medium" : "text-[var(--etihuku-gray-500)]")}>
                          {step}
                        </span>
                        {active && selected.status !== "completed" && (
                          <button onClick={() => advanceStep(selected.id)} className="ml-auto btn btn-primary btn-sm text-xs">
                            Mark Done →
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
