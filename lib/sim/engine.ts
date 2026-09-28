/**
 * Pure simulation + control logic for the demo dashboard.
 *
 * In production this logic runs on the ESP32 controller at each tank
 * (offline-first); here it runs in the browser so the demo works anywhere.
 * Nothing in this module touches the network or the database.
 */
import {
  ACTUATOR_KINDS,
  ACTUATORS,
  SENSOR_KEYS,
  SENSORS,
  TIMOR_OFFSET_HOURS,
  statusFor,
  type ActuatorKind,
  type SensorKey,
  type SensorStatus,
  type ThresholdValues,
} from "../domain";
import type { ActuatorDTO, RuleDTO, ThresholdDTO } from "../types";

export const TICK_MS = 30_000;
/** Two hours of readings at one per 30 s. */
export const HISTORY_POINTS = 240;
/** Approximate compressed size of one batched reading on the satellite link. */
export const BYTES_PER_READING = 52;

export type SensorValues = Record<SensorKey, number>;

export interface Reading extends SensorValues {
  t: number;
  battery: number;
  solarW: number;
  loadW: number;
  pumpA: number;
  /** Taken while the satellite link was down — buffered on the controller. */
  offline: boolean;
}

export interface Scenarios {
  pumpFailure: boolean;
  heatwave: boolean;
  phDrift: boolean;
  leak: boolean;
  linkOutage: boolean;
}

export type ScenarioKey = keyof Scenarios;

export const NO_SCENARIOS: Scenarios = {
  pumpFailure: false,
  heatwave: false,
  phDrift: false,
  leak: false,
  linkOutage: false,
};

export const SCENARIOS: { key: ScenarioKey; label: string; description: string }[] = [
  { key: "pumpFailure", label: "Pump failure", description: "Water pump and circulation stop drawing current; oxygen falls." },
  { key: "heatwave", label: "Heat wave", description: "Air +7 °C and dry air; the tank slowly warms." },
  { key: "phDrift", label: "pH crash", description: "Acidification from an overloaded biofilter." },
  { key: "leak", label: "Tank leak", description: "Water level drops fast." },
  { key: "linkOutage", label: "Satellite link outage", description: "Controller keeps working offline and buffers readings." },
];

export interface SimProfile {
  airBase: number;
  airSwing: number;
  humBase: number;
  humSwing: number;
  level: number;
  ph: number;
  ec: number;
  waterTempOffset: number;
  do: number;
  solarPeakW: number;
  batteryWh: number;
  battery: number;
}

const PROFILES: Record<string, SimProfile> = {
  // Lowland, near the coast
  "hub-dili": { airBase: 28.2, airSwing: 4, humBase: 70, humSwing: 10, level: 78, ph: 7.05, ec: 1.15, waterTempOffset: -1.2, do: 6.6, solarPeakW: 1600, batteryWh: 7200, battery: 82 },
  // Highlands — cooler and more humid
  "suku-aileu": { airBase: 23.6, airSwing: 3.4, humBase: 73, humSwing: 8, level: 72, ph: 6.95, ec: 0.95, waterTempOffset: 2.4, do: 7.1, solarPeakW: 900, batteryWh: 4800, battery: 78 },
  // Hot coastal suco — pump left in manual, so the tank slowly runs low
  "suku-liquica": { airBase: 29.4, airSwing: 3.6, humBase: 67, humSwing: 9, level: 62, ph: 7.2, ec: 1.35, waterTempOffset: -1.4, do: 5.9, solarPeakW: 900, batteryWh: 4800, battery: 66 },
};

export function profileFor(unitId: string): SimProfile {
  return PROFILES[unitId] ?? PROFILES["hub-dili"];
}

export type Rand = () => number;

/** Roughly normal noise in [-scale, scale]. */
const noise = (rand: Rand, scale: number) => (rand() + rand() + rand() - 1.5) * (scale / 1.5);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const toward = (v: number, target: number, alpha: number) => v + (target - v) * alpha;

export function timorHour(t: number) {
  return (((t / 3_600_000 + TIMOR_OFFSET_HOURS) % 24) + 24) % 24;
}

