"use client";

import { Check, Copy, Library, Pencil, Plus, Trash2, Workflow } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ACTUATOR_KINDS, ACTUATORS, PRESETS, SENSOR_CATEGORIES, SENSOR_KEYS, SENSORS, type Preset, type SensorKey, type ThresholdValues } from "@/lib/domain";
import { selectUnit } from "@/lib/sim/store";
import { useSnapshot, useStore } from "../DashboardProvider";
import { Card, EmptyState, Field, Input, PageHeader, Pill, Select } from "../ui";

function PresetEditor({ initial, onClose }: { initial: Preset; onClose: () => void }) {
  const store = useStore();
  const snap = useSnapshot();
  const [draft, setDraft] = useState(() => structuredClone(initial));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const patch = (values: Partial<Preset>) => setDraft((d) => ({ ...d, ...values }));
  function limit(sensor: SensorKey, field: keyof ThresholdValues, value: string) {
    setDraft((d) => ({ ...d, values: { ...d.values, [sensor]: { ...d.values[sensor], [field]: value.trim() ? Number(value) : NaN } } }));
  }
  function rule(index: number, patch: Partial<Preset["rules"][number]>) {
    setDraft((d) => ({ ...d, rules: d.rules.map((r, i) => i === index ? { ...r, ...patch } : r) }));
  }
  return <Card title="Preset setup" description="Master data is a reusable template. Saving here does not change a unit until you apply the preset.">
    <form className="grid gap-5" onSubmit={async (e) => { e.preventDefault(); setSaving(true); try { const err = await store.savePreset(draft); setError(err); if (!err) onClose(); } finally { setSaving(false); } }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Preset name">{(p) => <Input {...p} value={draft.label} onChange={(e) => patch({ label: e.target.value })} maxLength={80} required />}</Field>
        <Field label="Plant / fish">{(p) => <Input {...p} value={draft.crop} onChange={(e) => patch({ crop: e.target.value })} maxLength={120} required />}</Field>
        <Field label="Growth stage">{(p) => <Input {...p} value={draft.stage} onChange={(e) => patch({ stage: e.target.value })} maxLength={60} required />}</Field>
        <Field label="Growing system">{(p) => <Select {...p} value={draft.system} onChange={(e) => patch({ system: e.target.value as Preset["system"] })}><option value="aquaponics">Aquaponics · shared fish / plant loop</option><option value="hydroponics">Hydroponics · separate plant loop</option><option value="nursery">Fish nursery</option></Select>}</Field>
      </div>
      <Field label="Description and operating notes">{(p) => <Input {...p} value={draft.description} onChange={(e) => patch({ description: e.target.value })} maxLength={400} required />}</Field>
      <div className="grid gap-4">
        {SENSOR_CATEGORIES.map((c) => <fieldset key={c.id} className="rounded-xl border border-forest-100 p-4"><legend className="px-1 text-sm font-semibold text-forest-800">{c.label}</legend><div className="grid gap-4">{c.sensors.map((k) => <div key={k}><p className="mb-2 text-xs font-semibold text-forest-900">{SENSORS[k].label} <span className="font-normal text-muted">({SENSORS[k].unit})</span></p><div className="grid grid-cols-2 gap-2 lg:grid-cols-4">{([{ key: "criticalMin", label: "Critical low" }, { key: "min", label: "Normal low" }, { key: "max", label: "Normal high" }, { key: "criticalMax", label: "Critical high" }] as const).map(({ key, label }) => <Field key={key} label={label}>{(p) => <Input {...p} type="number" step="any" value={Number.isFinite(draft.values[k][key]) ? draft.values[k][key] : ""} onChange={(e) => limit(k, key, e.target.value)} required />}</Field>)}</div></div>)}</div></fieldset>)}
      </div>
      <fieldset className="grid gap-3 rounded-xl border border-forest-100 p-4"><legend className="px-1 text-sm font-semibold text-forest-800">Equipment automation templates</legend>
        <p className="text-xs text-muted">Use separate ON and OFF values to avoid rapid switching. These rules are applied only when you choose to replace equipment rules.</p>
        {draft.rules.map((r, i) => <div key={i} className="grid gap-3 rounded-xl bg-forest-50 p-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Equipment">{(p) => <Select {...p} value={r.actuator} onChange={(e) => rule(i, { actuator: e.target.value as typeof r.actuator })}>{ACTUATOR_KINDS.map((k) => <option key={k} value={k}>{ACTUATORS[k].label}</option>)}</Select>}</Field>
          <Field label="Sensor">{(p) => <Select {...p} value={r.sensor} onChange={(e) => rule(i, { sensor: e.target.value as SensorKey })}>{SENSOR_KEYS.map((k) => <option key={k} value={k}>{SENSORS[k].label}</option>)}</Select>}</Field>
          <Field label="ON condition">{(p) => <Select {...p} value={r.condition} onChange={(e) => rule(i, { condition: e.target.value as typeof r.condition })}><option value="below">Below</option><option value="above">Above</option></Select>}</Field>
          <Field label={`ON (${SENSORS[r.sensor].unit})`}>{(p) => <Input {...p} type="number" step="any" value={Number.isFinite(r.onValue) ? r.onValue : ""} required onChange={(e) => rule(i, { onValue: e.target.value ? Number(e.target.value) : NaN })} />}</Field>
          <Field label={`OFF (${SENSORS[r.sensor].unit})`}>{(p) => <Input {...p} type="number" step="any" value={Number.isFinite(r.offValue) ? r.offValue : ""} required onChange={(e) => rule(i, { offValue: e.target.value ? Number(e.target.value) : NaN })} />}</Field>
          <div className="flex items-center justify-between gap-3 sm:col-span-2 lg:col-span-5"><label className="flex min-h-10 items-center gap-2 text-xs text-forest-800"><input type="checkbox" className="size-4 accent-forest-800" checked={r.enabled} onChange={(e) => rule(i, { enabled: e.target.checked })} />Enabled</label><button className="dash-secondary text-xs text-crit-700" type="button" onClick={() => patch({ rules: draft.rules.filter((_, n) => n !== i) })}><Trash2 className="size-3.5" />Remove rule</button></div>
        </div>)}
        <button type="button" className="dash-secondary justify-self-start" disabled={draft.rules.length >= 12} onClick={() => patch({ rules: [...draft.rules, { actuator: "aeration", sensor: "do", condition: "below", onValue: 5.5, offValue: 7.2, enabled: true }] })}><Plus className="size-4" />Add rule template</button>
      </fieldset>
      {error && <p role="alert" className="text-sm text-crit-700">{error}</p>}
      <div className="flex flex-wrap gap-2"><button className="dash-primary" disabled={saving || !!snap.pending["preset:save"]}><Check className="size-4" />{saving ? "Saving…" : "Save master preset"}</button><button className="dash-secondary" type="button" onClick={onClose}>Cancel</button></div>
    </form>
  </Card>;
}

export function PresetsView() {
  const snap = useSnapshot();
  const store = useStore();
  const unit = selectUnit(snap);
  const [editing, setEditing] = useState<Preset | null>(null);
  const [query, setQuery] = useState("");
  const [system, setSystem] = useState("all");
  const [confirm, setConfirm] = useState<string | null>(null);
  const presets = snap.data.presets.filter((p) => (system === "all" || p.system === system) && `${p.label} ${p.crop} ${p.stage}`.toLowerCase().includes(query.toLowerCase()));
  const duplicate = (p: Preset, blank = false) => setEditing({ ...structuredClone(p), id: `custom-${crypto.randomUUID()}`, label: blank ? "" : `${p.label} copy`, crop: blank ? "" : p.crop });
  return <div className="grid gap-6">
    <PageHeader title="Preset master data" description="Reusable crop, fish and growth-stage profiles for alarms and equipment automation." actions={<button className="dash-primary" onClick={() => duplicate(PRESETS[0], true)}><Plus className="size-4" />New preset</button>} />
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-forest-100 bg-white p-5"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-water-50 text-water-700"><Library className="size-5" /></span><div><p className="text-sm font-semibold text-forest-900">{snap.data.presets.length} master presets</p><p className="mt-1 text-xs text-muted">Applies to the selected unit: {unit.name}</p></div></div><Link className="dash-secondary" href="/dashboard/automation"><Workflow className="size-4" />Automation & alarms</Link></div>
    <p className="text-xs leading-relaxed text-muted">Built-in ranges are illustrative demo values. Fish and plants sharing water need a compatible aquaponics profile; separate hydroponic profiles describe a plant-only loop.</p>
    {editing && <PresetEditor key={editing.id} initial={editing} onClose={() => setEditing(null)} />}
    <div className="grid gap-3 sm:grid-cols-2"><Field label="Search presets">{(p) => <Input {...p} placeholder="Plant, fish, name or stage…" value={query} onChange={(e) => setQuery(e.target.value)} />}</Field><Field label="Growing system">{(p) => <Select {...p} value={system} onChange={(e) => setSystem(e.target.value)}><option value="all">All systems</option><option value="aquaponics">Aquaponics</option><option value="hydroponics">Hydroponics</option><option value="nursery">Nursery</option></Select>}</Field></div>
    <div className="grid gap-5 xl:grid-cols-2">{presets.map((p) => <Card key={p.id} title={p.label} description={`${p.crop} · ${p.stage}`} action={<Pill tone={p.system === "hydroponics" ? "leaf" : "water"}>{p.system}</Pill>}>
      <p className="text-sm leading-relaxed text-muted">{p.description}</p>
      <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{SENSOR_KEYS.map((k) => <div key={k} className="rounded-lg bg-forest-50 px-3 py-2"><dt className="text-[11px] text-muted">{SENSORS[k].short}</dt><dd className="mt-1 text-xs font-semibold text-forest-900 tabular">{p.values[k].min}–{p.values[k].max} <span className="font-normal text-muted">{SENSORS[k].unit}</span></dd></div>)}</dl>
      <p className="mt-3 text-xs text-muted">{p.rules.length} equipment rule templates · normal ranges shown above</p>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-forest-100 pt-4"><button className="dash-primary text-xs" disabled={!!snap.pending[`preset:${unit.id}`]} onClick={() => void store.applyPreset(unit.id, p.id)}>Apply alarms to {unit.name}</button><button className="dash-secondary text-xs" onClick={() => setEditing(p)}><Pencil className="size-3.5" />Edit</button><button className="dash-secondary text-xs" onClick={() => duplicate(p)}><Copy className="size-3.5" />Duplicate</button>{!PRESETS.some((b) => b.id === p.id) && (confirm === p.id ? <><button className="dash-secondary text-xs text-crit-700" disabled={!!snap.pending["preset:delete"]} onClick={async () => { await store.deletePreset(p.id); setConfirm(null); }}>Confirm delete</button><button className="dash-secondary text-xs" onClick={() => setConfirm(null)}>Keep</button></> : <button className="dash-secondary text-xs text-crit-700" aria-label={`Delete ${p.label}`} onClick={() => setConfirm(p.id)}><Trash2 className="size-3.5" /></button>)}</div>
    </Card>)}</div>
    {!presets.length && <EmptyState icon={Library} title="No matching presets">Adjust the filters or create a new master preset.</EmptyState>}
  </div>;
}
