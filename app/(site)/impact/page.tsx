import { Building2, GraduationCap, HandCoins, Hotel, Recycle, School, ShoppingBasket, Store, Sun, Warehouse } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/site/PageHero";
import { ProposalBand } from "@/components/site/ProposalBand";
import { ResponsiveTable } from "@/components/site/ResponsiveTable";
import { Accent, Section, SectionHeading } from "@/components/site/Section";
import { Photo } from "@/components/ui/Photo";
import {
  ASSUMPTIONS,
  CONSTRAINTS,
  FAILURES,
  IMPACT,
  REVENUE_STREAMS,
  ROLLOUT,
  UNIT_ECONOMICS,
} from "@/lib/content";
import { BRAND, PHOTO } from "@/lib/images";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Impact & business model",
  description:
    "Local jobs, school nutrition, cleaner sucos and climate resilience — delivered through a hub-and-spoke business with guaranteed buy-back. Unit economics, rollout, assumptions and risks.",
};

const IMPACT_MEDIA = [
  { icon: HandCoins, img: PHOTO.plantingBed },
  { icon: School, img: PHOTO.boyWatering },
  { icon: GraduationCap, img: PHOTO.greenhouseTeam },
  { icon: Recycle, img: PHOTO.compostBoxes },
  { icon: Sun, img: PHOTO.solarField },
];

