import type {
  ActuatorKind,
  ActuatorMode,
  AlertCode,
  CropCategory,
  EventCategory,
  HarvestStatus,
  SensorKey,
  Severity,
  Preset,
} from "./domain";

/** Plain, serialisable shapes passed from the server to the dashboard. */

/** A hub is a site (e.g. the VIEM Hub or a Suku Unit) that holds one or more sets. */
export interface HubDTO {
  id: string;
  name: string;
  kind: "hub" | "suku";
  site: string;
  location: string;
  municipality: string;
  installedAt: string;
}

/**
 * A set is one monitored growing system inside a hub: its own tank, sensor kit,
 * alarm limits, equipment and growing profile (the "unit" the rest of the app
 * reads sensors and controls for).
 */
export interface UnitDTO {
  id: string;
  hubId: string;
  name: string;
  /** Growing profile (preset) this set follows. */
  presetId: string;
  crops: string;
  fishCount: number;
  tankLiters: number;
  operatorTeam: number;
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
  paidAt: string | null;
}

export const LEDGER_CATEGORIES = ["Seeds & seedlings", "Fish feed", "Nutrients", "Equipment", "Maintenance", "Transport", "Labor", "Utilities", "Other income", "Other expense"] as const;
export interface LedgerDTO {
  id: number;
  unitId: string;
  type: "income" | "expense";
  category: string;
  amountCents: number;
  date: string;
  description: string;
  counterparty: string;
  reference: string;
}

export interface DashboardData {
  source: "database" | "fallback";
  sourceNote?: string;
  hubs: HubDTO[];
  units: UnitDTO[];
  thresholds: ThresholdDTO[];
  actuators: ActuatorDTO[];
  rules: RuleDTO[];
  alerts: AlertDTO[];
  events: EventDTO[];
  harvests: HarvestDTO[];
  ledger: LedgerDTO[];
  presets: Preset[];
}

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };
