"use client";

import { createContext, use, useCallback, type ReactNode } from "react";
import { isLanguage, translate, type Language } from "@/lib/i18n";
import { dashboardFormatters } from "@/lib/dashboard-format";
import { useBrowserPreference } from "./useBrowserPreference";

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  tr: (source: string | number | boolean | null | undefined, values?: readonly unknown[]) => string;
  simple: boolean;
  setSimple: (simple: boolean) => void;
}
const Context = createContext<LanguageContextValue | null>(null);
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [storedLanguage, saveLanguage] = useBrowserPreference("viem.language", "en");
  const [storedSimple, saveSimple] = useBrowserPreference("viem.simple-view", "true");
  const language = isLanguage(storedLanguage) ? storedLanguage : "en";
  const tr = useCallback<LanguageContextValue["tr"]>((source, values) => translate(source == null || typeof source === "boolean" ? "" : String(source), language, values), [language]);
  return <Context value={{ language, setLanguage: saveLanguage, simple: storedSimple !== "false", setSimple: (next) => saveSimple(String(next)), tr }}>{children}</Context>;
}
export function useLanguage() {
  const context = use(Context);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
export function useDashboardFormatters() {
  return dashboardFormatters(useLanguage().language);
}
