import assert from "node:assert/strict";
import { test } from "node:test";
import { calendarDate, ledgerSchema, presetSchema } from "../lib/dashboard-validation";
import { PRESETS, SENSOR_CATEGORIES, SENSOR_KEYS } from "../lib/domain";
import { csvCell, ledgerRows } from "../lib/ledger";
import { financeSummary } from "../lib/finance";
import { buildFallbackData } from "../lib/seed-data";
import { profileFor } from "../lib/sim/engine";
import { DashboardStore, selectHub, selectUnit, setsOf, unitLabel } from "../lib/sim/store";

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
  d.ledger = [];
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

test("the VIEM Hub has five sets on different growing profiles, and every set belongs to a hub", () => {
  const d = buildFallbackData("test");
  const sets = d.units.filter((u) => u.hubId === "hub-dili");
  assert.equal(sets.length, 5);
  assert.equal(new Set(sets.map((u) => u.presetId)).size, 5);
  for (const u of d.units) assert.ok(d.hubs.some((h) => h.id === u.hubId), u.id);
  for (const u of d.units) assert.equal(d.thresholds.filter((t) => t.unitId === u.id).length, SENSOR_KEYS.length, u.id);
});

test("selecting a hub shows only its sets and remembers the set last used there", () => {
  const store = new DashboardStore(buildFallbackData("test"));
  store.selectUnit("hub-dili-set3");
  assert.equal(selectHub(store.getSnapshot()).id, "hub-dili");
  assert.equal(setsOf(store.getSnapshot()).length, 5);
  store.selectHub("suku-aileu");
  assert.equal(selectUnit(store.getSnapshot()).id, "suku-aileu");
  assert.equal(setsOf(store.getSnapshot()).length, 1);
  assert.equal(unitLabel(store.getSnapshot(), "hub-dili-set3"), "VIEM Hub · Set 3");
});

test("offline store adds a hub and extra sets, then removes them without orphaned records", async () => {
  const store = new DashboardStore(buildFallbackData("test"));
  assert.match((await store.createHub({ name: " ", municipality: "Dili", location: "x", site: "" }, { name: "Set 1", presetId: PRESETS[0].id, fishCount: 10, tankLiters: 500 })) ?? "", /name/i);
  assert.equal(await store.createHub({ name: "Suku Unit 03", municipality: "Baucau", location: "School garden", site: "" }, { name: "Set 1", presetId: PRESETS[1].id, fishCount: 0, tankLiters: 1500 }), null);
  let snap = store.getSnapshot();
  const hub = selectHub(snap);
  assert.equal(hub.name, "Suku Unit 03");
  assert.equal(setsOf(snap).length, 1);
  assert.equal(await store.createSet(hub.id, { name: "Set 2", presetId: PRESETS[2].id, fishCount: 500, tankLiters: 800 }), null);
  snap = store.getSnapshot();
  const [first, second] = setsOf(snap);
  assert.equal(snap.selectedUnitId, second.id);
  assert.equal(snap.data.thresholds.filter((t) => t.unitId === second.id).length, SENSOR_KEYS.length);
  assert.equal(snap.data.actuators.filter((a) => a.unitId === second.id).length, 4);
  assert.equal(snap.data.thresholds.find((t) => t.unitId === first.id && t.sensor === "ph")?.min, PRESETS[1].values.ph.min);
  assert.ok(snap.live[second.id]);
  assert.match((await store.deleteHub("nope")) ?? "", /not found/);
  assert.equal(await store.deleteSet(second.id), null);
  assert.match((await store.deleteSet(first.id)) ?? "", /at least one set/);
  assert.equal(await store.deleteHub(hub.id), null);
  snap = store.getSnapshot();
  assert.equal(snap.data.hubs.some((h) => h.id === hub.id), false);
  assert.equal(snap.data.units.some((u) => u.hubId === hub.id), false);
  assert.equal(snap.data.thresholds.some((t) => t.unitId === first.id || t.unitId === second.id), false);
  assert.equal(snap.live[first.id], undefined);
  assert.ok(snap.data.hubs.some((h) => h.id === snap.selectedHubId));
});

test("a healthy set stays in range for every growing profile", () => {
  const d = buildFallbackData("test");
  for (const u of d.units.filter((x) => x.hubId === "hub-dili")) {
    const p = profileFor(u.id, PRESETS.find((x) => x.id === u.presetId));
    const t = d.thresholds.filter((x) => x.unitId === u.id);
    const within = (key: string, v: number) => { const l = t.find((x) => x.sensor === key)!; return v >= l.min && v <= l.max; };
    assert.ok(within("ph", p.ph) && within("ec", p.ec) && within("airTemp", p.airBase) && within("humidity", p.humBase) && within("waterLevel", p.level), u.id);
  }
});

test("finance summary counts paid income and expenses over the last 30 days only", () => {
  const d = buildFallbackData("test");
  const ids = d.units.filter((u) => u.hubId === "hub-dili").map((u) => u.id);
  const today = "2026-10-15";
  d.harvests = [{ id: 1, unitId: ids[0], crop: "lettuce", category: "greens", weightKg: 10, pricePerKg: 3, buyer: "Hotel", status: "paid", harvestedAt: "2026-10-10", paidAt: "2026-10-12" }, { id: 2, unitId: ids[0], crop: "lettuce", category: "greens", weightKg: 4, pricePerKg: 3, buyer: "Hotel", status: "collected", harvestedAt: "2026-10-12", paidAt: null }, { id: 3, unitId: ids[1], crop: "basil", category: "herbs", weightKg: 1, pricePerKg: 6, buyer: "Hotel", status: "paid", harvestedAt: "2026-08-01", paidAt: "2026-08-05" }];
  d.ledger = [{ id: 1, unitId: ids[0], type: "expense", category: "Fish feed", amountCents: 1000, date: "2026-10-01", description: "", counterparty: "", reference: "" }, { id: 2, unitId: ids[1], type: "expense", category: "Nutrients", amountCents: 500, date: "2026-07-01", description: "", counterparty: "", reference: "" }];
  const f = financeSummary(d, ids, today);
  assert.equal(f.income, 30);
  assert.equal(f.expense, 10);
  assert.equal(f.profit, 20);
  assert.equal(f.outstanding, 12);
  assert.equal(f.weekly.length, 8);
  assert.deepEqual(f.crops, [{ crop: "lettuce", label: "Lettuce", kg: 14 }]);
});
