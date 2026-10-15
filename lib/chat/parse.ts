import type { ActuatorKind } from "../domain";
import type { LedgerDTO } from "../types";

/**
 * Plain-language understanding for Tulun VIEM chat. Keyword lists cover English,
 * Tetum, Bahasa Indonesia and Portuguese. Tetum wording is a draft for review by
 * native speakers. Everything here is pure so it can be tested without the UI.
 */

/** Lower-case, without accents, so "Oxigénio" and "oxigenio" match the same list entry. */
export const norm = (text: string) => text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Whole-word match; an entry ending in `*` matches any word starting with it. */
export function matches(text: string, words: readonly string[]) {
  const t = norm(text);
  return words.some((w) => new RegExp(w.endsWith("*") ? `(^|[^a-z0-9])${escape(w.slice(0, -1))}` : `(^|[^a-z0-9])${escape(w)}($|[^a-z0-9])`).test(t));
}

/* ------------------------------------------------------------------ */
/* Yes / no                                                            */
/* ------------------------------------------------------------------ */

const YES = ["yes", "y", "ok", "okay", "sure", "confirm", "do it", "sim", "sin", "ya", "iya", "oke", "loos", "confirmar", "konfirma"];
const NO = ["no", "n", "cancel", "stop that", "nope", "nao", "lae", "labele", "tidak", "batal", "cancelar", "kansela"];

export function parseYesNo(text: string): "yes" | "no" | null {
  const yes = matches(text, YES);
  const no = matches(text, NO);
  return yes === no ? null : yes ? "yes" : "no";
}

/* ------------------------------------------------------------------ */
/* Farm: equipment control, status, alerts                             */
/* ------------------------------------------------------------------ */

const ON_WORDS = ["on", "turn on", "switch on", "start", "activate", "enable", "run", "ligar", "liga", "ligue", "ativar", "ative", "ativa", "inicia*", "hahu*", "loke", "ativa*", "nyalakan", "hidupkan", "aktifkan", "nyala", "hidup", "jalankan"];
const OFF_WORDS = ["off", "turn off", "switch off", "stop", "deactivate", "disable", "shut", "desligar", "desliga", "desligue", "parar", "pare", "taka", "hapara", "hamate", "matikan", "mati", "hentikan", "padam"];

const EQUIPMENT: [ActuatorKind, readonly string[]][] = [
  ["aeration", ["aerat*", "aeras*", "aerador", "arejament*", "arejador", "air pump", "bomba de ar", "pompa udara", "oxygen", "oksij*", "oxigen*", "oksigen"]],
  ["irrigation", ["irrigat*", "irrigasaun", "irigasi", "watering", "water the plants", "siram*", "rega", "regar", "irrigacao"]],
  ["circulation", ["circulat*", "circulacao", "sirkulasaun", "sirkulasi*", "biofilter"]],
  ["pump", ["pump", "pompa", "bomba"]],
];

export function equipmentIn(text: string): ActuatorKind | null {
  return EQUIPMENT.find(([, words]) => matches(text, words))?.[0] ?? null;
}

