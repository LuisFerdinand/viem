import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { Preset } from "../domain";

/**
 * VIEM demo schema.
 *
 * Sensor readings are intentionally NOT stored here: the demo dashboard
 * simulates them in the browser while it is open. Only configuration and
 * state changes (controls, rules, alarms, events, harvests) are persisted.
 */

const createdAt = () =>
  timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow();

export const hubs = pgTable("hubs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  kind: text("kind", { enum: ["hub", "suku"] }).notNull(),
  site: text("site").notNull(),
  location: text("location").notNull(),
  municipality: text("municipality").notNull(),
  installedAt: date("installed_at", { mode: "string" }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
});

/** A "set": one monitored growing system (tank, sensors, equipment) inside a hub. */
export const units = pgTable("units", {
  id: text("id").primaryKey(),
  hubId: text("hub_id")
    .notNull()
    .references(() => hubs.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  presetId: text("preset_id").notNull().default("aquaponics-tilapia"),
  crops: text("crops").notNull(),
  fishCount: integer("fish_count").notNull(),
  tankLiters: integer("tank_liters").notNull(),
  operatorTeam: integer("operator_team").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
}, (t) => [index("units_hub_idx").on(t.hubId)]);

export const thresholds = pgTable(
  "thresholds",
  {
    id: serial("id").primaryKey(),
    unitId: text("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    sensor: text("sensor").notNull(),
    min: real("min").notNull(),
    max: real("max").notNull(),
    criticalMin: real("critical_min").notNull(),
    criticalMax: real("critical_max").notNull(),
    alarmEnabled: boolean("alarm_enabled").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("thresholds_unit_sensor_idx").on(t.unitId, t.sensor)],
);

export const actuators = pgTable(
  "actuators",
  {
    id: serial("id").primaryKey(),
    unitId: text("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    mode: text("mode", { enum: ["manual", "auto", "schedule"] }).notNull().default("manual"),
    isOn: boolean("is_on").notNull().default(false),
    scheduleOnMin: integer("schedule_on_min").notNull().default(15),
    scheduleOffMin: integer("schedule_off_min").notNull().default(45),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull().default("System"),
  },
  (t) => [uniqueIndex("actuators_unit_kind_idx").on(t.unitId, t.kind)],
);

export const automationRules = pgTable(
  "automation_rules",
  {
    id: serial("id").primaryKey(),
    unitId: text("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    actuator: text("actuator").notNull(),
    sensor: text("sensor").notNull(),
    condition: text("condition", { enum: ["below", "above"] }).notNull(),
    onValue: real("on_value").notNull(),
    offValue: real("off_value").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [index("rules_unit_idx").on(t.unitId)],
);

export const alerts = pgTable(
  "alerts",
  {
    id: serial("id").primaryKey(),
    unitId: text("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    severity: text("severity", { enum: ["warning", "critical"] }).notNull(),
    value: real("value").notNull(),
    messageTet: text("message_tet").notNull(),
    messageEn: text("message_en").notNull(),
    channel: text("channel", { enum: ["whatsapp", "sms"] }).notNull().default("whatsapp"),
    createdAt: createdAt(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: "date" }),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true, mode: "date" }),
    acknowledgedBy: text("acknowledged_by"),
    note: text("note"),
  },
  (t) => [index("alerts_unit_idx").on(t.unitId), index("alerts_created_idx").on(t.createdAt)],
);

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    unitId: text("unit_id").references(() => units.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    message: text("message").notNull(),
    actor: text("actor").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("events_created_idx").on(t.createdAt)],
);

export const harvests = pgTable(
  "harvests",
  {
    id: serial("id").primaryKey(),
    unitId: text("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    crop: text("crop").notNull(),
    category: text("category", { enum: ["greens", "herbs", "fish"] }).notNull(),
    weightKg: real("weight_kg").notNull(),
    pricePerKg: real("price_per_kg").notNull(),
    buyer: text("buyer").notNull(),
    status: text("status", { enum: ["logged", "collected", "paid"] }).notNull().default("logged"),
    harvestedAt: date("harvested_at", { mode: "string" }).notNull(),
    paidAt: date("paid_at", { mode: "string" }),
    createdAt: createdAt(),
  },
  (t) => [index("harvests_unit_idx").on(t.unitId)],
);

export const automationPresets = pgTable("automation_presets", {
  id: text("id").primaryKey(),
  definition: jsonb("definition").$type<Preset>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const ledgerEntries = pgTable("ledger_entries", {
  id: serial("id").primaryKey(),
  unitId: text("unit_id").notNull().references(() => units.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["income", "expense"] }).notNull(),
  category: text("category").notNull(),
  amountCents: integer("amount_cents").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  description: text("description").notNull(),
  counterparty: text("counterparty").notNull().default(""),
  reference: text("reference").notNull().default(""),
  createdAt: createdAt(),
}, (t) => [index("ledger_unit_date_idx").on(t.unitId, t.date)]);
