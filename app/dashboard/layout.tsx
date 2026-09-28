import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { DashboardProvider } from "@/components/dashboard/DashboardProvider";
import { DashboardShell } from "@/components/dashboard/Shell";
import { LogoMark } from "@/components/ui/Logo";
import { loadDashboardData } from "@/lib/data";

export const metadata: Metadata = {
  title: { default: "Dashboard demo", template: "%s · VIEM Dashboard" },
  description: "Demo of the VIEM Hub dashboard: live sensors, controls, automation, Tetum alerts and harvest buy-back.",
  robots: { index: false },
};

async function DashboardData({ children }: { children: ReactNode }) {
  const data = await loadDashboardData();
  return (
    <DashboardProvider initialData={data}>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}

function Connecting() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#f5f8f6]" role="status" aria-live="polite">
      <LogoMark className="h-12 w-auto motion-safe:animate-pulse" />
      <p className="text-sm font-medium text-muted">Connecting to the VIEM Hub…</p>
    </div>
  );
}

/** The shell streams in once data arrives — a sleeping Neon database can take a moment to wake. */
export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <Suspense fallback={<Connecting />}>
      <DashboardData>{children}</DashboardData>
    </Suspense>
  );
}
