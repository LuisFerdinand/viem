"use client";

import { BookOpen, Check, Coins, HandCoins, OctagonAlert, PiggyBank, Receipt, ShieldAlert, TriangleAlert, UserRound, X } from "lucide-react";
import type { ReactNode } from "react";
import { ACTUATORS, ALERT_LABEL, SENSORS, formatSensor } from "@/lib/domain";
import { MANUAL } from "@/lib/manual";
import { unitLabel } from "@/lib/sim/store";
import type { ChatAction, ChatCard, ChatChannel, ChatMessage, ConfirmState, Say } from "@/lib/chat/types";
import type { AlertDTO } from "@/lib/types";
import { cn, fmtTime } from "@/lib/utils";
import { useNow, useSnapshot, useStore } from "../DashboardProvider";
import { ACTUATOR_ICON, SENSOR_ICON } from "../icons";
import { useDashboardFormatters, useLanguage } from "../LanguageProvider";
import { StatusBadge } from "../ui";

/** Render bot copy in the chosen language. `{ k }` values are phrases translated on the way in. */
export function useSay() {
  const { tr } = useLanguage();
  return (s: Say) => tr(s.key, s.values?.map((v) => (typeof v === "object" ? tr(v.k) : v)));
}

export const CHANNEL_ORDER: ChatChannel[] = ["farm", "money", "ask"];

