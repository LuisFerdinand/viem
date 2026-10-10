"use client";

import { useLanguage } from "./LanguageProvider";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SENSORS, type SensorKey } from "@/lib/domain";
import type { Reading } from "@/lib/sim/engine";
import type { ThresholdDTO } from "@/lib/types";
import { fmtTime, fmtTimeSec } from "@/lib/utils";

function offlineRanges(data: Reading[]) {
  const ranges: [number, number][] = [];
  let start: number | null = null;
  for (const r of data) {
    if (r.offline && start == null) start = r.t;
    if (!r.offline && start != null) {
      ranges.push([start, r.t]);
      start = null;
    }
  }
  if (start != null && data.length) ranges.push([start, data[data.length - 1].t]);
  return ranges;
}

export function SensorChart({ sensor, data, threshold, height = 200 }: { sensor: SensorKey; data: Reading[]; threshold?: ThresholdDTO; height?: number }) {
  const { tr } = useLanguage();
  const meta = SENSORS[sensor];
  const values = data.map((d) => d[sensor]);
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (threshold) {
    lo = Math.min(lo, threshold.min);
    hi = Math.max(hi, threshold.max);
  }
  const pad = Math.max((hi - lo) * 0.15, Math.pow(10, -meta.decimals) * 5);
  const domain: [number, number] = [Math.max(0, +(lo - pad).toFixed(meta.decimals)), +(hi + pad).toFixed(meta.decimals)];
  const gradId = `grad-${sensor}`;

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={meta.color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={meta.color} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e3eee8" strokeDasharray="3 4" vertical={false} />
          {threshold && (
            <ReferenceArea y1={threshold.min} y2={threshold.max} fill="#22935d" fillOpacity={0.07} stroke="none" ifOverflow="hidden" />
          )}
          {offlineRanges(data).map(([x1, x2]) => (
            <ReferenceArea key={x1} x1={x1} x2={x2} fill="#4a6a61" fillOpacity={0.1} stroke="none" ifOverflow="hidden" />
          ))}
          {threshold && (
            <>
              <ReferenceLine y={threshold.criticalMin} stroke="#d8452f" strokeDasharray="4 4" strokeWidth={1.2} ifOverflow="hidden" />
              <ReferenceLine y={threshold.criticalMax} stroke="#d8452f" strokeDasharray="4 4" strokeWidth={1.2} ifOverflow="hidden" />
            </>
          )}
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(t: number) => fmtTime(t)}
            tick={{ fontSize: 11, fill: "#4a6a61" }}
            axisLine={{ stroke: "#c5dbd0" }}
            tickLine={false}
            minTickGap={40}
          />
          <YAxis
            domain={domain}
            tick={{ fontSize: 11, fill: "#4a6a61" }}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(v: number) => v.toFixed(meta.decimals > 1 ? 1 : 0)}
          />
          <Tooltip
            cursor={{ stroke: "#9dbfb0", strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const r = payload[0].payload as Reading;
              return (
                <div className="rounded-xl border border-forest-100 bg-white px-3 py-2 text-xs shadow-soft">
                  <p className="text-muted">
                    {tr(fmtTimeSec(r.t))}
                    {tr(r.offline && " · buffered offline")}
                  </p>
                  <p className="mt-0.5 font-semibold text-forest-900 tabular">
                    {tr(r[sensor].toFixed(meta.decimals))} {tr(meta.unit)}
                  </p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey={sensor}
            stroke={meta.color}
            strokeWidth={2}
            fill={`url(#${gradId})`}
            isAnimationActive={false}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
