"use client";

import { useState } from "react";
import {
  GitBranch, Shield, Building2, Lock,
  Network, AlertTriangle, Tag, EyeOff, Filter, ClipboardList,
  Clock, BarChart2, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// Lineage
import { LineageGraph }   from "@/components/lineage/LineageGraph";
import { ImpactAnalysis } from "@/components/lineage/ImpactAnalysis";
import { AuditExport }    from "@/components/lineage/AuditExport";

// POPIA
import { ClassificationPanel } from "@/components/popia/ClassificationPanel";
import { AnonymizationPanel }  from "@/components/popia/AnonymizationPanel";
import { ConsentPanel }        from "@/components/popia/ConsentPanel";
import { DataSubjectPanel }    from "@/components/popia/DataSubjectPanel";
import { BreachRegister }      from "@/components/popia/BreachRegister";

// Compliance
import { VerticalTemplates }    from "@/components/compliance/VerticalTemplates";
import { ComplianceChecklists } from "@/components/compliance/ComplianceChecklists";
import { RetentionPolicies }    from "@/components/compliance/RetentionPolicies";

// Access
import { PermissionsMatrix } from "@/components/access/PermissionsMatrix";
import { ColumnMasking }     from "@/components/access/ColumnMasking";
import { RowFilters }        from "@/components/access/RowFilters";
import { AuditTrail }        from "@/components/access/AuditTrail";

// ─── Tab definitions ─────────────────────────────────────────────────────────
type TopTab = "lineage" | "popia" | "compliance" | "access";
type LineageTab = "graph" | "impact" | "export";
type POPIATab = "classification" | "anonymization" | "consent" | "dsrs" | "breaches";
type ComplianceTab = "templates" | "checklists" | "retention";
type AccessTab = "permissions" | "column-masking" | "row-filters" | "audit";

const TOP_TABS: { id: TopTab; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: "lineage",    label: "Data Lineage",        icon: GitBranch  },
  { id: "popia",      label: "POPIA Compliance",    icon: Shield, badge: "3" },
  { id: "compliance", label: "Industry Compliance", icon: Building2  },
  { id: "access",     label: "Access Controls",     icon: Lock       },
];

// ─── Summary cards ────────────────────────────────────────────────────────────
const SUMMARY_CARDS = [
  { label: "POPIA Compliance",      value: "78%",  color: "#F59E0B", icon: Shield,       sub: "4 outstanding DSRs" },
  { label: "Columns Classified",    value: "15",   color: "#3B82F6", icon: Tag,           sub: "3 need review" },
  { label: "Active Policies",       value: "6",    color: "#10B981", icon: ClipboardList, sub: "1 pending review" },
  { label: "Denied Queries (24h)",  value: "4",    color: "#EF4444", icon: EyeOff,        sub: "2 masking blocks" },
  { label: "Open Breach Reports",   value: "2",    color: "#EC4899", icon: AlertTriangle, sub: "1 critical" },
  { label: "DSR Queue",             value: "4",    color: "#8B5CF6", icon: BarChart2,     sub: "1 overdue" },
];

