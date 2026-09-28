import type { Metadata } from "next";
import { AssistantView } from "@/components/dashboard/views/AssistantView";

export const metadata: Metadata = { title: "Tulun VIEM" };

export default function Page() {
  return <AssistantView />;
}
