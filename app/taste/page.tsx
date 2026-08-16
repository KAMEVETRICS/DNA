import type { Metadata } from "next";

import { EntryLanding } from "@/app/components/EntryLanding";

export const metadata: Metadata = {
  title: "Taste DNA — DNA",
  description: "Turn approved Spotify saved tracks into a private Taste DNA through Vana.",
};

export default function TasteDnaPage() {
  return <EntryLanding campaignId="taste" />;
}
