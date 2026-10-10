"use client";

import { Activity, ArrowLeft, Bell, BookOpen, Bot, ChevronDown, CircleAlert, CircleCheck, Info, LayoutDashboard, Library, LineChart, Menu, OctagonAlert, PanelLeftClose, PanelLeftOpen, SlidersHorizontal, Sprout, TriangleAlert, Workflow, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Logo, LogoMark } from "@/components/ui/Logo";
import { LANGUAGES, type Language } from "@/lib/i18n";
import { unacknowledged, type ToastTone } from "@/lib/sim/store";
import { cn } from "@/lib/utils";
import { useSnapshot, useStore } from "./DashboardProvider";
import { FeedIndicator } from "./FeedIndicator";
import { useLanguage } from "./LanguageProvider";
import { PageGuide } from "./PageGuide";
import { Tooltip } from "./Tooltip";
import { Skeleton } from "./ui";
import { useBrowserPreference } from "./useBrowserPreference";

export const NAV_GROUPS: { label: string; items: { href: string; label: string; description: string; icon: LucideIcon }[] }[] = [
  { label: "My farm", items: [
    { href: "/dashboard", label: "Overview", description: "See how your farm is doing", icon: LayoutDashboard },
    { href: "/dashboard/alerts", label: "Alerts", description: "Check problems and confirm your response", icon: Bell },
    { href: "/dashboard/sensors", label: "Water & climate", description: "Understand your sensor readings", icon: LineChart },
    { href: "/dashboard/controls", label: "Equipment", description: "Turn pumps and watering on or off", icon: SlidersHorizontal },
    { href: "/dashboard/automation", label: "Automatic care", description: "Set when equipment and alarms respond", icon: Workflow },
    { href: "/dashboard/presets", label: "Growing profiles", description: "Save settings for plants and fish", icon: Library },
  ] },
  { label: "Harvest & money", items: [
    { href: "/dashboard/harvest", label: "Harvest & sales", description: "Record harvests and buy-back payments", icon: Sprout },
    { href: "/dashboard/ledger", label: "Buku Besar", description: "Record money received and spent", icon: BookOpen },
  ] },
  { label: "Help & settings", items: [
    { href: "/dashboard/assistant", label: "Ask Tulun VIEM", description: "Get help with fish, plants or alerts", icon: Bot },
    { href: "/dashboard/activity", label: "History & settings", description: "Review actions and manage your preferences", icon: Activity },
  ] },
];

function Sidebar({ collapsed = false, onToggle, onNavigate, onClose }: { collapsed?: boolean; onToggle?: () => void; onNavigate?: () => void; onClose?: () => void }) {
  const { tr } = useLanguage();
  const pathname = usePathname();
  const snap = useSnapshot();
  const alertCount = unacknowledged(snap).length;
  return <div className="flex h-full flex-col bg-forest-950 text-forest-100">
    <div className={cn("flex h-20 shrink-0 items-center gap-3", collapsed ? "justify-center px-3" : "justify-between px-5")}>
      <Link href="/dashboard" onClick={onNavigate} aria-label="VIEM dashboard">{collapsed ? <LogoMark className="h-9 w-9" /> : <Logo tone="light" />}</Link>
      {!collapsed && (onClose ? <button className="flex size-11 items-center justify-center rounded-xl hover:bg-white/10" aria-label={tr("Close menu")} onClick={onClose}><X className="size-5" /></button> : <span className="rounded-md bg-leaf-400/15 px-2 py-1 text-[10px] font-semibold text-leaf-300">{tr("Demo")}</span>)}
    </div>
    <nav aria-label={tr("Dashboard navigation")} className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
      {NAV_GROUPS.map((group, i) => <section key={group.label} aria-label={tr(group.label)} className={cn(i > 0 && "mt-5")}>
        <h2 className={cn("mb-2 text-[10px] font-semibold tracking-[0.12em] text-forest-300 uppercase", collapsed ? "mx-2 border-t border-white/15 pt-2" : "px-3")}><span className={collapsed ? "sr-only" : ""}>{tr(group.label)}</span></h2>
        <ul className="grid gap-1">{group.items.map(({ href, label, description, icon: Icon }) => {
          const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
          const name = tr(label);
          return <li key={href}><Tooltip enabled={collapsed} label={`${name} · ${tr(description)}`}>
            <Link href={href} onClick={onNavigate} aria-label={name} aria-current={active ? "page" : undefined} className={cn("group relative flex min-h-11 items-center rounded-xl transition-colors", collapsed ? "justify-center px-2" : "gap-3 px-3", active ? "bg-leaf-400/15 text-white ring-1 ring-leaf-400/20" : "text-forest-200 hover:bg-white/5 hover:text-white")}>
              <Icon className={cn("size-[1.15rem] shrink-0", active ? "text-leaf-300" : "text-forest-300")} aria-hidden="true" />
              {!collapsed && <span className="flex-1 text-sm font-medium">{name}</span>}
              {href === "/dashboard/alerts" && alertCount > 0 && <span className={cn("rounded-full bg-crit-500 text-center text-[10px] font-semibold text-white", collapsed ? "absolute top-0.5 right-0.5 min-w-4 px-1 leading-4" : "min-w-5 px-1.5 leading-5")}>{alertCount}</span>}
            </Link>
          </Tooltip></li>;
        })}</ul>
      </section>)}
    </nav>
    <div className={cn("shrink-0 border-t border-white/10", collapsed ? "p-3" : "p-4")}>
      {!collapsed && <div className="mb-3 flex items-center gap-2 px-2 text-xs text-forest-200"><span className="size-2 rounded-full bg-leaf-400" /><span>{tr(snap.data.source === "database" ? "Changes are saved" : "Saved on this device")}</span></div>}
      <Tooltip enabled={collapsed} label={tr("Back to website")}><Link href="/" onClick={onNavigate} aria-label={tr("Back to website")} className={cn("flex min-h-11 items-center rounded-xl text-forest-200 hover:bg-white/5", collapsed ? "justify-center" : "gap-3 px-3")}><ArrowLeft className="size-4 shrink-0" />{!collapsed && <span className="text-sm">{tr("Back to website")}</span>}</Link></Tooltip>
      {onToggle && <Tooltip enabled={collapsed} label={tr("Expand sidebar")}><button onClick={onToggle} aria-label={tr(collapsed ? "Expand sidebar" : "Minimize sidebar")} aria-expanded={!collapsed} aria-controls="desktop-sidebar" className={cn("mt-1 flex min-h-11 w-full items-center rounded-xl text-forest-200 hover:bg-white/5", collapsed ? "justify-center" : "gap-3 px-3")}>{collapsed ? <PanelLeftOpen className="size-5" /> : <><PanelLeftClose className="size-5" /><span className="text-sm">{tr("Minimize sidebar")}</span></>}</button></Tooltip>}
    </div>
  </div>;
}

