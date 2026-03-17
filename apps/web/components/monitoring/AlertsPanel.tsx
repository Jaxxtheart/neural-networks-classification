"use client";

import { useState } from "react";
import {
  Bell, BellOff, CheckCircle2, XCircle, AlertTriangle, Clock,
  Mail, MessageSquare, Webhook, Plus, Trash2, Edit2, X, Check,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

type AlertSeverity = "critical" | "high" | "medium" | "low";
type AlertStatus = "firing" | "resolved" | "acknowledged";
type ChannelType = "email" | "slack" | "webhook";

interface AlertRule {
  id: string;
  name: string;
  model: string;
  metric: string;
  condition: string;
  threshold: number;
  severity: AlertSeverity;
  channels: ChannelType[];
  enabled: boolean;
  lastTriggered?: string;
}

interface AlertEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  model: string;
  metric: string;
  value: number;
  threshold: number;
  severity: AlertSeverity;
  status: AlertStatus;
  firedAt: string;
  resolvedAt?: string;
  acknowledgedBy?: string;
  note?: string;
}

const MOCK_RULES: AlertRule[] = [
  {
    id: "rule-1", name: "Churn Model AUC Drop",
    model: "churn-predictor-v3", metric: "AUC",
    condition: "below", threshold: 0.88, severity: "high",
    channels: ["slack", "email"], enabled: true, lastTriggered: "Never",
  },
  {
    id: "rule-2", name: "PSI Composite Drift Alert",
    model: "churn-predictor-v3", metric: "Composite PSI",
    condition: "above", threshold: 0.25, severity: "critical",
    channels: ["slack", "email", "webhook"], enabled: true, lastTriggered: "2h ago",
  },
  {
    id: "rule-3", name: "International Calls Feature Drift",
    model: "churn-predictor-v3", metric: "PSI (international_calls)",
    condition: "above", threshold: 0.3, severity: "high",
    channels: ["email"], enabled: true, lastTriggered: "2h ago",
  },
  {
    id: "rule-4", name: "Intrusion Classifier F1 SLA",
    model: "intrusion-classifier", metric: "F1",
    condition: "below", threshold: 0.80, severity: "critical",
    channels: ["slack", "email", "webhook"], enabled: true, lastTriggered: "6h ago",
  },
  {
    id: "rule-5", name: "Bearing Model Latency",
    model: "bearing-failure-predictor", metric: "P99 Latency",
    condition: "above", threshold: 200, severity: "medium",
    channels: ["slack"], enabled: false, lastTriggered: "Never",
  },
];

const MOCK_EVENTS: AlertEvent[] = [
  {
    id: "ev-1", ruleId: "rule-2", ruleName: "PSI Composite Drift Alert",
    model: "churn-predictor-v3", metric: "Composite PSI",
    value: 0.31, threshold: 0.25, severity: "critical",
    status: "firing", firedAt: "Today 14:22",
  },
  {
    id: "ev-2", ruleId: "rule-3", ruleName: "International Calls Feature Drift",
    model: "churn-predictor-v3", metric: "PSI (international_calls)",
    value: 0.44, threshold: 0.30, severity: "high",
    status: "acknowledged", firedAt: "Today 14:22", acknowledgedBy: "T. Ndlovu",
    note: "Identified as seasonal — Zimbabwe network migration. Retraining queued.",
  },
  {
    id: "ev-3", ruleId: "rule-4", ruleName: "Intrusion Classifier F1 SLA",
    model: "intrusion-classifier", metric: "F1",
    value: 0.741, threshold: 0.80, severity: "critical",
    status: "firing", firedAt: "Today 08:15",
  },
  {
    id: "ev-4", ruleId: "rule-1", ruleName: "Churn Model AUC Drop",
    model: "churn-predictor-v2", metric: "AUC",
    value: 0.872, threshold: 0.88, severity: "high",
    status: "resolved", firedAt: "Yesterday 23:14", resolvedAt: "Today 02:00",
    note: "Resolved after retraining on fresh data.",
  },
];

