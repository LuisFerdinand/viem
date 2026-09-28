import Image from "next/image";
import { TEAM } from "@/lib/content";
import { TEAM_PHOTOS } from "@/lib/images";
import { cn } from "@/lib/utils";

function Initials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,#325c51,#081f1c_70%)]">
      <svg viewBox="0 0 200 200" className="absolute inset-0 size-full opacity-20" aria-hidden="true">
        <path d="M100 190C60 180 30 140 34 60c45 6 72 44 66 100-1 10-3 20 0 30Z" fill="#95c24a" />
        <path d="M104 190c-3-14-4-30 1-50 12-42 38-70 70-80 5 58-22 116-71 130Z" fill="#c9e59f" />
      </svg>
      <span className="relative font-display text-6xl font-medium text-white italic">{initials}</span>
    </div>
  );
}

export function TeamGrid({ detailed = false }: { detailed?: boolean }) {
  return (
    <ul className={cn("grid gap-6 sm:grid-cols-2", detailed ? "lg:grid-cols-2 xl:grid-cols-4" : "lg:grid-cols-4")}>
      {TEAM.map((m) => (
        <li key={m.name} className="reveal group overflow-hidden rounded-3xl border border-forest-100 bg-white shadow-soft">
          <div className="relative aspect-[4/4.2] overflow-hidden bg-forest-700">
            {m.photo ? (
              <Image
                src={TEAM_PHOTOS[m.photo]}
                alt={`Portrait of ${m.name}, ${m.role}`}
                fill
                placeholder="blur"
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
              />
            ) : (
              <Initials name={m.name} />
            )}
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-forest-950/70 to-transparent" />
            <p className="absolute bottom-4 left-5 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-forest-800">
              {m.role}
            </p>
          </div>
          <div className="p-6">
            <h3 className="font-display text-2xl font-medium text-forest-900">{m.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{m.focus}</p>
            {detailed && <p className="mt-3 border-t border-forest-100 pt-3 text-sm leading-relaxed text-forest-700">{m.bio}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
