import { CROP_BY_ID } from "./domain";
import type { DashboardData, LedgerDTO } from "./types";

export interface LedgerRow extends Omit<LedgerDTO, "id"> {
  key: string;
  manualId?: number;
  harvestId?: number;
  balanceCents: number;
}

/** Paid buy-backs are derived, never copied into manual entries. */
export function ledgerRows(data: DashboardData, unitId: string): LedgerRow[] {
  const manual = data.ledger.filter((r) => r.unitId === unitId).map((r) => ({ ...r, key: `entry:${r.id}`, manualId: r.id }));
  const harvest = data.harvests.filter((h) => h.unitId === unitId && h.status === "paid").map((h) => ({
    key: `harvest:${h.id}`, harvestId: h.id, unitId: h.unitId, type: "income" as const, category: "Harvest buy-back",
    amountCents: Math.round(h.weightKg * h.pricePerKg * 100), date: h.paidAt ?? h.harvestedAt,
    description: `${h.weightKg} kg ${CROP_BY_ID[h.crop]?.label ?? h.crop}`, counterparty: h.buyer, reference: `Harvest #${h.id}`,
  }));
  let balanceCents = 0;
  return [...manual, ...harvest].sort((a, b) => a.date.localeCompare(b.date) || a.key.localeCompare(b.key)).map((r) => {
    balanceCents += r.type === "income" ? r.amountCents : -r.amountCents;
    return { ...r, balanceCents };
  });
}

export function csvCell(value: string | number) {
  let text = String(value);
  if (typeof value === "string" && /^[\s]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
