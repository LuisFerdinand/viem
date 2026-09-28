"use client";

import { ArrowRight, Clock, Lock, ShieldCheck, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ACTUATOR_KINDS, ACTUATORS, SENSORS, type ActuatorKind, type ActuatorMode } from "@/lib/domain";
import { timorHour } from "@/lib/sim/engine";
import { selectThresholds, selectUnit, type UnitLive } from "@/lib/sim/store";
import type { ActuatorDTO, RuleDTO } from "@/lib/types";
import { cn, fmtDateTime } from "@/lib/utils";
import { useNow, useSnapshot, useStore } from "../DashboardProvider";
import { ACTUATOR_ICON, SPINS } from "../icons";
import { Card, Field, Input, PageHeader, Pill, Segmented, Switch } from "../ui";
import { sessionRuntime } from "../widgets";

const MODES: { value: ActuatorMode; label: string }[] = [
  { value: "manual", label: "Manual" },
  { value: "auto", label: "Auto" },
  { value: "schedule", label: "Schedule" },
];

function describeRule(r: RuleDTO) {
  const m = SENSORS[r.sensor];
  const offWord = r.condition === "below" ? "rises above" : "falls below";
  return `ON when ${m.short.toLowerCase()} is ${r.condition} ${r.onValue} ${m.unit}; OFF when it ${offWord} ${r.offValue} ${m.unit}`;
}

