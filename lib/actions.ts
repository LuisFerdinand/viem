"use server";

import { and, desc, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { queryDashboardData } from "./data";
import { db } from "./db/client";
import * as s from "./db/schema";
import { seedDatabase } from "./db/seed";
import {
  ACTUATOR_KINDS,
  ACTUATOR_MODES,
  ACTUATORS,
  CROP_BY_ID,
  EVENT_CATEGORIES,
  HARVEST_STATUSES,
  PRESETS,
  SENSOR_KEYS,
  SENSORS,
  alertCopy,
  validateThreshold,
  type ActuatorKind,
  type EventCategory,
} from "./domain";
import { toActuator, toAlert, toEvent, toHarvest, toRule, toThreshold } from "./dto";
import type {
  ActionResult,
  ActuatorDTO,
  AlertDTO,
  DashboardData,
  EventDTO,
  HarvestDTO,
  RuleDTO,
  ThresholdDTO,
} from "./types";

/*
 * Server actions for the demo dashboard. Every action validates its input,
 * never throws to the client, and keeps the demo tables small by pruning.
 */

const MAX_EVENTS = 600;
const MAX_ALERTS = 300;
const OFFLINE = "Database unavailable — change kept in this browser only.";

const unitId = z.string().min(1).max(40);
const actor = z.string().trim().min(1).max(60);
const kind = z.enum(ACTUATOR_KINDS);
const sensor = z.enum(SENSOR_KEYS);

async function run<T>(fn: (database: NonNullable<typeof db>) => Promise<T>): Promise<ActionResult<T>> {
  if (!db) return { ok: false, error: OFFLINE };
  try {
    return { ok: true, data: await fn(db) };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { ok: false, error: err.issues[0]?.message ?? "Invalid input" };
    }
    console.error("[viem] action failed:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Something went wrong" };
  }
}

function eventInsert(
  database: NonNullable<typeof db>,
  e: { unitId: string | null; category: EventCategory; message: string; actor: string },
) {
  return database.insert(s.events).values({ ...e, message: e.message.slice(0, 280) }).returning();
}

function pruneEvents(database: NonNullable<typeof db>) {
  return database.execute(
    sql`delete from ${s.events} where ${s.events.id} in (select ${s.events.id} from ${s.events} order by ${s.events.id} desc offset ${MAX_EVENTS})`,
  );
}

const label = (k: ActuatorKind) => ACTUATORS[k].label;

/* ------------------------------------------------------------------ */
/* Controls                                                            */
/* ------------------------------------------------------------------ */

export async function setActuatorMode(input: {
  unitId: string;
  kind: ActuatorKind;
  mode: (typeof ACTUATOR_MODES)[number];
  /** When switching to manual, hold the actuator in its current state. */
  isOn?: boolean;
  actor: string;
}): Promise<ActionResult<{ actuator: ActuatorDTO; event: EventDTO }>> {
  return run(async (database) => {
    const v = z
      .object({ unitId, kind, mode: z.enum(ACTUATOR_MODES), isOn: z.boolean().optional(), actor })
      .parse(input);
    const [, [row], [ev]] = await database.batch([
      pruneEvents(database),
      database
        .update(s.actuators)
        .set({
          mode: v.mode,
          ...(v.mode === "manual" && v.isOn !== undefined ? { isOn: v.isOn } : {}),
          updatedAt: new Date(),
          updatedBy: v.actor,
        })
        .where(and(eq(s.actuators.unitId, v.unitId), eq(s.actuators.kind, v.kind)))
        .returning(),
      eventInsert(database, {
        unitId: v.unitId,
        category: "config",
        message: `${label(v.kind)} switched to ${v.mode} mode`,
        actor: v.actor,
      }),
    ]);
    if (!row) throw new Error("Actuator not found");
    return { actuator: toActuator(row), event: toEvent(ev) };
  });
}

