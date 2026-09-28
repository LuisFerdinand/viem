import type { Metadata } from "next";
import { HarvestView } from "@/components/dashboard/views/HarvestView";

export const metadata: Metadata = { title: "Harvest & buy-back" };

export default function Page() {
  return <HarvestView />;
}
