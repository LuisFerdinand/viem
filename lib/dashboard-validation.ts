import { z } from "zod";
import { ACTUATOR_KINDS, SENSOR_KEYS, validateThreshold } from "./domain";
import { LEDGER_CATEGORIES } from "./types";

export const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date.").refine((v) => {
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
}, "Pick a valid calendar date.");
const limits = z.object({ min: z.number(), max: z.number(), criticalMin: z.number(), criticalMax: z.number() }).superRefine((v, ctx) => {
  const error = validateThreshold(v);
  if (error) ctx.addIssue({ code: "custom", message: error });
});
export const presetSchema = z.object({
  id: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/),
  label: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(400),
  crop: z.string().trim().min(1).max(120),
  stage: z.string().trim().min(1).max(60),
  system: z.enum(["aquaponics", "hydroponics", "nursery"]),
  values: z.record(z.enum(SENSOR_KEYS), limits),
  rules: z.array(z.object({
    actuator: z.enum(ACTUATOR_KINDS), sensor: z.enum(SENSOR_KEYS), condition: z.enum(["below", "above"]),
    onValue: z.number(), offValue: z.number(), enabled: z.boolean(),
  }).refine((r) => r.condition === "below" ? r.offValue > r.onValue : r.offValue < r.onValue, "The OFF value must release the ON condition.")).max(12),
});
export const ledgerSchema = z.object({
  unitId: z.string().min(1).max(40), type: z.enum(["income", "expense"]), category: z.enum(LEDGER_CATEGORIES),
  amountCents: z.number().int().positive().max(100_000_000), date: calendarDate,
  description: z.string().trim().min(1).max(240), counterparty: z.string().trim().max(120), reference: z.string().trim().max(80),
});

export const setInputSchema = z.object({
  name: z.string().trim().min(1, "Give the set a name.").max(40, "Keep the set name under 40 characters."),
  presetId: z.string().min(1, "Choose a growing profile.").max(60),
  fishCount: z.number().int("Fish count must be a whole number.").min(0, "Fish count cannot be negative.").max(10_000, "That is more fish than one set can hold."),
  tankLiters: z.number().int("Tank size must be a whole number.").min(100, "Tank size must be at least 100 litres.").max(50_000, "Tank size is limited to 50,000 litres in this demo."),
});
export const hubInputSchema = z.object({
  name: z.string().trim().min(1, "Give the hub a name.").max(60, "Keep the hub name under 60 characters."),
  site: z.string().trim().max(80).default(""),
  location: z.string().trim().min(1, "Enter where the hub is.").max(80),
  municipality: z.string().trim().min(1, "Choose a municipality.").max(40),
});
export type SetInput = z.infer<typeof setInputSchema>;
export type HubInput = z.input<typeof hubInputSchema>;
