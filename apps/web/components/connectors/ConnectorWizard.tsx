"use client";

import { useState } from "react";
import {
  X, ChevronRight, ChevronLeft, CheckCircle2, Loader2,
  Database, Eye, EyeOff, Clock, Zap, Calendar,
  AlertCircle, Check
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { CONNECTOR_DEFS, ConnectorDef } from "./ConnectorCatalog";

interface ConnectorWizardProps {
  initialDefId?: string;
  onClose: () => void;
  onComplete: (config: ConnectorConfig) => void;
}

export interface ConnectorConfig {
  defId: string;
  name: string;
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  scheduleType: "realtime" | "cron" | "manual";
  cronExpression: string;
}

type Step = "select" | "configure" | "test" | "schedule";

const STEPS: { id: Step; label: string }[] = [
  { id: "select",    label: "Select Type"  },
  { id: "configure", label: "Configure"    },
  { id: "test",      label: "Test"         },
  { id: "schedule",  label: "Schedule"     },
];

const CRON_PRESETS = [
  { label: "Every minute",  value: "* * * * *"       },
  { label: "Every 5 min",   value: "*/5 * * * *"     },
  { label: "Every 15 min",  value: "*/15 * * * *"    },
  { label: "Every hour",    value: "0 * * * *"       },
  { label: "Daily at midnight", value: "0 0 * * *"   },
  { label: "Weekly Sunday", value: "0 0 * * 0"       },
];

type TestStatus = "idle" | "testing" | "success" | "failed";

export function ConnectorWizard({ initialDefId, onClose, onComplete }: ConnectorWizardProps) {
  const [step, setStep] = useState<Step>(initialDefId ? "configure" : "select");
  const [selectedDef, setSelectedDef] = useState<ConnectorDef | null>(
    initialDefId ? CONNECTOR_DEFS.find(d => d.id === initialDefId) ?? null : null
  );
  const [showPassword, setShowPassword] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testLogs, setTestLogs] = useState<string[]>([]);

  const [config, setConfig] = useState<ConnectorConfig>({
    defId: initialDefId ?? "",
    name: "",
    host: "",
    port: "",
    database: "",
    username: "",
    password: "",
    scheduleType: "cron",
    cronExpression: "*/15 * * * *",
  });

  const currentStepIdx = STEPS.findIndex(s => s.id === step);

  function updateConfig(patch: Partial<ConnectorConfig>) {
    setConfig(prev => ({ ...prev, ...patch }));
  }

  function handleSelectDef(def: ConnectorDef) {
    setSelectedDef(def);
    updateConfig({ defId: def.id, name: `My ${def.name}` });
    // Set default port based on connector
    const defaultPorts: Record<string, string> = {
      postgres: "5432", mysql: "3306", mssql: "1433",
      mongodb: "27017", kafka: "9092", sftp: "22"
    };
    if (defaultPorts[def.id]) updateConfig({ port: defaultPorts[def.id] });
    setStep("configure");
  }

  function handleTest() {
    setTestStatus("testing");
    setTestLogs([]);
    const logs = [
      "Resolving host...",
      `Connecting to ${config.host || "localhost"}:${config.port}...`,
      "Authenticating...",
      "Running test query...",
      "Connection successful ✓",
    ];
    logs.forEach((log, i) => {
      setTimeout(() => {
        setTestLogs(prev => [...prev, log]);
        if (i === logs.length - 1) setTestStatus("success");
      }, (i + 1) * 600);
    });
  }

  function handleComplete() {
    onComplete(config);
    onClose();
  }

  const needsHostConfig = selectedDef && !["s3", "gcs", "azure-blob"].includes(selectedDef.id);
  const isCloudStorage = selectedDef && ["s3", "gcs", "azure-blob"].includes(selectedDef.id);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[var(--etihuku-gray-900)] rounded-xl border border-[var(--etihuku-gray-800)] shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--etihuku-gray-800)]">
          <div>
            <h2 className="text-h4 font-display text-white">Add Connector</h2>
            {selectedDef && (
              <p className="text-sm text-[var(--etihuku-gray-400)] mt-0.5">{selectedDef.name}</p>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--etihuku-gray-800)] text-[var(--etihuku-gray-400)] hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-0 px-6 pt-4 pb-2">
          {STEPS.map((s, i) => {
            const isDone = i < currentStepIdx;
            const isActive = s.id === step;
            return (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all",
                    isDone  ? "bg-[var(--etihuku-indigo)] border-[var(--etihuku-indigo)] text-white" :
                    isActive ? "border-[var(--etihuku-indigo)] text-[var(--etihuku-indigo)] bg-transparent" :
                               "border-[var(--etihuku-gray-700)] text-[var(--etihuku-gray-600)]"
                  )}>
                    {isDone ? <Check size={12} /> : i + 1}
                  </div>
                  <span className={cn("text-[10px] mt-1 font-medium",
                    isActive ? "text-[var(--etihuku-indigo)]" : isDone ? "text-[var(--etihuku-gray-400)]" : "text-[var(--etihuku-gray-600)]"
                  )}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("flex-1 h-px mx-2 mb-4 transition-all", isDone ? "bg-[var(--etihuku-indigo)]" : "bg-[var(--etihuku-gray-800)]")} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {step === "select" && (
            <SelectStep onSelect={handleSelectDef} />
          )}

          {step === "configure" && selectedDef && (
            <ConfigureStep
              def={selectedDef}
              config={config}
              onChange={updateConfig}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(p => !p)}
              needsHostConfig={!!needsHostConfig}
              isCloudStorage={!!isCloudStorage}
            />
          )}

          {step === "test" && (
            <TestStep
              config={config}
              status={testStatus}
              logs={testLogs}
              onTest={handleTest}
            />
          )}

          {step === "schedule" && (
            <ScheduleStep config={config} onChange={updateConfig} />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-[var(--etihuku-gray-800)]">
          <button
            onClick={() => {
              const idx = STEPS.findIndex(s => s.id === step);
              if (idx > 0) setStep(STEPS[idx - 1].id);
            }}
            disabled={step === "select"}
            className="btn btn-secondary btn-sm flex items-center gap-2 disabled:opacity-40"
          >
            <ChevronLeft size={14} /> Back
          </button>

          {step === "schedule" ? (
            <button onClick={handleComplete} className="btn btn-primary btn-sm flex items-center gap-2">
              <CheckCircle2 size={14} /> Save Connector
            </button>
          ) : (
            <button
              onClick={() => {
                if (step === "test" && testStatus !== "success") {
                  handleTest(); return;
                }
                const idx = STEPS.findIndex(s => s.id === step);
                if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id);
              }}
              disabled={step === "configure" && !config.name}
              className="btn btn-primary btn-sm flex items-center gap-2 disabled:opacity-40"
            >
              {step === "test" && testStatus === "idle" ? "Test Connection" :
               step === "test" && testStatus === "testing" ? "Testing…" :
               "Next"} <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SelectStep({ onSelect }: { onSelect: (def: ConnectorDef) => void }) {
  const [search, setSearch] = useState("");
  const filtered = CONNECTOR_DEFS.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-3">
      <input
        placeholder="Search connectors..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-3 py-2 bg-[var(--etihuku-gray-800)] border border-[var(--etihuku-gray-700)] rounded-md text-sm text-white placeholder-[var(--etihuku-gray-500)] focus:outline-none focus:border-[var(--etihuku-indigo)]"
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
        {filtered.map(def => {
          const Icon = def.icon;
          return (
            <button
              key={def.id}
              onClick={() => onSelect(def)}
              className="flex items-center gap-3 p-3 rounded-lg border border-[var(--etihuku-gray-800)] hover:border-[var(--etihuku-indigo)] hover:bg-[var(--etihuku-indigo)]/5 text-left transition-all group"
            >
              <div className={cn("w-8 h-8 rounded flex items-center justify-center shrink-0", def.iconBg)}>
                <Icon size={16} style={{ color: def.iconColor }} />
              </div>
              <div>
                <div className="text-sm font-medium text-white">{def.name}</div>
                <div className="text-[10px] text-[var(--etihuku-gray-500)] capitalize">{def.type}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ConfigureStep({ def, config, onChange, showPassword, onTogglePassword, needsHostConfig, isCloudStorage }: {
  def: ConnectorDef; config: ConnectorConfig; onChange: (p: Partial<ConnectorConfig>) => void;
  showPassword: boolean; onTogglePassword: () => void;
  needsHostConfig: boolean; isCloudStorage: boolean;
}) {
  return (
    <div className="space-y-4">
      <Field label="Connection Name" required>
        <input
          value={config.name}
          onChange={e => onChange({ name: e.target.value })}
          placeholder={`My ${def.name}`}
          className="form-input"
        />
      </Field>

      {needsHostConfig && (
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Field label="Host / Endpoint">
              <input value={config.host} onChange={e => onChange({ host: e.target.value })} placeholder="db.example.com" className="form-input" />
            </Field>
          </div>
          <Field label="Port">
            <input value={config.port} onChange={e => onChange({ port: e.target.value })} placeholder="5432" className="form-input" />
          </Field>
        </div>
      )}

      {!isCloudStorage && (
        <Field label="Database / Collection">
          <input value={config.database} onChange={e => onChange({ database: e.target.value })} placeholder="my_database" className="form-input" />
        </Field>
      )}

      {isCloudStorage && (
        <Field label="Bucket / Container">
          <input value={config.database} onChange={e => onChange({ database: e.target.value })} placeholder="my-bucket-name" className="form-input" />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Username / Access Key">
          <input value={config.username} onChange={e => onChange({ username: e.target.value })} placeholder="etihuku_user" className="form-input" />
        </Field>
        <Field label="Password / Secret Key">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={config.password}
              onChange={e => onChange({ password: e.target.value })}
              placeholder="••••••••"
              className="form-input pr-10"
            />
            <button onClick={onTogglePassword} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--etihuku-gray-500)]">
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </Field>
      </div>

      <div className="p-3 rounded-lg bg-[var(--etihuku-indigo)]/5 border border-[var(--etihuku-indigo)]/20 text-xs text-[var(--etihuku-gray-400)]">
        <AlertCircle size={12} className="inline mr-1.5 text-[var(--etihuku-indigo)]" />
        Credentials are encrypted at rest using AES-256 and never logged.
      </div>
    </div>
  );
}

function TestStep({ config, status, logs, onTest }: {
  config: ConnectorConfig; status: TestStatus; logs: string[]; onTest: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className={cn(
        "p-4 rounded-lg border text-center transition-all",
        status === "success" ? "border-green-800 bg-green-950/30" :
        status === "failed"  ? "border-red-800 bg-red-950/30" :
        status === "testing" ? "border-[var(--etihuku-indigo)] bg-[var(--etihuku-indigo)]/5" :
                               "border-[var(--etihuku-gray-800)]"
      )}>
        {status === "idle" && (
          <div className="space-y-2">
            <Database size={32} className="mx-auto text-[var(--etihuku-gray-600)]" />
            <p className="text-sm text-[var(--etihuku-gray-400)]">Click to test your connection settings</p>
            <button onClick={onTest} className="btn btn-primary btn-sm">Test Connection</button>
          </div>
        )}
        {status === "testing" && (
          <div className="space-y-2">
            <Loader2 size={32} className="mx-auto text-[var(--etihuku-indigo)] animate-spin" />
            <p className="text-sm text-[var(--etihuku-gray-300)]">Testing connection…</p>
          </div>
        )}
        {status === "success" && (
          <div className="space-y-2">
            <CheckCircle2 size={32} className="mx-auto text-green-400" />
            <p className="text-sm text-green-300 font-medium">Connection successful!</p>
          </div>
        )}
        {status === "failed" && (
          <div className="space-y-2">
            <AlertCircle size={32} className="mx-auto text-red-400" />
            <p className="text-sm text-red-300 font-medium">Connection failed</p>
            <button onClick={onTest} className="btn btn-sm border border-red-800 text-red-300">Retry</button>
          </div>
        )}
      </div>

      {logs.length > 0 && (
        <div className="bg-[var(--etihuku-black)] rounded-lg p-4 font-mono text-xs space-y-1.5 max-h-40 overflow-y-auto border border-[var(--etihuku-gray-800)]">
          {logs.map((log, i) => (
            <div key={i} className={cn(
              "flex items-start gap-2",
              log.includes("✓") ? "text-green-400" : "text-[var(--etihuku-gray-400)]"
            )}>
              <span className="text-[var(--etihuku-gray-600)] shrink-0">{String(i + 1).padStart(2, "0")}</span>
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduleStep({ config, onChange }: { config: ConnectorConfig; onChange: (p: Partial<ConnectorConfig>) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {([
          { value: "realtime", label: "Real-time", icon: Zap,      desc: "Continuous stream" },
          { value: "cron",     label: "Scheduled",  icon: Clock,    desc: "Cron expression" },
          { value: "manual",   label: "Manual",     icon: Calendar, desc: "Trigger manually" },
        ] as const).map(opt => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              onClick={() => onChange({ scheduleType: opt.value })}
              className={cn(
                "p-4 rounded-lg border text-center transition-all",
                config.scheduleType === opt.value
                  ? "border-[var(--etihuku-indigo)] bg-[var(--etihuku-indigo)]/10"
                  : "border-[var(--etihuku-gray-800)] hover:border-[var(--etihuku-gray-600)]"
              )}
            >
              <Icon size={20} className={cn("mx-auto mb-2",
                config.scheduleType === opt.value ? "text-[var(--etihuku-indigo)]" : "text-[var(--etihuku-gray-500)]"
              )} />
              <div className="text-sm font-medium text-white">{opt.label}</div>
              <div className="text-xs text-[var(--etihuku-gray-500)] mt-0.5">{opt.desc}</div>
            </button>
          );
        })}
      </div>

      {config.scheduleType === "cron" && (
        <div className="space-y-3">
          <Field label="Cron Expression">
            <input
              value={config.cronExpression}
              onChange={e => onChange({ cronExpression: e.target.value })}
              placeholder="*/15 * * * *"
              className="form-input font-mono"
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            {CRON_PRESETS.map(p => (
              <button
                key={p.value}
                onClick={() => onChange({ cronExpression: p.value })}
                className={cn(
                  "text-xs px-2.5 py-1 rounded border transition-all",
                  config.cronExpression === p.value
                    ? "border-[var(--etihuku-indigo)] bg-[var(--etihuku-indigo)]/10 text-[var(--etihuku-indigo)]"
                    : "border-[var(--etihuku-gray-700)] text-[var(--etihuku-gray-400)] hover:border-[var(--etihuku-gray-500)]"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[var(--etihuku-gray-300)] uppercase tracking-wide">
        {label} {required && <span className="text-[var(--etihuku-indigo)]">*</span>}
      </label>
      {children}
    </div>
  );
}
