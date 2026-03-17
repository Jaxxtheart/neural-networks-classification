"use client";

import { useState } from "react";
import { Check, X, Flag, ChevronDown, Filter, Tag } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type RowClass = "normal" | "fraud" | "duplicate" | "incomplete" | "escalate" | null;
type ColFlag = "anomaly" | "null" | "format_error" | "outlier" | null;

interface TableRow {
  id: string;
  msisdn: string;
  amount: number;
  date: string;
  merchant: string;
  status: string;
  country: string;
  rowClass: RowClass;
  colFlags: Record<string, ColFlag>;
  aiSuggestion?: { class: RowClass; confidence: number };
  reviewed: boolean;
}

const ROW_CLASS_CONFIG: Record<NonNullable<RowClass>, { label: string; color: string; bg: string }> = {
  normal:     { label: "Normal",      color: "#10B981", bg: "bg-green-950/30"  },
  fraud:      { label: "Fraud",       color: "#EF4444", bg: "bg-red-950/30"    },
  duplicate:  { label: "Duplicate",   color: "#F59E0B", bg: "bg-amber-950/30"  },
  incomplete: { label: "Incomplete",  color: "#8B5CF6", bg: "bg-violet-950/30" },
  escalate:   { label: "Escalate",    color: "#EC4899", bg: "bg-pink-950/30"   },
};

const COL_FLAG_CONFIG: Record<NonNullable<ColFlag>, { label: string; color: string }> = {
  anomaly:      { label: "Anomaly",      color: "#EF4444" },
  null:         { label: "Null",         color: "#6B6B88" },
  format_error: { label: "Format Error", color: "#F59E0B" },
  outlier:      { label: "Outlier",      color: "#8B5CF6" },
};

const COLUMNS = ["msisdn", "amount", "date", "merchant", "status", "country"];

const MOCK_ROWS: TableRow[] = [
  { id: "r1",  msisdn: "+27829001234", amount: 487.50,  date: "2026-02-14", merchant: "Shell Sandton",    status: "completed", country: "ZA",  rowClass: null,       colFlags: {},                          aiSuggestion: { class: "normal", confidence: 0.91 }, reviewed: false },
  { id: "r2",  msisdn: "+27761234567", amount: 12840.00,date: "2026-02-14", merchant: "Unknown Merchant", status: "pending",   country: "NG",  rowClass: null,       colFlags: { amount: "outlier" },       aiSuggestion: { class: "fraud",  confidence: 0.87 }, reviewed: false },
  { id: "r3",  msisdn: "+27829001234", amount: 487.50,  date: "2026-02-14", merchant: "Shell Sandton",    status: "completed", country: "ZA",  rowClass: null,       colFlags: {},                          aiSuggestion: { class: "duplicate", confidence: 0.99 }, reviewed: false },
  { id: "r4",  msisdn: "+27831234567", amount: 0,       date: "2026-02-13", merchant: "",                 status: "failed",    country: "ZA",  rowClass: null,       colFlags: { amount: "null", merchant: "null" }, aiSuggestion: { class: "incomplete", confidence: 0.95 }, reviewed: false },
  { id: "r5",  msisdn: "+27729876543", amount: 234.00,  date: "2026-02-13", merchant: "Pick n Pay",       status: "completed", country: "ZA",  rowClass: "normal",   colFlags: {},                          reviewed: true  },
  { id: "r6",  msisdn: "+2772abc3456", amount: 150.00,  date: "2026-02-12", merchant: "Woolworths",       status: "completed", country: "ZA",  rowClass: null,       colFlags: { msisdn: "format_error" }, aiSuggestion: { class: "incomplete", confidence: 0.82 }, reviewed: false },
  { id: "r7",  msisdn: "+27839001234", amount: 8750.00, date: "2026-02-11", merchant: "Forex Transfer",   status: "completed", country: "KE",  rowClass: null,       colFlags: { amount: "anomaly" },       aiSuggestion: { class: "escalate", confidence: 0.78 }, reviewed: false },
];

