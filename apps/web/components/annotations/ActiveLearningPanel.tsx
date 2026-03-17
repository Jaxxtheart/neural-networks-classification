"use client";

import { useState } from "react";
import { Brain, TrendingUp, Zap, ChevronRight, RefreshCw, BarChart2, Target, Layers } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { cn } from "@/lib/utils/cn";
import QualityScore from "@/components/shared/QualityScore";

interface UncertainSample {
  id: string;
  preview: string;
  uncertainty: number;
  currentPrediction: string;
  alternativePredictions: { label: string; prob: number }[];
  source: string;
  annotated: boolean;
}

const MOCK_SAMPLES: UncertainSample[] = [
  {
    id: "al-1",
    preview: "Customer called re: roaming charge in Zimbabwe but claims not to have travelled…",
    uncertainty: 0.87,
    currentPrediction: "Complaint",
    alternativePredictions: [
      { label: "Complaint",    prob: 0.38 },
      { label: "Fraud Alert",  prob: 0.34 },
      { label: "Query",        prob: 0.28 },
    ],
    source: "Call Transcript Dataset",
    annotated: false,
  },
  {
    id: "al-2",
    preview: "Image: blurry, partially obscured object near conveyor belt, possible hazard…",
    uncertainty: 0.83,
    currentPrediction: "Equipment",
    alternativePredictions: [
      { label: "Equipment",  prob: 0.42 },
      { label: "Hazard Zone",prob: 0.41 },
      { label: "Person",     prob: 0.17 },
    ],
    source: "Mine Floor CCTV Batch 12",
    annotated: false,
  },
  {
    id: "al-3",
    preview: "Sensor reading: temp=87°C, vibration=1.2g, power=540W for 3 consecutive samples…",
    uncertainty: 0.79,
    currentPrediction: "Anomaly",
    alternativePredictions: [
      { label: "Anomaly",      prob: 0.47 },
      { label: "Peak Load",    prob: 0.35 },
      { label: "Maintenance",  prob: 0.18 },
    ],
    source: "Sensor Array Alpha",
    annotated: false,
  },
  {
    id: "al-4",
    preview: "Document: ACN-2026-00482 — structural crack detected at 22.3m elevation, width 0.8mm…",
    uncertainty: 0.71,
    currentPrediction: "Crack",
    alternativePredictions: [
      { label: "Crack",    prob: 0.52 },
      { label: "Pothole",  prob: 0.31 },
      { label: "Normal",   prob: 0.17 },
    ],
    source: "Inspection Report Batch",
    annotated: false,
  },
  {
    id: "al-5",
    preview: "Transaction: R 7,890 to merchant 'FX INTL TRADE' from account with 3 prev chargebacks…",
    uncertainty: 0.65,
    currentPrediction: "Fraud Alert",
    alternativePredictions: [
      { label: "Fraud Alert", prob: 0.58 },
      { label: "Escalate",    prob: 0.27 },
      { label: "Normal",      prob: 0.15 },
    ],
    source: "Transaction Dataset",
    annotated: false,
  },
];

const BATCH_IMPROVEMENTS = [
  { batch: "Batch 1", f1Before: 0.71, f1After: 0.76, samples: 50  },
  { batch: "Batch 2", f1Before: 0.76, f1After: 0.81, samples: 50  },
  { batch: "Batch 3", f1Before: 0.81, f1After: 0.85, samples: 50  },
  { batch: "Batch 4", f1Before: 0.85, f1After: 0.87, samples: 40  },
  { batch: "Batch 5", f1Before: 0.87, f1After: 0.89, samples: 30  },
  { batch: "Current", f1Before: 0.89, f1After: 0,    samples: 42  },
];