function diurnal(t: number) {
  // Peaks around 15:00 local time, lowest around 03:00.
  return Math.sin((2 * Math.PI * (timorHour(t) - 9)) / 24);
}

function solarFactor(t: number) {
  const h = timorHour(t);
  return h < 6 || h > 18 ? 0 : Math.sin((Math.PI * (h - 6)) / 12);
}

export function initialReading(p: SimProfile, t: number): Reading {
  const air = p.airBase + p.airSwing * diurnal(t);
  return {
    t,
    airTemp: air,
    humidity: p.humBase - p.humSwing * diurnal(t),
    waterLevel: p.level,
    ph: p.ph,
    ec: p.ec,
    waterTemp: p.airBase + p.waterTempOffset + 0.35 * (air - p.airBase),
    do: p.do,
    battery: p.battery,
    solarW: p.solarPeakW * solarFactor(t),
    loadW: 0,
    pumpA: 0,
    offline: false,
  };
}

export type ActuatorStates = Record<ActuatorKind, boolean>;

/** Advance the physical model by one tick (≈ 30 s, slightly accelerated for the demo). */
export function stepReading(
  prev: Reading,
  t: number,
  act: ActuatorStates,
  sc: Scenarios,
  p: SimProfile,
  rand: Rand,
): Reading {
  const pumpRuns = act.pump && !sc.pumpFailure;
  const circRuns = act.circulation && !sc.pumpFailure;
  const irrigRuns = act.irrigation && !sc.pumpFailure;
  const aerRuns = act.aeration; // battery-backed

  const d = diurnal(t);
  const airTarget = p.airBase + p.airSwing * d + (sc.heatwave ? 7 : 0);
  const airTemp = clamp(toward(prev.airTemp, airTarget, 0.15) + noise(rand, 0.15), 5, 50);

  const humTarget = p.humBase - p.humSwing * d - (sc.heatwave ? 18 : 0) + (irrigRuns ? 5 : 0);
  const humidity = clamp(toward(prev.humidity, humTarget, 0.15) + noise(rand, 0.6), 15, 100);

  const levelDelta =
    -0.12 + (pumpRuns ? 2.4 : 0) + (irrigRuns ? -0.8 : 0) + (sc.leak ? -2.2 : 0) + noise(rand, 0.06);
  const waterLevel = clamp(prev.waterLevel + levelDelta, 0, 100);

  // A 2,000-litre tank has a lot of thermal inertia: it follows only ~35% of the air swing.
  const wtTarget =
    p.airBase + p.waterTempOffset + 0.35 * (airTemp - p.airBase) - (circRuns ? 0.6 : 0) + (sc.heatwave ? 2.5 : 0);
  const waterTemp = clamp(toward(prev.waterTemp, wtTarget, 0.05) + noise(rand, 0.03), 10, 40);

  let doTarget = aerRuns ? 7.6 - 0.12 * (waterTemp - 26) : 5.0 - 0.15 * (waterTemp - 26);
  if (circRuns) doTarget += 0.4;
  if (sc.pumpFailure) doTarget -= 2;
  const dissolved = clamp(toward(prev.do, doTarget, sc.pumpFailure ? 0.12 : 0.05) + noise(rand, 0.05), 0, 14);

  let ph = toward(prev.ph, p.ph, 0.01) - 0.0015;
  if (circRuns) ph = toward(ph, 7.0, 0.03);
  if (sc.phDrift) ph -= 0.035;
  ph = clamp(ph + noise(rand, 0.008), 4, 9.5);

  let ec = toward(prev.ec, p.ec, 0.01) + 0.0015 - (irrigRuns ? 0.002 : 0.001) - (pumpRuns ? 0.012 : 0);
  ec = clamp(ec + noise(rand, 0.006), 0, 4);

  const solarW = Math.max(0, p.solarPeakW * solarFactor(t) * (0.82 + 0.18 * rand()));
  const loadW =
    12 +
    (aerRuns ? ACTUATORS.aeration.watts : 0) +
    (pumpRuns ? ACTUATORS.pump.watts : 0) +
    (circRuns ? ACTUATORS.circulation.watts : 0) +
    (irrigRuns ? ACTUATORS.irrigation.watts : 0);
  const hours = TICK_MS / 3_600_000;
  const battery = clamp(prev.battery + ((solarW - loadW) * hours * 100) / p.batteryWh, 5, 100);
  const pumpA = (pumpRuns ? 1.6 : 0) + (circRuns ? 0.8 : 0) + (irrigRuns ? 0.4 : 0) + (pumpRuns || circRuns ? noise(rand, 0.05) : 0);

  return {
    t,
    airTemp,
    humidity,
    waterLevel,
    ph,
    ec,
    waterTemp,
    do: dissolved,
    battery,
    solarW,
    loadW,
    pumpA: Math.max(0, pumpA),
    offline: sc.linkOutage,
  };
}

