import type { Metadata } from "next";
import { PresetsView } from "@/components/dashboard/views/PresetsView";
export const metadata: Metadata = { title: "Preset master data" };
export default function Page() { return <PresetsView />; }