export async function setActuatorPower(input: {
  unitId: string;
  kind: ActuatorKind;
  isOn: boolean;
  actor: string;
}): Promise<ActionResult<{ actuator: ActuatorDTO; event: EventDTO }>> {
  return run(async (database) => {
    const v = z.object({ unitId, kind, isOn: z.boolean(), actor }).parse(input);
    const [, [row], [ev]] = await database.batch([
      pruneEvents(database),
      database
        .update(s.actuators)
        .set({ isOn: v.isOn, updatedAt: new Date(), updatedBy: v.actor })
        .where(and(eq(s.actuators.unitId, v.unitId), eq(s.actuators.kind, v.kind)))
        .returning(),
      eventInsert(database, {
        unitId: v.unitId,
        category: "control",
        message: `${label(v.kind)} turned ${v.isOn ? "ON" : "OFF"} manually`,
        actor: v.actor,
      }),
    ]);
    if (!row) throw new Error("Actuator not found");
    return { actuator: toActuator(row), event: toEvent(ev) };
  });
}

export async function saveSchedule(input: {
  unitId: string;
  kind: ActuatorKind;
  onMin: number;
  offMin: number;
  actor: string;
}): Promise<ActionResult<{ actuator: ActuatorDTO; event: EventDTO }>> {
  return run(async (database) => {
    const v = z
      .object({
        unitId,
        kind,
        onMin: z.number().int().min(1, "Run time must be at least 1 minute").max(240),
        offMin: z.number().int().min(1, "Rest time must be at least 1 minute").max(720),
        actor,
      })
      .parse(input);
    const [, [row], [ev]] = await database.batch([
      pruneEvents(database),
      database
        .update(s.actuators)
        .set({ scheduleOnMin: v.onMin, scheduleOffMin: v.offMin, updatedAt: new Date(), updatedBy: v.actor })
        .where(and(eq(s.actuators.unitId, v.unitId), eq(s.actuators.kind, v.kind)))
        .returning(),
      eventInsert(database, {
        unitId: v.unitId,
        category: "config",
        message: `${label(v.kind)} schedule set to ${v.onMin} min on / ${v.offMin} min off`,
        actor: v.actor,
      }),
    ]);
    if (!row) throw new Error("Actuator not found");
    return { actuator: toActuator(row), event: toEvent(ev) };
  });
}

/** Logs a state change made by automation, a schedule or a safety interlock. */
export async function logAutomationEvent(input: {
  unitId: string;
  message: string;
  actor: string;
  category?: EventCategory;
}): Promise<ActionResult<EventDTO>> {
  return run(async (database) => {
    const v = z
      .object({
        unitId,
        message: z.string().min(1).max(280),
        actor,
        category: z.enum(EVENT_CATEGORIES).default("automation"),
      })
      .parse(input);
    const [, [ev]] = await database.batch([
      pruneEvents(database),
      eventInsert(database, { unitId: v.unitId, category: v.category, message: v.message, actor: v.actor }),
    ]);
    return toEvent(ev);
  });
}

/* ------------------------------------------------------------------ */
/* Alarm parameters                                                    */
/* ------------------------------------------------------------------ */

const thresholdInput = z.object({
  unitId,
  sensor,
  min: z.number(),
  max: z.number(),
  criticalMin: z.number(),
  criticalMax: z.number(),
  alarmEnabled: z.boolean(),
  actor,
});

export async function saveThreshold(
  input: z.infer<typeof thresholdInput>,
): Promise<ActionResult<{ threshold: ThresholdDTO; event: EventDTO }>> {
  return run(async (database) => {
    const v = thresholdInput.parse(input);
    const problem = validateThreshold(v);
    if (problem) throw new Error(problem);
    const meta = SENSORS[v.sensor];
    const [, [row], [ev]] = await database.batch([
      pruneEvents(database),
      database
        .update(s.thresholds)
        .set({
          min: v.min,
          max: v.max,
          criticalMin: v.criticalMin,
          criticalMax: v.criticalMax,
          alarmEnabled: v.alarmEnabled,
          updatedAt: new Date(),
        })
        .where(and(eq(s.thresholds.unitId, v.unitId), eq(s.thresholds.sensor, v.sensor)))
        .returning(),
      eventInsert(database, {
        unitId: v.unitId,
        category: "config",
        message: v.alarmEnabled
          ? `${meta.label} alarm set to ${v.min}–${v.max} ${meta.unit} (critical ${v.criticalMin}–${v.criticalMax})`
          : `${meta.label} alarm disabled`,
        actor: v.actor,
      }),
    ]);
    if (!row) throw new Error("Threshold not found");
    return { threshold: toThreshold(row), event: toEvent(ev) };
  });
}

