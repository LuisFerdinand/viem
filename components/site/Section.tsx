import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "white" | "mint" | "sand" | "dark";

const tones: Record<Tone, string> = {
  white: "bg-white",
  mint: "bg-forest-50",
  sand: "bg-sand-50",
  dark: "bg-forest-900 text-white",
};

export function Section({
  id,
  tone = "white",
  className,
  children,
  labelledBy,
}: {
  id?: string;
  tone?: Tone;
  className?: string;
  children: ReactNode;
  labelledBy?: string;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("relative py-20 md:py-28", tones[tone], className)}>
      {children}
    </section>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  lead,
  align = "left",
  tone = "light",
  className,
}: {
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <div className={cn("reveal max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <p className={cn("eyebrow", dark ? "text-leaf-300" : "text-forest-500")}>
          <span aria-hidden="true" className={cn("mr-3 inline-block h-px w-8 align-middle", dark ? "bg-leaf-300" : "bg-forest-400")} />
          {eyebrow}
        </p>
      )}
      <h2
        id={id}
        className={cn(
          "mt-4 font-display text-4xl leading-[1.08] font-medium tracking-tight text-balance md:text-5xl",
          dark ? "text-white" : "text-forest-900",
        )}
      >
        {title}
      </h2>
      {lead && (
        <p className={cn("mt-5 text-lg leading-relaxed", dark ? "text-forest-200" : "text-muted")}>{lead}</p>
      )}
    </div>
  );
}

/** Italic serif accent used inside headings, echoing the "Forest Green" moodboard type. */
export function Accent({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "dark" }) {
  return <em className={cn("font-display italic", tone === "dark" ? "text-leaf-300" : "text-forest-500")}>{children}</em>;
}
