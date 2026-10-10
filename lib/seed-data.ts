import {
  ACTUATOR_KINDS,
  CROPS,
  BUYERS,
  DEFAULT_PRESET,
  PRESETS,
  SENSOR_KEYS,
  type ActuatorKind,
  type ActuatorMode,
  type HarvestStatus,
} from "./domain";
import type {
  ActuatorDTO,
  AlertDTO,
  DashboardData,
  EventDTO,
  HarvestDTO,
  RuleDTO,
  ThresholdDTO,
  UnitDTO,
} from "./types";

/** Deterministic PRNG so seeded demo data looks the same on every reset. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SEED_UNITS: (UnitDTO & { sortOrder: number })[] = [
  {
    id: "hub-dili",
    name: "VIEM Hub",
    kind: "hub",
    site: "Demonstration farm & training centre",
    location: "Near Dili",
    municipality: "Dili",
    crops: "Lettuce, pak choi, kangkung, basil · Tilapia",
    fishCount: 600,
    tankLiters: 4000,
    operatorTeam: 5,
    installedAt: "2026-07-01",
    sortOrder: 0,
  },
  {
    id: "suku-aileu",
    name: "Suku Unit 01",
    kind: "suku",
    site: "School site",
    location: "Highland school garden",
    municipality: "Aileu",
    crops: "Lettuce, pak choi, basil · Tilapia",
    fishCount: 300,
    tankLiters: 2000,
    operatorTeam: 4,
    installedAt: "2026-08-15",
    sortOrder: 1,
  },
  {
    id: "suku-liquica",
    name: "Suku Unit 02",
    kind: "suku",
    site: "Suco office",
    location: "Coastal suco office",
    municipality: "Liquiçá",
    crops: "Kangkung, lettuce · Tilapia",
    fishCount: 300,
    tankLiters: 2000,
    operatorTeam: 3,
    installedAt: "2026-08-22",
    sortOrder: 2,
  },
];

type ActuatorSeed = { mode: ActuatorMode; isOn: boolean; on?: number; off?: number };

const ACTUATOR_SEED: Record<string, Record<ActuatorKind, ActuatorSeed>> = {
  "hub-dili": {
    pump: { mode: "auto", isOn: false },
    aeration: { mode: "auto", isOn: true },
    irrigation: { mode: "schedule", isOn: false, on: 15, off: 45 },
    circulation: { mode: "manual", isOn: true },
  },
  "suku-aileu": {
    pump: { mode: "auto", isOn: false },
    aeration: { mode: "auto", isOn: true },
    irrigation: { mode: "schedule", isOn: false, on: 20, off: 40 },
    circulation: { mode: "manual", isOn: true },
  },
  "suku-liquica": {
    pump: { mode: "manual", isOn: false },
    aeration: { mode: "auto", isOn: true },
    irrigation: { mode: "auto", isOn: false },
    circulation: { mode: "manual", isOn: true },
  },
};

export const DEFAULT_RULES: Omit<RuleDTO, "id" | "unitId">[] = [
  { actuator: "aeration", sensor: "do", condition: "below", onValue: 5.5, offValue: 7.2, enabled: true },
  { actuator: "pump", sensor: "waterLevel", condition: "below", onValue: 45, offValue: 85, enabled: true },
  { actuator: "circulation", sensor: "waterTemp", condition: "above", onValue: 28.5, offValue: 27.0, enabled: true },
  { actuator: "irrigation", sensor: "humidity", condition: "below", onValue: 62, offValue: 74, enabled: true },
];

function isoDaysAgo(now: Date, days: number, hour = 9, minute = 0) {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(hour - 9, minute, 0, 0); // Timor local time → UTC
  return d.toISOString();
}

function dateDaysAgo(now: Date, days: number) {
  return isoDaysAgo(now, days).slice(0, 10);
}

export function buildSeed(now = new Date()) {
  const thresholds: Omit<ThresholdDTO, "id">[] = [];
  const actuators: Omit<ActuatorDTO, "id">[] = [];
  const rules: Omit<RuleDTO, "id">[] = [];
  const harvests: Omit<HarvestDTO, "id" | "paidAt">[] = [];
  const alerts: Omit<AlertDTO, "id">[] = [];
  const events: Omit<EventDTO, "id">[] = [];

  for (const unit of SEED_UNITS) {
    for (const sensor of SENSOR_KEYS) {
      thresholds.push({ unitId: unit.id, sensor, ...DEFAULT_PRESET.values[sensor], alarmEnabled: true });
    }
    for (const kind of ACTUATOR_KINDS) {
      const s = ACTUATOR_SEED[unit.id][kind];
      actuators.push({
        unitId: unit.id,
        kind,
        mode: s.mode,
        isOn: s.isOn,
        scheduleOnMin: s.on ?? 15,
        scheduleOffMin: s.off ?? 45,
        updatedAt: isoDaysAgo(now, 3),
        updatedBy: "VIEM technician",
      });
    }
    for (const r of DEFAULT_RULES) rules.push({ ...r, unitId: unit.id });

    // Eight weeks of harvest history — roughly the proposal's US$350–500/month per Suku Unit.
    const rand = mulberry32(unit.id.length * 7919 + unit.sortOrder * 104729);
    const scale = unit.kind === "hub" ? 1.5 : unit.id === "suku-liquica" ? 0.85 : 1;
    const weekly: { crop: string; min: number; max: number; every?: number }[] = [
      { crop: "lettuce", min: 9, max: 15 },
      { crop: "pak-choi", min: 6, max: 10 },
      { crop: "kangkung", min: 5, max: 9 },
      { crop: "basil", min: 1.2, max: 2.4 },
      { crop: "tilapia", min: 22, max: 34, every: 4 },
    ];
    for (let w = 7; w >= 0; w--) {
      for (const [i, item] of weekly.entries()) {
        if (item.every && (w + unit.sortOrder) % item.every !== 0) continue;
        const crop = CROPS.find((c) => c.id === item.crop)!;
        const days = w * 7 + ((i + unit.sortOrder) % 5);
        const kg = Math.round((item.min + rand() * (item.max - item.min)) * scale * 10) / 10;
        const status: HarvestStatus = days > 14 ? "paid" : days > 5 ? "collected" : "logged";
        harvests.push({
          unitId: unit.id,
          crop: crop.id,
          category: crop.category,
          weightKg: kg,
          pricePerKg: crop.floorPrice,
          buyer: crop.category === "fish" ? "Local market" : BUYERS[(w + i + unit.sortOrder) % BUYERS.length],
          status,
          harvestedAt: dateDaysAgo(now, days),
        });
      }
    }

    events.push({
      unitId: unit.id,
      category: "system",
      message: `${unit.name} commissioned — sensor kit and LoRa gateway online`,
      actor: "VIEM technician",
      createdAt: `${unit.installedAt}T02:00:00.000Z`,
    });
    events.push({
      unitId: unit.id,
      category: "maintenance",
      message: "Monthly sensor calibration completed (pH 4.0/7.0 buffers, EC 1.41 mS/cm)",
      actor: "VIEM technician",
      createdAt: isoDaysAgo(now, 12, 10),
    });
    events.push({
      unitId: unit.id,
      category: "maintenance",
      message: "Weekly manual test strip logged — pH 7.0, ammonia 0.25 ppm",
      actor: "Cooperative operator",
      createdAt: isoDaysAgo(now, 2, 8, 30),
    });
  }

  // A little alert history so the alert log is not empty on first load.
  alerts.push(
    {
      unitId: "suku-liquica",
      code: "do",
      severity: "warning",
      value: 4.8,
      messageTet: "Oksijéniu tun. Haree pompa ar agora.",
      messageEn: "Oxygen is low. Check the air pump now.",
      channel: "whatsapp",
      createdAt: isoDaysAgo(now, 4, 14, 12),
      resolvedAt: isoDaysAgo(now, 4, 14, 40),
      acknowledgedAt: isoDaysAgo(now, 4, 14, 31),
      acknowledgedBy: "Cooperative operator",
      note: "Air hose had come loose — reconnected.",
    },
    {
      unitId: "hub-dili",
      code: "waterTemp",
      severity: "warning",
      value: 30.6,
      messageTet: "Bee manas liu. Taka tanke ho sombra no loke sirkulasaun.",
      messageEn: "Water is too hot. Shade the tank and turn on circulation.",
      channel: "whatsapp",
      createdAt: isoDaysAgo(now, 2, 15, 5),
      resolvedAt: isoDaysAgo(now, 2, 16, 20),
      acknowledgedAt: isoDaysAgo(now, 2, 15, 22),
      acknowledgedBy: "Hub operator",
      note: "Extra shade cloth fitted over the tank.",
    },
    {
      unitId: "suku-aileu",
      code: "waterLevel",
      severity: "warning",
      value: 38,
      messageTet: "Nivel bee iha tanke tun. Haree pompa no kanu.",
      messageEn: "Tank water level is low. Check the pump and pipes.",
      channel: "sms",
      createdAt: isoDaysAgo(now, 1, 7, 50),
      resolvedAt: isoDaysAgo(now, 1, 8, 35),
      acknowledgedAt: isoDaysAgo(now, 1, 8, 5),
      acknowledgedBy: "School operator",
      note: "Rain tank was empty after the dry week — refilled from the school supply.",
    },
  );

  return { thresholds, actuators, rules, harvests, alerts, events };
}

/** In-memory dataset used when the database is unreachable. */
export function buildFallbackData(note: string): DashboardData {
  const seed = buildSeed();
  let id = 1;
  const withId = <T,>(rows: T[]) => rows.map((r) => ({ ...r, id: id++ }));
  return {
    source: "fallback",
    sourceNote: note,
    units: SEED_UNITS.map(toUnitDTO),
    thresholds: withId(seed.thresholds),
    actuators: withId(seed.actuators),
    rules: withId(seed.rules),
    alerts: withId(seed.alerts).reverse(),
    events: withId(seed.events).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    harvests: withId(seed.harvests).map((h) => ({ ...h, paidAt: h.status === "paid" ? h.harvestedAt : null })).sort((a, b) => b.harvestedAt.localeCompare(a.harvestedAt)),
    ledger: [],
    presets: PRESETS,
  };
}

export function toUnitDTO(u: UnitDTO): UnitDTO {
  return {
    id: u.id,
    name: u.name,
    kind: u.kind,
    site: u.site,
    location: u.location,
    municipality: u.municipality,
    crops: u.crops,
    fishCount: u.fishCount,
    tankLiters: u.tankLiters,
    operatorTeam: u.operatorTeam,
    installedAt: u.installedAt,
  };
}