export async function applyPreset(input: {
  unitId: string;
  presetId: string;
  actor: string;
}): Promise<ActionResult<{ thresholds: ThresholdDTO[]; event: EventDTO }>> {
  return run(async (database) => {
    const v = z.object({ unitId, presetId: z.string().max(60), actor }).parse(input);
    const preset = PRESETS.find((p) => p.id === v.presetId);
    if (!preset) throw new Error("Unknown preset");
    const updates = SENSOR_KEYS.map((key) =>
      database
        .update(s.thresholds)
        .set({ ...preset.values[key], updatedAt: new Date() })
        .where(and(eq(s.thresholds.unitId, v.unitId), eq(s.thresholds.sensor, key)))
        .returning(),
    );
    const results = await database.batch([
      eventInsert(database, {
        unitId: v.unitId,
        category: "config",
        message: `Alarm preset applied: ${preset.label}`,
        actor: v.actor,
      }),
      ...updates,
    ]);
    const [[ev], ...rows] = results;
    return { thresholds: rows.flat().map(toThreshold), event: toEvent(ev) };
  });
}

/* ------------------------------------------------------------------ */
/* Automation rules                                                    */
/* ------------------------------------------------------------------ */

const ruleShape = z
  .object({
    unitId,
    actuator: kind,
    sensor,
    condition: z.enum(["below", "above"]),
    onValue: z.number(),
    offValue: z.number(),
    enabled: z.boolean(),
  })
  .refine((r) => (r.condition === "below" ? r.offValue > r.onValue : r.offValue < r.onValue), {
    message: "The turn-off value must be on the other side of the turn-on value (hysteresis).",
  });

function describeRule(r: z.infer<typeof ruleShape>) {
  const m = SENSORS[r.sensor];
  return `${label(r.actuator)} ON when ${m.label.toLowerCase()} ${r.condition} ${r.onValue} ${m.unit}, OFF past ${r.offValue} ${m.unit}`;
}

export async function createRule(
  input: z.infer<typeof ruleShape> & { actor: string },
): Promise<ActionResult<{ rule: RuleDTO; event: EventDTO }>> {
  return run(async (database) => {
    const who = actor.parse(input.actor);
    const v = ruleShape.parse(input);
    const [count] = await database
      .select({ n: sql<number>`count(*)::int` })
      .from(s.automationRules)
      .where(eq(s.automationRules.unitId, v.unitId));
    if ((count?.n ?? 0) >= 20) throw new Error("A unit can have at most 20 rules in this demo.");
    const [[row], [ev]] = await database.batch([
      database.insert(s.automationRules).values(v).returning(),
      eventInsert(database, { unitId: v.unitId, category: "config", message: `Rule added: ${describeRule(v)}`, actor: who }),
    ]);
    return { rule: toRule(row), event: toEvent(ev) };
  });
}

export async function updateRule(
  input: z.infer<typeof ruleShape> & { id: number; actor: string },
): Promise<ActionResult<{ rule: RuleDTO; event: EventDTO }>> {
  return run(async (database) => {
    const id = z.number().int().positive().parse(input.id);
    const who = actor.parse(input.actor);
    const v = ruleShape.parse(input);
    const [[row], [ev]] = await database.batch([
      database
        .update(s.automationRules)
        .set(v)
        .where(and(eq(s.automationRules.id, id), eq(s.automationRules.unitId, v.unitId)))
        .returning(),
      eventInsert(database, {
        unitId: v.unitId,
        category: "config",
        message: v.enabled ? `Rule updated: ${describeRule(v)}` : `Rule paused: ${describeRule(v)}`,
        actor: who,
      }),
    ]);
    if (!row) throw new Error("Rule not found");
    return { rule: toRule(row), event: toEvent(ev) };
  });
}

export async function deleteRule(input: {
  id: number;
  unitId: string;
  actor: string;
}): Promise<ActionResult<{ id: number; event: EventDTO }>> {
  return run(async (database) => {
    const v = z.object({ id: z.number().int().positive(), unitId, actor }).parse(input);
    const [deleted] = await database
      .delete(s.automationRules)
      .where(and(eq(s.automationRules.id, v.id), eq(s.automationRules.unitId, v.unitId)))
      .returning();
    if (!deleted) throw new Error("Rule not found");
    const [ev] = await eventInsert(database, {
      unitId: v.unitId,
      category: "config",
      message: `Rule removed: ${label(deleted.actuator as ActuatorKind)} on ${SENSORS[deleted.sensor as keyof typeof SENSORS].label.toLowerCase()}`,
      actor: v.actor,
    });
    return { id: v.id, event: toEvent(ev) };
  });
}

