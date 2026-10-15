"use client";

import { ArrowRight, Network, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Preset } from "@/lib/domain";
import { MAX_HUBS, MAX_SETS_PER_HUB, MUNICIPALITIES, findPreset } from "@/lib/hubs";
import { selectHub, unacknowledged } from "@/lib/sim/store";
import type { HubDTO, UnitDTO } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useSnapshot, useStore } from "../DashboardProvider";
import { useLanguage } from "../LanguageProvider";
import { Card, EmptyState, Field, Input, PageHeader, Pill, Select } from "../ui";

interface SetForm { name: string; presetId: string; fish: string; tank: string }

/** Plant-only profiles start with no fish; fish profiles start with a small stock. */
const startingValues = (preset: Preset | undefined): Pick<SetForm, "fish" | "tank"> =>
  preset?.system === "hydroponics" ? { fish: "0", tank: "1500" } : preset?.system === "nursery" ? { fish: "1000", tank: "800" } : { fish: "300", tank: "2000" };

const toInput = (f: SetForm) => ({ name: f.name, presetId: f.presetId, fishCount: Number(f.fish), tankLiters: Number(f.tank) });

function SetFields({ form, onChange, presets }: { form: SetForm; onChange: (next: SetForm) => void; presets: Preset[] }) {
  const { tr } = useLanguage();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Set name">{(p) => <Input {...p} value={form.name} maxLength={40} onChange={(e) => onChange({ ...form, name: e.target.value })} />}</Field>
      <Field label="Growing profile" hint="Sets the alarm limits and equipment rules for the plants and fish.">
        {(p) => (
          <Select {...p} value={form.presetId} onChange={(e) => onChange({ ...form, presetId: e.target.value, ...startingValues(presets.find((x) => x.id === e.target.value)) })}>
            {presets.map((x) => <option key={x.id} value={x.id}>{tr(x.label)}</option>)}
          </Select>
        )}
      </Field>
      <Field label="Fish in the tank">{(p) => <Input {...p} type="number" inputMode="numeric" min={0} max={10000} value={form.fish} onChange={(e) => onChange({ ...form, fish: e.target.value })} />}</Field>
      <Field label="Tank size (litres)">{(p) => <Input {...p} type="number" inputMode="numeric" min={100} max={50000} value={form.tank} onChange={(e) => onChange({ ...form, tank: e.target.value })} />}</Field>
    </div>
  );
}

function SetRow({ unit, hub, onOpen, confirming, onAskRemove, onCancel, onRemove, removable, busy }: {
  unit: UnitDTO; hub: HubDTO; onOpen: () => void; confirming: boolean; onAskRemove: () => void; onCancel: () => void; onRemove: () => void; removable: boolean; busy: boolean;
}) {
  const { tr } = useLanguage();
  const snap = useSnapshot();
  const live = snap.live[unit.id];
  const open = unacknowledged(snap, unit.id).length;
  const preset = findPreset(snap.data.presets, unit.presetId);
  const health = live?.health ?? 100;
  return (
    <li className={cn("border-b border-forest-100 px-5 py-3 last:border-b-0", snap.selectedUnitId === unit.id && "bg-leaf-50/40")}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span aria-hidden="true" className={cn("size-2.5 shrink-0 rounded-full", health >= 80 ? "bg-ok-500" : health >= 55 ? "bg-warn-500" : "bg-crit-500")} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-forest-900">
            {unit.name}
            <Pill tone="leaf">{tr(preset.label)}</Pill>
            {open > 0 && <Pill tone="crit">{tr("Open alerts: {0}", [open])}</Pill>}
          </p>
          <p className="mt-0.5 text-xs text-muted">{tr(unit.crops)} · {tr(unit.fishCount > 0 ? "{0} fish · {1} L tank" : "No fish · {1} L tank", [unit.fishCount.toLocaleString(), unit.tankLiters.toLocaleString()])}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="dash-secondary text-xs" onClick={onOpen}>{tr("Open")} <ArrowRight className="size-3.5" aria-hidden="true" /></button>
          {removable && !confirming && (
            <button type="button" className="dash-secondary text-xs text-crit-700" onClick={onAskRemove} aria-label={tr("Remove set {0}", [`${hub.name} · ${unit.name}`])}><Trash2 className="size-3.5" aria-hidden="true" /> {tr("Remove")}</button>
          )}
        </div>
      </div>
      {confirming && (
        <div role="alert" className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-crit-50 px-4 py-3">
          <p className="text-xs leading-relaxed text-crit-700">{tr("Remove set {0}? This also removes its alerts, harvests and money records.", [unit.name])}</p>
          <div className="flex gap-2">
            <button type="button" className="dash-secondary text-xs" onClick={onCancel}>{tr("Keep it")}</button>
            <button type="button" className="dash-primary bg-crit-700 text-xs hover:bg-crit-500" disabled={busy} onClick={onRemove}>{tr("Yes, remove")}</button>
          </div>
        </div>
      )}
    </li>
  );
}

