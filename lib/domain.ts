/**
 * Shared domain model for the VIEM monitoring system.
 * Safe to import from both server and client code.
 */

export const SENSOR_KEYS = [
  "airTemp",
  "humidity",
  "waterLevel",
  "ph",
  "ec",
  "waterTemp",
  "do",
] as const;
export type SensorKey = (typeof SENSOR_KEYS)[number];

export function isSensorKey(v: string): v is SensorKey {
  return (SENSOR_KEYS as readonly string[]).includes(v);
}

export type SensorGroup = "climate" | "water";

export const SENSOR_CATEGORIES = [
  { id: "basic", label: "Basic monitoring", description: "Everyday climate and tank checks for reliable farm operations.", sensors: ["airTemp", "humidity", "waterLevel"] },
  { id: "fish", label: "Fish health", description: "Track the oxygen and temperature conditions that support fish welfare.", sensors: ["waterTemp", "do"] },
  { id: "advanced", label: "Advanced water quality", description: "Monitor acidity and dissolved nutrients in the shared growing loop.", sensors: ["ph", "ec"] },
] as const;
export const SENSOR_GUIDE: Record<SensorKey, { purpose: string; action: string; care: string }> = {
  airTemp: { purpose: "Plant climate · identifies heat or cold stress above the grow beds.", action: "Check shading and ventilation when temperatures move outside the crop's range.", care: "Keep the probe shaded and away from direct sun." },
  humidity: { purpose: "Plant climate · helps operators spot dry air and persistent damp conditions.", action: "Inspect irrigation in dry conditions; improve airflow when humidity stays high.", care: "Keep the sensor ventilated and protect it from splashes." },
  waterLevel: { purpose: "Tank safety · protects pumps from dry running and helps detect leaks or overflow.", action: "Check the water supply, pipes and drains before running the refill pump.", care: "Keep the ultrasonic sensor's path to the water clear." },
  waterTemp: { purpose: "Fish health · tracks thermal stress and conditions in the fish tank.", action: "Inspect fish behavior, shading and circulation when the tank is too warm or cold.", care: "Keep the submerged probe clean and compare it with a reference thermometer." },
  do: { purpose: "Fish health · measures oxygen available to fish and plant roots.", action: "Check aeration immediately when oxygen is low; inspect air hoses and power.", care: "Calibrate and service the oxygen probe according to its manufacturer." },
  ph: { purpose: "Water chemistry · supports nutrient availability, fish welfare and the biofilter.", action: "Confirm unusual readings with a manual test and ask the agronomist before adjusting the loop.", care: "Calibrate with buffer solutions and keep the probe stored correctly." },
  ec: { purpose: "Plant nutrition · estimates dissolved salts; EC does not identify individual nutrients.", action: "Check nutrient inputs and water dilution. TDS shown here is an estimate using the 500 scale.", care: "Clean and calibrate the conductivity probe with a reference solution." },
};

export interface SensorMeta {
  key: SensorKey;
  label: string;
  short: string;
  unit: string;
  decimals: number;
  /** Chart / accent colour for this sensor. */
  color: string;
  /** Sensible axis domain for charts. */
  domain: [number, number];
  group: SensorGroup;
  description: string;
  /** Not in the original brief — added because the proposal relies on it. */
  added?: boolean;
}

export const SENSORS: Record<SensorKey, SensorMeta> = {
  airTemp: {
    key: "airTemp",
    label: "Air temperature",
    short: "Air temp",
    unit: "°C",
    decimals: 1,
    color: "#C8643B",
    domain: [10, 45],
    group: "climate",
    description: "Shade-house air temperature above the grow beds.",
  },
  humidity: {
    key: "humidity",
    label: "Humidity",
    short: "Humidity",
    unit: "%",
    decimals: 0,
    color: "#3F88B5",
    domain: [20, 100],
    group: "climate",
    description: "Relative humidity inside the shade-net house.",
  },
  waterLevel: {
    key: "waterLevel",
    label: "Water level",
    short: "Tank level",
    unit: "%",
    decimals: 0,
    color: "#1F6F94",
    domain: [0, 100],
    group: "water",
    description: "Fish-tank level measured by the ultrasonic level sensor.",
  },
  ph: {
    key: "ph",
    label: "pH",
    short: "pH",
    unit: "pH",
    decimals: 2,
    color: "#7A5BB0",
    domain: [5, 9],
    group: "water",
    description: "Acidity of the shared fish/plant water loop.",
  },
  ec: {
    key: "ec",
    label: "EC / TDS",
    short: "EC / TDS",
    unit: "mS/cm",
    decimals: 2,
    color: "#B08318",
    domain: [0, 3.5],
    group: "water",
    description: "Electrical conductivity — how much dissolved nutrient is in the water. TDS ≈ EC × 500 ppm.",
  },
  waterTemp: {
    key: "waterTemp",
    label: "Water temperature",
    short: "Water temp",
    unit: "°C",
    decimals: 1,
    color: "#1D8A7E",
    domain: [15, 38],
    group: "water",
    description: "Fish-tank water temperature (tilapia thrive at 24–30 °C).",
  },
  do: {
    key: "do",
    label: "Dissolved oxygen",
    short: "Dissolved O₂",
    unit: "mg/L",
    decimals: 1,
    color: "#4D7A1F",
    domain: [0, 12],
    group: "water",
    description: "Oxygen available to the fish. A stopped aerator can kill fish within hours.",
    added: true,
  },
};