/* ------------------------------------------------------------------ */
/* Alerts                                                              */
/* ------------------------------------------------------------------ */

export async function raiseAlert(input: {
  unitId: string;
  code: string;
  severity: "warning" | "critical";
  direction: "low" | "high";
  value: number;
  channel: "whatsapp" | "sms";
}): Promise<ActionResult<AlertDTO>> {
  return run(async (database) => {
    const v = z
      .object({
        unitId,
        code: z.enum([...SENSOR_KEYS, "pumpFault"]),
        severity: z.enum(["warning", "critical"]),
        direction: z.enum(["low", "high"]),
        value: z.number(),
        channel: z.enum(["whatsapp", "sms"]),
      })
      .parse(input);

    // One open alert per unit + code: escalate it instead of duplicating.
    const [open] = await database
      .select()
      .from(s.alerts)
      .where(and(eq(s.alerts.unitId, v.unitId), eq(s.alerts.code, v.code), isNull(s.alerts.resolvedAt)))
      .orderBy(desc(s.alerts.createdAt))
      .limit(1);

    const copy = alertCopy(v.code, v.direction);
    if (open) {
      if (open.severity === "warning" && v.severity === "critical") {
        const [row] = await database
          .update(s.alerts)
          .set({ severity: "critical", value: v.value, messageTet: copy.tet, messageEn: copy.en, acknowledgedAt: null, acknowledgedBy: null })
          .where(eq(s.alerts.id, open.id))
          .returning();
        return toAlert(row);
      }
      return toAlert(open);
    }

    const [[row]] = await database.batch([
      database
        .insert(s.alerts)
        .values({
          unitId: v.unitId,
          code: v.code,
          severity: v.severity,
          value: v.value,
          messageTet: copy.tet,
          messageEn: copy.en,
          channel: v.channel,
        })
        .returning(),
      database.execute(
        sql`delete from ${s.alerts} where ${s.alerts.id} in (select ${s.alerts.id} from ${s.alerts} where ${s.alerts.resolvedAt} is not null and ${s.alerts.acknowledgedAt} is not null order by ${s.alerts.id} desc offset ${MAX_ALERTS})`,
      ),
    ]);
    return toAlert(row);
  });
}

export async function resolveAlert(input: { id: number }): Promise<ActionResult<AlertDTO>> {
  return run(async (database) => {
    const id = z.number().int().positive().parse(input.id);
    const [row] = await database
      .update(s.alerts)
      .set({ resolvedAt: new Date() })
      .where(and(eq(s.alerts.id, id), isNull(s.alerts.resolvedAt)))
      .returning();
    if (row) return toAlert(row);
    const [existing] = await database.select().from(s.alerts).where(eq(s.alerts.id, id));
    if (!existing) throw new Error("Alert not found");
    return toAlert(existing);
  });
}

export async function acknowledgeAlerts(input: {
  ids: number[];
  by: string;
  note?: string;
}): Promise<ActionResult<{ alerts: AlertDTO[]; event: EventDTO | null }>> {
  return run(async (database) => {
    const v = z
      .object({
        ids: z.array(z.number().int().positive()).min(1).max(100),
        by: actor,
        note: z.string().trim().max(280).optional(),
      })
      .parse(input);
    const rows = await database
      .update(s.alerts)
      .set({ acknowledgedAt: new Date(), acknowledgedBy: v.by, note: v.note || null })
      .where(and(inArray(s.alerts.id, v.ids), isNull(s.alerts.acknowledgedAt)))
      .returning();
    let event: EventDTO | null = null;
    if (rows.length) {
      const first = rows[0];
      const [ev] = await eventInsert(database, {
        unitId: rows.every((r) => r.unitId === first.unitId) ? first.unitId : null,
        category: "alarm",
        message:
          rows.length === 1
            ? `Alert acknowledged: ${first.messageEn}${v.note ? ` — “${v.note}”` : ""}`
            : `${rows.length} alerts acknowledged`,
        actor: v.by,
      });
      event = toEvent(ev);
    }
    return { alerts: rows.map(toAlert), event };
  });
}

/* ------------------------------------------------------------------ */
/* Harvest & buy-back                                                  */
/* ------------------------------------------------------------------ */