export default function ImpactPage() {
  return (
    <>
      <PageHero
        eyebrow="Impact & business"
        title={
          <>
            Jobs, nutrition and <em className="text-leaf-300 italic">cleaner sucos</em>
          </>
        }
        lead="Each Suku Unit is owned by a local cooperative, supplied and supported by VIEM, which buys the harvest at a pre-agreed floor price — so every unit is a business, not a donation."
        image={PHOTO.market}
      />

      <Section labelledBy="impact-heading">
        <div className="container-page">
          <SectionHeading id="impact-heading" eyebrow="Social impact" title={<>Five ways a unit <Accent>changes a suco</Accent></>} />
          <ul className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-6">
            {IMPACT.map((it, i) => {
              const { icon: Icon, img } = IMPACT_MEDIA[i];
              return (
                <li
                  key={it.title}
                  className={cn(
                    "reveal group overflow-hidden rounded-3xl border border-forest-100 bg-white shadow-soft",
                    i < 2 ? "lg:col-span-3" : "lg:col-span-2",
                  )}
                >
                  <div className={cn("relative overflow-hidden", i < 2 ? "aspect-[16/8]" : "aspect-[16/10]")}>
                    <Photo src={img.src} alt={img.alt} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <div className="flex gap-4 p-6">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-leaf-100 text-leaf-700">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-forest-900">{it.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{it.body}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </Section>

      <Section tone="mint" labelledBy="model-heading">
        <div className="container-page grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading
              id="model-heading"
              eyebrow="How it works as a business"
              title={<>A <Accent>hub-and-spoke</Accent> network</>}
              lead="The VIEM Hub near Dili is a commercial demonstration farm, training centre, black soldier fly feed plant and packing house. Suku Units are owned and run by cooperatives, and VIEM buys their harvest at a pre-agreed floor price."
            />
            <div className="reveal relative mt-8 aspect-[3/2] overflow-hidden rounded-3xl shadow-soft">
              <Image src={BRAND.distribution.src} alt={BRAND.distribution.alt} fill placeholder="blur" sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
            </div>
          </div>
          <HubSpoke />
        </div>
      </Section>

      <Section labelledBy="revenue-heading">
        <div className="container-page">
          <SectionHeading id="revenue-heading" eyebrow="Revenue streams" title={<>Six ways VIEM <Accent>earns</Accent></>} />
          <div className="mt-10">
            <ResponsiveTable
              caption="VIEM revenue streams"
              rowKey={(r) => r.stream}
              columns={[
                { key: "stream", header: "Stream" },
                { key: "customer", header: "Customer" },
                { key: "earns", header: "How VIEM earns" },
              ]}
              rows={REVENUE_STREAMS}
            />
          </div>
        </div>
      </Section>

      <section aria-labelledby="econ-heading" className="bg-forest-900 py-20 text-white md:py-28">
        <div className="container-page grid gap-14 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <SectionHeading
              id="econ-heading"
              tone="dark"
              eyebrow="Indicative unit economics"
              title={<>One Suku Unit pays back in <Accent tone="dark">12–18 months</Accent></>}
              lead="Planning estimates at Dili wholesale prices, to be validated during the pilot. Set-up is financed through a lease repaid from sales, a donor grant, or a municipal partnership."
            />
            <MonthlyBars />
          </div>
          <div className="reveal overflow-hidden rounded-3xl bg-white text-forest-900">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Indicative unit economics for one Suku Unit (US$)</caption>
              <thead>
                <tr className="border-b-2 border-forest-500">
                  <th scope="col" className="px-5 py-4 text-xs font-bold tracking-[0.12em] text-forest-600 uppercase">Item</th>
                  <th scope="col" className="px-5 py-4 text-right text-xs font-bold tracking-[0.12em] text-forest-600 uppercase">US$ (estimate)</th>
                </tr>
              </thead>
              <tbody>
                {UNIT_ECONOMICS.map((r) => (
                  <tr key={r.item} className={cn("border-b border-forest-100 last:border-0", r.highlight && "bg-leaf-50")}>
                    <th scope="row" className={cn("px-5 py-4 font-normal", r.highlight && "font-semibold")}>{r.item}</th>
                    <td className={cn("px-5 py-4 text-right tabular whitespace-nowrap", r.highlight && "font-semibold text-forest-700")}>{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Section labelledBy="rollout-heading">
        <div className="container-page">
          <SectionHeading id="rollout-heading" eyebrow="Rollout plan" title={<>Measured, <Accent>phase by phase</Accent></>} />
          <ol className="relative mt-14 space-y-6 border-l-2 border-forest-200 pl-8 md:pl-12">
            {ROLLOUT.map((r) => (
              <li key={r.phase} className="reveal relative rounded-3xl border border-forest-100 bg-white p-6 shadow-soft md:p-8">
                <span aria-hidden="true" className="absolute top-8 -left-[2.6rem] size-5 rounded-full border-4 border-white bg-leaf-500 shadow md:-left-[3.6rem]" />
                <div className="flex flex-wrap items-baseline gap-3">
                  <h3 className="font-display text-3xl font-medium text-forest-900">{r.phase}</h3>
                  <span className="rounded-full bg-forest-100 px-3 py-1 text-xs font-semibold text-forest-700">{r.when}</span>
                </div>
                <p className="mt-3 text-forest-800">{r.what}</p>
                <p className="mt-4 text-sm">
                  <span className="font-semibold text-forest-600">Success measure: </span>
                  <span className="text-muted">{r.measure}</span>
                </p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section tone="mint" labelledBy="assume-heading">
        <div className="container-page">
          <SectionHeading
            id="assume-heading"
            eyebrow="Assumptions and how we test them"
            title={<>Known vs <Accent>guessed</Accent> — tested cheaply first</>}
          />
          <div className="mt-10 rounded-3xl bg-white p-4 shadow-soft md:p-6">
            <ResponsiveTable
              caption="Assumptions and tests"
              rowKey={(r) => r.assumption}
              columns={[
                { key: "assumption", header: "Assumption", className: "md:w-[38%]" },
                {
                  key: "status",
                  header: "Known or guessed",
                  render: (r) => (
                    <span
                      className={cn(
                        "inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        r.status.startsWith("Guessed") ? "bg-warn-50 text-warn-700" : "bg-ok-50 text-ok-700",
                      )}
                    >
                      {r.status}
                    </span>
                  ),
                },
                { key: "test", header: "Cheapest test" },
              ]}
              rows={ASSUMPTIONS}
            />
          </div>
        </div>
      </Section>

      <Section labelledBy="fail-heading">
        <div className="container-page">
          <SectionHeading id="fail-heading" eyebrow="How it could fail" title={<>…and what the design <Accent>does about it</Accent></>} />
          <div className="mt-10">
            <ResponsiveTable
              caption="Failure modes and design responses"
              rowKey={(r) => r.failure}
              columns={[
                {
                  key: "type",
                  header: "Type",
                  render: (r) => (
                    <span className="inline-block rounded-full bg-forest-100 px-2.5 py-0.5 text-xs font-semibold text-forest-700">{r.type}</span>
                  ),
                },
                { key: "failure", header: "Failure" },
                { key: "response", header: "Design response" },
              ]}
              rows={FAILURES}
            />
          </div>
        </div>
      </Section>

      <Section tone="sand" labelledBy="constraints-heading">
        <div className="container-page">
          <SectionHeading
            id="constraints-heading"
            eyebrow="If the constraints change"
            title={<>Ready for the <Accent>live adaptation</Accent> round</>}
            lead="At the finals, judges change one major constraint. Here is how the design flexes."
          />
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {CONSTRAINTS.map((c) => (
              <li key={c.title} className="reveal rounded-3xl bg-white p-6 shadow-soft">
                <h3 className="font-display text-2xl font-medium text-forest-900">{c.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{c.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <ProposalBand />
    </>
  );
}

function HubSpoke() {
  const units = ["School unit", "Suco office", "Community hall", "School unit", "Suco office"];
  const buyers = [
    { icon: School, label: "Schools" },
    { icon: Hotel, label: "Hotels" },
    { icon: Store, label: "Supermarkets" },
    { icon: ShoppingBasket, label: "Markets" },
  ];
  return (
    <figure className="reveal rounded-3xl bg-white p-6 shadow-soft md:p-8">
      <div className="relative mx-auto aspect-square max-w-md">
        <svg viewBox="0 0 400 400" className="absolute inset-0 size-full" aria-hidden="true">
          {units.map((_, i) => {
            const a = ((-90 + i * 72) * Math.PI) / 180;
            return (
              <line
                key={i}
                x1="200"
                y1="200"
                x2={200 + 150 * Math.cos(a)}
                y2={200 + 150 * Math.sin(a)}
                stroke="#9dbfb0"
                strokeWidth="2"
                strokeDasharray="5 7"
                className="motion-safe:animate-flow"
              />
            );
          })}
        </svg>
        <div className="absolute inset-[33%] flex flex-col items-center justify-center rounded-full bg-forest-800 text-center text-white shadow-lift">
          <Warehouse className="size-7 text-leaf-300" aria-hidden="true" />
          <p className="mt-1 text-sm font-semibold">VIEM Hub</p>
          <p className="text-[0.65rem] text-forest-200">near Dili</p>
        </div>
        {units.map((u, i) => {
          const a = ((-90 + i * 72) * Math.PI) / 180;
          return (
            <div
              key={i}
              style={{ left: `${50 + 37.5 * Math.cos(a)}%`, top: `${50 + 37.5 * Math.sin(a)}%` }}
              className="absolute flex w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-2xl border border-forest-100 bg-forest-50 px-2 py-2 text-center"
            >
              <Building2 className="size-4 text-forest-600" aria-hidden="true" />
              <span className="mt-1 text-[0.68rem] leading-tight font-semibold text-forest-800">Suku Unit</span>
              <span className="text-[0.6rem] text-muted">{u}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-6 border-t border-forest-100 pt-5">
        <p className="text-center text-xs font-semibold tracking-wider text-forest-500 uppercase">Harvest bought back and sold to</p>
        <ul className="mt-3 flex flex-wrap justify-center gap-2">
          {buyers.map(({ icon: Icon, label }) => (
            <li key={label} className="inline-flex items-center gap-1.5 rounded-full bg-leaf-50 px-3 py-1.5 text-xs font-medium text-leaf-700">
              <Icon className="size-3.5" aria-hidden="true" /> {label}
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="sr-only">
        Hub-and-spoke model: the VIEM Hub near Dili supplies and supports five Suku Units at schools, suco offices and
        community halls, then sells their harvest to schools, hotels, supermarkets and markets.
      </figcaption>
    </figure>
  );
}

function MonthlyBars() {
  const bars = [
    { label: "Sales", lo: 350, hi: 500, className: "bg-leaf-400" },
    { label: "Costs", lo: 90, hi: 130, className: "bg-[#f3a99c]" },
    { label: "Support fee", lo: 25, hi: 25, className: "bg-forest-300" },
    { label: "Net to co-op", lo: 235, hi: 345, className: "bg-white" },
  ];
  const max = 500;
  return (
    <figure className="reveal mt-10">
      <figcaption className="text-xs font-semibold tracking-wider text-forest-300 uppercase">Monthly, US$ (low – high estimate)</figcaption>
      <ul className="mt-4 space-y-4">
        {bars.map((b) => (
          <li key={b.label}>
            <div className="flex justify-between text-sm">
              <span className="text-forest-100">{b.label}</span>
              <span className="font-semibold tabular">{b.lo === b.hi ? b.lo : `${b.lo}–${b.hi}`}</span>
            </div>
            <div className="relative mt-1.5 h-3 rounded-full bg-white/10">
              <div className={cn("absolute inset-y-0 left-0 rounded-full opacity-45", b.className)} style={{ width: `${(b.hi / max) * 100}%` }} />
              <div className={cn("absolute inset-y-0 left-0 rounded-full", b.className)} style={{ width: `${(b.lo / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </figure>
  );
}
