"use client";

import { useState, useMemo } from "react";
import { CheckCircle2, Circle, AlertTriangle, ChevronRight, Database, Filter } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ChecklistStatus = "complete" | "partial" | "incomplete" | "not-applicable";

interface ChecklistAction {
  id: string;
  category: string;
  item: string;
  status: "done" | "pending" | "na" | "blocked";
  owner?: string;
  dueDate?: string;
}

interface DatasetChecklist {
  id: string;
  dataset: string;
  vertical: string;
  overallStatus: ChecklistStatus;
  score: number;
  actions: ChecklistAction[];
}

const STATUS_COLORS: Record<ChecklistStatus, string> = {
  complete:       "#10B981",
  partial:        "#F59E0B",
  incomplete:     "#EF4444",
  "not-applicable": "#6B7280",
};

const ACTION_STATUS_CONFIG = {
  done:    { color: "#10B981", icon: CheckCircle2, label: "Done" },
  pending: { color: "#F59E0B", icon: Circle,       label: "Pending" },
  na:      { color: "#6B7280", icon: Circle,       label: "N/A" },
  blocked: { color: "#EF4444", icon: AlertTriangle,label: "Blocked" },
};

const MOCK_CHECKLISTS: DatasetChecklist[] = [
  {
    id: "cl1", dataset: "Customer DWH", vertical: "telecom", overallStatus: "partial", score: 72,
    actions: [
      { id: "a1",  category: "Classification", item: "All columns classified under POPIA",       status: "done", owner: "DPO" },
      { id: "a2",  category: "Classification", item: "Data classification reviewed by DPO",      status: "done", owner: "DPO" },
      { id: "a3",  category: "Anonymisation",  item: "PII columns masked in non-prod environments", status: "done" },
      { id: "a4",  category: "Anonymisation",  item: "k-anonymity verified (k≥5)",               status: "blocked", owner: "Data Eng", dueDate: "2026-03-01" },
      { id: "a5",  category: "Consent",        item: "All processing purposes have valid consent", status: "done" },
      { id: "a6",  category: "Consent",        item: "Consent records synced from CMP",          status: "done" },
      { id: "a7",  category: "Retention",      item: "Retention policy configured",             status: "done" },
      { id: "a8",  category: "Retention",      item: "Automated deletion schedule running",      status: "pending", owner: "Data Eng", dueDate: "2026-02-28" },
      { id: "a9",  category: "Access",         item: "Role-based access controls in place",      status: "done" },
      { id: "a10", category: "Access",         item: "Column masking for sensitive columns",     status: "pending", owner: "Platform", dueDate: "2026-03-05" },
    ],
  },
  {
    id: "cl2", dataset: "CDR Raw DB", vertical: "telecom", overallStatus: "partial", score: 64,
    actions: [
      { id: "b1", category: "Classification", item: "All columns classified under POPIA",       status: "done" },
      { id: "b2", category: "Anonymisation",  item: "MSISDN pseudonymised",                    status: "done" },
      { id: "b3", category: "Anonymisation",  item: "Cell ID generalised to region",           status: "pending", owner: "Data Eng", dueDate: "2026-03-10" },
      { id: "b4", category: "Retention",      item: "RICA 3-year retention enforced",          status: "done" },
      { id: "b5", category: "Access",         item: "Audit log for all queries",               status: "done" },
      { id: "b6", category: "ICASA",          item: "Monthly reporting automation configured", status: "blocked", owner: "Ops", dueDate: "2026-02-28" },
    ],
  },
  {
    id: "cl3", dataset: "CCTV Training Set", vertical: "security", overallStatus: "incomplete", score: 40,
    actions: [
      { id: "c1", category: "Classification", item: "Biometric data classified as Special Personal", status: "done" },
      { id: "c2", category: "Anonymisation",  item: "Face embeddings suppressed in exports",   status: "done" },
      { id: "c3", category: "Consent",        item: "Consent obtained from data subjects",     status: "blocked", owner: "Legal", dueDate: "2026-04-01" },
      { id: "c4", category: "PSIRA",          item: "PSIRA biometric retention limit enforced", status: "blocked", owner: "DPO" },
      { id: "c5", category: "Retention",      item: "12-month retention policy applied",       status: "pending", owner: "Platform", dueDate: "2026-03-15" },
    ],
  },
  {
    id: "cl4", dataset: "Mineworker DB", vertical: "mining", overallStatus: "partial", score: 60,
    actions: [
      { id: "d1", category: "Classification", item: "Personal + biometric data classified",   status: "done" },
      { id: "d2", category: "Anonymisation",  item: "Biometric hash suppressed in exports",   status: "pending", owner: "Data Eng", dueDate: "2026-03-01" },
      { id: "d3", category: "MHSA",          item: "Safety records retained 5 years",        status: "done" },
      { id: "d4", category: "Access",         item: "Role-based access by mine section",      status: "done" },
      { id: "d5", category: "Consent",        item: "Worker consent obtained for biometrics", status: "done" },
    ],
  },
  {
    id: "cl5", dataset: "Inspection Training", vertical: "engineering", overallStatus: "partial", score: 50,
    actions: [
      { id: "e1", category: "ECSA",    item: "GPS metadata preserved in tile pipeline", status: "blocked", owner: "Data Eng", dueDate: "2026-03-01" },
      { id: "e2", category: "ECSA",    item: "PrEng signature on inspection reports",  status: "done" },
      { id: "e3", category: "ISO 19650",item: "BIM IDS schema validation",             status: "pending", owner: "Platform", dueDate: "2026-03-20" },
      { id: "e4", category: "Retention",item: "10-year retention for defect reports",  status: "done" },
    ],
  },
];

