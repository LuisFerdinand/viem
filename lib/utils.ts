import { twMerge } from "tailwind-merge";

/** Join class names and resolve Tailwind conflicts (later classes win). */
export function cn(...parts: (string | false | null | undefined)[]) {
  return twMerge(parts.filter(Boolean).join(" "));
}

const TZ = "Asia/Dili";

const timeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const timeSecFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});
const dateFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "short" });
const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** All dashboard times are shown in Timor-Leste time (UTC+9). */
export const fmtTime = (d: Date | number | string) => timeFmt.format(new Date(d));
export const fmtTimeSec = (d: Date | number | string) => timeSecFmt.format(new Date(d));
export const fmtDate = (d: Date | number | string) => dateFmt.format(new Date(d));
export const fmtDateTime = (d: Date | number | string) => dateTimeFmt.format(new Date(d));

export function fmtRelative(from: Date | number | string, now: number) {
  const diff = Math.max(0, now - new Date(from).getTime());
  const s = Math.round(diff / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return `${d} d ago`;
}

export function fmtDuration(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, "0")}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${String(m % 60).padStart(2, "0")}m`;
}

export const usd = (n: number, digits = 0) =>
  `US$${n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

export const kg = (n: number) => `${n.toLocaleString("en-US", { maximumFractionDigits: 1 })} kg`;

/** Today's date in Timor-Leste as YYYY-MM-DD. */
export function todayInDili(now = Date.now()) {
  return new Date(now + 9 * 3_600_000).toISOString().slice(0, 10);
}
