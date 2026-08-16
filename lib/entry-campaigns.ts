import type { DnaSourceId } from "@/lib/sources";

export type EntryCampaignId = "builder" | "mind" | "taste";

export type EntryCampaign = {
  id: EntryCampaignId;
  path: string;
  sourceId: DnaSourceId;
  label: string;
  eyebrow: string;
  headlineBefore: string;
  headlineEmphasis: string;
  description: string;
  promise: string;
  syncLabel: string;
};

export const ENTRY_CAMPAIGNS: Record<EntryCampaignId, EntryCampaign> = {
  builder: {
    id: "builder",
    path: "/builder",
    sourceId: "github",
    label: "Builder DNA",
    eyebrow: "DNA FOR BUILDERS",
    headlineBefore: "Your work leaves a",
    headlineEmphasis: "builder signal.",
    description:
      "Connect GitHub through Vana and turn the way you build into a private, shareable Builder DNA.",
    promise: "Profile, contributions, and repositories become aggregate traits — not a public repo dump.",
    syncLabel: "Sync GitHub on Vana",
  },
  mind: {
    id: "mind",
    path: "/mind",
    sourceId: "chatgpt",
    label: "Mind DNA",
    eyebrow: "DNA FOR AI THINKERS",
    headlineBefore: "Your mind leaves a",
    headlineEmphasis: "pattern.",
    description:
      "Connect saved ChatGPT memories through Vana and reveal the aggregate patterns behind how you think.",
    promise: "DNA keeps the derived traits, not your prompts or conversation history.",
    syncLabel: "Sync ChatGPT on Vana",
  },
  taste: {
    id: "taste",
    path: "/taste",
    sourceId: "spotify",
    label: "Taste DNA",
    eyebrow: "DNA FOR MUSIC PEOPLE",
    headlineBefore: "Your taste has a",
    headlineEmphasis: "shape.",
    description:
      "Connect Spotify through Vana and turn your saved-track signal into a private Taste DNA.",
    promise: "DNA sees aggregate listening patterns — not a public playlist or raw track history.",
    syncLabel: "Sync Spotify on Vana",
  },
};

export function getEntryCampaign(value: string | null | undefined) {
  if (!value || !(value in ENTRY_CAMPAIGNS)) return null;
  return ENTRY_CAMPAIGNS[value as EntryCampaignId];
}
