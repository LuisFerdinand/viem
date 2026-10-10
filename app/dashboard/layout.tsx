import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { DashboardProvider } from "@/components/dashboard/DashboardProvider";
import { DashboardShell } from "@/components/dashboard/Shell";
import { Connecting } from "@/components/dashboard/Connecting";
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

/** The shell streams in once data arrives — a sleeping Neon database can take a moment to wake. */
export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <Suspense fallback={<Connecting />}>
      <DashboardData>{children}</DashboardData>
    </Suspense>
  );
}
