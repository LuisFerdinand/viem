import type { Metadata } from "next";
import { OverviewView } from "@/components/dashboard/views/OverviewView";

export const metadata: Metadata = { title: { absolute: "Overview · VIEM Dashboard" } };

export default function Page() {
  return <OverviewView />;
}
