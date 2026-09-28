import type { StaticImageData } from "next/image";
import type { ReactNode } from "react";
import { Photo } from "@/components/ui/Photo";

/** Dark, full-bleed photographic header used on inner pages. */
export function PageHero({
  eyebrow,
  title,
  lead,
  image,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lead: ReactNode;
  image: { src: string | StaticImageData; alt: string };
  children?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-forest-950 pt-36 pb-20 text-white md:pt-44 md:pb-28">
      <Photo
        src={image.src}
        alt={image.alt}
        fill
        priority
        quality={85}
        sizes="100vw"
        className="-z-20 object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgb(2_16_16/0.94)_0%,rgb(8_31_28/0.82)_45%,rgb(8_31_28/0.45)_100%)]"
      />
      <div className="container-page">
        <p className="eyebrow text-leaf-300">
          <span aria-hidden="true" className="mr-3 inline-block h-px w-8 bg-leaf-300 align-middle" />
          {eyebrow}
        </p>
        <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[1.04] font-medium tracking-tight text-balance md:text-7xl">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-forest-100 md:text-xl">{lead}</p>
        {children && <div className="mt-9 flex flex-wrap gap-3">{children}</div>}
      </div>
    </section>
  );
}
