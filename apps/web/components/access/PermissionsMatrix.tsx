"use client";

import { useState } from "react";
import { Shield, Check, Minus, X, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Permission = "none" | "read" | "write" | "admin";

interface RoleDatasetPerm {
  role: string;
  dataset: string;
  permission: Permission;
}

const ROLES = ["Viewer", "Analyst", "Data Engineer", "ML Engineer", "DPO", "Admin"];
const DATASETS = [
  "CDR Raw DB",
  "Customer DWH",
  "Network Probes",
  "CCTV Training Set",
  "Mineworker DB",
  "Inspection Training",
  "Churn Feature Set",
  "Sensor Feature Store",
];

const PERM_CONFIG: Record<Permission, { label: string; color: string; icon: React.ElementType }> = {
  none:  { label: "None",  color: "#374151", icon: X     },
  read:  { label: "Read",  color: "#3B82F6", icon: Check },
  write: { label: "Write", color: "#10B981", icon: Check },
  admin: { label: "Admin", color: "#F59E0B", icon: Shield},
};

const PERM_CYCLE: Permission[] = ["none", "read", "write", "admin"];

const INITIAL_PERMS: RoleDatasetPerm[] = [
  // Admin - full access
  ...DATASETS.map(d => ({ role: "Admin", dataset: d, permission: "admin" as Permission })),
  // DPO - read all
  ...DATASETS.map(d => ({ role: "DPO", dataset: d, permission: "read" as Permission })),
  // Data Engineer - write most, no CCTV raw
  { role: "Data Engineer", dataset: "CDR Raw DB",          permission: "write" },
  { role: "Data Engineer", dataset: "Customer DWH",         permission: "write" },
  { role: "Data Engineer", dataset: "Network Probes",        permission: "write" },
  { role: "Data Engineer", dataset: "CCTV Training Set",    permission: "read"  },
  { role: "Data Engineer", dataset: "Mineworker DB",        permission: "write" },
  { role: "Data Engineer", dataset: "Inspection Training",  permission: "write" },
  { role: "Data Engineer", dataset: "Churn Feature Set",    permission: "write" },
  { role: "Data Engineer", dataset: "Sensor Feature Store", permission: "write" },
  // ML Engineer - read sources, write features
  { role: "ML Engineer", dataset: "CDR Raw DB",             permission: "read"  },
  { role: "ML Engineer", dataset: "Customer DWH",           permission: "none"  },
  { role: "ML Engineer", dataset: "Network Probes",         permission: "read"  },
  { role: "ML Engineer", dataset: "CCTV Training Set",      permission: "read"  },
  { role: "ML Engineer", dataset: "Mineworker DB",          permission: "none"  },
  { role: "ML Engineer", dataset: "Inspection Training",    permission: "read"  },
  { role: "ML Engineer", dataset: "Churn Feature Set",      permission: "write" },
  { role: "ML Engineer", dataset: "Sensor Feature Store",   permission: "write" },
  // Analyst - read features only
  { role: "Analyst", dataset: "CDR Raw DB",                 permission: "none"  },
  { role: "Analyst", dataset: "Customer DWH",               permission: "read"  },
  { role: "Analyst", dataset: "Network Probes",             permission: "none"  },
  { role: "Analyst", dataset: "CCTV Training Set",          permission: "none"  },
  { role: "Analyst", dataset: "Mineworker DB",              permission: "none"  },
  { role: "Analyst", dataset: "Inspection Training",        permission: "none"  },
  { role: "Analyst", dataset: "Churn Feature Set",          permission: "read"  },
  { role: "Analyst", dataset: "Sensor Feature Store",       permission: "read"  },
  // Viewer - read feature sets only
  { role: "Viewer", dataset: "CDR Raw DB",                  permission: "none"  },
  { role: "Viewer", dataset: "Customer DWH",                permission: "none"  },
  { role: "Viewer", dataset: "Network Probes",              permission: "none"  },
  { role: "Viewer", dataset: "CCTV Training Set",           permission: "none"  },
  { role: "Viewer", dataset: "Mineworker DB",               permission: "none"  },
  { role: "Viewer", dataset: "Inspection Training",         permission: "none"  },
  { role: "Viewer", dataset: "Churn Feature Set",           permission: "read"  },
  { role: "Viewer", dataset: "Sensor Feature Store",        permission: "read"  },
];

function getPerm(perms: RoleDatasetPerm[], role: string, dataset: string): Permission {
  return perms.find(p => p.role === role && p.dataset === dataset)?.permission ?? "none";
}

export function PermissionsMatrix() {
  const [perms, setPerms] = useState<RoleDatasetPerm[]>(INITIAL_PERMS);
  const [hasChanges, setHasChanges] = useState(false);

  function cyclePerm(role: string, dataset: string) {
    if (role === "Admin") return; // admin always has admin
    setPerms(prev => {
      const current = getPerm(prev, role, dataset);
      const nextIdx = (PERM_CYCLE.indexOf(current) + 1) % PERM_CYCLE.length;
      const next = PERM_CYCLE[nextIdx];
      const existing = prev.find(p => p.role === role && p.dataset === dataset);
      if (existing) return prev.map(p => p.role === role && p.dataset === dataset ? { ...p, permission: next } : p);
      return [...prev, { role, dataset, permission: next }];
    });
    setHasChanges(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--etihuku-gray-400)]">
          Click a cell to cycle through permissions. Changes apply to all users with that role.
        </p>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-xs text-amber-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" /> Unsaved
            </span>
          )}
          <button onClick={() => setHasChanges(false)} disabled={!hasChanges} className="btn btn-primary btn-sm text-xs">
            Save Changes
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4">
        {(Object.entries(PERM_CONFIG) as [Permission, typeof PERM_CONFIG[Permission]][]).map(([p, cfg]) => (
          <div key={p} className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: `${cfg.color}20`, border: `1px solid ${cfg.color}40` }}>
              <cfg.icon size={10} style={{ color: cfg.color }} />
            </div>
            <span className="text-[10px] text-[var(--etihuku-gray-400)]">{cfg.label}</span>
          </div>
        ))}
        <span className="text-[10px] text-[var(--etihuku-gray-600)] ml-2">Click to cycle →</span>
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto rounded-lg border border-[var(--etihuku-gray-800)]">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--etihuku-gray-800)] bg-[var(--etihuku-gray-900)]">
              <th className="px-4 py-2.5 text-left font-medium text-[var(--etihuku-gray-400)] w-44">Dataset</th>
              {ROLES.map(role => (
                <th key={role} className="px-2 py-2.5 text-center font-medium text-[var(--etihuku-gray-400)] whitespace-nowrap text-[11px]">{role}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--etihuku-gray-800)]">
            {DATASETS.map(dataset => (
              <tr key={dataset} className="hover:bg-[var(--etihuku-gray-900)]/40">
                <td className="px-4 py-2.5 text-[var(--etihuku-gray-200)] font-medium">{dataset}</td>
                {ROLES.map(role => {
                  const perm = getPerm(perms, role, dataset);
                  const cfg = PERM_CONFIG[perm];
                  const Icon = cfg.icon;
                  const isAdmin = role === "Admin";
                  return (
                    <td key={role} className="px-2 py-2.5 text-center">
                      <button
                        onClick={() => cyclePerm(role, dataset)}
                        disabled={isAdmin}
                        className="w-7 h-7 rounded inline-flex items-center justify-center transition-all hover:scale-110 disabled:hover:scale-100"
                        style={{
                          backgroundColor: perm === "none" ? "transparent" : `${cfg.color}20`,
                          border: `1px solid ${perm === "none" ? "var(--etihuku-gray-800)" : `${cfg.color}50`}`,
                        }}
                        title={`${role} / ${dataset}: ${cfg.label}`}
                      >
                        <Icon size={11} style={{ color: cfg.color }} />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
