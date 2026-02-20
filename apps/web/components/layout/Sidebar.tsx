"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { useUIStore, type Vertical } from "@/lib/stores/ui.store";
import {
  LayoutDashboard,
  Database,
  GitBranch,
  ShieldCheck,
  Tag,
  Activity,
  Plug,
  BookOpen,
  Scale,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Radio,
  Lock,
  Mountain,
  Wrench,
  Menu,
  X,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                                 */
/* ------------------------------------------------------------------ */

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
}

interface VerticalOption {
  value: Vertical;
  label: string;
  color: string;
  icon: React.ElementType;
}

/* ------------------------------------------------------------------ */
/* Constants                                                             */
/* ------------------------------------------------------------------ */

const NAV_ITEMS: NavItem[] = [
  { href: "/overview",    label: "Overview",         icon: LayoutDashboard },
  { href: "/datasets",    label: "Datasets",          icon: Database },
  { href: "/pipelines",   label: "Pipelines",         icon: GitBranch },
  { href: "/quality",     label: "Data Quality",      icon: ShieldCheck },
  { href: "/annotations", label: "Annotations",       icon: Tag },
  { href: "/monitoring",  label: "Model Monitoring",  icon: Activity },
  { href: "/connectors",  label: "Connectors",        icon: Plug },
  { href: "/catalog",     label: "Data Catalog",      icon: BookOpen },
  { href: "/governance",  label: "Governance",        icon: Scale },
  { href: "/settings",    label: "Settings",          icon: Settings },
];

const VERTICAL_OPTIONS: VerticalOption[] = [
  { value: "telecom",      label: "Telecommunications", color: "#8B5CF6", icon: Radio },
  { value: "security",     label: "Security",           color: "#F59E0B", icon: Lock },
  { value: "mining",       label: "Mining",             color: "#10B981", icon: Mountain },
  { value: "engineering",  label: "Engineering",        color: "#EC4899", icon: Wrench },
];

/* ------------------------------------------------------------------ */
/* Vertical Selector                                                     */
/* ------------------------------------------------------------------ */

