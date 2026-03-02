"use client";

import { useState } from "react";
import { AlertTriangle, Shield, CheckCircle2, Clock, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Severity = "critical" | "high" | "medium" | "low";
type BreachStatus = "open" | "investigating" | "contained" | "reported" | "closed";

interface Breach {
  id: string;
  title: string;
  discoveredAt: string;
  reportedAt?: string;
  severity: Severity;
  status: BreachStatus;
  affectedSubjects: number;
  dataTypes: string[];
  description: string;
  regulator?: string;
  regulatorNotifiedAt?: string;
  daysToNotify?: number;
  expanded?: boolean;
}

const SEV_CONFIG: Record<Severity, { color: string; bg: string; label: string }> = {
  critical: { color: "#EF4444", bg: "bg-red-950/40",    label: "Critical" },
  high:     { color: "#F59E0B", bg: "bg-amber-950/30",  label: "High" },
  medium:   { color: "#8B5CF6", bg: "bg-violet-950/20", label: "Medium" },
  low:      { color: "#3B82F6", bg: "bg-blue-950/20",   label: "Low" },
};

const STATUS_CONFIG: Record<BreachStatus, { color: string; label: string; icon: React.ElementType }> = {
  open:         { color: "#EF4444", label: "Open",         icon: AlertTriangle },
  investigating:{ color: "#F59E0B", label: "Investigating",icon: Clock },
  contained:    { color: "#8B5CF6", label: "Contained",    icon: Shield },
  reported:     { color: "#3B82F6", label: "Reported to Regulator", icon: CheckCircle2 },
  closed:       { color: "#10B981", label: "Closed",       icon: CheckCircle2 },
};

const MOCK_BREACHES: Breach[] = [
  {
    id: "b1",
    title: "Unauthorised CDR export detected",
    discoveredAt: "2026-01-14 09:22",
    reportedAt: "2026-01-16 14:00",
    severity: "critical",
    status: "reported",
    affectedSubjects: 14000,
    dataTypes: ["MSISDN", "Call Records", "Location Data"],
    description: "An API misconfiguration allowed an external IP to download 14,000 CDR records without authentication. Data included MSISDNs and approximate location data.",
    regulator: "Information Regulator (South Africa)",
    regulatorNotifiedAt: "2026-01-16 14:00",
    daysToNotify: 2,
  },
  {
    id: "b2",
    title: "CCTV footage backup exposed",
    discoveredAt: "2025-11-03 14:00",
    severity: "high",
    status: "closed",
    affectedSubjects: 320,
    dataTypes: ["Biometric Data (Face)", "Location"],
    description: "An S3 bucket containing CCTV footage backups was temporarily set to public. Exposure window was 4 hours. No evidence of exfiltration.",
    regulator: "Information Regulator (South Africa)",
    regulatorNotifiedAt: "2025-11-05 10:30",
    daysToNotify: 2,
  },
  {
    id: "b3",
    title: "Employee database phishing attack",
    discoveredAt: "2026-02-10 08:45",
    severity: "medium",
    status: "investigating",
    affectedSubjects: 45,
    dataTypes: ["Full Name", "ID Number", "Bank Account"],
    description: "A phishing email compromised 3 employee credentials. Internal HR database accessed. Scope assessment in progress.",
  },
  {
    id: "b4",
    title: "SQL injection in legacy portal",
    discoveredAt: "2026-02-22 16:00",
    severity: "high",
    status: "contained",
    affectedSubjects: 0,
    dataTypes: ["Customer Names", "Email Addresses"],
    description: "A SQL injection vulnerability was discovered in the legacy customer portal. Vulnerability patched; no confirmed data exfiltration detected.",
  },
];

const POPIA_SLA_HOURS = 72; // POPIA requires notification within 72 hours

export function BreachRegister() {
  const [breaches, setBreaches] = useState<Breach[]>(MOCK_BREACHES);
  const [expandedId, setExpandedId] = useState<string | null>("b1");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newBreach, setNewBreach] = useState({ title: "", severity: "medium" as Severity, description: "", affectedSubjects: "" });

  function toggleExpand(id: string) {
    setExpandedId(prev => prev === id ? null : id);
  }

  function addBreach() {
    const id = `b${Date.now()}`;
    setBreaches(prev => [{
      id, title: newBreach.title, severity: newBreach.severity, status: "open",
      discoveredAt: new Date().toLocaleString(), affectedSubjects: parseInt(newBreach.affectedSubjects) || 0,
      dataTypes: [], description: newBreach.description,
    }, ...prev]);
    setNewBreach({ title: "", severity: "medium", description: "", affectedSubjects: "" });
    setShowNewForm(false);
  }

  const openCount = breaches.filter(b => !["closed"].includes(b.status)).length;
  const criticalCount = breaches.filter(b => b.severity === "critical").length;

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Open Incidents",    value: openCount,      color: "#EF4444" },
          { label: "Critical Severity", value: criticalCount,  color: "#F59E0B" },
          { label: "Total Registered",  value: breaches.length,color: "#6B7280" },
          { label: "Avg Notify Time",   value: "1.7d",         color: "#10B981" },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-[var(--etihuku-gray-800)] bg-[var(--etihuku-gray-900)] p-3 text-center">
            <div className="text-2xl font-display font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] text-[var(--etihuku-gray-500)] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* POPIA notice */}
      <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-800/30 bg-amber-950/10">
        <AlertTriangle size={14} className="text-amber-400 shrink-0" />
        <div className="text-xs text-[var(--etihuku-gray-300)]">
          <strong className="text-white">POPIA Section 22:</strong> The Information Regulator must be notified of a breach <strong className="text-amber-300">within 72 hours</strong> of discovery. Data subjects must be notified as soon as reasonably possible.
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-[var(--etihuku-gray-400)] uppercase tracking-wide">Breach Register</div>
        <button onClick={() => setShowNewForm(v => !v)} className="btn btn-secondary btn-sm text-xs flex items-center gap-1">
          <Plus size={11} /> Log Incident
        </button>
      </div>

      {showNewForm && (
        <div className="p-4 rounded-lg border border-[var(--etihuku-indigo)]/30 bg-[var(--etihuku-indigo)]/5 space-y-3">
          <div className="text-sm font-semibold text-white">New Breach Incident</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-[var(--etihuku-gray-400)]">Title</label>
              <input className="form-input text-xs" placeholder="Brief incident description" value={newBreach.title} onChange={e => setNewBreach(b => ({ ...b, title: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[var(--etihuku-gray-400)]">Severity</label>
              <select className="form-input text-xs" value={newBreach.severity} onChange={e => setNewBreach(b => ({ ...b, severity: e.target.value as Severity }))}>
                {Object.entries(SEV_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[var(--etihuku-gray-400)]">Affected Subjects</label>
              <input className="form-input text-xs" type="number" placeholder="0" value={newBreach.affectedSubjects} onChange={e => setNewBreach(b => ({ ...b, affectedSubjects: e.target.value }))} />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-[var(--etihuku-gray-400)]">Description</label>
              <textarea className="form-input text-xs resize-none" rows={2} placeholder="What happened, what data was affected…" value={newBreach.description} onChange={e => setNewBreach(b => ({ ...b, description: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addBreach} disabled={!newBreach.title} className="btn btn-primary text-xs">Log Incident</button>
            <button onClick={() => setShowNewForm(false)} className="btn btn-secondary text-xs">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {breaches.map(breach => {
          const sevCfg = SEV_CONFIG[breach.severity];
          const stsCfg = STATUS_CONFIG[breach.status];
          const StsIcon = stsCfg.icon;
          const isExpanded = expandedId === breach.id;
          return (
            <div key={breach.id} className={cn("rounded-lg border overflow-hidden", sevCfg.bg)}>
              <div
                className="flex items-center gap-3 p-3 cursor-pointer"
                onClick={() => toggleExpand(breach.id)}
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sevCfg.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{breach.title}</div>
                  <div className="text-[10px] text-[var(--etihuku-gray-400)] mt-0.5">
                    Discovered {breach.discoveredAt} · {breach.affectedSubjects.toLocaleString()} subjects
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] px-2 py-0.5 rounded font-medium" style={{ color: sevCfg.color, backgroundColor: `${sevCfg.color}20` }}>{sevCfg.label}</span>
                  <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: stsCfg.color }}>
                    <StsIcon size={10} /> {stsCfg.label}
                  </span>
                  {isExpanded ? <ChevronUp size={14} className="text-[var(--etihuku-gray-500)]" /> : <ChevronDown size={14} className="text-[var(--etihuku-gray-500)]" />}
                </div>
              </div>
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-[var(--etihuku-gray-800)]/50 pt-3">
                  <p className="text-xs text-[var(--etihuku-gray-300)]">{breach.description}</p>
                  {breach.dataTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {breach.dataTypes.map(dt => (
                        <span key={dt} className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--etihuku-gray-800)] text-[var(--etihuku-gray-400)] border border-[var(--etihuku-gray-700)]">{dt}</span>
                      ))}
                    </div>
                  )}
                  {breach.regulatorNotifiedAt && (
                    <div className="flex items-center gap-2 text-xs text-green-400">
                      <CheckCircle2 size={12} />
                      <span>Notified {breach.regulator} on {breach.regulatorNotifiedAt} ({breach.daysToNotify}d after discovery — within POPIA 72h SLA)</span>
                    </div>
                  )}
                  {!breach.regulatorNotifiedAt && breach.status !== "closed" && breach.affectedSubjects > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-amber-400 flex items-center gap-1"><AlertTriangle size={11} /> Regulator not yet notified</span>
                      <button className="btn btn-primary btn-sm text-xs">Notify Regulator</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