function ScheduleEditor({ unitId, dto }: { unitId: string; dto: ActuatorDTO }) {
  const store = useStore();
  const snap = useSnapshot();
  const now = useNow();
  const [on, setOn] = useState(String(dto.scheduleOnMin));
  const [off, setOff] = useState(String(dto.scheduleOffMin));
  const [error, setError] = useState<string | null>(null);
  const pending = !!snap.pending[`schedule:${unitId}:${dto.kind}`];

  const cycle = dto.scheduleOnMin + dto.scheduleOffMin;
  let nextChange: number | null = null;
  if (now && cycle > 0) {
    const minute = Math.floor(timorHour(now) * 60);
    const pos = minute % cycle;
    nextChange = pos < dto.scheduleOnMin ? dto.scheduleOnMin - pos : cycle - pos;
  }

  return (
    <form
      className="grid gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const onMin = Number(on);
        const offMin = Number(off);
        if (!Number.isInteger(onMin) || onMin < 1 || onMin > 240) return setError("Run time must be a whole number from 1 to 240 minutes.");
        if (!Number.isInteger(offMin) || offMin < 1 || offMin > 720) return setError("Rest time must be a whole number from 1 to 720 minutes.");
        setError(null);
        const err = await store.saveSchedule(unitId, dto.kind, onMin, offMin);
        if (err) setError(err);
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Run for (min)">
          {(p) => <Input {...p} type="number" inputMode="numeric" min={1} max={240} value={on} onChange={(e) => setOn(e.target.value)} />}
        </Field>
        <Field label="Rest for (min)">
          {(p) => <Input {...p} type="number" inputMode="numeric" min={1} max={720} value={off} onChange={(e) => setOff(e.target.value)} />}
        </Field>
      </div>
      {error && (
        <p role="alert" className="text-xs font-medium text-crit-700">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {nextChange != null && (
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Clock className="size-3.5" aria-hidden="true" /> Next switch in about {nextChange} min (Dili time)
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="ml-auto inline-flex h-10 items-center rounded-full bg-forest-800 px-4 text-sm font-semibold text-white hover:bg-forest-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save schedule"}
        </button>
      </div>
    </form>
  );
}

function ActuatorCard({ unitId, kind, dto, live, rules }: { unitId: string; kind: ActuatorKind; dto: ActuatorDTO; live: UnitLive; rules: RuleDTO[] }) {
  const store = useStore();
  const snap = useSnapshot();
  const eff = live.actuators[kind];
  const Icon = ACTUATOR_ICON[kind];
  const meta = ACTUATORS[kind];
  const myRules = rules.filter((r) => r.actuator === kind);
  const activeRules = myRules.filter((r) => r.enabled);
  const modePending = !!snap.pending[`mode:${unitId}:${kind}`];
  const powerPending = !!snap.pending[`power:${unitId}:${kind}`];

  return (
    <Card className={cn(eff.reason === "interlock" && "ring-2 ring-crit-500/30")}>
      <div className="flex items-start gap-4">
        <span
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-2xl transition-colors",
            eff.on ? "bg-leaf-100 text-leaf-700" : "bg-forest-50 text-forest-400",
          )}
        >
          <Icon className={cn("size-7", eff.on && SPINS[kind] && "motion-safe:animate-spin-slow")} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-forest-900">{meta.label}</h2>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-bold",
                eff.on ? "bg-leaf-500 text-white" : "bg-forest-100 text-forest-600",
              )}
            >
              {eff.on ? "RUNNING" : "OFF"}
            </span>
            {eff.reason === "interlock" && (
              <Pill tone="crit">
                <Lock className="size-3" aria-hidden="true" /> Safety override
              </Pill>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">{meta.description}</p>
          <p className="mt-2 text-xs font-medium text-forest-700">{eff.detail}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-forest-100 pt-4">
        <Segmented label={`${meta.label} mode`} value={dto.mode} options={MODES} onChange={(m) => store.setActuatorMode(unitId, kind, m)} disabled={modePending} />
        {dto.mode === "manual" && (
          <label className="flex items-center gap-3 text-sm font-semibold text-forest-800">
            Power
            <Switch size="lg" checked={dto.isOn} disabled={powerPending} onChange={(v) => store.setActuatorPower(unitId, kind, v)} label={`${meta.label} power`} />
          </label>
        )}
      </div>

      <div className="mt-4">
        {dto.mode === "auto" &&
          (activeRules.length ? (
            <ul className="grid gap-2">
              {activeRules.map((r) => (
                <li key={r.id} className="rounded-xl bg-water-50 px-3 py-2 text-xs text-water-700">
                  {describeRule(r)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-start gap-2 rounded-xl bg-warn-50 p-3 text-xs text-warn-700">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              No active rules for this actuator — it will hold its current state. Add one under Automation.
            </p>
          ))}
        {dto.mode === "schedule" && <ScheduleEditor key={`${dto.scheduleOnMin}-${dto.scheduleOffMin}`} unitId={unitId} dto={dto} />}
        {dto.mode === "manual" && (
          <p className="text-xs text-muted">
            Manual mode ignores rules and schedules. Safety interlocks still protect the fish and pumps.
          </p>
        )}
      </div>

      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-forest-100 pt-3 text-xs text-muted">
        <div className="flex gap-1">
          <dt>Run time this session:</dt>
          <dd className="font-semibold text-forest-800 tabular">{sessionRuntime(live.runtimeMs[kind])}</dd>
        </div>
        <div className="flex gap-1">
          <dt>Last configured:</dt>
          <dd className="font-semibold text-forest-800">
            {dto.updatedBy} · {fmtDateTime(dto.updatedAt)}
          </dd>
        </div>
      </dl>
      {dto.mode === "auto" && (
        <Link href="/dashboard/automation#rules" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-forest-600 hover:underline">
          Edit rules <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      )}
    </Card>
  );
}

export function ControlsView() {
  const snap = useSnapshot();
  const unit = selectUnit(snap);
  const live = snap.live[unit.id];
  const th = selectThresholds(snap);
  const actuators = snap.data.actuators.filter((a) => a.unitId === unit.id);
  const rules = snap.data.rules.filter((r) => r.unitId === unit.id);
  if (!live) return null;

  const interlocks = [
    {
      title: "Low-oxygen guard",
      body: `If dissolved oxygen drops below ${th.do?.criticalMin ?? "—"} mg/L, aeration is forced ON and the on-site buzzer sounds.`,
      active: live.actuators.aeration.reason === "interlock",
    },
    {
      title: "Dry-run protection",
      body: `If the tank falls below ${th.waterLevel?.criticalMin ?? "—"}%, irrigation and circulation stop and the pump refills.`,
      active: live.actuators.circulation.reason === "interlock" || (live.actuators.pump.reason === "interlock" && live.actuators.pump.on),
    },
    {
      title: "Overflow protection",
      body: `If the tank rises above ${th.waterLevel?.criticalMax ?? "—"}%, the pump is forced OFF.`,
      active: live.actuators.pump.reason === "interlock" && !live.actuators.pump.on,
    },
  ];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Controls"
        description={`${unit.name} · switch the pump, aeration, irrigation and water circulation by hand, hand them to automation rules, or run them on a timer.`}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        {ACTUATOR_KINDS.map((k) => {
          const dto = actuators.find((a) => a.kind === k);
          return dto ? <ActuatorCard key={k} unitId={unit.id} kind={k} dto={dto} live={live} rules={rules} /> : null;
        })}
      </div>
      <Card
        title={
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-leaf-600" aria-hidden="true" /> Safety interlocks
          </span>
        }
        description="Run locally on the ESP32 controller — they override every mode and keep working when the satellite link is down."
      >
        <ul className="grid gap-3 md:grid-cols-3">
          {interlocks.map((i) => (
            <li key={i.title} className={cn("rounded-xl p-4 ring-1", i.active ? "bg-crit-50 ring-crit-500/30" : "bg-forest-50 ring-forest-100")}>
              <p className="flex items-center justify-between gap-2 text-sm font-semibold text-forest-900">
                {i.title}
                <Pill tone={i.active ? "crit" : "leaf"}>{i.active ? "Engaged" : "Standing by"}</Pill>
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{i.body}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