export function HubsView() {
  const { tr } = useLanguage();
  const snap = useSnapshot();
  const store = useStore();
  const router = useRouter();
  const presets = snap.data.presets;
  const firstPreset = presets[0];
  const selectedHub = selectHub(snap);

  const blankSet = (name: string): SetForm => ({ name, presetId: firstPreset?.id ?? "", ...startingValues(firstPreset) });
  const [adding, setAdding] = useState(false);
  const [hubForm, setHubForm] = useState({ name: "", municipality: "Dili", location: "", site: "" });
  const [firstSet, setFirstSet] = useState<SetForm>(() => blankSet("Set 1"));
  const [setFor, setSetFor] = useState<string | null>(null);
  const [newSet, setNewSet] = useState<SetForm>(() => blankSet(""));
  const [confirm, setConfirm] = useState<{ kind: "hub" | "set"; id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitHub(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await store.createHub(hubForm, toInput(firstSet));
    setBusy(false);
    if (err) return setError(err);
    setAdding(false);
    setHubForm({ name: "", municipality: "Dili", location: "", site: "" });
    setFirstSet(blankSet("Set 1"));
  }

  async function submitSet(e: FormEvent, hubId: string) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await store.createSet(hubId, toInput(newSet));
    setBusy(false);
    if (err) return setError(err);
    setSetFor(null);
  }

  async function remove() {
    if (!confirm) return;
    setBusy(true);
    setError(null);
    const err = confirm.kind === "set" ? await store.deleteSet(confirm.id) : await store.deleteHub(confirm.id);
    setBusy(false);
    setConfirm(null);
    if (err) setError(err);
  }

  const open = (unitId: string) => {
    store.selectUnit(unitId);
    router.push("/dashboard");
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        title={tr("Hubs & sets")}
        description={tr("A hub is a site such as the VIEM Hub. Each hub has sets: separate tanks or grow beds, each following its own growing profile.")}
        actions={snap.data.hubs.length < MAX_HUBS && !adding ? <button type="button" className="dash-primary" onClick={() => { setAdding(true); setError(null); }}><Plus className="size-4" aria-hidden="true" /> {tr("Add hub")}</button> : undefined}
      />

      {error && <p role="alert" className="rounded-xl bg-crit-50 px-4 py-3 text-sm font-medium text-crit-700">{tr(error)}</p>}

      {adding && (
        <Card title={tr("Add a hub")} description={tr("Every hub starts with one set. You can add more sets afterwards.")}>
          <form onSubmit={submitHub} className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Hub name">{(p) => <Input {...p} required maxLength={60} placeholder={tr("For example: Suku Unit 03")} value={hubForm.name} onChange={(e) => setHubForm({ ...hubForm, name: e.target.value })} />}</Field>
              <Field label="Municipality">{(p) => <Select {...p} value={hubForm.municipality} onChange={(e) => setHubForm({ ...hubForm, municipality: e.target.value })}>{MUNICIPALITIES.map((m) => <option key={m} value={m}>{m}</option>)}</Select>}</Field>
              <Field label="Location">{(p) => <Input {...p} required maxLength={80} placeholder={tr("Village, suco or landmark")} value={hubForm.location} onChange={(e) => setHubForm({ ...hubForm, location: e.target.value })} />}</Field>
              <Field label="Type of site (optional)">{(p) => <Input {...p} maxLength={80} placeholder={tr("School site, cooperative, farm…")} value={hubForm.site} onChange={(e) => setHubForm({ ...hubForm, site: e.target.value })} />}</Field>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-forest-900">{tr("First set")}</h3>
              <SetFields form={firstSet} onChange={setFirstSet} presets={presets} />
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="dash-primary" disabled={busy || !!snap.pending["hub:new"]}>{tr("Add hub")}</button>
              <button type="button" className="dash-secondary" onClick={() => { setAdding(false); setError(null); }}>{tr("Cancel")}</button>
            </div>
          </form>
        </Card>
      )}

      {snap.data.hubs.length === 0 && <EmptyState icon={Network} title={tr("No hubs yet")}>{tr("Add your first hub to start monitoring.")}</EmptyState>}

      <div className="grid gap-5">
        {snap.data.hubs.map((hub) => {
          const sets = snap.data.units.filter((u) => u.hubId === hub.id);
          const confirmingHub = confirm?.kind === "hub" && confirm.id === hub.id;
          return (
            <Card
              key={hub.id}
              title={<span className="flex flex-wrap items-center gap-2">{hub.name}{hub.id === selectedHub?.id && <Pill tone="leaf">{tr("Selected")}</Pill>}</span>}
              description={`${hub.site} · ${hub.location}, ${hub.municipality}`}
              action={snap.data.hubs.length > 1 && !confirmingHub ? <button type="button" className="dash-secondary text-xs text-crit-700" onClick={() => setConfirm({ kind: "hub", id: hub.id })} aria-label={tr("Remove hub {0}", [hub.name])}><Trash2 className="size-3.5" aria-hidden="true" /> {tr("Remove hub")}</button> : undefined}
              bodyClassName="p-0"
            >
              {confirmingHub && (
                <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border-b border-crit-500/20 bg-crit-50 px-5 py-3">
                  <p className="text-xs leading-relaxed text-crit-700">{tr("Remove hub {0} and all of its sets? This also removes their alerts, harvests and money records.", [hub.name])}</p>
                  <div className="flex gap-2">
                    <button type="button" className="dash-secondary text-xs" onClick={() => setConfirm(null)}>{tr("Keep it")}</button>
                    <button type="button" className="dash-primary bg-crit-700 text-xs hover:bg-crit-500" disabled={busy} onClick={remove}>{tr("Yes, remove")}</button>
                  </div>
                </div>
              )}
              <ul>
                {sets.map((u) => (
                  <SetRow
                    key={u.id} unit={u} hub={hub} busy={busy} removable={sets.length > 1}
                    onOpen={() => open(u.id)}
                    confirming={confirm?.kind === "set" && confirm.id === u.id}
                    onAskRemove={() => setConfirm({ kind: "set", id: u.id })}
                    onCancel={() => setConfirm(null)} onRemove={remove}
                  />
                ))}
              </ul>
              {setFor === hub.id ? (
                <form onSubmit={(e) => submitSet(e, hub.id)} className="grid gap-4 border-t border-forest-100 bg-forest-50/50 px-5 py-4">
                  <h3 className="text-sm font-semibold text-forest-900">{tr("Add a set to {0}", [hub.name])}</h3>
                  <SetFields form={newSet} onChange={setNewSet} presets={presets} />
                  <div className="flex flex-wrap gap-2">
                    <button type="submit" className="dash-primary" disabled={busy || !!snap.pending["set:new"]}>{tr("Add set")}</button>
                    <button type="button" className="dash-secondary" onClick={() => { setSetFor(null); setError(null); }}>{tr("Cancel")}</button>
                  </div>
                </form>
              ) : (
                <div className="border-t border-forest-100 px-5 py-3">
                  {sets.length >= MAX_SETS_PER_HUB
                    ? <p className="text-xs text-muted">{tr("This hub has the most sets the demo allows.")}</p>
                    : <button type="button" className="dash-secondary text-xs" onClick={() => { setSetFor(hub.id); setError(null); setNewSet(blankSet(`Set ${sets.length + 1}`)); }}><Plus className="size-3.5" aria-hidden="true" /> {tr("Add a set")}</button>}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
