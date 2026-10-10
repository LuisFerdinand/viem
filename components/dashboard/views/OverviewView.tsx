"use client";

import { ArrowRight, BellOff, Fish, MapPin, SatelliteDish, CloudOff } from "lucide-react";
import Link from "next/link";
import { ACTUATOR_KINDS, SENSOR_CATEGORIES } from "@/lib/domain";
import { selectThresholds, selectUnit, unacknowledged } from "@/lib/sim/store";
import { cn, fmtRelative } from "@/lib/utils";
import { AlertItem } from "../AlertItem";
import { useNow, useSnapshot, useStore } from "../DashboardProvider";
import { Card, EmptyState, PageHeader, Pill } from "../ui";
import { ActuatorRow, HealthRing, LinkCard, PowerCard, ScenarioPanel, SensorTile, fleetSummary } from "../widgets";
import { ActivityList } from "./ActivityView";

export function OverviewView() {
  const snap = useSnapshot();
  const store = useStore();
  const now = useNow();
  const unit = selectUnit(snap);
  const live = snap.live[unit.id];
  const thresholds = selectThresholds(snap);
  const actuators = snap.data.actuators.filter((a) => a.unitId === unit.id);
  const alerts = unacknowledged(snap, unit.id).slice(0, 3);
  const events = snap.data.events.filter((e) => e.unitId === unit.id || e.unitId === null).slice(0, 6);
  if (!live) return null;

  return (
    <div className="grid gap-6">
      <PageHeader
        title={unit.name}
        description={
          <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden="true" /> {unit.site} · {unit.location}, {unit.municipality}
            </span>
            <span className="inline-flex items-center gap-1">
              <Fish className="size-3.5" aria-hidden="true" /> {unit.fishCount} tilapia · {unit.tankLiters.toLocaleString()} L tank
            </span>
          </span>
        }
        actions={
          <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-2 ring-1 ring-forest-100">
            <HealthRing value={live.health} size={48} />
            <div className="text-xs">
              <p className="font-semibold text-forest-900">Unit health</p>
              <p className="text-muted">{live.history.length} readings · last {now ? fmtRelative(live.latest.t, now) : "—"}</p>
            </div>
          </div>
        }
      />

      {/* Fleet */}
      <section aria-labelledby="fleet-heading">
        <h2 id="fleet-heading" className="sr-only">
          Fleet
        </h2>
        <ul className="grid gap-3 md:grid-cols-3">
          {fleetSummary(snap).map(({ unit: u, live: l, open }) => {
            const selected = u.id === unit.id;
            const offline = l?.scenarios.linkOutage;
            return (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => store.selectUnit(u.id)}
                  aria-pressed={selected}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left transition-shadow hover:shadow-soft",
                    selected ? "border-leaf-500 ring-2 ring-leaf-200" : "border-forest-100",
                  )}
                >
                  {l && <HealthRing value={l.health} size={44} />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-forest-900">{u.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {u.site} · {u.municipality}
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-1">
                    <Pill tone={offline ? "crit" : "leaf"}>
                      {offline ? <CloudOff className="size-3" aria-hidden="true" /> : <SatelliteDish className="size-3" aria-hidden="true" />}
                      {offline ? "Offline" : "Online"}
                    </Pill>
                    {open > 0 ? <Pill tone="warn">{open} alert{open > 1 ? "s" : ""}</Pill> : <Pill>No alerts</Pill>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Sensors */}
      <section aria-labelledby="sensors-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="sensors-heading" className="text-sm font-semibold text-forest-900">
            Live sensors
          </h2>
          <Link href="/dashboard/sensors" className="inline-flex items-center gap-1 text-xs font-semibold text-forest-600 hover:underline">
            Charts & history <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
        <div className="grid items-start gap-5 xl:grid-cols-3">
          {SENSOR_CATEGORIES.map((category) => (
            <div key={category.id} className="grid gap-3">
              <div className="border-l-2 border-forest-300 pl-3">
                <h3 className="text-sm font-semibold text-forest-900">{category.label} <span className="ml-1 text-xs font-normal text-muted">{category.sensors.length} sensors</span></h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">{category.description}</p>
              </div>
              {category.sensors.map((k) => <SensorTile key={k} sensor={k} live={live} threshold={thresholds[k]} href={`/dashboard/sensors#${k}`} />)}
            </div>
          ))}
        </div>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-3">
        <div className="grid content-start gap-6 xl:col-span-2">
          <Card
            title="System controls"
            description="Manual switches work only in manual mode — auto and schedule modes are driven by rules and the local clock."
            action={
              <Link href="/dashboard/controls" className="inline-flex items-center gap-1 text-xs font-semibold text-forest-600 hover:underline">
                All controls <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            }
            bodyClassName="py-1"
          >
            <ul className="divide-y divide-forest-100">
              {ACTUATOR_KINDS.map((k) => {
                const dto = actuators.find((a) => a.kind === k);
                return dto ? (
                  <ActuatorRow key={k} unitId={unit.id} kind={k} dto={dto} live={live} pending={!!snap.pending[`power:${unit.id}:${k}`]} />
                ) : null;
              })}
            </ul>
          </Card>

          <Card
            title="Needs attention"
            description="Alerts stay open until a person acknowledges them."
            action={
              <Link href="/dashboard/alerts" className="inline-flex items-center gap-1 text-xs font-semibold text-forest-600 hover:underline">
                All alerts <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            }
          >
            {alerts.length ? (
              <ul className="grid gap-3">
                {alerts.map((a) => (
                  <AlertItem key={a.id} alert={a} compact />
                ))}
              </ul>
            ) : (
              <EmptyState icon={BellOff} title="All clear">
                No alerts need acknowledgement for {unit.name}. Try a demo scenario to see the alarm flow.
              </EmptyState>
            )}
          </Card>
        </div>

        <div className="grid content-start gap-6">
          <ScenarioPanel unitId={unit.id} live={live} />
          <PowerCard live={live} />
          <LinkCard unitId={unit.id} live={live} />
        </div>
      </div>

      <Card
        title="Recent activity"
        action={
          <Link href="/dashboard/activity" className="inline-flex items-center gap-1 text-xs font-semibold text-forest-600 hover:underline">
            Full log <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        }
      >
        <ActivityList events={events} />
      </Card>
    </div>
  );
}
