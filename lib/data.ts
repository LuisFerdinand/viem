import { asc, desc, gte, isNull, or } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "./db/client";
import * as s from "./db/schema";
import { seedDatabase } from "./db/seed";
import { toActuator, toAlert, toEvent, toHarvest, toRule, toThreshold, toUnit } from "./dto";
import { buildFallbackData } from "./seed-data";
import type { DashboardData } from "./types";

const HARVEST_WINDOW_DAYS = 70;

export async function queryDashboardData(): Promise<Omit<DashboardData, "source">> {
  const database = db!;
  const since = new Date(Date.now() - HARVEST_WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10);

  const [units, thresholds, actuators, rules, openAlerts, recentAlerts, events, harvests] =
    await Promise.all([
      database.select().from(s.units).orderBy(asc(s.units.sortOrder)),
      database.select().from(s.thresholds),
      database.select().from(s.actuators),
      database.select().from(s.automationRules).orderBy(asc(s.automationRules.id)),
      database
        .select()
        .from(s.alerts)
        .where(or(isNull(s.alerts.acknowledgedAt), isNull(s.alerts.resolvedAt))),
      database.select().from(s.alerts).orderBy(desc(s.alerts.createdAt)).limit(60),
      database.select().from(s.events).orderBy(desc(s.events.createdAt)).limit(60),
      database
        .select()
        .from(s.harvests)
        .where(gte(s.harvests.harvestedAt, since))
        .orderBy(desc(s.harvests.harvestedAt), desc(s.harvests.id)),
    ]);

  const alertMap = new Map<number, (typeof recentAlerts)[number]>();
  for (const a of [...recentAlerts, ...openAlerts]) alertMap.set(a.id, a);

  return {
    units: units.map(toUnit),
    thresholds: thresholds.map(toThreshold),
    actuators: actuators.map(toActuator),
    rules: rules.map(toRule),
    alerts: [...alertMap.values()]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(toAlert),
    events: events.map(toEvent),
    harvests: harvests.map(toHarvest),
  };
}

/**
 * Loads everything the dashboard needs in one round of parallel queries.
 * Seeds an empty database automatically, and falls back to in-memory demo
 * data if Neon is unreachable so the demo never shows a blank screen.
 */
export async function loadDashboardData(): Promise<DashboardData> {
  await connection(); // always render at request time

  if (!db) {
    return buildFallbackData("DATABASE_URL is not set — running on in-memory demo data.");
  }
  try {
    let data = await queryDashboardData();
    if (data.units.length === 0) {
      await seedDatabase(db);
      data = await queryDashboardData();
    }
    return { source: "database", ...data };
  } catch (err) {
    console.error("[viem] Failed to load dashboard data from Neon:", err);
    return buildFallbackData("Could not reach the database — changes will not be saved.");
  }
}