function UnitSwitcher() {
  const { tr } = useLanguage();
  const store = useStore();
  const snap = useSnapshot();
  return <label className="relative inline-flex max-w-full min-w-0 items-center"><span className="sr-only">{tr("Selected farm")}</span><select value={snap.selectedUnitId} onChange={(e) => store.selectUnit(e.target.value)} className="h-11 max-w-full min-w-0 appearance-none truncate rounded-xl border border-forest-200 bg-white pr-8 pl-3 text-sm font-semibold text-forest-900">
    {snap.data.units.map((u) => <option key={u.id} value={u.id}>{u.name} · {u.municipality}</option>)}
  </select><ChevronDown className="pointer-events-none absolute right-2.5 size-4 text-forest-500" /></label>;
}

export function LanguageSwitcher() {
  const { language, setLanguage, tr } = useLanguage();
  return <label className="relative col-span-2 flex shrink-0 items-center justify-between gap-3 sm:block"><span className="text-xs font-medium text-muted sm:sr-only">{tr("Language")}</span><select aria-label={tr("Language")} value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="h-11 w-40 rounded-xl border border-forest-200 bg-white px-2 text-xs font-semibold text-forest-800">{LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}</select></label>;
}

const TOAST_META: Record<ToastTone, { icon: LucideIcon; className: string }> = {
  success: { icon: CircleCheck, className: "border-ok-500/30 [&_svg]:text-ok-700" }, info: { icon: Info, className: "border-water-100 [&_svg]:text-water-700" }, warning: { icon: TriangleAlert, className: "border-warn-500/40 [&_svg]:text-warn-700" }, critical: { icon: OctagonAlert, className: "border-crit-500/50 [&_svg]:text-crit-700" }, error: { icon: CircleAlert, className: "border-crit-500/40 [&_svg]:text-crit-700" },
};
function Toasts() {
  const { tr } = useLanguage();
  const store = useStore();
  const { toasts } = useSnapshot();
  return <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end">{toasts.map((toast) => {
    const { icon: Icon, className } = TOAST_META[toast.tone];
    return <div key={toast.id} role={toast.tone === "critical" || toast.tone === "error" ? "alert" : "status"} className={cn("pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-2xl border bg-white p-4 shadow-lift", className)}><Icon className="mt-0.5 size-5 shrink-0" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-forest-900">{tr(toast.title)}</p>{toast.description && <p className="mt-0.5 text-sm text-muted">{tr(toast.description)}</p>}</div><button onClick={() => store.dismissToast(toast.id)} aria-label={tr("Dismiss notification")} className="flex size-9 shrink-0 items-center justify-center rounded-xl hover:bg-forest-50"><X className="size-4" /></button></div>;
  })}</div>;
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const snap = useSnapshot();
  const pathname = usePathname();
  const { language, tr, simple, setSimple } = useLanguage();
  const [drawer, setDrawer] = useState(false);
  const [storedCollapsed, saveCollapsed] = useBrowserPreference("viem.sidebar-collapsed", "false");
  const collapsed = storedCollapsed === "true";
  const menuButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const alertCount = unacknowledged(snap).length;
  const group = NAV_GROUPS.find((g) => g.items.some((i) => i.href === pathname));
  const page = group?.items.find((i) => i.href === pathname);
  const toggleSidebar = () => saveCollapsed(String(!collapsed));
  useEffect(() => {
    if (!drawer) return;
    const previous = document.body.style.overflow;
    const trigger = menuButton.current;
    document.body.style.overflow = "hidden";
    dialog.current?.querySelector<HTMLButtonElement>('button[aria-label]')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawer(false);
      if (e.key !== "Tab") return;
      const elements = Array.from(dialog.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), select') ?? []).filter((el) => el.getClientRects().length > 0);
      const first = elements[0], last = elements.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", onKey); trigger?.focus(); };
  }, [drawer]);
  return <div lang={language} className="dashboard min-h-dvh bg-[#f4f6f8]" style={{ "--sidebar-width": collapsed ? "5rem" : "17rem" } as CSSProperties}>
    <title>{tr(page?.label ?? "Overview")} · VIEM</title>
    <a href="#main" className="sr-only z-[90] rounded-xl bg-forest-800 p-3 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2">{tr("Skip to content")}</a>
    <aside id="desktop-sidebar" className="fixed inset-y-0 left-0 z-40 hidden w-[var(--sidebar-width)] transition-[width] duration-200 lg:block"><Sidebar collapsed={collapsed} onToggle={toggleSidebar} /></aside>
    {drawer && <div className="fixed inset-0 z-50 lg:hidden"><button tabIndex={-1} aria-label={tr("Close menu")} className="absolute inset-0 bg-forest-950/55" onClick={() => setDrawer(false)} /><div ref={dialog} role="dialog" aria-modal="true" aria-label={tr("Dashboard menu")} className="relative h-full w-80 max-w-[88vw] shadow-lift"><Sidebar onClose={() => setDrawer(false)} onNavigate={() => setDrawer(false)} /></div></div>}
    <div className="transition-[padding] duration-200 lg:pl-[var(--sidebar-width)]">
      <header className="sticky top-0 z-30 border-b border-forest-100 bg-white/95 backdrop-blur-md">
        <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-2 px-4 py-3 sm:flex sm:min-h-18 sm:py-0 md:gap-4 md:px-6">
          <button ref={menuButton} onClick={() => setDrawer(true)} aria-label={tr("Open menu")} aria-expanded={drawer} className="flex size-11 shrink-0 items-center justify-center rounded-xl text-forest-800 hover:bg-forest-50 lg:hidden"><Menu className="size-5" /></button>
          <div className="min-w-0 flex-1">{snap.ready ? <UnitSwitcher /> : <Skeleton className="h-11 w-40" />}</div>
          <div className="hidden xl:block">{snap.ready && <FeedIndicator />}</div>
          <LanguageSwitcher />
          <Link href="/dashboard/alerts" aria-label={tr("Alerts")} className="relative hidden size-11 shrink-0 items-center justify-center rounded-xl border border-forest-100 text-forest-800 sm:flex"><Bell className="size-5" />{alertCount > 0 && <span className="absolute -top-1 -right-1 min-w-5 rounded-full bg-crit-500 px-1 text-center text-[10px] leading-5 font-semibold text-white">{alertCount}</span>}</Link>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-forest-100/70 px-4 py-2 md:px-6">
          <p className="flex min-w-0 flex-wrap gap-1.5 text-xs text-muted"><span>{tr(group?.label ?? "My farm")}</span><span aria-hidden="true">/</span><span className="font-semibold text-forest-800">{tr(page?.label ?? "Overview")}</span></p>
          <label className="flex min-h-8 items-center gap-2 text-xs text-forest-700"><input type="checkbox" checked={simple} onChange={(e) => setSimple(e.target.checked)} className="size-4 accent-forest-700" />{tr("Simple view")}</label>
        </div>
        {snap.data.source === "fallback" && <p className="border-t border-warn-500/20 bg-warn-50 px-4 py-2 text-xs text-warn-700 md:px-6">{tr("Offline demo. Farm records are saved on this device; equipment changes last for this session.")}</p>}
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-[96rem] px-4 py-6 outline-none md:px-6 md:py-8">{snap.ready ? <><PageGuide /><div className="mt-6">{children}</div></> : <DashboardSkeleton />}</main>
    </div>
    <Toasts />
  </div>;
}

export function DashboardSkeleton() {
  const { tr } = useLanguage();
  return <div className="grid gap-5" aria-busy="true" aria-label={tr("Loading dashboard")}><Skeleton className="h-12 w-56" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-36" />)}</div><div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-80 lg:col-span-2" /><Skeleton className="h-80" /></div></div>;
}
