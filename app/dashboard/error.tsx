"use client";

import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { LanguageProvider, useLanguage } from "@/components/dashboard/LanguageProvider";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <LanguageProvider><ErrorMessage error={error} reset={reset} /></LanguageProvider>;
}
function ErrorMessage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { language, tr } = useLanguage();
  return (
    <div lang={language} className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
      <p className="eyebrow text-crit-700">{tr("Something went wrong")}</p>
      <h1 className="mt-3 font-display text-3xl text-forest-900">{tr("The dashboard hit a snag")}</h1>
      <p className="mt-3 text-sm text-muted">
        {error.digest ? tr("Reference {0}.", [error.digest]) : ""}{" "}{tr("Try again to reload your farm data.")}
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>
          <RefreshCw className="size-4" aria-hidden="true" /> {tr("Try again")}
        </Button>
        <Link href="/" className="inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold text-forest-700 hover:bg-forest-100">
          {tr("Back to website")}
        </Link>
      </div>
    </div>
  );
}
