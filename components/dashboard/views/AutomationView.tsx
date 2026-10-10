"use client";

import { BellRing, Languages, MessageCircle, Pencil, Plus, Trash2, TriangleAlert, UserRoundCheck, Workflow } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import {
  ACTUATOR_KINDS,
  ACTUATORS,
  SENSOR_KEYS,
  SENSORS,
  formatSensor,
  statusFor,
  validateThreshold,
  type ActuatorKind,
  type SensorKey,
} from "@/lib/domain";
import { selectThresholds, selectUnit, type UnitLive } from "@/lib/sim/store";
import type { RuleCondition, RuleDTO, ThresholdDTO } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useSnapshot, useStore } from "../DashboardProvider";
import { SENSOR_ICON } from "../icons";
import { Card, EmptyState, Field, Input, PageHeader, Pill, RangeBar, Select, StatusBadge, Switch } from "../ui";

/* ------------------------------------------------------------------ */
/* Alarm parameters                                                    */
/* ------------------------------------------------------------------ */

function ThresholdRow({ t, live }: { t: ThresholdDTO; live: UnitLive }) {
  const store = useStore();
  const snap = useSnapshot();
  const meta = SENSORS[t.sensor];
  const Icon = SENSOR_ICON[t.sensor];
  const [form, setForm] = useState({
    criticalMin: String(t.criticalMin),
    min: String(t.min),
    max: String(t.max),
    criticalMax: String(t.criticalMax),
  });
  const [enabled, setEnabled] = useState(t.alarmEnabled);
  const [error, setError] = useState<string | null>(null);
  const pending = !!snap.pending[`threshold:${t.unitId}:${t.sensor}`];

  const parsed = {
    criticalMin: Number(form.criticalMin),
    min: Number(form.min),
    max: Number(form.max),
    criticalMax: Number(form.criticalMax),
  };
  const anyBlank = Object.values(form).some((v) => v.trim() === "");
  const problem = anyBlank ? "Fill in all four limits." : validateThreshold(parsed);
  const dirty =
    enabled !== t.alarmEnabled ||
    parsed.criticalMin !== t.criticalMin ||
    parsed.min !== t.min ||
    parsed.max !== t.max ||
    parsed.criticalMax !== t.criticalMax;
  const value = live.latest[t.sensor];
  const preview = problem ? live.statuses[t.sensor] : statusFor(value, parsed);

  const fields: { key: keyof typeof form; label: string }[] = [
    { key: "criticalMin", label: "Critical low" },
    { key: "min", label: "Normal low" },
    { key: "max", label: "Normal high" },
    { key: "criticalMax", label: "Critical high" },
  ];

  return (
    <li className="rounded-2xl border border-forest-100 p-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (problem) return setError(problem);
          setError(null);
          const err = await store.saveThreshold(t.unitId, t.sensor, { ...parsed, alarmEnabled: enabled });
          if (err) setError(err);
        }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${meta.color}14`, color: meta.color }}>
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-forest-900">
              {meta.label} <span className="font-normal text-muted">({meta.unit})</span>
            </p>
            <p className="text-xs text-muted">
              Now <strong className="text-forest-800 tabular">{formatSensor(t.sensor, value)}</strong> ·{" "}
              <span className="inline-block align-middle">
                <StatusBadge status={preview} label={preview === "ok" ? "In range" : undefined} />
              </span>
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-forest-800">
            Alarm
            <Switch checked={enabled} onChange={setEnabled} label={`${meta.label} alarm ${enabled ? "on" : "off"}`} />
          </label>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {fields.map((f) => (
            <Field key={f.key} label={f.label}>
              {(p) => (
                <Input
                  {...p}
                  type="number"
                  inputMode="decimal"
                  step={meta.decimals >= 2 ? "0.05" : meta.decimals === 1 ? "0.1" : "1"}
                  value={form[f.key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  aria-invalid={!!problem || undefined}
                  className={cn(f.key.startsWith("critical") ? "border-crit-500/30" : "border-ok-500/30")}
                />
              )}
            </Field>
          ))}
        </div>

        <div className="mt-4">
          {!problem && <RangeBar value={value} t={parsed} domain={meta.domain} color={meta.color} />}
        </div>

        {(error || (dirty && problem)) && (
          <p role="alert" className="mt-3 text-xs font-medium text-crit-700">
            {error ?? problem}
          </p>
        )}

        <div className="mt-3 flex justify-end gap-2">
          {dirty && (
            <button
              type="button"
              onClick={() => {
                setForm({ criticalMin: String(t.criticalMin), min: String(t.min), max: String(t.max), criticalMax: String(t.criticalMax) });
                setEnabled(t.alarmEnabled);
                setError(null);
              }}
              className="h-9 rounded-full px-3 text-xs font-medium text-forest-700 hover:bg-forest-50"
            >
              Discard
            </button>
          )}
          <button
            type="submit"
            disabled={!dirty || pending || !!problem}
            className="h-9 rounded-full bg-forest-800 px-4 text-xs font-semibold text-white hover:bg-forest-700 disabled:opacity-40"
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Rules                                                               */
/* ------------------------------------------------------------------ */

type RuleDraft = { actuator: ActuatorKind; sensor: SensorKey; condition: RuleCondition; onValue: string; offValue: string };

function ruleError(d: RuleDraft) {
  const on = Number(d.onValue);
  const off = Number(d.offValue);
  if (d.onValue.trim() === "" || d.offValue.trim() === "" || !Number.isFinite(on) || !Number.isFinite(off)) {
    return "Enter both the turn-on and turn-off values.";
  }
  if (d.condition === "below" && off <= on) return "For a “below” rule, the turn-off value must be higher than the turn-on value.";
  if (d.condition === "above" && off >= on) return "For an “above” rule, the turn-off value must be lower than the turn-on value.";
  return null;
}

function RuleForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  pending,
}: {
  initial: RuleDraft;
  submitLabel: string;
  onSubmit: (d: RuleDraft) => Promise<string | null>;
  onCancel?: () => void;
  pending: boolean;
}) {
  const [d, setD] = useState<RuleDraft>(initial);
  const [error, setError] = useState<string | null>(null);
  const unit = SENSORS[d.sensor].unit;
  const set = <K extends keyof RuleDraft>(k: K, v: RuleDraft[K]) => setD((p) => ({ ...p, [k]: v }));

  return (
    <form
      className="grid gap-4 rounded-2xl bg-forest-50 p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const problem = ruleError(d);
        if (problem) return setError(problem);
        setError(null);
        const err = await onSubmit(d);
        if (err) setError(err);
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Turn this">
          {(p) => (
            <Select {...p} value={d.actuator} onChange={(e) => set("actuator", e.target.value as ActuatorKind)}>
              {ACTUATOR_KINDS.map((k) => (
                <option key={k} value={k}>
                  {ACTUATORS[k].label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="ON when">
          {(p) => (
            <Select {...p} value={d.sensor} onChange={(e) => set("sensor", e.target.value as SensorKey)}>
              {SENSOR_KEYS.map((k) => (
                <option key={k} value={k}>
                  {SENSORS[k].label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="is">
          {(p) => (
            <Select {...p} value={d.condition} onChange={(e) => set("condition", e.target.value as RuleCondition)}>
              <option value="below">below</option>
              <option value="above">above</option>
            </Select>
          )}
        </Field>
        <Field label={`Turn-on value (${unit})`}>
          {(p) => <Input {...p} type="number" inputMode="decimal" step="any" value={d.onValue} onChange={(e) => set("onValue", e.target.value)} />}
        </Field>
        <Field label={`OFF when ${d.condition === "below" ? "above" : "below"} (${unit})`}>
          {(p) => <Input {...p} type="number" inputMode="decimal" step="any" value={d.offValue} onChange={(e) => set("offValue", e.target.value)} />}
        </Field>
      </div>
      <p className="text-xs text-muted">
        The gap between the two values (hysteresis) stops the equipment from flicking on and off around one number.
      </p>
      {error && (
        <p role="alert" className="text-xs font-medium text-crit-700">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="h-10 rounded-full px-4 text-sm font-medium text-forest-700 hover:bg-white">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-forest-800 px-4 text-sm font-semibold text-white hover:bg-forest-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function RuleRow({ rule, modeOk }: { rule: RuleDTO; modeOk: boolean }) {
  const store = useStore();
  const snap = useSnapshot();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const m = SENSORS[rule.sensor];
  const pending = !!snap.pending[`rule:${rule.id}`];

  if (editing) {
    return (
      <li>
        <RuleForm
          initial={{ actuator: rule.actuator, sensor: rule.sensor, condition: rule.condition, onValue: String(rule.onValue), offValue: String(rule.offValue) }}
          submitLabel="Save rule"
          pending={pending}
          onCancel={() => setEditing(false)}
          onSubmit={async (d) => {
            const err = await store.updateRule({ ...rule, ...d, onValue: Number(d.onValue), offValue: Number(d.offValue) });
            if (!err) setEditing(false);
            return err;
          }}
        />
      </li>
    );
  }

  return (
    <li className={cn("flex flex-wrap items-center gap-3 rounded-2xl border p-4", rule.enabled ? "border-forest-100 bg-white" : "border-dashed border-forest-200 bg-forest-50/50")}>
      <Switch
        checked={rule.enabled}
        onChange={(v) => void store.updateRule({ ...rule, enabled: v })}
        label={`${rule.enabled ? "Pause" : "Enable"} rule for ${ACTUATORS[rule.actuator].label}`}
        disabled={pending}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-forest-900">
          <strong>{ACTUATORS[rule.actuator].label}</strong> ON when {m.label.toLowerCase()} is {rule.condition}{" "}
          <strong className="tabular">
            {rule.onValue} {m.unit}
          </strong>
          , OFF when it {rule.condition === "below" ? "rises above" : "falls below"}{" "}
          <strong className="tabular">
            {rule.offValue} {m.unit}
          </strong>
        </p>
        {rule.enabled && !modeOk && (
          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-warn-700">
            <TriangleAlert className="size-3.5" aria-hidden="true" /> {ACTUATORS[rule.actuator].label} is not in Auto mode, so this rule is waiting.
          </p>
        )}
      </div>
      {confirmDelete ? (
        <span className="flex items-center gap-2">
          <span className="text-xs text-forest-800">Delete this rule?</span>
          <button
            type="button"
            onClick={() => void store.deleteRule(rule)}
            className="h-9 rounded-full bg-crit-700 px-3 text-xs font-semibold text-white hover:bg-crit-500"
          >
            Delete
          </button>
          <button type="button" onClick={() => setConfirmDelete(false)} className="h-9 rounded-full px-3 text-xs font-medium text-forest-700 hover:bg-forest-50">
            Keep
          </button>
        </span>
      ) : (
        <span className="flex gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit rule"
            className="inline-flex size-9 items-center justify-center rounded-full text-forest-600 hover:bg-forest-50"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete rule"
            className="inline-flex size-9 items-center justify-center rounded-full text-crit-700 hover:bg-crit-50"
          >
            <Trash2 className="size-4" />
          </button>
        </span>
      )}
    </li>
  );
}

export function AutomationView() {
  const snap = useSnapshot();
  const store = useStore();
  const unit = selectUnit(snap);
  const live = snap.live[unit.id];
  const th = selectThresholds(snap);
  const rules = snap.data.rules.filter((r) => r.unitId === unit.id);
  const actuators = snap.data.actuators.filter((a) => a.unitId === unit.id);
  const [preset, setPreset] = useState(snap.data.presets[0].id);
  const [includeRules, setIncludeRules] = useState(false);
  const [adding, setAdding] = useState(false);
  if (!live) return null;

  const modeOf = (k: ActuatorKind) => actuators.find((a) => a.kind === k)?.mode;
  const presetMeta = snap.data.presets.find((p) => p.id === preset) ?? snap.data.presets[0];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Automation & alarms"
        description={`${unit.name} · alarm parameters decide when a Tetum alert is sent; rules decide what the equipment does about it.`}
        actions={<Link href="/dashboard/presets" className="dash-secondary">Manage preset master data</Link>}
      />

      <Card
        title="Alarm parameters"
        description="Readings outside the normal band raise a warning; outside the critical limits, a critical alert."
        action={
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void store.applyPreset(unit.id, presetMeta.id, includeRules);
            }}
          >
            <label htmlFor="preset" className="sr-only">
              Crop preset
            </label>
            <Select id="preset" value={presetMeta.id} onChange={(e) => setPreset(e.target.value)} className="h-9 w-auto max-w-full rounded-full text-xs">
              {snap.data.presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </Select>
            <button
              type="submit"
              disabled={!!snap.pending[`preset:${unit.id}`]}
              className="h-9 rounded-full bg-leaf-400 px-4 text-xs font-semibold text-forest-950 hover:bg-leaf-300 disabled:opacity-50"
            >
              Apply preset
            </button>
          </form>
        }
      >
        <p className="mb-4 rounded-xl bg-leaf-50 px-3 py-2 text-xs text-leaf-700">
          <strong>{presetMeta.label} · {presetMeta.stage} · {presetMeta.system}:</strong> {presetMeta.description}
        </p>
        <div className="mb-5 grid gap-3 rounded-xl border border-forest-100 p-4">
          <p className="text-xs text-muted">Applying this preset replaces all seven alarm ranges and enables their alarms. Values are illustrative demo settings.</p>
          <label className="flex items-start gap-2 text-sm text-forest-800"><input type="checkbox" checked={includeRules} onChange={(e) => setIncludeRules(e.target.checked)} className="mt-1 size-4 accent-forest-700" />Also replace this unit's automation rules and switch the template's enabled equipment to Auto mode.</label>
          <div className="flex flex-wrap gap-2">{["ph", "ec", "do"].map((key) => { const k = key as SensorKey; return <Pill key={k}>{SENSORS[k].label}: {presetMeta.values[k].min}–{presetMeta.values[k].max} {SENSORS[k].unit}</Pill>; })}</div>
          {includeRules && <ul className="grid gap-1 text-xs text-muted">{presetMeta.rules.map((r, i) => <li key={i}>{ACTUATORS[r.actuator].label}: ON {SENSORS[r.sensor].short} {r.condition} {r.onValue}, OFF at {r.offValue} {SENSORS[r.sensor].unit}{r.enabled ? "" : " (disabled)"}</li>)}</ul>}
        </div>
        <ul className="grid gap-3 xl:grid-cols-2">
          {SENSOR_KEYS.map((k) => {
            const t = th[k];
            return t ? <ThresholdRow key={`${t.id}-${t.min}-${t.max}-${t.criticalMin}-${t.criticalMax}-${t.alarmEnabled}`} t={t} live={live} /> : null;
          })}
        </ul>
      </Card>

      <Card
        id="rules"
        className="scroll-mt-24"
        title={
          <span className="flex items-center gap-2">
            <Workflow className="size-4 text-water-700" aria-hidden="true" /> Automation rules
          </span>
        }
        description="Used when an actuator is in Auto mode. Evaluated on every reading — on the controller in production."
        action={
          !adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-forest-800 px-4 text-xs font-semibold text-white hover:bg-forest-700"
            >
              <Plus className="size-4" aria-hidden="true" /> Add rule
            </button>
          )
        }
      >
        {adding && (
          <div className="mb-4">
            <RuleForm
              initial={{ actuator: "aeration", sensor: "do", condition: "below", onValue: "5.5", offValue: "7.2" }}
              submitLabel="Add rule"
              pending={!!snap.pending["rule:new"]}
              onCancel={() => setAdding(false)}
              onSubmit={async (d) => {
                const err = await store.createRule({
                  unitId: unit.id,
                  actuator: d.actuator,
                  sensor: d.sensor,
                  condition: d.condition,
                  onValue: Number(d.onValue),
                  offValue: Number(d.offValue),
                  enabled: true,
                });
                if (!err) setAdding(false);
                return err;
              }}
            />
          </div>
        )}
        {rules.length ? (
          <ul className="grid gap-3">
            {ACTUATOR_KINDS.flatMap((k) => rules.filter((r) => r.actuator === k)).map((r) => (
              <RuleRow key={r.id} rule={r} modeOk={modeOf(r.actuator) === "auto"} />
            ))}
          </ul>
        ) : (
          <EmptyState icon={Workflow} title="No rules yet">
            Add a rule such as “aeration ON when oxygen is below 5.5 mg/L”.
          </EmptyState>
        )}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-forest-100 pt-4 text-xs text-muted">
          <span className="font-semibold text-forest-800">Modes right now:</span>
          {ACTUATOR_KINDS.map((k) => (
            <Pill key={k} tone={modeOf(k) === "auto" ? "water" : "neutral"}>
              {ACTUATORS[k].label}: {modeOf(k)}
            </Pill>
          ))}
        </div>
      </Card>

      <Card title="Alert delivery" description="How operators hear about alarms (simulated in this demo).">
        <ul className="grid gap-3 md:grid-cols-4">
          {[
            { icon: MessageCircle, title: "WhatsApp first", body: "Tulun VIEM sends the alert in plain Tetum with first-response steps." },
            { icon: BellRing, title: "SMS fallback", body: "When data is down, a numbered SMS menu reaches any phone." },
            { icon: Languages, title: "Tetum first", body: "Portuguese and English follow. Every message is from the vetted manual." },
            { icon: UserRoundCheck, title: "Human closes it", body: "Only a person can acknowledge an alert; unanswered ones escalate after 2 h." },
          ].map(({ icon: Icon, title, body }) => (
            <li key={title} className="rounded-xl bg-forest-50 p-4">
              <Icon className="size-5 text-forest-600" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold text-forest-900">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
