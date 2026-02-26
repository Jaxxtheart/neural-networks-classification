"use client";

import { useState } from "react";
import {
  ShieldCheck, BarChart2, AlertTriangle, TrendingUp,
  Database, ChevronDown, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ProfilerPanel } from "@/components/quality/ProfilerPanel";
import { RuleEnginePanel } from "@/components/quality/RuleEnginePanel";
import { QualityTrendChart } from "@/components/quality/QualityTrendChart";
import { RemediationPanel } from "@/components/quality/RemediationPanel";
import { QualityScore } from "@/components/shared/QualityScore";

type Tab = "profiler" | "rules" | "trends" | "remediation";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profiler",    label: "Data Profiler",      icon: BarChart2    },
  { id: "rules",       label: "Rule Engine",         icon: ShieldCheck  },
  { id: "trends",      label: "Quality Trends",      icon: TrendingUp   },
  { id: "remediation", label: "Auto-Remediation",    icon: AlertTriangle },
];

const DATASET_LIST = [
  { id: "ds1", name: "CDR Dataset",         rows: "12,840",  score: 91, vertical: "telecom",     lastRun: "2m ago",  status: "excellent" },
  { id: "ds2", name: "Network KPIs",        rows: "4,210K",  score: 87, vertical: "telecom",     lastRun: "5m ago",  status: "good"      },
  { id: "ds3", name: "Access Logs",         rows: "88K",     score: 99, vertical: "security",    lastRun: "10m ago", status: "excellent" },
  { id: "ds4", name: "Sensor Readings",     rows: "2.1M",    score: 74, vertical: "mining",      lastRun: "30s ago", status: "fair"      },
  { id: "ds5", name: "Inspection Images",   rows: "1,428",   score: 61, vertical: "engineering", lastRun: "1h ago",  status: "poor"      },
  { id: "ds6", name: "Geological Assays",   rows: "38K",     score: 82, vertical: "mining",      lastRun: "2h ago",  status: "good"      },
];

const VERTICAL_COLORS: Record<string, string> = {
  telecom: "#8B5CF6", security: "#F59E0B", mining: "#10B981", engineering: "#EC4899",
};

export default function QualityPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profiler");
  const [selectedDataset, setSelectedDataset] = useState(DATASET_LIST[0]);

  const avgScore = Math.round(DATASET_LIST.reduce((s, d) => s + d.score, 0) / DATASET_LIST.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-h2 font-display text-white">Data Quality Engine</h1>
          <p className="text-sm text-[var(--etihuku-gray-400)] mt-1">
            Profile, validate, and auto-remediate across all datasets
          </p>
        </div>
        <div className="flex items-center gap-3">
          <QualityScore score={avgScore} size="md" showLabel />
          <div>
            <div className="text-xs text-[var(--etihuku-gray-500)]">Platform avg</div>
            <div className="text-xs text-[var(--etihuku-gold)] font-medium">
              {DATASET_LIST.filter(d => d.score >= 90).length} excellent
            </div>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Datasets Profiled",    value: DATASET_LIST.length.toString(),                                    color: "text-white"                    },
          { label: "Active Rules",         value: "12",                                                               color: "text-[var(--etihuku-indigo)]"  },
          { label: "Failing Rules",        value: "1",                                                                color: "text-red-400"                  },
          { label: "Records Auto-Fixed",   value: "1,311",                                                            color: "text-[var(--etihuku-gold)]"    },
        ].map(kpi => (
          <div key={kpi.label} className="card text-center">
            <div className={cn("text-2xl font-display font-bold", kpi.color)}>{kpi.value}</div>
            <div className="text-xs text-[var(--etihuku-gray-500)] mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Main layout: dataset list + tabs */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Dataset selector */}
        <div className="xl:col-span-1 space-y-2">
          <div className="text-xs font-medium text-[var(--etihuku-gray-400)] uppercase tracking-wide px-1 mb-3">
            Datasets
          </div>
          {DATASET_LIST.map(ds => (
            <button
              key={ds.id}
              onClick={() => setSelectedDataset(ds)}
              className={cn(
                "w-full card text-left p-3 transition-all",
                selectedDataset.id === ds.id
                  ? "border-[var(--etihuku-indigo)] shadow-glow"
                  : "hover:border-[var(--etihuku-gray-600)]"
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: VERTICAL_COLORS[ds.vertical] }} />
                  <span className="text-xs font-medium text-white truncate">{ds.name}</span>
                </div>
                <QualityScore score={ds.score} size="sm" />
              </div>
              <div className="flex justify-between text-[10px] text-[var(--etihuku-gray-500)]">
                <span>{ds.rows} rows</span>
                <span>{ds.lastRun}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Main content area */}
        <div className="xl:col-span-3 space-y-4">
          {/* Dataset header */}
          <div className="card">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Database size={16} className="text-[var(--etihuku-indigo)]" />
                  <h2 className="text-h4 font-display text-white">{selectedDataset.name}</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full capitalize font-medium"
                    style={{ color: VERTICAL_COLORS[selectedDataset.vertical], backgroundColor: `${VERTICAL_COLORS[selectedDataset.vertical]}20` }}>
                    {selectedDataset.vertical}
                  </span>
                </div>
                <div className="text-xs text-[var(--etihuku-gray-500)]">
                  {selectedDataset.rows} rows · Last profiled {selectedDataset.lastRun}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <QualityScore score={selectedDataset.score} size="lg" showLabel />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 border-b border-[var(--etihuku-gray-800)]">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all -mb-px",
                    activeTab === tab.id
                      ? "border-[var(--etihuku-indigo)] text-[var(--etihuku-indigo)]"
                      : "border-transparent text-[var(--etihuku-gray-400)] hover:text-white"
                  )}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div>
            {activeTab === "profiler"    && <ProfilerPanel />}
            {activeTab === "rules"       && <RuleEnginePanel />}
            {activeTab === "trends"      && (
              <div className="card">
                <h3 className="text-h4 font-display text-white mb-4">Quality Score Trends</h3>
                <QualityTrendChart />
              </div>
            )}
            {activeTab === "remediation" && <RemediationPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}