export const tdsFromEc = (ec: number) => Math.round(ec * 500);

export function formatSensor(key: SensorKey, value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toFixed(SENSORS[key].decimals);
}

/* ------------------------------------------------------------------ */
/* Actuators                                                           */
/* ------------------------------------------------------------------ */

export const ACTUATOR_KINDS = ["pump", "aeration", "irrigation", "circulation"] as const;
export type ActuatorKind = (typeof ACTUATOR_KINDS)[number];

export function isActuatorKind(v: string): v is ActuatorKind {
  return (ACTUATOR_KINDS as readonly string[]).includes(v);
}

export const ACTUATOR_MODES = ["manual", "auto", "schedule"] as const;
export type ActuatorMode = (typeof ACTUATOR_MODES)[number];

export interface ActuatorMeta {
  kind: ActuatorKind;
  label: string;
  description: string;
  /** Rated electrical draw, used by the solar/battery model. */
  watts: number;
}

export const ACTUATORS: Record<ActuatorKind, ActuatorMeta> = {
  pump: {
    kind: "pump",
    label: "Water pump",
    description: "Tops up the fish tank from the rainwater tank.",
    watts: 180,
  },
  aeration: {
    kind: "aeration",
    label: "Aeration",
    description: "Battery-backed air pump and diffusers that keep oxygen up for the fish.",
    watts: 45,
  },
  irrigation: {
    kind: "irrigation",
    label: "Irrigation",
    description: "Feeds nutrient water to the grow beds and NFT channels.",
    watts: 60,
  },
  circulation: {
    kind: "circulation",
    label: "Water circulation",
    description: "Moves water through the biofilter so bacteria turn ammonia into nitrate.",
    watts: 90,
  },
};

/* ------------------------------------------------------------------ */
/* Thresholds / alarm parameters                                       */
/* ------------------------------------------------------------------ */

export interface ThresholdValues {
  min: number;
  max: number;
  criticalMin: number;
  criticalMax: number;
}

export interface Preset {
  id: string;
  label: string;
  description: string;
  values: Record<SensorKey, ThresholdValues>;
  crop: string;
  stage: string;
  system: "aquaponics" | "hydroponics" | "nursery";
  rules: { actuator: ActuatorKind; sensor: SensorKey; condition: "below" | "above"; onValue: number; offValue: number; enabled: boolean }[];
}