export async function addHarvest(input: {
  unitId: string;
  crop: string;
  weightKg: number;
  buyer: string;
  harvestedAt: string;
  actor: string;
}): Promise<ActionResult<{ harvest: HarvestDTO; event: EventDTO }>> {
  return run(async (database) => {
    const v = z
      .object({
        unitId,
        crop: z.string().refine((c) => c in CROP_BY_ID, "Pick a crop"),
        weightKg: z.number().gt(0, "Weight must be above 0 kg").max(1000, "That is more than one unit can harvest"),
        buyer: z.string().trim().min(1, "Choose a buyer").max(80),
        harvestedAt: z.iso.date("Pick a harvest date"),
        actor,
      })
      .parse(input);
    const crop = CROP_BY_ID[v.crop];
    const [[row], [ev]] = await database.batch([
      database
        .insert(s.harvests)
        .values({
          unitId: v.unitId,
          crop: crop.id,
          category: crop.category,
          weightKg: Math.round(v.weightKg * 10) / 10,
          pricePerKg: crop.floorPrice,
          buyer: v.buyer,
          harvestedAt: v.harvestedAt,
        })
        .returning(),
      eventInsert(database, {
        unitId: v.unitId,
        category: "harvest",
        message: `Harvest logged: ${v.weightKg} kg ${crop.label.toLowerCase()} for ${v.buyer} (US$${(v.weightKg * crop.floorPrice).toFixed(2)} at buy-back price)`,
        actor: v.actor,
      }),
    ]);
    return { harvest: toHarvest(row), event: toEvent(ev) };
  });
}

export async function setHarvestStatus(input: {
  id: number;
  status: (typeof HARVEST_STATUSES)[number];
}): Promise<ActionResult<HarvestDTO>> {
  return run(async (database) => {
    const v = z.object({ id: z.number().int().positive(), status: z.enum(HARVEST_STATUSES) }).parse(input);
    const [row] = await database.update(s.harvests).set({ status: v.status }).where(eq(s.harvests.id, v.id)).returning();
    if (!row) throw new Error("Harvest not found");
    return toHarvest(row);
  });
}

export async function deleteHarvest(input: { id: number }): Promise<ActionResult<{ id: number }>> {
  return run(async (database) => {
    const id = z.number().int().positive().parse(input.id);
    await database.delete(s.harvests).where(eq(s.harvests.id, id));
    return { id };
  });
}

/* ------------------------------------------------------------------ */
/* Activity log & maintenance                                          */
/* ------------------------------------------------------------------ */

export async function fetchEvents(input: {
  beforeId?: number;
  limit?: number;
}): Promise<ActionResult<EventDTO[]>> {
  return run(async (database) => {
    const v = z
      .object({ beforeId: z.number().int().positive().optional(), limit: z.number().int().min(1).max(100).default(40) })
      .parse(input);
    const rows = await database
      .select()
      .from(s.events)
      .where(v.beforeId ? lt(s.events.id, v.beforeId) : undefined)
      .orderBy(desc(s.events.id))
      .limit(v.limit);
    return rows.map(toEvent);
  });
}

export async function logMaintenance(input: {
  unitId: string;
  kind: "test-strip" | "calibration";
  ph?: number;
  ammonia?: number;
  actor: string;
}): Promise<ActionResult<EventDTO>> {
  return run(async (database) => {
    const v = z
      .object({
        unitId,
        kind: z.enum(["test-strip", "calibration"]),
        ph: z.number().min(0).max(14).optional(),
        ammonia: z.number().min(0).max(20).optional(),
        actor,
      })
      .parse(input);
    const message =
      v.kind === "calibration"
        ? "Monthly sensor calibration completed (pH 4.0/7.0 buffers, EC 1.41 mS/cm)"
        : `Weekly manual test strip logged — pH ${v.ph ?? "n/a"}, ammonia ${v.ammonia ?? "n/a"} ppm`;
    const [, [ev]] = await database.batch([
      pruneEvents(database),
      eventInsert(database, { unitId: v.unitId, category: "maintenance", message, actor: v.actor }),
    ]);
    return toEvent(ev);
  });
}

export async function resetDemo(): Promise<ActionResult<DashboardData>> {
  return run(async (database) => {
    await seedDatabase(database);
    return { source: "database" as const, ...(await queryDashboardData()) };
  });
}
