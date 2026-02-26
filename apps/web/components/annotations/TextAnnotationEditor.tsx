"use client";

import { useState, useRef } from "react";
import { Tag, Trash2, Check, X, FileText, Link2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type AnnotMode = "ner" | "classification" | "relation";

interface SpanAnnotation {
  id: string;
  start: number;
  end: number;
  text: string;
  label: string;
  color: string;
  source: "human" | "ai";
  confidence?: number;
}

interface DocLabel {
  label: string;
  confidence?: number;
  source: "human" | "ai";
}

const NER_LABELS = [
  { name: "PERSON",       color: "#3B82F6" },
  { name: "ORG",          color: "#10B981" },
  { name: "LOCATION",     color: "#F59E0B" },
  { name: "DATE",         color: "#8B5CF6" },
  { name: "PRODUCT",      color: "#EC4899" },
  { name: "MSISDN",       color: "#06B6D4" },
  { name: "AMOUNT",       color: "#84CC16" },
  { name: "CASE_ID",      color: "#F97316" },
];

const DOC_CLASSES = ["Complaint", "Query", "Fraud Alert", "Normal", "Escalation", "RICA Related"];

const SAMPLE_TEXT = `Customer Thabo Nkosi (MSISDN: +27829001234) contacted Etihuku support on 14 February 2026 regarding an unexpected data charge of R487.50 on account ACC-2024-88921. The customer states they were in Johannesburg CBD and did not enable roaming. Case assigned to Agent Sarah Botha (Employee: EMP-0042) at Vodacom partner branch. Reference: TKT-2026-00193.`;

// Mock AI pre-annotations
const MOCK_AI_SPANS: SpanAnnotation[] = [
  { id: "s1", start: 9,   end: 21, text: "Thabo Nkosi",     label: "PERSON",   color: "#3B82F6", source: "ai", confidence: 0.97 },
  { id: "s2", start: 32,  end: 47, text: "+27829001234",    label: "MSISDN",   color: "#06B6D4", source: "ai", confidence: 0.99 },
  { id: "s3", start: 65,  end: 72, text: "Etihuku",         label: "ORG",      color: "#10B981", source: "ai", confidence: 0.91 },
  { id: "s4", start: 83,  end: 99, text: "14 February 2026",label: "DATE",     color: "#8B5CF6", source: "ai", confidence: 0.96 },
  { id: "s5", start: 141, end: 148,text: "R487.50",         label: "AMOUNT",   color: "#84CC16", source: "ai", confidence: 0.94 },
  { id: "s6", start: 159, end: 176,text: "ACC-2024-88921",  label: "CASE_ID",  color: "#F97316", source: "ai", confidence: 0.88 },
  { id: "s7", start: 224, end: 243,text: "Johannesburg CBD",label: "LOCATION", color: "#F59E0B", source: "ai", confidence: 0.93 },
  { id: "s8", start: 285, end: 297,text: "Sarah Botha",     label: "PERSON",   color: "#3B82F6", source: "ai", confidence: 0.95 },
];

export function TextAnnotationEditor() {
  const [mode, setMode] = useState<AnnotMode>("ner");
  const [spans, setSpans] = useState<SpanAnnotation[]>(MOCK_AI_SPANS);
  const [docLabels, setDocLabels] = useState<DocLabel[]>([
    { label: "Complaint", confidence: 0.89, source: "ai" },
    { label: "RICA Related", confidence: 0.74, source: "ai" },
  ]);
  const [activeNerLabel, setActiveNerLabel] = useState(NER_LABELS[0]);
  const [selection, setSelection] = useState<{ start: number; end: number; text: string } | null>(null);
  const textRef = useRef<HTMLDivElement>(null);

  function handleTextMouseUp() {
    const sel = window.getSelection();
    if (!sel || !textRef.current || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const text = sel.toString().trim();
    if (!text) return;

    // Compute character offsets relative to the full text
    const fullRange = document.createRange();
    fullRange.setStart(textRef.current, 0);
    fullRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = fullRange.toString().length;
    const endOffset = startOffset + text.length;

    setSelection({ start: startOffset, end: endOffset, text });
  }

  function addSpan() {
    if (!selection) return;
    const newSpan: SpanAnnotation = {
      id: `span-${Date.now()}`,
      start: selection.start,
      end: selection.end,
      text: selection.text,
      label: activeNerLabel.name,
      color: activeNerLabel.color,
      source: "human",
    };
    setSpans(prev => [...prev, newSpan]);
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }

  function removeSpan(id: string) {
    setSpans(prev => prev.filter(s => s.id !== id));
  }

  function acceptAISpan(id: string) {
    setSpans(prev => prev.map(s => s.id === id ? { ...s, source: "human", confidence: undefined } : s));
  }

  function toggleDocLabel(label: string) {
    setDocLabels(prev => {
      const existing = prev.find(l => l.label === label);
      if (existing) return prev.filter(l => l.label !== label);
      return [...prev, { label, source: "human" }];
    });
  }

  // Build highlighted HTML from spans
  function renderAnnotatedText() {
    if (mode !== "ner") {
      return <span className="text-sm text-[var(--etihuku-gray-200)] leading-relaxed">{SAMPLE_TEXT}</span>;
    }

    const sorted = [...spans].sort((a, b) => a.start - b.start);
    const parts: React.ReactNode[] = [];
    let pos = 0;

    sorted.forEach(span => {
      if (span.start > pos) {
        parts.push(<span key={`txt-${pos}`}>{SAMPLE_TEXT.slice(pos, span.start)}</span>);
      }
      if (span.start >= pos) {
        parts.push(
          <mark
            key={span.id}
            className="relative inline rounded-sm cursor-pointer group"
            style={{
              backgroundColor: `${span.color}30`,
              borderBottom: `2px solid ${span.color}`,
              padding: "1px 0",
            }}
            title={`${span.label}${span.confidence ? ` (${Math.round(span.confidence * 100)}%)` : ""}`}
          >
            {SAMPLE_TEXT.slice(span.start, span.end)}
            <span
              className="absolute -top-5 left-0 text-[9px] font-bold uppercase tracking-wide px-1 py-0.5 rounded whitespace-nowrap z-10"
              style={{ backgroundColor: span.color, color: "white" }}
            >
              {span.label}
              {span.source === "ai" && span.confidence && ` ${Math.round(span.confidence * 100)}%`}
            </span>
          </mark>
        );
        pos = span.end;
      }
    });
    if (pos < SAMPLE_TEXT.length) {
      parts.push(<span key="txt-end">{SAMPLE_TEXT.slice(pos)}</span>);
    }
    return parts;
  }

  return (
    <div className="space-y-4">
      {/* Mode tabs */}
      <div className="flex gap-1 p-1 bg-[var(--etihuku-gray-900)] border border-[var(--etihuku-gray-800)] rounded-lg w-fit">
        {([
          { id: "ner",            label: "Entity (NER)",          icon: Tag       },
          { id: "classification", label: "Classification",        icon: FileText  },
          { id: "relation",       label: "Relation Extraction",   icon: Link2     },
        ] as { id: AnnotMode; label: string; icon: React.ElementType }[]).map(m => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all",
                mode === m.id ? "bg-[var(--etihuku-indigo)] text-white" : "text-[var(--etihuku-gray-400)] hover:text-white"
              )}
            >
              <Icon size={12} />{m.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main text area */}
        <div className="lg:col-span-2 space-y-3">
          <div className="card">
            <div className="text-[10px] uppercase tracking-wide text-[var(--etihuku-gray-500)] mb-3">
              Document — Case TKT-2026-00193
            </div>
            <div
              ref={textRef}
              className="text-sm text-[var(--etihuku-gray-200)] leading-loose select-text cursor-text relative pt-3"
              onMouseUp={handleTextMouseUp}
            >
              {renderAnnotatedText()}
            </div>

            {selection && mode === "ner" && (
              <div className="mt-3 pt-3 border-t border-[var(--etihuku-gray-800)] flex items-center gap-3">
                <span className="text-xs text-[var(--etihuku-gray-400)]">
                  Selected: <strong className="text-white">&quot;{selection.text}&quot;</strong>
                </span>
                <select
                  value={activeNerLabel.name}
                  onChange={e => setActiveNerLabel(NER_LABELS.find(l => l.name === e.target.value) ?? NER_LABELS[0])}
                  className="form-input text-xs py-1 px-2 h-7 w-auto"
                >
                  {NER_LABELS.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
                </select>
                <button onClick={addSpan} className="btn btn-primary btn-sm text-xs">
                  Add Label
                </button>
                <button onClick={() => setSelection(null)} className="btn btn-secondary btn-sm text-xs">
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Document classification */}
          {mode === "classification" && (
            <div className="card">
              <div className="text-xs font-medium text-[var(--etihuku-gray-300)] mb-3 uppercase tracking-wide">
                Document Classes
              </div>
              <div className="flex flex-wrap gap-2">
                {DOC_CLASSES.map(cls => {
                  const active = docLabels.some(l => l.label === cls);
                  const aiLabel = docLabels.find(l => l.label === cls);
                  return (
                    <button
                      key={cls}
                      onClick={() => toggleDocLabel(cls)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                        active
                          ? "bg-[var(--etihuku-indigo)]/20 border-[var(--etihuku-indigo)] text-[var(--etihuku-indigo)]"
                          : "border-[var(--etihuku-gray-700)] text-[var(--etihuku-gray-400)] hover:border-[var(--etihuku-gray-500)]"
                      )}
                    >
                      {active && <Check size={11} />}
                      {cls}
                      {aiLabel?.confidence && (
                        <span className="text-[9px] opacity-70">{Math.round(aiLabel.confidence * 100)}%</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: labels + entity list */}
        <div className="space-y-3">
          {mode === "ner" && (
            <>
              <div className="card">
                <div className="text-[10px] uppercase tracking-wide text-[var(--etihuku-gray-500)] mb-2">
                  Active Label
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {NER_LABELS.map(l => (
                    <button
                      key={l.name}
                      onClick={() => setActiveNerLabel(l)}
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-all border",
                        activeNerLabel.name === l.name
                          ? "border-transparent text-white"
                          : "border-[var(--etihuku-gray-800)] text-[var(--etihuku-gray-400)] hover:border-[var(--etihuku-gray-600)]"
                      )}
                      style={activeNerLabel.name === l.name ? { backgroundColor: `${l.color}25`, borderColor: l.color, color: l.color } : {}}
                    >
                      <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: l.color }} />
                      {l.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="text-[10px] uppercase tracking-wide text-[var(--etihuku-gray-500)] mb-2">
                  Entities ({spans.length})
                </div>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {spans.map(span => (
                    <div key={span.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-[var(--etihuku-gray-800)] group">
                      <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: span.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white truncate">&quot;{span.text}&quot;</div>
                        <div className="text-[9px] text-[var(--etihuku-gray-500)] flex items-center gap-1">
                          {span.label}
                          {span.source === "ai" && <span className="text-[var(--etihuku-indigo)]">AI {Math.round((span.confidence ?? 0) * 100)}%</span>}
                        </div>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
                        {span.source === "ai" && (
                          <button onClick={() => acceptAISpan(span.id)} className="p-1 text-green-500 hover:bg-green-950 rounded">
                            <Check size={10} />
                          </button>
                        )}
                        <button onClick={() => removeSpan(span.id)} className="p-1 text-[var(--etihuku-gray-500)] hover:text-red-400 hover:bg-red-950 rounded">
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
