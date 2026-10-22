"use client";

import { ArrowUpRight, FileText, LayoutDashboard, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { ViewPdfButton } from "@/components/site/PdfViewer";
import { NAV } from "@/lib/content";
import { cn } from "@/lib/utils";

function subscribeScroll(cb: () => void) {
  window.addEventListener("scroll", cb, { passive: true });
  return () => window.removeEventListener("scroll", cb);
}
const getScrolled = () => window.scrollY > 24;
const getServerScrolled = () => false;

export function Navbar() {
  const pathname = usePathname();
  const scrolled = useSyncExternalStore(subscribeScroll, getScrolled, getServerScrolled);
  const [open, setOpen] = useState(false);
  const solid = scrolled || open;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300",
        solid
          ? "border-b border-forest-100 bg-white/90 shadow-[0_8px_30px_-20px_rgb(2_16_16/0.35)] backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
        open && "bg-white",
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:rounded-full focus:bg-leaf-400 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-forest-950"
      >
        Skip to content
      </a>
      <nav aria-label="Main" className="container-page flex h-18 items-center justify-between gap-4">
        <Link href="/" aria-label="VIEM home" onClick={() => setOpen(false)} className="rounded-lg">
          <Logo tone={solid ? "dark" : "light"} />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  solid
                    ? "text-forest-800 hover:bg-forest-50 aria-[current=page]:text-forest-950"
                    : "text-white/85 hover:bg-white/10 hover:text-white aria-[current=page]:text-white",
                )}
              >
                {item.label}
                {isActive(item.href) && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full",
                      solid ? "bg-leaf-500" : "bg-leaf-400",
                    )}
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          <ButtonLink href="/dashboard" variant={solid ? "secondary" : "ghost-light"} size="sm" className="h-10">
            <LayoutDashboard className="size-4" aria-hidden="true" />
            Live demo
          </ButtonLink>
          <ViewPdfButton docKey="proposal" variant={solid ? "primary" : "accent"} size="sm" className="h-10">
            <FileText className="size-4" aria-hidden="true" />
            View proposal
          </ViewPdfButton>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className={cn(
            "inline-flex size-11 items-center justify-center rounded-full transition-colors lg:hidden",
            solid ? "text-forest-900 hover:bg-forest-100" : "text-white hover:bg-white/10",
          )}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </nav>

      <div
        id="mobile-menu"
        hidden={!open}
        className="h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-forest-100 bg-white lg:hidden"
      >
        <ul className="container-page flex flex-col py-4">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className="flex items-center justify-between border-b border-forest-100 py-4 font-display text-2xl text-forest-900 aria-[current=page]:text-forest-500"
              >
                {item.label}
                <ArrowUpRight className="size-5 text-forest-400" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
        <div className="container-page flex flex-col gap-3 pb-10">
          <ViewPdfButton docKey="proposal" variant="primary" size="lg" onOpen={() => setOpen(false)}>
            <FileText className="size-5" aria-hidden="true" />
            View proposal (PDF)
          </ViewPdfButton>
          <ButtonLink href="/dashboard" variant="secondary" size="lg" onClick={() => setOpen(false)}>
            <LayoutDashboard className="size-5" aria-hidden="true" />
            Open the live dashboard demo
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
