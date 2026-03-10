"use client";

import { useState, useMemo } from "react";
import { Clock, AlertTriangle, Archive, Trash2, RefreshCw, Plus, CheckCircle2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";
import { VERTICAL_COMPLIANCE_RULES } from "@/lib/types/governance";

type RetentionAction = "delete" | "archive" | "anonymise" | "move";
type EnforcementStatus = "active" | "paused" | "pending_review";

interface RetentionPolicy {
  id: string;
  dataset: string;
  vertical: string;
  retentionDays: number;
  action: RetentionAction;
  enforcementStatus: EnforcementStatus;
  regulation: string;
  lastRun?: string;
  nextRun?: string;
  deletedRows?: number;
  archivedRows?: number;
  rowsApproachingExpiry: number;
}

interface EnforcementLog {
  id: string;
  dataset: string;
  runAt: string;
  action: RetentionAction;
  rowsAffected: number;
  status: "success" | "failed" | "partial";
}

const ACTION_CONFIG: Record<RetentionAction, { label: string; icon: React.ElementType; color: string }> = {
  delete:    { label: "Hard Delete",   icon: Trash2,    color: "#EF4444" },
  archive:   { label: "Archive",       icon: Archive,   color: "#6B7280" },
  anonymise: { label: "Anonymise",     icon: RefreshCw, color: "#8B5CF6" },
  move:      { label: "Move to Cold",  icon: Archive,   color: "#3B82F6" },
};

const ENFORCEMENT_STATUS_CONFIG: Record<EnforcementStatus, { color: string; label: string }> = {
  active:         { color: "#10B981", label: "Active" },
  paused:         { color: "#6B7280", label: "Paused" },
  pending_review: { color: "#F59E0B", label: "Pending Review" },
};

const MOCK_POLICIES: RetentionPolicy[] = [
  { id: "rp1", dataset: "CDR Raw DB",          vertical: "telecom",     retentionDays: 1095, action: "delete",    enforcementStatus: "active",         regulation: "RICA",    lastRun: "2026-02-01", nextRun: "2026-03-01", deletedRows: 1200000, archivedRows: 0,       rowsApproachingExpiry: 48000  },
  { id: "rp2", dataset: "Customer DWH",         vertical: "telecom",     retentionDays: 1825, action: "anonymise", enforcementStatus: "active",         regulation: "POPIA",   lastRun: "2026-02-15", nextRun: "2026-03-15", deletedRows: 0,        archivedRows: 0,       rowsApproachingExpiry: 12000  },
  { id: "rp3", dataset: "CCTV Training Set",    vertical: "security",    retentionDays: 365,  action: "delete",    enforcementStatus: "pending_review", regulation: "PSIRA",   lastRun: "2025-10-01", nextRun: "Pending",    deletedRows: 0,        archivedRows: 0,       rowsApproachingExpiry: 86000  },
  { id: "rp4", dataset: "Mineworker DB",        vertical: "mining",      retentionDays: 2555, action: "archive",   enforcementStatus: "active",         regulation: "MHSA",    lastRun: "2026-01-20", nextRun: "2026-07-20", deletedRows: 0,        archivedRows: 420,     rowsApproachingExpiry: 0      },
  { id: "rp5", dataset: "Safety Incident Logs", vertical: "mining",      retentionDays: 1825, action: "move",      enforcementStatus: "active",         regulation: "MHSA-23", lastRun: "2026-02-10", nextRun: "2026-08-10", deletedRows: 0,        archivedRows: 15000,   rowsApproachingExpiry: 2200   },
  { id: "rp6", dataset: "Inspection Training",  vertical: "engineering", retentionDays: 3650, action: "archive",   enforcementStatus: "active",         regulation: "ECSA",    lastRun: "2025-12-01", nextRun: "2026-12-01", deletedRows: 0,        archivedRows: 800,     rowsApproachingExpiry: 0      },
  { id: "rp7", dataset: "Network Probes",        vertical: "telecom",    retentionDays: 180,  action: "delete",    enforcementStatus: "active",         regulation: "Internal",lastRun: "2026-02-26", nextRun: "2026-03-07", deletedRows: 9200000,  archivedRows: 0,       rowsApproachingExpiry: 450000 },
];

const MOCK_LOGS: EnforcementLog[] = [
  { id: "l1", dataset: "Network Probes",  runAt: "2026-02-26 02:00", action: "delete",    rowsAffected: 9200000, status: "success" },
  { id: "l2", dataset: "CDR Raw DB",      runAt: "2026-02-01 02:00", action: "delete",    rowsAffected: 1200000, status: "success" },
  { id: "l3", dataset: "Customer DWH",    runAt: "2026-02-15 02:00", action: "anonymise", rowsAffected: 6800,    status: "success" },
  { id: "l4", dataset: "Mineworker DB",   runAt: "2026-01-20 02:00", action: "archive",   rowsAffected: 420,     status: "success" },
  { id: "l5", dataset: "Safety Incidents",runAt: "2026-02-10 02:00", action: "move",      rowsAffected: 15000,   status: "partial" },
];

export function RetentionPolicies() {
  const [policies, setPolicies] = useState<RetentionPolicy[]>(MOCK_POLICIES);
  const [activeTab, setActiveTab] = useState<"policies" | "log">("policies");
  const [showAdd, setShowAdd] = useState(false);

  function togglePause(id: string) {
    setPolicies(prev => prev.map(p =>
      p.id === id
        ? { ...p, enforcementStatus: p.enforcementStatus === "active" ? "paused" : "active" as EnforcementStatus }
        : p
    ));
  }

  const { totalApproaching, activeCount, pendingCount } = useMemo(() => ({
    totalApproaching: policies.reduce((s, p) => s + p.rowsApproachingExpiry, 0),
    activeCount:      policies.filter(p => p.enforcementStatus === "active").length,
    pendingCount:     policies.filter(p => p.enforcementStatus === "pending_review").length,
  }), [policies]);

  // Check policies against vertical-specific minimum retention rules
  const retentionViolations = useMemo(() => {
    const retentionRules = VERTICAL_COMPLIANCE_RULES.filter(r => r.category === "retention" && r.minRetentionDays);
    return retentionRules.flatMap(rule => {
      return policies
        .filter(p =>
          p.dataset.toLowerCase().includes(rule.dataPattern.toLowerCase()) &&
          rule.minRetentionDays !== undefined &&
          p.retentionDays < rule.minRetentionDays
        )
        .map(p => ({ rule, policy: p }));
    });
  }, [policies]);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active Policies",    value: activeCount.toString(),              color: "#10B981" },
          { label: "Pending Review",     value: pendingCount.toString(),             color: "#F59E0B" },
          { label: "Rows Expiring Soon", value: formatNumber(totalApproaching),      color: "#EF4444" },
          { label: "Enforcement Runs",   value: MOCK_LOGS.length.toString(),         color: "#8B5CF6" },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-[var(--etihuku-gray-800)] bg-[var(--etihuku-gray-900)] p-3 text-center">
            <div className="text-2xl font-display font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] text-[var(--etihuku-gray-500)] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {totalApproaching > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-800/30 bg-amber-950/10">
          <AlertTriangle size={14} className="text-amber-400 shrink-0" />
          <div className="flex-1 text-xs text-[var(--etihuku-gray-300)]">
            <strong className="text-white">{formatNumber(totalApproaching)} rows</strong> across multiple datasets are approaching their retention expiry date.
          </div>
          <button className="btn btn-secondary btn-sm text-xs shrink-0">Review</button>
        </div>
      )}

      {/* Vertical-specific compliance violations */}
      {retentionViolations.length > 0 && (
        <div className="rounded-lg border border-red-800/40 bg-red-950/10 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-red-800/30 bg-red-950/20">
            <ShieldAlert size={14} className="text-red-400 shrink-0" />
            <span className="text-xs font-semibold text-red-300">
              {retentionViolations.length} Regulatory Retention Violation{retentionViolations.length > 1 ? "s" : ""} Detected
            </span>
          </div>
          <div className="divide-y divide-red-900/30">
            {retentionViolations.map(({ rule, policy }) => (
              <div key={`${rule.id}-${policy.id}`} className="flex items-start gap-3 px-3 py-2.5">
                <div className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-800/40 shrink-0 mt-0.5">
                  {rule.regulation}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white">{policy.dataset}</div>
                  <div className="text-[10px] text-red-300 mt-0.5">
                    Policy: {policy.retentionDays}d — Required: ≥{rule.minRetentionDays}d
                  </div>
                  <div className="text-[10px] text-[var(--etihuku-gray-500)] mt-0.5">{rule.requirement}</div>
                </div>
                <button
                  onClick={() => setPolicies(prev => prev.map(p =>
                    p.id === policy.id ? { ...p, retentionDays: rule.minRetentionDays! } : p
                  ))}
                  className="btn btn-sm text-[10px] border border-red-700 text-red-300 hover:bg-red-900/30 shrink-0"
                >
                  Fix
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-1 border-b border-[var(--etihuku-gray-800)]">
          {(["policies", "log"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={cn("px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize transition-all",
              activeTab === tab ? "border-[var(--etihuku-indigo)] text-[var(--etihuku-indigo)]" : "border-transparent text-[var(--etihuku-gray-400)] hover:text-white"
            )}>{tab === "log" ? "Enforcement Log" : "Policies"}</button>
          ))}
        </div>
        {activeTab === "policies" && (
          <button onClick={() => setShowAdd(v => !v)} className="btn btn-secondary btn-sm text-xs flex items-center gap-1">
            <Plus size={11} /> New Policy
          </button>
        )}
      </div>

      {activeTab === "policies" && (
        <div className="space-y-2">
          {policies.map(policy => {
            const actCfg = ACTION_CONFIG[policy.action];
            const ActIcon = actCfg.icon;
            const stsCfg = ENFORCEMENT_STATUS_CONFIG[policy.enforcementStatus];
            const years = (policy.retentionDays / 365).toFixed(1);
            return (
              <div key={policy.id} className={cn("flex items-center gap-3 px-4 py-3 rounded-lg border transition-all",
                policy.enforcementStatus === "active" ? "border-[var(--etihuku-gray-700)]" :
                policy.enforcementStatus === "pending_review" ? "border-amber-800/40 bg-amber-950/5" :
                "border-[var(--etihuku-gray-800)] opacity-60"
              )}>
                <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${actCfg.color}15` }}>
                  <ActIcon size={13} style={{ color: actCfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{policy.dataset}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--etihuku-gray-800)] text-[var(--etihuku-gray-500)]">{policy.regulation}</span>
                  </div>
                  <div className="text-[10px] text-[var(--etihuku-gray-500)] mt-0.5">
                    Retain {policy.retentionDays}d ({years}y) → {actCfg.label}
                    {policy.lastRun && ` · Last run: ${policy.lastRun}`}
                    {policy.nextRun && ` · Next: ${policy.nextRun}`}
                    {policy.rowsApproachingExpiry > 0 && <span className="text-amber-400"> · {formatNumber(policy.rowsApproachingExpiry)} expiring soon</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-medium" style={{ color: stsCfg.color }}>{stsCfg.label}</span>
                  <button
                    onClick={() => togglePause(policy.id)}
                    className={cn("text-[10px] btn btn-secondary btn-sm")}
                  >
                    {policy.enforcementStatus === "active" ? "Pause" : "Activate"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "log" && (
        <div className="overflow-x-auto rounded-lg border border-[var(--etihuku-gray-800)]">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--etihuku-gray-800)] bg-[var(--etihuku-gray-900)]">
                {["Dataset", "Run At", "Action", "Rows Affected", "Status"].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left font-medium text-[var(--etihuku-gray-400)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--etihuku-gray-800)]">
              {MOCK_LOGS.map(log => {
                const actCfg = ACTION_CONFIG[log.action];
                const ActIcon = actCfg.icon;
                return (
                  <tr key={log.id} className="hover:bg-[var(--etihuku-gray-900)]/50">
                    <td className="px-3 py-2 text-white">{log.dataset}</td>
                    <td className="px-3 py-2 font-mono text-[var(--etihuku-gray-400)]">{log.runAt}</td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1 text-[10px]" style={{ color: actCfg.color }}>
                        <ActIcon size={10} /> {actCfg.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-white">{formatNumber(log.rowsAffected)}</td>
                    <td className="px-3 py-2">
                      <span className={cn("flex items-center gap-1 text-[10px] font-medium",
                        log.status === "success" ? "text-green-400" : log.status === "partial" ? "text-amber-400" : "text-red-400"
                      )}>
                        {log.status === "success" ? <><CheckCircle2 size={10} /> Success</> : log.status === "partial" ? <><AlertTriangle size={10} /> Partial</> : "Failed"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
