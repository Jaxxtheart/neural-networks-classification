"use client";

import { useState, useMemo } from "react";
import { EyeOff, Eye, Plus, Trash2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ToggleSwitch } from "@/components/shared/ToggleSwitch";
import { VERTICAL_COMPLIANCE_RULES } from "@/lib/types/governance";

type MaskType = "full" | "partial" | "hash" | "null" | "redact";

interface MaskingRule {
  id: string;
  dataset: string;
  column: string;
  dataType: string;
  maskType: MaskType;
  rolesExcluded: string[];  // roles that see masked value
  example: { raw: string; masked: string };
  active: boolean;
}

const MASK_CONFIG: Record<MaskType, { label: string; color: string; example: (raw: string) => string }> = {
  full:    { label: "Full Mask",    color: "#EF4444", example: raw => "*".repeat(raw.length) },
  partial: { label: "Partial",      color: "#F59E0B", example: raw => raw.slice(0, 2) + "***" + raw.slice(-2) },
  hash:    { label: "Hash (SHA-256)",color: "#8B5CF6", example: _   => "a3f2...d9b1" },
  null:    { label: "Null",         color: "#6B7280", example: _   => "NULL" },
  redact:  { label: "Redact",       color: "#3B82F6", example: _   => "[REDACTED]" },
};

const ALL_ROLES = ["Viewer", "Analyst", "Data Engineer", "ML Engineer", "DPO", "Admin"];

const MOCK_RULES: MaskingRule[] = [
  { id: "m1", dataset: "Customer DWH",  column: "id_number",      dataType: "VARCHAR", maskType: "full",    rolesExcluded: ["Viewer", "Analyst", "ML Engineer", "Data Engineer"], example: { raw: "8001015009087",         masked: "*************"      }, active: true  },
  { id: "m2", dataset: "Customer DWH",  column: "full_name",       dataType: "VARCHAR", maskType: "partial", rolesExcluded: ["Viewer", "Analyst"],                                 example: { raw: "Jane Doe",              masked: "Ja***oe"            }, active: true  },
  { id: "m3", dataset: "Customer DWH",  column: "email_address",   dataType: "VARCHAR", maskType: "partial", rolesExcluded: ["Viewer", "Analyst"],                                 example: { raw: "jane@example.com",      masked: "ja***@***.com"      }, active: true  },
  { id: "m4", dataset: "Customer DWH",  column: "bank_account",    dataType: "VARCHAR", maskType: "full",    rolesExcluded: ["Viewer", "Analyst", "ML Engineer"],                  example: { raw: "4062821234567890",      masked: "****************"    }, active: true  },
  { id: "m5", dataset: "CDR Raw DB",    column: "msisdn",           dataType: "BIGINT",  maskType: "partial", rolesExcluded: ["Viewer", "Analyst"],                                 example: { raw: "27831234567",           masked: "27***567"           }, active: true  },
  { id: "m6", dataset: "CDR Raw DB",    column: "imei",             dataType: "BIGINT",  maskType: "hash",    rolesExcluded: ["Viewer", "Analyst"],                                 example: { raw: "358240051111110",       masked: "a3f2...d9b1"        }, active: true  },
  { id: "m7", dataset: "Mineworker DB", column: "biometric_hash",   dataType: "VARCHAR", maskType: "redact",  rolesExcluded: ["Viewer", "Analyst", "ML Engineer"],                  example: { raw: "sha256:a1b2c3d4",       masked: "[REDACTED]"         }, active: true  },
  { id: "m8", dataset: "CCTV Training Set", column: "face_embedding", dataType: "ARRAY",maskType: "null",    rolesExcluded: ["Viewer", "Analyst"],                                 example: { raw: "[0.23, 0.11, …]",      masked: "NULL"               }, active: false },
];