export function ComplianceChecklists() {
  const [selected, setSelected] = useState<DatasetChecklist>(MOCK_CHECKLISTS[0]);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "blocked">("all");

  const { actions, grouped } = useMemo(() => {
    const actions = selected.actions.filter(a =>
      filterStatus === "all" || a.status === filterStatus
    );
    const grouped = actions.reduce<Record<string, ChecklistAction[]>>((acc, a) => {
      if (!acc[a.category]) acc[a.category] = [];
      acc[a.category].push(a);
      return acc;
    }, {});
    return { actions, grouped };
  }, [selected, filterStatus]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Dataset list */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-[var(--etihuku-gray-400)] uppercase tracking-wide">Datasets</div>
        {MOCK_CHECKLISTS.map(cl => {
          const color = STATUS_COLORS[cl.overallStatus];
          return (
            <button
              key={cl.id}
              onClick={() => setSelected(cl)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                selected.id === cl.id
                  ? "border-[var(--etihuku-indigo)] bg-[var(--etihuku-indigo)]/5"
                  : "border-[var(--etihuku-gray-700)] bg-[var(--etihuku-gray-900)] hover:border-[var(--etihuku-gray-600)]"
              )}
            >
              <Database size={14} className="text-[var(--etihuku-gray-400)] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white truncate">{cl.dataset}</div>
                <div className="text-[10px] text-[var(--etihuku-gray-500)] capitalize mt-0.5">{cl.vertical}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-base font-display font-bold" style={{ color }}>{cl.score}%</div>
                <div className="w-12 h-1 rounded-full bg-[var(--etihuku-gray-800)] mt-1">
                  <div className="h-1 rounded-full" style={{ width: `${cl.score}%`, backgroundColor: color }} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Checklist detail */}
      <div className="lg:col-span-2 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white">{selected.dataset}</div>
            <div className="text-xs text-[var(--etihuku-gray-400)]">{selected.actions.length} compliance items</div>
          </div>
          <div className="flex gap-1.5">
            {(["all", "pending", "blocked"] as const).map(f => (
              <button key={f} onClick={() => setFilterStatus(f)} className={cn("px-2.5 py-1 rounded text-[10px] font-medium border transition-all capitalize",
                filterStatus === f ? "border-[var(--etihuku-indigo)] bg-[var(--etihuku-indigo)]/10 text-[var(--etihuku-indigo)]" : "border-[var(--etihuku-gray-700)] text-[var(--etihuku-gray-400)]"
              )}>{f === "all" ? "All items" : f}</button>
            ))}
          </div>
        </div>

        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="rounded-lg border border-[var(--etihuku-gray-700)] overflow-hidden">
            <div className="px-3 py-2 bg-[var(--etihuku-gray-900)] border-b border-[var(--etihuku-gray-800)] flex items-center gap-2">
              <Filter size={11} className="text-[var(--etihuku-gray-500)]" />
              <span className="text-xs font-medium text-[var(--etihuku-gray-300)]">{category}</span>
            </div>
            <div className="divide-y divide-[var(--etihuku-gray-800)]">
              {items.map(action => {
                const cfg = ACTION_STATUS_CONFIG[action.status];
                const Icon = cfg.icon;
                return (
                  <div key={action.id} className="flex items-start gap-3 px-3 py-2.5">
                    <Icon size={13} style={{ color: cfg.color }} className="mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-[var(--etihuku-gray-200)]">{action.item}</div>
                      {(action.owner || action.dueDate) && (
                        <div className="text-[10px] text-[var(--etihuku-gray-500)] mt-0.5">
                          {action.owner && `Owner: ${action.owner}`}
                          {action.owner && action.dueDate && " · "}
                          {action.dueDate && `Due: ${action.dueDate}`}
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] font-medium shrink-0" style={{ color: cfg.color }}>{cfg.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {actions.length === 0 && <div className="py-8 text-center text-[var(--etihuku-gray-500)] text-sm">No items match filter</div>}
      </div>
    </div>
  );
}