export const PRESETS: Preset[] = [
  {
    id: "aquaponics-tilapia",
    crop: "Tilapia + leafy greens", stage: "Grow-out", system: "aquaponics",
    rules: [{ actuator: "aeration", sensor: "do", condition: "below", onValue: 5.5, offValue: 7.2, enabled: true }, { actuator: "pump", sensor: "waterLevel", condition: "below", onValue: 45, offValue: 85, enabled: true }],
    label: "Tilapia + leafy greens",
    description: "Default aquaponic loop — fish and plants share one water.",
    values: {
      airTemp: { min: 20, max: 32, criticalMin: 15, criticalMax: 38 },
      humidity: { min: 55, max: 85, criticalMin: 40, criticalMax: 95 },
      waterLevel: { min: 40, max: 92, criticalMin: 20, criticalMax: 98 },
      ph: { min: 6.6, max: 7.4, criticalMin: 6.0, criticalMax: 8.0 },
      ec: { min: 0.6, max: 1.8, criticalMin: 0.3, criticalMax: 2.6 },
      waterTemp: { min: 24, max: 30, criticalMin: 20, criticalMax: 33 },
      do: { min: 5.0, max: 11, criticalMin: 3.5, criticalMax: 14 },
    },
  },
  {
    id: "nft-greens",
    crop: "Lettuce, pak choi, kangkung", stage: "Vegetative", system: "hydroponics",
    rules: [{ actuator: "irrigation", sensor: "humidity", condition: "below", onValue: 50, offValue: 65, enabled: true }, { actuator: "circulation", sensor: "waterTemp", condition: "above", onValue: 26, offValue: 24, enabled: true }],
    label: "NFT leafy greens",
    description: "Hydroponic channels for lettuce, pak choi and kangkung.",
    values: {
      airTemp: { min: 18, max: 30, criticalMin: 12, criticalMax: 35 },
      humidity: { min: 50, max: 80, criticalMin: 40, criticalMax: 92 },
      waterLevel: { min: 35, max: 92, criticalMin: 20, criticalMax: 98 },
      ph: { min: 5.8, max: 6.8, criticalMin: 5.4, criticalMax: 7.4 },
      ec: { min: 1.2, max: 2.2, criticalMin: 0.8, criticalMax: 2.8 },
      waterTemp: { min: 18, max: 26, criticalMin: 15, criticalMax: 29 },
      do: { min: 6.0, max: 12, criticalMin: 4.0, criticalMax: 15 },
    },
  },
  {
    id: "fingerling-nursery",
    crop: "Tilapia fingerlings", stage: "Nursery", system: "nursery",
    rules: [{ actuator: "aeration", sensor: "do", condition: "below", onValue: 6, offValue: 8, enabled: true }],
    label: "Fingerling nursery",
    description: "Tighter oxygen and temperature limits for young fish.",
    values: {
      airTemp: { min: 22, max: 32, criticalMin: 17, criticalMax: 37 },
      humidity: { min: 55, max: 85, criticalMin: 40, criticalMax: 95 },
      waterLevel: { min: 50, max: 95, criticalMin: 30, criticalMax: 99 },
      ph: { min: 6.8, max: 7.8, criticalMin: 6.3, criticalMax: 8.3 },
      ec: { min: 0.3, max: 1.2, criticalMin: 0.2, criticalMax: 2.0 },
      waterTemp: { min: 26, max: 30, criticalMin: 22, criticalMax: 32 },
      do: { min: 6.0, max: 12, criticalMin: 4.5, criticalMax: 15 },
    },
  },
];

PRESETS.push(
  { ...PRESETS[1], id: "lettuce-vegetative", label: "Lettuce · vegetative", crop: "Lettuce", stage: "Vegetative", description: "Illustrative lettuce alarm profile for a separate hydroponic loop. Review locally before use.", values: { ...PRESETS[1].values, ec: { min: 1.2, max: 1.8, criticalMin: 0.8, criticalMax: 2.4 } } },
  { ...PRESETS[1], id: "basil-vegetative", label: "Basil · vegetative", crop: "Basil", stage: "Vegetative", description: "Illustrative basil alarm profile for a separate hydroponic loop. Review locally before use.", values: { ...PRESETS[1].values, airTemp: { min: 20, max: 30, criticalMin: 15, criticalMax: 35 } } },
);
export const DEFAULT_PRESET = PRESETS[0];

export type Severity = "warning" | "critical";
export type SensorStatus = "ok" | Severity;

export function statusFor(value: number, t: ThresholdValues): SensorStatus {
  if (value < t.criticalMin || value > t.criticalMax) return "critical";
  if (value < t.min || value > t.max) return "warning";
  return "ok";
}

export function validateThreshold(t: ThresholdValues): string | null {
  const vals = [t.min, t.max, t.criticalMin, t.criticalMax];
  if (vals.some((v) => !Number.isFinite(v))) return "All four limits must be numbers.";
  if (t.criticalMin > t.min) return "Critical low must be at or below the normal low.";
  if (t.min >= t.max) return "Normal low must be below normal high.";
  if (t.max > t.criticalMax) return "Critical high must be at or above the normal high.";
  return null;
}

/* ------------------------------------------------------------------ */
/* Tetum-first alert copy                                              */
/* ------------------------------------------------------------------ */
// Tetum strings are drafts written for the demo — have them reviewed by a
// native speaker (and the VIEM agronomist) before field use.

export type AlertCode = SensorKey | "pumpFault";

