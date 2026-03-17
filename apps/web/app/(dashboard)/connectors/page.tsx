"use client";

import { useState } from "react";
import { Plus, Activity, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { ConnectorCatalog } from "@/components/connectors/ConnectorCatalog";
import { ConnectorWizard, ConnectorConfig } from "@/components/connectors/ConnectorWizard";

export default function ConnectorsPage() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardDefId, setWizardDefId] = useState<string | undefined>(undefined);

  function openWizard(defId?: string) {
    setWizardDefId(defId);
    setWizardOpen(true);
  }

  function handleComplete(config: ConnectorConfig) {
    // In production: POST to API to save connector
    console.log("New connector config:", config);
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-h2 font-display text-white">Connectors</h1>
          <p className="text-sm text-[var(--etihuku-gray-400)] mt-1">
            Manage data source connections across your verticals
          </p>
        </div>
        <button
          onClick={() => openWizard()}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Add Connector
        </button>
      </div>

      {/* Health summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Connectors",  value: "6",  icon: Activity,      color: "text-white"                   },
          { label: "Connected",         value: "3",  icon: CheckCircle2,  color: "text-green-400"               },
          { label: "Syncing",           value: "1",  icon: RefreshCw,     color: "text-[var(--etihuku-indigo)]" },
          { label: "Issues",            value: "2",  icon: AlertCircle,   color: "text-red-400"                 },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--etihuku-gray-800)] flex items-center justify-center shrink-0">
                <Icon size={18} className={stat.color} />
              </div>
              <div>
                <div className={`text-xl font-display font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-[var(--etihuku-gray-500)]">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ingestion stats */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h4 font-display text-white">Today&apos;s Ingestion</h2>
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Records Ingested",  value: "21.5M",  color: "text-[var(--etihuku-indigo)]" },
            { label: "Bytes Transferred", value: "847 GB", color: "text-white"                   },
            { label: "Avg Sync Time",     value: "1.2s",   color: "text-[var(--etihuku-gold)]"   },
            { label: "Error Rate",        value: "0.02%",  color: "text-green-400"               },
          ].map(s => (
            <div key={s.label} className="text-center p-3 rounded-lg bg-[var(--etihuku-gray-800)]">
              <div className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-[var(--etihuku-gray-500)] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main connector catalog / instances */}
      <div className="card">
        <ConnectorCatalog onAddConnector={openWizard} />
      </div>

      {/* Wizard modal */}
      {wizardOpen && (
        <ConnectorWizard
          initialDefId={wizardDefId}
          onClose={() => setWizardOpen(false)}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
