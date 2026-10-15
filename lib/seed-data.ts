import { CROPS, BUYERS, DEFAULT_PRESET, PRESETS, type ActuatorKind, type ActuatorMode, type HarvestStatus } from "./domain";
import { buildSetDefaults } from "./hubs";
import type {
  ActuatorDTO,
  AlertDTO,
  DashboardData,
  EventDTO,
  HarvestDTO,
  HubDTO,
  RuleDTO,
  ThresholdDTO,
  LedgerDTO,
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

export const SEED_HUBS: (HubDTO & { sortOrder: number })[] = [
  {
    id: "hub-dili",
    name: "VIEM Hub",
    kind: "hub",
    site: "Demonstration farm & training centre",
    location: "Near Dili",
    municipality: "Dili",
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
    installedAt: "2026-08-22",
    sortOrder: 2,
  },
];

/** The first set of each hub keeps the id the hub had before sets existed. */
export const SEED_UNITS: (UnitDTO & { sortOrder: number; harvest: string[] })[] = [
  { id: "hub-dili", hubId: "hub-dili", name: "Set 1", presetId: "aquaponics-tilapia", crops: "Lettuce, pak choi, kangkung, basil · Tilapia", fishCount: 600, tankLiters: 4000, operatorTeam: 5, sortOrder: 0, harvest: ["lettuce", "pak-choi", "kangkung", "basil", "tilapia"] },
  { id: "hub-dili-set2", hubId: "hub-dili", name: "Set 2", presetId: "nft-greens", crops: "Pak choi, kangkung", fishCount: 0, tankLiters: 1500, operatorTeam: 5, sortOrder: 1, harvest: ["pak-choi", "kangkung"] },
  { id: "hub-dili-set3", hubId: "hub-dili", name: "Set 3", presetId: "lettuce-vegetative", crops: "Lettuce", fishCount: 0, tankLiters: 1500, operatorTeam: 5, sortOrder: 2, harvest: ["lettuce"] },
  { id: "hub-dili-set4", hubId: "hub-dili", name: "Set 4", presetId: "basil-vegetative", crops: "Basil", fishCount: 0, tankLiters: 1200, operatorTeam: 5, sortOrder: 3, harvest: ["basil"] },
  { id: "hub-dili-set5", hubId: "hub-dili", name: "Set 5", presetId: "fingerling-nursery", crops: "Tilapia fingerlings", fishCount: 1200, tankLiters: 800, operatorTeam: 5, sortOrder: 4, harvest: ["tilapia"] },
  { id: "suku-aileu", hubId: "suku-aileu", name: "Set 1", presetId: "aquaponics-tilapia", crops: "Lettuce, pak choi, basil · Tilapia", fishCount: 300, tankLiters: 2000, operatorTeam: 4, sortOrder: 5, harvest: ["lettuce", "pak-choi", "basil", "tilapia"] },
  { id: "suku-liquica", hubId: "suku-liquica", name: "Set 1", presetId: "aquaponics-tilapia", crops: "Kangkung, lettuce · Tilapia", fishCount: 300, tankLiters: 2000, operatorTeam: 3, sortOrder: 6, harvest: ["kangkung", "lettuce", "tilapia"] },
];

const ACTUATOR_SEED: Record<string, Partial<Record<ActuatorKind, { mode: ActuatorMode; isOn: boolean; on?: number; off?: number }>>> = {
  "suku-aileu": { irrigation: { mode: "schedule", isOn: false, on: 20, off: 40 } },
  "suku-liquica": { pump: { mode: "manual", isOn: false }, irrigation: { mode: "auto", isOn: false } },
};

function isoDaysAgo(now: Date, days: number, hour = 9, minute = 0) {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(hour - 9, minute, 0, 0); // Timor local time → UTC
  return d.toISOString();
}

function dateDaysAgo(now: Date, days: number) {
  return isoDaysAgo(now, days).slice(0, 10);
}

const firstUnitOf = (hubId: string) => SEED_UNITS.find((u) => u.hubId === hubId)?.id;

export function buildSeed(now = new Date()) {
  const thresholds: Omit<ThresholdDTO, "id">[] = [];
  const actuators: Omit<ActuatorDTO, "id">[] = [];
  const rules: Omit<RuleDTO, "id">[] = [];
  const harvests: Omit<HarvestDTO, "id" | "paidAt">[] = [];
  const alerts: Omit<AlertDTO, "id">[] = [];
  const events: Omit<EventDTO, "id">[] = [];
  const ledger: Omit<LedgerDTO, "id">[] = [];

  for (const hub of SEED_HUBS) {
    const first = SEED_UNITS.find((u) => u.hubId === hub.id)!;
    events.push({
      unitId: first.id,
      category: "system",
      message: `${hub.name} commissioned — sensor kit and LoRa gateway online`,
      actor: "VIEM technician",
      createdAt: `${hub.installedAt}T02:00:00.000Z`,
    });
  }

  for (const unit of SEED_UNITS) {
    const hub = SEED_HUBS.find((h) => h.id === unit.hubId)!;
    const preset = PRESETS.find((p) => p.id === unit.presetId) ?? DEFAULT_PRESET;
    const defaults = buildSetDefaults(unit.id, preset, "VIEM technician", new Date(isoDaysAgo(now, 3)));
    thresholds.push(...defaults.thresholds);
    for (const a of defaults.actuators) {
      const o = ACTUATOR_SEED[unit.id]?.[a.kind];
      actuators.push(o ? { ...a, mode: o.mode, isOn: o.isOn, scheduleOnMin: o.on ?? a.scheduleOnMin, scheduleOffMin: o.off ?? a.scheduleOffMin } : a);
    }
    rules.push(...defaults.rules);

    // Eight weeks of harvest history — roughly the proposal's US$350–500/month per Suku Unit.
    const rand = mulberry32(unit.id.length * 7919 + unit.sortOrder * 104729);
    const scale = hub.kind === "hub" ? (unit.harvest.length > 2 ? 1.5 : 0.7) : unit.id === "suku-liquica" ? 0.85 : 1;
    const amounts: Record<string, { min: number; max: number; every?: number }> = {
      lettuce: { min: 9, max: 15 },
      "pak-choi": { min: 6, max: 10 },
      kangkung: { min: 5, max: 9 },
      basil: { min: 1.2, max: 2.4 },
      tilapia: { min: 11, max: 17, every: 2 },
    };
    const weekly = unit.harvest.map((crop) => ({ crop, ...amounts[crop] }));
    for (let w = 7; w >= 0; w--) {
      for (const [i, item] of weekly.entries()) {
        if (item.every && (w + unit.sortOrder) % item.every !== 0) continue;
        const crop = CROPS.find((c) => c.id === item.crop)!;
        const days = w * 7 + ((i + unit.sortOrder) % 5);
        const kg = Math.round((item.min + rand() * (item.max - item.min)) * scale * 10) / 10;
        const status: HarvestStatus = days > 5 ? "paid" : days > 2 ? "collected" : "logged";
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

    // Running costs in line with the proposal (roughly US$110 a month per Suku Unit).
    const size = hub.kind === "hub" ? 1.3 : 1;
    const first = unit.id === firstUnitOf(hub.id);
    const spend = (w: number, category: LedgerDTO["category"], amount: number, description: string, counterparty: string) =>
      ledger.push({ unitId: unit.id, type: "expense", category, amountCents: Math.round(amount * size * 100), date: dateDaysAgo(now, w * 7 + 1 + (unit.sortOrder % 3)), description, counterparty, reference: "" });
    for (let w = 0; w < 8; w++) {
      if (unit.fishCount > 0) spend(w, "Fish feed", 3 + unit.fishCount * 0.008, "Weekly fish feed", "Dili feed store");
      if (w % 4 === 0) {
        spend(w, "Nutrients", 9 + (w % 8) / 2, "Nutrients and compost inputs", "Cooperative");
        if (first) spend(w, "Utilities", 9, "Mobile data and power top-up", "Telecom");
      }
      if (w % 4 === 2) {
        spend(w, "Seeds & seedlings", 8, "Seedlings for the next planting", "Nursery");
        if (first) spend(w, "Transport", 10, "Transport of produce to buyers", "Local driver");
      }
    }

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
      actor: hub.kind === "hub" ? "Hub operator" : "Cooperative operator",
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

  return { thresholds, actuators, rules, harvests, alerts, events, ledger };
}

/** In-memory dataset used when the database is unreachable. */
export function buildFallbackData(note: string): DashboardData {
  const seed = buildSeed();
  let id = 1;
  const withId = <T,>(rows: T[]) => rows.map((r) => ({ ...r, id: id++ }));
  return {
    source: "fallback",
    sourceNote: note,
    hubs: SEED_HUBS.map(toHubDTO),
    units: SEED_UNITS.map(toUnitDTO),
    thresholds: withId(seed.thresholds),
    actuators: withId(seed.actuators),
    rules: withId(seed.rules),
    alerts: withId(seed.alerts).reverse(),
    events: withId(seed.events).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    harvests: withId(seed.harvests).map((h) => ({ ...h, paidAt: h.status === "paid" ? h.harvestedAt : null })).sort((a, b) => b.harvestedAt.localeCompare(a.harvestedAt)),
    ledger: withId(seed.ledger),
    presets: PRESETS,
  };
}

export function toHubDTO(h: HubDTO): HubDTO {
  return { id: h.id, name: h.name, kind: h.kind, site: h.site, location: h.location, municipality: h.municipality, installedAt: h.installedAt };
}

export function toUnitDTO(u: UnitDTO): UnitDTO {
  return {
    id: u.id,
    hubId: u.hubId,
    name: u.name,
    presetId: u.presetId,
    crops: u.crops,
    fishCount: u.fishCount,
    tankLiters: u.tankLiters,
    operatorTeam: u.operatorTeam,
  };
}
