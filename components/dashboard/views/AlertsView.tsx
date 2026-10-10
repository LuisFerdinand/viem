"use client";

import { useLanguage } from "../LanguageProvider";

import { BellOff, CheckCheck, Timer } from "lucide-react";
import { useState } from "react";
import { selectUnit } from "@/lib/sim/store";
import { fmtDuration } from "@/lib/utils";
import { AlertItem } from "../AlertItem";
import { useSnapshot, useStore } from "../DashboardProvider";
import { Card, EmptyState, PageHeader, Segmented } from "../ui";

type Tab = "attention" | "active" | "all";
type Scope = "unit" | "all";

export function AlertsView() {
  const { tr } = useLanguage();
  const snap = useSnapshot();
  const store = useStore();
  const unit = selectUnit(snap);
  const [tab, setTab] = useState<Tab>("attention");
  const [scope, setScope] = useState<Scope>("all");

  const inScope = snap.data.alerts.filter((a) => scope === "all" || a.unitId === unit.id);
  const lists: Record<Tab, typeof inScope> = {
    attention: inScope.filter((a) => !a.acknowledgedAt),
    active: inScope.filter((a) => !a.resolvedAt),
    all: inScope,
  };
  const shown = lists[tab].slice(0, 60);
  const clearedUnacked = inScope.filter((a) => a.resolvedAt && !a.acknowledgedAt);

  const acked = inScope.filter((a) => a.acknowledgedAt);
  const responseTimes = acked.map((a) => new Date(a.acknowledgedAt!).getTime() - new Date(a.createdAt).getTime()).filter((ms) => ms >= 0);
  const avg = responseTimes.length ? responseTimes.reduce((x, y) => x + y, 0) / responseTimes.length : null;
  const withinSla = responseTimes.length ? Math.round((responseTimes.filter((ms) => ms <= 2 * 3_600_000).length / responseTimes.length) * 100) : null;
  const unitById = new Map(snap.data.units.map((u) => [u.id, u]));

  return (
    <div className="grid gap-6">
      <PageHeader
        title={tr("Alerts")}
        description={tr("Read each alert, check the farm, then confirm what you found.")}
        actions={<Segmented label={tr("Scope")} value={scope} onChange={setScope} options={[{ value: "all", label: "All units" }, { value: "unit", label: unit.name }]} />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Need acknowledgement", value: String(lists.attention.length), tone: lists.attention.length ? "text-crit-700" : "text-forest-900" },
          { label: "Average response", value: avg == null ? "—" : fmtDuration(avg), tone: "text-forest-900" },
          { label: "Answered within 2 h", value: withinSla == null ? "—" : `${withinSla}%`, tone: "text-forest-900" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-forest-100 bg-white p-4">
            <p className="text-xs text-muted">{tr(s.label)}</p>
            <p className={`mt-1 font-display text-3xl tabular ${s.tone}`}>{tr(s.value)}</p>
          </div>
        ))}
      </div>

      <Card title={tr("Alert log")} description={tr("Newest first. Cleared alerts still need a person to confirm them.")}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Segmented
            label={tr("Filter alerts")}
            value={tab}
            onChange={setTab}
            options={[
              { value: "attention", label: `Needs attention (${lists.attention.length})` },
              { value: "active", label: `Active (${lists.active.length})` },
              { value: "all", label: "All" },
            ]}
          />
          {clearedUnacked.length > 1 && (
            <button
              type="button"
              onClick={() => void store.acknowledge(clearedUnacked.map((a) => a.id), "Reviewed after readings returned to normal")}
              disabled={!!snap.pending.ack}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-semibold text-forest-700 ring-1 ring-forest-200 hover:bg-forest-50 disabled:opacity-50"
            >
              <CheckCheck className="size-4" aria-hidden="true" /> {tr("Acknowledge")}{" "}{tr(clearedUnacked.length)} {tr("cleared")}</button>
          )}
        </div>
        {shown.length ? (
          <ul className="grid gap-3">
            {shown.map((a) => (
              <AlertItem key={a.id} alert={a} unit={unitById.get(a.unitId)} />
            ))}
          </ul>
        ) : (
          <EmptyState icon={BellOff} title={tr(tab === "attention" ? "Nothing needs acknowledgement" : "No alerts here")}>
            {tr("Turn on a demo scenario on the Overview page — for example a pump failure — to watch an alert arrive.")}</EmptyState>
        )}
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted">
          <Timer className="size-3.5" aria-hidden="true" />
          {tr("Pilot success measure: alerts answered in under 2 hours. Unanswered alerts escalate to a named VIEM agronomist.")}</p>
      </Card>
    </div>
  );
}
