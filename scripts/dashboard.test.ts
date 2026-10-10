import assert from "node:assert/strict";
import { test } from "node:test";
import { calendarDate, ledgerSchema, presetSchema } from "../lib/dashboard-validation";
import { PRESETS, SENSOR_CATEGORIES, SENSOR_KEYS } from "../lib/domain";
import { csvCell, ledgerRows } from "../lib/ledger";
import { buildFallbackData } from "../lib/seed-data";
import { DashboardStore } from "../lib/sim/store";

test("sensor categories cover each monitored sensor once", () => {
  const keys = SENSOR_CATEGORIES.flatMap((c) => [...c.sensors]);
  assert.deepEqual([...keys].sort(), [...SENSOR_KEYS].sort());
  assert.equal(new Set(keys).size, SENSOR_KEYS.length);
});

test("all built-in profiles validate; unordered alarm limits and reversed hysteresis fail", () => {
  for (const p of PRESETS) assert.equal(presetSchema.safeParse(p).success, true, p.label);
  const p = structuredClone(PRESETS[0]);
  p.values.ph.min = p.values.ph.max;
  assert.equal(presetSchema.safeParse(p).success, false);
  p.values.ph = PRESETS[0].values.ph;
  p.rules[0].offValue = p.rules[0].onValue - 1;
  assert.equal(presetSchema.safeParse(p).success, false);
});

test("ledger validation rejects invalid dates, fractions of a cent, and negative amounts", () => {
  assert.equal(calendarDate.safeParse("2026-02-30").success, false);
  assert.equal(calendarDate.safeParse("2028-02-29").success, true);
  const row = { unitId: "hub-dili", type: "expense", category: "Fish feed", amountCents: 1234, date: "2026-10-11", description: "Feed", counterparty: "", reference: "" };
  assert.equal(ledgerSchema.safeParse(row).success, true);
  for (const amountCents of [-1, 0, 0.2, Infinity]) assert.equal(ledgerSchema.safeParse({ ...row, amountCents }).success, false);
});

test("buy-back income uses payment dates, is counted once, and excludes unpaid harvests", () => {
  const d = buildFallbackData("test");
  const h = { ...d.harvests[0], unitId: "hub-dili", id: 10, weightKg: 3.3, pricePerKg: 2.5, status: "paid" as const, harvestedAt: "2026-10-01", paidAt: "2026-10-11" };
  d.harvests = [h, { ...h, id: 11, status: "collected", paidAt: null }];
  d.ledger = [{ id: 1, unitId: h.unitId, type: "expense", amountCents: 225, date: "2026-10-10", description: "Feed", category: "Fish feed", counterparty: "", reference: "" }];
  let rows = ledgerRows(d, h.unitId);
  assert.equal(rows.length, 2);
  assert.equal(rows[1].amountCents, 825);
  assert.equal(rows[1].date, "2026-10-11");
  assert.equal(rows[1].balanceCents, 600);
  assert.equal(ledgerRows(d, "suku-aileu").length, 0);
  d.harvests[0].status = "collected";
  rows = ledgerRows(d, h.unitId);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].balanceCents, -225);
});

test("CSV quotes notes and neutralizes formula-like user text", () => {
  assert.equal(csvCell('Feed, "premium"'), '"Feed, ""premium"""');
  assert.equal(csvCell("=SUM(A1:A2)"), '"\'=SUM(A1:A2)"');
  assert.equal(csvCell(" +cmd"), '"\' +cmd"');
});

test("offline store edits and deletes ledger entries and applies preset rules without duplicates", async () => {
  const d = buildFallbackData("test");
  d.harvests = [];
  const store = new DashboardStore(d);
  const unitId = d.units[0].id;
  assert.equal(await store.saveLedger({ unitId, type: "expense", category: "Fish feed", amountCents: 500, date: "2026-10-11", description: "Feed", counterparty: "", reference: "" }), null);
  const row = store.getSnapshot().data.ledger[0];
  await store.saveLedger({ ...row, amountCents: 750 });
  assert.equal(store.getSnapshot().data.ledger.length, 1);
  assert.equal(store.getSnapshot().data.ledger[0].amountCents, 750);
  await store.applyPreset(unitId, PRESETS[1].id, true);
  await store.applyPreset(unitId, PRESETS[1].id, true);
  assert.equal(store.getSnapshot().data.rules.filter((r) => r.unitId === unitId).length, PRESETS[1].rules.length);
  assert.equal(store.getSnapshot().data.thresholds.find((t) => t.unitId === unitId && t.sensor === "ph")?.min, PRESETS[1].values.ph.min);
  await store.addHarvest({ unitId, crop: "lettuce", weightKg: 1.5, buyer: "Local market", harvestedAt: "2026-10-10" });
  const h = store.getSnapshot().data.harvests[0];
  await store.setHarvestStatus(h.id, "paid");
  const paidAt = store.getSnapshot().data.harvests[0].paidAt;
  await store.setHarvestStatus(h.id, "paid");
  assert.equal(store.getSnapshot().data.harvests[0].paidAt, paidAt);
  assert.equal(ledgerRows(store.getSnapshot().data, unitId).filter((r) => r.harvestId !== undefined).length, 1);
  await store.deleteHarvest(h.id);
  assert.equal(ledgerRows(store.getSnapshot().data, unitId).length, 1);
  await store.deleteLedger(row);
  assert.equal(store.getSnapshot().data.ledger.length, 0);
});
