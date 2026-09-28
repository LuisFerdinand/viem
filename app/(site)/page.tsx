import {
  ArrowRight,
  BatteryCharging,
  Cpu,
  Download,
  Droplets,
  Fish,
  GraduationCap,
  HandCoins,
  LayoutDashboard,
  Languages,
  Leaf,
  Mail,
  MessageCircle,
  Radio,
  Recycle,
  SatelliteDish,
  School,
  ShieldCheck,
  Sprout,
  Sun,
  Thermometer,
  TriangleAlert,
  WifiOff,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LoopDiagram } from "@/components/site/LoopDiagram";
import { ProposalBand } from "@/components/site/ProposalBand";
import { Accent, Section, SectionHeading } from "@/components/site/Section";
import { TeamGrid } from "@/components/site/TeamGrid";
import { WhatsAppMock } from "@/components/site/WhatsAppMock";
import { ButtonAnchor, ButtonLink } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Photo";
import {
  APPROACH,
  CONTACT,
  DOWNLOADS,
  HEADLINE_STATS,
  IMPACT,
  KONEKTA,
  PROBLEMS,
  ROLLOUT,
  SENSING_STEPS,
  SYSTEMS,
} from "@/lib/content";
import { BRAND, PHOTO } from "@/lib/images";

const PROBLEM_ICONS: LucideIcon[] = [Wheat, Sprout, Droplets, Recycle];
const SYSTEM_IMAGES = [PHOTO.fishPond, PHOTO.lettuceRows, PHOTO.compostBoxes];
const SENSING_ICONS: LucideIcon[] = [Cpu, Radio, SatelliteDish, LayoutDashboard];
const IMPACT_ICONS: LucideIcon[] = [HandCoins, School, GraduationCap, Recycle, Sun];

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsStrip />

      {/* About / approach */}
      <Section labelledBy="about-heading">
        <div className="container-page grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading
              id="about-heading"
              eyebrow="Visionary Innovation for Environmental Management"
              title={
                <>
                  A modern agribusiness growing a <Accent>regenerative</Accent> Timor-Leste
                </>
              }
              lead="VIEM combines smart farming technology, modern cultivation systems and regenerative practice. At the heart of it is circular agriculture — turning organic waste and by-products into feed, fertiliser and food."
            />
            <ul className="mt-10 grid gap-3">
              {APPROACH.map((a, i) => (
                <li key={a.title} className="reveal flex flex-col gap-1 rounded-2xl border border-forest-100 bg-forest-50 p-5 sm:flex-row sm:items-baseline sm:gap-6">
                  <h3 className="flex shrink-0 items-baseline gap-2 font-display text-2xl font-medium text-forest-900 sm:w-36">
                    <span className="text-sm text-forest-500 italic">0{i + 1}</span>
                    {a.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted">{a.body}</p>
                </li>
              ))}
            </ul>
            <ButtonLink href="/about" variant="secondary" className="mt-8">
              More about VIEM <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
          </div>
          <div className="reveal relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-lift">
              <Image
                src={BRAND.teamField.src}
                alt={BRAND.teamField.alt}
                fill
                placeholder="blur"
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-8 -left-4 w-[55%] overflow-hidden rounded-3xl border-[6px] border-white shadow-lift sm:-left-10">
              <div className="relative aspect-[4/3]">
                <Photo src={PHOTO.seedlings.src} alt={PHOTO.seedlings.alt} fill sizes="25vw" className="object-cover" />
              </div>
            </div>
            <div className="absolute -top-6 -right-2 rounded-2xl bg-forest-900 px-5 py-4 text-white shadow-lift sm:-right-6">
              <p className="font-display text-3xl font-medium">Year-round</p>
              <p className="text-xs text-forest-200">harvests, even in the dry season</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Problem */}
      <section aria-labelledby="problem-heading" className="relative isolate overflow-hidden bg-forest-900 py-20 text-white md:py-28">
        <Photo src={PHOTO.palmCanopy.src} alt="" fill sizes="100vw" className="-z-20 object-cover opacity-30" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-forest-950/95 via-forest-900/90 to-forest-900" />
        <div className="container-page">
          <SectionHeading
            id="problem-heading"
            tone="dark"
            eyebrow="The problem"
            title={
              <>
                Four connected problems, <Accent tone="dark">one farm model</Accent>
              </>
            }
            lead="Hydroponics and aquaponics have been tried before — usually as donor demonstrations. Most failed because no one noticed when the water chemistry went wrong, feed was imported and expensive, and there was no guaranteed buyer."
          />
          <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PROBLEMS.map((p, i) => {
              const Icon = PROBLEM_ICONS[i];
              return (
                <li key={p.title} className="reveal flex flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-leaf-400/15 text-leaf-300">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-forest-200">{p.body}</p>
                  <p className="mt-auto border-t border-white/10 pt-4">
                    <span className="font-display text-3xl text-leaf-300">{p.stat}</span>{" "}
                    <span className="text-xs text-forest-300">{p.statLabel}</span>
                  </p>
                </li>
              );
            })}
          </ul>
          <p className="reveal mt-10 max-w-3xl rounded-2xl border border-leaf-400/30 bg-leaf-400/10 p-5 text-forest-100">
            <strong className="text-white">Newly connected sucos change the first reason.</strong> VIEM&apos;s circular
            design and guaranteed buy-back address the other two.
          </p>
        </div>
      </section>

      {/* Solution: circular loop */}
      <Section tone="mint" labelledBy="loop-heading">
        <div className="container-page">
          <SectionHeading
            id="loop-heading"
            eyebrow="The solution"
            align="center"
            title={
              <>
                One <Accent>circular</Accent> loop on 150 m²
              </>
            }
            lead="Every VIEM Suku Unit sits beside a suco office, school or community hall and combines three linked systems. Tap a stage to follow the loop."
          />
          <div className="mt-14">
            <LoopDiagram />
          </div>
          <ul className="mt-16 grid gap-6 md:grid-cols-3">
            {SYSTEMS.map((s, i) => (
              <li key={s.title} className="reveal group overflow-hidden rounded-3xl bg-white shadow-soft">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Photo
                    src={SYSTEM_IMAGES[i].src}
                    alt={SYSTEM_IMAGES[i].alt}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <p className="eyebrow text-forest-500">{s.subtitle}</p>
                  <h3 className="mt-2 font-display text-2xl font-medium text-forest-900">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{s.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-10 text-center">
            <ButtonLink href="/solution" variant="primary">
              How the system works <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
          </div>
        </div>
      </Section>

      {/* Connectivity */}
      <Section labelledBy="connect-heading">
        <div className="container-page">
          <div className="grid items-end gap-8 lg:grid-cols-[1.2fr_1fr]">
            <SectionHeading
              id="connect-heading"
              eyebrow="How connectivity makes it work"
              title={
                <>
                  A pump that stops can kill fish <Accent>within hours</Accent>
                </>
              }
              lead="Aquaponics is only forgiving when problems are caught early. The suco's new connection lets a small VIEM team support many remote units — without driving to each one."
            />
            <ul className="reveal flex flex-wrap gap-2 lg:justify-end">
              {[
                { icon: WifiOff, label: "Offline-first" },
                { icon: BatteryCharging, label: "Solar + battery" },
                { icon: Languages, label: "Tetum-first" },
                { icon: ShieldCheck, label: "Local safety rules" },
              ].map(({ icon: Icon, label }) => (
                <li key={label} className="inline-flex items-center gap-2 rounded-full border border-forest-200 px-4 py-2 text-sm font-medium text-forest-800">
                  <Icon className="size-4 text-leaf-600" aria-hidden="true" /> {label}
                </li>
              ))}
            </ul>
          </div>

          <ol className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {SENSING_STEPS.map((s, i) => {
              const Icon = SENSING_ICONS[i];
              return (
                <li key={s.title} className="reveal relative rounded-3xl border border-forest-100 bg-white p-6 shadow-soft">
                  <div className="flex items-center justify-between">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-forest-800 text-leaf-300">
                      <Icon className="size-6" aria-hidden="true" />
                    </span>
                    <span className="font-display text-4xl text-forest-200 italic">0{i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-forest-900">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
                  {i < SENSING_STEPS.length - 1 && (
                    <ArrowRight
                      aria-hidden="true"
                      className="absolute top-1/2 -right-4 z-10 hidden size-6 -translate-y-1/2 rounded-full bg-leaf-400 p-1 text-forest-950 lg:block"
                    />
                  )}
                </li>
              );
            })}
          </ol>

          <div className="mt-20 grid items-center gap-14 lg:grid-cols-2">
            <div className="reveal order-2 lg:order-1">
              <WhatsAppMock />
            </div>
            <div className="order-1 lg:order-2">
              <p className="eyebrow text-forest-500">Tulun VIEM · the Tetum farm assistant</p>
              <h3 className="mt-4 font-display text-4xl leading-tight font-medium text-balance text-forest-900">
                Plain-Tetum alerts and advice, <Accent>on the phone operators already use</Accent>
              </h3>
              <p className="mt-5 text-lg leading-relaxed text-muted">
                Operators receive alerts on WhatsApp, with SMS as a fallback. Alerts are rule-based and always fire, AI or
                not. For questions, Tulun VIEM answers only from VIEM&apos;s vetted growing manual and hands over to a
                named agronomist when confidence is low.
              </p>
              <ul className="mt-6 grid gap-3 text-sm">
                {[
                  { icon: TriangleAlert, t: "Rule-based alarms fire even when the AI or the link is down" },
                  { icon: MessageCircle, t: "Degrades step by step: SMS menu → laminated guide → call the Hub" },
                  { icon: ShieldCheck, t: "Never recommends chemicals, changes prices or closes alerts on its own" },
                ].map(({ icon: Icon, t }) => (
                  <li key={t} className="flex items-start gap-3">
                    <Icon className="mt-0.5 size-5 shrink-0 text-leaf-600" aria-hidden="true" />
                    <span className="text-forest-800">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      <DashboardTeaser />

      {/* Impact */}
      <Section labelledBy="impact-heading">
        <div className="container-page grid gap-14 lg:grid-cols-[1fr_1.1fr]">
          <div className="grid h-[26rem] grid-cols-2 grid-rows-2 gap-4 self-start sm:h-[34rem]">
            {[
              { img: PHOTO.boyPlant, className: "row-span-2" },
              { img: PHOTO.fishHands, className: "" },
              { img: PHOTO.marketElder, className: "" },
            ].map(({ img, className }) => (
              <div key={img.src} className={`reveal relative overflow-hidden rounded-3xl ${className}`}>
                <Photo src={img.src} alt={img.alt} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
              </div>
            ))}
          </div>
          <div>
            <SectionHeading
              id="impact-heading"
              eyebrow="Social impact"
              title={
                <>
                  Every unit is a <Accent>business</Accent>, not a donation
                </>
              }
              lead="Cooperatives own and run their units. VIEM supplies, supports and buys back the harvest at an agreed floor price."
            />
            <ul className="mt-10 divide-y divide-forest-100 border-y border-forest-100">
              {IMPACT.map((it, i) => {
                const Icon = IMPACT_ICONS[i];
                return (
                  <li key={it.title} className="reveal flex gap-5 py-5">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-leaf-100 text-leaf-700">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-forest-900">{it.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{it.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <ButtonLink href="/impact" variant="secondary" className="mt-8">
              Impact &amp; business model <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
          </div>
        </div>
      </Section>

      {/* Rollout */}
      <Section tone="mint" labelledBy="rollout-heading">
        <div className="container-page">
          <SectionHeading
            id="rollout-heading"
            eyebrow="Rollout plan"
            title={
              <>
                From a 3-month pilot to <Accent>30+ units</Accent>
              </>
            }
            lead="VIEM breaks even at Hub level at roughly 20 Suku Units — aggregated, predictable volumes win supply contracts that small farmers cannot win alone."
          />
          <ol className="mt-14 grid gap-6 lg:grid-cols-3">
            {ROLLOUT.map((r, i) => (
              <li key={r.phase} className="reveal relative flex flex-col rounded-3xl bg-white p-7 shadow-soft">
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-5xl font-medium text-forest-800">{r.phase}</span>
                  <span className="rounded-full bg-leaf-100 px-3 py-1 text-xs font-semibold text-leaf-700">{r.when}</span>
                </div>
                <div aria-hidden="true" className="my-6 h-1.5 overflow-hidden rounded-full bg-forest-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-forest-500 to-leaf-400" style={{ width: `${(i + 1) * 33.3}%` }} />
                </div>
                <p className="text-sm leading-relaxed text-forest-800">{r.what}</p>
                <p className="mt-auto pt-6 text-sm">
                  <span className="block text-xs font-semibold tracking-wider text-forest-500 uppercase">Success measure</span>
                  <span className="mt-1 block font-medium text-forest-900">{r.measure}</span>
                </p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* Team */}
      <Section labelledBy="team-heading">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              id="team-heading"
              eyebrow="The team"
              title={
                <>
                  Rooted in Timor-Leste, <Accent>built to scale</Accent>
                </>
              }
            />
            <ButtonLink href="/about#team" variant="ghost">
              Meet the team <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
          </div>
          <div className="mt-12">
            <TeamGrid />
          </div>
        </div>
      </Section>

      <ProposalBand />

      {/* Contact */}
      <Section tone="sand" labelledBy="contact-heading" className="py-16 md:py-20">
        <div className="container-page grid items-center gap-10 md:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 id="contact-heading" className="font-display text-4xl leading-tight font-medium text-forest-900">
              Host a unit, buy our harvest or <Accent>partner with VIEM</Accent>
            </h2>
            <p className="mt-4 max-w-xl text-lg text-muted">
              Schools, suco offices, buyers, NGOs and government partners — we would love to talk.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <ButtonAnchor href={CONTACT.whatsappLink} target="_blank" rel="noopener noreferrer" size="lg">
              <MessageCircle className="size-5" aria-hidden="true" /> WhatsApp {CONTACT.whatsappDisplay}
            </ButtonAnchor>
            <ButtonAnchor href={`mailto:${CONTACT.email}`} variant="secondary" size="lg">
              <Mail className="size-5" aria-hidden="true" /> {CONTACT.email}
            </ButtonAnchor>
          </div>
        </div>
      </Section>
    </>
  );
}

function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="relative isolate overflow-hidden bg-forest-950 text-white">
      <Photo
        src={PHOTO.forestAerial.src}
        alt=""
        fill
        priority
        quality={85}
        sizes="100vw"
        className="-z-20 object-cover"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(2_16_16/0.66)_0%,rgb(2_16_16/0.34)_48%,rgb(2_16_16/0.08)_100%)]" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(2_16_16/0.3)_0%,transparent_22%,transparent_70%,rgb(2_16_16/0.9)_100%)]" />

      <div className="container-page grid min-h-[100svh] items-center gap-14 pt-32 pb-36 lg:grid-cols-[1.15fr_1fr] lg:pt-28">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-forest-100 backdrop-blur-sm">
            <span className="size-2 rounded-full bg-leaf-400" aria-hidden="true" />
            {KONEKTA.name} · {KONEKTA.track} track
          </p>
          <h1 id="hero-heading" className="mt-7 font-display text-[3.4rem] leading-[0.98] font-medium tracking-tight text-balance sm:text-7xl xl:text-[5.6rem]">
            Grow smarter,
            <br />
            <em className="font-normal text-leaf-300 italic">go further.</em>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-forest-100 sm:text-xl">
            VIEM Konekta Farms are connected, solar-powered aquaponic and hydroponic units run by suco cooperatives.
            Fish feed the plants, waste feeds the fish — and the suco&apos;s new connection keeps the whole loop alive.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonAnchor href={DOWNLOADS.proposal.href} download variant="accent" size="lg">
              <Download className="size-5" aria-hidden="true" /> Download proposal
            </ButtonAnchor>
            <ButtonLink href="/dashboard" variant="ghost-light" size="lg">
              <LayoutDashboard className="size-5" aria-hidden="true" /> Explore the live dashboard
            </ButtonLink>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-forest-200">
            {[
              { icon: Languages, t: "Tetum-first alerts" },
              { icon: Sun, t: "Solar & battery powered" },
              { icon: WifiOff, t: "Offline-first sensing" },
            ].map(({ icon: Icon, t }) => (
              <li key={t} className="flex items-center gap-2">
                <Icon className="size-4 text-leaf-400" aria-hidden="true" /> {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] shadow-lift ring-1 ring-white/15">
            <Image
              src={BRAND.farmHero.src}
              alt={BRAND.farmHero.alt}
              fill
              priority
              placeholder="blur"
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </div>

          <div aria-hidden="true" className="absolute -top-6 -left-3 w-56 rounded-2xl border border-white/15 bg-forest-950/75 p-4 shadow-lift backdrop-blur-md sm:-left-10">
            <div className="flex items-center justify-between text-[0.7rem] text-forest-200">
              <span className="font-semibold text-white">Suku Unit 01</span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-leaf-400 text-leaf-400 motion-safe:animate-pulse-ring" />
                Live
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                { icon: Fish, k: "O₂", v: "6.8" },
                { icon: Droplets, k: "pH", v: "7.02" },
                { icon: Thermometer, k: "°C", v: "27.4" },
              ].map(({ icon: Icon, k, v }) => (
                <div key={k} className="rounded-lg bg-white/5 px-1 py-2">
                  <Icon className="mx-auto size-3.5 text-leaf-300" />
                  <dd className="mt-1 text-sm font-semibold tabular">{v}</dd>
                  <dt className="text-[0.6rem] text-forest-300">{k}</dt>
                </div>
              ))}
            </dl>
          </div>

          <div aria-hidden="true" className="absolute -right-2 -bottom-8 w-64 rounded-2xl bg-white p-4 text-forest-950 shadow-lift sm:-right-8">
            <p className="flex items-center gap-2 text-[0.7rem] font-semibold text-forest-500">
              <Leaf className="size-3.5 text-leaf-600" /> Tulun VIEM · WhatsApp
            </p>
            <p className="mt-2 text-sm font-medium">Oksijéniu tun. Haree pompa ar agora.</p>
            <p className="mt-1 text-xs text-muted italic">Oxygen low. Check the air pump now.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsStrip() {
  return (
    <div className="relative z-10 -mt-20">
      <div className="container-page">
        <dl className="grid grid-cols-2 overflow-hidden rounded-3xl bg-white shadow-lift ring-1 ring-forest-100 lg:grid-cols-4">
          {HEADLINE_STATS.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col-reverse justify-end p-6 md:p-8 ${i % 2 === 1 ? "border-l border-forest-100" : ""} ${i > 1 ? "border-t border-forest-100 lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}
            >
              <dt className="mt-1 text-sm text-muted">{s.label}</dt>
              <dd className="font-display text-4xl font-medium text-forest-800 md:text-5xl">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function DashboardTeaser() {
  return (
    <section aria-labelledby="dash-heading" className="relative isolate overflow-hidden bg-forest-950 py-20 text-white md:py-28">
      <div aria-hidden="true" className="absolute -top-32 left-1/3 -z-10 size-[36rem] rounded-full bg-forest-600/30 blur-3xl" />
      <div className="container-page grid items-center gap-14 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <SectionHeading
            id="dash-heading"
            tone="dark"
            eyebrow="The VIEM dashboard"
            title={
              <>
                Try the Hub dashboard — <Accent tone="dark">live, in your browser</Accent>
              </>
            }
            lead="Watch simulated sensors report every 30 seconds, switch pumps and aeration by hand or let automation run them, set alarm limits, acknowledge Tetum alerts and log harvests for buy-back."
          />
          <ul className="mt-8 grid gap-3 text-sm text-forest-100 sm:grid-cols-2">
            {[
              "7 live sensors per unit",
              "Manual, auto & scheduled control",
              "Hysteresis rules + safety interlocks",
              "Tetum-first alerts with acknowledgement",
              "Offline-first link simulation",
              "Harvest, buy-back & forecast",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <span className="size-1.5 rounded-full bg-leaf-400" aria-hidden="true" /> {t}
              </li>
            ))}
          </ul>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/dashboard" variant="accent" size="lg">
              <LayoutDashboard className="size-5" aria-hidden="true" /> Open the dashboard
            </ButtonLink>
            <Link href="/solution#dashboard" className="inline-flex h-13 items-center gap-2 px-2 text-sm font-medium text-leaf-300 hover:underline">
              What it monitors <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="reveal relative">
          <div className="relative aspect-[3/2] overflow-hidden rounded-[2rem] ring-1 ring-white/10">
            <Image
              src={BRAND.smartFarm.src}
              alt={BRAND.smartFarm.alt}
              fill
              placeholder="blur"
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div aria-hidden="true" className="absolute -bottom-6 left-6 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-forest-900 shadow-lift">
            <span className="flex size-9 items-center justify-center rounded-full bg-ok-50 text-ok-700">
              <ShieldCheck className="size-5" />
            </span>
            <span className="text-sm">
              <span className="block font-semibold">Aeration switched ON</span>
              <span className="text-xs text-muted">Automation · DO below 5.5 mg/L</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
