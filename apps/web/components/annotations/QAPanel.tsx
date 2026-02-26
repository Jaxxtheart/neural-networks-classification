"use client";

import { useState } from "react";
import { Users, AlertTriangle, CheckCircle2, ChevronRight, BarChart2, MessageCircle } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils/cn";

interface AnnotatorStats {
  id: string;
  name: string;
  avatar: string;
  completed: number;
  agreement: number;
  kappa: number;
  avgTime: string;
  streak: number;
}

interface DisputedSample {
  id: string;
  preview: string;
  annotatorA: { name: string; label: string };
  annotatorB: { name: string; label: string };
  annotatorC?: { name: string; label: string };
  escalated: boolean;
  resolved: boolean;
  consensus?: string;
}

interface AnnotationProject {
  id: string;
  name: string;
  vertical: string;
  totalSamples: number;
  completed: number;
  assignedTo: string[];
  deadline: string;
  status: "active" | "completed" | "overdue";
  labelSchema: string;
}

const ANNOTATORS: AnnotatorStats[] = [
  { id: "a1", name: "T. Ndlovu",   avatar: "TN", completed: 284, agreement: 0.94, kappa: 0.91, avgTime: "1.2m", streak: 12 },
  { id: "a2", name: "S. Botha",    avatar: "SB", completed: 201, agreement: 0.89, kappa: 0.86, avgTime: "1.8m", streak: 7  },
  { id: "a3", name: "A. Dlamini",  avatar: "AD", completed: 156, agreement: 0.91, kappa: 0.88, avgTime: "2.1m", streak: 5  },
  { id: "a4", name: "L. Sithole",  avatar: "LS", completed: 89,  agreement: 0.82, kappa: 0.79, avgTime: "3.4m", streak: 2  },
];

const DISPUTED: DisputedSample[] = [
  {
    id: "d1",
    preview: "Customer +27829001234 reports R12K transaction they don't recognise — third occurrence this month",
    annotatorA: { name: "T. Ndlovu", label: "Fraud Alert"  },
    annotatorB: { name: "S. Botha",  label: "Escalate"     },
    annotatorC: { name: "A. Dlamini",label: "Fraud Alert"  },
    escalated: false, resolved: false,
  },
  {
    id: "d2",
    preview: "Sensor temp=91°C for 8 consecutive readings, vibration within normal range",
    annotatorA: { name: "T. Ndlovu",  label: "Anomaly"    },
    annotatorB: { name: "L. Sithole", label: "Peak Load"  },
    escalated: true, resolved: false,
  },
  {
    id: "d3",
    preview: "Image: partially visible figure near fence at 02:14 — low resolution, foggy conditions",
    annotatorA: { name: "S. Botha",   label: "Person"    },
    annotatorB: { name: "A. Dlamini", label: "Hazard Zone" },
    escalated: false, resolved: true, consensus: "Person",
  },
];

const PROJECTS: AnnotationProject[] = [
  { id: "p1", name: "Churn Call Transcripts", vertical: "telecom", totalSamples: 1200, completed: 847, assignedTo: ["T. Ndlovu", "S. Botha"], deadline: "28 Feb 2026", status: "active", labelSchema: "v2.1" },
  { id: "p2", name: "Mine Floor CCTV Batch 12", vertical: "mining", totalSamples: 420, completed: 420, assignedTo: ["A. Dlamini", "L. Sithole"], deadline: "20 Feb 2026", status: "completed", labelSchema: "v1.3" },
  { id: "p3", name: "Fraud Transaction Dataset", vertical: "security", totalSamples: 800, completed: 289, assignedTo: ["T. Ndlovu", "A. Dlamini", "S. Botha"], deadline: "10 Feb 2026", status: "overdue", labelSchema: "v3.0" },
];

const VERTICAL_COLORS: Record<string, string> = { telecom: "#8B5CF6", security: "#F59E0B", mining: "#10B981", engineering: "#EC4899" };

