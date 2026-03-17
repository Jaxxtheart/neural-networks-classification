"use client";

import { useState, useMemo } from "react";
import { Search, Download, Shield, Eye, Edit2, Trash2, LogIn, Database, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";

type AuditAction = "READ" | "WRITE" | "DELETE" | "LOGIN" | "EXPORT" | "SCHEMA_CHANGE" | "PERMISSION_CHANGE";

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: AuditAction;
  dataset?: string;
  column?: string;
  query?: string;
  ip: string;
  result: "success" | "denied" | "error";
  rowsAffected?: number;
}

const ACTION_CONFIG: Record<AuditAction, { color: string; icon: React.ElementType; label: string }> = {
  READ:             { color: "#3B82F6", icon: Eye,             label: "Read"            },
  WRITE:            { color: "#10B981", icon: Edit2,           label: "Write"           },
  DELETE:           { color: "#EF4444", icon: Trash2,          label: "Delete"          },
  LOGIN:            { color: "#8B5CF6", icon: LogIn,           label: "Login"           },
  EXPORT:           { color: "#F59E0B", icon: Download,        label: "Export"          },
  SCHEMA_CHANGE:    { color: "#EC4899", icon: Database,        label: "Schema Change"   },
  PERMISSION_CHANGE:{ color: "#F97316", icon: Shield,          label: "Permission Change"},
};

const MOCK_ENTRIES: AuditEntry[] = [
  { id: "ae1",  timestamp: "2026-03-02 08:47:12", user: "j.smith@etihuku.io",  role: "Analyst",       action: "READ",             dataset: "Churn Feature Set",    ip: "10.0.1.42",  result: "success", rowsAffected: 50000 },
  { id: "ae2",  timestamp: "2026-03-02 08:44:55", user: "d.patel@etihuku.io",  role: "Data Engineer", action: "WRITE",            dataset: "Customer DWH",         ip: "10.0.1.18",  result: "success", rowsAffected: 1240  },
  { id: "ae3",  timestamp: "2026-03-02 08:42:31", user: "m.sithole@etihuku.io",role: "ML Engineer",   action: "READ",             dataset: "CDR Raw DB",           ip: "10.0.2.5",   result: "denied",  query: "SELECT msisdn, cell_id FROM cdr LIMIT 10000" },
  { id: "ae4",  timestamp: "2026-03-02 08:40:08", user: "admin@etihuku.io",    role: "Admin",         action: "PERMISSION_CHANGE",dataset: "Mineworker DB",         ip: "10.0.0.1",   result: "success" },
  { id: "ae5",  timestamp: "2026-03-02 08:38:22", user: "j.smith@etihuku.io",  role: "Analyst",       action: "EXPORT",           dataset: "Churn Feature Set",    ip: "10.0.1.42",  result: "success", rowsAffected: 5000 },
  { id: "ae6",  timestamp: "2026-03-02 08:35:14", user: "a.nkosi@etihuku.io",  role: "DPO",           action: "READ",             dataset: "Customer DWH",         ip: "10.0.3.20",  result: "success", rowsAffected: 980000, query: "SELECT * FROM customers WHERE popia_review = true" },
  { id: "ae7",  timestamp: "2026-03-02 08:32:01", user: "t.brand@etihuku.io",  role: "Viewer",        action: "READ",             dataset: "Customer DWH",         ip: "10.0.4.11",  result: "denied",  query: "SELECT id_number, bank_account FROM customers" },
  { id: "ae8",  timestamp: "2026-03-02 08:29:45", user: "d.patel@etihuku.io",  role: "Data Engineer", action: "SCHEMA_CHANGE",    dataset: "Sensor Feature Store", ip: "10.0.1.18",  result: "success" },
  { id: "ae9",  timestamp: "2026-03-02 08:26:30", user: "k.mokoena@etihuku.io",role: "ML Engineer",   action: "READ",             dataset: "CCTV Training Set",    ip: "10.0.2.8",   result: "success", rowsAffected: 86000 },
  { id: "ae10", timestamp: "2026-03-02 08:24:10", user: "j.smith@etihuku.io",  role: "Analyst",       action: "READ",             dataset: "Network KPI Store",    ip: "10.0.1.42",  result: "success", rowsAffected: 12000 },
  { id: "ae11", timestamp: "2026-03-02 08:20:55", user: "admin@etihuku.io",    role: "Admin",         action: "DELETE",           dataset: "CDR Raw DB",           ip: "10.0.0.1",   result: "success", rowsAffected: 1200000 },
  { id: "ae12", timestamp: "2026-03-02 08:18:33", user: "unknown@ext.com",      role: "—",             action: "LOGIN",                                             ip: "197.84.22.1", result: "denied" },
  { id: "ae13", timestamp: "2026-03-02 08:15:00", user: "a.nkosi@etihuku.io",  role: "DPO",           action: "EXPORT",           dataset: "Customer DWH",         ip: "10.0.3.20",  result: "success", rowsAffected: 15000 },
  { id: "ae14", timestamp: "2026-03-02 08:12:22", user: "m.sithole@etihuku.io",role: "ML Engineer",   action: "WRITE",            dataset: "Churn Feature Set",    ip: "10.0.2.5",   result: "success", rowsAffected: 3900000 },
  { id: "ae15", timestamp: "2026-03-02 08:08:11", user: "l.van@etihuku.io",    role: "Data Engineer", action: "READ",             dataset: "Inspection Training",  ip: "10.0.1.55",  result: "success", rowsAffected: 2400 },
];

