"use client";

import { ArrowDownRight, ArrowRight, ArrowUpRight, Coins, HandCoins, PiggyBank, Receipt } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { financeSummary, percentChange } from "@/lib/finance";
import { selectHub, setsOf } from "@/lib/sim/store";
import { cn, todayInDili } from "@/lib/utils";
import { useSnapshot } from "./DashboardProvider";
import { useDashboardFormatters, useLanguage } from "./LanguageProvider";
import { Card } from "./ui";

const COLOR = { income: "#22935d", expenses: "#d99315", profit: "#1f6f94", kg: "#4d7a1f" };
const AXIS = { fontSize: 11, fill: "#4a6a61" };
const TOOLTIP = { borderRadius: 12, border: "1px solid #e3eee8", fontSize: 12 };

function Kpi({ icon: Icon, label, value, caption, change, goodWhenUp = true, tone }: {
  icon: typeof Coins; label: string; value: string; caption: string; change?: number | null; goodWhenUp?: boolean; tone?: string;
}) {
  const { tr } = useLanguage();
  const good = change == null || change === 0 ? null : (change > 0) === goodWhenUp;
  return (
    <div className="rounded-2xl border border-forest-100 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-medium text-muted"><Icon className="size-4 text-forest-500" aria-hidden="true" /> {tr(label)}</p>
        {change != null && change !== 0 && (
          <span className={cn("inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold", good ? "bg-ok-50 text-ok-700" : "bg-crit-50 text-crit-700")} title={tr("{0}% vs the 30 days before", [Math.abs(change)])}>
            {change > 0 ? <ArrowUpRight className="size-3" aria-hidden="true" /> : <ArrowDownRight className="size-3" aria-hidden="true" />}
            {Math.abs(change)}%
            <span className="sr-only"> {tr("{0}% vs the 30 days before", [Math.abs(change)])}</span>
          </span>
        )}
      </div>
      <p className={cn("mt-2 font-display text-3xl text-forest-950 tabular", tone)}>{value}</p>
      <p className="mt-1 text-xs text-muted">{tr(caption)}</p>
    </div>
  );
}

