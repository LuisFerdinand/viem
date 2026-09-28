"use client";

import {
  Activity,
  ArrowLeft,
  Bell,
  Bot,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  Database,
  Info,
  LayoutDashboard,
  LineChart,
  Menu,
  OctagonAlert,
  SlidersHorizontal,
  Sprout,
  TriangleAlert,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { unacknowledged, type ToastTone } from "@/lib/sim/store";
import { cn } from "@/lib/utils";
import { useSnapshot, useStore } from "./DashboardProvider";
import { FeedIndicator } from "./FeedIndicator";
import { Skeleton } from "./ui";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/sensors", label: "Live sensors", icon: LineChart },
  { href: "/dashboard/controls", label: "Controls", icon: SlidersHorizontal },
  { href: "/dashboard/automation", label: "Automation & alarms", icon: Workflow },
  { href: "/dashboard/alerts", label: "Alerts", icon: Bell },
  { href: "/dashboard/harvest", label: "Harvest & buy-back", icon: Sprout },
  { href: "/dashboard/assistant", label: "Tulun VIEM", icon: Bot },
  { href: "/dashboard/activity", label: "Activity & settings", icon: Activity },
];

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const snap = useSnapshot();
  const alertCount = unacknowledged(snap).length;

  return (
    <div className="flex h-full flex-col bg-forest-950 text-forest-100">
      <div className="flex h-16 items-center justify-between px-5">
        <Link href="/" onClick={onNavigate} aria-label="VIEM website" className="rounded-lg">
          <Logo tone="light" />
        </Link>
        <span className="rounded-full bg-leaf-400/15 px-2 py-0.5 text-[0.65rem] font-bold tracking-wider text-leaf-300 uppercase">Demo</span>
      </div>
      <p className="px-5 pb-3 text-[0.7rem] tracking-[0.14em] text-forest-400 uppercase">Hub dashboard</p>
      <nav aria-label="Dashboard" className="flex-1 overflow-y-auto px-3">
        <ul className="grid gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                    active ? "bg-white/10 text-white" : "text-forest-200 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Icon className={cn("size-[1.1rem]", active ? "text-leaf-300" : "text-forest-400 group-hover:text-forest-200")} aria-hidden="true" />
                  <span className="flex-1">{label}</span>
                  {href === "/dashboard/alerts" && alertCount > 0 && (
                    <span className="min-w-5 rounded-full bg-crit-500 px-1.5 text-center text-[0.7rem] leading-5 font-bold text-white">
                      {alertCount}
                      <span className="sr-only"> alerts need acknowledgement</span>
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="m-3 rounded-2xl bg-white/5 p-4 text-xs text-forest-300">
        <p className="flex items-center gap-2 font-semibold text-forest-100">
          <Database className="size-3.5 text-leaf-300" aria-hidden="true" />
          {snap.data.source === "database" ? "Connected to Neon" : "Offline demo data"}
        </p>
        <p className="mt-1 leading-relaxed">Sensor readings are simulated in your browser and never stored.</p>
      </div>
      <Link
        href="/"
        onClick={onNavigate}
        className="mx-3 mb-4 flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm text-forest-300 transition-colors hover:bg-white/5 hover:text-white"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to website
      </Link>
    </div>
  );
}

function UnitSwitcher() {
  const store = useStore();
  const snap = useSnapshot();
  return (
    <label className="relative inline-flex max-w-full min-w-0 items-center">
      <span className="sr-only">Selected unit</span>
      <select
        value={snap.selectedUnitId}
        onChange={(e) => store.selectUnit(e.target.value)}
        className="h-10 max-w-full min-w-0 appearance-none truncate rounded-full border border-forest-200 bg-white pr-9 pl-4 text-sm font-semibold text-forest-900 hover:border-forest-300 focus:border-leaf-500 focus:outline-none"
      >
        {snap.data.units.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} · {u.municipality}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-4 text-forest-500" aria-hidden="true" />
    </label>
  );
}

const TOAST_META: Record<ToastTone, { icon: LucideIcon; className: string }> = {
  success: { icon: CircleCheck, className: "border-ok-500/30 [&_svg]:text-ok-700" },
  info: { icon: Info, className: "border-water-100 [&_svg]:text-water-700" },
  warning: { icon: TriangleAlert, className: "border-warn-500/40 [&_svg]:text-warn-700" },
  critical: { icon: OctagonAlert, className: "border-crit-500/50 [&_svg]:text-crit-700" },
  error: { icon: CircleAlert, className: "border-crit-500/40 [&_svg]:text-crit-700" },
};

function Toasts() {
  const store = useStore();
  const { toasts } = useSnapshot();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end">
      {toasts.map((t) => {
        const { icon: Icon, className } = TOAST_META[t.tone];
        return (
          <div
            key={t.id}
            role={t.tone === "critical" || t.tone === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-2xl border bg-white p-4 shadow-lift",
              className,
            )}
          >
            <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-forest-900">{t.title}</p>
              {t.description && <p className="mt-0.5 text-sm text-muted">{t.description}</p>}
            </div>
            <button
              type="button"
              onClick={() => store.dismissToast(t.id)}
              aria-label="Dismiss notification"
              className="-m-1.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-forest-500 hover:bg-forest-50"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const snap = useSnapshot();
  const [drawer, setDrawer] = useState(false);
  const alertCount = unacknowledged(snap).length;

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawer]);

  return (
    <div className="min-h-dvh bg-[#f5f8f6]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <Sidebar />
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Dashboard menu">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-forest-950/55" onClick={() => setDrawer(false)} />
          <div className="relative h-full w-72 max-w-[85vw] animate-toast-in shadow-lift">
            <Sidebar onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-forest-100 bg-white/90 backdrop-blur-md">
          <div className="flex h-16 items-center gap-3 px-4 md:px-6">
            <button
              type="button"
              onClick={() => setDrawer(true)}
              aria-label="Open menu"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-forest-800 hover:bg-forest-50 lg:hidden"
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0 flex-1">{snap.ready ? <UnitSwitcher /> : <Skeleton className="h-10 w-56 rounded-full" />}</div>
            {snap.ready && <FeedIndicator />}
            <Link
              href="/dashboard/alerts"
              aria-label={`Alerts${alertCount ? `, ${alertCount} need acknowledgement` : ""}`}
              className="relative hidden size-10 shrink-0 items-center justify-center rounded-full text-forest-800 ring-1 ring-forest-100 hover:bg-forest-50 sm:inline-flex"
            >
              <Bell className="size-[1.1rem]" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 rounded-full bg-crit-500 px-1 text-center text-[0.65rem] leading-5 font-bold text-white">
                  {alertCount}
                </span>
              )}
            </Link>
          </div>
          {snap.data.source === "fallback" && (
            <p className="border-t border-warn-500/30 bg-warn-50 px-4 py-2 text-xs text-warn-700 md:px-6">
              <strong>Offline demo mode.</strong> {snap.data.sourceNote}
            </p>
          )}
        </header>

        <main id="main" className="mx-auto max-w-[96rem] px-4 py-6 md:px-6 md:py-8">
          {snap.ready ? children : <DashboardSkeleton />}
        </main>
      </div>
      <Toasts />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="grid gap-5" aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className="h-12 w-72" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
