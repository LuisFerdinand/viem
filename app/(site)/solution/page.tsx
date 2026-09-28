import {
  Activity,
  ArrowRight,
  BatteryCharging,
  BellRing,
  Check,
  CircleX,
  Cpu,
  Database,
  Droplets,
  FlaskConical,
  Gauge,
  HardDrive,
  LayoutDashboard,
  Radio,
  SatelliteDish,
  Thermometer,
  Waves,
  Wind,
  X,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/site/PageHero";
import { ProposalBand } from "@/components/site/ProposalBand";
import { ResponsiveTable } from "@/components/site/ResponsiveTable";
import { Accent, Section, SectionHeading } from "@/components/site/Section";
import { WhatsAppMock } from "@/components/site/WhatsAppMock";
import { ButtonLink } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Photo";
import { ALTERNATIVES, DEGRADATION, LOOP_STAGES, SYSTEMS, TULUN_MAY, TULUN_MAY_NOT } from "@/lib/content";
import { BRAND, PHOTO } from "@/lib/images";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Solution",
  description:
    "How VIEM Konekta Farms work: aquaponics, NFT hydroponics and circular inputs, monitored by offline-first sensors over LoRa and the suco's Vorakai link, with the Tetum-first Tulun VIEM assistant.",
};

const SYSTEM_IMAGES = [PHOTO.fishSchool, PHOTO.hydroTower, PHOTO.soilHands];

const SENSOR_LIST = [
  { icon: Thermometer, name: "Water & air temperature", why: "Tilapia thrive at 24–30 °C; heat stress shows first in the tank." },
  { icon: Wind, name: "Dissolved oxygen", why: "The fastest killer — a stopped aerator can kill fish within hours." },
  { icon: FlaskConical, name: "pH", why: "Keeps biofilter bacteria, fish and plants in the same happy range." },
  { icon: Activity, name: "EC / TDS", why: "How much nutrient is dissolved for the plants." },
  { icon: Waves, name: "Tank level", why: "Catches leaks, blocked drains and empty rain tanks early." },
  { icon: Droplets, name: "Humidity", why: "Signals dry-season stress and leaf-disease risk in the shade house." },
  { icon: Gauge, name: "Pump current", why: "Detects a pump that is switched on but not actually running." },
];

