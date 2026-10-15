import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { replyAsk, replyFarm, replyMoney } from "../lib/chat/bot";
import { CHANNEL_COPY, CHIPS, WELCOME } from "../lib/chat/copy";
import { extractAmount, parseFarm, parseMoney, parseYesNo, setNumber } from "../lib/chat/parse";
import { buildFallbackData } from "../lib/seed-data";
import { DashboardStore } from "../lib/sim/store";
import { messages } from "../lib/translations";
import { messagesPt } from "../lib/translations-pt";

/** A store with simulated readings, without needing a browser window. */
function liveStore() {
  const store = new DashboardStore(buildFallbackData("test"));
  const internals = store as unknown as { backfill(now: number): unknown; set(patch: object): void };
  internals.set({ live: internals.backfill(Date.now()), ready: true });
  return store;
}

test("equipment commands are understood in English, Tetum, Indonesian and Portuguese", () => {
  const cases: [string, string, boolean][] = [
    ["Turn on aeration", "aeration", true],
    ["turn off the pump", "pump", false],
    ["Desliga a bomba", "pump", false],
    ["Ligar o arejamento", "aeration", true],
    ["Matikan pompa", "pump", false],
    ["Nyalakan irigasi", "irrigation", true],
    ["Loke pompa", "pump", true],
    ["start the circulation", "circulation", true],
    ["turn on the air pump", "aeration", true],
  ];
  for (const [text, actuator, on] of cases) {
    const intent = parseFarm(text);
    assert.equal(intent.kind, "control", text);
    if (intent.kind === "control") assert.deepEqual([intent.actuator, intent.on], [actuator, on], text);
  }
  assert.equal(parseFarm("turn the pump on or off").kind, "control-unclear");
  assert.equal(setNumber("turn on the pump in set 3"), 3);
  assert.equal(setNumber("the pump"), null);
});

test("status, alert and equipment questions route to the right farm intent", () => {
  assert.equal(parseFarm("How is my farm?").kind, "status");
  assert.equal(parseFarm("Como está a minha quinta?").kind, "status");
  assert.equal(parseFarm("Any alerts?").kind, "alerts");
  assert.equal(parseFarm("Ada peringatan?").kind, "alerts");
  assert.equal(parseFarm("What is running?").kind, "equipment");
  assert.equal(parseFarm("blah").kind, "unknown");
});

test("amounts ignore weights, counts and set numbers", () => {
  assert.equal(extractAmount("Sold 5 kg lettuce for $15"), 15);
  assert.equal(extractAmount("bought feed 12 dollars"), 12);
  assert.equal(extractAmount("sold lettuce 1,250"), 1250);
  assert.equal(extractAmount("spent 15,50"), 15.5);
  assert.equal(extractAmount("5 kg lettuce"), null);
  assert.equal(extractAmount("sold 150kg for 20"), 20);
  assert.equal(extractAmount("set 2 bought feed 8"), 8);
});

test("money messages become income or expense records, or a summary request", () => {
  assert.deepEqual(parseMoney("I sold something"), { kind: "record", type: "income", amountCents: null, category: "Other income", description: "I sold something", daysAgo: 0 });
  const feed = parseMoney("Bought fish feed $12");
  assert.ok(feed.kind === "record" && feed.type === "expense" && feed.category === "Fish feed" && feed.amountCents === 1200);
  const power = parseMoney("Paguei a eletricidade 20");
  assert.ok(power.kind === "record" && power.category === "Utilities" && power.amountCents === 2000);
  const sale = parseMoney("Jual selada 5 kg $15 kemarin");
  assert.ok(sale.kind === "record" && sale.type === "income" && sale.daysAgo === 1);
  assert.deepEqual(parseMoney("How much profit this month?"), { kind: "summary", focus: "all" });
  assert.deepEqual(parseMoney("Show my expenses"), { kind: "summary", focus: "expense" });
  assert.equal(parseMoney("hello").kind, "unknown");
  assert.equal(parseMoney("I spent money").kind, "record");
});

test("yes and no are understood in every language", () => {
  for (const y of ["yes", "Sim", "ya", "OK"]) assert.equal(parseYesNo(y), "yes", y);
  for (const n of ["no", "Não", "tidak", "cancel", "lae"]) assert.equal(parseYesNo(n), "no", n);
  assert.equal(parseYesNo("maybe later"), null);
});

