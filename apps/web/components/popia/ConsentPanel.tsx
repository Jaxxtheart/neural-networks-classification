"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Clock, Users, Link, RefreshCw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ConsentStatus = "granted" | "withdrawn" | "pending" | "expired";
type Purpose =
  | "service_delivery"
  | "marketing"
  | "analytics"
  | "research"
  | "fraud_detection"
  | "model_training";

interface ConsentRecord {
  id: string;
  subject: string;
  msisdn?: string;
  purpose: Purpose;
  status: ConsentStatus;
  grantedAt?: string;
  expiresAt?: string;
  withdrawnAt?: string;
  channel: string;
}

const PURPOSE_LABELS: Record<Purpose, string> = {
  service_delivery: "Service Delivery",
  marketing:        "Marketing & Offers",
  analytics:        "Analytics",
  research:         "Research",
  fraud_detection:  "Fraud Detection",
  model_training:   "Model Training",
};

const STATUS_CONFIG: Record<ConsentStatus, { color: string; icon: React.ElementType; label: string }> = {
  granted:   { color: "#10B981", icon: CheckCircle2, label: "Granted" },
  withdrawn: { color: "#EF4444", icon: XCircle,     label: "Withdrawn" },
  pending:   { color: "#F59E0B", icon: Clock,        label: "Pending" },
  expired:   { color: "#6B7280", icon: AlertTriangle,label: "Expired" },
};

const MOCK_CONSENTS: ConsentRecord[] = [
  { id: "cs1", subject: "Jane Doe",      msisdn: "27831234567", purpose: "service_delivery", status: "granted",   grantedAt: "2025-03-01", expiresAt: "2027-03-01", channel: "App" },
  { id: "cs2", subject: "Jane Doe",      msisdn: "27831234567", purpose: "marketing",        status: "withdrawn", grantedAt: "2025-03-01", withdrawnAt: "2025-11-15", channel: "USSD" },
  { id: "cs3", subject: "Jane Doe",      msisdn: "27831234567", purpose: "analytics",        status: "granted",   grantedAt: "2025-03-01", expiresAt: "2027-03-01", channel: "App" },
  { id: "cs4", subject: "Jane Doe",      msisdn: "27831234567", purpose: "model_training",   status: "pending",   channel: "Email" },
  { id: "cs5", subject: "T. Khumalo",    msisdn: "27729876543", purpose: "service_delivery", status: "granted",   grantedAt: "2024-06-10", expiresAt: "2026-06-10", channel: "SMS" },
  { id: "cs6", subject: "T. Khumalo",    msisdn: "27729876543", purpose: "fraud_detection",  status: "granted",   grantedAt: "2024-06-10", expiresAt: "2026-06-10", channel: "SMS" },
  { id: "cs7", subject: "T. Khumalo",    msisdn: "27729876543", purpose: "model_training",   status: "expired",   grantedAt: "2023-01-01", expiresAt: "2024-01-01", channel: "App" },
  { id: "cs8", subject: "A. Naidoo",     msisdn: "27841112222", purpose: "service_delivery", status: "granted",   grantedAt: "2025-09-01", expiresAt: "2027-09-01", channel: "App" },
  { id: "cs9", subject: "A. Naidoo",     msisdn: "27841112222", purpose: "analytics",        status: "withdrawn", grantedAt: "2025-09-01", withdrawnAt: "2026-01-20", channel: "App" },
  { id: "cs10",subject: "M. van Wyk",    msisdn: "27603334444", purpose: "research",         status: "pending",   channel: "Email" },
];

const INTEGRATIONS = [
  { name: "OneTrust",       status: "connected", lastSync: "5m ago", records: "980k" },
  { name: "Didomi",         status: "connected", lastSync: "15m ago",records: "980k" },
  { name: "TrustArc",       status: "pending",   lastSync: "—",      records: "—" },
  { name: "Custom Consent API",status: "connected",lastSync: "1m ago",records: "980k" },
];

