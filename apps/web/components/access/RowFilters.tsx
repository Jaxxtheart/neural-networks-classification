"use client";

import { useState } from "react";
import { Filter, Plus, Trash2, Play, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type FilterOp = "=" | "!=" | "IN" | "NOT IN" | "STARTS WITH" | "IS NULL";

interface RowFilter {
  id: string;
  name: string;
  dataset: string;
  column: string;
  operator: FilterOp;
  value: string;
  appliesTo: string[];   // roles or user attributes
  description: string;
  active: boolean;
  rowsFiltered?: number;
}

const OP_OPTIONS: FilterOp[] = ["=", "!=", "IN", "NOT IN", "STARTS WITH", "IS NULL"];

const MOCK_FILTERS: RowFilter[] = [
  {
    id: "rf1", name: "Regional Data Scoping",
    dataset: "Customer DWH", column: "region", operator: "=", value: "{user.region}",
    appliesTo: ["Analyst", "Viewer"],
    description: "Analysts only see customer rows from their assigned region.",
    active: true, rowsFiltered: 820000,
  },
  {
    id: "rf2", name: "Active Customers Only (Viewer)",
    dataset: "Customer DWH", column: "account_status", operator: "=", value: "active",
    appliesTo: ["Viewer"],
    description: "Viewers cannot see deactivated or suspended accounts.",
    active: true, rowsFiltered: 58000,
  },
  {
    id: "rf3", name: "Vertical Scoping — Telecom",
    dataset: "CDR Raw DB", column: "vertical", operator: "=", value: "telecom",
    appliesTo: ["Analyst"],
    description: "CDR data filtered to telecom rows for non-admin analysts.",
    active: true, rowsFiltered: 3900000,
  },
  {
    id: "rf4", name: "Own Mine Section Only",
    dataset: "Mineworker DB", column: "mine_section", operator: "=", value: "{user.mine_section}",
    appliesTo: ["Data Engineer", "Analyst"],
    description: "Workers only see rows related to their mine section.",
    active: true, rowsFiltered: 3800,
  },
  {
    id: "rf5", name: "Exclude Biometric Records",
    dataset: "Mineworker DB", column: "biometric_hash", operator: "IS NULL", value: "",
    appliesTo: ["Viewer", "Analyst", "ML Engineer"],
    description: "Non-privileged roles see only rows without biometric data.",
    active: false, rowsFiltered: 1200,
  },
  {
    id: "rf6", name: "Approved Datasets Only",
    dataset: "CCTV Training Set", column: "annotation_status", operator: "=", value: "approved",
    appliesTo: ["ML Engineer"],
    description: "ML Engineers only train on approved, fully-annotated frames.",
    active: true, rowsFiltered: 12000,
  },
];

const ROLES = ["Viewer", "Analyst", "Data Engineer", "ML Engineer", "DPO", "Admin"];
const DATASETS = ["Customer DWH", "CDR Raw DB", "Mineworker DB", "CCTV Training Set", "Inspection Training"];

export function RowFilters() {
  const [filters, setFilters] = useState<RowFilter[]>(MOCK_FILTERS);
  const [showAdd, setShowAdd] = useState(false);
  const [testRole, setTestRole] = useState("Analyst");
  const [testDataset, setTestDataset] = useState("Customer DWH");
  const [newFilter, setNewFilter] = useState({
    name: "", dataset: "Customer DWH", column: "", operator: "=" as FilterOp,
    value: "", appliesTo: ["Viewer"] as string[], description: "",
  });

  function toggleFilter(id: string) {
    setFilters(prev => prev.map(f => f.id === id ? { ...f, active: !f.active } : f));
  }
  function deleteFilter(id: string) {
    setFilters(prev => prev.filter(f => f.id !== id));
  }
  function addFilter() {
    setFilters(prev => [...prev, { id: `rf${Date.now()}`, ...newFilter, active: true }]);
    setNewFilter(f => ({ ...f, name: "", column: "", value: "", description: "" }));
    setShowAdd(false);
  }

  const activeForTest = filters.filter(
    f => f.active && f.dataset === testDataset && f.appliesTo.includes(testRole)
  );

  return (
    <div className="space-y-4">
      {/* Test panel */}
      <div className="p-3 rounded-lg border border-[var(--etihuku-gray-700)] bg-[var(--etihuku-gray-900)]/50">
        <div className="text-xs font-medium text-[var(--etihuku-gray-400)] mb-2">Preview active filters</div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--etihuku-gray-500)]">Role:</span>
            <select className="form-input text-xs py-1 w-36" value={testRole} onChange={e => setTestRole(e.target.value)}>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--etihuku-gray-500)]">Dataset:</span>
            <select className="form-input text-xs py-1 w-48" value={testDataset} onChange={e => setTestDataset(e.target.value)}>
              {DATASETS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
        {activeForTest.length === 0 ? (
          <div className="mt-2 text-xs text-green-400 flex items-center gap-1.5">
            <CheckCircle2 size={12} /> No row filters — full dataset visible
          </div>
        ) : (
          <div className="mt-2 space-y-1">
            {activeForTest.map(f => (
              <div key={f.id} className="flex items-center gap-2 text-xs text-[var(--etihuku-gray-300)]">
                <Filter size={11} className="text-[var(--etihuku-indigo)] shrink-0" />
                <span className="font-mono">{f.column} {f.operator} {f.value}</span>
                <span className="text-[var(--etihuku-gray-500)]">({f.rowsFiltered?.toLocaleString()} rows filtered)</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-[var(--etihuku-gray-400)] uppercase tracking-wide">Row Filter Rules</div>
        <button onClick={() => setShowAdd(v => !v)} className="btn btn-secondary btn-sm text-xs flex items-center gap-1">
          <Plus size={11} /> Add Filter
        </button>
      </div>

      {showAdd && (
        <div className="p-4 rounded-lg border border-[var(--etihuku-indigo)]/30 bg-[var(--etihuku-indigo)]/5 space-y-3">
          <div className="text-sm font-semibold text-white">New Row Filter</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-[var(--etihuku-gray-400)]">Filter name</label>
              <input className="form-input text-xs" placeholder="e.g. Regional Data Scoping" value={newFilter.name} onChange={e => setNewFilter(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[var(--etihuku-gray-400)]">Dataset</label>
              <select className="form-input text-xs" value={newFilter.dataset} onChange={e => setNewFilter(f => ({ ...f, dataset: e.target.value }))}>
                {DATASETS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[var(--etihuku-gray-400)]">Column</label>
              <input className="form-input text-xs" placeholder="e.g. region" value={newFilter.column} onChange={e => setNewFilter(f => ({ ...f, column: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[var(--etihuku-gray-400)]">Operator</label>
              <select className="form-input text-xs" value={newFilter.operator} onChange={e => setNewFilter(f => ({ ...f, operator: e.target.value as FilterOp }))}>
                {OP_OPTIONS.map(op => <option key={op}>{op}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[var(--etihuku-gray-400)]">Value</label>
              <input className="form-input text-xs" placeholder="e.g. {user.region}" value={newFilter.value} onChange={e => setNewFilter(f => ({ ...f, value: e.target.value }))} />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-[var(--etihuku-gray-400)]">Apply to roles</label>
              <div className="flex flex-wrap gap-2">
                {ROLES.filter(r => r !== "Admin").map(role => (
                  <label key={role} className="flex items-center gap-1 text-[10px] text-[var(--etihuku-gray-300)] cursor-pointer">
                    <input type="checkbox" className="accent-[var(--etihuku-indigo)]"
                      checked={newFilter.appliesTo.includes(role)}
                      onChange={e => setNewFilter(f => ({
                        ...f, appliesTo: e.target.checked ? [...f.appliesTo, role] : f.appliesTo.filter(x => x !== role)
                      }))}
                    /> {role}
                  </label>
                ))}
              </div>
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-[var(--etihuku-gray-400)]">Description</label>
              <input className="form-input text-xs" placeholder="Explain what this filter does" value={newFilter.description} onChange={e => setNewFilter(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addFilter} disabled={!newFilter.name || !newFilter.column} className="btn btn-primary text-xs">Add Filter</button>
            <button onClick={() => setShowAdd(false)} className="btn btn-secondary text-xs">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filters.map(f => (
          <div key={f.id} className={cn("flex items-start gap-3 p-3 rounded-lg border transition-all",
            f.active ? "border-[var(--etihuku-gray-700)] bg-[var(--etihuku-gray-900)]" : "border-[var(--etihuku-gray-800)] opacity-50"
          )}>
            <div className="w-7 h-7 rounded-md bg-[var(--etihuku-indigo)]/10 flex items-center justify-center shrink-0 mt-0.5">
              <Filter size={13} className="text-[var(--etihuku-indigo)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-white">{f.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--etihuku-gray-800)] text-[var(--etihuku-gray-400)] border border-[var(--etihuku-gray-700)]">{f.dataset}</span>
              </div>
              <code className="text-[10px] text-[var(--etihuku-indigo)] bg-[var(--etihuku-indigo)]/5 px-2 py-0.5 rounded">
                WHERE {f.column} {f.operator} {f.value}
              </code>
              <div className="text-[10px] text-[var(--etihuku-gray-500)] mt-1">
                {f.description}
                {f.rowsFiltered != null && ` · ${f.rowsFiltered.toLocaleString()} rows filtered`}
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {f.appliesTo.map(role => (
                  <span key={role} className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--etihuku-gray-800)] text-[var(--etihuku-gray-400)]">{role}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div onClick={() => toggleFilter(f.id)} className={cn("w-7 h-3.5 rounded-full relative cursor-pointer transition-all", f.active ? "bg-[var(--etihuku-indigo)]" : "bg-[var(--etihuku-gray-700)]")}>
                <div className={cn("absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all", f.active ? "left-3.5" : "left-0.5")} />
              </div>
              <button onClick={() => deleteFilter(f.id)} className="text-[var(--etihuku-gray-600)] hover:text-red-400 transition-colors">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