test("controlling equipment asks for confirmation, and switches automatic equipment to hand first", () => {
  const snap = liveStore().getSnapshot();
  const auto = snap.data.actuators.find((a) => a.unitId === snap.selectedUnitId && a.kind === "aeration")!;
  assert.equal(auto.mode, "auto");
  const [msg] = replyFarm("turn off aeration", snap);
  assert.ok(msg.card?.type === "confirm" && msg.card.state === "pending");
  assert.ok(msg.card.action.kind === "control" && msg.card.action.toManual && msg.card.action.on === false);
  const [unknown] = replyFarm("turn on the pump in set 9", snap);
  assert.match(unknown.say?.key ?? "", /could not find set/);
  const [status] = replyFarm("how is my farm", snap);
  assert.ok(status.card?.type === "status" && status.card.rows.length === 7);
});

test("the money chat asks for a missing amount, then asks to confirm before saving", () => {
  const snap = liveStore().getSnapshot();
  const first = replyMoney("I sold something", snap, null);
  assert.ok(first.draft && first.messages[0].say?.key.startsWith("How much did you receive"));
  const second = replyMoney("15", snap, first.draft);
  assert.equal(second.draft, null);
  const card = second.messages[0].card;
  assert.ok(card?.type === "confirm" && card.action.kind === "ledger" && card.action.entry.amountCents === 1500 && card.action.entry.type === "income");
  const summary = replyMoney("profit", snap, null).messages[0].card;
  assert.ok(summary?.type === "finance");
});

test("offline, saving a confirmed money entry puts it in the ledger", async () => {
  const store = liveStore();
  const [msg] = replyMoney("Bought fish feed $12", store.getSnapshot(), null).messages;
  assert.ok(msg.card?.type === "confirm" && msg.card.action.kind === "ledger");
  const before = store.getSnapshot().data.ledger.length;
  assert.equal(await store.saveLedger(msg.card.action.entry), null);
  assert.equal(store.getSnapshot().data.ledger.length, before + 1);
});

test("questions are answered from the manual with guardrails and hand-over", () => {
  assert.equal(replyAsk("Why are the lettuce leaves turning yellow?")[0].card?.type, "answer");
  assert.equal(replyAsk("Can I use a pesticide?")[0].card?.type, "guardrail");
  assert.equal(replyAsk("What is the capital of Portugal?")[0].card?.type, "unsure");
});

test("chat messages are stored per channel and can be updated", () => {
  const store = liveStore();
  const id = store.chatAdd("farm", { say: { key: "Hello" } });
  store.chatAdd("money", { from: "user", text: "hi" });
  assert.equal(store.getSnapshot().chat.farm.length, 1);
  assert.equal(store.getSnapshot().chat.money[0].from, "user");
  store.chatPatch("farm", id, (m) => ({ ...m, text: "edited" }));
  assert.equal(store.getSnapshot().chat.farm[0].text, "edited");
});

test("every sentence and suggestion in the chat has a translation in all languages", () => {
  const keys = new Set<string>();
  const src = fs.readFileSync(new URL("../lib/chat/bot.ts", import.meta.url), "utf8");
  for (const m of src.matchAll(/\b(?:t|say)\(\s*"((?:[^"\\\n]|\\.)+)"/g)) keys.add(JSON.parse(`"${m[1]}"`));
  for (const m of src.matchAll(/\? "((?:[^"\\\n]|\\.)+)" : "((?:[^"\\\n]|\\.)+)"/g)) if (m[1].length > 12) [m[1], m[2]].forEach((k) => keys.add(k));
  for (const c of Object.values(CHANNEL_COPY)) { keys.add(c.label); keys.add(c.blurb); }
  for (const list of Object.values(CHIPS)) list.forEach((k) => keys.add(k));
  Object.values(WELCOME).forEach((k) => keys.add(k));
  assert.ok(keys.size > 35, `found only ${keys.size} chat strings`);
  const missing = [...keys].filter((k) => !(k in messages) || !(k in messagesPt));
  assert.deepEqual(missing, []);
});