export function ColumnMasking() {
  const [rules, setRules] = useState<MaskingRule[]>(MOCK_RULES);
  const [showAdd, setShowAdd] = useState(false);
  const [previewRole, setPreviewRole] = useState("Analyst");
  const [newRule, setNewRule] = useState({
    dataset: "Customer DWH", column: "", dataType: "VARCHAR", maskType: "full" as MaskType,
    rolesExcluded: ["Viewer", "Analyst"] as string[],
  });

  function toggleRule(id: string) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  }
  function deleteRule(id: string) {
    setRules(prev => prev.filter(r => r.id !== id));
  }

  function addRule() {
    const id = `m${Date.now()}`;
    const maskFn = MASK_CONFIG[newRule.maskType].example;
    setRules(prev => [...prev, {
      id, ...newRule,
      example: { raw: "example_value", masked: maskFn("example_value") },
      active: true,
    }]);
    setNewRule(r => ({ ...r, column: "" }));
    setShowAdd(false);
  }

  function previewValue(rule: MaskingRule): string {
    const isMasked = rule.active && rule.rolesExcluded.includes(previewRole);
    return isMasked ? rule.example.masked : rule.example.raw;
  }

  const grouped = useMemo(() =>
    rules.reduce<Record<string, MaskingRule[]>>((acc, r) => {
      if (!acc[r.dataset]) acc[r.dataset] = [];
      acc[r.dataset].push(r);
      return acc;
    }, {})
  , [rules]);

  // Vertical compliance: columns that MUST be masked but have no active rule
  const requiredMaskAlerts = useMemo(() => {
    const maskingRules = VERTICAL_COMPLIANCE_RULES.filter(r => r.category === "masking" && r.requiredMaskedColumns?.length);
    return maskingRules.flatMap(rule =>
      (rule.requiredMaskedColumns ?? []).flatMap(col => {
        const datasetMatch = rules.find(
          r => r.dataset.toLowerCase().includes(rule.dataPattern.toLowerCase()) &&
               r.column === col && r.active
        );
        if (datasetMatch) return []; // already covered
        return [{ rule, column: col }];
      })
    );
  }, [rules]);

  return (
    <div className="space-y-4">
      {/* Required mask compliance alerts */}
      {requiredMaskAlerts.length > 0 && (
        <div className="rounded-lg border border-red-800/40 bg-red-950/10 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-red-800/30 bg-red-950/20">
            <ShieldAlert size={14} className="text-red-400 shrink-0" />
            <span className="text-xs font-semibold text-red-300">
              {requiredMaskAlerts.length} Required Masking Rule{requiredMaskAlerts.length > 1 ? "s" : ""} Missing
            </span>
          </div>
          <div className="divide-y divide-red-900/30">
            {requiredMaskAlerts.map(({ rule, column }) => (
              <div key={`${rule.id}-${column}`} className="flex items-center gap-3 px-3 py-2.5">
                <div className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-800/40 shrink-0">
                  {rule.regulation}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-xs text-white">{column}</span>
                  <span className="text-[10px] text-[var(--etihuku-gray-500)] ml-2">{rule.requirement}</span>
                </div>
                <button
                  onClick={() => setShowAdd(true)}
                  className="btn btn-sm text-[10px] border border-red-700 text-red-300 hover:bg-red-900/30 shrink-0"
                >
                  Add Rule
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--etihuku-gray-400)]">Preview as role:</span>
          <select
            className="form-input text-xs py-1 w-40"
            value={previewRole}
            onChange={e => setPreviewRole(e.target.value)}
          >
            {ALL_ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <button onClick={() => setShowAdd(v => !v)} className="btn btn-secondary btn-sm text-xs flex items-center gap-1">
          <Plus size={11} /> Add Masking Rule
        </button>
      </div>

      {showAdd && (
        <div className="p-4 rounded-lg border border-[var(--etihuku-indigo)]/30 bg-[var(--etihuku-indigo)]/5 space-y-3">
          <div className="text-sm font-semibold text-white">New Masking Rule</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-[var(--etihuku-gray-400)]">Dataset</label>
              <select className="form-input text-xs" value={newRule.dataset} onChange={e => setNewRule(r => ({ ...r, dataset: e.target.value }))}>
                {["Customer DWH", "CDR Raw DB", "Mineworker DB", "CCTV Training Set"].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[var(--etihuku-gray-400)]">Column</label>
              <input className="form-input text-xs" placeholder="column_name" value={newRule.column} onChange={e => setNewRule(r => ({ ...r, column: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[var(--etihuku-gray-400)]">Mask Type</label>
              <select className="form-input text-xs" value={newRule.maskType} onChange={e => setNewRule(r => ({ ...r, maskType: e.target.value as MaskType }))}>
                {Object.entries(MASK_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[var(--etihuku-gray-400)]">Mask for roles</label>
              <div className="flex flex-wrap gap-1">
                {ALL_ROLES.filter(r => r !== "Admin").map(role => (
                  <label key={role} className="flex items-center gap-1 text-[10px] text-[var(--etihuku-gray-300)] cursor-pointer">
                    <input type="checkbox" className="accent-[var(--etihuku-indigo)]"
                      checked={newRule.rolesExcluded.includes(role)}
                      onChange={e => setNewRule(r => ({
                        ...r, rolesExcluded: e.target.checked
                          ? [...r.rolesExcluded, role]
                          : r.rolesExcluded.filter(x => x !== role)
                      }))}
                    />
                    {role}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addRule} disabled={!newRule.column} className="btn btn-primary text-xs">Add Rule</button>
            <button onClick={() => setShowAdd(false)} className="btn btn-secondary text-xs">Cancel</button>
          </div>
        </div>
      )}

      {Object.entries(grouped).map(([dataset, datasetRules]) => (
        <div key={dataset} className="rounded-lg border border-[var(--etihuku-gray-700)] overflow-hidden">
          <div className="px-4 py-2.5 bg-[var(--etihuku-gray-900)] border-b border-[var(--etihuku-gray-800)] text-xs font-semibold text-white">
            {dataset}
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--etihuku-gray-800)] bg-[var(--etihuku-gray-950)]/40">
                {["Column", "Type", "Mask", "Masked For", `Preview (${previewRole})`, "Active", ""].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-medium text-[var(--etihuku-gray-500)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--etihuku-gray-800)]">
              {datasetRules.map(rule => {
                const mCfg = MASK_CONFIG[rule.maskType];
                const val = previewValue(rule);
                const isMasked = rule.active && rule.rolesExcluded.includes(previewRole);
                return (
                  <tr key={rule.id} className={cn("hover:bg-[var(--etihuku-gray-900)]/30", !rule.active && "opacity-50")}>
                    <td className="px-3 py-2 font-mono text-white">{rule.column}</td>
                    <td className="px-3 py-2 text-[var(--etihuku-gray-500)] font-mono text-[10px]">{rule.dataType}</td>
                    <td className="px-3 py-2">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ color: mCfg.color, backgroundColor: `${mCfg.color}15` }}>{mCfg.label}</span>
                    </td>
                    <td className="px-3 py-2 text-[var(--etihuku-gray-400)] text-[10px]">{rule.rolesExcluded.join(", ")}</td>
                    <td className="px-3 py-2">
                      <span className={cn("font-mono flex items-center gap-1 text-[10px]", isMasked ? "text-red-400" : "text-green-400")}>
                        {isMasked ? <EyeOff size={10} /> : <Eye size={10} />}
                        {val}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <ToggleSwitch size="sm" checked={rule.active} onChange={() => toggleRule(rule.id)} />
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => deleteRule(rule.id)} className="text-[var(--etihuku-gray-600)] hover:text-red-400 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
