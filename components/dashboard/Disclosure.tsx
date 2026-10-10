"use client";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

export function Disclosure({ title, children }: { title: string; children: ReactNode }) {
  const { tr, simple } = useLanguage();
  if (!simple) return <>{children}</>;
  return <details className="group rounded-2xl border border-forest-100 bg-white p-4 sm:p-5"><summary className="flex min-h-9 list-none items-center justify-between gap-3 text-sm font-semibold text-forest-800 [&::-webkit-details-marker]:hidden">{tr(title)}<ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" /></summary><div className="mt-4 grid gap-5">{children}</div></details>;
}