type QATab = "agreement" | "disputes" | "projects";

export function QAPanel() {
  const [tab, setTab] = useState<QATab>("agreement");
  const [resolveModal, setResolveModal] = useState<string | null>(null);
  const [consensusLabel, setConsensusLabel] = useState("");

  const avgKappa = ANNOTATORS.reduce((s, a) => s + a.kappa, 0) / ANNOTATORS.length;
  const fleissKappa = 0.83; // mock

  const radarData = [
    { metric: "Speed",       TN: 0.92, SB: 0.78, AD: 0.71, LS: 0.55 },
    { metric: "Accuracy",    TN: 0.94, SB: 0.89, AD: 0.91, LS: 0.82 },
    { metric: "Consistency", TN: 0.91, SB: 0.86, AD: 0.88, LS: 0.79 },
    { metric: "Volume",      TN: 0.95, SB: 0.67, AD: 0.52, LS: 0.30 },
    { metric: "Agreement",   TN: 0.94, SB: 0.89, AD: 0.91, LS: 0.82 },
  ];

  function resolve(id: string) {
    setResolveModal(null);
    setConsensusLabel("");
  }

  return (
    <div className="space-y-4">
      {/* Top metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card text-center">
          <div className={cn("text-2xl font-display font-bold", fleissKappa >= 0.8 ? "text-[var(--etihuku-gold)]" : "text-[var(--etihuku-indigo)]")}>
            {fleissKappa.toFixed(2)}
          </div>
          <div className="text-xs text-[var(--etihuku-gray-500)] mt-0.5">Fleiss&apos; κ (All)</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-display font-bold text-white">{avgKappa.toFixed(2)}</div>
          <div className="text-xs text-[var(--etihuku-gray-500)] mt-0.5">Avg Cohen&apos;s κ</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-display font-bold text-red-400">{DISPUTED.filter(d => !d.resolved).length}</div>
          <div className="text-xs text-[var(--etihuku-gray-500)] mt-0.5">Disputes Pending</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-display font-bold text-green-400">{ANNOTATORS.reduce((s, a) => s + a.completed, 0).toLocaleString()}</div>
          <div className="text-xs text-[var(--etihuku-gray-500)] mt-0.5">Total Labelled</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-[var(--etihuku-gray-800)]">
        {([
          { id: "agreement", label: "Annotator Agreement", icon: BarChart2     },
          { id: "disputes",  label: "Disputes",            icon: AlertTriangle  },
          { id: "projects",  label: "Projects",            icon: Users          },
        ] as { id: QATab; label: string; icon: React.ElementType }[]).map(t => {
          const Icon = t.icon;
          return (
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
              <Icon size={13} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === "agreement" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs font-medium text-[var(--etihuku-gray-400)] uppercase tracking-wide mb-3">
              Annotator Performance
            </div>
            {ANNOTATORS.map(a => (
              <div key={a.id} className="card">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[var(--etihuku-indigo)]/20 flex items-center justify-center text-xs font-bold text-[var(--etihuku-indigo)] shrink-0">
                    {a.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{a.name}</span>
                      <span className="text-[10px] text-[var(--etihuku-gray-500)]">· {a.completed} labels · {a.avgTime}/item</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[10px] text-[var(--etihuku-gray-500)]">
                          <span>Agreement</span><span className="text-white">{(a.agreement * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-[var(--etihuku-gray-800)] rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-[var(--etihuku-indigo)]" style={{ width: `${a.agreement * 100}%` }} />
                        </div>
                      </div>
                      <div className={cn("text-sm font-mono font-bold px-2 py-0.5 rounded",
                        a.kappa >= 0.9 ? "text-[var(--etihuku-gold)] bg-[var(--etihuku-gold)]/10" :
                        a.kappa >= 0.8 ? "text-green-400 bg-green-950/30" :
                        "text-amber-400 bg-amber-950/30"
                      )}>
                        κ={a.kappa.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="text-xs font-medium text-[var(--etihuku-gray-400)] uppercase tracking-wide mb-2">
              Annotator Radar
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--etihuku-gray-800)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "var(--etihuku-gray-500)", fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />
                <Radar name="T. Ndlovu" dataKey="TN" stroke="#5046E5" fill="#5046E5" fillOpacity={0.15} strokeWidth={2} />
                <Radar name="S. Botha"  dataKey="SB" stroke="#10B981" fill="#10B981" fillOpacity={0.1}  strokeWidth={1.5} />
                <Radar name="A. Dlamini"dataKey="AD" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.1}  strokeWidth={1.5} />
                <Tooltip contentStyle={{ background: "var(--etihuku-gray-900)", border: "1px solid var(--etihuku-gray-700)", borderRadius: 6, fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === "disputes" && (
        <div className="space-y-3">
          {DISPUTED.map(d => (
            <div key={d.id} className={cn("card", d.escalated && "border-amber-800/50", d.resolved && "opacity-70")}>
              <div className="flex items-start gap-3">
                {d.escalated && <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />}
                {d.resolved  && <CheckCircle2  size={16} className="text-green-400 shrink-0 mt-0.5" />}
                {!d.escalated && !d.resolved && <MessageCircle size={16} className="text-[var(--etihuku-gray-500)] shrink-0 mt-0.5" />}

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--etihuku-gray-300)] mb-2 leading-relaxed">&ldquo;{d.preview}&rdquo;</p>

                  <div className="flex flex-wrap gap-2 mb-2">
                    {[d.annotatorA, d.annotatorB, d.annotatorC].filter(Boolean).map((ann, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs">
                        <div className="w-5 h-5 rounded-full bg-[var(--etihuku-gray-700)] flex items-center justify-center text-[9px] font-bold text-white">
                          {ann!.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span className="text-[var(--etihuku-gray-500)]">{ann!.name}:</span>
                        <span className="font-medium text-white">{ann!.label}</span>
                      </div>
                    ))}
                  </div>

                  {d.resolved && d.consensus && (
                    <div className="text-xs text-green-400">
                      ✓ Consensus: <strong>{d.consensus}</strong>
                    </div>
                  )}
                </div>

                {!d.resolved && (
                  <button
                    onClick={() => setResolveModal(d.id)}
                    className="btn btn-secondary btn-sm text-xs shrink-0"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "projects" && (
        <div className="space-y-3">
          {PROJECTS.map(proj => {
            const pct = Math.round((proj.completed / proj.totalSamples) * 100);
            const vColor = VERTICAL_COLORS[proj.vertical] ?? "#6B6B88";
            return (
              <div key={proj.id} className="card">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-sm text-white">{proj.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium capitalize"
                        style={{ color: vColor, backgroundColor: `${vColor}15` }}>
                        {proj.vertical}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--etihuku-gray-500)]">
                      Schema: {proj.labelSchema} · Due: {proj.deadline} · {proj.assignedTo.join(", ")}
                    </div>
                  </div>
                  <div className={cn(
                    "text-xs font-bold px-2.5 py-1 rounded-full",
                    proj.status === "completed" ? "bg-green-950/50 text-green-400" :
                    proj.status === "overdue"   ? "bg-red-950/50 text-red-400" :
                    "bg-[var(--etihuku-indigo)]/10 text-[var(--etihuku-indigo)]"
                  )}>
                    {proj.status}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-[var(--etihuku-gray-800)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: proj.status === "completed" ? "#10B981" :
                                         proj.status === "overdue"   ? "#EF4444" : "var(--etihuku-indigo)"
                      }}
                    />
                  </div>
                  <span className="text-xs font-mono text-white shrink-0">
                    {proj.completed.toLocaleString()} / {proj.totalSamples.toLocaleString()}
                  </span>
                  <span className="text-xs text-[var(--etihuku-gray-500)] shrink-0">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
