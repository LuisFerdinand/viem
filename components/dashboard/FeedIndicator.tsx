"use client";

import { useLanguage } from "./LanguageProvider";

import { Pause, Play, RefreshCw } from "lucide-react";
import { TICK_MS } from "@/lib/sim/engine";
import { fmtTimeSec } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useNow, useSnapshot, useStore } from "./DashboardProvider";

const LABEL: Record<string, [string, string?]> = {
  starting: ["Connecting…"],
  live: ["Live"],
  idle: ["Paused", " — no activity"],
  hidden: ["Paused", " — tab hidden"],
  paused: ["Paused"],
};

/** Shows the 30-second gathering cycle and lets the user pause, resume or read now. */
export function FeedIndicator() {
  const { tr } = useLanguage();
  const store = useStore();
  const { feed } = useSnapshot();
  const now = useNow();
  const live = feed.status === "live";
  const secondsLeft = live && feed.nextTickAt && now ? Math.max(0, Math.ceil((feed.nextTickAt - now) / 1000)) : null;
  const progress = secondsLeft == null ? 0 : 1 - (secondsLeft * 1000) / TICK_MS;

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn(
          "flex h-9 items-center gap-2 rounded-full pr-3 pl-1.5 text-xs font-medium ring-1",
          live ? "bg-ok-50 text-ok-700 ring-ok-500/20" : "bg-forest-50 text-forest-700 ring-forest-100",
        )}
        role="status"
        aria-live="polite"
      >
        <span className="relative flex size-6 items-center justify-center" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="absolute inset-0 -rotate-90">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2.5" />
            {live && (
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray={2 * Math.PI * 10}
                strokeDashoffset={2 * Math.PI * 10 * (1 - progress)}
                strokeLinecap="round"
                className="transition-[stroke-dashoffset] duration-1000 ease-linear"
              />
            )}
          </svg>
          <span className={cn("size-2 rounded-full", live ? "bg-ok-500 text-ok-500 motion-safe:animate-pulse-ring" : "bg-forest-300")} />
        </span>
        <span className="whitespace-nowrap">
          {tr(LABEL[feed.status][0])}
          {LABEL[feed.status][1] && <span className="hidden sm:inline">{tr(LABEL[feed.status][1])}</span>}
          {live && secondsLeft != null && <span className="hidden text-ok-700/80 sm:inline"> {tr("· next in")}{" "}{tr(secondsLeft)}{tr("s")}</span>}
        </span>
        {feed.lastTickAt && (
          <span className="hidden border-l border-current/20 pl-2 text-[0.7rem] opacity-80 xl:inline">{tr("Last")}{" "}{tr(fmtTimeSec(feed.lastTickAt))}</span>
        )}
      </div>
      {live ? (
        <button
          type="button"
          onClick={() => store.pause()}
          aria-label={tr("Pause live feed")}
          title={tr("Pause live feed")}
          className="inline-flex size-9 items-center justify-center rounded-full text-forest-700 ring-1 ring-forest-100 transition-colors hover:bg-forest-50"
        >
          <Pause className="size-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => store.resume()}
          aria-label={tr("Resume live feed")}
          title={tr("Resume live feed")}
          className="inline-flex size-9 items-center justify-center rounded-full bg-forest-800 text-white transition-colors hover:bg-forest-700"
        >
          <Play className="size-4" />
        </button>
      )}
      <button
        type="button"
        onClick={() => store.readNow()}
        aria-label={tr("Take a reading now")}
        title={tr("Take a reading now")}
        className="inline-flex size-9 items-center justify-center rounded-full text-forest-700 ring-1 ring-forest-100 transition-colors hover:bg-forest-50"
      >
        <RefreshCw className="size-4" />
      </button>
    </div>
  );
}
