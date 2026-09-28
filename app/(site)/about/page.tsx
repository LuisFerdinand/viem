import { BrainCircuit, CheckCircle2, Leaf, MapPin, Recycle, Sprout, Target, Eye } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/site/PageHero";
import { ProposalBand } from "@/components/site/ProposalBand";
import { Accent, Section, SectionHeading } from "@/components/site/Section";
import { TeamGrid } from "@/components/site/TeamGrid";
import { Photo } from "@/components/ui/Photo";
import { APPROACH, GOALS, QUOTE, SERVICES, WHY_VIEM } from "@/lib/content";
import { BRAND, PHOTO } from "@/lib/images";

export const metadata: Metadata = {
  title: "About",
  description:
    "VIEM is a modern agribusiness building a smarter, regenerative and circular agricultural ecosystem in Timor-Leste. Meet the team.",
};

const WHY_ICONS = [BrainCircuit, Sprout, Recycle, MapPin];
const SERVICE_IMAGES = [BRAND.iotMonitoring, BRAND.circularLoop, BRAND.distribution];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About VIEM"
        title={
          <>
            Visionary Innovation for <em className="text-leaf-300 italic">Environmental Management</em>
          </>
        }
        lead="A modern agribusiness committed to a smarter, more regenerative agricultural ecosystem in Timor-Leste — combining technology, modern cultivation and circular practice."
        image={PHOTO.hillsView}
      />

      <Section labelledBy="who-heading">
        <div className="container-page grid gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading
              id="who-heading"
              eyebrow="Who we are"
              title={
                <>
                  Smarter farming that <Accent>regenerates</Accent> as it grows
                </>
              }
            />
            <div className="reveal mt-6 space-y-4 text-lg leading-relaxed text-muted">
              <p>
                We combine smart farming technology, modern cultivation systems and regenerative practice to improve
                productivity while making better use of natural resources.
              </p>
              <p>
                At the heart of our approach is <strong className="text-forest-800">circular agriculture</strong> —
                transforming organic waste and agricultural by-products into valuable resources, including animal feed,
                to reduce waste, improve efficiency and create a more sustainable farming cycle.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="reveal rounded-3xl bg-forest-900 p-6 text-white">
                <Eye className="size-6 text-leaf-300" aria-hidden="true" />
                <h3 className="mt-4 font-display text-2xl">Our vision</h3>
                <p className="mt-2 text-sm leading-relaxed text-forest-200">
                  To become a leading modern and regenerative agribusiness, creating a productive, circular and
                  sustainable agricultural ecosystem for Timor-Leste.
                </p>
              </div>
              <div className="reveal rounded-3xl border border-forest-100 bg-forest-50 p-6">
                <Target className="size-6 text-forest-600" aria-hidden="true" />
                <h3 className="mt-4 font-display text-2xl text-forest-900">Our focus</h3>
                <ul className="mt-2 space-y-2 text-sm leading-relaxed text-muted">
                  <li>Integrating technology and data to improve farming efficiency and productivity.</li>
                  <li>Transforming organic waste and by-products into valuable resources, including animal feed.</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="reveal relative min-h-[26rem] overflow-hidden rounded-[2rem] shadow-lift">
            <Image src={BRAND.smartFarm.src} alt={BRAND.smartFarm.alt} fill placeholder="blur" sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
          </div>
        </div>
      </Section>

      <Section tone="mint" labelledBy="why-heading">
        <div className="container-page">
          <SectionHeading id="why-heading" eyebrow="Why VIEM?" align="center" title={<>Four commitments behind <Accent>every unit</Accent></>} />
          <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_VIEM.map((w, i) => {
              const Icon = WHY_ICONS[i];
              return (
                <li key={w.title} className="reveal rounded-3xl bg-white p-6 shadow-soft">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-leaf-100 text-leaf-700">
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-forest-900">{w.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{w.body}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </Section>

      <Section labelledBy="do-heading">
        <div className="container-page">
          <SectionHeading id="do-heading" eyebrow="What we do" title={<>Three lines of work, <Accent>one ecosystem</Accent></>} />
          <ul className="mt-14 grid gap-8 lg:grid-cols-3">
            {SERVICES.map((s, i) => (
              <li key={s.title} className="reveal flex flex-col overflow-hidden rounded-3xl border border-forest-100 bg-white shadow-soft">
                <div className="relative aspect-[16/11]">
                  <Image src={SERVICE_IMAGES[i].src} alt={SERVICE_IMAGES[i].alt} fill placeholder="blur" sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <h3 className="font-display text-2xl font-medium text-forest-900">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{s.body}</p>
                  <ul className="mt-5 space-y-2.5 border-t border-forest-100 pt-5">
                    {s.points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-sm text-forest-800">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-leaf-600" aria-hidden="true" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <section aria-labelledby="approach-heading" className="relative isolate overflow-hidden bg-forest-950 py-20 text-white md:py-28">
        <Photo src={PHOTO.forestCanopy.src} alt="" fill sizes="100vw" className="-z-20 object-cover opacity-35" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-forest-950/70" />
        <div className="container-page">
          <SectionHeading id="approach-heading" tone="dark" eyebrow="Our approach" align="center" title={<>Grow · Innovate · <Accent tone="dark">Sustain</Accent></>} />
          <ol className="mt-14 grid gap-px overflow-hidden rounded-3xl bg-white/10 md:grid-cols-3">
            {APPROACH.map((a, i) => (
              <li key={a.title} className="reveal bg-forest-950/80 p-8 backdrop-blur-sm md:p-10">
                <span className="font-display text-6xl text-leaf-300/80 italic">0{i + 1}</span>
                <h3 className="mt-4 font-display text-3xl">{a.title}</h3>
                <p className="mt-3 leading-relaxed text-forest-200">{a.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {GOALS.map((g) => (
              <p key={g} className="reveal flex items-start gap-3 rounded-2xl border border-white/10 p-5 text-sm text-forest-100">
                <Leaf className="mt-0.5 size-4 shrink-0 text-leaf-400" aria-hidden="true" />
                {g}
              </p>
            ))}
          </div>
        </div>
      </section>

      <Section id="team" labelledBy="team-heading">
        <div className="container-page">
          <SectionHeading
            id="team-heading"
            eyebrow="VIEM core team"
            title={<>The people behind <Accent>Konekta Farms</Accent></>}
            lead="A team of four combining finance, marketing, operations across Indonesia and Timor-Leste, and the IoT and software that connect every unit."
          />
          <div className="mt-12">
            <TeamGrid detailed />
          </div>
        </div>
      </Section>

      <section className="bg-sand-50 py-20">
        <figure className="container-page reveal mx-auto max-w-4xl text-center">
          <blockquote className="font-display text-3xl leading-snug font-medium text-forest-900 italic md:text-5xl">“{QUOTE}”</blockquote>
          <figcaption className="mt-6 eyebrow text-forest-500">The VIEM promise</figcaption>
        </figure>
      </section>

      <ProposalBand />
    </>
  );
}
