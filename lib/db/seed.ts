import type { BatchItem } from "drizzle-orm/batch";
import { buildSeed, SEED_UNITS } from "../seed-data";
import type { Database } from "./client";
import * as s from "./schema";
import { PRESETS } from "../domain";

/**
 * Wipes the demo tables and re-inserts the seed dataset in one Neon batch
 * (a single non-interactive transaction).
 */
export async function seedDatabase(db: Database) {
  const seed = buildSeed();
  const statements: BatchItem<"pg">[] = [
    db.delete(s.events),
    db.delete(s.automationPresets),
    db.delete(s.units), // cascades to thresholds, actuators, rules, alerts, harvests
    db.insert(s.units).values(SEED_UNITS),
    db.insert(s.thresholds).values(seed.thresholds),
    db.insert(s.actuators).values(
      seed.actuators.map((a) => ({ ...a, updatedAt: new Date(a.updatedAt) })),
    ),
    db.insert(s.automationRules).values(seed.rules),
    db.insert(s.harvests).values(seed.harvests.map((h) => ({ ...h, paidAt: h.status === "paid" ? h.harvestedAt : null }))),
    db.insert(s.automationPresets).values(PRESETS.map((p) => ({ id: p.id, definition: p }))),
    db.insert(s.alerts).values(
      seed.alerts.map((a) => ({
        ...a,
        createdAt: new Date(a.createdAt),
        resolvedAt: a.resolvedAt ? new Date(a.resolvedAt) : null,
        acknowledgedAt: a.acknowledgedAt ? new Date(a.acknowledgedAt) : null,
      })),
    ),
    db.insert(s.events).values(seed.events.map((e) => ({ ...e, createdAt: new Date(e.createdAt) }))),
  ];
  await db.batch(statements as [BatchItem<"pg">, ...BatchItem<"pg">[]]);
}
