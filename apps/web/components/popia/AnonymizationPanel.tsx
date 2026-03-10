"use client";

import { useState, useRef, useEffect } from "react";
import { EyeOff, Play, Sliders, Hash, Shuffle, Lock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";
import { ToggleSwitch } from "@/components/shared/ToggleSwitch";

type AnonTechnique = "masking" | "pseudonymisation" | "k-anonymity" | "l-diversity" | "suppression" | "generalisation";

interface AnonRule {
  id: string;
  dataset: string;
  column: string;
  technique: AnonTechnique;
  params: Record<string, string | number>;
  active: boolean;
  lastApplied?: string;
  rowsAffected?: number;
}

const TECHNIQUE_CONFIG: Record<AnonTechnique, { label: string; color: string; icon: React.ElementType; description: string }> = {
  masking:          { label: "Column Masking",     color: "#8B5CF6", icon: EyeOff,   description: "Replace characters with ***" },
  pseudonymisation: { label: "Pseudonymisation",   color: "#3B82F6", icon: Shuffle,  description: "Replace with reversible token" },
  "k-anonymity":    { label: "k-Anonymity",        color: "#F59E0B", icon: Hash,     description: "Generalise until k identical rows" },
  "l-diversity":    { label: "l-Diversity",        color: "#EC4899", icon: Sliders,  description: "Ensure l distinct sensitive values" },
  suppression:      { label: "Suppression",        color: "#EF4444", icon: Lock,     description: "Remove rows/columns entirely" },
  generalisation:   { label: "Generalisation",     color: "#10B981", icon: Sliders,  description: "Replace with range or category" },
};

const MOCK_RULES: AnonRule[] = [
  { id: "r1", dataset: "Customer DWH",   column: "id_number",      technique: "masking",       params: { pattern: "****-****-***" }, active: true,  lastApplied: "1h ago", rowsAffected: 978234 },
  { id: "r2", dataset: "Customer DWH",   column: "full_name",       technique: "pseudonymisation", params: { salt: "popia-v2", algorithm: "HMAC-SHA256" }, active: true,  lastApplied: "1h ago", rowsAffected: 978234 },
  { id: "r3", dataset: "Customer DWH",   column: "email_address",   technique: "masking",       params: { pattern: "a***@***.***" }, active: true, lastApplied: "1h ago", rowsAffected: 921100 },
  { id: "r4", dataset: "Customer DWH",   column: "date_of_birth",   technique: "generalisation",params: { granularity: "year" }, active: true,  lastApplied: "1h ago", rowsAffected: 978234 },
  { id: "r5", dataset: "CDR Raw DB",     column: "msisdn",          technique: "pseudonymisation", params: { salt: "cdr-salt-v1", algorithm: "HMAC-SHA256" }, active: true, lastApplied: "5m ago", rowsAffected: 4195000 },
  { id: "r6", dataset: "CDR Raw DB",     column: "cell_id",         technique: "generalisation",params: { granularity: "region" }, active: false, rowsAffected: undefined },
  { id: "r7", dataset: "CCTV Training Set", column: "face_embedding", technique: "suppression", params: { scope: "column" }, active: true,  lastApplied: "2d ago", rowsAffected: 86000 },
  { id: "r8", dataset: "Mineworker DB",  column: "biometric_hash",  technique: "suppression",   params: { scope: "column" }, active: false },
];

const KANON_DATASETS = [
  { dataset: "Customer DWH", k: 5, l: 3, currentK: 8, currentL: 4, status: "compliant" as const },
  { dataset: "CDR Raw DB",   k: 10, l: 5, currentK: 7, currentL: 3, status: "non-compliant" as const },
  { dataset: "Mineworker DB",k: 5,  l: 2, currentK: 5, currentL: 2, status: "compliant" as const },
];

export function AnonymizationPanel() {
  const [rules, setRules] = useState<AnonRule[]>(MOCK_RULES);
  const [activeTab, setActiveTab] = useState<"rules" | "kanon" | "new">("rules");
  const [runningId, setRunningId] = useState<string | null>(null);
  const applyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [newRule, setNewRule] = useState({ dataset: "Customer DWH", column: "", technique: "masking" as AnonTechnique, param: "" });

  // Clear in-flight apply timer on unmount
  useEffect(() => () => { if (applyTimerRef.current) clearTimeout(applyTimerRef.current); }, []);

  function toggleRule(id: string) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  }

  function applyRule(id: string) {
    if (runningId) return; // prevent concurrent applies
    setRunningId(id);
    if (applyTimerRef.current) clearTimeout(applyTimerRef.current);
    applyTimerRef.current = setTimeout(() => {
      setRules(prev => prev.map(r => r.id === id ? { ...r, lastApplied: "just now" } : r));
      setRunningId(null);
    }, 1800);
  }

  function addRule() {
    const id = `r${Date.now()}`;
    setRules(prev => [...prev, {
      id, dataset: newRule.dataset, column: newRule.column, technique: newRule.technique,
      params: { value: newRule.param }, active: true,
    }]);
    setNewRule(r => ({ ...r, column: "", param: "" }));
    setActiveTab("rules");
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-[var(--etihuku-gray-800)]">
        {([
          { id: "rules", label: "Masking Rules" },
          { id: "kanon",  label: "k-Anonymity Status" },
          { id: "new",    label: "+ Add Rule" },
        ] as { id: "rules" | "kanon" | "new"; label: string }[]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all",
              activeTab === tab.id
                ? "border-[var(--etihuku-indigo)] text-[var(--etihuku-indigo)]"
                : "border-transparent text-[var(--etihuku-gray-400)] hover:text-white"
            )}
          >{tab.label}</button>
        ))}
      </div>

      {/* Rules list */}
      {activeTab === "rules" && (
        <div className="space-y-2">
          {rules.map(rule => {
            const tech = TECHNIQUE_CONFIG[rule.technique];
            const Icon = tech.icon;
            const isRunning = runningId === rule.id;
            return (
              <div key={rule.id} className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg border transition-all",
                rule.active ? "border-[var(--etihuku-gray-700)] bg-[var(--etihuku-gray-900)]" : "border-[var(--etihuku-gray-800)] opacity-50"
              )}>
                <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${tech.color}20` }}>
                  <Icon size={14} style={{ color: tech.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white font-mono">{rule.column}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: tech.color, backgroundColor: `${tech.color}15` }}>{tech.label}</span>
                  </div>
                  <div className="text-[10px] text-[var(--etihuku-gray-500)] mt-0.5">
                    {rule.dataset} · {Object.entries(rule.params).map(([k, v]) => `${k}=${v}`).join(", ")}
                    {rule.lastApplied && ` · Applied ${rule.lastApplied}`}
                    {rule.rowsAffected && ` · ${formatNumber(rule.rowsAffected)} rows`}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => applyRule(rule.id)}
                    disabled={!rule.active || isRunning}
                    className="btn btn-secondary btn-sm text-xs flex items-center gap-1"
                  >
                    {isRunning ? <><Play size={10} className="animate-pulse" /> Running…</> : <><Play size={10} /> Apply</>}
                  </button>
                  <ToggleSwitch checked={rule.active} onChange={() => toggleRule(rule.id)} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* k-Anonymity status */}
      {activeTab === "kanon" && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--etihuku-gray-400)]">
            k-Anonymity requires that each record in the dataset is indistinguishable from at least k−1 other records with respect to quasi-identifiers. l-Diversity extends this by requiring at least l well-represented sensitive values.
          </p>
          {KANON_DATASETS.map(ds => {
            const kOk = ds.currentK >= ds.k;
            const lOk = ds.currentL >= ds.l;
            return (
              <div key={ds.dataset} className={cn(
                "p-4 rounded-lg border",
                ds.status === "compliant" ? "border-green-800/40 bg-green-950/10" : "border-red-800/40 bg-red-950/10"
              )}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-sm text-white">{ds.dataset}</span>
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded", ds.status === "compliant" ? "text-green-400 bg-green-950/30" : "text-red-400 bg-red-950/30")}>
                    {ds.status === "compliant" ? "✓ Compliant" : "✗ Non-Compliant"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "k-Anonymity", required: ds.k, current: ds.currentK, ok: kOk },
                    { label: "l-Diversity",  required: ds.l, current: ds.currentL, ok: lOk },
                  ].map(metric => (
                    <div key={metric.label}>
                      <div className="text-[10px] text-[var(--etihuku-gray-400)] mb-1">{metric.label}</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-[var(--etihuku-gray-800)]">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{ width: `${Math.min((metric.current / (metric.required * 1.5)) * 100, 100)}%`, backgroundColor: metric.ok ? "#10B981" : "#EF4444" }}
                          />
                        </div>
                        <span className="text-xs font-mono font-bold" style={{ color: metric.ok ? "#10B981" : "#EF4444" }}>
                          k={metric.current} / {metric.required}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add rule */}
      {activeTab === "new" && (
        <div className="space-y-4 max-w-md">
          {[
            { label: "Dataset", field: "dataset" as const, type: "select", options: ["Customer DWH", "CDR Raw DB", "CCTV Training Set", "Mineworker DB"] },
          ].map(field => (
            <div key={field.label} className="space-y-1">
              <label className="text-xs text-[var(--etihuku-gray-400)]">{field.label}</label>
              <select className="form-input text-xs" value={newRule.dataset} onChange={e => setNewRule(r => ({ ...r, dataset: e.target.value }))}>
                {field.options!.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div className="space-y-1">
            <label className="text-xs text-[var(--etihuku-gray-400)]">Column name</label>
            <input className="form-input text-xs" placeholder="e.g. phone_number" value={newRule.column} onChange={e => setNewRule(r => ({ ...r, column: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[var(--etihuku-gray-400)]">Technique</label>
            <select className="form-input text-xs" value={newRule.technique} onChange={e => setNewRule(r => ({ ...r, technique: e.target.value as AnonTechnique }))}>
              {Object.entries(TECHNIQUE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[var(--etihuku-gray-400)]">Parameter</label>
            <input className="form-input text-xs" placeholder="e.g. pattern=***-****" value={newRule.param} onChange={e => setNewRule(r => ({ ...r, param: e.target.value }))} />
          </div>
          <button onClick={addRule} disabled={!newRule.column} className="btn btn-primary text-sm">Add Rule</button>
        </div>
      )}
    </div>
  );
}