export function AuditTrail() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<AuditAction | "all">("all");
  const [resultFilter, setResultFilter] = useState<"all" | "success" | "denied" | "error">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => MOCK_ENTRIES.filter(e =>
    (actionFilter === "all" || e.action === actionFilter) &&
    (resultFilter === "all" || e.result === resultFilter) &&
    (
      e.user.toLowerCase().includes(search.toLowerCase()) ||
      (e.dataset ?? "").toLowerCase().includes(search.toLowerCase()) ||
      e.ip.includes(search) ||
      (e.query ?? "").toLowerCase().includes(search.toLowerCase())
    )
  ), [search, actionFilter, resultFilter]);

  // Compute summary stats once from the full log (not the filtered view)
  const { deniedCount, uniqueUsers, exportCount } = useMemo(() => ({
    deniedCount: MOCK_ENTRIES.filter(e => e.result === "denied").length,
    uniqueUsers: new Set(MOCK_ENTRIES.map(e => e.user)).size,
    exportCount: MOCK_ENTRIES.filter(e => e.action === "EXPORT").length,
  }), []); // MOCK_ENTRIES is module-level constant

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Events (today)",    value: MOCK_ENTRIES.length.toString(), color: "#3B82F6" },
          { label: "Denied",            value: deniedCount.toString(),          color: "#EF4444" },
          { label: "Unique Users",      value: uniqueUsers.toString(),          color: "#8B5CF6" },
          { label: "Exports Today",     value: exportCount.toString(),          color: "#F59E0B" },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-[var(--etihuku-gray-800)] bg-[var(--etihuku-gray-900)] p-3 text-center">
            <div className="text-2xl font-display font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] text-[var(--etihuku-gray-500)] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--etihuku-gray-500)]" />
          <input className="form-input pl-8 text-xs" placeholder="Search user, dataset, IP, query…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input text-xs py-1.5" value={actionFilter} onChange={e => setActionFilter(e.target.value as AuditAction | "all")}>
          <option value="all">All actions</option>
          {(Object.entries(ACTION_CONFIG) as [AuditAction, typeof ACTION_CONFIG[AuditAction]][]).map(([a, cfg]) => (
            <option key={a} value={a}>{cfg.label}</option>
          ))}
        </select>
        <select className="form-input text-xs py-1.5" value={resultFilter} onChange={e => setResultFilter(e.target.value as "all" | "success" | "denied" | "error")}>
          <option value="all">All results</option>
          <option value="success">Success</option>
          <option value="denied">Denied</option>
          <option value="error">Error</option>
        </select>
        <button className="btn btn-secondary btn-sm text-xs flex items-center gap-1">
          <Download size={11} /> Export
        </button>
        <button className="btn btn-secondary btn-sm text-xs flex items-center gap-1">
          <RefreshCw size={11} /> Refresh
        </button>
      </div>

      {/* Log table */}
      <div className="rounded-lg border border-[var(--etihuku-gray-800)] overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--etihuku-gray-800)] bg-[var(--etihuku-gray-900)]">
              {["Timestamp", "User / Role", "Action", "Dataset", "IP Address", "Result", "Rows"].map(h => (
                <th key={h} className="px-3 py-2.5 text-left font-medium text-[var(--etihuku-gray-400)] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--etihuku-gray-800)]">
            {filtered.map(entry => {
              const aCfg = ACTION_CONFIG[entry.action];
              const AIcon = aCfg.icon;
              const isExpanded = expandedId === entry.id;
              const isDenied = entry.result === "denied";
              return (
                <>
                  <tr
                    key={entry.id}
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    className={cn(
                      "cursor-pointer hover:bg-[var(--etihuku-gray-900)]/50 transition-all",
                      isDenied && "bg-red-950/10",
                      isExpanded && "bg-[var(--etihuku-gray-900)]"
                    )}
                  >
                    <td className="px-3 py-2 font-mono text-[var(--etihuku-gray-400)] whitespace-nowrap">{entry.timestamp}</td>
                    <td className="px-3 py-2">
                      <div className="text-white text-[11px]">{entry.user}</div>
                      <div className="text-[9px] text-[var(--etihuku-gray-500)]">{entry.role}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1 font-medium" style={{ color: aCfg.color }}>
                        <AIcon size={10} /> {aCfg.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[var(--etihuku-gray-300)]">{entry.dataset ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-[var(--etihuku-gray-400)]">{entry.ip}</td>
                    <td className="px-3 py-2">
                      <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded capitalize",
                        entry.result === "success" ? "text-green-400 bg-green-950/30" :
                        entry.result === "denied"  ? "text-red-400 bg-red-950/30" :
                                                     "text-amber-400 bg-amber-950/30"
                      )}>{entry.result}</span>
                    </td>
                    <td className="px-3 py-2 font-mono text-[var(--etihuku-gray-400)]">
                      {entry.rowsAffected != null ? formatNumber(entry.rowsAffected) : "—"}
                    </td>
                  </tr>
                  {isExpanded && entry.query && (
                    <tr key={`${entry.id}-exp`} className={cn(isDenied ? "bg-red-950/20" : "bg-[var(--etihuku-gray-900)]/70")}>
                      <td colSpan={7} className="px-6 pb-3 pt-1">
                        <div className="text-[10px] text-[var(--etihuku-gray-500)] mb-1">Query</div>
                        <code className="text-xs text-[var(--etihuku-indigo)] bg-[var(--etihuku-indigo)]/5 px-3 py-1.5 rounded block font-mono">{entry.query}</code>
                        {isDenied && (
                          <div className="text-[10px] text-red-400 mt-1.5 flex items-center gap-1">
                            <Shield size={10} /> Access denied — column masking or row filter prevented this query
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-8 text-center text-[var(--etihuku-gray-500)] text-sm">No audit events match filters</div>
        )}
      </div>
      <div className="text-xs text-[var(--etihuku-gray-500)]">
        Showing {filtered.length} of {MOCK_ENTRIES.length} events · Click a row to view query details
      </div>
    </div>
  );
}
