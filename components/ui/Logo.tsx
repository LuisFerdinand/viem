import { cn } from "@/lib/utils";

/** The VIEM two-leaf mark (vector redraw of the brand logo). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 54" className={cn("shrink-0", className)} aria-hidden="true">
      <path d="M31.5 52C15 49 3.5 33 5 6c19 2 31 17 29 36-.3 3.6-1.1 7-2.5 10Z" fill="#1f7a45" />
      <path d="M33 52c-1.4-5-1.8-11 .2-18C37.5 18 48 7 61 3c2 21-8.5 42-28 49Z" fill="#8cc63f" />
      <path
        d="M31 49C26 35 18.5 22 9.5 11.5"
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M34 49c4.5-14 12.5-27 23.5-40"
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  className,
  tone = "dark",
  showTagline = false,
}: {
  className?: string;
  tone?: "dark" | "light";
  showTagline?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="h-8 w-auto" />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "text-[1.35rem] font-bold tracking-[0.06em]",
            tone === "light" ? "text-white" : "text-forest-700",
          )}
        >
          VIEM
        </span>
        {showTagline && (
          <span
            className={cn(
              "mt-1 text-[0.62rem] font-medium tracking-[0.14em] uppercase",
              tone === "light" ? "text-forest-200" : "text-muted",
            )}
          >
            Grow · Innovate · Sustain
          </span>
        )}
      </span>
    </span>
  );
}