const ALERT_COPY: Record<SensorKey, Record<"low" | "high", { tet: string; en: string }>> = {
  do: {
    low: { tet: "Oksijéniu tun. Haree pompa ar agora.", en: "Oxygen is low. Check the air pump now." },
    high: { tet: "Oksijéniu aas liu. Haree sensor.", en: "Oxygen reading is unusually high. Check the sensor." },
  },
  waterLevel: {
    low: { tet: "Nivel bee iha tanke tun. Haree pompa no kanu.", en: "Tank water level is low. Check the pump and pipes." },
    high: { tet: "Nivel bee aas liu. Haree se kanu taka.", en: "Water level is too high. Check whether a drain pipe is blocked." },
  },
  waterTemp: {
    low: { tet: "Bee malirin liu. Haree ikan no hamenus hahán.", en: "Water is too cold. Watch the fish and reduce feeding." },
    high: { tet: "Bee manas liu. Taka tanke ho sombra no loke sirkulasaun.", en: "Water is too hot. Shade the tank and turn on circulation." },
  },
  ph: {
    low: { tet: "pH tun liu. Sukat fali ho test strip no telefone VIEM.", en: "pH is too low. Re-test with a strip and call the VIEM Hub." },
    high: { tet: "pH aas liu. Sukat fali ho test strip no telefone VIEM.", en: "pH is too high. Re-test with a strip and call the VIEM Hub." },
  },
  ec: {
    low: { tet: "Nutriente ki'ik liu. Haree hahán ikan no kompostu.", en: "Nutrients are low. Check fish feeding and the compost brew." },
    high: { tet: "Nutriente aas liu. Aumenta bee moos ba tanke.", en: "Nutrients are too high. Top up the tank with clean water." },
  },
  airTemp: {
    low: { tet: "Anin malirin liu. Haree modo sira.", en: "Air is very cold. Check the plants." },
    high: { tet: "Loron manas liu. Haree rede sombra no bee ba modo.", en: "Very hot day. Check the shade net and water for the plants." },
  },
  humidity: {
    low: { tet: "Anin maran. Loke irrigasaun ba modo.", en: "Air is dry. Turn on irrigation for the plants." },
    high: { tet: "Umidade aas liu. Loke ventilasaun no haree moras iha tahan.", en: "Humidity is high. Open ventilation and check leaves for disease." },
  },
};

export const PUMP_FAULT_COPY = {
  tet: "Pompa la la'o. Haree eletrisidade no pompa agora.",
  en: "Pump is switched on but drawing no current. Check power and the pump now.",
};

export type AlertDirection = "low" | "high";

export function alertCopy(code: AlertCode, direction: AlertDirection): { tet: string; en: string } {
  if (code === "pumpFault") return PUMP_FAULT_COPY;
  return ALERT_COPY[code][direction];
}

export function alertDirection(value: number, t: ThresholdValues): AlertDirection {
  return value > t.max ? "high" : "low";
}

export const ALERT_LABEL: Record<AlertCode, string> = {
  ...Object.fromEntries(SENSOR_KEYS.map((k) => [k, SENSORS[k].label])),
  pumpFault: "Pump current",
} as Record<AlertCode, string>;

/* ------------------------------------------------------------------ */
/* Harvest / buy-back                                                  */
/* ------------------------------------------------------------------ */

export type CropCategory = "greens" | "herbs" | "fish";

export interface Crop {
  id: string;
  label: string;
  category: CropCategory;
  /** Demo buy-back floor price, US$/kg — to be set with cooperatives in the pilot. */
  floorPrice: number;
}

export const CROPS: Crop[] = [
  { id: "lettuce", label: "Lettuce", category: "greens", floorPrice: 3.0 },
  { id: "pak-choi", label: "Pak choi", category: "greens", floorPrice: 2.5 },
  { id: "kangkung", label: "Kangkung", category: "greens", floorPrice: 1.5 },
  { id: "basil", label: "Basil", category: "herbs", floorPrice: 6.0 },
  { id: "tilapia", label: "Tilapia", category: "fish", floorPrice: 4.5 },
];

export const CROP_BY_ID = Object.fromEntries(CROPS.map((c) => [c.id, c])) as Record<string, Crop>;

export const BUYERS = [
  "School meals (Merenda Eskolar)",
  "Hotel",
  "Supermarket",
  "Restaurant",
  "Local market",
] as const;

export const HARVEST_STATUSES = ["logged", "collected", "paid"] as const;
export type HarvestStatus = (typeof HARVEST_STATUSES)[number];

export const EVENT_CATEGORIES = [
  "control",
  "automation",
  "alarm",
  "config",
  "maintenance",
  "harvest",
  "system",
] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

/** Timor-Leste is UTC+9 with no daylight saving. */
export const TIMOR_OFFSET_HOURS = 9;