export function Bubble({ from, children, time, tone, wide }: { from: "user" | "bot"; children: ReactNode; time?: number; tone?: "alert" | "critical" | "guard"; wide?: boolean }) {
  const { tr } = useLanguage();
  return (
    <div className={cn("flex", from === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "rounded-2xl p-3 text-sm shadow-sm",
          wide ? "w-full max-w-[34rem]" : "max-w-[88%]",
          from === "user" ? "rounded-tr-sm bg-[#d9fdd3]" : "rounded-tl-sm bg-white",
          tone === "alert" && "ring-1 ring-warn-500/50",
          tone === "critical" && "ring-2 ring-crit-500/40",
          tone === "guard" && "ring-1 ring-crit-500/40",
        )}
      >
        {children}
        {time ? <p className="mt-1 text-right text-[0.65rem] text-muted">{tr(fmtTime(time))}</p> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Alerts arrive as chat messages                                      */
/* ------------------------------------------------------------------ */

export function AlertBubble({ alert }: { alert: AlertDTO }) {
  const { tr, language } = useLanguage();
  const { fmtRelative } = useDashboardFormatters();
  const snap = useSnapshot();
  const store = useStore();
  const now = useNow();
  const critical = alert.severity === "critical";
  const Icon = SENSOR_ICON[alert.code];
  const SevIcon = critical ? OctagonAlert : TriangleAlert;
  const done = !!alert.acknowledgedAt;
  const message = language === "tet" ? alert.messageTet : tr(alert.messageEn);
  return (
    <Bubble from="bot" wide tone={done ? undefined : critical ? "critical" : "alert"} time={new Date(alert.createdAt).getTime()}>
      <p className={cn("flex items-center gap-1.5 text-[0.72rem] font-bold tracking-wide uppercase", critical ? "text-crit-700" : "text-warn-700")}>
        <SevIcon className="size-3.5" aria-hidden="true" /> {tr(critical ? "Critical" : "Warning")} · <Icon className="size-3.5" aria-hidden="true" /> {tr(ALERT_LABEL[alert.code])}
      </p>
      <p className="mt-1 text-xs text-muted">{unitLabel(snap, alert.unitId)}{now ? ` · ${fmtRelative(alert.createdAt, now)}` : ""}</p>
      <p lang={language} className="mt-2 text-forest-950">{message}</p>
      {done ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-leaf-700"><Check className="size-3.5" aria-hidden="true" /> {tr("Acknowledged by")} {alert.acknowledgedBy}</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => void store.acknowledge([alert.id])} className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-forest-800 px-4 text-xs font-semibold text-white hover:bg-forest-700">
            <Check className="size-3.5" aria-hidden="true" /> {tr("Confirm checked")}
          </button>
          <button type="button" onClick={() => store.escalateToAgronomist(alert.unitId, alert.messageEn)} className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold text-forest-800 ring-1 ring-forest-200 hover:bg-forest-50">
            <UserRound className="size-3.5" aria-hidden="true" /> {tr("Ask an agronomist")}
          </button>
        </div>
      )}
    </Bubble>
  );
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

function Rows({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-forest-100">
      <p className="bg-forest-50 px-3 py-1.5 text-xs font-semibold text-forest-800">{title}</p>
      <ul>{children}</ul>
    </div>
  );
}

function StatusCard({ card }: { card: Extract<ChatCard, { type: "status" }> }) {
  const { tr } = useLanguage();
  return (
    <Rows title={card.label}>
      {card.rows.map((r) => {
        const meta = SENSORS[r.sensor];
        const Icon = SENSOR_ICON[r.sensor];
        return (
          <li key={r.sensor} className="flex items-center gap-2 border-t border-forest-100 px-3 py-2">
            <Icon className="size-4 shrink-0" style={{ color: meta.color }} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-forest-800">{tr(meta.short)}</span>
            <span className="font-semibold text-forest-950 tabular">{tr(formatSensor(r.sensor, r.value))}<span className="ml-0.5 text-xs font-normal text-muted">{meta.unit === "pH" ? "" : tr(meta.unit)}</span></span>
            <StatusBadge status={r.status} />
          </li>
        );
      })}
    </Rows>
  );
}

function EquipmentCard({ card }: { card: Extract<ChatCard, { type: "equipment" }> }) {
  const { tr } = useLanguage();
  const MODE = { manual: "By hand", auto: "Automatic", schedule: "Timer" } as const;
  return (
    <Rows title={card.label}>
      {card.rows.map((r) => {
        const Icon = ACTUATOR_ICON[r.kind];
        return (
          <li key={r.kind} className="flex items-center gap-2 border-t border-forest-100 px-3 py-2">
            <Icon className={cn("size-4 shrink-0", r.on ? "text-leaf-600" : "text-forest-400")} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-forest-800">{tr(ACTUATORS[r.kind].label)}</span>
            <span className="text-xs text-muted">{tr(MODE[r.mode])}</span>
            <span className={cn("w-10 text-right text-xs font-bold", r.on ? "text-leaf-700" : "text-forest-400")}>{tr(r.on ? "ON" : "OFF")}</span>
          </li>
        );
      })}
    </Rows>
  );
}

export function FinanceCard({ card }: { card: Extract<ChatCard, { type: "finance" }> }) {
  const { tr } = useLanguage();
  const { usd } = useDashboardFormatters();
  const money = (n: number) => usd(n, n % 1 === 0 ? 0 : 2);
  const top = Math.max(card.income, card.expense, 1);
  const max = card.spending[0]?.amount ?? 1;
  const tiles = [
    { icon: PiggyBank, label: "Profit", value: card.profit, tone: card.profit < 0 ? "text-crit-700" : "text-forest-950" },
    { icon: Coins, label: "Income", value: card.income, tone: "text-forest-950" },
    { icon: Receipt, label: "Expenses", value: card.expense, tone: "text-forest-950" },
    { icon: HandCoins, label: "Still to receive", value: card.outstanding, tone: "text-forest-950" },
  ];
  return (
    <div className="mt-2 grid gap-3">
      {card.focus === "all" && (
        <>
          <dl className="grid grid-cols-2 gap-2">
            {tiles.map(({ icon: Icon, label, value, tone }) => (
              <div key={label} className="rounded-xl bg-forest-50 p-2.5">
                <dt className="flex items-center gap-1 text-[0.7rem] text-muted"><Icon className="size-3.5" aria-hidden="true" /> {tr(label)}</dt>
                <dd className={cn("mt-0.5 text-lg font-semibold tabular", tone)}>{money(value)}</dd>
              </div>
            ))}
          </dl>
          <div className="grid gap-1.5" aria-hidden="true">
            <div className="h-2.5 rounded-full bg-forest-50"><div className="h-full rounded-full bg-ok-500" style={{ width: `${(card.income / top) * 100}%` }} /></div>
            <div className="h-2.5 rounded-full bg-forest-50"><div className="h-full rounded-full bg-warn-500" style={{ width: `${(card.expense / top) * 100}%` }} /></div>
          </div>
        </>
      )}
      {card.spending.length > 0 && (
        <Rows title={tr("Where the money goes")}>
          {card.spending.map((s) => (
            <li key={s.category} className="border-t border-forest-100 px-3 py-2">
              <div className="flex justify-between gap-2 text-forest-800"><span>{tr(s.category)}</span><span className="font-semibold tabular">{money(s.amount)}</span></div>
              <div className="mt-1 h-1.5 rounded-full bg-forest-50" aria-hidden="true"><div className="h-full rounded-full bg-warn-500" style={{ width: `${(s.amount / max) * 100}%` }} /></div>
            </li>
          ))}
        </Rows>
      )}
    </div>
  );
}

function ConfirmCard({ card, onResolve }: { card: Extract<ChatCard, { type: "confirm" }>; onResolve: (accept: boolean) => void }) {
  const { tr } = useLanguage();
  const { usd, fmtDate } = useDashboardFormatters();
  const snap = useSnapshot();
  const a: ChatAction = card.action;
  return (
    <div className="mt-2">
      {a.kind === "ledger" && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-xl bg-forest-50 p-3 text-xs">
          <dt className="text-muted">{tr("Type")}</dt><dd className="font-semibold text-forest-900">{tr(a.entry.type === "income" ? "Income" : "Expenses")}</dd>
          <dt className="text-muted">{tr("Amount (USD)")}</dt><dd className="font-semibold text-forest-900 tabular">{usd(a.entry.amountCents / 100, 2)}</dd>
          <dt className="text-muted">{tr("Category")}</dt><dd className="text-forest-900">{tr(a.entry.category)}</dd>
          <dt className="text-muted">{tr("Description")}</dt><dd className="text-forest-900">{a.entry.description}</dd>
          <dt className="text-muted">{tr("Date")}</dt><dd className="text-forest-900">{fmtDate(`${a.entry.date}T00:00:00Z`)}</dd>
          <dt className="text-muted">{tr("Set")}</dt><dd className="text-forest-900">{unitLabel(snap, a.entry.unitId)}</dd>
        </dl>
      )}
      {card.state === "pending" ? (
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => onResolve(true)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-forest-800 px-4 text-sm font-semibold text-white hover:bg-forest-700"><Check className="size-4" aria-hidden="true" /> {tr("Yes")}</button>
          <button type="button" onClick={() => onResolve(false)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-forest-800 ring-1 ring-forest-200 hover:bg-forest-50"><X className="size-4" aria-hidden="true" /> {tr("No")}</button>
        </div>
      ) : (
        <p className={cn("mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", (card.state as ConfirmState) === "done" ? "bg-ok-50 text-ok-700" : "bg-forest-50 text-forest-600")}>
          {tr(card.state === "done" ? "Done" : "Cancelled")}
        </p>
      )}
    </div>
  );
}

export function EscalateButton({ onClick }: { onClick: () => void }) {
  const { tr } = useLanguage();
  return (
    <button type="button" onClick={onClick} className="mt-2 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-forest-800 px-4 text-xs font-semibold text-white hover:bg-forest-700">
      <UserRound className="size-3.5" aria-hidden="true" /> {tr("Ask an agronomist")}
    </button>
  );
}

function AnswerCard({ card, onEscalate }: { card: Extract<ChatCard, { type: "answer" }>; onEscalate: (question: string) => void }) {
  const { tr, language } = useLanguage();
  const entry = MANUAL.find((e) => e.id === card.entryId);
  if (!entry) return null;
  return (
    <>
      <p lang={language} className="text-forest-950">{language === "tet" ? entry.a.tet : tr(entry.a.en)}</p>
      <ol className="mt-2 space-y-1 border-t border-forest-100 pt-2 text-xs text-forest-800">
        {entry.steps.map((s, i) => <li key={s} className="flex gap-1.5"><span className="font-semibold text-forest-500">{i + 1}.</span> {tr(s)}</li>)}
      </ol>
      <p className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-forest-50 px-2 py-0.5 text-[0.68rem] font-medium text-forest-700"><BookOpen className="size-3" aria-hidden="true" /> {tr("VIEM Manual {0}", [tr(entry.section)])}</span>
        <span className="rounded-full bg-forest-50 px-2 py-0.5 text-[0.68rem] font-medium text-forest-700">{tr("Confidence")} {Math.round(card.confidence * 100)}%</span>
      </p>
      {card.escalate && <EscalateButton onClick={() => onEscalate(card.escalate!)} />}
    </>
  );
}

/** One stored chat message: the person's words, or Tulun VIEM's sentence plus an optional card. */
export function MessageBubble({ message, onResolve, onEscalate, onSwitch }: {
  message: ChatMessage;
  onResolve: (accept: boolean) => void;
  onEscalate: (question: string) => void;
  onSwitch: (channel: ChatChannel) => void;
}) {
  const { tr } = useLanguage();
  const say = useSay();
  const card = message.card;
  const guard = card?.type === "guardrail";
  if (message.from === "user") return <Bubble from="user" time={message.t}><p className="text-forest-950">{message.text}</p></Bubble>;
  return (
    <>
    <Bubble from="bot" time={message.t} wide={!!card && card.type !== "switch" && card.type !== "guardrail" && card.type !== "unsure"} tone={guard ? "guard" : undefined}>
      {guard && <p className="mb-1 flex items-center gap-1 text-[0.7rem] font-bold tracking-wide text-crit-700 uppercase"><ShieldAlert className="size-3.5" aria-hidden="true" /> {tr("Guardrail")}</p>}
      {message.say && <p className="text-forest-950">{say(message.say)}</p>}
      {card?.type === "status" && <StatusCard card={card} />}
      {card?.type === "equipment" && <EquipmentCard card={card} />}
      {card?.type === "finance" && <FinanceCard card={card} />}
      {card?.type === "confirm" && <ConfirmCard card={card} onResolve={onResolve} />}
      {card?.type === "answer" && <AnswerCard card={card} onEscalate={onEscalate} />}
      {(card?.type === "guardrail" || card?.type === "unsure") && <EscalateButton onClick={() => onEscalate(card.escalate)} />}
      {card?.type === "switch" && (
        <button type="button" onClick={() => onSwitch(card.channel)} className="mt-2 inline-flex min-h-10 items-center rounded-full bg-forest-800 px-4 text-xs font-semibold text-white hover:bg-forest-700">
          {tr(card.channel === "farm" ? "Open the Farm chat" : card.channel === "money" ? "Open the Money chat" : "Open the Ask chat")}
        </button>
      )}
    </Bubble>
    {card?.type === "alerts" && <ListedAlerts ids={card.ids} />}
    </>
  );
}

function ListedAlerts({ ids }: { ids: number[] }) {
  const snap = useSnapshot();
  return <>{ids.map((id) => { const a = snap.data.alerts.find((x) => x.id === id); return a ? <AlertBubble key={id} alert={a} /> : null; })}</>;
}
