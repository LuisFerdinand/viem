import { CalendarDays, Download, ExternalLink, FileText, Trophy } from "lucide-react";
import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { ProposalCover } from "@/components/site/ProposalBand";
import { Accent, Section, SectionHeading } from "@/components/site/Section";
import { ButtonAnchor } from "@/components/ui/Button";
import { DOWNLOADS, JUDGING, KONEKTA } from "@/lib/content";
import { PHOTO } from "@/lib/images";

export const metadata: Metadata = {
  title: "Proposal",
  description:
    "Download the VIEM Konekta Farms proposal for the Vorakai Konekta Challenge 2026 and the VIEM company profile.",
};

const CONTENTS = [
  "Summary",
  "The problem",
  "The solution: one circular loop",
  "How connectivity makes it work",
  "Social impact",
  "How it works as a business",
  "Rollout plan",
  "Assumptions and how we test them",
  "Alternatives we considered",
  "How it could fail — and what we do about it",
  "If the constraints change",
  "Fit with the judging criteria",
  "Team",
];

export default function ProposalPage() {
  return (
    <>
      <PageHero
        eyebrow={`${KONEKTA.name} · Idea proposal`}
        title={
          <>
            Read the <em className="text-leaf-300 italic">full proposal</em>
          </>
        }
        lead="VIEM Konekta Farms: connected circular hydroponic & aquaponic hubs for Timor-Leste. Download the PDF, or preview it right here."
        image={PHOTO.forestCanopy}
      >
        <ButtonAnchor href={DOWNLOADS.proposal.href} download variant="accent" size="lg">
          <Download className="size-5" aria-hidden="true" /> Download proposal (PDF)
        </ButtonAnchor>
        <ButtonAnchor href={DOWNLOADS.profile.href} download variant="ghost-light" size="lg">
          <FileText className="size-5" aria-hidden="true" /> Company profile (PDF)
        </ButtonAnchor>
      </PageHero>

      <Section labelledBy="downloads-heading">
        <div className="container-page">
          <h2 id="downloads-heading" className="sr-only">Downloads</h2>
          <ul className="grid gap-6 lg:grid-cols-2">
            {[DOWNLOADS.proposal, DOWNLOADS.profile].map((d, i) => (
              <li key={d.href} className="reveal flex flex-col gap-6 rounded-3xl border border-forest-100 bg-forest-50 p-6 sm:flex-row md:p-8">
                {i === 0 ? (
                  <ProposalCover className="mx-auto w-40 shrink-0 sm:mx-0" />
                ) : (
                  <div className="mx-auto flex aspect-[1/1.3] w-40 shrink-0 flex-col justify-between rounded-2xl bg-forest-800 p-4 text-white shadow-lift sm:mx-0">
                    <span className="text-[0.5rem] tracking-[0.2em] text-leaf-300 uppercase">Grow · Innovate · Sustain</span>
                    <span>
                      <span className="block text-[0.55rem] tracking-widest text-forest-200 uppercase">Company profile</span>
                      <span className="mt-1 block font-display text-2xl leading-none">VIEM Project</span>
                    </span>
                    <span className="text-[0.5rem] text-forest-300">viemproject.com</span>
                  </div>
                )}
                <div className="flex flex-col">
                  <p className="eyebrow text-forest-500">{d.meta}</p>
                  <h3 className="mt-2 font-display text-2xl font-medium text-forest-900">{d.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{d.description}</p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-6">
                    <ButtonAnchor href={d.href} download>
                      <Download className="size-4" aria-hidden="true" /> Download
                    </ButtonAnchor>
                    <ButtonAnchor href={d.href} target="_blank" rel="noopener noreferrer" variant="secondary">
                      <ExternalLink className="size-4" aria-hidden="true" /> Open in new tab
                    </ButtonAnchor>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section tone="mint" labelledBy="preview-heading" className="pt-0 md:pt-0">
        <div className="container-page grid gap-10 pt-20 lg:grid-cols-[1fr_2fr]">
          <div>
            <SectionHeading id="preview-heading" eyebrow="What's inside" title={<>Thirteen sections, <Accent>one clear case</Accent></>} />
            <ol className="reveal mt-8 grid gap-1.5 text-sm">
              {CONTENTS.map((c, i) => (
                <li key={c} className="flex gap-3 rounded-xl px-3 py-2 odd:bg-white">
                  <span className="w-6 font-semibold text-forest-500 tabular">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-forest-900">{c}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="reveal overflow-hidden rounded-3xl bg-white shadow-soft">
            <div className="flex items-center justify-between border-b border-forest-100 px-5 py-3 text-sm">
              <span className="font-medium text-forest-800">Preview · VIEM-Konekta-Farms-Proposal.pdf</span>
              <a href={DOWNLOADS.proposal.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-forest-600 hover:underline">
                Full screen <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            </div>
            <iframe
              src={`${DOWNLOADS.proposal.href}#view=FitH`}
              title="VIEM Konekta Farms proposal (PDF preview)"
              loading="lazy"
              className="h-[70vh] min-h-[32rem] w-full bg-forest-50"
            />
            <p className="border-t border-forest-100 px-5 py-3 text-xs text-muted">
              Preview not showing on your device?{" "}
              <a href={DOWNLOADS.proposal.href} download className="font-semibold text-forest-700 underline underline-offset-2">
                Download the PDF
              </a>{" "}
              instead.
            </p>
          </div>
        </div>
      </Section>

      <Section labelledBy="judging-heading">
        <div className="container-page grid gap-14 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <SectionHeading
              id="judging-heading"
              eyebrow="Fit with the judging criteria"
              title={<>Where the proposal <Accent>answers each criterion</Accent></>}
            />
            <ul className="mt-10 space-y-5">
              {JUDGING.map((j) => (
                <li key={j.criterion} className="reveal">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-semibold text-forest-900">{j.criterion}</h3>
                    <span className="font-display text-2xl text-forest-600 tabular">{j.weight}%</span>
                  </div>
                  <div aria-hidden="true" className="mt-2 h-2 overflow-hidden rounded-full bg-forest-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-forest-500 to-leaf-400" style={{ width: `${(j.weight / 30) * 100}%` }} />
                  </div>
                  <p className="mt-2 text-sm text-muted">{j.answer}</p>
                </li>
              ))}
            </ul>
          </div>
          <aside className="reveal self-start rounded-3xl bg-forest-900 p-7 text-white">
            <Trophy className="size-7 text-leaf-300" aria-hidden="true" />
            <h2 className="mt-4 font-display text-3xl">{KONEKTA.name}</h2>
            <dl className="mt-6 space-y-4 text-sm">
              <div>
                <dt className="text-xs font-semibold tracking-wider text-forest-300 uppercase">Competition track</dt>
                <dd className="mt-1">{KONEKTA.track} — sensor monitoring + Tetum-first farm assistant</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-wider text-forest-300 uppercase">Grand Challenge</dt>
                <dd className="mt-1">Nominated — {KONEKTA.grandChallenge}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-wider text-forest-300 uppercase">Language of delivery</dt>
                <dd className="mt-1">Tetum first, with Portuguese and English</dd>
              </div>
            </dl>
            <h3 className="mt-8 flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="size-4 text-leaf-300" aria-hidden="true" /> Competition stages
            </h3>
            <ol className="mt-3 space-y-2 text-sm">
              {KONEKTA.dates.map((d) => (
                <li key={d.what} className="flex gap-3 rounded-xl bg-white/5 px-3 py-2">
                  <span className="w-28 shrink-0 font-semibold text-leaf-300">{d.when}</span>
                  <span className="text-forest-100">{d.what}</span>
                </li>
              ))}
            </ol>
            <a
              href={KONEKTA.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-leaf-300 hover:underline"
            >
              About the Konekta Challenge <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </aside>
        </div>
      </Section>
    </>
  );
}
