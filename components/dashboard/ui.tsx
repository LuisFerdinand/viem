"use client";

import { useLanguage } from "./LanguageProvider";

import { CircleCheck, CircleAlert, OctagonAlert, type LucideIcon } from "lucide-react";
import { useId, type ComponentProps, type ReactNode } from "react";
import type { SensorStatus, ThresholdValues } from "@/lib/domain";
import { cn } from "@/lib/utils";

export function Card({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  id,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
}) {
  const { tr } = useLanguage();
  return (
    <section id={id} className={cn("overflow-hidden rounded-2xl border border-forest-100 bg-white shadow-[0_2px_8px_rgb(2_16_16/0.025)]", className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-forest-100/70 px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-[0.95rem] font-semibold text-forest-900">{typeof title === "string" ? tr(title) : title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted">{typeof description === "string" ? tr(description) : description}</p>}
          </div>
          {action && <div className="flex max-w-full flex-wrap items-center gap-2">{action}</div>}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  const { tr } = useLanguage();
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="mb-2 text-[10px] font-semibold tracking-[0.18em] text-forest-500 uppercase">{tr("VIEM · Farm workspace")}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-forest-900 md:text-3xl">{tr(title)}</h1>
        {description && <p className="mt-1.5 max-w-3xl text-sm text-muted">{typeof description === "string" ? tr(description) : description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const STATUS_META: Record<SensorStatus, { label: string; icon: LucideIcon; className: string }> = {
  ok: { label: "Normal", icon: CircleCheck, className: "bg-ok-50 text-ok-700" },
  warning: { label: "Warning", icon: CircleAlert, className: "bg-warn-50 text-warn-700" },
  critical: { label: "Critical", icon: OctagonAlert, className: "bg-crit-50 text-crit-700" },
};

export function StatusBadge({ status, className, label }: { status: SensorStatus; className?: string; label?: string }) {
  const { tr } = useLanguage();
  const m = STATUS_META[status];
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", m.className, className)}>
      <Icon className="size-3.5" aria-hidden="true" />
      {tr(label ?? m.label)}
    </span>
  );
}

export function Pill({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "leaf" | "water" | "warn" | "crit" | "dark"; className?: string }) {
  const tones = {
    neutral: "bg-forest-50 text-forest-700 ring-1 ring-forest-100",
    leaf: "bg-leaf-50 text-leaf-700 ring-1 ring-leaf-100",
    water: "bg-water-50 text-water-700 ring-1 ring-water-100",
    warn: "bg-warn-50 text-warn-700",
    crit: "bg-crit-50 text-crit-700",
    dark: "bg-forest-800 text-white",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", tones[tone], className)}>{children}</span>;
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
  size = "md",
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
  size?: "md" | "lg";
}) {
  const { tr } = useLanguage();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={tr(label)}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-45",
        size === "lg" ? "h-8 w-14" : "h-6 w-11",
        checked ? "bg-leaf-500" : "bg-forest-200",
        // generous invisible hit area for touch
        "before:absolute before:-inset-2 before:content-['']",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "rounded-full bg-white shadow transition-transform duration-200 ease-soft",
          size === "lg" ? "size-7" : "size-5",
          checked && (size === "lg" ? "translate-x-6" : "translate-x-5"),
        )}
      />
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  disabled,
  className,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  const { tr } = useLanguage();
  return (
    <div role="radiogroup" aria-label={tr(label)} className={cn("inline-flex rounded-full bg-forest-50 p-1 ring-1 ring-forest-100", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => !active && onChange(o.value)}
            className={cn(
              "min-h-8 flex-1 rounded-full px-3 text-xs font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              active ? "bg-forest-800 text-white shadow-sm" : "text-forest-700 hover:bg-white",
            )}
          >
            {tr(o.label)}
          </button>
        );
      })}
    </div>
  );
}

export function Sparkline({ values, color, className, band }: { values: number[]; color: string; className?: string; band?: [number, number] }) {
  if (values.length < 2) return <div className={cn("h-10", className)} />;
  const w = 120;
  const h = 36;
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (band) {
    lo = Math.min(lo, band[0]);
    hi = Math.max(hi, band[1]);
  }
  const pad = (hi - lo) * 0.1 || 1;
  lo -= pad;
  hi += pad;
  const x = (i: number) => (i / (values.length - 1)) * w;
  const y = (v: number) => h - ((v - lo) / (hi - lo)) * h;
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={cn("h-10 w-full overflow-visible", className)} aria-hidden="true">
      {band && <rect x="0" width={w} y={y(band[1])} height={Math.max(0, y(band[0]) - y(band[1]))} fill="#22935d" opacity="0.07" />}
      <path d={`${d} L${w} ${h} L0 ${h} Z`} fill={color} opacity="0.1" />
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Where the current value sits relative to the normal band and critical limits. */
export function RangeBar({ value, t, domain, color }: { value: number; t: ThresholdValues; domain: [number, number]; color: string }) {
  const lo = Math.min(domain[0], t.criticalMin);
  const hi = Math.max(domain[1], t.criticalMax);
  const pct = (v: number) => `${Math.min(100, Math.max(0, ((v - lo) / (hi - lo)) * 100))}%`;
  return (
    <div className="relative h-2 rounded-full bg-crit-50" aria-hidden="true">
      <div className="absolute inset-y-0 bg-warn-50" style={{ left: pct(t.criticalMin), right: `calc(100% - ${pct(t.criticalMax)})` }} />
      <div className="absolute inset-y-0 bg-ok-50 ring-1 ring-ok-500/20" style={{ left: pct(t.min), right: `calc(100% - ${pct(t.max)})` }} />
      <div
        className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
        style={{ left: pct(value), backgroundColor: color }}
      />
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  children: (props: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => ReactNode;
  className?: string;
}) {
  const { tr } = useLanguage();
  const id = useId();
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const describedBy = [hint ? hintId : null, error ? errId : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={id} className="text-xs font-semibold text-forest-800">
        {tr(label)}
      </label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted">
          {typeof hint === "string" ? tr(hint) : hint}
        </p>
      )}
      {error && (
        <p id={errId} role="alert" className="text-xs font-medium text-crit-700">
          {tr(error)}
        </p>
      )}
    </div>
  );
}

export const inputClass =
  "h-11 w-full rounded-xl border border-forest-200 bg-white px-3 text-sm text-forest-950 placeholder:text-forest-400 transition-colors hover:border-forest-300 focus:border-leaf-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf-200 aria-[invalid=true]:border-crit-500 disabled:bg-forest-50 disabled:text-muted";

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

export function Select(props: ComponentProps<"select">) {
  return <select {...props} className={cn(inputClass, "pr-8", props.className)} />;
}

export function EmptyState({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
  const { tr } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-forest-200 px-6 py-10 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-forest-50 text-forest-500">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-3 text-sm font-semibold text-forest-900">{tr(title)}</p>
      {children && <div className="mt-1 max-w-sm text-sm text-muted">{children}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-forest-100/70", className)} />;
}
