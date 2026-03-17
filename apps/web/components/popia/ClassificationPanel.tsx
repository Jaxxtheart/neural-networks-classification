"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Shield, Tag, AlertTriangle, Search, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type DataClass = "personal" | "special" | "children" | "non-personal" | "public";
type Sensitivity = "high" | "medium" | "low" | "none";

interface ColumnRecord {
  id: string;
  dataset: string;
  column: string;
  dataClass: DataClass;
  sensitivity: Sensitivity;
  aiDetected: boolean;
  confirmed: boolean;
  sampleValue: string;
  rowCount: number;
  nullPct: number;
}

const CLASS_CONFIG: Record<DataClass, { label: string; color: string; description: string }> = {
  personal:     { label: "Personal",        color: "#F59E0B", description: "Information that identifies a natural person" },
  special:      { label: "Special Personal", color: "#EF4444", description: "Health, race, religion, biometric data" },
  children:     { label: "Children's",       color: "#EC4899", description: "Data relating to persons under 18" },
  "non-personal": { label: "Non-Personal",   color: "#3B82F6", description: "Does not identify a person" },
  public:       { label: "Public",           color: "#10B981", description: "Publicly available information" },
};

const SENSITIVITY_CONFIG: Record<Sensitivity, { color: string; bg: string }> = {
  high:   { color: "#EF4444", bg: "bg-red-950/30" },
  medium: { color: "#F59E0B", bg: "bg-amber-950/30" },
  low:    { color: "#3B82F6", bg: "bg-blue-950/20" },
  none:   { color: "#6B7280", bg: "bg-transparent" },
};

const MOCK_COLUMNS: ColumnRecord[] = [
  { id: "c1",  dataset: "CDR Raw DB",           column: "msisdn",           dataClass: "personal",     sensitivity: "high",   aiDetected: true,  confirmed: true,  sampleValue: "27831234567",      rowCount: 4200000, nullPct: 0 },
  { id: "c2",  dataset: "CDR Raw DB",           column: "call_duration",    dataClass: "non-personal", sensitivity: "none",   aiDetected: false, confirmed: true,  sampleValue: "120",              rowCount: 4200000, nullPct: 2 },
  { id: "c3",  dataset: "CDR Raw DB",           column: "imei",             dataClass: "personal",     sensitivity: "high",   aiDetected: true,  confirmed: true,  sampleValue: "358240051111110",  rowCount: 4200000, nullPct: 3 },
  { id: "c4",  dataset: "CDR Raw DB",           column: "cell_id",          dataClass: "personal",     sensitivity: "medium", aiDetected: true,  confirmed: false, sampleValue: "MNO-CELL-4452",    rowCount: 4200000, nullPct: 0 },
  { id: "c5",  dataset: "Customer DWH",         column: "id_number",        dataClass: "special",      sensitivity: "high",   aiDetected: true,  confirmed: true,  sampleValue: "8001015009087",    rowCount:  980000, nullPct: 8 },
  { id: "c6",  dataset: "Customer DWH",         column: "full_name",        dataClass: "personal",     sensitivity: "high",   aiDetected: true,  confirmed: true,  sampleValue: "Jane Doe",         rowCount:  980000, nullPct: 1 },
  { id: "c7",  dataset: "Customer DWH",         column: "date_of_birth",    dataClass: "personal",     sensitivity: "high",   aiDetected: true,  confirmed: true,  sampleValue: "1985-06-12",       rowCount:  980000, nullPct: 4 },
  { id: "c8",  dataset: "Customer DWH",         column: "email_address",    dataClass: "personal",     sensitivity: "high",   aiDetected: true,  confirmed: true,  sampleValue: "jane@example.com", rowCount:  980000, nullPct: 6 },
  { id: "c9",  dataset: "Customer DWH",         column: "account_status",   dataClass: "non-personal", sensitivity: "low",    aiDetected: false, confirmed: true,  sampleValue: "active",           rowCount:  980000, nullPct: 0 },
  { id: "c10", dataset: "CCTV Training Set",    column: "face_embedding",   dataClass: "special",      sensitivity: "high",   aiDetected: true,  confirmed: true,  sampleValue: "[0.23, 0.11, …]",  rowCount:   86000, nullPct: 12 },
  { id: "c11", dataset: "CCTV Training Set",    column: "timestamp",        dataClass: "non-personal", sensitivity: "low",    aiDetected: false, confirmed: true,  sampleValue: "2026-02-14T12:00", rowCount:   86000, nullPct: 0 },
  { id: "c12", dataset: "Medical Records (Eng)",column: "patient_id",       dataClass: "special",      sensitivity: "high",   aiDetected: true,  confirmed: false, sampleValue: "PAT-00192",        rowCount:   12000, nullPct: 0 },
  { id: "c13", dataset: "Mineworker DB",        column: "worker_name",      dataClass: "personal",     sensitivity: "high",   aiDetected: true,  confirmed: true,  sampleValue: "T. Khumalo",       rowCount:    4500, nullPct: 0 },
  { id: "c14", dataset: "Mineworker DB",        column: "biometric_hash",   dataClass: "special",      sensitivity: "high",   aiDetected: true,  confirmed: false, sampleValue: "sha256:a1b2c3…",   rowCount:    4500, nullPct: 15 },
  { id: "c15", dataset: "Public Network Stats", column: "region_name",      dataClass: "public",       sensitivity: "none",   aiDetected: false, confirmed: true,  sampleValue: "Gauteng",          rowCount:  240000, nullPct: 0 },
];

