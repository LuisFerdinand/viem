"use client";

import { ArrowRight, ChevronLeft, ChevronRight, Fish, Recycle, Sprout, Sun, Truck, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { LOOP_STAGES } from "@/lib/content";
import { cn } from "@/lib/utils";

const META: Record<(typeof LOOP_STAGES)[number]["id"], { icon: LucideIcon; label: string }> = {
  waste: { icon: Recycle, label: "Waste" },
  fish: { icon: Fish, label: "Fish" },
  plants: { icon: Sprout, label: "Plants" },
  energy: { icon: Sun, label: "Rain & sun" },
  harvest: { icon: Truck, label: "Harvest" },
};

export function LoopDiagram() {
  const [active, setActive] = useState(0);
  const stage = LOOP_STAGES[active];
  const go = (d: number) => setActive((i) => (i + d + LOOP_STAGES.length) % LOOP_STAGES.length);

  return (
    <div className="grid items-center gap-12 lg:grid-cols-2">
      <div className="relative mx-auto aspect-square w-full max-w-[28rem]">
        <svg viewBox="0 0 400 400" className="absolute inset-0 size-full" aria-hidden="true">
          <defs>
            <marker id="loop-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 10 5 0 10z" fill="#7aa832" />
            </marker>
          </defs>
          <circle cx="200" cy="200" r="150" fill="none" stroke="#c5dbd0" strokeWidth="2" />
          <circle
            cx="200"
            cy="200"
            r="150"
            fill="none"
            stroke="#7aa832"
            strokeWidth="2.5"
            strokeDasharray="6 18"
            strokeLinecap="round"
            className="motion-safe:animate-flow"
          />
          {LOOP_STAGES.map((_, i) => {
            const a = ((-90 + i * 72 + 36) * Math.PI) / 180;
            const x = 200 + 150 * Math.cos(a);
            const y = 200 + 150 * Math.sin(a);
            const tx = -Math.sin(a);
            const ty = Math.cos(a);
            return (
              <line
                key={i}
                x1={x - tx * 6}
                y1={y - ty * 6}
                x2={x + tx * 6}
                y2={y + ty * 6}
                stroke="#7aa832"
                strokeWidth="2.5"
                markerEnd="url(#loop-arrow)"
              />
            );
          })}
        </svg>

        <div className="absolute inset-[26%] flex flex-col items-center justify-center rounded-full bg-forest-900 p-4 text-center text-white shadow-lift">
          <p className="eyebrow text-[0.6rem] text-leaf-300 sm:text-xs">The VIEM loop</p>
          <p className="mt-1.5 font-display text-lg leading-tight italic sm:text-2xl">Every output feeds the next</p>
        </div>

        {LOOP_STAGES.map((s, i) => {
          const a = ((-90 + i * 72) * Math.PI) / 180;
          const { icon: Icon, label } = META[s.id];
          const selected = i === active;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={selected}
              aria-controls="loop-detail"
              style={{ left: `${50 + 37.5 * Math.cos(a)}%`, top: `${50 + 37.5 * Math.sin(a)}%` }}
              className={cn(
                "absolute flex size-[4.6rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-full border-2 text-[0.68rem] font-semibold shadow-soft transition-[background-color,border-color,color,transform] duration-200 sm:size-24 sm:text-xs",
                selected
                  ? "scale-105 border-leaf-400 bg-leaf-400 text-forest-950"
                  : "border-forest-200 bg-white text-forest-800 hover:border-leaf-400",
              )}
            >
              <Icon className="size-5 sm:size-6" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>

      <div id="loop-detail" aria-live="polite" className="rounded-3xl border border-forest-100 bg-white p-7 shadow-soft md:p-9">
        <p className="eyebrow text-forest-500">
          Stage {active + 1} of {LOOP_STAGES.length}
        </p>
        <h3 className="mt-3 font-display text-3xl font-medium text-forest-900">{stage.input}</h3>
        <ol className="mt-7 grid gap-3">
          {[
            ["Process", stage.process],
            ["Output", stage.output],
            ["Goes to", stage.goesTo],
          ].map(([k, v], idx) => (
            <li key={k} className="flex items-start gap-4 rounded-2xl bg-forest-50 p-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-forest-700 text-sm font-semibold text-white">
                {idx + 1}
              </span>
              <span>
                <span className="block text-xs font-semibold tracking-wider text-forest-500 uppercase">{k}</span>
                <span className="mt-0.5 block text-base font-medium text-forest-900">{v}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-7 flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm text-muted">
            <ArrowRight className="size-4 text-leaf-600" aria-hidden="true" />
            Feeds into: <strong className="font-semibold text-forest-800">{META[LOOP_STAGES[(active + 1) % LOOP_STAGES.length].id].label}</strong>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous stage"
              className="inline-flex size-11 items-center justify-center rounded-full border border-forest-200 text-forest-700 transition-colors hover:bg-forest-50"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next stage"
              className="inline-flex size-11 items-center justify-center rounded-full bg-forest-700 text-white transition-colors hover:bg-forest-800"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
