"use client";

import { Fish, Leaf, Plus, Sprout, Trash2, Truck, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BUYERS, CROP_BY_ID, CROPS, HARVEST_STATUSES, type CropCategory, type HarvestStatus } from "@/lib/domain";
import { selectUnit } from "@/lib/sim/store";
import type { HarvestDTO } from "@/lib/types";
import { cn, fmtDate, kg, todayInDili, usd } from "@/lib/utils";
import { useSnapshot, useStore } from "../DashboardProvider";
import { Card, EmptyState, Field, Input, PageHeader, Pill, Segmented, Select } from "../ui";

const CATEGORY_COLOR: Record<CropCategory, string> = { greens: "#5f8625", herbs: "#1d8a7e", fish: "#2c7da0" };
const CATEGORY_LABEL: Record<CropCategory, string> = { greens: "Greens", herbs: "Herbs", fish: "Fish" };
const CATEGORY_ICON: Record<CropCategory, LucideIcon> = { greens: Sprout, herbs: Leaf, fish: Fish };
const STATUS_LABEL: Record<HarvestStatus, string> = { logged: "Logged", collected: "Collected", paid: "Paid" };
const MONTHLY_TARGET: [number, number] = [350, 500];
const MONTHLY_COSTS = 110 + 25; // mid-point costs + VIEM support fee (proposal, table 2)

const DAY = 86_400_000;

function weekStart(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // Monday = 0
  return new Date(d.getTime() - dow * DAY).toISOString().slice(0, 10);
}