export function ConsentPanel() {
  const [activeTab, setActiveTab] = useState<"records" | "integrations" | "summary">("summary");
  const [consents] = useState<ConsentRecord[]>(MOCK_CONSENTS);

  const stats = {
    granted:   consents.filter(c => c.status === "granted").length,
    withdrawn: consents.filter(c => c.status === "withdrawn").length,
    pending:   consents.filter(c => c.status === "pending").length,
    expired:   consents.filter(c => c.status === "expired").length,
  };

  const byPurpose = Object.entries(PURPOSE_LABELS).map(([k, label]) => ({
    purpose: k as Purpose,
    label,
    granted:   consents.filter(c => c.purpose === k && c.status === "granted").length,
    withdrawn: consents.filter(c => c.purpose === k && c.status === "withdrawn").length,
    total:     consents.filter(c => c.purpose === k).length,
  }));

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-[var(--etihuku-gray-800)]">
        {([
          { id: "summary",      label: "Summary" },
          { id: "records",      label: "Consent Records" },
          { id: "integrations", label: "CMP Integrations" },
        ] as { id: "summary" | "records" | "integrations"; label: string }[]).map(tab => (
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

      {activeTab === "summary" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Granted",   value: stats.granted,   color: "#10B981" },
              { label: "Withdrawn", value: stats.withdrawn,  color: "#EF4444" },
              { label: "Pending",   value: stats.pending,    color: "#F59E0B" },
              { label: "Expired",   value: stats.expired,    color: "#6B7280" },
            ].map(s => (
              <div key={s.label} className="rounded-lg border border-[var(--etihuku-gray-800)] bg-[var(--etihuku-gray-900)] p-3 text-center">
                <div className="text-2xl font-display font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10px] text-[var(--etihuku-gray-500)] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-[var(--etihuku-gray-400)] uppercase tracking-wide">Consent by Purpose</div>
            {byPurpose.map(p => (
              <div key={p.purpose} className="flex items-center gap-3">
                <span className="text-xs text-[var(--etihuku-gray-300)] w-36 shrink-0">{p.label}</span>
                <div className="flex-1 flex h-2 rounded-full overflow-hidden bg-[var(--etihuku-gray-800)]">
                  <div style={{ width: `${p.total ? (p.granted / p.total) * 100 : 0}%`, backgroundColor: "#10B981" }} />
                  <div style={{ width: `${p.total ? (p.withdrawn / p.total) * 100 : 0}%`, backgroundColor: "#EF4444" }} />
                </div>
                <span className="text-[10px] font-mono text-[var(--etihuku-gray-400)] w-20 shrink-0 text-right">
                  {p.granted}/{p.total} granted
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "records" && (
        <div className="overflow-x-auto rounded-lg border border-[var(--etihuku-gray-800)]">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--etihuku-gray-800)] bg-[var(--etihuku-gray-900)]">
                {["Subject", "MSISDN", "Purpose", "Status", "Granted", "Expires / Withdrawn", "Channel"].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left font-medium text-[var(--etihuku-gray-400)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--etihuku-gray-800)]">
              {consents.map(c => {
                const cfg = STATUS_CONFIG[c.status];
                const Icon = cfg.icon;
                return (
                  <tr key={c.id} className="hover:bg-[var(--etihuku-gray-900)]/50">
                    <td className="px-3 py-2 text-white font-medium">{c.subject}</td>
                    <td className="px-3 py-2 font-mono text-[var(--etihuku-gray-400)]">{c.msisdn || "—"}</td>
                    <td className="px-3 py-2 text-[var(--etihuku-gray-300)]">{PURPOSE_LABELS[c.purpose]}</td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: cfg.color }}>
                        <Icon size={10} /> {cfg.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[var(--etihuku-gray-400)]">{c.grantedAt || "—"}</td>
                    <td className="px-3 py-2 text-[var(--etihuku-gray-400)]">{c.withdrawnAt || c.expiresAt || "—"}</td>
                    <td className="px-3 py-2 text-[var(--etihuku-gray-400)]">{c.channel}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "integrations" && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--etihuku-gray-400)]">
            Connect to your Consent Management Platform (CMP) to sync consent records in real-time and ensure POPIA compliance for all data processing activities.
          </p>
          {INTEGRATIONS.map(int => (
            <div key={int.name} className="flex items-center gap-3 p-4 rounded-lg border border-[var(--etihuku-gray-700)] bg-[var(--etihuku-gray-900)]">
              <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", int.status === "connected" ? "bg-green-400" : "bg-amber-400")} />
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{int.name}</div>
                <div className="text-[10px] text-[var(--etihuku-gray-500)] mt-0.5">
                  {int.status === "connected" ? `Last sync: ${int.lastSync} · ${int.records} records` : "Configuration required"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {int.status === "connected" ? (
                  <button className="btn btn-secondary btn-sm text-xs flex items-center gap-1"><RefreshCw size={10} /> Sync</button>
                ) : (
                  <button className="btn btn-primary btn-sm text-xs flex items-center gap-1"><Link size={10} /> Connect</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
