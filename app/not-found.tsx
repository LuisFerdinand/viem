import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Photo } from "@/components/ui/Photo";
import { PHOTO } from "@/lib/images";

export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-dvh flex-col bg-forest-950 text-white">
      <Photo src={PHOTO.forestAerial.src} alt="" fill sizes="100vw" className="-z-20 object-cover opacity-50" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-forest-950/70" />
      <div className="container-page py-6">
        <Logo tone="light" />
      </div>
      <div className="container-page flex flex-1 flex-col justify-center pb-24">
        <p className="eyebrow text-leaf-300">Error 404</p>
        <h1 className="mt-4 max-w-2xl font-display text-5xl leading-tight font-medium md:text-7xl">
          This path has <em className="text-leaf-300 italic">grown over.</em>
        </h1>
        <p className="mt-5 max-w-lg text-lg text-forest-200">The page you are looking for doesn&apos;t exist or has moved.</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <ButtonLink href="/" variant="accent" size="lg">
            <ArrowLeft className="size-5" aria-hidden="true" /> Back to home
          </ButtonLink>
          <ButtonLink href="/dashboard" variant="ghost-light" size="lg">
            <LayoutDashboard className="size-5" aria-hidden="true" /> Dashboard demo
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