export function TabularAnnotator() {
  const [rows, setRows] = useState<TableRow[]>(MOCK_ROWS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filterUnreviewed, setFilterUnreviewed] = useState(false);
  const [bulkClass, setBulkClass] = useState<RowClass>(null);

  function setRowClass(id: string, cls: RowClass) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, rowClass: cls, reviewed: true } : r));
  }

  function acceptAI(id: string) {
    setRows(prev => prev.map(r =>
      r.id === id && r.aiSuggestion ? { ...r, rowClass: r.aiSuggestion.class, reviewed: true } : r
    ));
  }

  function setColFlag(rowId: string, col: string, flag: ColFlag) {
    setRows(prev => prev.map(r =>
      r.id === rowId ? { ...r, colFlags: { ...r.colFlags, [col]: flag } } : r
    ));
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  function applyBulk() {
    if (!bulkClass) return;
    setRows(prev => prev.map(r => selected.has(r.id) ? { ...r, rowClass: bulkClass, reviewed: true } : r));
    setSelected(new Set());
  }

  const displayed = filterUnreviewed ? rows.filter(r => !r.reviewed) : rows;
  const reviewed = rows.filter(r => r.reviewed).length;

  return (
    <div className="space-y-4">
      {/* Header stats + controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-3">
          <div className="card text-center px-4 py-2">
            <div className="text-lg font-display font-bold text-[var(--etihuku-gold)]">{reviewed}/{rows.length}</div>
            <div className="text-[10px] text-[var(--etihuku-gray-500)]">Reviewed</div>
          </div>
          <div className="card text-center px-4 py-2">
            <div className="text-lg font-display font-bold text-red-400">{rows.filter(r => r.aiSuggestion?.class === "fraud").length}</div>
            <div className="text-[10px] text-[var(--etihuku-gray-500)]">Fraud Flagged</div>
          </div>
          <div className="card text-center px-4 py-2">
            <div className="text-lg font-display font-bold text-[var(--etihuku-indigo)]">{rows.filter(r => r.aiSuggestion && !r.reviewed).length}</div>
            <div className="text-[10px] text-[var(--etihuku-gray-500)]">AI Pending</div>
          </div>
        </div>

        <div className="flex gap-2 ml-auto flex-wrap items-center">
          {selected.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--etihuku-gray-400)]">{selected.size} selected:</span>
              <select
                value={bulkClass ?? ""}
                onChange={e => setBulkClass(e.target.value as RowClass)}
                className="form-input text-xs py-1 px-2 h-7 w-auto"
              >
                <option value="">Bulk classify…</option>
                {Object.entries(ROW_CLASS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <button onClick={applyBulk} disabled={!bulkClass} className="btn btn-primary btn-sm text-xs disabled:opacity-40">Apply</button>
            </div>
          )}
          <button
            onClick={() => setFilterUnreviewed(f => !f)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs transition-all",
              filterUnreviewed ? "bg-[var(--etihuku-indigo)]/10 border-[var(--etihuku-indigo)] text-[var(--etihuku-indigo)]" : "border-[var(--etihuku-gray-700)] text-[var(--etihuku-gray-400)]"
            )}
          >
            <Filter size={11} /> Unreviewed only
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[var(--etihuku-gray-800)]">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--etihuku-gray-800)] bg-[var(--etihuku-gray-900)]">
              <th className="px-3 py-2.5 text-left w-8">
                <input
                  type="checkbox"
                  className="accent-[var(--etihuku-indigo)]"
                  onChange={e => setSelected(e.target.checked ? new Set(displayed.map(r => r.id)) : new Set())}
                  checked={selected.size === displayed.length && displayed.length > 0}
                />
              </th>
              {COLUMNS.map(col => (
                <th key={col} className="px-3 py-2.5 text-left font-medium text-[var(--etihuku-gray-400)] uppercase tracking-wide whitespace-nowrap">
                  {col}
                </th>
              ))}
              <th className="px-3 py-2.5 text-left font-medium text-[var(--etihuku-gray-400)] uppercase tracking-wide">AI</th>
              <th className="px-3 py-2.5 text-left font-medium text-[var(--etihuku-gray-400)] uppercase tracking-wide">Label</th>
              <th className="px-3 py-2.5 text-left font-medium text-[var(--etihuku-gray-400)] uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map(row => {
              const rc = row.rowClass ? ROW_CLASS_CONFIG[row.rowClass] : null;
              return (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-[var(--etihuku-gray-800)] transition-colors",
                    selected.has(row.id) ? "bg-[var(--etihuku-indigo)]/5" : "hover:bg-[var(--etihuku-gray-900)]",
                    rc?.bg
                  )}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      className="accent-[var(--etihuku-indigo)]"
                      checked={selected.has(row.id)}
                      onChange={() => toggleSelect(row.id)}
                    />
                  </td>

                  {COLUMNS.map(col => {
                    const flag = row.colFlags[col];
                    const flagCfg = flag ? COL_FLAG_CONFIG[flag] : null;
                    const val = row[col as keyof TableRow];
                    const displayVal = col === "amount" ? `R ${(val as number).toFixed(2)}` : String(val || "—");
                    return (
                      <td key={col} className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "font-mono whitespace-nowrap",
                            flagCfg ? "" : "text-[var(--etihuku-gray-200)]",
                            !val && "text-[var(--etihuku-gray-600)]"
                          )} style={flagCfg ? { color: flagCfg.color } : {}}>
                            {displayVal}
                          </span>
                          {flagCfg && (
                            <span
                              className="text-[8px] px-1 py-0.5 rounded font-bold uppercase tracking-wide"
                              style={{ backgroundColor: `${flagCfg.color}20`, color: flagCfg.color }}
                            >
                              {flagCfg.label}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  {/* AI suggestion */}
                  <td className="px-3 py-2">
                    {row.aiSuggestion ? (
                      <div className="flex items-center gap-1">
                        <span className="font-medium" style={{ color: ROW_CLASS_CONFIG[row.aiSuggestion.class!]?.color }}>
                          {ROW_CLASS_CONFIG[row.aiSuggestion.class!]?.label}
                        </span>
                        <span className="text-[var(--etihuku-gray-600)] text-[9px]">
                          {Math.round(row.aiSuggestion.confidence * 100)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-[var(--etihuku-gray-600)]">—</span>
                    )}
                  </td>

                  {/* Current label */}
                  <td className="px-3 py-2">
                    <select
                      value={row.rowClass ?? ""}
                      onChange={e => setRowClass(row.id, e.target.value as RowClass || null)}
                      className={cn(
                        "form-input text-xs py-0.5 px-2 h-6 w-auto",
                        rc && `border-transparent`
                      )}
                      style={rc ? { color: rc.color, backgroundColor: `${rc.color}15`, borderColor: `${rc.color}40` } : {}}
                    >
                      <option value="">Unclassified</option>
                      {Object.entries(ROW_CLASS_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2">
                    {row.aiSuggestion && !row.reviewed && (
                      <button
                        onClick={() => acceptAI(row.id)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-[var(--etihuku-indigo)]/10 border border-[var(--etihuku-indigo)]/30 text-[var(--etihuku-indigo)] hover:bg-[var(--etihuku-indigo)]/20 transition-all"
                      >
                        <Check size={9} /> Accept AI
                      </button>
                    )}
                    {row.reviewed && !row.aiSuggestion && (
                      <span className="text-green-500 flex items-center gap-1">
                        <Check size={11} /> Done
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
