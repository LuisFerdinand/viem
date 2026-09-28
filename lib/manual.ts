/**
 * A tiny "vetted VIEM growing manual" that Tulun VIEM is allowed to answer from.
 * Tetum strings are demo drafts — have them reviewed by a native speaker and
 * the VIEM agronomist before field use.
 */

export interface ManualEntry {
  id: string;
  section: string;
  keywords: string[];
  q: { tet: string; en: string };
  a: { tet: string; en: string };
  steps: string[];
}

export const MANUAL: ManualEntry[] = [
  {
    id: "yellow-leaves",
    section: "§4.2 Nutrients",
    keywords: ["yellow", "leaf", "leaves", "pale", "kinur", "tahan", "nutrient", "nutriente"],
    q: { tet: "Tanba sa mak alfase sira-nia tahan kinur?", en: "Why are the lettuce leaves turning yellow?" },
    a: {
      tet: "Tahan kinur bele tanba nutriente ki'ik ka pH aas liu. Sukat EC no pH. Se EC ki'ik, haree hahán ikan no kompostu.",
      en: "Yellow leaves usually mean low nutrients or a pH that is too high. Measure EC and pH. If EC is low, check fish feeding and the compost brew.",
    },
    steps: [
      "Check EC on the dashboard (normal 0.6–1.8 mS/cm)",
      "Check pH (normal 6.6–7.4)",
      "Compare the leaves with the photo checklist",
      "If it continues for 3 days, call the Hub",
    ],
  },
  {
    id: "fish-gasping",
    section: "§2.1 Oxygen",
    keywords: ["gasp", "gasping", "surface", "oxygen", "breath", "air", "nani", "leten", "oksijeniu", "oksijéniu"],
    q: { tet: "Ikan sira nani iha bee leten. Saida mak akontese?", en: "The fish are gasping at the surface. What is happening?" },
    a: {
      tet: "Ne'e sinal oksijéniu tun. Haree pompa ar agora no hamenus hahán ohin.",
      en: "That is a sign of low oxygen. Check the air pump now and feed less today.",
    },
    steps: [
      "Check the aerator is running and bubbles are strong",
      "Check the dissolved-oxygen reading",
      "Stop feeding until the fish behave normally",
      "If oxygen stays below 3.5 mg/L, call the Hub now",
    ],
  },
  {
    id: "green-water",
    section: "§2.4 Algae",
    keywords: ["green", "algae", "cloudy", "matak", "alga", "murky"],
    q: { tet: "Bee iha tanke sai matak.", en: "The tank water has turned green." },
    a: {
      tet: "Bee matak tanba alga barak. Taka tanke ho sombra. Labele hamamuk tanke.",
      en: "Green water means too much algae. Shade the tank from direct sun. Do not empty the tank.",
    },
    steps: ["Cover the tank with shade cloth", "Check the grow beds are taking up nutrients", "Algae are rarely dangerous — do not drain the tank"],
  },
  {
    id: "bad-smell",
    section: "§2.3 Ammonia",
    keywords: ["smell", "smells", "stink", "ammonia", "amonia", "fohan", "aat"],
    q: { tet: "Bee iha tanke fohan aat.", en: "The tank water smells bad." },
    a: {
      tet: "Fohan aat bele signifika amónia aas. Hamenus hahán, hamoos filtru no halo test strip.",
      en: "A bad smell can mean high ammonia. Feed less, clean the biofilter and do a test strip.",
    },
    steps: ["Feed half the normal amount for 2 days", "Clean solids from the filter", "Log a test strip in the dashboard", "Call the Hub if ammonia is above 1 ppm"],
  },
  {
    id: "feeding",
    section: "§3.1 Feeding",
    keywords: ["feed", "feeding", "food", "hahan", "hahán", "han", "how much", "dala"],
    q: { tet: "Ikan han dala hira loron ida?", en: "How often should I feed the fish?" },
    a: {
      tet: "Fó hahán dala rua loron ida. Fó de'it saida mak ikan han iha minutu lima.",
      en: "Feed twice a day. Give only what the fish eat in five minutes.",
    },
    steps: ["Feed in the morning and late afternoon", "Remove uneaten feed after 5 minutes", "Up to 40% of the feed can be BSF larvae"],
  },
  {
    id: "harvest-lettuce",
    section: "§5.1 Harvest",
    keywords: ["harvest", "lettuce", "ready", "pick", "alfase", "ku'u", "kuu", "bainhira", "when"],
    q: { tet: "Bainhira mak bele ku'u alfase?", en: "When can I harvest the lettuce?" },
    a: {
      tet: "Alfase prontu iha semana haat to'o nen. Ku'u dadeer, depois hakerek iha dashboard.",
      en: "Lettuce is ready in 4–6 weeks. Harvest in the morning, then log it in the dashboard.",
    },
    steps: ["Harvest in the cool of the morning", "Weigh and log the harvest for VIEM buy-back", "Replant the channel the same day"],
  },
  {
    id: "pump-stopped",
    section: "§6.2 Pumps & power",
    keywords: ["pump", "stopped", "not working", "broken", "pompa", "la'o", "lao", "power", "current", "eletrisidade"],
    q: { tet: "Pompa la la'o.", en: "The pump has stopped." },
    a: {
      tet: "Haree eletrisidade, bateria no pompa. Aeradór iha bateria, entaun ikan sei hetan oksijéniu. Telefone Hub se pompa la la'o iha minutu 30.",
      en: "Check the power, battery and pump. The aerator has its own battery, so the fish still get oxygen. Call the Hub if the pump is not running within 30 minutes.",
    },
    steps: ["Check the breaker and battery level", "Clear the pump intake of leaves", "Listen for the on-site buzzer — it means a safety rule fired", "Call the Hub after 30 minutes"],
  },
  {
    id: "low-ph",
    section: "§2.2 pH",
    keywords: ["ph", "acid", "acidic", "sour", "azedu"],
    q: { tet: "pH tun. Saida mak tenke halo?", en: "The pH is low. What should I do?" },
    a: {
      tet: "Labele tau kimiku rasik. Sukat fali ho test strip no telefone Hub — agrónomu VIEM sei ajuda.",
      en: "Do not add chemicals yourself. Re-test with a strip and call the Hub — a VIEM agronomist will help.",
    },
    steps: ["Re-test with a manual strip", "Log the result in the dashboard", "Call the Hub for the next step"],
  },
  {
    id: "bsf",
    section: "§7.1 Black soldier fly",
    keywords: ["bsf", "larvae", "larva", "soldier", "maggot", "waste", "foer", "compost", "kompostu"],
    q: { tet: "Oinsá atu hakiak larva BSF?", en: "How do I raise BSF larvae?" },
    a: {
      tet: "Tau foer hahán husi merkadu iha kaixa BSF. Larva sei han ne'e no sai hahán ba ikan.",
      en: "Put food waste from the market into the BSF bin. The larvae eat it and become fish feed.",
    },
    steps: ["Keep the bin shaded and moist, not wet", "Harvest larvae when they turn dark", "Use the frass as compost for the grow beds"],
  },
];

const BLOCKED = ["chemical", "pesticide", "medicine", "antibiotic", "drug", "kimiku", "pestisida", "ai-moruk", "aimoruk", "poison"];

export type ManualAnswer =
  | { kind: "answer"; entry: ManualEntry; confidence: number }
  | { kind: "blocked" }
  | { kind: "unsure" };

export function answerFromManual(question: string): ManualAnswer {
  const text = question.toLowerCase().normalize("NFC");
  if (BLOCKED.some((b) => text.includes(b))) return { kind: "blocked" };
  let best: ManualEntry | null = null;
  let bestScore = 0;
  for (const entry of MANUAL) {
    const score = entry.keywords.reduce((s, k) => (new RegExp(`(^|[^a-zà-ú'])${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(text) ? s + 1 : s), 0);
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }
  if (!best || bestScore === 0) return { kind: "unsure" };
  return { kind: "answer", entry: best, confidence: Math.min(0.95, 0.45 + bestScore * 0.18) };
}
