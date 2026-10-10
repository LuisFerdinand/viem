"use client";

import { LogoMark } from "@/components/ui/Logo";
import { LanguageProvider, useLanguage } from "./LanguageProvider";

function ConnectingMessage() {
  const { language, tr } = useLanguage();
  return <div lang={language} className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#f5f8f6]" role="status" aria-live="polite"><LogoMark className="h-12 w-auto motion-safe:animate-pulse" /><p className="text-sm font-medium text-muted">{tr("Connecting to the VIEM Hub…")}</p></div>;
}
export function Connecting() { return <LanguageProvider><ConnectingMessage /></LanguageProvider>; }
