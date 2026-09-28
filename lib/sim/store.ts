import {
  acknowledgeAlerts,
  addHarvest,
  applyPreset,
  createRule,
  deleteHarvest,
  deleteRule,
  fetchEvents,
  logAutomationEvent,
  logMaintenance,
  raiseAlert,
  resetDemo,
  resolveAlert,
  saveSchedule,
  saveThreshold,
  setActuatorMode,
  setActuatorPower,
  setHarvestStatus,
  updateRule,
} from "../actions";

const api = {
  acknowledgeAlerts,
  addHarvest,
  applyPreset,
  createRule,
  deleteHarvest,
  deleteRule,
  fetchEvents,
  logAutomationEvent,
  logMaintenance,
  raiseAlert,
  resetDemo,
  resolveAlert,
  saveSchedule,
  saveThreshold,
  setActuatorMode,
  setActuatorPower,
  setHarvestStatus,
  updateRule,
};
import {
  ACTUATOR_KINDS,
  ACTUATORS,
  ALERT_LABEL,
  CROP_BY_ID,
  PRESETS,
  SENSOR_KEYS,
  SENSORS,
  alertCopy,
  alertDirection,
  type ActuatorKind,
  type ActuatorMode,
  type AlertCode,
  type EventCategory,
  type HarvestStatus,
  type SensorKey,
  type SensorStatus,
  type ThresholdValues,
} from "../domain";
import { buildFallbackData } from "../seed-data";
import type {
  ActionResult,
  ActuatorDTO,
  AlertDTO,
  DashboardData,
  EventDTO,
  HarvestDTO,
  RuleDTO,
} from "../types";
import {
  BYTES_PER_READING,
  HISTORY_POINTS,
  NO_SCENARIOS,
  SCENARIOS,
  TICK_MS,
  alarmStatus,
  computeActuators,
  healthScore,
  initialReading,
  profileFor,
  pumpFaultDetected,
  sensorStatuses,
  stepReading,
  thresholdMap,
  toStates,
  type ControlReason,
  type EffectiveActuators,
  type Reading,
  type ScenarioKey,
  type Scenarios,
} from "./engine";

/** Pause the feed after this long without any interaction. */
export const IDLE_MS = 3 * 60_000;
const MAX_EVENTS_IN_MEMORY = 250;
const MAX_TOASTS = 4;

export type FeedStatus = "starting" | "live" | "idle" | "hidden" | "paused";

export interface UnitLive {
  history: Reading[];
  latest: Reading;
  actuators: EffectiveActuators;
  runtimeMs: Record<ActuatorKind, number>;
  lastChange: Partial<Record<ActuatorKind, number>>;
  statuses: Record<SensorKey, SensorStatus>;
  pumpFault: boolean;
  health: number;
  buffered: number;
  bytesSent: number;
  scenarios: Scenarios;
}

export type ToastTone = "success" | "error" | "info" | "warning" | "critical";
export interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

export interface Snapshot {
  ready: boolean;
  data: DashboardData;
  selectedUnitId: string;
  live: Record<string, UnitLive>;
  feed: {
    status: FeedStatus;
    nextTickAt: number | null;
    lastTickAt: number | null;
    readings: number;
  };
  toasts: Toast[];
  operator: string;
  pending: Record<string, boolean>;
  hasMoreEvents: boolean;
}

type AlarmState = { status: SensorStatus; alertId: number | null };

const LS_UNIT = "viem.unit";
const LS_OPERATOR = "viem.operator";

function readLS(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeLS(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — fine, it is only a convenience */
  }
}

const zeroRuntime = () => Object.fromEntries(ACTUATOR_KINDS.map((k) => [k, 0])) as Record<ActuatorKind, number>;

const actorFor = (reason: ControlReason) =>
  reason === "interlock" ? "Safety interlock" : reason === "schedule" ? "Schedule" : "Automation";

export class DashboardStore {
  private snap: Snapshot;
  private readonly serverSnap: Snapshot;
  private listeners = new Set<() => void>();
  private tickTimer: ReturnType<typeof setTimeout> | null = null;
  private idleTimer: ReturnType<typeof setInterval> | null = null;
  private lastActivity = 0;
  private started = false;
  private alarms = new Map<string, AlarmState>();
  private streaks = new Map<string, number>();
  private tempId = -1;
  private toastId = 1;
  private offlineNoticeShown = false;

  constructor(initial: DashboardData) {
    this.snap = {
      ready: false,
      data: initial,
      selectedUnitId: initial.units[0]?.id ?? "",
      live: {},
      feed: { status: "starting", nextTickAt: null, lastTickAt: null, readings: 0 },
      toasts: [],
      operator: "Operator",
      pending: {},
      hasMoreEvents: initial.events.length >= 60,
    };
    this.serverSnap = this.snap;
  }

