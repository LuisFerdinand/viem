import { ArrowRight, Download, FileText } from "lucide-react";
import Link from "next/link";
import { ButtonAnchor } from "@/components/ui/Button";
import { LogoMark } from "@/components/ui/Logo";
import { Photo } from "@/components/ui/Photo";
import { DOWNLOADS, KONEKTA } from "@/lib/content";
import { PHOTO } from "@/lib/images";

/** Stylised cover of the proposal document. */
export function ProposalCover({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="relative aspect-[1/1.3] w-full overflow-hidden rounded-2xl bg-white p-6 shadow-lift ring-1 ring-forest-100">
        <div className="flex items-center justify-between border-b-2 border-leaf-600 pb-2 text-[0.5rem] font-semibold tracking-[0.14em] text-leaf-700 uppercase">
          <span>Vorakai Konekta Challenge 2026</span>
          <span>Timor-Leste</span>
        </div>
        <p className="mt-4 text-[1.15rem] leading-[1.08] font-extrabold tracking-tight text-forest-950">
          VIEM Konekta Farms: connected circular hydroponic &amp; aquaponic hubs
        </p>
        <p className="mt-3 border-l-2 border-leaf-600 pl-2 text-[0.6rem] leading-snug text-muted">
          Fish feed the plants, waste feeds the fish, and the suco&apos;s new connection keeps the loop alive.
        </p>
        <div className="relative mt-3 h-[30%] overflow-hidden rounded-md">
          <Photo src={PHOTO.lettuceRows.src} alt="" fill sizes="240px" className="object-cover" />
        </div>
        <div className="absolute inset-x-6 bottom-5 flex items-center justify-between">
          <LogoMark className="h-6 w-auto" />
          <span className="text-[0.55rem] font-medium text-muted">AI &amp; Data track</span>
        </div>
      </div>
    </div>
  );
}

export function ProposalBand() {
  return (
    <section aria-labelledby="proposal-band" className="relative isolate overflow-hidden bg-forest-900 py-20 text-white md:py-24">
      <Photo src={PHOTO.forestAerial.src} alt="" fill sizes="100vw" className="-z-20 object-cover opacity-40" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-forest-950 via-forest-950/90 to-forest-900/60" />
      <div className="container-page grid items-center gap-12 md:grid-cols-[1.3fr_1fr]">
        <div className="reveal">
          <p className="eyebrow text-leaf-300">{KONEKTA.name}</p>
          <h2 id="proposal-band" className="mt-4 font-display text-4xl leading-tight font-medium text-balance md:text-5xl">
            Read the full proposal — <em className="text-leaf-300 italic">every assumption, risk and number.</em>
          </h2>
          <p className="mt-5 max-w-xl text-lg text-forest-200">
            Eleven pages covering the circular design, offline-first sensing, Tulun VIEM, unit economics, rollout,
            failure modes and how we adapt when constraints change.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonAnchor href={DOWNLOADS.proposal.href} download variant="accent" size="lg">
              <Download className="size-5" aria-hidden="true" /> Download proposal
            </ButtonAnchor>
            <ButtonAnchor href={DOWNLOADS.profile.href} download variant="ghost-light" size="lg">
              <FileText className="size-5" aria-hidden="true" /> Company profile
            </ButtonAnchor>
          </div>
          <Link
            href="/proposal"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-leaf-300 underline-offset-4 hover:underline"
          >
            Preview it online and see how it answers the judging criteria
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <ProposalCover className="mx-auto w-full max-w-[17rem] rotate-3 transition-transform duration-500 hover:rotate-0" />
      </div>
    </section>
  );
}
