"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { useUIStore } from "@/lib/stores/ui.store";
import { MobileSidebarTrigger } from "./Sidebar";
import {
  Search,
  Bell,
  ChevronDown,
  Check,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Mock notifications                                                    */
/* ------------------------------------------------------------------ */

interface Notification {
  id: string;
  type: "error" | "warning" | "info" | "success";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "error",
    title: "Pipeline Failed",
    message: "CDR Processing pipeline failed at Transform stage.",
    time: "5m ago",
    read: false,
  },
  {
    id: "2",
    type: "warning",
    title: "Drift Detected",
    message: "Churn model: feature `tenure_months` PSI score 0.28 (threshold 0.2).",
    time: "23m ago",
    read: false,
  },
  {
    id: "3",
    type: "info",
    title: "Data Sync Complete",
    message: "PostgreSQL connector synced 1.2M rows successfully.",
    time: "1h ago",
    read: true,
  },
  {
    id: "4",
    type: "success",
    title: "Quality Score Improved",
    message: "Network KPI dataset quality score rose to 94/100.",
    time: "3h ago",
    read: true,
  },
];

const notifIcon = {
  error:   <AlertTriangle size={14} className="text-[var(--etihuku-error)]" />,
  warning: <AlertTriangle size={14} className="text-[var(--etihuku-warning)]" />,
  info:    <Info size={14} className="text-[var(--etihuku-info)]" />,
  success: <Check size={14} className="text-[var(--etihuku-success)]" />,
};

/* ------------------------------------------------------------------ */
/* Notifications panel                                                   */
/* ------------------------------------------------------------------ */

