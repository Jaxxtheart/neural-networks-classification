"use client";

import { useState } from "react";
import {
  Plus, Trash2, CheckCircle2, XCircle, Clock, Edit2,
  Shield, Hash, Calendar, Code2, AlertTriangle, ChevronDown, X
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

type RuleType = "range" | "format" | "referential" | "freshness" | "sql";
type RuleStatus = "active" | "inactive" | "failing";
type Vertical = "all" | "telecom" | "security" | "mining" | "engineering";

interface QualityRule {
  id: string;
  name: string;
  type: RuleType;
  column?: string;
  description: string;
  status: RuleStatus;
  vertical: Vertical;
  lastChecked: string;
  passRate: number;
  config: Record<string, string | number>;
}

const MOCK_RULES: QualityRule[] = [
  {
    id: "r1", name: "MSISDN Format", type: "format", column: "msisdn", vertical: "telecom",
    description: "South African mobile numbers: +27 prefix, 11 digits total",
    status: "active", lastChecked: "2m ago", passRate: 99.7,
    config: { pattern: "^\\+27[6-8][0-9]{8}$" },
  },
  {
    id: "r2", name: "Call Duration Range", type: "range", column: "call_duration_sec", vertical: "all",
    description: "Duration must be between 0 and 86400 seconds",
    status: "active", lastChecked: "2m ago", passRate: 98.8,
    config: { min: 0, max: 86400 },
  },
  {
    id: "r3", name: "Timestamp Freshness", type: "freshness", column: "event_timestamp", vertical: "all",
    description: "Data must arrive within 2 hours of event time",
    status: "active", lastChecked: "2m ago", passRate: 97.1,
    config: { maxAgeHours: 2 },
  },
  {
    id: "r4", name: "RICA Email Validation", type: "format", column: "email", vertical: "telecom",
    description: "RICA-compliant email format per telecom regulation",
    status: "failing", lastChecked: "2m ago", passRate: 71.3,
    config: { pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" },
  },
  {
    id: "r5", name: "Sensor Reading Anomaly", type: "sql", column: "sensor_value", vertical: "mining",
    description: "Custom SQL to detect anomalous sensor readings vs. 7-day baseline",
    status: "active", lastChecked: "5m ago", passRate: 99.2,
    config: { sql: "SELECT count(*) FROM readings WHERE ABS(value - (SELECT AVG(value) FROM readings_7d)) > 3 * stddev" },
  },
  {
    id: "r6", name: "Customer ID Referential Integrity", type: "referential", column: "customer_id", vertical: "all",
    description: "customer_id must exist in the master customer table",
    status: "inactive", lastChecked: "1h ago", passRate: 100,
    config: { referenceTable: "customers", referenceColumn: "id" },
  },
];

const RULE_TYPE_CONFIG: Record<RuleType, { icon: React.ElementType; label: string; color: string }> = {
  range:       { icon: Hash,          label: "Range Check",  color: "#5046E5" },
  format:      { icon: Shield,        label: "Format",       color: "#10B981" },
  referential: { icon: CheckCircle2,  label: "Referential",  color: "#8B5CF6" },
  freshness:   { icon: Clock,         label: "Freshness",    color: "#F59E0B" },
  sql:         { icon: Code2,         label: "Custom SQL",   color: "#EC4899" },
};

const STATUS_CONFIG: Record<RuleStatus, { label: string; color: string; icon: React.ElementType }> = {
  active:   { label: "Active",   color: "#10B981", icon: CheckCircle2  },
  inactive: { label: "Inactive", color: "#6B6B88", icon: Clock         },
  failing:  { label: "Failing",  color: "#EF4444", icon: XCircle       },
};

const VERTICAL_COLORS: Record<Vertical, string> = {
  all:         "#6B6B88",
  telecom:     "#8B5CF6",
  security:    "#F59E0B",
  mining:      "#10B981",
  engineering: "#EC4899",
};

type NewRuleType = {
  name: string; type: RuleType; column: string; vertical: Vertical;
  minValue: string; maxValue: string; pattern: string;
  refTable: string; refColumn: string; maxAgeHours: string; sql: string;
};

export function RuleEnginePanel() {
  const [rules, setRules] = useState<QualityRule[]>(MOCK_RULES);
  const [filterStatus, setFilterStatus] = useState<RuleStatus | "all">("all");
  const [filterVertical, setFilterVertical] = useState<Vertical | "all">("all");
  const [showNewRule, setShowNewRule] = useState(false);
  const [newRule, setNewRule] = useState<NewRuleType>({
    name: "", type: "range", column: "", vertical: "all",
    minValue: "", maxValue: "", pattern: "",
    refTable: "", refColumn: "", maxAgeHours: "2", sql: "",
  });

  const filtered = rules.filter(r =>
    (filterStatus === "all" || r.status === filterStatus) &&
    (filterVertical === "all" || r.vertical === filterVertical || r.vertical === "all")
  );

  function deleteRule(id: string) {
    setRules(prev => prev.filter(r => r.id !== id));
  }

  function toggleStatus(id: string) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, status: r.status === "active" ? "inactive" : "active" } : r));
  }

  function addRule() {
    const rule: QualityRule = {
      id: `r-${Date.now()}`,
      name: newRule.name || "Unnamed Rule",
      type: newRule.type,
      column: newRule.column || undefined,
      description: `${RULE_TYPE_CONFIG[newRule.type].label} rule on ${newRule.column || "dataset"}`,
      status: "active",
      vertical: newRule.vertical,
      lastChecked: "Never",
      passRate: 100,
      config: newRule.type === "range"       ? { min: Number(newRule.minValue), max: Number(newRule.maxValue) } :
              newRule.type === "format"      ? { pattern: newRule.pattern } :
              newRule.type === "referential" ? { referenceTable: newRule.refTable, referenceColumn: newRule.refColumn } :
              newRule.type === "freshness"   ? { maxAgeHours: Number(newRule.maxAgeHours) } :
                                              { sql: newRule.sql },
    };
    setRules(prev => [rule, ...prev]);
    setShowNewRule(false);
    setNewRule({ name: "", type: "range", column: "", vertical: "all", minValue: "", maxValue: "", pattern: "", refTable: "", refColumn: "", maxAgeHours: "2", sql: "" });
  }

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {(["all", "active", "failing", "inactive"] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "px-3 py-1 rounded text-xs font-medium border transition-all capitalize",
                filterStatus === s
                  ? s === "failing" ? "border-red-500 bg-red-950/50 text-red-300"
                  : "border-[var(--etihuku-indigo)] bg-[var(--etihuku-indigo)]/10 text-[var(--etihuku-indigo)]"
                  : "border-[var(--etihuku-gray-700)] text-[var(--etihuku-gray-400)] hover:border-[var(--etihuku-gray-600)]"
              )}
            >
              {s === "all" ? `All (${rules.length})` : s}
              {s === "failing" && rules.filter(r => r.status === "failing").length > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full inline-flex items-center justify-center">
                  {rules.filter(r => r.status === "failing").length}
                </span>
              )}
            </button>
          ))}
        </div>
        <button onClick={() => setShowNewRule(true)} className="btn btn-primary btn-sm flex items-center gap-2">
          <Plus size={14} /> New Rule
        </button>
      </div>

      {/* Rules list */}
      <div className="space-y-2">
        {filtered.map(rule => {
          const typeCfg = RULE_TYPE_CONFIG[rule.type];
          const statusCfg = STATUS_CONFIG[rule.status];
          const TypeIcon = typeCfg.icon;
          const StatusIcon = statusCfg.icon;

          return (
            <div key={rule.id} className={cn("card group", rule.status === "failing" && "border-red-900/50")}>
              <div className="flex items-start gap-3">
                {/* Type icon */}
                <div className="w-8 h-8 rounded flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${typeCfg.color}15` }}>
                  <TypeIcon size={16} style={{ color: typeCfg.color }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm text-white">{rule.name}</span>
                    {rule.column && (
                      <span className="text-[10px] font-mono text-[var(--etihuku-gray-400)] bg-[var(--etihuku-gray-800)] px-1.5 py-0.5 rounded">
                        {rule.column}
                      </span>
                    )}
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      style={{ color: VERTICAL_COLORS[rule.vertical], backgroundColor: `${VERTICAL_COLORS[rule.vertical]}15` }}>
                      {rule.vertical === "all" ? "All Verticals" : rule.vertical}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--etihuku-gray-500)] mb-2">{rule.description}</p>

                  {/* Pass rate bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-[var(--etihuku-gray-800)] rounded-full overflow-hidden max-w-40">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${rule.passRate}%`,
                          backgroundColor: rule.passRate >= 95 ? "#10B981" : rule.passRate >= 80 ? "#F59E0B" : "#EF4444"
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono text-[var(--etihuku-gray-400)]">{rule.passRate}% pass</span>
                    <span className="text-xs text-[var(--etihuku-gray-600)]">· {rule.lastChecked}</span>
                  </div>
                </div>

                {/* Status + actions */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <StatusIcon size={12} style={{ color: statusCfg.color }} />
                    <span className="text-xs" style={{ color: statusCfg.color }}>{statusCfg.label}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleStatus(rule.id)}
                      className="p-1 rounded hover:bg-[var(--etihuku-gray-800)] text-[var(--etihuku-gray-500)] hover:text-white"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="p-1 rounded hover:bg-red-950 text-[var(--etihuku-gray-500)] hover:text-red-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="card text-center py-12 text-[var(--etihuku-gray-500)] text-sm">
            No rules match the current filters.
          </div>
        )}
      </div>

      {/* New Rule Modal */}
      {showNewRule && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[var(--etihuku-gray-900)] rounded-xl border border-[var(--etihuku-gray-800)] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--etihuku-gray-800)]">
              <h3 className="text-h4 font-display text-white">New Validation Rule</h3>
              <button onClick={() => setShowNewRule(false)} className="p-1.5 rounded hover:bg-[var(--etihuku-gray-800)] text-[var(--etihuku-gray-400)] hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <FormRow label="Rule Name">
                <input value={newRule.name} onChange={e => setNewRule(p => ({ ...p, name: e.target.value }))} placeholder="e.g. MSISDN Format Check" className="form-input" />
              </FormRow>

              <div className="grid grid-cols-2 gap-3">
                <FormRow label="Rule Type">
                  <select value={newRule.type} onChange={e => setNewRule(p => ({ ...p, type: e.target.value as RuleType }))} className="form-input">
                    {(Object.entries(RULE_TYPE_CONFIG) as [RuleType, typeof RULE_TYPE_CONFIG[RuleType]][]).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </FormRow>
                <FormRow label="Scope Vertical">
                  <select value={newRule.vertical} onChange={e => setNewRule(p => ({ ...p, vertical: e.target.value as Vertical }))} className="form-input">
                    {(["all", "telecom", "security", "mining", "engineering"] as Vertical[]).map(v => (
                      <option key={v} value={v}>{v === "all" ? "All Verticals" : v}</option>
                    ))}
                  </select>
                </FormRow>
              </div>

              <FormRow label="Target Column">
                <input value={newRule.column} onChange={e => setNewRule(p => ({ ...p, column: e.target.value }))} placeholder="column_name (optional)" className="form-input" />
              </FormRow>

              {newRule.type === "range" && (
                <div className="grid grid-cols-2 gap-3">
                  <FormRow label="Min Value">
                    <input type="number" value={newRule.minValue} onChange={e => setNewRule(p => ({ ...p, minValue: e.target.value }))} placeholder="0" className="form-input" />
                  </FormRow>
                  <FormRow label="Max Value">
                    <input type="number" value={newRule.maxValue} onChange={e => setNewRule(p => ({ ...p, maxValue: e.target.value }))} placeholder="1000" className="form-input" />
                  </FormRow>
                </div>
              )}
              {newRule.type === "format" && (
                <FormRow label="Regex Pattern">
                  <input value={newRule.pattern} onChange={e => setNewRule(p => ({ ...p, pattern: e.target.value }))} placeholder="^\\+27[6-8][0-9]{8}$" className="form-input font-mono text-sm" />
                </FormRow>
              )}
              {newRule.type === "referential" && (
                <div className="grid grid-cols-2 gap-3">
                  <FormRow label="Reference Table">
                    <input value={newRule.refTable} onChange={e => setNewRule(p => ({ ...p, refTable: e.target.value }))} placeholder="customers" className="form-input" />
                  </FormRow>
                  <FormRow label="Reference Column">
                    <input value={newRule.refColumn} onChange={e => setNewRule(p => ({ ...p, refColumn: e.target.value }))} placeholder="id" className="form-input" />
                  </FormRow>
                </div>
              )}
              {newRule.type === "freshness" && (
                <FormRow label="Max Age (hours)">
                  <input type="number" value={newRule.maxAgeHours} onChange={e => setNewRule(p => ({ ...p, maxAgeHours: e.target.value }))} placeholder="2" className="form-input" />
                </FormRow>
              )}
              {newRule.type === "sql" && (
                <FormRow label="Custom SQL (must return 0 rows for pass)">
                  <textarea
                    value={newRule.sql}
                    onChange={e => setNewRule(p => ({ ...p, sql: e.target.value }))}
                    rows={3}
                    placeholder="SELECT * FROM {dataset} WHERE condition_that_should_not_be_true"
                    className="form-input font-mono text-sm resize-none"
                  />
                </FormRow>
              )}
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-[var(--etihuku-gray-800)]">
              <button onClick={() => setShowNewRule(false)} className="btn btn-secondary btn-sm">Cancel</button>
              <button onClick={addRule} className="btn btn-primary btn-sm" disabled={!newRule.name}>Create Rule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[var(--etihuku-gray-300)] uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}
