"use client";

import { BatteryCharging, BatteryLow, BatteryMedium, CloudOff, Gauge, SatelliteDish, Sun, Zap } from "lucide-react";
import Link from "next/link";
import { ACTUATORS, SENSORS, SENSOR_GUIDE, tdsFromEc, formatSensor, type ActuatorKind, type SensorKey } from "@/lib/domain";
import { BYTES_PER_READING, SCENARIOS, type ControlReason } from "@/lib/sim/engine";
import type { Snapshot, UnitLive } from "@/lib/sim/store";
import type { ActuatorDTO, ThresholdDTO } from "@/lib/types";
import { cn, fmtRelative } from "@/lib/utils";
import { useNow, useStore } from "./DashboardProvider";
import { ACTUATOR_ICON, SENSOR_ICON, SPINS } from "./icons";
import { Card, Pill, RangeBar, Sparkline, StatusBadge, Switch } from "./ui";

export function SensorTile({ sensor, live, threshold, href }: { sensor: SensorKey; live: UnitLive; threshold?: ThresholdDTO; href?: string }) {
  const meta = SENSORS[sensor];
  const Icon = SENSOR_ICON[sensor];
  const value = live.latest[sensor];
  const status = live.statuses[sensor];
  const recent = live.history.slice(-60).map((r) => r[sensor]);
  const delta = recent.length > 10 ? value - recent[recent.length - 11] : 0;
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium text-forest-800">
          <span className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${meta.color}14`, color: meta.color }}>
            <Icon className="size-4" aria-hidden="true" />
          </span>
          {meta.short}
        </p>
        <StatusBadge status={status} />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted">{SENSOR_GUIDE[sensor].purpose}</p>
      <p className="mt-3 flex items-baseline gap-1.5">
        <span className="font-display text-[2rem] leading-none font-medium text-forest-950 tabular">{formatSensor(sensor, value)}</span>
        <span className="text-sm text-muted">{meta.unit === "pH" ? "" : meta.unit}</span>
        {Math.abs(delta) >= Math.pow(10, -meta.decimals) && (
          <span className={cn("ml-auto text-xs font-medium tabular", delta > 0 ? "text-forest-600" : "text-forest-600")}>
            {delta > 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(meta.decimals)}
            <span className="sr-only"> change over the last 5 minutes</span>
          </span>
        )}
      </p>
      {sensor === "ec" && <p className="mt-1 text-xs text-muted">≈ {tdsFromEc(value)} ppm TDS</p>}
      <Sparkline values={recent} color={meta.color} band={threshold ? [threshold.min, threshold.max] : undefined} className="mt-2" />
      {threshold && (
        <div className="mt-2">
          <RangeBar value={value} t={threshold} domain={meta.domain} color={meta.color} />
          <p className="mt-1.5 flex justify-between text-[0.7rem] text-muted tabular">
            <span>
              Normal {threshold.min}–{threshold.max}
            </span>
            {!threshold.alarmEnabled && <span className="font-medium text-warn-700">Alarm off</span>}
          </p>
        </div>
      )}
    </>
  );
  const cls = cn(
    "block rounded-2xl border bg-white p-4 transition-shadow",
    status === "critical" ? "border-crit-500/50 ring-2 ring-crit-500/15" : status === "warning" ? "border-warn-500/50" : "border-forest-100",
    href && "hover:shadow-soft",
  );
  return href ? (
    <Link href={href} className={cls} aria-label={`${meta.label}: ${formatSensor(sensor, value)} ${meta.unit}, ${status}`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

const REASON_LABEL: Record<ControlReason, string> = {
  manual: "Manual",
  rule: "Auto",
  schedule: "Schedule",
  interlock: "Safety",
  hold: "Auto",
};

export function ActuatorRow({ unitId, kind, dto, live, pending }: { unitId: string; kind: ActuatorKind; dto: ActuatorDTO; live: UnitLive; pending: boolean }) {
  const store = useStore();
  const now = useNow();
  const eff = live.actuators[kind];
  const Icon = ACTUATOR_ICON[kind];
  const changed = live.lastChange[kind];
  const manual = dto.mode === "manual";
  return (
    <li className="flex items-center gap-3 py-3">
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
          eff.on ? "bg-leaf-100 text-leaf-700" : "bg-forest-50 text-forest-400",
        )}
      >
        <Icon className={cn("size-5", eff.on && SPINS[kind] && "motion-safe:animate-spin-slow")} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-forest-900">
          {ACTUATORS[kind].label}
          <Pill tone={eff.reason === "interlock" ? "crit" : manual ? "neutral" : "water"}>{REASON_LABEL[eff.reason]}</Pill>
        </p>
        <p className="truncate text-xs text-muted" title={eff.detail}>
          {eff.detail}
          {changed && now ? ` · ${fmtRelative(changed, now)}` : ""}
        </p>
      </div>
      <span className={cn("hidden text-xs font-bold sm:block", eff.on ? "text-leaf-700" : "text-forest-400")}>{eff.on ? "ON" : "OFF"}</span>
      <Switch
        checked={manual ? dto.isOn : eff.on}
        disabled={!manual || pending}
        onChange={(v) => store.setActuatorPower(unitId, kind, v)}
        label={manual ? `Turn ${ACTUATORS[kind].label} ${dto.isOn ? "off" : "on"}` : `${ACTUATORS[kind].label} is controlled automatically`}
      />
    </li>
  );
}

export function PowerCard({ live }: { live: UnitLive }) {
  const r = live.latest;
  const BatteryIcon = r.battery < 25 ? BatteryLow : r.solarW > r.loadW ? BatteryCharging : BatteryMedium;
  const items = [
    { icon: BatteryIcon, label: "Battery", value: `${r.battery.toFixed(0)}%`, tone: r.battery < 25 ? "text-crit-700" : "text-forest-900" },
    { icon: Sun, label: "Solar", value: `${Math.round(r.solarW)} W`, tone: "text-forest-900" },
    { icon: Zap, label: "Load", value: `${Math.round(r.loadW)} W`, tone: "text-forest-900" },
    { icon: Gauge, label: "Pump current", value: `${r.pumpA.toFixed(1)} A`, tone: live.pumpFault ? "text-crit-700" : "text-forest-900" },
  ];
  return (
    <Card title="Solar & power" description="Battery-backed so aeration survives the night and outages.">
      <dl className="grid grid-cols-2 gap-3">
        {items.map(({ icon: Icon, label, value, tone }) => (
          <div key={label} className="rounded-xl bg-forest-50 p-3">
            <dt className="flex items-center gap-1.5 text-xs text-muted">
              <Icon className="size-3.5" aria-hidden="true" /> {label}
            </dt>
            <dd className={cn("mt-1 text-lg font-semibold tabular", tone)}>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-forest-100" aria-hidden="true">
        <div
          className={cn("h-full rounded-full transition-[width] duration-700", r.battery < 25 ? "bg-crit-500" : "bg-leaf-500")}
          style={{ width: `${r.battery}%` }}
        />
      </div>
      {live.pumpFault && (
        <p className="mt-3 rounded-xl bg-crit-50 p-3 text-xs font-medium text-crit-700">
          A pump is switched on but drawing no current — possible pump or power failure.
        </p>
      )}
    </Card>
  );
}

export function LinkCard({ unitId, live }: { unitId: string; live: UnitLive }) {
  const store = useStore();
  const offline = live.scenarios.linkOutage;
  return (
    <Card
      title="Vorakai link"
      description="Offline-first: rules run on site, readings upload in small batches."
      action={
        <Pill tone={offline ? "crit" : "leaf"}>
          {offline ? <CloudOff className="size-3.5" aria-hidden="true" /> : <SatelliteDish className="size-3.5" aria-hidden="true" />}
          {offline ? "Offline" : "Online"}
        </Pill>
      }
    >
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-forest-50 p-3">
          <dt className="text-xs text-muted">Buffered on site</dt>
          <dd className="mt-1 text-lg font-semibold text-forest-900 tabular">{live.buffered}</dd>
        </div>
        <div className="rounded-xl bg-forest-50 p-3">
          <dt className="text-xs text-muted">Uploaded this session</dt>
          <dd className="mt-1 text-lg font-semibold text-forest-900 tabular">{(live.bytesSent / 1024).toFixed(1)} KB</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-muted">
        ≈ {((BYTES_PER_READING * 120) / 1024).toFixed(1)} KB per hour at one reading every 30 s — well within a shared satellite link.
      </p>
      <button
        type="button"
        onClick={() => store.toggleScenario(unitId, "linkOutage")}
        className="mt-3 inline-flex min-h-10 items-center rounded-full px-3 text-xs font-semibold text-water-700 ring-1 ring-water-100 hover:bg-water-50"
      >
        {offline ? "Restore the link" : "Simulate a link outage"}
      </button>
    </Card>
  );
}

export function ScenarioPanel({ unitId, live }: { unitId: string; live: UnitLive }) {
  const store = useStore();
  return (
    <Card title="Demo scenarios" description="Inject a fault and watch alarms, automation and interlocks respond.">
      <ul className="grid gap-2">
        {SCENARIOS.filter((s) => s.key !== "linkOutage").map((s) => {
          const on = live.scenarios[s.key];
          return (
            <li key={s.key} className={cn("flex items-center gap-3 rounded-xl p-3 ring-1", on ? "bg-warn-50 ring-warn-500/30" : "ring-forest-100")}>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-forest-900">{s.label}</p>
                <p className="text-xs text-muted">{s.description}</p>
              </div>
              <Switch checked={on} onChange={() => store.toggleScenario(unitId, s.key)} label={`Simulate ${s.label.toLowerCase()}`} />
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted">Tip: press the refresh button in the top bar to take a reading immediately.</p>
    </Card>
  );
}

export function HealthRing({ value, size = 56 }: { value: number; size?: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const color = value >= 80 ? "#22935d" : value >= 55 ? "#d99315" : "#d8452f";
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 50 50" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="25" cy="25" r={r} fill="none" stroke="#e3eee8" strokeWidth="5" />
        <circle
          cx="25"
          cy="25"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="text-sm font-bold text-forest-900 tabular">{value}</span>
      <span className="sr-only"> out of 100 health score</span>
    </span>
  );
}

export function sessionRuntime(ms: number) {
  const m = Math.round(ms / 60000);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
}

export function fleetSummary(snap: Snapshot) {
  return snap.data.units.map((u) => {
    const live = snap.live[u.id];
    const open = snap.data.alerts.filter((a) => a.unitId === u.id && !a.acknowledgedAt).length;
    return { unit: u, live, open };
  });
}