const SEVERITY_CONFIG: Record<AlertSeverity, { color: string; bg: string; icon: React.ElementType }> = {
  critical: { color: "#DC2626", bg: "bg-red-950/30",    icon: XCircle      },
  high:     { color: "#EF4444", bg: "bg-red-950/20",    icon: AlertTriangle },
  medium:   { color: "#F59E0B", bg: "bg-amber-950/20",  icon: AlertTriangle },
  low:      { color: "#10B981", bg: "bg-green-950/10",  icon: Bell          },
};

const STATUS_CONFIG: Record<AlertStatus, { label: string; color: string }> = {
  firing:       { label: "Firing",       color: "#EF4444" },
  resolved:     { label: "Resolved",     color: "#10B981" },
  acknowledged: { label: "Acknowledged", color: "#F59E0B" },
};

const CHANNEL_CONFIG: Record<ChannelType, { icon: React.ElementType; label: string; color: string }> = {
  email:   { icon: Mail,          label: "Email",   color: "#3B82F6" },
  slack:   { icon: MessageSquare, label: "Slack",   color: "#4A154B" },
  webhook: { icon: Webhook,       label: "Webhook", color: "#6B7280" },
};

type AlertTab = "active" | "rules" | "history";

export function AlertsPanel() {
  const [tab, setTab] = useState<AlertTab>("active");
  const [rules, setRules] = useState<AlertRule[]>(MOCK_RULES);
  const [events, setEvents] = useState<AlertEvent[]>(MOCK_EVENTS);

  function toggleRule(id: string) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }

  function acknowledge(id: string) {
    setEvents(prev => prev.map(e =>
      e.id === id ? { ...e, status: "acknowledged", acknowledgedBy: "You" } : e
    ));
  }

  const firingCount = events.filter(e => e.status === "firing").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <div className={cn("text-2xl font-display font-bold", firingCount > 0 ? "text-red-400" : "text-green-400")}>
            {firingCount}
          </div>
          <div className="text-xs text-[var(--etihuku-gray-500)] mt-0.5">Firing Alerts</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-display font-bold text-[var(--etihuku-indigo)]">
            {rules.filter(r => r.enabled).length}
          </div>
          <div className="text-xs text-[var(--etihuku-gray-500)] mt-0.5">Active Rules</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-display font-bold text-[var(--etihuku-gold)]">3</div>
          <div className="text-xs text-[var(--etihuku-gray-500)] mt-0.5">Channels</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-[var(--etihuku-gray-800)]">
        {([
          { id: "active",  label: "Active Alerts",   count: firingCount                             },
          { id: "rules",   label: "Alert Rules",      count: rules.filter(r => r.enabled).length    },
          { id: "history", label: "History",          count: events.filter(e => e.status === "resolved").length },
        ] as { id: AlertTab; label: string; count: number }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px",
              tab === t.id
                ? "border-[var(--etihuku-indigo)] text-[var(--etihuku-indigo)]"
                : "border-transparent text-[var(--etihuku-gray-400)] hover:text-white"
            )}
          >
            {t.label}
            {t.count > 0 && (
              <span className={cn(
                "text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center",
                t.id === "active" && firingCount > 0 ? "bg-red-500 text-white" : "bg-[var(--etihuku-gray-700)] text-[var(--etihuku-gray-300)]"
              )}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Active alerts */}
      {tab === "active" && (
        <div className="space-y-3">
          {events.filter(e => e.status !== "resolved").map(ev => {
            const sevCfg = SEVERITY_CONFIG[ev.severity];
            const statusCfg = STATUS_CONFIG[ev.status];
            const SevIcon = sevCfg.icon;

            return (
              <div key={ev.id} className={cn("card", sevCfg.bg)}>
                <div className="flex items-start gap-3">
                  <SevIcon size={16} className="shrink-0 mt-0.5 animate-pulse" style={{ color: sevCfg.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm text-white">{ev.ruleName}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                        style={{ color: sevCfg.color, backgroundColor: `${sevCfg.color}20` }}>
                        {ev.severity}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                        style={{ color: statusCfg.color, backgroundColor: `${statusCfg.color}20` }}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--etihuku-gray-400)] mb-2">
                      <span className="font-mono">{ev.model}</span>
                      {" · "}{ev.metric}: <span className="font-mono font-bold text-white">{ev.value}</span>
                      {" (threshold: "}<span className="font-mono text-[var(--etihuku-gray-400)]">{ev.threshold}</span>{")"}
                    </div>
                    {ev.acknowledgedBy && (
                      <div className="text-xs text-amber-400">
                        Acknowledged by {ev.acknowledgedBy}
                        {ev.note && <> — {ev.note}</>}
                      </div>
                    )}
                    <div className="text-[10px] text-[var(--etihuku-gray-600)] mt-1">
                      <Clock size={9} className="inline mr-1" />
                      Fired: {ev.firedAt}
                    </div>
                  </div>
                  {ev.status === "firing" && (
                    <button
                      onClick={() => acknowledge(ev.id)}
                      className="btn btn-secondary btn-sm text-xs shrink-0 flex items-center gap-1.5"
                    >
                      <Check size={12} /> Acknowledge
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {events.filter(e => e.status !== "resolved").length === 0 && (
            <div className="card text-center py-12">
              <CheckCircle2 size={28} className="mx-auto text-green-400 mb-3" />
              <p className="text-sm text-[var(--etihuku-gray-300)]">All clear — no active alerts</p>
            </div>
          )}
        </div>
      )}

      {/* Rules */}
      {tab === "rules" && (
        <div className="space-y-2">
          {rules.map(rule => {
            const sevCfg = SEVERITY_CONFIG[rule.severity];
            return (
              <div key={rule.id} className={cn("card", !rule.enabled && "opacity-55")}>
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-sm text-white">{rule.name}</span>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                        style={{ color: sevCfg.color, backgroundColor: `${sevCfg.color}20` }}>
                        {rule.severity}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--etihuku-gray-500)] mb-2">
                      <span className="font-mono">{rule.model}</span>
                      {" · "}{rule.metric} {rule.condition} <span className="font-mono font-bold text-white">{rule.threshold}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {rule.channels.map(ch => {
                        const chCfg = CHANNEL_CONFIG[ch];
                        const ChIcon = chCfg.icon;
                        return (
                          <span key={ch} className="flex items-center gap-1 text-[10px] text-[var(--etihuku-gray-500)]">
                            <ChIcon size={10} /> {chCfg.label}
                          </span>
                        );
                      })}
                      {rule.lastTriggered && rule.lastTriggered !== "Never" && (
                        <span className="text-[10px] text-[var(--etihuku-gray-600)] ml-auto">Last: {rule.lastTriggered}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={cn(
                        "relative w-10 h-5 rounded-full transition-colors shrink-0",
                        rule.enabled ? "bg-[var(--etihuku-indigo)]" : "bg-[var(--etihuku-gray-700)]"
                      )}
                    >
                      <div className={cn(
                        "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                        rule.enabled ? "translate-x-5" : "translate-x-0.5"
                      )} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* History */}
      {tab === "history" && (
        <div className="space-y-2">
          {events.map(ev => {
            const sevCfg = SEVERITY_CONFIG[ev.severity];
            const statusCfg = STATUS_CONFIG[ev.status];
            return (
              <div key={ev.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--etihuku-gray-800)] transition-colors">
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ color: statusCfg.color, backgroundColor: statusCfg.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-white">{ev.ruleName}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                      style={{ color: statusCfg.color, backgroundColor: `${statusCfg.color}20` }}>
                      {statusCfg.label}
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--etihuku-gray-500)]">
                    {ev.metric}: <span className="font-mono">{ev.value}</span> · {ev.firedAt}
                    {ev.resolvedAt && <> → {ev.resolvedAt}</>}
                  </div>
                  {ev.note && (
                    <div className="text-[10px] text-[var(--etihuku-gray-400)] mt-0.5">{ev.note}</div>
                  )}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wide shrink-0 px-1.5 py-0.5 rounded"
                  style={{ color: sevCfg.color, backgroundColor: `${sevCfg.color}15` }}>
                  {ev.severity}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
