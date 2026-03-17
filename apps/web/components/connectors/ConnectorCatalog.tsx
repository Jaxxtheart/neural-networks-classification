"use client";

import { useState } from "react";
import {
  Database, Cloud, Radio, Globe, FolderOpen, Cpu,
  CheckCircle2, AlertCircle, XCircle, Clock, RefreshCw,
  Plus, Settings, Trash2, Activity, ChevronRight, Zap,
  Server, HardDrive, Wifi, Code2
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import StatusBadge from "@/components/shared/StatusBadge";

export type ConnectorType = "database" | "cloud" | "streaming" | "api" | "file" | "industrial";
export type ConnectorStatus = "connected" | "error" | "disconnected" | "syncing";

export interface ConnectorDef {
  id: string;
  name: string;
  type: ConnectorType;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  tags: string[];
  popular?: boolean;
}

export interface ConnectorInstance {
  id: string;
  defId: string;
  name: string;
  status: ConnectorStatus;
  lastSync: string;
  datasetsIngested: number;
  recordsToday: string;
  schedule: string;
  host?: string;
}

export const CONNECTOR_DEFS: ConnectorDef[] = [
  // Databases
  { id: "postgres",   name: "PostgreSQL",   type: "database",    description: "Open-source relational database",         icon: Database,   iconBg: "bg-blue-950",   iconColor: "#3B82F6", tags: ["SQL", "OLTP"],            popular: true },
  { id: "mysql",      name: "MySQL",         type: "database",    description: "World's most popular open-source DB",      icon: Database,   iconBg: "bg-orange-950", iconColor: "#F97316", tags: ["SQL", "OLTP"],            popular: true },
  { id: "oracle",     name: "Oracle DB",     type: "database",    description: "Enterprise relational database",           icon: Database,   iconBg: "bg-red-950",    iconColor: "#EF4444", tags: ["SQL", "Enterprise"]      },
  { id: "mssql",      name: "SQL Server",    type: "database",    description: "Microsoft SQL Server",                     icon: Server,     iconBg: "bg-sky-950",    iconColor: "#0EA5E9", tags: ["SQL", "Microsoft"]       },
  { id: "mongodb",    name: "MongoDB",       type: "database",    description: "Document-based NoSQL database",            icon: Database,   iconBg: "bg-green-950",  iconColor: "#10B981", tags: ["NoSQL", "Document"],      popular: true },
  // Cloud
  { id: "s3",         name: "AWS S3",        type: "cloud",       description: "Amazon Simple Storage Service",            icon: Cloud,      iconBg: "bg-yellow-950", iconColor: "#F59E0B", tags: ["Object Storage", "AWS"],  popular: true },
  { id: "azure-blob", name: "Azure Blob",    type: "cloud",       description: "Microsoft Azure Blob Storage",             icon: Cloud,      iconBg: "bg-sky-950",    iconColor: "#0EA5E9", tags: ["Object Storage", "Azure"] },
  { id: "gcs",        name: "Google Cloud",  type: "cloud",       description: "Google Cloud Storage",                     icon: Cloud,      iconBg: "bg-blue-950",   iconColor: "#3B82F6", tags: ["Object Storage", "GCP"]  },
  // Streaming
  { id: "kafka",      name: "Apache Kafka",  type: "streaming",   description: "Distributed event streaming platform",     icon: Radio,      iconBg: "bg-violet-950", iconColor: "#8B5CF6", tags: ["Events", "Real-time"],    popular: true },
  { id: "mqtt",       name: "MQTT",          type: "streaming",   description: "Lightweight IoT messaging protocol",        icon: Wifi,       iconBg: "bg-teal-950",   iconColor: "#14B8A6", tags: ["IoT", "Pub/Sub"]         },
  // APIs
  { id: "rest",       name: "REST API",      type: "api",         description: "HTTP REST API with configurable endpoints", icon: Globe,      iconBg: "bg-indigo-950", iconColor: "#6366F1", tags: ["HTTP", "JSON"],           popular: true },
  { id: "graphql",    name: "GraphQL",       type: "api",         description: "Query language for your API",               icon: Code2,      iconBg: "bg-pink-950",   iconColor: "#EC4899", tags: ["Query", "API"]           },
  // Files
  { id: "sftp",       name: "SFTP",          type: "file",        description: "SSH File Transfer Protocol server",         icon: FolderOpen, iconBg: "bg-slate-800",  iconColor: "#94A3B8", tags: ["Files", "SSH"]           },
  { id: "local-fs",  name: "Local Filesystem", type: "file",     description: "Local or network file system mount",        icon: HardDrive,  iconBg: "bg-slate-800",  iconColor: "#94A3B8", tags: ["Files", "Local"]         },
  // Industrial
  { id: "opc-ua",    name: "OPC-UA",         type: "industrial",  description: "Industrial IoT machine communication",      icon: Cpu,        iconBg: "bg-emerald-950",iconColor: "#10B981", tags: ["IoT", "SCADA"],           popular: true },
  { id: "rtsp",      name: "RTSP",           type: "industrial",  description: "Real-time video stream protocol",           icon: Activity,   iconBg: "bg-rose-950",   iconColor: "#F43F5E", tags: ["Video", "Streaming"]     },
];

const MOCK_INSTANCES: ConnectorInstance[] = [
  { id: "ci-1", defId: "postgres", name: "Prod Telco DB",      status: "connected",    lastSync: "2m ago",  datasetsIngested: 14, recordsToday: "2.4M",  schedule: "Every 5m",   host: "prod-db.telco.local" },
  { id: "ci-2", defId: "kafka",    name: "Network Events",      status: "syncing",      lastSync: "0m ago",  datasetsIngested: 3,  recordsToday: "18.7M", schedule: "Real-time",  host: "kafka.internal:9092" },
  { id: "ci-3", defId: "s3",       name: "CDR Archive Bucket",  status: "connected",    lastSync: "1h ago",  datasetsIngested: 7,  recordsToday: "340K",  schedule: "Daily 00:00" },
  { id: "ci-4", defId: "opc-ua",   name: "Mine Sensor Array",   status: "error",        lastSync: "34m ago", datasetsIngested: 22, recordsToday: "—",     schedule: "Every 30s",  host: "opc://mine-floor.local" },
  { id: "ci-5", defId: "rest",     name: "Security API",        status: "connected",    lastSync: "12m ago", datasetsIngested: 5,  recordsToday: "88K",   schedule: "Every 15m",  host: "api.security.co.za" },
  { id: "ci-6", defId: "mongodb",  name: "Inspection Logs",     status: "disconnected", lastSync: "3d ago",  datasetsIngested: 2,  recordsToday: "—",     schedule: "Paused",     host: "mongo.eng.local:27017" },
];

const TYPE_FILTERS: { label: string; value: ConnectorType | "all"; icon: React.ElementType }[] = [
  { label: "All",        value: "all",        icon: Zap      },
  { label: "Databases",  value: "database",   icon: Database  },
  { label: "Cloud",      value: "cloud",      icon: Cloud     },
  { label: "Streaming",  value: "streaming",  icon: Radio     },
  { label: "APIs",       value: "api",        icon: Globe     },
  { label: "Files",      value: "file",       icon: FolderOpen },
  { label: "Industrial", value: "industrial", icon: Cpu       },
];

const STATUS_CONFIG: Record<ConnectorStatus, { label: string; icon: React.ElementType; color: string; badgeClass: string }> = {
  connected:    { label: "Connected",    icon: CheckCircle2, color: "#10B981", badgeClass: "badge-success" },
  syncing:      { label: "Syncing",      icon: RefreshCw,    color: "#5046E5", badgeClass: "badge-running" },
  error:        { label: "Error",        icon: XCircle,      color: "#EF4444", badgeClass: "badge-failed"  },
  disconnected: { label: "Disconnected", icon: AlertCircle,  color: "#F59E0B", badgeClass: "badge-warning" },
};

interface ConnectorCatalogProps {
  onAddConnector: (defId?: string) => void;
}

export function ConnectorCatalog({ onAddConnector }: ConnectorCatalogProps) {
  const [activeFilter, setActiveFilter] = useState<ConnectorType | "all">("all");
  const [view, setView] = useState<"instances" | "catalog">("instances");

  const filteredDefs = CONNECTOR_DEFS.filter(
    d => activeFilter === "all" || d.type === activeFilter
  );

  return (
    <div className="space-y-6">
      {/* View toggle + filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1 p-1 bg-[var(--etihuku-gray-900)] rounded-lg border border-[var(--etihuku-gray-800)]">
          {(["instances", "catalog"] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "px-4 py-1.5 rounded text-sm font-medium transition-all",
                view === v
                  ? "bg-[var(--etihuku-indigo)] text-white"
                  : "text-[var(--etihuku-gray-400)] hover:text-white"
              )}
            >
              {v === "instances" ? "My Connectors" : "Connector Catalog"}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          {TYPE_FILTERS.map(f => {
            const Icon = f.icon;
            return (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value as ConnectorType | "all")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all",
                  activeFilter === f.value
                    ? "bg-[var(--etihuku-indigo)] border-[var(--etihuku-indigo)] text-white"
                    : "border-[var(--etihuku-gray-700)] text-[var(--etihuku-gray-400)] hover:border-[var(--etihuku-gray-500)] hover:text-white"
                )}
              >
                <Icon size={12} />
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {view === "instances" ? (
        <InstancesView instances={MOCK_INSTANCES} filter={activeFilter} />
      ) : (
        <CatalogView defs={filteredDefs} onSelect={defId => onAddConnector(defId)} />
      )}
    </div>
  );
}

function InstancesView({ instances, filter }: { instances: ConnectorInstance[]; filter: ConnectorType | "all" }) {
  const filtered = instances.filter(inst => {
    const def = CONNECTOR_DEFS.find(d => d.id === inst.defId);
    return filter === "all" || def?.type === filter;
  });

  return (
    <div className="space-y-3">
      {filtered.length === 0 && (
        <div className="card text-center py-16 text-[var(--etihuku-gray-500)]">
          No connectors of this type configured yet.
        </div>
      )}
      {filtered.map(inst => {
        const def = CONNECTOR_DEFS.find(d => d.id === inst.defId)!;
        const statusCfg = STATUS_CONFIG[inst.status];
        const StatusIcon = statusCfg.icon;
        const ConnIcon = def.icon;

        return (
          <div key={inst.id} className="card hover:shadow-card-hover transition-all group">
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", def.iconBg)}>
                <ConnIcon size={20} style={{ color: def.iconColor }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-white text-sm">{inst.name}</span>
                  <span className="text-[10px] text-[var(--etihuku-gray-500)] font-mono">{def.name}</span>
                </div>
                {inst.host && (
                  <div className="text-xs text-[var(--etihuku-gray-500)] font-mono truncate">{inst.host}</div>
                )}
              </div>

              {/* Stats */}
              <div className="hidden md:flex items-center gap-6 text-center">
                <div>
                  <div className="text-sm font-semibold text-white">{inst.datasetsIngested}</div>
                  <div className="text-[10px] text-[var(--etihuku-gray-500)] uppercase tracking-wide">Datasets</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{inst.recordsToday}</div>
                  <div className="text-[10px] text-[var(--etihuku-gray-500)] uppercase tracking-wide">Today</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{inst.schedule}</div>
                  <div className="text-[10px] text-[var(--etihuku-gray-500)] uppercase tracking-wide">Schedule</div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-1.5 shrink-0">
                <StatusIcon
                  size={14}
                  style={{ color: statusCfg.color }}
                  className={inst.status === "syncing" ? "animate-spin" : ""}
                />
                <span className="text-xs" style={{ color: statusCfg.color }}>{statusCfg.label}</span>
              </div>

              {/* Last sync + actions */}
              <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--etihuku-gray-500)]">
                <Clock size={12} />
                {inst.lastSync}
              </div>

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 rounded hover:bg-[var(--etihuku-gray-800)] text-[var(--etihuku-gray-400)] hover:text-white">
                  <Settings size={14} />
                </button>
                <button className="p-1.5 rounded hover:bg-red-950 text-[var(--etihuku-gray-400)] hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CatalogView({ defs, onSelect }: { defs: ConnectorDef[]; onSelect: (id: string) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {defs.map(def => {
        const Icon = def.icon;
        return (
          <button
            key={def.id}
            onClick={() => onSelect(def.id)}
            className="card text-left hover:shadow-card-hover hover:border-[var(--etihuku-indigo)] transition-all group relative"
          >
            {def.popular && (
              <div className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider text-[var(--etihuku-gold)] border border-[var(--etihuku-gold)] px-1.5 py-0.5 rounded">
                Popular
              </div>
            )}
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", def.iconBg)}>
              <Icon size={22} style={{ color: def.iconColor }} />
            </div>
            <div className="font-semibold text-white text-sm mb-1">{def.name}</div>
            <div className="text-xs text-[var(--etihuku-gray-500)] leading-relaxed mb-3">{def.description}</div>
            <div className="flex flex-wrap gap-1">
              {def.tags.map(t => (
                <span key={t} className="text-[9px] uppercase tracking-wide font-medium px-1.5 py-0.5 rounded bg-[var(--etihuku-gray-800)] text-[var(--etihuku-gray-400)]">
                  {t}
                </span>
              ))}
            </div>
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-1 text-xs text-[var(--etihuku-indigo)]">
                <Plus size={12} /> Connect
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
