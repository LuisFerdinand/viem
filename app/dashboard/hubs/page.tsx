import type { Metadata } from "next";
import { HubsView } from "@/components/dashboard/views/HubsView";
export const metadata: Metadata = { title: "Hubs & sets" };
export default function Page() { return <HubsView />; }
