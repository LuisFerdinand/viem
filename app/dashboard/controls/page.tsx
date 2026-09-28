import type { Metadata } from "next";
import { ControlsView } from "@/components/dashboard/views/ControlsView";

export const metadata: Metadata = { title: "Controls" };

export default function Page() {
  return <ControlsView />;
}
