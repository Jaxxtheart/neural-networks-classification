"use client";

import React from "react";
import MetricCard from "@/components/dashboard/MetricCard";
import VerticalBreakdownCard from "@/components/dashboard/VerticalBreakdownCard";
import RecentPipelinesTable from "@/components/dashboard/RecentPipelinesTable";
import DriftAlertsList from "@/components/dashboard/DriftAlertsList";
import QualityScore from "@/components/shared/QualityScore";
import StatusBadge from "@/components/shared/StatusBadge";
import {
  Database,
  GitBranch,
  Activity,
  HardDrive,
  ShieldCheck,
  TrendingUp,
  Plus,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Mock sparkline data generators                                        */
/* ------------------------------------------------------------------ */

function sparkline(base: number, variance: number, n = 14) {
  return Array.from({ length: n }, (_, i) => ({
    value: Math.max(0, base + (Math.random() - 0.5) * variance * 2 + (i / n) * variance * 0.5),
  }));
}

/* ------------------------------------------------------------------ */
/* Page header                                                           */
/* ------------------------------------------------------------------ */

function PageHeader() {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1
          className="text-h2 text-[var(--etihuku-white)]"
        >
          Overview
        </h1>
        <p className="text-[14px] text-[var(--etihuku-gray-400)] mt-1">
          Platform health across all verticals ·{" "}
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>
            20 Feb 2026, 21:48 SAST
          </span>
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button className="btn btn-secondary btn-sm gap-1.5">
          <Activity size={13} />
          <span className="hidden sm:inline">Reports</span>
        </button>
        <button className="btn btn-primary btn-sm gap-1.5">
          <Plus size={13} />
          <span className="hidden sm:inline">New Dataset</span>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Overview page                                                         */
/* ------------------------------------------------------------------ */

export default function OverviewPage() {
  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <PageHeader />

      {/* ── Top Metric Cards ── */}
      <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          label="Total Datasets"
          value="1,284"
          trend={{ direction: "up", value: "+34", positive: true }}
          description="vs last month"
          sparkline={sparkline(1200, 80)}
          icon={Database}
          className="col-span-1"
        />

        <MetricCard
          label="Composite Quality Score"
          value="91"
          unit="/ 100"
          trend={{ direction: "up", value: "+3.2", positive: true }}
          description="30-day avg"
          sparkline={sparkline(88, 5)}
          sparklineColor="var(--etihuku-gold)"
          icon={ShieldCheck}
          isGold
          badge={<StatusBadge status="success" label="Excellent" showDot={false} />}
          className="col-span-1"
        />

        <div className="card p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-label text-[var(--etihuku-gray-500)]">Active Pipelines</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-[28px] font-bold text-white leading-none"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              47
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-center">
            {[
              { label: "Running", value: 12, color: "var(--etihuku-indigo-light)" },
              { label: "Success", value: 31, color: "var(--etihuku-success)" },
              { label: "Failed",  value: 4,  color: "var(--etihuku-error)" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col gap-0.5">
                <span
                  className="text-[14px] font-bold leading-none"
                  style={{ fontFamily: "var(--font-mono)", color: s.color }}
                >
                  {s.value}
                </span>
                <span className="text-label text-[var(--etihuku-gray-500)] text-[9px]">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <MetricCard
          label="Models Monitored"
          value="23"
          trend={{ direction: "up", value: "+2", positive: true }}
          description="3 drift alerts"
          sparkline={sparkline(20, 3)}
          icon={Activity}
          badge={
            <span
              className="badge badge-failed text-[10px] py-0 px-1.5"
            >
              3 alerts
            </span>
          }
          className="col-span-1"
        />

        <MetricCard
          label="Storage Consumed"
          value="18.4"
          unit="TB"
          trend={{ direction: "up", value: "+1.2 TB", positive: false }}
          description="of 50 TB quota"
          sparkline={sparkline(15, 3)}
          icon={HardDrive}
          className="col-span-1"
        />

        <MetricCard
          label="Rows Ingested (24h)"
          value="284M"
          trend={{ direction: "up", value: "+12%", positive: true }}
          description="across all connectors"
          sparkline={sparkline(240, 40)}
          icon={TrendingUp}
          className="col-span-1"
        />
      </section>

      {/* ── Vertical Breakdown ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-[15px] font-semibold text-[var(--etihuku-gray-200)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Vertical Breakdown
          </h2>
          <span className="text-caption text-[var(--etihuku-gray-500)]">
            Click a card to switch context
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <VerticalBreakdownCard
            stats={{ vertical: "telecom", datasets: 412, pipelines: 18, qualityScore: 94, alerts: 1 }}
          />
          <VerticalBreakdownCard
            stats={{ vertical: "security", datasets: 287, pipelines: 11, qualityScore: 78, alerts: 2 }}
          />
          <VerticalBreakdownCard
            stats={{ vertical: "mining", datasets: 356, pipelines: 13, qualityScore: 91, alerts: 0 }}
          />
          <VerticalBreakdownCard
            stats={{ vertical: "engineering", datasets: 229, pipelines: 5, qualityScore: 85, alerts: 0 }}
          />
        </div>
      </section>

      {/* ── Pipelines + Alerts ── */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <RecentPipelinesTable />
        </div>
        <div>
          <DriftAlertsList />
        </div>
      </section>

      {/* ── Quality Score Spotlight ── */}
      <section className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-[15px] font-semibold text-[var(--etihuku-white)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Dataset Quality Spotlight
          </h2>
          <a
            href="/quality"
            className="text-[12px] text-[var(--etihuku-indigo-light)] hover:text-[var(--etihuku-indigo)] transition-colors"
          >
            Open Quality Dashboard →
          </a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {[
            { name: "CDR Records",     score: 96, vertical: "Telecom" },
            { name: "Network KPIs",    score: 91, vertical: "Telecom" },
            { name: "Access Logs",     score: 74, vertical: "Security" },
            { name: "Sensor Readings", score: 88, vertical: "Mining" },
            { name: "Drone Imagery",   score: 42, vertical: "Mining" },
          ].map((ds) => (
            <div key={ds.name} className="flex flex-col items-center gap-2 text-center">
              <QualityScore score={ds.score} size="md" />
              <div>
                <p className="text-[12px] font-medium text-[var(--etihuku-gray-200)]">
                  {ds.name}
                </p>
                <p className="text-[10px] text-[var(--etihuku-gray-500)]">{ds.vertical}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