export default function SolutionPage() {
  return (
    <>
      <PageHero
        eyebrow="The solution"
        title={
          <>
            Circular farms that <em className="text-leaf-300 italic">report back</em>
          </>
        }
        lead="Each VIEM Suku Unit combines aquaponics, hydroponics and circular inputs on about 150 m² — and a low-cost sensor kit that keeps the loop healthy over the suco's new connection."
        image={PHOTO.greenhouse}
      >
        <ButtonLink href="/dashboard" variant="accent" size="lg">
          <LayoutDashboard className="size-5" aria-hidden="true" /> See it in the live dashboard
        </ButtonLink>
      </PageHero>

      <Section labelledBy="systems-heading">
        <div className="container-page">
          <SectionHeading
            id="systems-heading"
            eyebrow="Three linked systems"
            title={<>Fish, plants and waste — <Accent>one shared water</Accent></>}
          />
          <div className="mt-14 space-y-20">
            {SYSTEMS.map((s, i) => (
              <article key={s.title} className="grid items-center gap-10 lg:grid-cols-2">
                <div className={cn("reveal relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-lift", i % 2 === 1 && "lg:order-2")}>
                  <Photo src={SYSTEM_IMAGES[i].src} alt={SYSTEM_IMAGES[i].alt} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
                  <span className="absolute top-5 left-5 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-forest-800">
                    0{i + 1} · {s.title}
                  </span>
                </div>
                <div className="reveal">
                  <p className="eyebrow text-forest-500">{s.subtitle}</p>
                  <h3 className="mt-3 font-display text-4xl font-medium text-forest-900">{s.title}</h3>
                  <p className="mt-5 text-lg leading-relaxed text-muted">{s.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Section>

      <Section tone="mint" labelledBy="loop-table-heading">
        <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <SectionHeading
              id="loop-table-heading"
              eyebrow="The VIEM loop"
              title={<>Every output of one stage is an <Accent>input</Accent> to another</>}
              lead="Nothing leaves the farm as waste. Rain and sun power the loop; the harvest is graded and bought back by VIEM."
            />
            <div className="reveal relative mt-8 aspect-[6/5] overflow-hidden rounded-3xl shadow-soft">
              <Image src={BRAND.circularLoop.src} alt={BRAND.circularLoop.alt} fill placeholder="blur" sizes="(min-width: 1024px) 35vw, 100vw" className="object-cover" />
            </div>
          </div>
          <div className="rounded-3xl bg-white p-4 shadow-soft md:p-6">
            <ResponsiveTable
              caption="The VIEM circular loop"
              rowKey={(r) => r.input}
              columns={[
                { key: "input", header: "Input" },
                { key: "process", header: "Process" },
                { key: "output", header: "Output" },
                { key: "goesTo", header: "Goes to" },
              ]}
              rows={LOOP_STAGES.map((s) => ({ input: s.input, process: s.process, output: s.output, goesTo: s.goesTo }))}
            />
          </div>
        </div>
      </Section>

      <Section labelledBy="sensing-heading">
        <div className="container-page">
          <SectionHeading
            id="sensing-heading"
            eyebrow="Sensing on the farm"
            title={<>Offline-first by design — <Accent>a few kilobytes an hour</Accent></>}
            lead="A full cloud IoT platform with live streaming fails on shared satellite links. So the controller runs safety rules on the spot and uploads small compressed batches when the link is available."
          />

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            <div className="reveal relative overflow-hidden rounded-3xl bg-forest-900 p-7 text-white lg:row-span-2">
              <Photo src={PHOTO.circuitBoard.src} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover opacity-25" />
              <div className="relative">
                <Cpu className="size-8 text-leaf-300" aria-hidden="true" />
                <h3 className="mt-4 font-display text-3xl">The sensor kit</h3>
                <p className="mt-2 text-sm text-forest-200">ESP32 controller · waterproof probes · battery-backed</p>
                <ul className="mt-6 space-y-4">
                  {SENSOR_LIST.map(({ icon: Icon, name, why }) => (
                    <li key={name} className="flex gap-3">
                      <Icon className="mt-0.5 size-5 shrink-0 text-leaf-300" aria-hidden="true" />
                      <span>
                        <span className="block text-sm font-semibold">{name}</span>
                        <span className="block text-xs leading-relaxed text-forest-200">{why}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {[
              { icon: Radio, title: "LoRa to the suco gateway", body: "Long-range, low-power radio carries readings from the tank to a small gateway at the suco office — no Wi-Fi at the farm." },
              { icon: SatelliteDish, title: "Shares the Vorakai link", body: "The gateway uses the suco's satellite connection. VIEM runs support — not Vorakai." },
              { icon: HardDrive, title: "30 days stored locally", body: "When the link is down for days, nothing is lost: the controller keeps a month of readings and syncs later." },
              { icon: BellRing, title: "Safety rules run on site", body: "Low oxygen switches on the battery-backed aerator and sounds a loud buzzer — with or without internet." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="reveal rounded-3xl border border-forest-100 bg-white p-7 shadow-soft">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-leaf-100 text-leaf-700">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-forest-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>

          <div className="reveal mt-6 grid gap-6 rounded-3xl bg-forest-50 p-6 md:grid-cols-3 md:p-8">
            {[
              { icon: BatteryCharging, k: "Power", v: "Solar array + battery runs pumps and sensors" },
              { icon: Database, k: "Data footprint", v: "≈ 50 bytes per reading, sent in compressed batches" },
              { icon: SatelliteDish, k: "Link failure", v: "SMS fallback and printed response guide" },
            ].map(({ icon: Icon, k, v }) => (
              <div key={k} className="flex items-start gap-4">
                <Icon className="mt-1 size-6 shrink-0 text-forest-600" aria-hidden="true" />
                <p>
                  <span className="block text-xs font-bold tracking-wider text-forest-500 uppercase">{k}</span>
                  <span className="mt-1 block text-sm font-medium text-forest-900">{v}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <section aria-labelledby="tulun-heading" className="bg-forest-950 py-20 text-white md:py-28">
        <div className="container-page grid gap-14 lg:grid-cols-[1fr_1.2fr]">
          <div className="reveal">
            <WhatsAppMock className="[&_figcaption]:text-forest-300" />
          </div>
          <div>
            <SectionHeading
              id="tulun-heading"
              tone="dark"
              eyebrow="Tulun VIEM · Tetum farm assistant"
              title={<>Helpful, honest, and <Accent tone="dark">accountable</Accent></>}
              lead="Every AI answer is logged and reviewed weekly; wrong answers become manual updates. The VIEM operations manager is accountable for advice given."
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="reveal rounded-3xl border border-leaf-400/30 bg-leaf-400/10 p-6">
                <h3 className="eyebrow text-leaf-300">Tulun VIEM may</h3>
                <ul className="mt-4 space-y-3">
                  {TULUN_MAY.map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-sm text-forest-100">
                      <Check className="mt-0.5 size-4 shrink-0 text-leaf-300" aria-hidden="true" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="reveal rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 className="eyebrow text-[#f3a99c]">Tulun VIEM may not</h3>
                <ul className="mt-4 space-y-3">
                  {TULUN_MAY_NOT.map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-sm text-forest-100">
                      <X className="mt-0.5 size-4 shrink-0 text-[#f3a99c]" aria-hidden="true" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <h3 className="mt-10 text-sm font-semibold text-white">If the model or the link fails, the service degrades step by step</h3>
            <ol className="mt-4 grid gap-3 sm:grid-cols-4">
              {DEGRADATION.map((d, i) => (
                <li key={d.title} className="reveal rounded-2xl border border-white/10 p-4">
                  <span className="font-display text-2xl text-leaf-300 italic">{i + 1}</span>
                  <p className="mt-1 text-sm font-semibold">{d.title}</p>
                  <p className="mt-1 text-xs text-forest-300">{d.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <Section id="dashboard" labelledBy="dashboard-heading">
        <div className="container-page grid items-center gap-14 lg:grid-cols-2">
          <div className="reveal relative aspect-[6/5] overflow-hidden rounded-[2rem] shadow-lift">
            <Image src={BRAND.iotMonitoring.src} alt={BRAND.iotMonitoring.alt} fill placeholder="blur" sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
          </div>
          <div>
            <SectionHeading
              id="dashboard-heading"
              eyebrow="The VIEM dashboard"
              title={<>Scattered small farms, <Accent>one reliable supplier</Accent></>}
              lead="At the Hub, a lightweight dashboard shows every unit's health, harvest forecast and buy-back orders — so VIEM can plan collection routes, promise weekly volumes to buyers and spot which cooperatives need a field visit."
            />
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                "Fleet health across every unit",
                "Live sensors with alarm bands",
                "Pumps, aeration, irrigation & circulation",
                "Automation rules with hysteresis",
                "Tetum alerts that need a human to close",
                "Harvest log, buy-back & forecast",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-forest-800">
                  <Check className="mt-0.5 size-4 shrink-0 text-leaf-600" aria-hidden="true" /> {t}
                </li>
              ))}
            </ul>
            <ButtonLink href="/dashboard" className="mt-9" size="lg">
              Open the live demo <ArrowRight className="size-5" aria-hidden="true" />
            </ButtonLink>
          </div>
        </div>
      </Section>

      <Section tone="mint" labelledBy="alt-heading">
        <div className="container-page">
          <SectionHeading
            id="alt-heading"
            eyebrow="Alternatives we considered"
            title={<>Why this design — and <Accent>not the obvious ones</Accent></>}
          />
          <ul className="mt-12 grid gap-5 md:grid-cols-2">
            {ALTERNATIVES.map((a) => (
              <li key={a.title} className="reveal flex gap-5 rounded-3xl bg-white p-6 shadow-soft">
                <CircleX className="mt-1 size-6 shrink-0 text-crit-700" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-forest-900">{a.title}</h3>
                  <p className="mt-1 inline-block rounded-full bg-crit-50 px-2.5 py-0.5 text-xs font-semibold text-crit-700">{a.verdict}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{a.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <ProposalBand />
    </>
  );
}
