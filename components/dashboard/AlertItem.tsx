"use client";

import { Check, Clock, MessageCircle, MessageSquareText, OctagonAlert, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { ALERT_LABEL, SENSORS, isSensorKey } from "@/lib/domain";
import type { AlertDTO, UnitDTO } from "@/lib/types";
import { cn, fmtDateTime, fmtDuration, fmtRelative } from "@/lib/utils";
import { useNow, useSnapshot, useStore } from "./DashboardProvider";
import { SENSOR_ICON } from "./icons";
import { Input, Pill } from "./ui";

/** Proposal success measure: alerts answered in under two hours. */
const SLA_MS = 2 * 3_600_000;

export function AlertItem({ alert, unit, compact = false }: { alert: AlertDTO; unit?: UnitDTO; compact?: boolean }) {
  const store = useStore();
  const snap = useSnapshot();
  const now = useNow();
  const [acking, setAcking] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [showEn, setShowEn] = useState(false);

  const critical = alert.severity === "critical";
  const Icon = SENSOR_ICON[alert.code];
  const SevIcon = critical ? OctagonAlert : TriangleAlert;
  const value = isSensorKey(alert.code)
    ? `${alert.value.toFixed(SENSORS[alert.code].decimals)} ${SENSORS[alert.code].unit}`
    : `${alert.value.toFixed(1)} A`;
  const age = now ? now - new Date(alert.createdAt).getTime() : 0;
  const slaLeft = SLA_MS - age;
  const acked = !!alert.acknowledgedAt;
  const active = !alert.resolvedAt;

  async function submit() {
    setBusy(true);
    await store.acknowledge([alert.id], note.trim() || undefined);
    setBusy(false);
    setAcking(false);
    setNote("");
  }

  return (
    <li
      className={cn(
        "rounded-2xl border p-4",
        acked ? "border-forest-100 bg-white" : critical ? "border-crit-500/40 bg-crit-50/40" : "border-warn-500/40 bg-warn-50/40",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            acked ? "bg-forest-50 text-forest-500" : critical ? "bg-crit-50 text-crit-700" : "bg-warn-50 text-warn-700",
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-forest-900">
              {ALERT_LABEL[alert.code]} · <span className="tabular">{value}</span>
            </p>
            <Pill tone={critical ? "crit" : "warn"}>
              <SevIcon className="size-3" aria-hidden="true" /> {critical ? "Critical" : "Warning"}
            </Pill>
            <Pill tone={active ? "dark" : "neutral"}>{active ? "Active" : "Cleared"}</Pill>
            {acked && (
              <Pill tone="leaf">
                <Check className="size-3" aria-hidden="true" /> Acknowledged
              </Pill>
            )}
          </div>
          <p className="mt-1 text-xs text-muted">
            {unit ? `${unit.name} · ` : ""}
            {fmtDateTime(alert.createdAt)}
            {now ? ` (${fmtRelative(alert.createdAt, now)})` : ""}
            {" · "}
            <span className="inline-flex items-center gap-1">
              {alert.channel === "sms" ? <MessageSquareText className="size-3" aria-hidden="true" /> : <MessageCircle className="size-3" aria-hidden="true" />}
              Sent via {alert.channel === "sms" ? "SMS fallback" : "WhatsApp"}
            </span>
          </p>

          <div className="mt-3 rounded-xl bg-white/80 p-3 ring-1 ring-forest-100">
            <p lang="tet" className="text-sm font-medium text-forest-950">
              {alert.messageTet}
            </p>
            {(showEn || !compact) && <p className="mt-1 text-xs text-muted italic">{alert.messageEn}</p>}
            {compact && (
              <button type="button" onClick={() => setShowEn((v) => !v)} className="mt-1 text-xs font-medium text-water-700 hover:underline">
                {showEn ? "Hide English" : "Show English"}
              </button>
            )}
          </div>

          {acked ? (
            <p className="mt-2 text-xs text-muted">
              Acknowledged by <strong className="text-forest-800">{alert.acknowledgedBy}</strong>
              {alert.acknowledgedAt ? ` · ${fmtDateTime(alert.acknowledgedAt)}` : ""}
              {alert.note ? ` — “${alert.note}”` : ""}
            </p>
          ) : acking ? (
            <form
              className="mt-3 flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <label className="sr-only" htmlFor={`note-${alert.id}`}>
                What did you find or do?
              </label>
              <Input
                id={`note-${alert.id}`}
                value={note}
                maxLength={280}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What did you find or do? (optional)"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex h-11 items-center gap-1.5 rounded-full bg-forest-800 px-4 text-sm font-semibold whitespace-nowrap text-white hover:bg-forest-700 disabled:opacity-50"
                >
                  <Check className="size-4" aria-hidden="true" /> {busy ? "Saving…" : `Confirm as ${snap.operator}`}
                </button>
                <button type="button" onClick={() => setAcking(false)} className="h-11 rounded-full px-4 text-sm font-medium text-forest-700 hover:bg-forest-50">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setAcking(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-forest-800 px-4 text-xs font-semibold text-white hover:bg-forest-700"
              >
                <Check className="size-3.5" aria-hidden="true" /> Acknowledge
              </button>
              {now > 0 && (
                <span className={cn("inline-flex items-center gap-1 text-xs tabular", slaLeft < 0 ? "font-semibold text-crit-700" : "text-muted")}>
                  <Clock className="size-3.5" aria-hidden="true" />
                  {slaLeft < 0 ? `Escalated to VIEM agronomist ${fmtDuration(-slaLeft)} ago` : `${fmtDuration(slaLeft)} left to respond`}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
