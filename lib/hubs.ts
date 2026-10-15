import { ACTUATOR_KINDS, PRESETS, SENSOR_KEYS, type ActuatorKind, type ActuatorMode, type Preset } from "./domain";
import type { ActuatorDTO, RuleDTO, ThresholdDTO } from "./types";

/** Demo limits that keep the shared database and the simulation small. */
export const MAX_HUBS = 12;
export const MAX_SETS_PER_HUB = 8;

export const MUNICIPALITIES = ["Aileu", "Ainaro", "Atauro", "Baucau", "Bobonaro", "Cova Lima", "Dili", "Ermera", "Lautém", "Liquiçá", "Manatuto", "Manufahi", "Viqueque"] as const;

/** Default control rules; a growing profile's own rules take priority per actuator. */
export const DEFAULT_RULES: Omit<RuleDTO, "id" | "unitId">[] = [
  { actuator: "aeration", sensor: "do", condition: "below", onValue: 5.5, offValue: 7.2, enabled: true },
  { actuator: "pump", sensor: "waterLevel", condition: "below", onValue: 45, offValue: 85, enabled: true },
  { actuator: "circulation", sensor: "waterTemp", condition: "above", onValue: 28.5, offValue: 27.0, enabled: true },
  { actuator: "irrigation", sensor: "humidity", condition: "below", onValue: 62, offValue: 74, enabled: true },
];

type ActuatorSeed = { mode: ActuatorMode; isOn: boolean; on?: number; off?: number };
export const DEFAULT_ACTUATORS: Record<ActuatorKind, ActuatorSeed> = {
  pump: { mode: "auto", isOn: false },
  aeration: { mode: "auto", isOn: true },
  irrigation: { mode: "schedule", isOn: false, on: 15, off: 45 },
  circulation: { mode: "manual", isOn: true },
};

export const findPreset = (presets: Preset[], id: string) => presets.find((p) => p.id === id) ?? PRESETS.find((p) => p.id === id) ?? PRESETS[0];

/** Refill between the quarter and the 80% mark of the profile's normal tank-level band, so the pump never waits below the alarm limit. */
function refillBand(preset: Preset, rule: Omit<RuleDTO, "id" | "unitId">) {
  const { min, max } = preset.values.waterLevel;
  return { ...rule, onValue: Math.round(min + (max - min) * 0.25), offValue: Math.round(min + (max - min) * 0.8) };
}

/** Alarm limits, equipment and rules for a brand-new set that follows `preset`. */
export function buildSetDefaults(unitId: string, preset: Preset, updatedBy: string, now = new Date()) {
  const thresholds: Omit<ThresholdDTO, "id">[] = SENSOR_KEYS.map((sensor) => ({ unitId, sensor, ...preset.values[sensor], alarmEnabled: true }));
  const coveredByPreset = new Set(preset.rules.map((r) => r.actuator));
  const rules: Omit<RuleDTO, "id">[] = [
    ...preset.rules.map((r) => ({ ...r, unitId })),
    ...DEFAULT_RULES.filter((r) => !coveredByPreset.has(r.actuator)).map((r) => ({ ...(r.sensor === "waterLevel" ? refillBand(preset, r) : r), unitId })),
  ];
  const actuators: Omit<ActuatorDTO, "id">[] = ACTUATOR_KINDS.map((kind) => {
    const seed = DEFAULT_ACTUATORS[kind];
    return { unitId, kind, mode: seed.mode, isOn: seed.isOn, scheduleOnMin: seed.on ?? 15, scheduleOffMin: seed.off ?? 45, updatedAt: now.toISOString(), updatedBy };
  });
  return { thresholds, actuators, rules };
}

/** Short, URL-safe id such as `school-garden-k3f9` (at most 40 characters). */
export function newEntityId(name: string, random: () => number = Math.random) {
  const slug = name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 28).replace(/-+$/, "");
  const suffix = Array.from({ length: 4 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(random() * 36)]).join("");
  return `${slug || "item"}-${suffix}`;
}