function VerticalSelector({ collapsed }: { collapsed: boolean }) {
  const { activeVertical, setActiveVertical } = useUIStore();
  const [open, setOpen] = useState(false);

  const current = VERTICAL_OPTIONS.find((v) => v.value === activeVertical)!;
  const CurrentIcon = current.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px]",
          "border border-[var(--etihuku-gray-700)] bg-[var(--etihuku-gray-900)]",
          "hover:border-[var(--etihuku-gray-600)] hover:bg-[var(--etihuku-gray-800)]",
          "transition-all duration-150 cursor-pointer",
          collapsed && "justify-center"
        )}
      >
        {/* Colored dot indicator */}
        <span
          className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full"
          style={{ backgroundColor: `${current.color}20` }}
        >
          <CurrentIcon
            size={13}
            style={{ color: current.color }}
          />
        </span>

        {!collapsed && (
          <>
            <span className="flex-1 text-left min-w-0">
              <span className="text-label text-[var(--etihuku-gray-500)] block">Vertical</span>
              <span className="text-[13px] font-medium text-[var(--etihuku-gray-200)] block truncate">
                {current.label}
              </span>
            </span>
            <ChevronDown
              size={14}
              className={cn(
                "shrink-0 text-[var(--etihuku-gray-500)] transition-transform duration-200",
                open && "rotate-180"
              )}
            />
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "absolute z-50 mt-1 w-52 rounded-[8px] py-1",
              "bg-[var(--etihuku-gray-800)] border border-[var(--etihuku-gray-700)]",
              "shadow-[0_8px_24px_rgba(0,0,0,0.4)]",
              collapsed ? "left-14" : "left-0 right-0"
            )}
          >
            {VERTICAL_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isActive = option.value === activeVertical;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    setActiveVertical(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5",
                    "transition-colors duration-100 cursor-pointer",
                    isActive
                      ? "bg-[rgba(80,70,229,0.12)] text-[var(--etihuku-indigo-light)]"
                      : "text-[var(--etihuku-gray-300)] hover:bg-[var(--etihuku-gray-700)]"
                  )}
                >
                  <span
                    className="flex items-center justify-center w-5 h-5 rounded-full shrink-0"
                    style={{ backgroundColor: `${option.color}20` }}
                  >
                    <Icon size={11} style={{ color: option.color }} />
                  </span>
                  <span className="text-[13px] font-medium">{option.label}</span>
                  {isActive && (
                    <span
                      className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Nav Item                                                              */
/* ------------------------------------------------------------------ */

function SidebarNavItem({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "nav-item group",
        isActive && "active",
        collapsed && "justify-center px-0"
      )}
      title={collapsed ? item.label : undefined}
    >
      <Icon
        size={18}
        className={cn(
          "shrink-0 transition-colors",
          isActive
            ? "text-[var(--etihuku-indigo-light)]"
            : "text-[var(--etihuku-gray-500)] group-hover:text-[var(--etihuku-gray-300)]"
        )}
      />
      {!collapsed && (
        <span className="truncate">{item.label}</span>
      )}
      {!collapsed && item.badge !== undefined && (
        <span className="ml-auto badge badge-running text-[10px] py-0.5 px-1.5">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar                                                               */
/* ------------------------------------------------------------------ */

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen } =
    useUIStore();

  return (
    <>
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full flex flex-col",
          "bg-[var(--etihuku-gray-900)] border-r border-[var(--etihuku-gray-700)]",
          "transition-all duration-200 ease-in-out",
          // Desktop
          "lg:translate-x-0",
          sidebarCollapsed ? "lg:w-16" : "lg:w-64",
          // Mobile
          mobileSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header — Logo + collapse toggle */}
        <div
          className={cn(
            "flex items-center border-b border-[var(--etihuku-gray-700)]",
            "h-[60px] px-4 shrink-0",
            sidebarCollapsed ? "justify-center" : "justify-between"
          )}
        >
          {/* Logo */}
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Logo image — falls back to text mark */}
              <div
                className="w-8 h-8 rounded-[6px] flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--etihuku-indigo)" }}
              >
                <span className="font-mono font-bold text-white text-[13px]">E</span>
              </div>
              <div className="min-w-0">
                <span
                  className="block text-[16px] font-bold leading-tight text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Etihuku
                </span>
                <span className="text-label text-[var(--etihuku-gray-500)]">
                  DataOps Platform
                </span>
              </div>
            </div>
          ) : (
            <div
              className="w-8 h-8 rounded-[6px] flex items-center justify-center"
              style={{ backgroundColor: "var(--etihuku-indigo)" }}
            >
              <span className="font-mono font-bold text-white text-[13px]">E</span>
            </div>
          )}

          {/* Collapse toggle — desktop only */}
          <button
            onClick={toggleSidebar}
            className={cn(
              "hidden lg:flex items-center justify-center",
              "w-6 h-6 rounded-[4px]",
              "text-[var(--etihuku-gray-500)] hover:text-[var(--etihuku-gray-200)]",
              "hover:bg-[var(--etihuku-gray-800)] transition-colors",
              sidebarCollapsed && "absolute -right-3 top-5",
              sidebarCollapsed &&
                "bg-[var(--etihuku-gray-800)] border border-[var(--etihuku-gray-700)] w-6 h-6 rounded-full"
            )}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronLeft size={14} />
            )}
          </button>

          {/* Mobile close */}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden text-[var(--etihuku-gray-400)] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Vertical selector */}
        <div className="px-3 py-3 border-b border-[var(--etihuku-gray-700)] shrink-0">
          <VerticalSelector collapsed={sidebarCollapsed} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {!sidebarCollapsed && (
            <p className="text-label text-[var(--etihuku-gray-600)] px-3 mb-2">
              Navigation
            </p>
          )}
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem key={item.href} item={item} collapsed={sidebarCollapsed} />
          ))}
        </nav>

        {/* Bottom — user avatar + settings */}
        <div
          className={cn(
            "shrink-0 border-t border-[var(--etihuku-gray-700)] p-3",
            sidebarCollapsed ? "flex flex-col items-center gap-2" : "space-y-1"
          )}
        >
          {/* User avatar */}
          <div
            className={cn(
              "flex items-center gap-3 px-2 py-2 rounded-[6px]",
              "hover:bg-[var(--etihuku-gray-800)] cursor-pointer transition-colors",
              sidebarCollapsed && "justify-center px-0"
            )}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--etihuku-indigo)] to-[var(--etihuku-indigo-light)] flex items-center justify-center shrink-0">
              <span className="text-white text-[12px] font-bold">AD</span>
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-[var(--etihuku-gray-200)] truncate">
                  Admin User
                </p>
                <p className="text-[11px] text-[var(--etihuku-gray-500)] truncate">
                  admin@etihuku.co.za
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile trigger                                                        */
/* ------------------------------------------------------------------ */

export function MobileSidebarTrigger() {
  const { setMobileSidebarOpen } = useUIStore();
  return (
    <button
      onClick={() => setMobileSidebarOpen(true)}
      className="lg:hidden p-2 rounded-[6px] text-[var(--etihuku-gray-400)] hover:bg-[var(--etihuku-gray-800)] hover:text-white transition-colors"
      aria-label="Open menu"
    >
      <Menu size={20} />
    </button>
  );
}
