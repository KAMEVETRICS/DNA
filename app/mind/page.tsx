import type { Metadata } from "next";

import { EntryLanding } from "@/app/components/EntryLanding";

export const metadata: Metadata = {
  title: "Mind DNA — DNA",
  description: "Turn approved ChatGPT memories into a private Mind DNA through Vana.",
};

export default function MindDnaPage() {
  return <EntryLanding campaignId="mind" />;
}
