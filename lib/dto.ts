import type { ActuatorKind, AlertCode, CropCategory, EventCategory, SensorKey } from "./domain";
import type * as s from "./db/schema";
import type {
  ActuatorDTO,
  AlertDTO,
  EventDTO,
  HarvestDTO,
  RuleDTO,
  ThresholdDTO,
  UnitDTO,
} from "./types";

/** Row → DTO mappers. Dates become ISO strings so they cross the client boundary cleanly. */

type Row<T extends { $inferSelect: unknown }> = T["$inferSelect"];

export const toUnit = (r: Row<typeof s.units>): UnitDTO => ({
  id: r.id,
  name: r.name,
  kind: r.kind,
  site: r.site,
  location: r.location,
  municipality: r.municipality,
  crops: r.crops,
  fishCount: r.fishCount,
  tankLiters: r.tankLiters,
  operatorTeam: r.operatorTeam,
  installedAt: r.installedAt,
});

export const toThreshold = (r: Row<typeof s.thresholds>): ThresholdDTO => ({
  id: r.id,
  unitId: r.unitId,
  sensor: r.sensor as SensorKey,
  min: r.min,
  max: r.max,
  criticalMin: r.criticalMin,
  criticalMax: r.criticalMax,
  alarmEnabled: r.alarmEnabled,
});

export const toActuator = (r: Row<typeof s.actuators>): ActuatorDTO => ({
  id: r.id,
  unitId: r.unitId,
  kind: r.kind as ActuatorKind,
  mode: r.mode,
  isOn: r.isOn,
  scheduleOnMin: r.scheduleOnMin,
  scheduleOffMin: r.scheduleOffMin,
  updatedAt: r.updatedAt.toISOString(),
  updatedBy: r.updatedBy,
});

export const toRule = (r: Row<typeof s.automationRules>): RuleDTO => ({
  id: r.id,
  unitId: r.unitId,
  actuator: r.actuator as ActuatorKind,
  sensor: r.sensor as SensorKey,
  condition: r.condition,
  onValue: r.onValue,
  offValue: r.offValue,
  enabled: r.enabled,
});

export const toAlert = (r: Row<typeof s.alerts>): AlertDTO => ({
  id: r.id,
  unitId: r.unitId,
  code: r.code as AlertCode,
  severity: r.severity,
  value: r.value,
  messageTet: r.messageTet,
  messageEn: r.messageEn,
  channel: r.channel,
  createdAt: r.createdAt.toISOString(),
  resolvedAt: r.resolvedAt?.toISOString() ?? null,
  acknowledgedAt: r.acknowledgedAt?.toISOString() ?? null,
  acknowledgedBy: r.acknowledgedBy,
  note: r.note,
});

export const toEvent = (r: Row<typeof s.events>): EventDTO => ({
  id: r.id,
  unitId: r.unitId,
  category: r.category as EventCategory,
  message: r.message,
  actor: r.actor,
  createdAt: r.createdAt.toISOString(),
});

export const toHarvest = (r: Row<typeof s.harvests>): HarvestDTO => ({
  id: r.id,
  unitId: r.unitId,
  crop: r.crop,
  category: r.category as CropCategory,
  weightKg: r.weightKg,
  pricePerKg: r.pricePerKg,
  buyer: r.buyer,
  status: r.status,
  harvestedAt: r.harvestedAt,
  paidAt: r.paidAt,
});