/* ------------------------------------------------------------------ */
/* Control                                                             */
/* ------------------------------------------------------------------ */

export type ControlReason = "manual" | "rule" | "schedule" | "interlock" | "hold";

export interface EffectiveActuator {
  on: boolean;
  reason: ControlReason;
  detail: string;
}

export type EffectiveActuators = Record<ActuatorKind, EffectiveActuator>;

export type ThresholdMap = Record<SensorKey, ThresholdDTO>;

function fmt(key: SensorKey, v: number) {
  return `${v.toFixed(SENSORS[key].decimals)} ${SENSORS[key].unit}`;
}

function scheduleIsOn(t: number, onMin: number, offMin: number) {
  const cycle = onMin + offMin;
  if (cycle <= 0) return false;
  const minuteOfDay = Math.floor(timorHour(t) * 60);
  return minuteOfDay % cycle < onMin;
}

/**
 * Decide what every actuator should be doing right now:
 *  manual   → the operator's command
 *  schedule → on/off cycle on the local clock
 *  auto     → hysteresis rules (ON past onValue, OFF past offValue, otherwise hold)
 * then apply safety interlocks, which override every mode — exactly like the
 * local rules on the controller that keep working without internet.
 */
export function computeActuators(args: {
  t: number;
  reading: Reading;
  actuators: ActuatorDTO[];
  rules: RuleDTO[];
  thresholds: ThresholdMap;
  previous: EffectiveActuators | null;
}): EffectiveActuators {
  const { t, reading, actuators, rules, thresholds, previous } = args;
  const out = {} as EffectiveActuators;

  for (const kind of ACTUATOR_KINDS) {
    const dto = actuators.find((a) => a.kind === kind);
    const prevOn = previous?.[kind]?.on ?? dto?.isOn ?? false;
    if (!dto) {
      out[kind] = { on: false, reason: "hold", detail: "Not installed" };
      continue;
    }
    if (dto.mode === "manual") {
      out[kind] = { on: dto.isOn, reason: "manual", detail: "Manual control" };
    } else if (dto.mode === "schedule") {
      const on = scheduleIsOn(t, dto.scheduleOnMin, dto.scheduleOffMin);
      out[kind] = { on, reason: "schedule", detail: `Schedule · ${dto.scheduleOnMin} min on / ${dto.scheduleOffMin} min off` };
    } else {
      const active = rules.filter((r) => r.actuator === kind && r.enabled);
      if (active.length === 0) {
        out[kind] = { on: prevOn, reason: "hold", detail: "Auto · no active rules, holding state" };
        continue;
      }
      let onRule: RuleDTO | null = null;
      let offCount = 0;
      for (const r of active) {
        const v = reading[r.sensor];
        const wantsOn = r.condition === "below" ? v < r.onValue : v > r.onValue;
        const wantsOff = r.condition === "below" ? v > r.offValue : v < r.offValue;
        if (wantsOn && !onRule) onRule = r;
        if (wantsOff) offCount++;
      }
      if (onRule) {
        out[kind] = {
          on: true,
          reason: "rule",
          detail: `Auto · ${SENSORS[onRule.sensor].short} ${fmt(onRule.sensor, reading[onRule.sensor])} ${onRule.condition} ${onRule.onValue}`,
        };
      } else if (offCount === active.length) {
        const r = active[0];
        out[kind] = {
          on: false,
          reason: "rule",
          detail: `Auto · ${SENSORS[r.sensor].short} back in range (${fmt(r.sensor, reading[r.sensor])})`,
        };
      } else {
        out[kind] = { on: prevOn, reason: "hold", detail: `Auto · holding ${prevOn ? "ON" : "OFF"} inside the hysteresis band` };
      }
    }
  }

  // Safety interlocks (run locally on the controller, even offline). Each has
  // its own hysteresis so it does not chatter around the limit.
  const wasLocked = (k: ActuatorKind) => previous?.[k]?.reason === "interlock";
  const doT = thresholds.do;
  if (doT && (reading.do < doT.criticalMin || (wasLocked("aeration") && reading.do < doT.criticalMin + 1))) {
    out.aeration = { on: true, reason: "interlock", detail: `Safety · oxygen ${fmt("do", reading.do)} near critical` };
  }
  const lvl = thresholds.waterLevel;
  const refilling = wasLocked("pump") && previous?.pump.on;
  const overflowing = wasLocked("pump") && previous?.pump.on === false;
  if (lvl && (reading.waterLevel < lvl.criticalMin || (refilling && reading.waterLevel < lvl.criticalMin + 20))) {
    out.pump = { on: true, reason: "interlock", detail: "Safety · refilling a critically low tank" };
    out.irrigation = { on: false, reason: "interlock", detail: "Safety · dry-run protection" };
    out.circulation = { on: false, reason: "interlock", detail: "Safety · dry-run protection" };
  } else if (lvl && (reading.waterLevel > lvl.criticalMax || (overflowing && reading.waterLevel > lvl.criticalMax - 5))) {
    out.pump = { on: false, reason: "interlock", detail: "Safety · overflow protection" };
  }
  return out;
}

