import type { Metadata } from "next";
import { AutomationView } from "@/components/dashboard/views/AutomationView";

export const metadata: Metadata = { title: "Automation & alarms" };

export default function Page() {
  return <AutomationView />;
}
