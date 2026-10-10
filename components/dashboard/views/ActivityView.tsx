"use client";

import { useLanguage, useDashboardFormatters } from "../LanguageProvider";

import {
  Bell,
  Cog,
  Database,
  FlaskConical,
  Hand,
  RotateCcw,
  ScrollText,
  Sprout,
  UserRound,
  Workflow,
  Wrench,
  Server,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { EVENT_CATEGORIES, type EventCategory } from "@/lib/domain";
import { selectUnit } from "@/lib/sim/store";
import type { EventDTO } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useNow, useSnapshot, useStore } from "../DashboardProvider";
import { Card, EmptyState, Field, Input, PageHeader, Select } from "../ui";

const CATEGORY_META: Record<EventCategory, { label: string; icon: LucideIcon; className: string }> = {
  control: { label: "Manual control", icon: Hand, className: "bg-forest-100 text-forest-700" },
  automation: { label: "Automation", icon: Workflow, className: "bg-water-50 text-water-700" },
  alarm: { label: "Alarm", icon: Bell, className: "bg-warn-50 text-warn-700" },
  config: { label: "Configuration", icon: Cog, className: "bg-forest-50 text-forest-600" },
  maintenance: { label: "Maintenance", icon: Wrench, className: "bg-leaf-50 text-leaf-700" },
  harvest: { label: "Harvest", icon: Sprout, className: "bg-leaf-100 text-leaf-700" },
  system: { label: "System", icon: Server, className: "bg-sand-100 text-forest-700" },
};

