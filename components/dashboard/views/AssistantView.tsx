"use client";

import { BookOpen, Check, HelpCircle, Languages, MessageSquareText, Phone, ScrollText, Send, Sprout, Wallet, X, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { LogoMark } from "@/components/ui/Logo";
import { replyAsk, replyFarm, replyMoney, t } from "@/lib/chat/bot";
import { CHANNEL_COPY, CHIPS, WELCOME } from "@/lib/chat/copy";
import { parseYesNo } from "@/lib/chat/parse";
import type { BotDraft, ChatChannel, ChatMessage, MoneyDraft } from "@/lib/chat/types";
import { ACTUATORS } from "@/lib/domain";
import { LANGUAGES } from "@/lib/i18n";
import { MANUAL } from "@/lib/manual";
import { selectHub, selectUnit, unacknowledged, unitLabel } from "@/lib/sim/store";
import { cn } from "@/lib/utils";
import { AlertBubble, Bubble, CHANNEL_ORDER, MessageBubble, useSay } from "../chat/ChatParts";
import { Disclosure } from "../Disclosure";
import { useSnapshot, useStore } from "../DashboardProvider";
import { useLanguage } from "../LanguageProvider";
import { Card, Pill } from "../ui";

const MAY = ["Explain sensor alerts and first-response steps", "Answer from the vetted VIEM manual, with sources", "Escalate to a named VIEM agronomist"];
const MAY_NOT = ["Recommend chemicals, medicines or pesticides", "Invent answers outside the manual", "Close an alert without human confirmation"];

const CHANNEL_ICON: Record<ChatChannel, LucideIcon> = { farm: Sprout, money: Wallet, ask: HelpCircle };

type Item = { key: string; t: number; alertId?: number; message?: ChatMessage };

export function AssistantView() {
  const { tr, language } = useLanguage();
  const say = useSay();
  const snap = useSnapshot();
  const store = useStore();
  const unit = selectUnit(snap);
  const hub = selectHub(snap);
  const [channel, setChannel] = useState<ChatChannel>("farm");
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const draft = useRef<MoneyDraft | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Alerts arrive as messages in the Farm chat, newest at the bottom, mixed with the conversation.
  const items = useMemo<Item[]>(() => {
    const talk = snap.chat[channel].map((m) => ({ key: `m${m.id}`, t: m.t, message: m }));
    if (channel !== "farm") return talk;
    const alerts = snap.data.alerts.slice(0, 20).map((a) => ({ key: `a${a.id}`, t: new Date(a.createdAt).getTime(), alertId: a.id }));
    return [...alerts, ...talk].sort((a, b) => a.t - b.t);
  }, [channel, snap.chat, snap.data.alerts]);

  const open = unacknowledged(snap).length;
  const last = items.at(-1)?.key;
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [last, typing, channel]);

  function reply(ch: ChatChannel, drafts: BotDraft[]) {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      for (const d of drafts) store.chatAdd(ch, d);
    }, 500);
  }

  /** The unanswered Yes/No card at the bottom of a chat, if any. */
  const pendingConfirm = (ch: ChatChannel) => {
    const m = store.getSnapshot().chat[ch].at(-1);
    return m?.card?.type === "confirm" && m.card.state === "pending" ? m : null;
  };

  async function resolve(ch: ChatChannel, m: ChatMessage, accept: boolean) {
    if (m.card?.type !== "confirm" || m.card.state !== "pending") return;
    const action = m.card.action;
    const mark = (state: "done" | "cancelled") => store.chatPatch(ch, m.id, (x) => (x.card?.type === "confirm" ? { ...x, card: { ...x.card, state } } : x));
    if (!accept) {
      mark("cancelled");
      return reply(ch, [{ say: t("Okay, I cancelled that.") }]);
    }
    if (action.kind === "control") {
      const name = { k: ACTUATORS[action.actuator].label };
      if (action.toManual) await store.setActuatorMode(action.unitId, action.actuator, "manual");
      await store.setActuatorPower(action.unitId, action.actuator, action.on);
      const now = store.getSnapshot().live[action.unitId]?.actuators[action.actuator]?.on;
      mark("done");
      const label = unitLabel(store.getSnapshot(), action.unitId);
      return reply(ch, [now === action.on
        ? { say: t("Done. {0} is now {1} in {2}.", [name, { k: action.on ? "ON" : "OFF" }, label]) }
        : { say: t("{0} stays {1} because of a safety rule. Check the Equipment page for details.", [name, { k: now ? "ON" : "OFF" }]) }]);
    }
    if (action.kind === "ledger") {
      const err = await store.saveLedger(action.entry);
      if (err) return reply(ch, [{ say: t(err) }]);
      mark("done");
      return reply(ch, [{ say: t("Saved. You can see it in Buku Besar.") }]);
    }
    store.escalateToAgronomist(action.unitId, action.question);
    mark("done");
    reply(ch, [{ say: t("Done. A VIEM agronomist will reply on WhatsApp — within two hours.") }]);
  }

  function escalate(ch: ChatChannel, question: string) {
    store.escalateToAgronomist(unit.id, question);
    reply(ch, [{ say: t("Done. A VIEM agronomist will reply on WhatsApp — within two hours.") }]);
  }

  /** `shown` is what the person sees as their message; `parse` is what the bot reads (chips are English). */
  function send(ch: ChatChannel, shown: string, parse = shown) {
    const text = shown.trim();
    if (!text || typing) return;
    const pending = pendingConfirm(ch);
    store.chatAdd(ch, { from: "user", text });
    setInput("");
    const yesNo = parseYesNo(parse);
    if (pending && yesNo) return void resolve(ch, pending, yesNo === "yes");
    if (ch === "money" && draft.current && yesNo === "no") {
      draft.current = null;
      return reply(ch, [{ say: t("Okay, I cancelled that.") }]);
    }
    const snapshot = store.getSnapshot();
    if (ch === "farm") return reply(ch, replyFarm(parse, snapshot));
    if (ch === "ask") return reply(ch, replyAsk(parse));
    const result = replyMoney(parse, snapshot, draft.current);
    draft.current = result.draft;
    reply(ch, result.messages);
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(channel, input);
  };

  const chips = channel === "ask" ? MANUAL.slice(0, 6).map((e) => ({ shown: language === "tet" ? e.q.tet : tr(e.q.en), parse: e.q.en })) : CHIPS[channel].map((c) => ({ shown: tr(c), parse: c }));
  const welcome = { say: t(WELCOME[channel]) } satisfies BotDraft;

  return (
    <div className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <section aria-label={tr("Chat with Tulun VIEM")} className="flex h-[calc(100dvh-10.5rem)] min-h-[30rem] flex-col overflow-hidden bg-[#efeae2] shadow-soft sm:h-[calc(100dvh-15rem)] sm:rounded-3xl sm:border sm:border-forest-100">
        <header className="bg-forest-800 px-3 pt-3 text-white">
          <div className="flex items-center gap-3 pb-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white"><LogoMark className="h-6 w-auto" /></span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="font-semibold">{tr("Tulun VIEM")}</p>
              <p className="text-xs text-forest-200">{typing ? tr("Typing…") : tr("Helping {0}", [unitLabel(snap, unit.id)])}</p>
            </div>
            <label className="relative min-w-0 max-w-[45%]">
              <span className="sr-only">{tr("Selected farm")}</span>
              <select value={unit.id} onChange={(e) => store.selectUnit(e.target.value)} className="h-10 w-full truncate rounded-full border-0 bg-white/10 px-3 text-xs font-semibold text-white [&>option]:text-forest-900">
                {snap.data.units.map((u) => <option key={u.id} value={u.id}>{unitLabel(snap, u.id)}</option>)}
              </select>
            </label>
            <Pill tone="leaf" className="hidden sm:inline-flex"><Languages className="size-3" aria-hidden="true" /> {LANGUAGES.find((l) => l.code === language)?.label}</Pill>
          </div>
          <div role="tablist" aria-label={tr("Chats")} className="grid grid-cols-3 gap-1">
            {CHANNEL_ORDER.map((c) => {
              const { icon: Icon, label } = { icon: CHANNEL_ICON[c], label: CHANNEL_COPY[c].label };
              const active = c === channel;
              return (
                <button key={c} type="button" role="tab" aria-selected={active} onClick={() => setChannel(c)} className={cn("relative flex min-h-12 items-center justify-center gap-1.5 border-b-[3px] text-sm font-semibold transition-colors", active ? "border-leaf-300 text-white" : "border-transparent text-forest-200 hover:text-white")}>
                  <Icon className="size-4" aria-hidden="true" /> {tr(label)}
                  {c === "farm" && open > 0 && <span className="min-w-5 rounded-full bg-crit-500 px-1.5 text-center text-[11px] leading-5 font-semibold text-white">{open}</span>}
                </button>
              );
            })}
          </div>
        </header>

        <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-4" aria-live="polite">
          <p className="mx-auto max-w-xs rounded-lg bg-white/70 px-3 py-1.5 text-center text-xs text-forest-700">{tr(CHANNEL_COPY[channel].blurb)}</p>
          <Bubble from="bot"><p className="text-forest-950">{say(welcome.say)}</p></Bubble>
          {items.map((it) => it.alertId != null
            ? (() => { const a = snap.data.alerts.find((x) => x.id === it.alertId); return a ? <AlertBubble key={it.key} alert={a} /> : null; })()
            : it.message && <MessageBubble key={it.key} message={it.message} onResolve={(accept) => void resolve(channel, it.message!, accept)} onEscalate={(q) => escalate(channel, q)} onSwitch={setChannel} />)}
          {typing && (
            <div className="flex justify-start" aria-label={tr("Tulun VIEM is typing")}>
              <span className="flex gap-1 rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm">
                {[0, 1, 2].map((i) => <span key={i} className="size-1.5 animate-bounce rounded-full bg-forest-400" style={{ animationDelay: `${i * 120}ms` }} />)}
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-black/5 bg-white/70 px-3 pt-2">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {chips.map((c) => (
              <button key={c.parse} type="button" disabled={typing} onClick={() => send(channel, c.shown, c.parse)} className="min-h-10 shrink-0 rounded-full bg-white px-3.5 text-xs font-semibold text-water-700 ring-1 ring-water-100 hover:bg-water-50 disabled:opacity-50">
                {c.shown}
              </button>
            ))}
          </div>
        </div>
        <form className="flex items-center gap-2 bg-white/70 px-3 pb-3" onSubmit={onSubmit}>
          <label htmlFor="tulun-input" className="sr-only">{tr("Ask Tulun VIEM")}</label>
          <input id="tulun-input" value={input} onChange={(e) => setInput(e.target.value)} maxLength={300} autoComplete="off" placeholder={tr(channel === "money" ? "Type what you earned or spent…" : channel === "farm" ? "Type a message…" : "Type a question…")} className="h-12 min-w-0 flex-1 rounded-full border border-forest-200 bg-white px-4 text-base focus:border-leaf-500 focus:outline-none sm:text-sm" />
          <button type="submit" disabled={!input.trim() || typing} aria-label={tr("Send")} className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-forest-800 text-white hover:bg-forest-700 disabled:opacity-40"><Send className="size-4" /></button>
        </form>
      </section>

      <div className="grid content-start gap-6 px-4 pb-6 sm:px-0 sm:pb-0">
        <Disclosure title={tr("What the assistant can help with")}>
          <Card title={tr("Guardrails")} description={tr("What Tulun VIEM may and may not do.")}>
            <div className="grid gap-4">
              <ul className="space-y-2">{MAY.map((m) => <li key={m} className="flex items-start gap-2 text-sm text-forest-800"><Check className="mt-0.5 size-4 shrink-0 text-leaf-600" aria-hidden="true" /> {tr(m)}</li>)}</ul>
              <ul className="space-y-2">{MAY_NOT.map((m) => <li key={m} className="flex items-start gap-2 text-sm text-forest-800"><X className="mt-0.5 size-4 shrink-0 text-crit-700" aria-hidden="true" /> {tr(m)}</li>)}</ul>
            </div>
            <p className="mt-4 rounded-xl bg-forest-50 p-3 text-xs text-muted">{tr("Equipment only changes after you tap Yes, and an alert only closes when a person confirms it.")}</p>
          </Card>
        </Disclosure>

        <Disclosure title={tr("Other ways to get help")}>
          <Card title={tr("When the model or the link fails")} description={tr("The service degrades step by step — it never goes silent.")}>
            <ol className="grid gap-3">
              <li className="flex gap-3">
                <MessageSquareText className="mt-0.5 size-5 shrink-0 text-water-700" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-forest-900">{tr("1 · Numbered SMS menu")}</p>
                  <pre className="mt-2 overflow-x-auto rounded-xl bg-forest-950 p-3 font-mono text-[0.72rem] leading-relaxed whitespace-pre-wrap text-leaf-200">
                    {tr("{0}\nReply with a number:\n1 Tank status\n2 Open alerts\n3 Call the VIEM Hub", [hub.name.startsWith("VIEM") ? unitLabel(snap, unit.id) : `VIEM ${unitLabel(snap, unit.id)}`])}
                  </pre>
                </div>
              </li>
              <li className="flex gap-3"><ScrollText className="mt-0.5 size-5 shrink-0 text-water-700" aria-hidden="true" /><p className="text-sm text-forest-800"><strong className="text-forest-900">{tr("2 · Laminated guide on site")}</strong> {tr("— first-response steps printed at every tank.")}</p></li>
              <li className="flex gap-3"><Phone className="mt-0.5 size-5 shrink-0 text-water-700" aria-hidden="true" /><p className="text-sm text-forest-800"><strong className="text-forest-900">{tr("3 · Phone call to the VIEM Hub")}</strong> {tr("— the operations manager is accountable for advice.")}</p></li>
            </ol>
          </Card>
        </Disclosure>

        <p className="flex gap-2 text-xs leading-relaxed text-muted"><BookOpen className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />{tr("Every answer is logged and reviewed weekly; wrong answers become manual updates. Tetum wording in this demo is a draft for review by native speakers.")}</p>
      </div>
    </div>
  );
}
