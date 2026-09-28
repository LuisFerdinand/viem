import { BookOpen, CheckCheck, TriangleAlert, UserRound } from "lucide-react";
import { LogoMark } from "@/components/ui/Logo";

/** Illustrative Tulun VIEM conversation (Tetum first, English beneath). */
export function WhatsAppMock({ className }: { className?: string }) {
  return (
    <figure className={className}>
      <div className="mx-auto w-full max-w-[22rem] overflow-hidden rounded-[2.2rem] border-[7px] border-forest-950 bg-[#efeae2] shadow-lift">
        <div className="flex items-center gap-3 bg-forest-800 px-4 py-3 text-white">
          <span className="flex size-9 items-center justify-center rounded-full bg-white">
            <LogoMark className="h-5 w-auto" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Tulun VIEM</p>
            <p className="text-[0.7rem] text-forest-200">Asistente agrikultura · online</p>
          </div>
        </div>

        <div className="space-y-3 px-3 py-4 text-[0.82rem] leading-snug">
          <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white p-3 shadow-sm">
            <p className="flex items-center gap-1.5 text-[0.7rem] font-bold tracking-wide text-crit-700 uppercase">
              <TriangleAlert className="size-3.5" aria-hidden="true" /> Alerta · Suku Unit 01
            </p>
            <p className="mt-1 font-medium text-forest-950">Oksijéniu tun (4.6 mg/L). Haree pompa ar agora.</p>
            <p className="mt-1 text-[0.72rem] text-muted italic">Oxygen is low. Check the air pump now.</p>
            <p className="mt-1 text-right text-[0.65rem] text-muted">06:42</p>
          </div>

          <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-[#d9fdd3] p-3 shadow-sm">
            <p className="text-forest-950">Tanba sa mak alfase sira-nia tahan kinur?</p>
            <p className="mt-1 text-[0.72rem] text-muted italic">Why are the lettuce leaves turning yellow?</p>
            <p className="mt-1 flex items-center justify-end gap-1 text-[0.65rem] text-muted">
              06:51 <CheckCheck className="size-3.5 text-water-500" aria-label="Read" />
            </p>
          </div>

          <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white p-3 shadow-sm">
            <p className="text-forest-950">
              Tahan kinur bele tanba nutriente ki&apos;ik ka pH aas liu. Sukat EC no pH, depois haree lista foto.
            </p>
            <p className="mt-1 text-[0.72rem] text-muted italic">
              Yellow leaves can mean low nutrients or high pH. Measure EC and pH, then follow the photo checklist.
            </p>
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-forest-50 px-2 py-0.5 text-[0.68rem] font-medium text-forest-700">
              <BookOpen className="size-3" aria-hidden="true" /> VIEM Manual §4.2 · Nutrients
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <span className="rounded-xl bg-white/80 px-2 py-2 text-center text-[0.72rem] font-medium text-water-700 shadow-sm">
              1 · Haree lista foto
            </span>
            <span className="inline-flex items-center justify-center gap-1 rounded-xl bg-white/80 px-2 py-2 text-center text-[0.72rem] font-medium text-water-700 shadow-sm">
              <UserRound className="size-3" aria-hidden="true" /> 2 · Bolu agrónomu
            </span>
          </div>
        </div>
      </div>
      <figcaption className="mt-4 text-center text-xs text-muted">
        Illustrative Tulun VIEM chat. Alerts are rule-based and always fire; answers come only from the vetted manual.
      </figcaption>
    </figure>
  );
}