  /* ---------------- external store plumbing ---------------- */

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getSnapshot = () => this.snap;
  getServerSnapshot = () => this.serverSnap;

  private set(patch: Partial<Snapshot>) {
    this.snap = { ...this.snap, ...patch };
    for (const l of this.listeners) l();
  }
  private setData(fn: (d: DashboardData) => Partial<DashboardData>) {
    this.set({ data: { ...this.snap.data, ...fn(this.snap.data) } });
  }
  private get canPersist() {
    return this.snap.data.source === "database";
  }

  /* ---------------- lifecycle ---------------- */

  start() {
    if (this.started) return;
    this.started = true;

    const savedUnit = readLS(LS_UNIT);
    const savedOperator = readLS(LS_OPERATOR);
    const units = this.snap.data.units;
    const patch: Partial<Snapshot> = { ready: true };
    if (savedUnit && units.some((u) => u.id === savedUnit)) patch.selectedUnitId = savedUnit;
    if (savedOperator) patch.operator = savedOperator.slice(0, 60);
    if (Object.keys(this.snap.live).length === 0) {
      this.syncAlarmsFromData();
      patch.live = this.backfill(Date.now());
    }
    this.set(patch);

    this.lastActivity = Date.now();
    for (const ev of ["pointerdown", "pointermove", "keydown", "wheel", "touchstart", "scroll"] as const) {
      window.addEventListener(ev, this.onActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", this.onVisibility);
    this.idleTimer = setInterval(this.checkIdle, 5_000);

    if (document.visibilityState === "hidden") {
      this.setFeed({ status: "hidden", nextTickAt: null });
    } else {
      this.tick(); // first "upload" right away, then every 30 s
    }
  }

  stop() {
    this.started = false;
    this.clearTick();
    if (this.idleTimer) clearInterval(this.idleTimer);
    this.idleTimer = null;
    for (const ev of ["pointerdown", "pointermove", "keydown", "wheel", "touchstart", "scroll"] as const) {
      window.removeEventListener(ev, this.onActivity);
    }
    document.removeEventListener("visibilitychange", this.onVisibility);
  }

  private setFeed(patch: Partial<Snapshot["feed"]>) {
    this.set({ feed: { ...this.snap.feed, ...patch } });
  }

  private clearTick() {
    if (this.tickTimer) clearTimeout(this.tickTimer);
    this.tickTimer = null;
  }

  private schedule(ms: number) {
    this.clearTick();
    this.tickTimer = setTimeout(() => this.tick(), ms);
    this.setFeed({ status: "live", nextTickAt: Date.now() + ms });
  }

  private onActivity = () => {
    const now = Date.now();
    if (now - this.lastActivity < 1_000) return;
    this.lastActivity = now;
    if (this.snap.feed.status === "idle") this.resume();
  };

  private onVisibility = () => {
    const status = this.snap.feed.status;
    if (document.visibilityState === "hidden") {
      if (status === "live" || status === "idle" || status === "starting") {
        this.clearTick();
        this.setFeed({ status: "hidden", nextTickAt: null });
      }
    } else if (status === "hidden") {
      this.lastActivity = Date.now();
      this.resume();
    }
  };

  private checkIdle = () => {
    if (this.snap.feed.status === "live" && Date.now() - this.lastActivity > IDLE_MS) {
      this.clearTick();
      this.setFeed({ status: "idle", nextTickAt: null });
    }
  };

  pause() {
    this.clearTick();
    this.setFeed({ status: "paused", nextTickAt: null });
  }

  resume() {
    this.lastActivity = Date.now();
    const last = this.snap.feed.lastTickAt;
    const due = last == null ? 0 : last + TICK_MS - Date.now();
    if (due <= 0) this.tick();
    else this.schedule(due);
  }

  readNow() {
    this.lastActivity = Date.now();
    this.tick();
  }

  /* ---------------- simulation ---------------- */

  private unitContext(unitId: string, data = this.snap.data) {
    return {
      thresholds: thresholdMap(data.thresholds, unitId),
      actuators: data.actuators.filter((a) => a.unitId === unitId),
      rules: data.rules.filter((r) => r.unitId === unitId),
    };
  }

  /** Two hours of history, as if synced from the controller's local buffer. */
  private backfill(now: number): Record<string, UnitLive> {
    const live: Record<string, UnitLive> = {};
    for (const unit of this.snap.data.units) {
      const p = profileFor(unit.id);
      const ctx = this.unitContext(unit.id);
      let t = now - HISTORY_POINTS * TICK_MS;
      let reading = initialReading(p, t);
      let eff: EffectiveActuators | null = null;
      const history: Reading[] = [];
      for (let i = 0; i < HISTORY_POINTS - 1; i++) {
        t += TICK_MS;
        eff = computeActuators({ t, reading, ...ctx, previous: eff });
        reading = stepReading(reading, t, toStates(eff), NO_SCENARIOS, p, Math.random);
        history.push(reading);
      }
      const finalEff = eff ?? computeActuators({ t, reading, ...ctx, previous: null });
      const statuses = sensorStatuses(reading, ctx.thresholds);
      const fault = pumpFaultDetected(reading, finalEff);
      live[unit.id] = {
        history,
        latest: reading,
        actuators: finalEff,
        runtimeMs: zeroRuntime(),
        lastChange: {},
        statuses,
        pumpFault: fault,
        health: healthScore(statuses, fault, false),
        buffered: 0,
        bytesSent: 0,
        scenarios: { ...NO_SCENARIOS },
      };
    }
    return live;
  }

  private tick() {
    if (!this.started) return;
    const now = Date.now();
    const s = this.snap;
    const live = { ...s.live };
    const effects: (() => void)[] = [];

    for (const unit of s.data.units) {
      const u = live[unit.id];
      if (!u) continue;
      const ctx = this.unitContext(unit.id);
      const eff = computeActuators({ t: now, reading: u.latest, ...ctx, previous: u.actuators });
      const lastChange = { ...u.lastChange };
      for (const k of ACTUATOR_KINDS) {
        if (eff[k].on !== u.actuators[k].on) {
          lastChange[k] = now;
          if (eff[k].reason !== "manual") {
            const msg = `${ACTUATORS[k].label} turned ${eff[k].on ? "ON" : "OFF"} — ${eff[k].detail}`;
            const actor = actorFor(eff[k].reason);
            effects.push(() => this.logEvent(unit.id, "automation", msg, actor));
          }
        }
      }

      const next = stepReading(u.latest, now, toStates(eff), u.scenarios, profileFor(unit.id), Math.random);
      const statuses = sensorStatuses(next, ctx.thresholds);
      const fault = pumpFaultDetected(next, eff);

      const runtimeMs = { ...u.runtimeMs };
      for (const k of ACTUATOR_KINDS) if (eff[k].on) runtimeMs[k] += TICK_MS;

      let { buffered, bytesSent } = u;
      if (u.scenarios.linkOutage) {
        buffered += 1;
      } else {
        if (buffered > 0) {
          const n = buffered;
          effects.push(() =>
            this.logEvent(
              unit.id,
              "system",
              `Satellite link restored — uploaded ${n} buffered reading${n === 1 ? "" : "s"} (${((n * BYTES_PER_READING) / 1024).toFixed(1)} KB)`,
              "Controller",
            ),
          );
          bytesSent += n * BYTES_PER_READING;
          buffered = 0;
        }
        bytesSent += BYTES_PER_READING;
      }

      const offline = u.scenarios.linkOutage;
      for (const key of SENSOR_KEYS) {
        const t = ctx.thresholds[key];
        const akey = `${unit.id}:${key}`;
        let status: SensorStatus = "ok";
        if (t && t.alarmEnabled) {
          const r = alarmStatus(next[key], t, this.alarms.get(akey)?.status ?? "ok", this.streaks.get(akey) ?? 0, SENSORS[key].decimals);
          this.streaks.set(akey, r.streak);
          status = r.status;
        }
        const value = next[key];
        effects.push(() => this.evaluateAlarm(unit.id, key, status, value, t, offline));
      }
      effects.push(() => this.evaluateAlarm(unit.id, "pumpFault", fault ? "critical" : "ok", next.pumpA, undefined, offline));

      live[unit.id] = {
        ...u,
        history: [...u.history, next].slice(-HISTORY_POINTS),
        latest: next,
        actuators: eff,
        runtimeMs,
        lastChange,
        statuses,
        pumpFault: fault,
        health: healthScore(statuses, fault, offline),
        buffered,
        bytesSent,
      };
    }

    this.set({ live, feed: { ...s.feed, lastTickAt: now, readings: s.feed.readings + 1 } });
    for (const fx of effects) fx();
    this.schedule(TICK_MS);
  }

  /** Re-evaluate one unit's actuators immediately (after a mode/rule change). */
  private recomputeUnit(unitId: string) {
    const u = this.snap.live[unitId];
    if (!u) return;
    const now = Date.now();
    const eff = computeActuators({ t: now, reading: u.latest, ...this.unitContext(unitId), previous: u.actuators });
    const lastChange = { ...u.lastChange };
    for (const k of ACTUATOR_KINDS) {
      if (eff[k].on !== u.actuators[k].on) {
        lastChange[k] = now;
        if (eff[k].reason !== "manual") {
          this.logEvent(unitId, "automation", `${ACTUATORS[k].label} turned ${eff[k].on ? "ON" : "OFF"} — ${eff[k].detail}`, actorFor(eff[k].reason));
        }
      }
    }
    this.set({ live: { ...this.snap.live, [unitId]: { ...u, actuators: eff, lastChange } } });
  }

  toggleScenario(unitId: string, key: ScenarioKey) {
    const u = this.snap.live[unitId];
    if (!u) return;
    const on = !u.scenarios[key];
    this.set({ live: { ...this.snap.live, [unitId]: { ...u, scenarios: { ...u.scenarios, [key]: on } } } });
    const meta = SCENARIOS.find((s) => s.key === key)!;
    if (key === "linkOutage") {
      this.logEvent(
        unitId,
        "system",
        on
          ? "No heartbeat from controller — satellite link down. Local safety rules keep running; readings are buffered on site."
          : "Heartbeat received — satellite link back up.",
        "Hub monitor",
      );
    } else {
      this.logEvent(unitId, "system", `Demo scenario ${on ? "started" : "ended"}: ${meta.label.toLowerCase()}`, "Demo scenario");
    }
    this.toast(on ? "warning" : "info", `${meta.label} ${on ? "simulated" : "cleared"}`, on ? meta.description : undefined);
  }

  /* ---------------- alarms ---------------- */

  private syncAlarmsFromData() {
    this.alarms.clear();
    this.streaks.clear();
    for (const a of this.snap.data.alerts) {
      if (a.resolvedAt) continue;
      const key = `${a.unitId}:${a.code}`;
      const prev = this.alarms.get(key);
      if (!prev || (prev.alertId ?? 0) < a.id) this.alarms.set(key, { status: a.severity, alertId: a.id });
    }
  }

  private evaluateAlarm(
    unitId: string,
    code: AlertCode,
    status: SensorStatus,
    value: number,
    threshold: ThresholdValues | undefined,
    offline: boolean,
  ) {
    const key = `${unitId}:${code}`;
    const prev = this.alarms.get(key) ?? { status: "ok", alertId: null };
    if (status === prev.status) return;

    if (status === "ok") {
      this.alarms.set(key, { status: "ok", alertId: null });
      if (prev.alertId != null) void this.resolveAlertLocal(prev.alertId);
      return;
    }
    const escalates = prev.status === "ok" || (prev.status === "warning" && status === "critical");
    if (!escalates) {
      this.alarms.set(key, { status, alertId: prev.alertId });
      return;
    }
    void this.raiseAlertLocal(unitId, code, status, value, threshold, offline, prev.alertId);
  }

  private async raiseAlertLocal(
    unitId: string,
    code: AlertCode,
    severity: "warning" | "critical",
    value: number,
    threshold: ThresholdValues | undefined,
    offline: boolean,
    existingId: number | null,
  ) {
    const key = `${unitId}:${code}`;
    const direction = threshold ? alertDirection(value, threshold) : "low";
    const copy = alertCopy(code, direction);
    const channel = offline ? "sms" : "whatsapp";
    let localId: number;

    if (existingId != null && this.snap.data.alerts.some((a) => a.id === existingId)) {
      localId = existingId;
      this.setData((d) => ({
        alerts: d.alerts.map((a) =>
          a.id === existingId
            ? { ...a, severity, value, messageTet: copy.tet, messageEn: copy.en, acknowledgedAt: null, acknowledgedBy: null }
            : a,
        ),
      }));
    } else {
      localId = this.tempId--;
      const alert: AlertDTO = {
        id: localId,
        unitId,
        code,
        severity,
        value,
        messageTet: copy.tet,
        messageEn: copy.en,
        channel,
        createdAt: new Date().toISOString(),
        resolvedAt: null,
        acknowledgedAt: null,
        acknowledgedBy: null,
        note: null,
      };
      this.setData((d) => ({ alerts: [alert, ...d.alerts] }));
    }
    this.alarms.set(key, { status: severity, alertId: localId });

    const unitName = this.snap.data.units.find((u) => u.id === unitId)?.name ?? unitId;
    this.toast(severity, `${unitName} · ${ALERT_LABEL[code]} ${severity === "critical" ? "critical" : "out of range"}`, copy.tet);

    if (!this.canPersist) return;
    const res = await api.raiseAlert({ unitId, code, severity, direction, value, channel });
    if (!res.ok) return; // keep the local alert; it is still visible and acknowledgeable
    const row = res.data;
    const local = this.snap.data.alerts.find((a) => a.id === localId);
    const ackedLocally = !!local?.acknowledgedAt && !row.acknowledgedAt;
    this.setData((d) => {
      const others = d.alerts.filter((a) => a.id !== localId && a.id !== row.id);
      const merged: AlertDTO = {
        ...row,
        resolvedAt: local?.resolvedAt ?? row.resolvedAt,
        acknowledgedAt: local?.acknowledgedAt ?? row.acknowledgedAt,
        acknowledgedBy: local?.acknowledgedBy ?? row.acknowledgedBy,
        note: local?.note ?? row.note,
      };
      return { alerts: [merged, ...others].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
    });
    const current = this.alarms.get(key);
    if (current?.alertId === localId) this.alarms.set(key, { ...current, alertId: row.id });
    if (local?.resolvedAt && !row.resolvedAt) void api.resolveAlert({ id: row.id });
    if (ackedLocally && local?.acknowledgedBy) {
      void api.acknowledgeAlerts({ ids: [row.id], by: local.acknowledgedBy, note: local.note ?? undefined });
    }
  }

  private async resolveAlertLocal(id: number) {
    const now = new Date().toISOString();
    this.setData((d) => ({ alerts: d.alerts.map((a) => (a.id === id && !a.resolvedAt ? { ...a, resolvedAt: now } : a)) }));
    if (id > 0 && this.canPersist) {
      const res = await api.resolveAlert({ id });
      if (res.ok) this.setData((d) => ({ alerts: d.alerts.map((a) => (a.id === id ? res.data : a)) }));
    }
  }

  async acknowledge(ids: number[], note?: string) {
    if (ids.length === 0) return null;
    const by = this.snap.operator;
    const now = new Date().toISOString();
    const before = this.snap.data.alerts;
    this.setData((d) => ({
      alerts: d.alerts.map((a) =>
        ids.includes(a.id) && !a.acknowledgedAt ? { ...a, acknowledgedAt: now, acknowledgedBy: by, note: note || null } : a,
      ),
    }));
    const persistIds = ids.filter((id) => id > 0);
    if (!this.canPersist || persistIds.length === 0) {
      this.localEvent(null, "alarm", ids.length === 1 ? "Alert acknowledged" : `${ids.length} alerts acknowledged`, by);
      this.toast("success", ids.length === 1 ? "Alert acknowledged" : `${ids.length} alerts acknowledged`);
      return null;
    }
    const res = await this.call("ack", () => api.acknowledgeAlerts({ ids: persistIds, by, note }));
    if (!res.ok) {
      this.setData(() => ({ alerts: before }));
      return res.error;
    }
    const map = new Map(res.data.alerts.map((a) => [a.id, a]));
    this.setData((d) => ({ alerts: d.alerts.map((a) => map.get(a.id) ?? a) }));
    if (res.data.event) this.pushEvent(res.data.event);
    this.toast("success", ids.length === 1 ? "Alert acknowledged" : `${ids.length} alerts acknowledged`);
    return null;
  }

  /* ---------------- events & toasts ---------------- */

  private pushEvent(ev: EventDTO) {
    this.setData((d) => ({ events: [ev, ...d.events.filter((e) => e.id !== ev.id)].slice(0, MAX_EVENTS_IN_MEMORY) }));
  }

  private localEvent(unitId: string | null, category: EventCategory, message: string, actor: string) {
    const ev: EventDTO = { id: this.tempId--, unitId, category, message, actor, createdAt: new Date().toISOString() };
    this.pushEvent(ev);
    return ev;
  }

  /**
   * Show an event immediately. Only human-originated events are persisted:
   * automation, link and scenario events come from this browser's simulated
   * readings, so they stay in this session — otherwise every open tab would
   * write its own copy to the shared database.
   */
  private logEvent(unitId: string, category: EventCategory, message: string, actor: string, persist = false) {
    const local = this.localEvent(unitId, category, message, actor);
    if (!persist || !this.canPersist) return;
    void api.logAutomationEvent({ unitId, message, actor, category }).then((res) => {
      if (res.ok) this.setData((d) => ({ events: d.events.map((e) => (e.id === local.id ? res.data : e)) }));
    });
  }

  toast(tone: ToastTone, title: string, description?: string) {
    const id = this.toastId++;
    this.set({ toasts: [...this.snap.toasts, { id, tone, title, description }].slice(-MAX_TOASTS) });
    setTimeout(() => this.dismissToast(id), tone === "critical" ? 9_000 : 5_000);
  }

  dismissToast(id: number) {
    if (!this.snap.toasts.some((t) => t.id === id)) return;
    this.set({ toasts: this.snap.toasts.filter((t) => t.id !== id) });
  }

  /**
   * Run a server action with a pending flag and error toast.
   * In fallback mode nothing is sent and the change stays local.
   */
  private async call<T>(key: string, fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
    if (!this.canPersist) {
      if (!this.offlineNoticeShown) {
        this.offlineNoticeShown = true;
        this.toast("info", "Offline demo mode", "The database is unavailable, so changes are kept in this browser only.");
      }
      return { ok: false, error: "offline" };
    }
    this.set({ pending: { ...this.snap.pending, [key]: true } });
    try {
      const res = await fn();
      if (!res.ok) this.toast("error", "Could not save", res.error);
      return res;
    } catch {
      const error = "Network error — please try again.";
      this.toast("error", "Could not save", error);
      return { ok: false, error };
    } finally {
      const { [key]: _done, ...rest } = this.snap.pending;
      void _done;
      this.set({ pending: rest });
    }
  }

  /* ---------------- preferences ---------------- */

  selectUnit(id: string) {
    if (!this.snap.data.units.some((u) => u.id === id)) return;
    writeLS(LS_UNIT, id);
    this.set({ selectedUnitId: id });
  }

  setOperator(name: string) {
    const clean = name.trim().slice(0, 60) || "Operator";
    writeLS(LS_OPERATOR, clean);
    this.set({ operator: clean });
  }

  /* ---------------- controls ---------------- */

  private patchActuator(unitId: string, kind: ActuatorKind, patch: Partial<ActuatorDTO>) {
    this.setData((d) => ({
      actuators: d.actuators.map((a) => (a.unitId === unitId && a.kind === kind ? { ...a, ...patch } : a)),
    }));
  }
  private replaceActuator(row: ActuatorDTO) {
    this.setData((d) => ({ actuators: d.actuators.map((a) => (a.id === row.id ? row : a)) }));
  }
  private actuator(unitId: string, kind: ActuatorKind) {
    return this.snap.data.actuators.find((a) => a.unitId === unitId && a.kind === kind);
  }

  async setActuatorPower(unitId: string, kind: ActuatorKind, isOn: boolean) {
    const before = this.actuator(unitId, kind);
    if (!before) return;
    const by = this.snap.operator;
    this.patchActuator(unitId, kind, { isOn, updatedAt: new Date().toISOString(), updatedBy: by });
    this.recomputeUnit(unitId);
    const res = await this.call(`power:${unitId}:${kind}`, () => api.setActuatorPower({ unitId, kind, isOn, actor: by }));
    if (res.ok) {
      this.replaceActuator(res.data.actuator);
      this.pushEvent(res.data.event);
    } else if (res.error === "offline") {
      this.localEvent(unitId, "control", `${ACTUATORS[kind].label} turned ${isOn ? "ON" : "OFF"} manually`, by);
    } else {
      this.replaceActuator(before);
      this.recomputeUnit(unitId);
    }
  }

  async setActuatorMode(unitId: string, kind: ActuatorKind, mode: ActuatorMode) {
    const before = this.actuator(unitId, kind);
    if (!before || before.mode === mode) return;
    const by = this.snap.operator;
    // Switching to manual keeps the actuator in whatever state it is in right now.
    const currentOn = this.snap.live[unitId]?.actuators[kind]?.on ?? before.isOn;
    this.patchActuator(unitId, kind, { mode, isOn: mode === "manual" ? currentOn : before.isOn, updatedBy: by });
    this.recomputeUnit(unitId);
    const res = await this.call(`mode:${unitId}:${kind}`, () =>
      api.setActuatorMode({ unitId, kind, mode, isOn: mode === "manual" ? currentOn : undefined, actor: by }),
    );
    if (res.ok) {
      this.replaceActuator(res.data.actuator);
      this.pushEvent(res.data.event);
    } else if (res.error === "offline") {
      this.localEvent(unitId, "config", `${ACTUATORS[kind].label} switched to ${mode} mode`, by);
    } else {
      this.replaceActuator(before);
      this.recomputeUnit(unitId);
    }
  }

  async saveSchedule(unitId: string, kind: ActuatorKind, onMin: number, offMin: number) {
    const before = this.actuator(unitId, kind);
    if (!before) return "Actuator not found";
    const by = this.snap.operator;
    this.patchActuator(unitId, kind, { scheduleOnMin: onMin, scheduleOffMin: offMin });
    this.recomputeUnit(unitId);
    const res = await this.call(`schedule:${unitId}:${kind}`, () => api.saveSchedule({ unitId, kind, onMin, offMin, actor: by }));
    if (res.ok) {
      this.replaceActuator(res.data.actuator);
      this.pushEvent(res.data.event);
      this.toast("success", `${ACTUATORS[kind].label} schedule saved`);
      return null;
    }
    if (res.error === "offline") return null;
    this.replaceActuator(before);
    this.recomputeUnit(unitId);
    return res.error;
  }

  /* ---------------- thresholds & rules ---------------- */

  async saveThreshold(unitId: string, sensor: SensorKey, values: ThresholdValues & { alarmEnabled: boolean }) {
    const before = this.snap.data.thresholds.find((t) => t.unitId === unitId && t.sensor === sensor);
    if (!before) return "Threshold not found";
    const by = this.snap.operator;
    this.setData((d) => ({
      thresholds: d.thresholds.map((t) => (t.id === before.id ? { ...t, ...values } : t)),
    }));
    this.recomputeUnit(unitId);
    const res = await this.call(`threshold:${unitId}:${sensor}`, () => api.saveThreshold({ unitId, sensor, ...values, actor: by }));
    if (res.ok) {
      this.setData((d) => ({ thresholds: d.thresholds.map((t) => (t.id === res.data.threshold.id ? res.data.threshold : t)) }));
      this.pushEvent(res.data.event);
      this.toast("success", `${SENSORS[sensor].label} alarm saved`);
      return null;
    }
    if (res.error === "offline") return null;
    this.setData((d) => ({ thresholds: d.thresholds.map((t) => (t.id === before.id ? before : t)) }));
    return res.error;
  }

  async applyPreset(unitId: string, presetId: string) {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const by = this.snap.operator;
    const before = this.snap.data.thresholds;
    this.setData((d) => ({
      thresholds: d.thresholds.map((t) => (t.unitId === unitId ? { ...t, ...preset.values[t.sensor] } : t)),
    }));
    this.recomputeUnit(unitId);
    const res = await this.call(`preset:${unitId}`, () => api.applyPreset({ unitId, presetId, actor: by }));
    if (res.ok) {
      const map = new Map(res.data.thresholds.map((t) => [t.id, t]));
      this.setData((d) => ({ thresholds: d.thresholds.map((t) => map.get(t.id) ?? t) }));
      this.pushEvent(res.data.event);
      this.toast("success", `Preset applied: ${preset.label}`);
    } else if (res.error !== "offline") {
      this.setData(() => ({ thresholds: before }));
    }
  }

  async createRule(input: Omit<RuleDTO, "id">) {
    const temp: RuleDTO = { ...input, id: this.tempId-- };
    const by = this.snap.operator;
    this.setData((d) => ({ rules: [...d.rules, temp] }));
    this.recomputeUnit(input.unitId);
    const res = await this.call("rule:new", () => api.createRule({ ...input, actor: by }));
    if (res.ok) {
      this.setData((d) => ({ rules: d.rules.map((r) => (r.id === temp.id ? res.data.rule : r)) }));
      this.pushEvent(res.data.event);
      this.toast("success", "Automation rule added");
      return null;
    }
    if (res.error === "offline") return null;
    this.setData((d) => ({ rules: d.rules.filter((r) => r.id !== temp.id) }));
    this.recomputeUnit(input.unitId);
    return res.error;
  }

  async updateRule(rule: RuleDTO) {
    const before = this.snap.data.rules.find((r) => r.id === rule.id);
    if (!before) return "Rule not found";
    const by = this.snap.operator;
    this.setData((d) => ({ rules: d.rules.map((r) => (r.id === rule.id ? rule : r)) }));
    this.recomputeUnit(rule.unitId);
    if (rule.id < 0) return null;
    const res = await this.call(`rule:${rule.id}`, () => api.updateRule({ ...rule, actor: by }));
    if (res.ok) {
      this.setData((d) => ({ rules: d.rules.map((r) => (r.id === rule.id ? res.data.rule : r)) }));
      this.pushEvent(res.data.event);
      return null;
    }
    if (res.error === "offline") return null;
    this.setData((d) => ({ rules: d.rules.map((r) => (r.id === rule.id ? before : r)) }));
    this.recomputeUnit(rule.unitId);
    return res.error;
  }

  async deleteRule(rule: RuleDTO) {
    const before = this.snap.data.rules;
    const by = this.snap.operator;
    this.setData((d) => ({ rules: d.rules.filter((r) => r.id !== rule.id) }));
    this.recomputeUnit(rule.unitId);
    if (rule.id < 0) return;
    const res = await this.call(`rule:${rule.id}`, () => api.deleteRule({ id: rule.id, unitId: rule.unitId, actor: by }));
    if (res.ok) {
      this.pushEvent(res.data.event);
      this.toast("success", "Rule removed");
    } else if (res.error !== "offline") {
      this.setData(() => ({ rules: before }));
      this.recomputeUnit(rule.unitId);
    }
  }

  /* ---------------- harvest ---------------- */

  async addHarvest(input: { unitId: string; crop: string; weightKg: number; buyer: string; harvestedAt: string }) {
    const crop = CROP_BY_ID[input.crop];
    if (!crop) return "Pick a crop";
    const by = this.snap.operator;
    const temp: HarvestDTO = {
      id: this.tempId--,
      unitId: input.unitId,
      crop: crop.id,
      category: crop.category,
      weightKg: Math.round(input.weightKg * 10) / 10,
      pricePerKg: crop.floorPrice,
      buyer: input.buyer,
      status: "logged",
      harvestedAt: input.harvestedAt,
    };
    const res = await this.call("harvest:new", () => api.addHarvest({ ...input, actor: by }));
    if (res.ok) {
      this.setData((d) => ({ harvests: [res.data.harvest, ...d.harvests] }));
      this.pushEvent(res.data.event);
    } else if (res.error === "offline") {
      this.setData((d) => ({ harvests: [temp, ...d.harvests] }));
    } else {
      return res.error;
    }
    this.toast("success", "Harvest logged", `${temp.weightKg} kg ${crop.label.toLowerCase()} · buy-back US$${(temp.weightKg * crop.floorPrice).toFixed(2)}`);
    return null;
  }

  async setHarvestStatus(id: number, status: HarvestStatus) {
    const before = this.snap.data.harvests.find((h) => h.id === id);
    if (!before) return;
    this.setData((d) => ({ harvests: d.harvests.map((h) => (h.id === id ? { ...h, status } : h)) }));
    if (id < 0) return;
    const res = await this.call(`harvest:${id}`, () => api.setHarvestStatus({ id, status }));
    if (!res.ok && res.error !== "offline") {
      this.setData((d) => ({ harvests: d.harvests.map((h) => (h.id === id ? before : h)) }));
    }
  }

  async deleteHarvest(id: number) {
    const before = this.snap.data.harvests;
    this.setData((d) => ({ harvests: d.harvests.filter((h) => h.id !== id) }));
    if (id < 0) return;
    const res = await this.call(`harvest:${id}`, () => api.deleteHarvest({ id }));
    if (!res.ok && res.error !== "offline") this.setData(() => ({ harvests: before }));
  }

  /* ---------------- maintenance, activity, assistant ---------------- */

  async logMaintenance(unitId: string, kind: "test-strip" | "calibration", ph?: number, ammonia?: number) {
    const by = this.snap.operator;
    const res = await this.call(`maint:${kind}`, () => api.logMaintenance({ unitId, kind, ph, ammonia, actor: by }));
    const label = kind === "calibration" ? "Calibration logged" : "Test strip logged";
    if (res.ok) {
      this.pushEvent(res.data);
      this.toast("success", label);
      return null;
    }
    if (res.error === "offline") {
      this.localEvent(
        unitId,
        "maintenance",
        kind === "calibration"
          ? "Monthly sensor calibration completed"
          : `Weekly manual test strip logged — pH ${ph ?? "n/a"}, ammonia ${ammonia ?? "n/a"} ppm`,
        by,
      );
      this.toast("success", label);
      return null;
    }
    return res.error;
  }

  async loadMoreEvents() {
    const oldest = this.snap.data.events.filter((e) => e.id > 0).reduce((m, e) => Math.min(m, e.id), Infinity);
    if (!this.canPersist || !Number.isFinite(oldest)) {
      this.set({ hasMoreEvents: false });
      return;
    }
    const res = await this.call("events:more", () => api.fetchEvents({ beforeId: oldest, limit: 40 }));
    if (!res.ok) return;
    const seen = new Set(this.snap.data.events.map((e) => e.id));
    this.setData((d) => ({ events: [...d.events, ...res.data.filter((e) => !seen.has(e.id))] }));
    this.set({ hasMoreEvents: res.data.length === 40 });
  }

  escalateToAgronomist(unitId: string, question: string) {
    this.logEvent(
      unitId,
      "system",
      `Tulun VIEM handed a question to the VIEM agronomist: “${question.slice(0, 160)}”`,
      "Tulun VIEM",
      true,
    );
    this.toast("info", "Sent to the VIEM agronomist", "A person will reply on WhatsApp — answers target < 2 hours.");
  }

  async resetDemo() {
    const res = this.canPersist
      ? await this.call("reset", () => api.resetDemo())
      : ({ ok: true, data: buildFallbackData(this.snap.data.sourceNote ?? "Offline demo") } as const);
    if (!res.ok) return;
    const data = res.data;
    this.set({ data, hasMoreEvents: data.events.length >= 60 });
    this.syncAlarmsFromData();
    const live = { ...this.snap.live };
    for (const id of Object.keys(live)) live[id] = { ...live[id], scenarios: { ...NO_SCENARIOS }, runtimeMs: zeroRuntime() };
    this.set({ live });
    for (const id of Object.keys(live)) this.recomputeUnit(id);
    this.toast("success", "Demo data reset", "Controls, rules, alarms and harvests are back to their starting values.");
  }
}

/* ---------------- selectors ---------------- */

export function selectUnit(s: Snapshot, unitId = s.selectedUnitId) {
  return s.data.units.find((u) => u.id === unitId) ?? s.data.units[0];
}

export function selectThresholds(s: Snapshot, unitId = s.selectedUnitId) {
  return thresholdMap(s.data.thresholds, unitId);
}

export function openAlerts(s: Snapshot, unitId?: string) {
  return s.data.alerts.filter((a) => (!unitId || a.unitId === unitId) && (!a.acknowledgedAt || !a.resolvedAt));
}

export function unacknowledged(s: Snapshot, unitId?: string) {
  return s.data.alerts.filter((a) => (!unitId || a.unitId === unitId) && !a.acknowledgedAt);
}