/** "set 2", "in set 3", "seti 2" → 2 */
export function setNumber(text: string): number | null {
  const m = norm(text).match(/(?:^|[^a-z])set[i]?\s*#?\s*(\d{1,2})(?!\d)/);
  return m ? Number(m[1]) : null;
}

export type FarmIntent =
  | { kind: "control"; actuator: ActuatorKind; on: boolean; setNo: number | null }
  | { kind: "control-unclear"; actuator: ActuatorKind }
  | { kind: "equipment" }
  | { kind: "alerts" }
  | { kind: "status" }
  | { kind: "unknown" };

const ALERT_WORDS = ["alert*", "alarm*", "problem*", "wrong", "warning", "peringatan", "masalah", "aviso*", "bahaya"];
const EQUIPMENT_STATUS = ["equipment", "running", "what is on", "what is running", "ekipamentu", "peralatan", "equipamento", "mesin"];
const STATUS_WORDS = ["status", "how is", "how are", "how's", "reading*", "farm", "tank", "condition*", "today", "check", "overview", "sensor*", "temperature", "humidity", "ph", "oxygen", "estado", "como esta", "como estao", "leitura*", "quinta", "tanque", "temperatura", "humidade", "bagaimana", "kondisi", "keadaan", "kebun", "pembacaan", "suhu", "to'os", "estadu", "kondisaun", "tanke", "klima"];

export function parseFarm(text: string): FarmIntent {
  const actuator = equipmentIn(text);
  const on = matches(text, ON_WORDS);
  const off = matches(text, OFF_WORDS);
  if (actuator && (on || off)) return on && off ? { kind: "control-unclear", actuator } : { kind: "control", actuator, on, setNo: setNumber(text) };
  if (matches(text, EQUIPMENT_STATUS)) return { kind: "equipment" };
  if (matches(text, ALERT_WORDS)) return { kind: "alerts" };
  if (matches(text, STATUS_WORDS) || actuator) return { kind: "status" };
  return { kind: "unknown" };
}

/* ------------------------------------------------------------------ */
/* Money                                                               */
/* ------------------------------------------------------------------ */

const INCOME_VERBS = ["sold", "sell", "sale", "sales", "received", "earned", "got", "jual", "menjual", "terima", "dapat", "vendi", "vender", "vendeu", "vendemos", "recebi", "receber", "ganhei", "faan", "simu", "hetan", "reseita"];
const EXPENSE_VERBS = ["bought", "buy", "spent", "spend", "paid", "pay", "purchase*", "cost", "beli", "membeli", "bayar", "membayar", "habis", "biaya", "comprei", "comprar", "gastei", "gastar", "paguei", "pagar", "sosa", "selu", "gasta", "kompra", "despeza", "despesa"];
const MONEY_NOUNS = ["profit", "income", "expense*", "balance", "money", "earning*", "summary", "total", "this month", "lucro", "lukru", "laba", "saldo", "resumo", "ringkasan", "rendimento", "despeza*", "despesa*", "pemasukan", "pengeluaran", "osan", "reseita", "keuangan", "finance*", "financ*"];

const CATEGORIES: [LedgerDTO["category"], readonly string[]][] = [
  ["Fish feed", ["feed", "pakan", "racao", "hahan", "makanan ikan", "ration"]],
  ["Seeds & seedlings", ["seed*", "seedling*", "benih", "bibit", "semente*", "plantula*", "fini"]],
  ["Nutrients", ["nutrient*", "nutrisi", "fertili*", "pupuk", "adubo*", "kompostu", "compost", "composto"]],
  ["Maintenance", ["repair*", "fix*", "maintenance", "perbaik*", "servis", "reparo*", "reparacao", "manutencao", "konserta", "hadia"]],
  ["Equipment", ["equipment", "pump", "hose", "pipe", "tool*", "alat", "pompa", "peralatan", "equipamento*", "ekipamentu", "bomba", "tubo", "ferramenta*"]],
  ["Transport", ["transport*", "fuel", "petrol", "diesel", "bensin", "solar", "combustivel", "taxi", "kareta", "ongkos", "carro"]],
  ["Labor", ["labor", "labour", "wage*", "salary", "worker*", "gaji", "upah", "pekerja", "salario*", "trabalhador*", "serbisu"]],
  ["Utilities", ["electricity", "power", "internet", "data", "credit", "airtime", "pulsa", "listrik", "eletricidade", "electricidade", "energia", "kreditu", "kuriente"]],
];

export type MoneyIntent =
  | { kind: "record"; type: "income" | "expense"; amountCents: number | null; category: LedgerDTO["category"]; description: string; daysAgo: number }
  | { kind: "summary"; focus: "all" | "expense" }
  | { kind: "unknown" };

/** The amount in US$ mentioned in a sentence, ignoring weights, volumes and counts. */
export function extractAmount(input: string): number | null {
  const text = input.replace(/\bset[i]?\s*#?\d+/gi, " ");
  const number = (s: string) => {
    const clean = /,\d{3}(?!\d)/.test(s) ? s.replace(/,/g, "") : s.replace(",", ".");
    const n = Number(clean);
    return Number.isFinite(n) ? n : null;
  };
  const NUM = "(\\d{1,3}(?:,\\d{3})+(?:\\.\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?)(?!\\d)";
  const marked = text.match(new RegExp(`(?:us\\$|\\$|usd)\\s*${NUM}`, "i")) ?? text.match(new RegExp(`${NUM}\\s*(?:\\$|usd|dollars?|dolares?|dolar|dolár|dólares?)`, "i"));
  if (marked) return number(marked[1]);
  const unitless = [...text.matchAll(new RegExp(`${NUM}(?!\\s*(?:kg|kgs|kilo|kilos|quilos?|l\\b|lt|liters?|litres?|litros?|%|fish|ikan|peixes?|days?|hari|dias?|min))`, "gi"))];
  const last = unitless.at(-1);
  return last ? number(last[1]) : null;
}

export function categoryFor(text: string, type: "income" | "expense"): LedgerDTO["category"] {
  if (type === "income") return "Other income";
  return CATEGORIES.find(([, words]) => matches(text, words))?.[0] ?? "Other expense";
}

export function parseMoney(text: string): MoneyIntent {
  const income = matches(text, INCOME_VERBS);
  const expense = matches(text, EXPENSE_VERBS);
  const amount = extractAmount(text);
  const daysAgo = matches(text, ["yesterday", "ontem", "kemarin", "horiseik"]) ? 1 : 0;
  if (income !== expense) {
    const type = income ? "income" : "expense";
    const cents = amount != null && amount > 0 && amount <= 1_000_000 ? Math.round(amount * 100) : null;
    return { kind: "record", type, amountCents: cents, category: categoryFor(text, type), description: text.trim().slice(0, 240), daysAgo };
  }
  if (matches(text, MONEY_NOUNS)) return { kind: "summary", focus: matches(text, ["expense*", "despeza*", "despesa*", "pengeluaran", "spending", "costs"]) && !matches(text, ["profit", "income", "balance", "lucro", "lukru", "laba"]) ? "expense" : "all" };
  return { kind: "unknown" };
}
