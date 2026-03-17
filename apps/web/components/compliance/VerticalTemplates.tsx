"use client";

import { useState, useMemo } from "react";
import { Radio, Lock, Mountain, Wrench, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";

import type { Vertical } from "@/lib/types/governance";
type CheckStatus = "pass" | "fail" | "warning" | "na";

interface ComplianceItem {
  id: string;
  code: string;
  requirement: string;
  status: CheckStatus;
  notes?: string;
  actionRequired?: string;
}

interface ComplianceTemplate {
  id: string;
  name: string;
  regulation: string;
  vertical: Vertical;
  description: string;
  items: ComplianceItem[];
  lastAudit?: string;
}

const VERTICAL_CONFIG: Record<Vertical, { icon: React.ElementType; color: string; label: string }> = {
  telecom:     { icon: Radio,    color: "#8B5CF6", label: "Telecommunications" },
  security:    { icon: Lock,     color: "#F59E0B", label: "Security" },
  mining:      { icon: Mountain, color: "#10B981", label: "Mining" },
  engineering: { icon: Wrench,   color: "#EC4899", label: "Engineering" },
};

const STATUS_CONFIG: Record<CheckStatus, { color: string; icon: React.ElementType; label: string }> = {
  pass:    { color: "#10B981", icon: CheckCircle2, label: "Pass" },
  fail:    { color: "#EF4444", icon: AlertTriangle,label: "Fail" },
  warning: { color: "#F59E0B", icon: AlertTriangle,label: "Warning" },
  na:      { color: "#6B7280", icon: Clock,        label: "N/A" },
};

const TEMPLATES: ComplianceTemplate[] = [
  {
    id: "t-icasa", name: "ICASA Reporting", regulation: "Electronics Communications Act", vertical: "telecom",
    description: "Independent Communications Authority of South Africa reporting requirements for electronic communications service providers.",
    lastAudit: "2026-01-15",
    items: [
      { id: "i1", code: "ECA-5.1", requirement: "Subscriber data retention for minimum 3 years", status: "pass", notes: "Retention policy enforced in DWH" },
      { id: "i2", code: "ECA-5.2", requirement: "CDR data available for lawful interception on demand", status: "pass" },
      { id: "i3", code: "ECA-7.1", requirement: "Monthly network quality reports submitted to ICASA", status: "warning", actionRequired: "Last report 47 days ago — submit overdue Feb 2026 report" },
      { id: "i4", code: "ECA-9.3", requirement: "Emergency service routing records retained for 5 years", status: "pass" },
      { id: "i5", code: "ECA-12.1",requirement: "Interconnect data available for audit within 48h", status: "pass" },
    ],
  },
  {
    id: "t-rica", name: "RICA Data Handling", regulation: "Regulation of Interception of Communications Act", vertical: "telecom",
    description: "Requirements for subscriber registration and communications interception under RICA.",
    lastAudit: "2026-02-01",
    items: [
      { id: "r1", code: "RICA-3",  requirement: "All SIM cards registered with verified identity documents", status: "pass" },
      { id: "r2", code: "RICA-4",  requirement: "Subscriber ID data stored securely, access controlled", status: "pass" },
      { id: "r3", code: "RICA-6",  requirement: "Interception requests processed within mandated timeframe", status: "pass" },
      { id: "r4", code: "RICA-9",  requirement: "Subscriber data encrypted at rest and in transit", status: "warning", actionRequired: "CDR archive cluster uses AES-128; upgrade to AES-256" },
      { id: "r5", code: "RICA-11", requirement: "Access log for all interception queries maintained", status: "pass" },
    ],
  },
  {
    id: "t-psira", name: "PSIRA Compliance", regulation: "Private Security Industry Regulation Act", vertical: "security",
    description: "Private Security Industry Regulatory Authority requirements for data management in surveillance and security systems.",
    lastAudit: "2025-12-10",
    items: [
      { id: "p1", code: "PSIRA-14.2", requirement: "All surveillance operators registered with PSIRA", status: "pass" },
      { id: "p2", code: "PSIRA-14.5", requirement: "Biometric data collected only for access control, not stored longer than required", status: "fail", actionRequired: "Biometric logs retained 18 months; policy allows 12 months max" },
      { id: "p3", code: "PSIRA-16.1", requirement: "Incident reports submitted within 24h of critical events", status: "pass" },
      { id: "p4", code: "PSIRA-16.3", requirement: "Chain of custody maintained for all digital evidence", status: "pass", notes: "Evidence hash chain implemented in CCTV pipeline" },
      { id: "p5", code: "PSIRA-18.1", requirement: "Annual PSIRA site audit completed", status: "warning", actionRequired: "Annual audit due in 45 days" },
    ],
  },
  {
    id: "t-psira-eoc", name: "Evidence Chain of Custody", regulation: "PSIRA / Criminal Procedure Act", vertical: "security",
    description: "Digital evidence chain-of-custody requirements for admissibility in legal proceedings.",
    lastAudit: "2026-01-20",
    items: [
      { id: "e1", code: "EoC-1", requirement: "SHA-256 hash recorded at evidence capture", status: "pass" },
      { id: "e2", code: "EoC-2", requirement: "Immutable audit log for all evidence access events", status: "pass" },
      { id: "e3", code: "EoC-3", requirement: "Evidence stored in WORM storage", status: "pass" },
      { id: "e4", code: "EoC-4", requirement: "Two-person authorisation for evidence retrieval", status: "warning", actionRequired: "Single-person retrieval recorded on 3 occasions in Jan 2026" },
    ],
  },
  {
    id: "t-dmre", name: "DMRE Reporting", regulation: "Mineral Resources and Energy Act", vertical: "mining",
    description: "Department of Mineral Resources and Energy reporting requirements for mine health, safety, and environmental data.",
    lastAudit: "2026-02-05",
    items: [
      { id: "d1", code: "MHSA-11", requirement: "Daily safety inspection records retained for 5 years", status: "pass" },
      { id: "d2", code: "MHSA-23", requirement: "Incident and fatality reports submitted to DMRE within 24h", status: "pass" },
      { id: "d3", code: "MHSA-54", requirement: "Occupational hygiene data available for DMRE inspection", status: "pass" },
      { id: "d4", code: "NEM-15",  requirement: "Monthly environmental monitoring data submitted", status: "warning", actionRequired: "Q4 2025 environmental report pending sign-off" },
      { id: "d5", code: "MHSA-8",  requirement: "Strata control records maintained per working area", status: "pass" },
    ],
  },
  {
    id: "t-ecsa", name: "ECSA Standards", regulation: "Engineering Profession Act / SANS", vertical: "engineering",
    description: "Engineering Council of South Africa and SANS code adherence for engineering data and documentation.",
    lastAudit: "2025-11-30",
    items: [
      { id: "ec1", code: "ECSA-2.1", requirement: "All structural inspection data signed by registered PrEng", status: "pass" },
      { id: "ec2", code: "SANS-10400",requirement: "Inspection findings cross-referenced to SANS 10400 sections", status: "pass" },
      { id: "ec3", code: "ECSA-4.3", requirement: "Defect reports retained for minimum 10 years", status: "pass" },
      { id: "ec4", code: "ECSA-7.1", requirement: "Drone imagery metadata includes GPS and timestamp", status: "fail", actionRequired: "GPS metadata stripped by tile slicer pipeline — fix config" },
      { id: "ec5", code: "ISO-19650", requirement: "BIM data managed per ISO 19650 information management", status: "warning", actionRequired: "BIM IDS schema validation not yet automated" },
    ],
  },
];

export function VerticalTemplates() {
  const [selectedVertical, setSelectedVertical] = useState<Vertical | "all">("all");
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>("t-icasa");
  const [statusFilters, setStatusFilters] = useState<Set<CheckStatus>>(new Set(["fail", "warning"]));

  const filteredTemplates = useMemo(
    () => TEMPLATES.filter(t => selectedVertical === "all" || t.vertical === selectedVertical),
    [selectedVertical]
  );

  function toggleStatusFilter(s: CheckStatus) {
    setStatusFilters(prev => {
      const next = new Set(prev);
      if (next.has(s)) { next.delete(s); } else { next.add(s); }
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* Vertical filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setSelectedVertical("all")} className={cn("px-3 py-1.5 rounded text-xs font-medium border transition-all", selectedVertical === "all" ? "border-[var(--etihuku-indigo)] bg-[var(--etihuku-indigo)]/10 text-[var(--etihuku-indigo)]" : "border-[var(--etihuku-gray-700)] text-[var(--etihuku-gray-400)]")}>
          All Verticals
        </button>
        {(Object.entries(VERTICAL_CONFIG) as [Vertical, typeof VERTICAL_CONFIG[Vertical]][]).map(([v, cfg]) => {
          const Icon = cfg.icon;
          return (
            <button key={v} onClick={() => setSelectedVertical(v)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-all")}
              style={selectedVertical === v ? { borderColor: cfg.color, backgroundColor: `${cfg.color}15`, color: cfg.color } : { borderColor: "var(--etihuku-gray-700)", color: "var(--etihuku-gray-400)" }}
            >
              <Icon size={12} /> {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[var(--etihuku-gray-500)]">Show:</span>
        {(Object.entries(STATUS_CONFIG) as [CheckStatus, typeof STATUS_CONFIG[CheckStatus]][]).map(([s, cfg]) => {
          const Icon = cfg.icon;
          return (
            <button key={s} onClick={() => toggleStatusFilter(s)}
              className={cn("flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border transition-all")}
              style={statusFilters.has(s) ? { borderColor: cfg.color, backgroundColor: `${cfg.color}15`, color: cfg.color } : { borderColor: "var(--etihuku-gray-700)", color: "var(--etihuku-gray-500)" }}
            >
              <Icon size={9} /> {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Template list */}
      <div className="space-y-2">
        {filteredTemplates.map(template => {
          const vCfg = VERTICAL_CONFIG[template.vertical];
          const VIcon = vCfg.icon;
          const isExpanded = expandedTemplate === template.id;
          const visibleItems = template.items.filter(i => statusFilters.size === 0 || statusFilters.has(i.status));
          const failCount = template.items.filter(i => i.status === "fail").length;
          const warnCount = template.items.filter(i => i.status === "warning").length;
          const passCount = template.items.filter(i => i.status === "pass").length;
          const score = Math.round((passCount / template.items.length) * 100);
          return (
            <div key={template.id} className="rounded-lg border border-[var(--etihuku-gray-700)] overflow-hidden">
              <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[var(--etihuku-gray-900)]/50" onClick={() => setExpandedTemplate(isExpanded ? null : template.id)}>
                <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${vCfg.color}20` }}>
                  <VIcon size={14} style={{ color: vCfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{template.name}</span>
                    <span className="text-[9px] text-[var(--etihuku-gray-500)]">{template.regulation}</span>
                  </div>
                  <div className="text-[10px] text-[var(--etihuku-gray-500)] mt-0.5">
                    {template.items.length} requirements · Last audit: {template.lastAudit || "Never"}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {failCount > 0 && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-950/40 text-red-400">{failCount} fail</span>}
                  {warnCount > 0 && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-950/30 text-amber-400">{warnCount} warn</span>}
                  <div className="text-right">
                    <div className="text-lg font-display font-bold" style={{ color: score >= 90 ? "#10B981" : score >= 70 ? "#F59E0B" : "#EF4444" }}>{score}%</div>
                  </div>
                  {isExpanded ? <ChevronUp size={14} className="text-[var(--etihuku-gray-500)]" /> : <ChevronDown size={14} className="text-[var(--etihuku-gray-500)]" />}
                </div>
              </div>
              {isExpanded && (
                <div className="border-t border-[var(--etihuku-gray-800)] bg-[var(--etihuku-gray-900)]/30">
                  <div className="px-4 py-2 text-[10px] text-[var(--etihuku-gray-500)]">{template.description}</div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[var(--etihuku-gray-800)]">
                        {["Code", "Requirement", "Status", "Notes / Action"].map(h => (
                          <th key={h} className="px-3 py-2 text-left font-medium text-[var(--etihuku-gray-500)] whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--etihuku-gray-800)]">
                      {(visibleItems.length > 0 ? visibleItems : template.items).map(item => {
                        const sCfg = STATUS_CONFIG[item.status];
                        const Icon = sCfg.icon;
                        return (
                          <tr key={item.id} className={cn(item.status === "fail" ? "bg-red-950/10" : item.status === "warning" ? "bg-amber-950/5" : "")}>
                            <td className="px-3 py-2 font-mono text-[var(--etihuku-gray-400)] whitespace-nowrap">{item.code}</td>
                            <td className="px-3 py-2 text-[var(--etihuku-gray-200)]">{item.requirement}</td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: sCfg.color }}>
                                <Icon size={10} /> {sCfg.label}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-[var(--etihuku-gray-400)]">
                              {item.actionRequired && <span className="text-amber-300">{item.actionRequired}</span>}
                              {item.notes && !item.actionRequired && <span>{item.notes}</span>}
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
        })}
      </div>
    </div>
  );
}
