import type {
  ActuatorKind,
  ActuatorMode,
  AlertCode,
  CropCategory,
  EventCategory,
  HarvestStatus,
  SensorKey,
  Severity,
} from "./domain";

/** Plain, serialisable shapes passed from the server to the dashboard. */

export interface UnitDTO {
  id: string;
  name: string;
  kind: "hub" | "suku";
  site: string;
  location: string;
  municipality: string;
  crops: string;
  fishCount: number;
  tankLiters: number;
  operatorTeam: number;
  installedAt: string;
}

export interface ThresholdDTO {
  id: number;
  unitId: string;
  sensor: SensorKey;
  min: number;
  max: number;
  criticalMin: number;
  criticalMax: number;
  alarmEnabled: boolean;
}

export interface ActuatorDTO {
  id: number;
  unitId: string;
  kind: ActuatorKind;
  mode: ActuatorMode;
  /** Manual command — only used while mode === "manual". */
  isOn: boolean;
  scheduleOnMin: number;
  scheduleOffMin: number;
  updatedAt: string;
  updatedBy: string;
}

export type RuleCondition = "below" | "above";

export interface RuleDTO {
  id: number;
  unitId: string;
  actuator: ActuatorKind;
  sensor: SensorKey;
  condition: RuleCondition;
  onValue: number;
  offValue: number;
  enabled: boolean;
}

export type AlertChannel = "whatsapp" | "sms";

export interface AlertDTO {
  id: number;
  unitId: string;
  code: AlertCode;
  severity: Severity;
  value: number;
  messageTet: string;
  messageEn: string;
  channel: AlertChannel;
  createdAt: string;
  resolvedAt: string | null;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  note: string | null;
}

export interface EventDTO {
  id: number;
  unitId: string | null;
  category: EventCategory;
  message: string;
  actor: string;
  createdAt: string;
}

export interface HarvestDTO {
  id: number;
  unitId: string;
  crop: string;
  category: CropCategory;
  weightKg: number;
  pricePerKg: number;
  buyer: string;
  status: HarvestStatus;
  harvestedAt: string;
}

export interface DashboardData {
  source: "database" | "fallback";
  sourceNote?: string;
  units: UnitDTO[];
  thresholds: ThresholdDTO[];
  actuators: ActuatorDTO[];
  rules: RuleDTO[];
  alerts: AlertDTO[];
  events: EventDTO[];
  harvests: HarvestDTO[];
}

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };
