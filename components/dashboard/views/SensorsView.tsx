"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { SENSOR_KEYS, SENSORS, formatSensor, tdsFromEc } from "@/lib/domain";
import { TICK_MS } from "@/lib/sim/engine";
import { selectThresholds, selectUnit } from "@/lib/sim/store";
import { cn, fmtTimeSec } from "@/lib/utils";
import { useSnapshot } from "../DashboardProvider";
import { SENSOR_ICON } from "../icons";
import { SensorChart } from "../SensorChart";
import { Card, PageHeader, Pill, Segmented, StatusBadge } from "../ui";

const RANGES = [
  { value: "30", label: "30 min" },
  { value: "60", label: "1 hour" },
  { value: "120", label: "2 hours" },
] as const;

type Range = (typeof RANGES)[number]["value"];

export function SensorsView() {
  const snap = useSnapshot();
  const unit = selectUnit(snap);
  const live = snap.live[unit.id];
  const thresholds = selectThresholds(snap);
  const [range, setRange] = useState<Range>("60");
  if (!live) return null;

  const points = (Number(range) * 60_000) / TICK_MS;
  const data = live.history.slice(-points);

  function exportCsv() {
    const header = ["time_utc", ...SENSOR_KEYS.map((k) => `${k}_${SENSORS[k].unit.replace(/[^a-z0-9]/gi, "")}`), "battery_pct", "solar_w", "pump_a", "offline"];
    const rows = live.history.map((r) =>
      [new Date(r.t).toISOString(), ...SENSOR_KEYS.map((k) => r[k].toFixed(SENSORS[k].decimals)), r.battery.toFixed(0), r.solarW.toFixed(0), r.pumpA.toFixed(2), r.offline ? 1 : 0].join(","),
    );
    const blob = new Blob([[header.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `viem-${unit.id}-readings.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Live sensors"
        description={`${unit.name} · one reading every 30 seconds while this dashboard is open. Green bands show the normal range; dashed red lines the critical limits.`}
        actions={
          <>
            <Segmented label="Time range" value={range} options={[...RANGES]} onChange={setRange} />
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-forest-700 ring-1 ring-forest-200 hover:bg-white"
            >
              <Download className="size-4" aria-hidden="true" /> Export CSV
            </button>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-2">
        {SENSOR_KEYS.map((k) => {
          const meta = SENSORS[k];
          const Icon = SENSOR_ICON[k];
          const vals = data.map((r) => r[k]);
          const min = Math.min(...vals);
          const max = Math.max(...vals);
          const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
          const t = thresholds[k];
          return (
            <Card
              key={k}
              id={k}
              className={cn("scroll-mt-24", SENSOR_KEYS.length % 2 === 1 && k === SENSOR_KEYS[SENSOR_KEYS.length - 1] && "xl:col-span-2")}
              title={
                <span className="flex items-center gap-2">
                  <Icon className="size-4" style={{ color: meta.color }} aria-hidden="true" /> {meta.label}
                  {meta.added && <Pill tone="water">From the proposal</Pill>}
                </span>
              }
              description={meta.description}
              action={
                <div className="flex items-center gap-2">
                  <span className="font-display text-2xl text-forest-950 tabular">
                    {formatSensor(k, live.latest[k])}
                    <span className="ml-1 font-sans text-xs text-muted">{meta.unit}</span>
                  </span>
                  <StatusBadge status={live.statuses[k]} />
                </div>
              }
            >
              <figure>
                <SensorChart sensor={k} data={data} threshold={t} />
                <figcaption className="sr-only">
                  {meta.label} over the last {RANGES.find((r) => r.value === range)?.label}: min {min.toFixed(meta.decimals)}, average{" "}
                  {avg.toFixed(meta.decimals)}, max {max.toFixed(meta.decimals)} {meta.unit}.
                </figcaption>
              </figure>
              <dl className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                {[
                  ["Min", min.toFixed(meta.decimals)],
                  ["Avg", avg.toFixed(meta.decimals)],
                  ["Max", max.toFixed(meta.decimals)],
                  ["Normal", t ? `${t.min}–${t.max}` : "—"],
                ].map(([label, v]) => (
                  <div key={label} className="rounded-lg bg-forest-50 px-2 py-1.5">
                    <dt className="text-muted">{label}</dt>
                    <dd className="font-semibold text-forest-900 tabular">{v}</dd>
                  </div>
                ))}
              </dl>
              {k === "ec" && <p className="mt-2 text-xs text-muted">Current TDS ≈ {tdsFromEc(live.latest.ec)} ppm (500 scale).</p>}
            </Card>
          );
        })}
        <Card title="Latest readings" description="The last ten readings as a table." bodyClassName="p-0" className="xl:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-xs">
              <caption className="sr-only">Latest ten sensor readings for {unit.name}</caption>
              <thead className="bg-forest-50 text-forest-700">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Time
                  </th>
                  {SENSOR_KEYS.map((k) => (
                    <th key={k} scope="col" className="px-3 py-2 text-right font-semibold whitespace-nowrap">
                      {SENSORS[k].short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {live.history
                  .slice(-10)
                  .reverse()
                  .map((r) => (
                    <tr key={r.t} className="border-t border-forest-100">
                      <th scope="row" className="px-3 py-2 font-medium whitespace-nowrap text-forest-800 tabular">
                        {fmtTimeSec(r.t)}
                        {r.offline && <span className="ml-1 text-warn-700">•</span>}
                      </th>
                      {SENSOR_KEYS.map((k) => (
                        <td key={k} className="px-3 py-2 text-right text-forest-900 tabular">
                          {formatSensor(k, r[k])}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-forest-100 px-4 py-2 text-[0.7rem] text-muted">• taken while the link was down and buffered on the controller</p>
        </Card>
      </div>
    </div>
  );
}