export default function GovernancePage() {
  const [topTab, setTopTab]         = useState<TopTab>("lineage");
  const [lineageTab, setLineageTab] = useState<LineageTab>("graph");
  const [popiaTab, setPOPIATab]     = useState<POPIATab>("classification");
  const [complianceTab, setCompTab] = useState<ComplianceTab>("templates");
  const [accessTab, setAccessTab]   = useState<AccessTab>("permissions");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Governance &amp; Compliance</h1>
        <p className="text-sm text-[var(--etihuku-gray-400)] mt-1">
          Data lineage, POPIA compliance, industry standards, and access control — all in one place.
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {SUMMARY_CARDS.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-lg border border-[var(--etihuku-gray-800)] bg-[var(--etihuku-gray-900)] p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: `${card.color}15` }}>
                  <Icon size={14} style={{ color: card.color }} />
                </div>
                <span className="text-xl font-display font-bold" style={{ color: card.color }}>{card.value}</span>
              </div>
              <div className="text-[10px] font-medium text-[var(--etihuku-gray-300)]">{card.label}</div>
              <div className="text-[9px] text-[var(--etihuku-gray-600)] mt-0.5">{card.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Top-level tabs */}
      <div className="border-b border-[var(--etihuku-gray-800)]">
        <div className="flex gap-1 overflow-x-auto">
          {TOP_TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setTopTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-all",
                  topTab === tab.id
                    ? "border-[var(--etihuku-indigo)] text-[var(--etihuku-indigo)]"
                    : "border-transparent text-[var(--etihuku-gray-400)] hover:text-white"
                )}
              >
                <Icon size={15} />
                {tab.label}
                {tab.badge && (
                  <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-500 text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4.1 Data Lineage ──────────────────────────────────────────────── */}
      {topTab === "lineage" && (
        <div className="space-y-4">
          <div className="flex gap-1 border-b border-[var(--etihuku-gray-800)]">
            {([
              { id: "graph",  label: "Lineage Graph",   icon: Network       },
              { id: "impact", label: "Impact Analysis", icon: AlertTriangle },
              { id: "export", label: "Audit Export",    icon: ClipboardList },
            ] as { id: LineageTab; label: string; icon: React.ElementType }[]).map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setLineageTab(t.id)}
                  className={cn("flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all",
                    lineageTab === t.id
                      ? "border-[var(--etihuku-indigo)] text-[var(--etihuku-indigo)]"
                      : "border-transparent text-[var(--etihuku-gray-400)] hover:text-white"
                  )}
                ><Icon size={13} /> {t.label}</button>
              );
            })}
          </div>
          {lineageTab === "graph"  && <LineageGraph />}
          {lineageTab === "impact" && <ImpactAnalysis />}
          {lineageTab === "export" && <AuditExport />}
        </div>
      )}

      {/* ── 4.2 POPIA Compliance ──────────────────────────────────────────── */}
      {topTab === "popia" && (
        <div className="space-y-4">
          <div className="flex gap-1 border-b border-[var(--etihuku-gray-800)] overflow-x-auto">
            {([
              { id: "classification", label: "Data Classification",  icon: Tag          },
              { id: "anonymization",  label: "Anonymization",        icon: EyeOff       },
              { id: "consent",        label: "Consent",              icon: CheckCircle2 },
              { id: "dsrs",           label: "Data Subject Requests",icon: Clock        },
              { id: "breaches",       label: "Breach Register",      icon: AlertTriangle},
            ] as { id: POPIATab; label: string; icon: React.ElementType }[]).map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setPOPIATab(t.id)}
                  className={cn("flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-all",
                    popiaTab === t.id
                      ? "border-[var(--etihuku-indigo)] text-[var(--etihuku-indigo)]"
                      : "border-transparent text-[var(--etihuku-gray-400)] hover:text-white"
                  )}
                ><Icon size={13} /> {t.label}</button>
              );
            })}
          </div>
          {popiaTab === "classification" && <ClassificationPanel />}
          {popiaTab === "anonymization"  && <AnonymizationPanel />}
          {popiaTab === "consent"        && <ConsentPanel />}
          {popiaTab === "dsrs"           && <DataSubjectPanel />}
          {popiaTab === "breaches"       && <BreachRegister />}
        </div>
      )}

      {/* ── 4.3 Industry Compliance ───────────────────────────────────────── */}
      {topTab === "compliance" && (
        <div className="space-y-4">
          <div className="flex gap-1 border-b border-[var(--etihuku-gray-800)]">
            {([
              { id: "templates",  label: "Vertical Templates",    icon: Building2     },
              { id: "checklists", label: "Compliance Checklists", icon: ClipboardList },
              { id: "retention",  label: "Retention Policies",    icon: Clock         },
            ] as { id: ComplianceTab; label: string; icon: React.ElementType }[]).map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setCompTab(t.id)}
                  className={cn("flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-all",
                    complianceTab === t.id
                      ? "border-[var(--etihuku-indigo)] text-[var(--etihuku-indigo)]"
                      : "border-transparent text-[var(--etihuku-gray-400)] hover:text-white"
                  )}
                ><Icon size={13} /> {t.label}</button>
              );
            })}
          </div>
          {complianceTab === "templates"  && <VerticalTemplates />}
          {complianceTab === "checklists" && <ComplianceChecklists />}
          {complianceTab === "retention"  && <RetentionPolicies />}
        </div>
      )}

      {/* ── 4.4 Access Controls ───────────────────────────────────────────── */}
      {topTab === "access" && (
        <div className="space-y-4">
          <div className="flex gap-1 border-b border-[var(--etihuku-gray-800)]">
            {([
              { id: "permissions",    label: "Permissions Matrix", icon: Shield        },
              { id: "column-masking", label: "Column Masking",     icon: EyeOff        },
              { id: "row-filters",    label: "Row Filters",        icon: Filter        },
              { id: "audit",          label: "Audit Trail",        icon: ClipboardList },
            ] as { id: AccessTab; label: string; icon: React.ElementType }[]).map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setAccessTab(t.id)}
                  className={cn("flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-all",
                    accessTab === t.id
                      ? "border-[var(--etihuku-indigo)] text-[var(--etihuku-indigo)]"
                      : "border-transparent text-[var(--etihuku-gray-400)] hover:text-white"
                  )}
                ><Icon size={13} /> {t.label}</button>
              );
            })}
          </div>
          {accessTab === "permissions"    && <PermissionsMatrix />}
          {accessTab === "column-masking" && <ColumnMasking />}
          {accessTab === "row-filters"    && <RowFilters />}
          {accessTab === "audit"          && <AuditTrail />}
        </div>
      )}
    </div>
  );
}
