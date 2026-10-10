"use client";

import { useLanguage } from "../LanguageProvider";

import { BookOpen, Check, Languages, MessageSquareText, Phone, ScrollText, Send, ShieldAlert, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/ui/Logo";
import { ALERT_LABEL } from "@/lib/domain";
import { MANUAL, answerFromManual } from "@/lib/manual";
import { selectUnit, unacknowledged } from "@/lib/sim/store";
import { cn, fmtTime } from "@/lib/utils";
import { useSnapshot, useStore } from "../DashboardProvider";
import { Card, PageHeader, Pill } from "../ui";
import { Disclosure } from "../Disclosure";
import type { AlertDTO } from "@/lib/types";

interface Msg {
  id: number;
  from: "user" | "bot";
  t: number;
  tet: string;
  en: string;
  source?: string;
  steps?: string[];
  confidence?: number;
  escalate?: string;
  kind?: "answer" | "blocked" | "unsure" | "status";
  alerts?: AlertDTO[];
  farm?: string;
}

const MAY = ["Explain sensor alerts and first-response steps", "Answer from the vetted VIEM manual, with sources", "Escalate to a named VIEM agronomist"];
const MAY_NOT = ["Recommend chemicals, medicines or pesticides", "Invent answers outside the manual", "Close an alert without human confirmation"];

export function AssistantView() {
  const { tr, language: lang } = useLanguage();
  const snap = useSnapshot();
  const store = useStore();
  const unit = selectUnit(snap);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(() => [
    {
      id: 0,
      from: "bot",
      t: 0,
      kind: "status",
      tet: "Olá! Hau Tulun VIEM. Husu kona-ba ikan, modo ka alerta sira. Hau responde de'it husi manuál VIEM.",
      en: "Hello! I'm Tulun VIEM. Ask about fish, plants or alerts. I only answer from the VIEM manual.",
    },
  ]);
  const listRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  function botReply(build: () => Omit<Msg, "id" | "from" | "t">) {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { id: nextId.current++, from: "bot", t: Date.now(), ...build() }]);
    }, 650);
  }

  function ask(question: string, displayTet?: string, displayEn?: string) {
    const q = question.trim();
    if (!q) return;
    setMessages((m) => [...m, { id: nextId.current++, from: "user", t: Date.now(), tet: displayTet ?? q, en: displayEn ?? q }]);
    setInput("");
    const res = answerFromManual(q);
    botReply(() => {
      if (res.kind === "blocked") {
        return {
          kind: "blocked",
          tet: "Tulun VIEM labele rekomenda kimiku, ai-moruk ka pestisida. Hau haruka ita-nia pergunta ba agrónomu VIEM.",
          en: "Tulun VIEM can't recommend chemicals, medicines or pesticides. I'm passing your question to a VIEM agronomist.",
          escalate: q,
        };
      }
      if (res.kind === "unsure") {
        return {
          kind: "unsure",
          tet: "Deskulpa, hau la iha resposta seguru iha manuál. Hakarak hau haruka ba agrónomu VIEM?",
          en: "Sorry, I don't have a confident answer in the manual. Shall I pass this to a VIEM agronomist?",
          escalate: q,
          confidence: 0.2,
        };
      }
      return {
        kind: "answer",
        tet: res.entry.a.tet,
        en: res.entry.a.en,
        source: `VIEM Manual ${res.entry.section}`,
        steps: res.entry.steps,
        confidence: res.confidence,
        escalate: res.confidence < 0.6 ? q : undefined,
      };
    });
  }

  function explainAlerts() {
    const open = unacknowledged(snap, unit.id);
    setMessages((m) => [
      ...m,
      { id: nextId.current++, from: "user", t: Date.now(), tet: "Saida mak la di'ak agora?", en: "What's wrong right now?" },
    ]);
    botReply(() =>
      open.length
        ? {
            kind: "status",
            alerts: open, farm: unit.name,
            tet: `${unit.name}: alerta ${open.length}. ${open.map((a) => a.messageTet).join(" ")}`,
            en: `${unit.name}: ${open.length} open alert${open.length > 1 ? "s" : ""}. ${open.map((a) => `${ALERT_LABEL[a.code]} — ${a.messageEn}`).join(" ")}`,
            source: "Live sensor alerts",
            steps: ["Follow the first-response step in each alert", "Acknowledge each alert in the dashboard once checked"],
          }
        : {
            kind: "status",
            alerts: [], farm: unit.name,
            tet: `${unit.name}: buat hotu di'ak. La iha alerta ne'ebé loke.`,
            en: `${unit.name}: everything looks good. No open alerts.`,
            source: "Live sensor alerts",
          },
    );
  }

  const primary = (m: Msg) => {
    if (m.from === "user") return lang === "tet" ? m.tet : m.en;
    if (lang === "tet") return m.tet;
    if (m.alerts) return m.alerts.length ? `${tr("{0}: {1} open alerts.", [m.farm, m.alerts.length])} ${m.alerts.map((a) => `${tr(ALERT_LABEL[a.code])} — ${tr(a.messageEn)}`).join(" ")}` : tr("{0}: everything looks good. No open alerts.", [m.farm]);
    return tr(m.en);
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        title={tr("Tulun VIEM")}
        description={tr("Ask about fish, plants or alerts. Answers come from the VIEM farm manual.")}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <section aria-label={tr("Chat with Tulun VIEM")} className="flex h-[40rem] flex-col overflow-hidden rounded-3xl border border-forest-100 bg-[#efeae2] shadow-soft">
          <header className="flex items-center gap-3 bg-forest-800 px-4 py-3 text-white">
            <span className="flex size-10 items-center justify-center rounded-full bg-white">
              <LogoMark className="h-6 w-auto" />
            </span>
            <div className="leading-tight">
              <p className="font-semibold">{tr("Tulun VIEM")}</p>
              <p className="text-xs text-forest-200">{typing ? tr("Typing…") : tr("Helping {0}", [unit.name])}</p>
            </div>
            <Pill tone="leaf" className="ml-auto">
              <Languages className="size-3" aria-hidden="true" /> {lang === "tet" ? "Tetum" : lang === "id" ? "Bahasa Indonesia" : "English"}
            </Pill>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-4" aria-live="polite">
            {messages.map((m) => (
              <div key={m.id} className={cn("flex", m.from === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl p-3 text-sm shadow-sm",
                    m.from === "user" ? "rounded-tr-sm bg-[#d9fdd3]" : "rounded-tl-sm bg-white",
                    m.kind === "blocked" && "ring-1 ring-crit-500/40",
                  )}
                >
                  {m.kind === "blocked" && (
                    <p className="mb-1 flex items-center gap-1 text-[0.7rem] font-bold tracking-wide text-crit-700 uppercase">
                      <ShieldAlert className="size-3.5" aria-hidden="true" /> {tr("Guardrail")}</p>
                  )}
                  <p lang={lang} className="text-forest-950">
                    {primary(m)}
                  </p>
                  {m.steps && (
                    <ol className="mt-2 space-y-1 border-t border-forest-100 pt-2 text-xs text-forest-800">
                      {m.steps.map((s, i) => (
                        <li key={s} className="flex gap-1.5">
                          <span className="font-semibold text-forest-500">{tr(i + 1)}.</span> {tr(s)}
                        </li>
                      ))}
                    </ol>
                  )}
                  {(m.source || m.confidence != null) && (
                    <p className="mt-2 flex flex-wrap items-center gap-1.5">
                      {m.source && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-forest-50 px-2 py-0.5 text-[0.68rem] font-medium text-forest-700">
                          <BookOpen className="size-3" aria-hidden="true" /> {tr(m.source)}
                        </span>
                      )}
                      {m.confidence != null && (
                        <span className="rounded-full bg-forest-50 px-2 py-0.5 text-[0.68rem] font-medium text-forest-700">
                          {tr("Confidence")}{" "}{tr(Math.round(m.confidence * 100))}%
                        </span>
                      )}
                    </p>
                  )}
                  {m.escalate && (
                    <button
                      type="button"
                      onClick={() => {
                        store.escalateToAgronomist(unit.id, m.escalate!);
                        setMessages((all) => all.map((x) => (x.id === m.id ? { ...x, escalate: undefined } : x)));
                        botReply(() => ({
                          kind: "status",
                          tet: "Di'ak. Agrónomu VIEM sei responde iha WhatsApp — iha oras rua nia laran.",
                          en: "Done. A VIEM agronomist will reply on WhatsApp — within two hours.",
                        }));
                      }}
                      className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-forest-800 px-3 text-xs font-semibold text-white hover:bg-forest-700"
                    >
                      <UserRound className="size-3.5" aria-hidden="true" /> {tr("Ask an agronomist")}</button>
                  )}
                  {m.t > 0 && <p className="mt-1 text-right text-[0.65rem] text-muted">{tr(fmtTime(m.t))}</p>}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start" aria-label={tr("Tulun VIEM is typing")}>
                <span className="flex gap-1 rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="size-1.5 animate-bounce rounded-full bg-forest-400" style={{ animationDelay: `${i * 120}ms` }} />
                  ))}
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-black/5 bg-white/70 px-3 pt-2">
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                type="button"
                onClick={explainAlerts}
                className="shrink-0 rounded-full bg-forest-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-forest-700"
              >
                {tr(lang === "tet" ? "Saida mak la di'ak agora?" : "What's wrong right now?")}
              </button>
              {MANUAL.slice(0, 6).map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => ask(e.q.en, e.q.tet, e.q.en)}
                  className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-water-700 ring-1 ring-water-100 hover:bg-water-50"
                >
                  {tr(lang === "tet" ? e.q.tet : e.q.en)}
                </button>
              ))}
            </div>
          </div>
          <form
            className="flex items-center gap-2 bg-white/70 px-3 pb-3"
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
          >
            <label htmlFor="tulun-input" className="sr-only">
              {tr("Ask Tulun VIEM")}</label>
            <input
              id="tulun-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={300}
              autoComplete="off"
              placeholder={tr("Type a question…")}
              className="h-11 min-w-0 flex-1 rounded-full border border-forest-200 bg-white px-4 text-sm focus:border-leaf-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              aria-label={tr("Send")}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-forest-800 text-white hover:bg-forest-700 disabled:opacity-40"
            >
              <Send className="size-4" />
            </button>
          </form>
        </section>

        <div className="grid content-start gap-6">
          <Disclosure title={tr("What the assistant can help with")}><Card title={tr("Guardrails")} description={tr("What Tulun VIEM may and may not do.")}>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <ul className="space-y-2">
                {MAY.map((t) => (
                  <li key={t} className="flex items-start gap-2 text-sm text-forest-800">
                    <Check className="mt-0.5 size-4 shrink-0 text-leaf-600" aria-hidden="true" /> {tr(t)}
                  </li>
                ))}
              </ul>
              <ul className="space-y-2">
                {MAY_NOT.map((t) => (
                  <li key={t} className="flex items-start gap-2 text-sm text-forest-800">
                    <X className="mt-0.5 size-4 shrink-0 text-crit-700" aria-hidden="true" /> {tr(t)}
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-4 rounded-xl bg-forest-50 p-3 text-xs text-muted">
              {tr("Try asking about chemicals to see the guardrail, or something outside the manual to see the hand-over.")}</p>
          </Card></Disclosure>

          <Disclosure title={tr("Other ways to get help")}><Card title={tr("When the model or the link fails")} description={tr("The service degrades step by step — it never goes silent.")}>
            <ol className="grid gap-3">
              <li className="flex gap-3">
                <MessageSquareText className="mt-0.5 size-5 shrink-0 text-water-700" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-forest-900">{tr("1 · Numbered SMS menu")}</p>
                  <pre className="mt-2 overflow-x-auto rounded-xl bg-forest-950 p-3 font-mono text-[0.72rem] leading-relaxed whitespace-pre-wrap text-leaf-200">
                    {tr("{0}\nReply with a number:\n1 Tank status\n2 Open alerts\n3 Call the VIEM Hub", [unit.name.startsWith("VIEM") ? unit.name : `VIEM ${unit.name}`])}
                  </pre>
                </div>
              </li>
              <li className="flex gap-3">
                <ScrollText className="mt-0.5 size-5 shrink-0 text-water-700" aria-hidden="true" />
                <p className="text-sm text-forest-800">
                  <strong className="text-forest-900">{tr("2 · Laminated guide on site")}</strong> {tr("— first-response steps printed at every tank.")}</p>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-5 shrink-0 text-water-700" aria-hidden="true" />
                <p className="text-sm text-forest-800">
                  <strong className="text-forest-900">{tr("3 · Phone call to the VIEM Hub")}</strong> {tr("— the operations manager is accountable for advice.")}</p>
              </li>
            </ol>
          </Card></Disclosure>

          <p className="text-xs leading-relaxed text-muted">
            {tr("Every answer is logged and reviewed weekly; wrong answers become manual updates. Tetum wording in this demo is a draft for review by native speakers.")}</p>
        </div>
      </div>
    </div>
  );
}
