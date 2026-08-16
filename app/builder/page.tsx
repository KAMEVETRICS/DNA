import type { Metadata } from "next";

import { EntryLanding } from "@/app/components/EntryLanding";

export const metadata: Metadata = {
  title: "Builder DNA — DNA",
  description: "Turn your GitHub signal into a private Builder DNA through Vana.",
};

export default function BuilderDnaPage() {
  return <EntryLanding campaignId="builder" />;
}