export function ActiveLearningPanel() {
  const [samples, setSamples] = useState(MOCK_SAMPLES);
  const [selected, setSelected] = useState<string | null>("al-1");
  const [annotationLabel, setAnnotationLabel] = useState("");
  const [estimating, setEstimating] = useState(false);

  const selectedSample = samples.find(s => s.id === selected);
  const annotated = samples.filter(s => s.annotated).length;
  const currentF1 = 0.89;
  const estimatedImprovement = (annotated / MOCK_SAMPLES.length) * 0.03;

  function submitAnnotation(sampleId: string, label: string) {
    setSamples(prev => prev.map(s => s.id === sampleId ? { ...s, annotated: true, currentPrediction: label } : s));
    setAnnotationLabel("");
    // Auto-advance to next unannotated
    const nextIdx = samples.findIndex(s => s.id === sampleId) + 1;
    const next = samples.find((s, i) => i >= nextIdx && !s.annotated);
    if (next) setSelected(next.id);
  }

  function fetchNextBatch() {
    setEstimating(true);
    setTimeout(() => setEstimating(false), 1500);
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card text-center">
          <div className="text-2xl font-display font-bold text-[var(--etihuku-indigo)]">{MOCK_SAMPLES.length - annotated}</div>
          <div className="text-xs text-[var(--etihuku-gray-500)] mt-0.5">Queued Samples</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-display font-bold text-[var(--etihuku-gold)]">{annotated}</div>
          <div className="text-xs text-[var(--etihuku-gray-500)] mt-0.5">Labelled This Batch</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-display font-bold text-white">{(currentF1 * 100).toFixed(0)}</div>
          <div className="text-xs text-[var(--etihuku-gray-500)] mt-0.5">Current F1 Score</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-display font-bold text-green-400">+{(estimatedImprovement * 100).toFixed(1)}%</div>
          <div className="text-xs text-[var(--etihuku-gray-500)] mt-0.5">Est. F1 Improvement</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Sample queue */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-[var(--etihuku-gray-400)] uppercase tracking-wide">
              Uncertainty Queue
            </div>
            <button
              onClick={fetchNextBatch}
              className={cn("flex items-center gap-1.5 text-xs text-[var(--etihuku-indigo)] hover:underline", estimating && "opacity-50")}
            >
              <RefreshCw size={11} className={estimating ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {samples.map(sample => (
            <div
              key={sample.id}
              onClick={() => setSelected(sample.id)}
              className={cn(
                "card p-3 cursor-pointer transition-all",
                selected === sample.id ? "border-[var(--etihuku-indigo)] shadow-glow" : "hover:border-[var(--etihuku-gray-600)]",
                sample.annotated && "opacity-50"
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: sample.uncertainty > 0.80 ? "#EF4444" :
                                       sample.uncertainty > 0.70 ? "#F59E0B" : "#10B981"
                    }}
                  />
                  <span className="text-xs font-mono text-[var(--etihuku-gray-300)] font-semibold">
                    {Math.round(sample.uncertainty * 100)}% uncertain
                  </span>
                </div>
                {sample.annotated && (
                  <span className="text-[9px] text-green-400 font-bold uppercase">Done</span>
                )}
              </div>
              <p className="text-[10px] text-[var(--etihuku-gray-500)] line-clamp-2 leading-relaxed">
                {sample.preview}
              </p>
              <div className="text-[9px] text-[var(--etihuku-gray-600)] mt-1">{sample.source}</div>
            </div>
          ))}
        </div>

        {/* Detail + annotation */}
        <div className="lg:col-span-3 space-y-3">
          {selectedSample ? (
            <>
              {/* Sample card */}
              <div className="card">
                <div className="flex items-center gap-2 mb-3">
                  <Brain size={14} className="text-[var(--etihuku-indigo)]" />
                  <span className="text-xs font-medium text-[var(--etihuku-gray-300)]">
                    Most informative sample — uncertainty: {Math.round(selectedSample.uncertainty * 100)}%
                  </span>
                </div>
                <p className="text-sm text-[var(--etihuku-gray-200)] leading-relaxed mb-3 p-3 bg-[var(--etihuku-gray-800)] rounded-lg">
                  {selectedSample.preview}
                </p>
                <div className="text-[10px] text-[var(--etihuku-gray-500)]">Source: {selectedSample.source}</div>
              </div>

              {/* Model predictions */}
              <div className="card">
                <div className="text-xs font-medium text-[var(--etihuku-gray-400)] uppercase tracking-wide mb-3">
                  Model Prediction Distribution
                </div>
                <div className="space-y-2">
                  {selectedSample.alternativePredictions.map((pred, i) => (
                    <div key={pred.label} className="flex items-center gap-3">
                      <div className="text-xs text-[var(--etihuku-gray-300)] w-28 truncate">{pred.label}</div>
                      <div className="flex-1 h-4 bg-[var(--etihuku-gray-800)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pred.prob * 100}%`,
                            backgroundColor: i === 0 ? "var(--etihuku-indigo)" : i === 1 ? "#F59E0B" : "#6B6B88",
                          }}
                        />
                      </div>
                      <div className="text-xs font-mono text-[var(--etihuku-gray-400)] w-10 text-right">
                        {(pred.prob * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-[var(--etihuku-gray-800)] text-xs text-[var(--etihuku-gray-500)]">
                  High uncertainty indicates the model needs this label to improve.
                </div>
              </div>

              {/* Annotation interface */}
              {!selectedSample.annotated && (
                <div className="card border-[var(--etihuku-indigo)]/30">
                  <div className="text-xs font-medium text-[var(--etihuku-gray-300)] uppercase tracking-wide mb-3">
                    Your Label
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedSample.alternativePredictions.map(pred => (
                      <button
                        key={pred.label}
                        onClick={() => setAnnotationLabel(pred.label)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                          annotationLabel === pred.label
                            ? "bg-[var(--etihuku-indigo)] border-[var(--etihuku-indigo)] text-white"
                            : "border-[var(--etihuku-gray-700)] text-[var(--etihuku-gray-300)] hover:border-[var(--etihuku-gray-500)]"
                        )}
                      >
                        {pred.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => submitAnnotation(selectedSample.id, annotationLabel)}
                      disabled={!annotationLabel}
                      className="btn btn-primary btn-sm flex items-center gap-2 disabled:opacity-40"
                    >
                      <Zap size={13} /> Submit Label
                    </button>
                    <button className="btn btn-secondary btn-sm">Skip</button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <Target size={28} className="text-[var(--etihuku-gray-700)] mb-3" />
              <p className="text-sm text-[var(--etihuku-gray-500)]">Select a sample to annotate</p>
            </div>
          )}

          {/* Improvement chart */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-[var(--etihuku-gold)]" />
              <span className="text-xs font-medium text-[var(--etihuku-gray-300)]">F1 Score Improvement by Batch</span>
            </div>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={BATCH_IMPROVEMENTS.filter(b => b.f1After > 0)} barCategoryGap="30%">
                <XAxis dataKey="batch" tick={{ fill: "var(--etihuku-gray-500)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0.65, 0.95]} tick={{ fill: "var(--etihuku-gray-500)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--etihuku-gray-900)", border: "1px solid var(--etihuku-gray-700)", borderRadius: 6, fontSize: 11 }}
                  formatter={(v: number, name: string) => [`${(v * 100).toFixed(1)}%`, name.replace(/([A-Z])/g, ' $1').trim()]}
                />
                <Bar dataKey="f1After" radius={[3, 3, 0, 0]}>
                  {BATCH_IMPROVEMENTS.filter(b => b.f1After > 0).map((_, i, arr) => (
                    <Cell key={i} fill={i === arr.length - 1 ? "var(--etihuku-gold)" : "var(--etihuku-indigo)"} opacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