export function ClassificationPanel() {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<DataClass | "all">("all");
  const [unconfirmedOnly, setUnconfirmedOnly] = useState(false);
  const [columns, setColumns] = useState<ColumnRecord[]>(MOCK_COLUMNS);
  const [isScanning, setIsScanning] = useState(false);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (scanTimerRef.current) clearTimeout(scanTimerRef.current); }, []);

  // Derive filtered list and stats in a single memo pass
  const { filtered, stats } = useMemo(() => {
    const filtered: ColumnRecord[] = [];
    const stats = { personal: 0, special: 0, children: 0, unconfirmed: 0 };
    const lSearch = search.toLowerCase();

    for (const c of columns) {
      // Accumulate stats over all columns regardless of filter
      if (c.dataClass === "personal") stats.personal++;
      if (c.dataClass === "special")  stats.special++;
      if (c.dataClass === "children") stats.children++;
      if (!c.confirmed)               stats.unconfirmed++;

      // Apply filters
      if (classFilter !== "all" && c.dataClass !== classFilter) continue;
      if (unconfirmedOnly && c.confirmed) continue;
      if (lSearch && !c.column.toLowerCase().includes(lSearch) && !c.dataset.toLowerCase().includes(lSearch)) continue;
      filtered.push(c);
    }
    return { filtered, stats };
  }, [columns, classFilter, unconfirmedOnly, search]);

  function confirm(id: string, cls: DataClass) {
    setColumns(prev => prev.map(c => c.id === id ? { ...c, confirmed: true, dataClass: cls } : c));
  }

  function runScan() {
    if (isScanning) return;
    setIsScanning(true);
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    scanTimerRef.current = setTimeout(() => setIsScanning(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Personal Data",     value: stats.personal,    color: "#F59E0B" },
          { label: "Special Personal",  value: stats.special,     color: "#EF4444" },
          { label: "Children's Data",   value: stats.children,    color: "#EC4899" },
          { label: "Needs Review",      value: stats.unconfirmed, color: "#8B5CF6" },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-[var(--etihuku-gray-800)] bg-[var(--etihuku-gray-900)] p-3 text-center">
            <div className="text-xl font-display font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] text-[var(--etihuku-gray-500)] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--etihuku-gray-500)]" />
          <input className="form-input pl-8 text-xs" placeholder="Search columns or datasets…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {(["all", ...Object.keys(CLASS_CONFIG)] as (DataClass | "all")[]).map(cls => (
            <button
              key={cls}
              onClick={() => setClassFilter(cls)}
              className={cn(
                "px-2 py-1 rounded text-[10px] font-medium border transition-all capitalize",
                classFilter === cls
                  ? "border-[var(--etihuku-indigo)] bg-[var(--etihuku-indigo)]/10 text-[var(--etihuku-indigo)]"
                  : "border-[var(--etihuku-gray-700)] text-[var(--etihuku-gray-400)]"
              )}
              style={classFilter === cls && cls !== "all" ? { borderColor: CLASS_CONFIG[cls as DataClass].color, backgroundColor: `${CLASS_CONFIG[cls as DataClass].color}15`, color: CLASS_CONFIG[cls as DataClass].color } : {}}
            >
              {cls === "all" ? "All" : CLASS_CONFIG[cls as DataClass].label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-[var(--etihuku-gray-400)]">
          <input type="checkbox" className="accent-[var(--etihuku-indigo)]" checked={unconfirmedOnly} onChange={e => setUnconfirmedOnly(e.target.checked)} />
          Needs review
        </label>
        <button onClick={runScan} disabled={isScanning} className="btn btn-secondary text-xs flex items-center gap-1.5">
          <Zap size={12} className={isScanning ? "animate-pulse text-[var(--etihuku-indigo)]" : ""} />
          {isScanning ? "Scanning…" : "Re-scan"}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[var(--etihuku-gray-800)]">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--etihuku-gray-800)] bg-[var(--etihuku-gray-900)]">
              {["Dataset", "Column", "Classification", "Sensitivity", "AI Detected", "Status", "Sample"].map(h => (
                <th key={h} className="px-3 py-2.5 text-left font-medium text-[var(--etihuku-gray-400)] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--etihuku-gray-800)]">
            {filtered.map(col => {
              const cls = CLASS_CONFIG[col.dataClass];
              const sens = SENSITIVITY_CONFIG[col.sensitivity];
              return (
                <tr key={col.id} className={cn("hover:bg-[var(--etihuku-gray-900)]/50", !col.confirmed && "bg-amber-950/10")}>
                  <td className="px-3 py-2 text-[var(--etihuku-gray-300)]">{col.dataset}</td>
                  <td className="px-3 py-2 font-mono text-white">{col.column}</td>
                  <td className="px-3 py-2">
                    {col.confirmed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium" style={{ color: cls.color, backgroundColor: `${cls.color}15` }}>
                        <Shield size={9} /> {cls.label}
                      </span>
                    ) : (
                      <select
                        className="text-[10px] px-2 py-1 rounded border border-amber-700 bg-amber-950/30 text-amber-300 outline-none"
                        value={col.dataClass}
                        onChange={e => confirm(col.id, e.target.value as DataClass)}
                      >
                        {Object.entries(CLASS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium capitalize", sens.bg)} style={{ color: sens.color }}>{col.sensitivity}</span>
                  </td>
                  <td className="px-3 py-2">
                    {col.aiDetected && <span className="flex items-center gap-1 text-[var(--etihuku-indigo)]"><Zap size={9} /> AI</span>}
                  </td>
                  <td className="px-3 py-2">
                    {col.confirmed
                      ? <span className="text-green-400">✓ Confirmed</span>
                      : <span className="text-amber-400 flex items-center gap-1"><AlertTriangle size={10} /> Review</span>
                    }
                  </td>
                  <td className="px-3 py-2 font-mono text-[var(--etihuku-gray-500)] max-w-[120px] truncate">{col.sampleValue}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-8 text-center text-[var(--etihuku-gray-500)] text-sm">No columns match filters</div>
        )}
      </div>
      <div className="text-xs text-[var(--etihuku-gray-500)]">Showing {filtered.length} of {columns.length} columns</div>
    </div>
  );
}