function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const unread = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <div
      className={cn(
        "absolute right-0 top-full mt-2 w-80 z-50",
        "bg-[var(--etihuku-gray-800)] border border-[var(--etihuku-gray-700)]",
        "rounded-[8px] shadow-[0_8px_24px_rgba(0,0,0,0.4)]",
        "overflow-hidden"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--etihuku-gray-700)]">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-[var(--etihuku-white)]">
            Notifications
          </span>
          {unread > 0 && (
            <span className="badge badge-running text-[10px] py-0 px-1.5">
              {unread}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-[var(--etihuku-gray-500)] hover:text-[var(--etihuku-gray-200)] transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Notification list */}
      <div className="divide-y divide-[var(--etihuku-gray-700)] max-h-80 overflow-y-auto">
        {MOCK_NOTIFICATIONS.map((notif) => (
          <div
            key={notif.id}
            className={cn(
              "flex gap-3 px-4 py-3 transition-colors cursor-pointer",
              "hover:bg-[var(--etihuku-gray-700)]",
              !notif.read && "bg-[rgba(80,70,229,0.04)]"
            )}
          >
            <div className="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center"
              style={{
                backgroundColor:
                  notif.type === "error"   ? "rgba(239,68,68,0.12)"   :
                  notif.type === "warning" ? "rgba(245,158,11,0.12)"  :
                  notif.type === "info"    ? "rgba(59,130,246,0.12)"  :
                                             "rgba(16,185,129,0.12)",
              }}
            >
              {notifIcon[notif.type]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-medium text-[var(--etihuku-gray-100)] truncate">
                  {notif.title}
                </p>
                <span className="text-caption text-[var(--etihuku-gray-500)] shrink-0">
                  {notif.time}
                </span>
              </div>
              <p className="text-[12px] text-[var(--etihuku-gray-400)] mt-0.5 line-clamp-2">
                {notif.message}
              </p>
            </div>
            {!notif.read && (
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--etihuku-indigo)] shrink-0 mt-1.5" />
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-[var(--etihuku-gray-700)]">
        <button className="text-[12px] text-[var(--etihuku-indigo-light)] hover:text-[var(--etihuku-indigo)] transition-colors">
          View all notifications →
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Global Search                                                         */
/* ------------------------------------------------------------------ */

function GlobalSearch() {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState("");

  return (
    <div className="relative flex-1 max-w-md">
      <div
        className={cn(
          "flex items-center gap-2 h-9 px-3 rounded-[6px]",
          "bg-[var(--etihuku-gray-800)] border transition-all duration-150",
          focused
            ? "border-[var(--etihuku-indigo)] shadow-[0_0_0_3px_rgba(80,70,229,0.12)]"
            : "border-[var(--etihuku-gray-700)]"
        )}
      >
        <Search
          size={15}
          className={cn(
            "shrink-0 transition-colors",
            focused ? "text-[var(--etihuku-indigo-light)]" : "text-[var(--etihuku-gray-500)]"
          )}
        />
        <input
          type="text"
          placeholder="Search datasets, pipelines, features…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={cn(
            "flex-1 bg-transparent outline-none border-none",
            "text-[14px] text-[var(--etihuku-gray-200)] placeholder:text-[var(--etihuku-gray-500)]"
          )}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="text-[var(--etihuku-gray-500)] hover:text-[var(--etihuku-gray-200)]"
          >
            <X size={13} />
          </button>
        )}
        {!query && (
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-[var(--etihuku-gray-700)] text-[10px] text-[var(--etihuku-gray-500)] font-mono shrink-0">
            ⌘K
          </kbd>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Org Switcher                                                          */
/* ------------------------------------------------------------------ */

function OrgSwitcher() {
  return (
    <button
      className={cn(
        "hidden md:flex items-center gap-2 px-3 h-9 rounded-[6px]",
        "border border-[var(--etihuku-gray-700)] bg-[var(--etihuku-gray-800)]",
        "hover:border-[var(--etihuku-gray-600)] transition-colors",
        "text-[13px] text-[var(--etihuku-gray-300)]"
      )}
    >
      <div className="w-4 h-4 rounded-[3px] bg-gradient-to-br from-[var(--etihuku-indigo)] to-[var(--etihuku-indigo-light)]" />
      <span className="font-medium">Etihuku Demo</span>
      <ChevronDown size={13} className="text-[var(--etihuku-gray-500)]" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Top Bar                                                               */
/* ------------------------------------------------------------------ */

export default function TopBar() {
  const { sidebarCollapsed } = useUIStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const unread = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 h-[60px]",
        "border-b border-[var(--etihuku-gray-700)] bg-[var(--etihuku-gray-900)]/95",
        "backdrop-blur-sm",
        "flex items-center gap-3 px-4",
        "transition-all duration-200",
        sidebarCollapsed ? "left-16" : "left-64",
        // Mobile: always full width
        "!left-0 lg:!left-auto",
        sidebarCollapsed ? "lg:!left-16" : "lg:!left-64"
      )}
    >
      {/* Mobile trigger */}
      <MobileSidebarTrigger />

      {/* Search */}
      <GlobalSearch />

      {/* Right actions */}
      <div className="flex items-center gap-2 ml-auto">
        <OrgSwitcher />

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className={cn(
              "relative flex items-center justify-center w-9 h-9 rounded-[6px]",
              "border border-[var(--etihuku-gray-700)] bg-[var(--etihuku-gray-800)]",
              "text-[var(--etihuku-gray-400)] hover:text-[var(--etihuku-gray-200)]",
              "hover:border-[var(--etihuku-gray-600)] transition-colors",
              notifOpen && "border-[var(--etihuku-indigo)] text-[var(--etihuku-indigo-light)]"
            )}
            aria-label="Notifications"
          >
            <Bell size={16} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--etihuku-error)] flex items-center justify-center text-[9px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNotifOpen(false)}
              />
              <NotificationsPanel onClose={() => setNotifOpen(false)} />
            </>
          )}
        </div>

        {/* User avatar */}
        <button
          className={cn(
            "flex items-center gap-2 pl-1 pr-2 h-9 rounded-[6px]",
            "border border-[var(--etihuku-gray-700)] bg-[var(--etihuku-gray-800)]",
            "hover:border-[var(--etihuku-gray-600)] transition-colors"
          )}
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--etihuku-indigo)] to-[var(--etihuku-indigo-light)] flex items-center justify-center">
            <span className="text-white text-[9px] font-bold">AD</span>
          </div>
          <span className="hidden sm:block text-[13px] font-medium text-[var(--etihuku-gray-200)]">
            Admin
          </span>
          <ChevronDown size={12} className="text-[var(--etihuku-gray-500)]" />
        </button>
      </div>
    </header>
  );
}
