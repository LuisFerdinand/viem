import { ACTUATORS, SENSOR_KEYS, type ActuatorKind } from "../domain";
import { financeSummary } from "../finance";
import { answerFromManual } from "../manual";
import { selectHub, selectUnit, setsOf, unacknowledged, unitLabel, type Snapshot } from "../sim/store";
import type { UnitDTO } from "../types";
import { todayInDili } from "../utils";
import { extractAmount, parseFarm, parseMoney, setNumber } from "./parse";
import type { BotDraft, ChatAction, MoneyDraft, Say, Tv } from "./types";

/** Build translatable bot copy. Keys must exist in the translation catalogue. */
export const t = (key: string, values?: Tv[]): Say => ({ key, values });
const say = (key: string, values?: Tv[]): BotDraft => ({ say: t(key, values) });

/** The set a message is about: "set 3" in the text, otherwise the one selected in the chat. */
function targetUnit(snap: Snapshot, text: string): UnitDTO | "missing" {
  const n = setNumber(text);
  if (n == null) return selectUnit(snap);
  const sets = setsOf(snap);
  return sets.find((u) => u.name.toLowerCase() === `set ${n}`) ?? sets[n - 1] ?? "missing";
}

const missing = (snap: Snapshot, text: string): BotDraft => say("I could not find set {0} in {1}.", [setNumber(text) ?? 0, selectHub(snap).name]);

/* ------------------------------------------------------------------ */
/* Farm chat                                                           */
/* ------------------------------------------------------------------ */

export function replyFarm(text: string, snap: Snapshot): BotDraft[] {
  const intent = parseFarm(text);
  const hubSets = setsOf(snap);

  if (intent.kind === "control" || intent.kind === "control-unclear" || intent.kind === "equipment" || intent.kind === "status") {
    const unit = targetUnit(snap, text);
    if (unit === "missing") return [missing(snap, text)];
    const live = snap.live[unit.id];
    const label = unitLabel(snap, unit.id);
    if (!live) return [say("I do not have readings for {0} yet. Please try again in a moment.", [label])];

    if (intent.kind === "control-unclear") return [say("Do you want to turn {0} on or off?", [{ k: ACTUATORS[intent.actuator].label }])];

    if (intent.kind === "control") {
      const dto = snap.data.actuators.find((a) => a.unitId === unit.id && a.kind === intent.actuator);
      const name = { k: ACTUATORS[intent.actuator].label };
      if (!dto) return [say("{0} is not installed in {1}.", [name, label])];
      const word = { k: intent.on ? "ON" : "OFF" };
      if (dto.mode === "manual" && live.actuators[intent.actuator].on === intent.on) return [say("{0} is already {1} in {2}.", [name, word, label])];
      const toManual = dto.mode !== "manual";
      const action: ChatAction = { kind: "control", unitId: unit.id, actuator: intent.actuator, on: intent.on, toManual };
      return [{ say: t(toManual ? "Turn {0} {1} in {2}? It runs automatically now, so I will switch it to By hand first." : "Turn {0} {1} in {2}?", [name, word, label]), card: { type: "confirm", action, state: "pending" } }];
    }

    if (intent.kind === "equipment") {
      const rows = (Object.keys(ACTUATORS) as ActuatorKind[]).flatMap((kind) => {
        const dto = snap.data.actuators.find((a) => a.unitId === unit.id && a.kind === kind);
        return dto ? [{ kind, on: live.actuators[kind].on, mode: dto.mode }] : [];
      });
      return [{ say: t("Here is the equipment in {0}.", [label]), card: { type: "equipment", label, rows } }];
    }

    const rows = SENSOR_KEYS.map((sensor) => ({ sensor, value: live.latest[sensor], status: live.statuses[sensor] }));
    return [{ say: t("Here is the latest scan for {0}.", [label]), card: { type: "status", label, rows } }];
  }

  if (intent.kind === "alerts") {
    const open = hubSets.flatMap((u) => unacknowledged(snap, u.id));
    if (!open.length) return [say("{0}: everything looks good. No open alerts.", [selectHub(snap).name])];
    return [{ say: t("{0}: {1} open alerts.", [selectHub(snap).name, open.length]), card: { type: "alerts", ids: open.map((a) => a.id) } }];
  }

  // Not a farm question: point to the chat that can help.
  if (parseMoney(text).kind !== "unknown") return [{ say: t("That sounds like money. The Money chat can record it."), card: { type: "switch", channel: "money" } }];
  if (answerFromManual(text).kind === "answer") return [{ say: t("That is a question for the manual. The Ask chat can answer it."), card: { type: "switch", channel: "ask" } }];
  return [say("I can check your farm, show alerts and turn equipment on or off. Tap a suggestion below, or type what you need.")];
}

