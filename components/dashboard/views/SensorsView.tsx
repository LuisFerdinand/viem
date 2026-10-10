"use client";

import { useLanguage } from "../LanguageProvider";

import { Download } from "lucide-react";
import { useState } from "react";
import { SENSOR_KEYS, SENSORS, SENSOR_CATEGORIES, SENSOR_GUIDE, formatSensor, tdsFromEc } from "@/lib/domain";
import { TICK_MS } from "@/lib/sim/engine";
import { selectThresholds, selectUnit } from "@/lib/sim/store";
import { cn, fmtTimeSec } from "@/lib/utils";
import { useSnapshot } from "../DashboardProvider";
import { SENSOR_ICON } from "../icons";
import { SensorChart } from "../SensorChart";
import { Card, PageHeader, Pill, Segmented, StatusBadge } from "../ui";
import { Disclosure } from "../Disclosure";

const RANGES = [
  { value: "30", label: "30 min" },
  { value: "60", label: "1 hour" },
  { value: "120", label: "2 hours" },
] as const;

type Range = (typeof RANGES)[number]["value"];

export function SensorsView() {
  const { tr } = useLanguage();
  const snap = useSnapshot();
  const unit = selectUnit(snap);
  const live = snap.live[unit.id];
  const thresholds = selectThresholds(snap);
  const [range, setRange] = useState<Range>("60");
  const [category, setCategory] = useState("all");
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
        title={tr("Water & climate")}
        description={tr("See current conditions and how they change. Green is normal; orange needs checking; red needs urgent attention.")}
        actions={
          <>
            <Segmented label={tr("Time range")} value={range} options={[...RANGES]} onChange={setRange} />
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-forest-700 ring-1 ring-forest-200 hover:bg-white"
            >
              <Download className="size-4" aria-hidden="true" /> {tr("Export CSV")}</button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3" aria-label={tr("Sensor categories")}>
        {SENSOR_CATEGORIES.map((c) => <button key={c.id} type="button" aria-pressed={category === c.id} onClick={() => setCategory(category === c.id ? "all" : c.id)} className={cn("rounded-xl border p-4 text-left transition-colors", category === c.id ? "border-forest-600 bg-forest-800 text-white" : "border-forest-100 bg-white text-forest-900 hover:border-forest-300")}><span className="block text-sm font-semibold">{tr(c.label)} <span className="opacity-60">· {tr(c.sensors.length)}</span></span><span className="mt-1 block text-xs leading-relaxed opacity-75">{tr(c.description)}</span></button>)}
      </div>
      <p className="text-xs text-muted">{tr(category === "all" ? "Showing all 7 sensors. Select a category to focus your view." : "Select the active category again to show all sensors.")}</p>
      <div className="grid gap-5 xl:grid-cols-2">
        {SENSOR_KEYS.filter((k) => category === "all" || SENSOR_CATEGORIES.find((c) => c.id === category)?.sensors.some((s) => s === k)).map((k) => {
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
              className="scroll-mt-24"
              title={
                  <span className="flex flex-wrap items-center gap-2">
                  <Icon className="size-4" style={{ color: meta.color }} aria-hidden="true" /> {tr(meta.label)}
                  <Pill>{tr(SENSOR_CATEGORIES.find((c) => c.sensors.some((s) => s === k))?.label)}</Pill>
                </span>
              }
              description={tr(SENSOR_GUIDE[k].purpose)}
              action={
                <div className="flex items-center gap-2">
                  <span className="font-display text-2xl text-forest-950 tabular">
                    {tr(formatSensor(k, live.latest[k]))}
                    <span className="ml-1 font-sans text-xs text-muted">{tr(meta.unit)}</span>
                  </span>
                  <StatusBadge status={live.statuses[k]} />
                </div>
              }
            >
              <figure>
                <SensorChart sensor={k} data={data} threshold={t} />
                <figcaption className="sr-only">
                  {tr(meta.label)} {tr("over the last")}{" "}{tr(RANGES.find((r) => r.value === range)?.label)}{tr(": min")}{" "}{tr(min.toFixed(meta.decimals))}{tr(", average")}{" "}
                  {tr(avg.toFixed(meta.decimals))}{tr(", max")}{" "}{tr(max.toFixed(meta.decimals))} {tr(meta.unit)}.
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
                    <dt className="text-muted">{tr(label)}</dt>
                    <dd className="font-semibold text-forest-900 tabular">{tr(v)}</dd>
                  </div>
                ))}
              </dl>
              {k === "ec" && <p className="mt-2 text-xs text-muted">{tr("Current TDS ≈")}{" "}{tr(tdsFromEc(live.latest.ec))} {tr("ppm (500 scale).")}</p>}
              <details className="mt-4 border-t border-forest-100 pt-3 text-xs text-muted">
                <summary className="font-semibold text-forest-700">{tr("How to use this reading")}</summary>
                <p className="mt-2 leading-relaxed">{tr(meta.description)} {tr(SENSOR_GUIDE[k].action)}</p>
                <p className="mt-2 leading-relaxed"><strong>{tr("Sensor care:")}</strong> {tr(SENSOR_GUIDE[k].care)}</p>
              </details>
            </Card>
          );
        })}
        <div className="xl:col-span-2"><Disclosure title={tr("Detailed readings table")}><Card title={tr("Latest readings")} description={tr("The last ten readings as a table.")} bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-xs">
              <caption className="sr-only">{tr("Latest ten sensor readings for")}{" "}{unit.name}</caption>
              <thead className="bg-forest-50 text-forest-700">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    {tr("Time")}</th>
                  {SENSOR_KEYS.map((k) => (
                    <th key={k} scope="col" className="px-3 py-2 text-right font-semibold whitespace-nowrap">
                      {tr(SENSORS[k].short)}
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
                        {tr(fmtTimeSec(r.t))}
                        {r.offline && <span className="ml-1 text-warn-700">•</span>}
                      </th>
                      {SENSOR_KEYS.map((k) => (
                        <td key={k} className="px-3 py-2 text-right text-forest-900 tabular">
                          {tr(formatSensor(k, r[k]))}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-forest-100 px-4 py-2 text-[0.7rem] text-muted">{tr("• taken while the link was down and buffered on the controller")}</p>
        </Card></Disclosure></div>
      </div>
    </div>
  );
}