function HarvestForm({ unitId }: { unitId: string }) {
  const store = useStore();
  const snap = useSnapshot();
  const [crop, setCrop] = useState(CROPS[0].id);
  const [weight, setWeight] = useState("");
  const [buyer, setBuyer] = useState<string>(BUYERS[0]);
  const [date, setDate] = useState(todayInDili());
  const [weightError, setWeightError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const price = CROP_BY_ID[crop]?.floorPrice ?? 0;
  const w = Number(weight);

  return (
    <form
      className="grid gap-3"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const wErr =
          !weight.trim() || !Number.isFinite(w) || w <= 0
            ? "Enter the harvested weight in kg (above 0)."
            : w > 1000
              ? "That is more than one unit can harvest at once — check the weight."
              : null;
        setWeightError(wErr);
        if (wErr) return;
        if (!date) return setFormError("Pick the harvest date.");
        setFormError(null);
        const err = await store.addHarvest({ unitId, crop, weightKg: w, buyer, harvestedAt: date });
        if (err) setFormError(err);
        else setWeight("");
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Crop">
          {(p) => (
            <Select {...p} value={crop} onChange={(e) => setCrop(e.target.value)}>
              {CROPS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Weight (kg)" error={weightError}>
          {(p) => (
            <Input {...p} type="number" inputMode="decimal" step="0.1" min={0.1} max={1000} value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 12.5" />
          )}
        </Field>
        <Field label="Buyer">
          {(p) => (
            <Select {...p} value={buyer} onChange={(e) => setBuyer(e.target.value)}>
              {BUYERS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Harvest date">
          {(p) => <Input {...p} type="date" max={todayInDili()} value={date} onChange={(e) => setDate(e.target.value)} />}
        </Field>
      </div>
      {formError && (
        <p role="alert" className="text-xs font-medium text-crit-700">
          {formError}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-leaf-50 px-3 py-2 text-sm">
        <span className="text-leaf-700">
          Buy-back floor price <strong>{usd(price, 2)}/kg</strong>
        </span>
        <span className="font-semibold text-forest-900 tabular">{Number.isFinite(w) && w > 0 ? usd(w * price, 2) : "—"}</span>
      </div>
      <button
        type="submit"
        disabled={!!snap.pending["harvest:new"]}
        className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-forest-800 px-4 text-sm font-semibold text-white hover:bg-forest-700 disabled:opacity-50"
      >
        <Plus className="size-4" aria-hidden="true" /> {snap.pending["harvest:new"] ? "Saving…" : "Log harvest"}
      </button>
    </form>
  );
}

export function HarvestView() {
  const snap = useSnapshot();
  const store = useStore();
  const unit = selectUnit(snap);
  const [scope, setScope] = useState<"unit" | "all">("unit");
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const rows = useMemo(
    () => snap.data.harvests.filter((h) => scope === "all" || h.unitId === unit.id),
    [snap.data.harvests, scope, unit.id],
  );

  const today = todayInDili();
  const todayMs = new Date(`${today}T00:00:00Z`).getTime();
  const last30 = rows.filter((h) => todayMs - new Date(`${h.harvestedAt}T00:00:00Z`).getTime() < 30 * DAY);
  const sales30 = last30.reduce((s, h) => s + h.weightKg * h.pricePerKg, 0);
  const kg30 = last30.reduce((s, h) => s + h.weightKg, 0);
  const unitsInScope = scope === "all" ? snap.data.units.filter((u) => u.kind === "suku").length || 1 : 1;
  const targetLo = MONTHLY_TARGET[0] * unitsInScope;
  const targetHi = MONTHLY_TARGET[1] * unitsInScope;
  const net = sales30 - MONTHLY_COSTS * unitsInScope;
  const awaiting = rows.filter((h) => h.status === "logged");
  const awaitingKg = awaiting.reduce((s, h) => s + h.weightKg, 0);

  const weekly = useMemo(() => {
    const thisWeek = weekStart(today);
    const weeks: string[] = [];
    for (let i = 7; i >= 0; i--) weeks.push(new Date(new Date(`${thisWeek}T00:00:00Z`).getTime() - i * 7 * DAY).toISOString().slice(0, 10));
    const byWeek = new Map(weeks.map((w) => [w, { week: w, greens: 0, herbs: 0, fish: 0, forecast: 0 }]));
    for (const h of rows) {
      const b = byWeek.get(weekStart(h.harvestedAt));
      if (b) b[h.category] += h.weightKg;
    }
    const complete = weeks.slice(-5, -1).map((w) => byWeek.get(w)!);
    const avg = complete.reduce((s, w) => s + w.greens + w.herbs + w.fish, 0) / Math.max(1, complete.length);
    const out = [...byWeek.values()].map((w) => ({ ...w, greens: +w.greens.toFixed(1), herbs: +w.herbs.toFixed(1), fish: +w.fish.toFixed(1) }));
    for (let i = 1; i <= 2; i++) {
      const w = new Date(new Date(`${thisWeek}T00:00:00Z`).getTime() + i * 7 * DAY).toISOString().slice(0, 10);
      out.push({ week: w, greens: 0, herbs: 0, fish: 0, forecast: +avg.toFixed(1) });
    }
    return out;
  }, [rows, today]);

  const nextStatus = (s: HarvestStatus): HarvestStatus | null => {
    const i = HARVEST_STATUSES.indexOf(s);
    return i < HARVEST_STATUSES.length - 1 ? HARVEST_STATUSES[i + 1] : null;
  };
  const unitName = (h: HarvestDTO) => snap.data.units.find((u) => u.id === h.unitId)?.name ?? h.unitId;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Harvest & buy-back"
        description="VIEM buys every unit's harvest at a pre-agreed floor price, then sells to schools, hotels, supermarkets and restaurants."
        actions={<Segmented label="Scope" value={scope} onChange={setScope} options={[{ value: "unit", label: unit.name }, { value: "all", label: "Whole network" }]} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-forest-100 bg-white p-4">
          <p className="text-xs text-muted">Buy-back value, last 30 days</p>
          <p className="mt-1 font-display text-3xl text-forest-900 tabular">{usd(sales30)}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-forest-100" aria-hidden="true">
            <div className="h-full rounded-full bg-leaf-500" style={{ width: `${Math.min(100, (sales30 / targetHi) * 100)}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-muted">
            {scope === "unit" && unit.kind === "hub"
              ? "Hub production · Suku Unit target is US$350–500 / month"
              : `Target ${usd(targetLo)}–${usd(targetHi)} / month${scope === "all" ? " across Suku Units" : ""}`}
          </p>
        </div>
        <div className="rounded-2xl border border-forest-100 bg-white p-4">
          <p className="text-xs text-muted">Harvested, last 30 days</p>
          <p className="mt-1 font-display text-3xl text-forest-900 tabular">{kg(kg30)}</p>
          <p className="mt-1.5 text-xs text-muted">{last30.length} harvest records</p>
        </div>
        <div className="rounded-2xl border border-forest-100 bg-white p-4">
          <p className="text-xs text-muted">Est. net to cooperative</p>
          <p className={cn("mt-1 font-display text-3xl tabular", net >= 0 ? "text-forest-900" : "text-crit-700")}>{usd(net)}</p>
          <p className="mt-1.5 text-xs text-muted">After ≈ US$110 inputs + US$25 VIEM support fee per unit</p>
        </div>
        <div className="rounded-2xl bg-forest-900 p-4 text-white">
          <p className="flex items-center gap-1.5 text-xs text-forest-200">
            <Truck className="size-3.5" aria-hidden="true" /> Next collection run
          </p>
          <p className="mt-1 font-display text-3xl tabular">{kg(awaitingKg)}</p>
          <p className="mt-1.5 text-xs text-forest-200">
            {awaiting.length} logged harvest{awaiting.length === 1 ? "" : "s"} waiting for pick-up
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Weekly harvest & forecast" description="Kilograms per week by category. Hatched bars forecast the next two weeks from the recent average.">
          <figure>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekly} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                  <defs>
                    <pattern id="forecast-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                      <rect width="6" height="6" fill="#e3eee8" />
                      <line x1="0" y1="0" x2="0" y2="6" stroke="#6f9a8b" strokeWidth="2" />
                    </pattern>
                  </defs>
                  <CartesianGrid stroke="#e3eee8" strokeDasharray="3 4" vertical={false} />
                  <XAxis dataKey="week" tickFormatter={(w: string) => fmtDate(`${w}T00:00:00Z`)} tick={{ fontSize: 11, fill: "#4a6a61" }} tickLine={false} axisLine={{ stroke: "#c5dbd0" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#4a6a61" }} tickLine={false} axisLine={false} unit=" kg" width={56} />
                  <Tooltip
                    cursor={{ fill: "#f2f7f4" }}
                    formatter={(v, name) => [`${Number(v).toFixed(1)} kg`, name]}
                    labelFormatter={(w) => `Week of ${fmtDate(`${String(w)}T00:00:00Z`)}`}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e3eee8", fontSize: 12 }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="greens" name="Greens" stackId="a" fill={CATEGORY_COLOR.greens} isAnimationActive={false} />
                  <Bar dataKey="herbs" name="Herbs" stackId="a" fill={CATEGORY_COLOR.herbs} isAnimationActive={false} />
                  <Bar dataKey="fish" name="Fish" stackId="a" fill={CATEGORY_COLOR.fish} isAnimationActive={false} />
                  <Bar dataKey="forecast" name="Forecast" stackId="a" fill="url(#forecast-hatch)" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <figcaption className="sr-only">
              Weekly harvest in kilograms for the last eight weeks, stacked by greens, herbs and fish, followed by a two-week forecast.
            </figcaption>
          </figure>
        </Card>

        <Card title="Log a harvest" description={`${unit.name} · recorded at the buy-back floor price`}>
          <HarvestForm unitId={unit.id} />
        </Card>
      </div>

      <Card title="Harvest records" description="Move each record along as VIEM collects and pays — transparent sales records for the cooperative." bodyClassName="p-0">
        {rows.length ? (
          <ul className="divide-y divide-forest-100">
            {rows.slice(0, 40).map((h) => {
              const crop = CROP_BY_ID[h.crop];
              const next = nextStatus(h.status);
              const CatIcon = CATEGORY_ICON[h.category];
              return (
                <li key={h.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${CATEGORY_COLOR[h.category]}18`, color: CATEGORY_COLOR[h.category] }}>
                    <CatIcon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-[10rem] flex-1">
                    <p className="text-sm font-semibold text-forest-900">
                      {kg(h.weightKg)} {crop?.label.toLowerCase() ?? h.crop}
                      <span className="ml-2 font-normal text-muted">{CATEGORY_LABEL[h.category]}</span>
                    </p>
                    <p className="text-xs text-muted">
                      {fmtDate(`${h.harvestedAt}T00:00:00Z`)} · {h.buyer}
                      {scope === "all" ? ` · ${unitName(h)}` : ""}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-forest-900 tabular">{usd(h.weightKg * h.pricePerKg, 2)}</span>
                  <Pill tone={h.status === "paid" ? "leaf" : h.status === "collected" ? "water" : "warn"}>{STATUS_LABEL[h.status]}</Pill>
                  <span className="flex items-center gap-1">
                    {next && (
                      <button
                        type="button"
                        onClick={() => void store.setHarvestStatus(h.id, next)}
                        className="h-9 rounded-full px-3 text-xs font-semibold text-forest-700 ring-1 ring-forest-200 hover:bg-forest-50"
                      >
                        Mark {STATUS_LABEL[next].toLowerCase()}
                      </button>
                    )}
                    {confirmId === h.id ? (
                      <>
                        <button type="button" onClick={() => void store.deleteHarvest(h.id)} className="h-9 rounded-full bg-crit-700 px-3 text-xs font-semibold text-white hover:bg-crit-500">
                          Delete
                        </button>
                        <button type="button" onClick={() => setConfirmId(null)} className="h-9 rounded-full px-3 text-xs font-medium text-forest-700 hover:bg-forest-50">
                          Keep
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(h.id)}
                        aria-label={`Delete harvest record from ${fmtDate(`${h.harvestedAt}T00:00:00Z`)}`}
                        className="inline-flex size-9 items-center justify-center rounded-full text-forest-500 hover:bg-crit-50 hover:text-crit-700"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-5">
            <EmptyState icon={Sprout} title="No harvests yet">
              Log the first harvest with the form above.
            </EmptyState>
          </div>
        )}
      </Card>
    </div>
  );
}