/** Money and harvest picture for every set in the selected hub. */
export function BusinessSummary() {
  const { tr } = useLanguage();
  const { usd, kg, fmtDate } = useDashboardFormatters();
  const snap = useSnapshot();
  const hub = selectHub(snap);
  const sets = setsOf(snap);
  const today = todayInDili();
  const f = useMemo(() => financeSummary(snap.data, sets.map((u) => u.id), today), [snap.data, sets, today]);
  const setName = (id: string) => sets.find((u) => u.id === id)?.name ?? id;
  const bySet = f.bySet.map((r) => ({ name: setName(r.unitId), income: +r.income.toFixed(2), expenses: +r.expenses.toFixed(2) }));
  const maxSpend = f.spending[0]?.amount ?? 1;
  const money = (n: number) => usd(n, n % 1 === 0 ? 0 : 2);

  return (
    <section aria-labelledby="business-heading" className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="business-heading" className="text-lg font-semibold text-forest-900">{tr("Farm business")}</h2>
          <p className="mt-0.5 text-xs text-muted">{tr("Last 30 days, all sets in {0}.", [hub.name])}</p>
        </div>
        <div className="flex flex-wrap gap-4 text-xs font-semibold text-forest-600">
          <Link href="/dashboard/harvest" className="inline-flex items-center gap-1 hover:underline">{tr("Harvest & sales")} <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
          <Link href="/dashboard/ledger" className="inline-flex items-center gap-1 hover:underline">{tr("Buku Besar")} <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={PiggyBank} label="Profit" value={money(f.profit)} caption="Income minus expenses" change={percentChange(f.profit, f.before.profit)} tone={f.profit < 0 ? "text-crit-700" : undefined} />
        <Kpi icon={Coins} label="Income" value={money(f.income)} caption="Harvest payments and other income" change={percentChange(f.income, f.before.income)} />
        <Kpi icon={Receipt} label="Expenses" value={money(f.expense)} caption="Feed, nutrients, power and more" change={percentChange(f.expense, f.before.expense)} goodWhenUp={false} />
        <Kpi icon={HandCoins} label="Still to receive" value={money(f.outstanding)} caption="Harvests not paid yet" />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2" title={tr("Income, expenses and profit")} description={tr("Week by week, last 8 weeks.")}>
          <figure>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={f.weekly} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="#e3eee8" strokeDasharray="3 4" vertical={false} />
                  <XAxis dataKey="week" tickFormatter={(w: string) => fmtDate(`${w}T00:00:00Z`)} tick={AXIS} tickLine={false} axisLine={{ stroke: "#c5dbd0" }} />
                  <YAxis tick={AXIS} tickLine={false} axisLine={false} width={68} tickFormatter={(v: number) => usd(v)} />
                  <Tooltip contentStyle={TOOLTIP} labelFormatter={(w) => fmtDate(`${w}T00:00:00Z`)} formatter={(v) => usd(Number(v), 2)} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="income" name={tr("Income")} fill={COLOR.income} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="expenses" name={tr("Expenses")} fill={COLOR.expenses} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  <Line dataKey="profit" name={tr("Profit")} type="monotone" stroke={COLOR.profit} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <figcaption className="sr-only">{tr("Weekly income, expenses and profit for {0}.", [hub.name])}</figcaption>
          </figure>
        </Card>

        <Card title={tr("Where the money goes")} description={tr("Expenses by type, last 30 days.")}>
          {f.spending.length ? (
            <ul className="grid gap-3">
              {f.spending.map((s) => (
                <li key={s.category}>
                  <div className="flex items-baseline justify-between gap-2 text-sm"><span className="text-forest-800">{tr(s.category)}</span><span className="font-semibold text-forest-900 tabular">{money(s.amount)}</span></div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-forest-50" aria-hidden="true"><div className="h-full rounded-full" style={{ width: `${(s.amount / maxSpend) * 100}%`, backgroundColor: COLOR.expenses }} /></div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">{tr("No expenses recorded yet.")}</p>}
        </Card>

        <Card className="xl:col-span-2" title={tr("Money by set")} description={tr("Income and expenses of each set, last 30 days.")}>
          <figure>
            <div style={{ height: Math.max(180, bySet.length * 56 + 48) }} className="w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bySet} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="#e3eee8" strokeDasharray="3 4" horizontal={false} />
                  <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v: number) => usd(v)} />
                  <YAxis type="category" dataKey="name" tick={AXIS} tickLine={false} axisLine={false} width={64} />
                  <Tooltip contentStyle={TOOLTIP} formatter={(v) => usd(Number(v), 2)} cursor={{ fill: "#f1f7f4" }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="income" name={tr("Income")} fill={COLOR.income} radius={[0, 4, 4, 0]} isAnimationActive={false} />
                  <Bar dataKey="expenses" name={tr("Expenses")} fill={COLOR.expenses} radius={[0, 4, 4, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <figcaption className="sr-only">{tr("Income and expenses for each set in {0}.", [hub.name])}</figcaption>
          </figure>
        </Card>

        <Card title={tr("Harvest by crop")} description={tr("Weight harvested, last 30 days.")}>
          {f.crops.length ? (
            <ul className="grid gap-3">
              {f.crops.map((c) => (
                <li key={c.crop}>
                  <div className="flex items-baseline justify-between gap-2 text-sm"><span className="text-forest-800">{tr(c.label)}</span><span className="font-semibold text-forest-900 tabular">{kg(c.kg)}</span></div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-forest-50" aria-hidden="true"><div className="h-full rounded-full" style={{ width: `${(c.kg / f.crops[0].kg) * 100}%`, backgroundColor: COLOR.kg }} /></div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">{tr("No harvests recorded in the last 30 days.")}</p>}
        </Card>
      </div>
    </section>
  );
}
