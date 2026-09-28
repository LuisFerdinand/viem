import type { Metadata } from "next";
import { ActivityView } from "@/components/dashboard/views/ActivityView";

export const metadata: Metadata = { title: "Activity & settings" };

export default function Page() {
  return <ActivityView />;
}
