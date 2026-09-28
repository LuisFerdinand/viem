"use client";

import { createContext, use, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { DashboardStore, type Snapshot } from "@/lib/sim/store";
import type { DashboardData } from "@/lib/types";

const StoreContext = createContext<DashboardStore | null>(null);

export function DashboardProvider({ initialData, children }: { initialData: DashboardData; children: ReactNode }) {
  const [store] = useState(() => new DashboardStore(initialData));
  useEffect(() => {
    store.start();
    return () => store.stop();
  }, [store]);
  return <StoreContext value={store}>{children}</StoreContext>;
}

export function useStore() {
  const store = use(StoreContext);
  if (!store) throw new Error("useStore must be used inside <DashboardProvider>");
  return store;
}

export function useSnapshot(): Snapshot {
  const store = useStore();
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

/* A shared once-per-second clock for countdowns and relative times. */
let clockNow = 0;
let clockTimer: ReturnType<typeof setInterval> | null = null;
const clockListeners = new Set<() => void>();

function subscribeClock(listener: () => void) {
  clockListeners.add(listener);
  if (!clockTimer) {
    clockNow = Date.now();
    clockTimer = setInterval(() => {
      clockNow = Date.now();
      for (const l of clockListeners) l();
    }, 1000);
    queueMicrotask(() => {
      for (const l of clockListeners) l();
    });
  }
  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0 && clockTimer) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
  };
}

/** Current time, updated every second. Returns 0 during server render / hydration. */
export function useNow() {
  return useSyncExternalStore(
    subscribeClock,
    () => clockNow,
    () => 0,
  );
}