export const toStates = (eff: EffectiveActuators): ActuatorStates =>
  Object.fromEntries(ACTUATOR_KINDS.map((k) => [k, eff[k].on])) as ActuatorStates;

export function sensorStatuses(reading: Reading, thresholds: ThresholdMap): Record<SensorKey, SensorStatus> {
  return Object.fromEntries(
    SENSOR_KEYS.map((k) => [k, thresholds[k] ? statusFor(reading[k], thresholds[k]) : "ok"]),
  ) as Record<SensorKey, SensorStatus>;
}

/**
 * Alarm state with debounce and deadband so a value hovering on a limit does
 * not flap: a warning needs two consecutive out-of-range readings (critical
 * fires at once), and an alarm only clears once the value is back inside the
 * normal band by a small margin.
 */
export function alarmStatus(
  value: number,
  t: ThresholdValues,
  prev: SensorStatus,
  streak: number,
  decimals: number,
): { status: SensorStatus; streak: number } {
  const raw = statusFor(value, t);
  if (prev === "ok") {
    if (raw === "critical") return { status: "critical", streak: 0 };
    if (raw === "warning") return streak + 1 >= 2 ? { status: "warning", streak: 0 } : { status: "ok", streak: streak + 1 };
    return { status: "ok", streak: 0 };
  }
  if (raw === "ok") {
    const margin = Math.max((t.max - t.min) * 0.03, 2 * 10 ** -decimals);
    const clear = value >= t.min + margin && value <= t.max - margin;
    return { status: clear ? "ok" : "warning", streak: 0 };
  }
  return { status: raw, streak: 0 };
}

/** Pump commanded on but drawing almost no current. */
export function pumpFaultDetected(reading: Reading, eff: EffectiveActuators) {
  return (eff.pump.on || eff.circulation.on) && reading.pumpA < 0.2;
}

export function healthScore(statuses: Record<SensorKey, SensorStatus>, pumpFault: boolean, offline: boolean) {
  let score = 100;
  for (const s of Object.values(statuses)) {
    if (s === "warning") score -= 10;
    if (s === "critical") score -= 25;
  }
  if (pumpFault) score -= 25;
  if (offline) score -= 5;
  return clamp(Math.round(score), 0, 100);
}

export function thresholdMap(thresholds: ThresholdDTO[], unitId: string): ThresholdMap {
  const map = {} as ThresholdMap;
  for (const t of thresholds) if (t.unitId === unitId) map[t.sensor] = t;
  return map;
}
