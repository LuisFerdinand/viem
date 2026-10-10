import type { Metadata } from "next";
import { LedgerView } from "@/components/dashboard/views/LedgerView";
export const metadata: Metadata = { title: "Buku Besar" };
export default function Page() { return <LedgerView />; }