/* ------------------------------------------------------------------ */
/* Money chat                                                          */
/* ------------------------------------------------------------------ */

function isoDaysAgo(today: string, days: number) {
  return new Date(Date.parse(`${today}T00:00:00Z`) - days * 86_400_000).toISOString().slice(0, 10);
}

function confirmEntry(snap: Snapshot, draft: MoneyDraft, amountCents: number): BotDraft {
  const unit = selectUnit(snap);
  const entry = { unitId: unit.id, type: draft.type, category: draft.category, amountCents, date: isoDaysAgo(todayInDili(), draft.daysAgo), description: draft.description, counterparty: "", reference: "" };
  return { say: t("Save this to your money book (Buku Besar)?"), card: { type: "confirm", action: { kind: "ledger", entry }, state: "pending" } };
}

export function replyMoney(text: string, snap: Snapshot, draft: MoneyDraft | null): { messages: BotDraft[]; draft: MoneyDraft | null } {
  if (draft) {
    const amount = extractAmount(text);
    if (amount != null && amount > 0 && amount <= 1_000_000) return { messages: [confirmEntry(snap, draft, Math.round(amount * 100))], draft: null };
    if (parseMoney(text).kind === "record") draft = null; // a fresh sentence replaces the unfinished one
    else return { messages: [say("I need an amount, for example 15 or $15.50.")], draft };
  }
  const intent = parseMoney(text);
  if (intent.kind === "record") {
    const next: MoneyDraft = { type: intent.type, category: intent.category, description: intent.description, daysAgo: intent.daysAgo };
    if (intent.amountCents == null) return { messages: [say(intent.type === "income" ? "How much did you receive (US$)?" : "How much did you spend (US$)?")], draft: next };
    return { messages: [confirmEntry(snap, next, intent.amountCents)], draft: null };
  }
  if (intent.kind === "summary") {
    const hub = selectHub(snap);
    const f = financeSummary(snap.data, setsOf(snap).map((u) => u.id), todayInDili());
    const spending = f.spending.map((s) => ({ category: s.category, amount: s.amount }));
    return { messages: [{ say: t("Here is the money summary for {0}, last 30 days.", [hub.name]), card: { type: "finance", label: hub.name, income: f.income, expense: f.expense, profit: f.profit, outstanding: f.outstanding, spending, focus: intent.focus } }], draft: null };
  }
  if (parseFarm(text).kind !== "unknown") return { messages: [{ say: t("That is about the farm. The Farm chat can help with it."), card: { type: "switch", channel: "farm" } }], draft: null };
  return { messages: [say("Tell me what you earned or spent, for example “Sold 5 kg lettuce for $15” or “Bought fish feed $12”. Or ask for your profit or expenses.")], draft: null };
}

/* ------------------------------------------------------------------ */
/* Ask chat                                                            */
/* ------------------------------------------------------------------ */

export function replyAsk(text: string): BotDraft[] {
  const res = answerFromManual(text);
  if (res.kind === "blocked") return [{ say: t("Tulun VIEM can't recommend chemicals, medicines or pesticides. I'm passing your question to a VIEM agronomist."), card: { type: "guardrail", escalate: text } }];
  if (res.kind === "unsure") return [{ say: t("Sorry, I don't have a confident answer in the manual. Shall I pass this to a VIEM agronomist?"), card: { type: "unsure", escalate: text } }];
  return [{ card: { type: "answer", entryId: res.entry.id, confidence: res.confidence, escalate: res.confidence < 0.6 ? text : undefined } }];
}
