import { CROP_BY_ID } from "./domain";
import { ledgerRows } from "./ledger";
import type { DashboardData } from "./types";

const DAY = 86_400_000;
const ms = (date: string) => Date.parse(`${date}T00:00:00Z`);

export function weekStart(date: string) {
  const dow = (new Date(ms(date)).getUTCDay() + 6) % 7; // Monday = 0
  return new Date(ms(date) - dow * DAY).toISOString().slice(0, 10);
}

/**
 * Money and harvest figures for a group of sets (normally one hub). Income is
 * what was actually received (paid buy-backs and other income), never what is
 * merely owed.
 */
export function financeSummary(data: DashboardData, unitIds: string[], today: string) {
  const ids = new Set(unitIds);
  const rows = unitIds.flatMap((id) => ledgerRows(data, id));
  const end = ms(today) + DAY; // exclusive
  const inWindow = (date: string, fromDaysAgo: number, toDaysAgo: number) => ms(date) >= end - toDaysAgo * DAY && ms(date) < end - fromDaysAgo * DAY;
  const total = (type: "income" | "expense", from: number, to: number, unitId?: string) =>
    rows.filter((r) => r.type === type && (!unitId || r.unitId === unitId) && inWindow(r.date, from, to)).reduce((n, r) => n + r.amountCents, 0) / 100;

  const income = total("income", 0, 30), expense = total("expense", 0, 30);
  const before = { income: total("income", 30, 60), expense: total("expense", 30, 60) };

  const thisWeek = weekStart(today);
  const weekly = Array.from({ length: 8 }, (_, i) => {
    const start = ms(thisWeek) - (7 - i) * 7 * DAY;
    const inWeek = (r: { date: string }) => ms(r.date) >= start && ms(r.date) < start + 7 * DAY;
    const sum = (type: "income" | "expense") => rows.filter((r) => r.type === type && inWeek(r)).reduce((n, r) => n + r.amountCents, 0) / 100;
    const inc = sum("income"), exp = sum("expense");
    return { week: new Date(start).toISOString().slice(0, 10), income: +inc.toFixed(2), expenses: +exp.toFixed(2), profit: +(inc - exp).toFixed(2) };
  });

  const spending = new Map<string, number>();
  for (const r of rows) if (r.type === "expense" && inWindow(r.date, 0, 30)) spending.set(r.category, (spending.get(r.category) ?? 0) + r.amountCents / 100);

  const harvests = data.harvests.filter((h) => ids.has(h.unitId));
  const crops = new Map<string, number>();
  for (const h of harvests) if (inWindow(h.harvestedAt, 0, 30)) crops.set(h.crop, (crops.get(h.crop) ?? 0) + h.weightKg);
  const unpaid = harvests.filter((h) => h.status !== "paid");

  return {
    income, expense, profit: income - expense,
    before: { ...before, profit: before.income - before.expense },
    weekly,
    bySet: unitIds.map((unitId) => ({ unitId, income: total("income", 0, 30, unitId), expenses: total("expense", 0, 30, unitId) })),
    spending: [...spending].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount),
    crops: [...crops].map(([crop, kg]) => ({ crop, label: CROP_BY_ID[crop]?.label ?? crop, kg: +kg.toFixed(1) })).sort((a, b) => b.kg - a.kg),
    outstanding: unpaid.reduce((n, h) => n + h.weightKg * h.pricePerKg, 0),
    outstandingKg: unpaid.reduce((n, h) => n + h.weightKg, 0),
  };
}

/** Whole-number change versus a previous figure, or null when there is nothing to compare. */
export function percentChange(now: number, before: number) {
  return before > 0 ? Math.round(((now - before) / before) * 100) : null;
}
