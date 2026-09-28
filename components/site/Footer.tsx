import { Download, Globe, LayoutDashboard, Mail, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { CONTACT, DOWNLOADS, KONEKTA, NAV, QUOTE } from "@/lib/content";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-forest-950 text-forest-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-40 size-[28rem] rounded-full bg-forest-700/30 blur-3xl"
      />
      <div className="container-page relative grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-5">
          <Logo tone="light" showTagline />
          <p className="mt-6 max-w-sm font-display text-xl leading-snug text-white italic">“{QUOTE}”</p>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-forest-300">
            VIEM — Visionary Innovation for Environmental Management. A modern agribusiness building a smarter,
            regenerative agricultural ecosystem in Timor-Leste.
          </p>
        </div>

        <nav aria-label="Footer" className="md:col-span-3">
          <h2 className="eyebrow text-leaf-300">Explore</h2>
          <ul className="mt-5 grid gap-3 text-sm">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="text-forest-200 transition-colors hover:text-white">
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/dashboard" className="inline-flex items-center gap-2 text-forest-200 hover:text-white">
                <LayoutDashboard className="size-4" aria-hidden="true" /> Dashboard demo
              </Link>
            </li>
          </ul>
        </nav>

        <div className="md:col-span-4">
          <h2 className="eyebrow text-leaf-300">Contact</h2>
          <ul className="mt-5 grid gap-3 text-sm">
            <li>
              <a href={CONTACT.whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 text-forest-200 hover:text-white">
                <MessageCircle className="size-4 text-leaf-400" aria-hidden="true" />
                WhatsApp {CONTACT.whatsappDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${CONTACT.email}`} className="inline-flex items-center gap-2.5 text-forest-200 hover:text-white">
                <Mail className="size-4 text-leaf-400" aria-hidden="true" />
                {CONTACT.email}
              </a>
            </li>
            <li>
              <a href={CONTACT.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 text-forest-200 hover:text-white">
                <Globe className="size-4 text-leaf-400" aria-hidden="true" />
                {CONTACT.website}
              </a>
            </li>
            <li>
              <a href={DOWNLOADS.proposal.href} download className="inline-flex items-center gap-2.5 text-forest-200 hover:text-white">
                <Download className="size-4 text-leaf-400" aria-hidden="true" />
                Download the proposal (PDF)
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-forest-300 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} VIEM Project · Timor-Leste</p>
          <p>
            Entry to the{" "}
            <a href={KONEKTA.url} target="_blank" rel="noopener noreferrer" className="underline decoration-forest-500 underline-offset-4 hover:text-white">
              {KONEKTA.name}
            </a>{" "}
            · {KONEKTA.track} track
          </p>
        </div>
      </div>
    </footer>
  );
}
