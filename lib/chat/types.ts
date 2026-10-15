import type { ActuatorKind, ActuatorMode, SensorKey, SensorStatus } from "../domain";
import type { LedgerDTO } from "../types";

export const CHAT_CHANNELS = ["farm", "money", "ask"] as const;
export type ChatChannel = (typeof CHAT_CHANNELS)[number];

/** A value inside a sentence: plain text/number, or `{ k }` — a phrase translated when it is shown. */
export type Tv = string | number | { k: string };

/** Bot copy is kept as an English template plus values so it follows the language setting. */
export interface Say {
  key: string;
  values?: Tv[];
}

/** Something Tulun VIEM will only do after the person taps Yes. */
export type ChatAction =
  | { kind: "control"; unitId: string; actuator: ActuatorKind; on: boolean; toManual: boolean }
  | { kind: "ledger"; entry: Omit<LedgerDTO, "id"> }
  | { kind: "agronomist"; unitId: string; question: string };

export type ConfirmState = "pending" | "done" | "cancelled";

export type ChatCard =
  | { type: "status"; label: string; rows: { sensor: SensorKey; value: number; status: SensorStatus }[] }
  | { type: "equipment"; label: string; rows: { kind: ActuatorKind; on: boolean; mode: ActuatorMode }[] }
  | { type: "alerts"; ids: number[] }
  | { type: "confirm"; action: ChatAction; state: ConfirmState }
  | { type: "finance"; label: string; income: number; expense: number; profit: number; outstanding: number; spending: { category: string; amount: number }[]; focus: "all" | "expense" }
  | { type: "answer"; entryId: string; confidence: number; escalate?: string }
  | { type: "guardrail"; escalate: string }
  | { type: "unsure"; escalate: string }
  | { type: "switch"; channel: ChatChannel };

export interface ChatMessage {
  id: number;
  t: number;
  from: "user" | "bot";
  /** A typed sentence from the person. */
  text?: string;
  /** Translated copy: bot sentences, and the person's taps on a suggestion chip. */
  say?: Say;
  card?: ChatCard;
}

export type BotDraft = Omit<ChatMessage, "id" | "t" | "from">;

/** A half-finished income or expense while Tulun VIEM waits for the amount. */
export interface MoneyDraft {
  type: "income" | "expense";
  category: LedgerDTO["category"];
  description: string;
  daysAgo: number;
}
