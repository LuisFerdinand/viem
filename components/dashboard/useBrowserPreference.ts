"use client";

import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
const session = new Map<string, string>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => { listeners.delete(listener); window.removeEventListener("storage", listener); };
}

/** Stable server defaults avoid hydration mismatches; storage events update other tabs. */
export function useBrowserPreference(key: string, fallback: string): readonly [string, (value: string) => void] {
  const getSnapshot = useCallback(() => {
    try { return localStorage.getItem(key) ?? session.get(key) ?? fallback; }
    catch { return session.get(key) ?? fallback; }
  }, [key, fallback]);
  const value = useSyncExternalStore(subscribe, getSnapshot, () => fallback);
  const set = useCallback((next: string) => {
    session.set(key, next);
    try { localStorage.setItem(key, next); } catch { /* Keep the session preference. */ }
    listeners.forEach((listener) => listener());
  }, [key]);
  return [value, set];
}
