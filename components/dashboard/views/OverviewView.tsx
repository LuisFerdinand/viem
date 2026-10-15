"use client";

import { ArrowRight, BellRing, ChevronRight, MessageCircle, RefreshCw, X } from "lucide-react";
import Link from "next/link";
import { SENSORS, SENSOR_KEYS, formatSensor, type SensorKey, type SensorStatus } from "@/lib/domain";
import { findPreset } from "@/lib/hubs";
import { selectHub, selectUnit, unacknowledged } from "@/lib/sim/store";
import { cn } from "@/lib/utils";
import { useNow, useSnapshot, useStore } from "../DashboardProvider";
import { useDashboardFormatters, useLanguage } from "../LanguageProvider";
import { SENSOR_ICON } from "../icons";
import { useBrowserPreference } from "../useBrowserPreference";
import { BusinessSummary } from "../BusinessSummary";
import { Card, PageHeader, StatusBadge } from "../ui";

/** A coloured line under each result so a problem stands out at a glance. */
const ROW_BORDER: Record<SensorStatus, string> = { ok: "border-b-ok-500/40", warning: "border-b-warn-500", critical: "border-b-crit-500" };

function ResultRow({ sensor, value, status }: { sensor: SensorKey; value: number; status: SensorStatus }) {
  const { tr } = useLanguage();
  const meta = SENSORS[sensor];
  const Icon = SENSOR_ICON[sensor];
  return (
    <li>
      <Link
        href={`/dashboard/sensors#${sensor}`}
        aria-label={tr("{0}: {1} {2}, {3}", [tr(meta.label), formatSensor(sensor, value), meta.unit, status])}
        className={cn("group flex min-h-16 items-center gap-3 border-b-2 px-4 py-3 transition-colors hover:bg-forest-50/60 sm:px-5", ROW_BORDER[status])}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${meta.color}14`, color: meta.color }}>
          <Icon className="size-[1.1rem]" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1 text-sm font-medium text-forest-900">{tr(meta.label)}</span>
        <span className="font-display text-2xl leading-none text-forest-950 tabular">
          {tr(formatSensor(sensor, value))}
          {meta.unit !== "pH" && <span className="ml-1 font-sans text-xs text-muted">{tr(meta.unit)}</span>}
        </span>
        <span className="flex w-24 justify-end"><StatusBadge status={status} /></span>
        <ChevronRight className="hidden size-4 shrink-0 text-forest-300 group-hover:text-forest-500 sm:block" aria-hidden="true" />
      </Link>
    </li>
  );
}

/** A one-time invitation for new users, and for phones, to use the simple chat instead. */
function ChatPromo() {
  const { tr } = useLanguage();
  const [state, setState] = useBrowserPreference("viem.chat-promo", "show");
  if (state === "hidden") return null;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-leaf-200 bg-leaf-50 p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-leaf-700"><MessageCircle className="size-5" aria-hidden="true" /></span>
      <div className="min-w-0 flex-1 basis-56">
        <p className="text-sm font-semibold text-forest-900">{tr("New here? Chat with Tulun VIEM")}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">{tr("Check your farm, record money and turn equipment on or off with simple messages. Alerts arrive there too.")}</p>
      </div>
      <Link href="/dashboard/assistant" onClick={() => setState("hidden")} className="dash-primary">{tr("Open Tulun VIEM")}</Link>
      <button type="button" onClick={() => setState("hidden")} aria-label={tr("Dismiss notification")} className="flex size-10 items-center justify-center rounded-xl text-forest-500 hover:bg-white"><X className="size-4" aria-hidden="true" /></button>
    </div>
  );
}

export function OverviewView() {
  const { fmtRelative } = useDashboardFormatters();
  const { tr } = useLanguage();
  const snap = useSnapshot();
  const store = useStore();
  const now = useNow();
  const hub = selectHub(snap);
  const unit = selectUnit(snap);
  const live = snap.live[unit.id];
  const open = unacknowledged(snap, unit.id).length;
  if (!live) return null;

  const needCheck = SENSOR_KEYS.filter((k) => live.statuses[k] !== "ok").length;
  const preset = findPreset(snap.data.presets, unit.presetId);

  return (
    <div className="grid gap-5">
      <ChatPromo />
      <PageHeader
        title={`${hub.name} · ${unit.name}`}
        description={
          <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{tr(preset.crop)}</span>
            <span>{tr("Last scan")} {tr(now ? fmtRelative(live.latest.t, now) : "—")}</span>
          </span>
        }
        actions={
          <button type="button" onClick={() => store.readNow()} className="dash-secondary">
            <RefreshCw className="size-4" aria-hidden="true" /> {tr("Scan now")}
          </button>
        }
      />

      {open > 0 && (
        <Link href="/dashboard/alerts" className="flex items-center gap-3 rounded-2xl border border-crit-500/30 bg-crit-50 px-4 py-3 text-sm font-semibold text-crit-700 hover:border-crit-500/60">
          <BellRing className="size-5 shrink-0" aria-hidden="true" />
          <span className="flex-1">{tr(open === 1 ? "1 alert needs your attention" : "{0} alerts need your attention", [open])}</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      )}

      <Card
        title={tr("Latest scan")}
        description={needCheck === 0 ? tr("Everything is normal.") : tr(needCheck === 1 ? "1 reading needs checking." : "{0} readings need checking.", [needCheck])}
        bodyClassName="p-0"
      >
        <ul>
          {SENSOR_KEYS.map((k) => <ResultRow key={k} sensor={k} value={live.latest[k]} status={live.statuses[k]} />)}
        </ul>
      </Card>

      <p className="text-center text-xs text-muted">
        <Link href="/dashboard/sensors" className="inline-flex items-center gap-1 font-semibold text-forest-600 hover:underline">
          {tr("Charts & history")} <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </p>

      <BusinessSummary />
    </div>
  );
}