export function ActivityList({ events, showUnit = false }: { events: EventDTO[]; showUnit?: boolean }) {
  const { fmtDateTime, fmtRelative } = useDashboardFormatters();
  const { tr } = useLanguage();
  const snap = useSnapshot();
  const now = useNow();
  if (events.length === 0) {
    return (
      <EmptyState icon={ScrollText} title={tr("Nothing here yet")}>
        {tr("Actions, automation and alarms will appear here as they happen.")}</EmptyState>
    );
  }
  return (
    <ol className="grid gap-1">
      {events.map((e) => {
        const meta = CATEGORY_META[e.category] ?? CATEGORY_META.system;
        const Icon = meta.icon;
        const unit = showUnit && e.unitId ? snap.data.units.find((u) => u.id === e.unitId) : null;
        return (
          <li key={e.id} className="flex items-start gap-3 rounded-xl px-2 py-2.5 hover:bg-forest-50/60">
            <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg", meta.className)}>
              <Icon className="size-4" aria-hidden="true" />
              <span className="sr-only">{tr(meta.label)}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-forest-900">{tr(e.message)}</p>
              <p className="mt-0.5 text-xs text-muted">
                {e.actor}
                {tr(unit ? ` · ${unit.name}` : "")} ·{" "}
                <time dateTime={e.createdAt} title={tr(fmtDateTime(e.createdAt))}>
                  {tr(now ? fmtRelative(e.createdAt, now) : fmtDateTime(e.createdAt))}
                </time>
                {tr(e.id < 0 && " · this session only")}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function ActivityView() {
  const { tr } = useLanguage();
  const snap = useSnapshot();
  const store = useStore();
  const now = useNow();
  const unit = selectUnit(snap);
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [category, setCategory] = useState<EventCategory | "all">("all");
  const [operator, setOperator] = useState(snap.operator);
  const [ph, setPh] = useState("7.0");
  const [ammonia, setAmmonia] = useState("0.25");
  const [maintError, setMaintError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const events = useMemo(
    () =>
      snap.data.events.filter(
        (e) => (unitFilter === "all" || e.unitId === unitFilter) && (category === "all" || e.category === category),
      ),
    [snap.data.events, unitFilter, category],
  );

  const lastCalibration = snap.data.events.find(
    (e) => e.unitId === unit.id && e.category === "maintenance" && e.message.toLowerCase().includes("calibration"),
  );
  const calibrationDays = lastCalibration && now ? Math.floor((now - new Date(lastCalibration.createdAt).getTime()) / 86_400_000) : null;
  const totalReadings = Object.values(snap.live).reduce((n, l) => n + l.history.length, 0);
  const totalBytes = Object.values(snap.live).reduce((n, l) => n + l.bytesSent, 0);

  async function logStrip() {
    const p = Number(ph);
    const a = Number(ammonia);
    if (!Number.isFinite(p) || p < 0 || p > 14) return setMaintError("pH must be between 0 and 14.");
    if (!Number.isFinite(a) || a < 0 || a > 20) return setMaintError("Ammonia must be between 0 and 20 ppm.");
    setMaintError(null);
    const err = await store.logMaintenance(unit.id, "test-strip", p, a);
    if (err) setMaintError(err);
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title={tr("History & settings")}
        description={tr("Review previous actions, set your name and record maintenance.")}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title={tr("Activity log")}
          description={tr("{0} entries shown", [events.length])}
          action={
            <div className="flex flex-wrap gap-2">
              <label className="sr-only" htmlFor="unit-filter">
                {tr("Filter by unit")}</label>
              <Select id="unit-filter" value={unitFilter} onChange={(e) => setUnitFilter(e.target.value)} className="h-9 w-auto rounded-full text-xs">
                <option value="all">{tr("All units")}</option>
                {snap.data.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </Select>
              <label className="sr-only" htmlFor="cat-filter">
                {tr("Filter by type")}</label>
              <Select
                id="cat-filter"
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory | "all")}
                className="h-9 w-auto rounded-full text-xs"
              >
                <option value="all">{tr("All types")}</option>
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {tr(CATEGORY_META[c].label)}
                  </option>
                ))}
              </Select>
            </div>
          }
        >
          <ActivityList events={events} showUnit />
          {snap.hasMoreEvents && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => store.loadMoreEvents()}
                disabled={!!snap.pending["events:more"]}
                className="inline-flex h-10 items-center rounded-full px-5 text-sm font-semibold text-forest-700 ring-1 ring-forest-200 hover:bg-forest-50 disabled:opacity-50"
              >
                {tr(snap.pending["events:more"] ? "Loading…" : "Load older entries")}
              </button>
            </div>
          )}
        </Card>

        <div className="grid content-start gap-6">
          <Card title={tr("Operator")} description={tr("Your name signs every action and acknowledgement.")}>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                store.setOperator(operator);
                store.toast("success", "Operator name saved");
              }}
            >
              <label htmlFor="operator" className="sr-only">
                {tr("Operator name")}</label>
              <div className="relative flex-1">
                <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-forest-400" aria-hidden="true" />
                <Input id="operator" value={operator} maxLength={60} onChange={(e) => setOperator(e.target.value)} className="pl-9" autoComplete="name" />
              </div>
              <button type="submit" className="h-11 rounded-full bg-forest-800 px-4 text-sm font-semibold text-white hover:bg-forest-700">
                {tr("Save")}</button>
            </form>
          </Card>

          <Card title={tr("Maintenance")} description={tr("{0} · guards against sensor drift", [unit.name])}>
            <p className="rounded-xl bg-forest-50 p-3 text-sm text-forest-800">
              {tr("Last calibration:")}{" "}
              <strong>{tr(calibrationDays == null ? "not recorded" : calibrationDays === 0 ? "today" : `${calibrationDays} days ago`)}</strong>
              {calibrationDays != null && calibrationDays > 30 && <span className="ml-1 font-semibold text-warn-700">{tr("— due now")}</span>}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Field label={tr("Strip pH")}>
                {(p) => <Input {...p} type="number" inputMode="decimal" step="0.1" min={0} max={14} value={ph} onChange={(e) => setPh(e.target.value)} />}
              </Field>
              <Field label={tr("Ammonia (ppm)")}>
                {(p) => (
                  <Input {...p} type="number" inputMode="decimal" step="0.05" min={0} max={20} value={ammonia} onChange={(e) => setAmmonia(e.target.value)} />
                )}
              </Field>
            </div>
            {maintError && (
              <p role="alert" className="mt-2 text-xs font-medium text-crit-700">
                {tr(maintError)}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void logStrip()}
                disabled={!!snap.pending["maint:test-strip"]}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-forest-800 px-4 text-sm font-semibold text-white hover:bg-forest-700 disabled:opacity-50"
              >
                <FlaskConical className="size-4" aria-hidden="true" /> {tr("Log weekly test strip")}</button>
              <button
                type="button"
                onClick={() => void store.logMaintenance(unit.id, "calibration")}
                disabled={!!snap.pending["maint:calibration"]}
                className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-forest-700 ring-1 ring-forest-200 hover:bg-forest-50 disabled:opacity-50"
              >
                <Wrench className="size-4" aria-hidden="true" /> {tr("Log calibration")}</button>
            </div>
          </Card>

          <Card title={tr("Data footprint")} description={tr("What this demo stores — and what it doesn't.")}>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-forest-50 p-3">
                <dt className="text-xs text-muted">{tr("Readings in memory")}</dt>
                <dd className="mt-1 text-lg font-semibold tabular">{tr(totalReadings)}</dd>
              </div>
              <div className="rounded-xl bg-forest-50 p-3">
                <dt className="text-xs text-muted">{tr("Simulated upload")}</dt>
                <dd className="mt-1 text-lg font-semibold tabular">{tr((totalBytes / 1024).toFixed(1))} {tr("KB")}</dd>
              </div>
            </dl>
            <p className="mt-3 flex gap-2 text-xs leading-relaxed text-muted">
              <Database className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {tr("Readings and automatic responses are simulated in this browser. Farm records and saved settings use the database when connected.")}</p>
          </Card>

          <Card title={tr("Reset demo")} description={tr("Restore controls, rules, alarms, events and harvests to their starting values.")}>
            {confirmReset ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="w-full text-sm text-forest-800">{tr("This replaces all demo data for every visitor. Continue?")}</p>
                <button
                  type="button"
                  onClick={async () => {
                    await store.resetDemo();
                    setConfirmReset(false);
                  }}
                  disabled={!!snap.pending.reset}
                  className="inline-flex h-10 items-center gap-1.5 rounded-full bg-crit-700 px-4 text-sm font-semibold text-white hover:bg-crit-500 disabled:opacity-50"
                >
                  <RotateCcw className="size-4" aria-hidden="true" /> {tr(snap.pending.reset ? "Resetting…" : "Yes, reset")}
                </button>
                <button type="button" onClick={() => setConfirmReset(false)} className="h-10 rounded-full px-4 text-sm font-medium text-forest-700 hover:bg-forest-50">
                  {tr("Cancel")}</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-crit-700 ring-1 ring-crit-500/40 hover:bg-crit-50"
              >
                <RotateCcw className="size-4" aria-hidden="true" /> {tr("Reset demo data")}</button>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
