import type { Metadata } from "next";
import { SensorsView } from "@/components/dashboard/views/SensorsView";

export const metadata: Metadata = { title: "Live sensors" };

export default function Page() {
  return <SensorsView />;
}
