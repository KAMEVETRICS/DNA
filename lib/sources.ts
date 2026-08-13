export type DnaSourceId =
  | "spotify"
  | "chatgpt"
  | "youtube"
  | "github"
  | "linkedin"
  | "instagram";

export type DnaSourceConfig = {
  id: DnaSourceId;
  /** Vana source key (matches connector registry). */
  source: string;
  scopes: string[];
  name: string;
  signal: string;
  mark: string;
  color: string;
  blurb: string;
};

/** Live Vana sources DNA can request. One source per access request. */
export const DNA_SOURCES: DnaSourceConfig[] = [
  {
    id: "spotify",
    source: "spotify",
    scopes: ["spotify.savedTracks"],
    name: "Spotify",
    signal: "What moves you",
    mark: "SP",
    color: "#ff795f",
    blurb: "Approve saved tracks once. Aggregate taste only.",
  },
  {
    id: "chatgpt",
    source: "chatgpt",
    scopes: ["chatgpt.memories"],
    name: "ChatGPT",
    signal: "How you think",
    mark: "AI",
    color: "#c9ff69",
    blurb: "Approve memories once. DNA keeps thinking patterns only.",
  },
  {
    id: "youtube",
    source: "youtube",
    scopes: ["youtube.history", "youtube.subscriptions"],
    name: "YouTube",
    signal: "What pulls you in",
    mark: "YT",
    color: "#ffb75d",
    blurb: "Approve watch + subscriptions. No public playlist dump.",
  },
  {
    id: "github",
    source: "github",
    scopes: ["github.profile", "github.contributions", "github.repositories"],
    name: "GitHub",
    signal: "What you build",
    mark: "GH",
    color: "#8ec5ff",
    blurb: "Approve builder signal. Repo names stay private.",
  },
  {
    id: "linkedin",
    source: "linkedin",
    scopes: ["linkedin.profile", "linkedin.skills", "linkedin.experience"],
    name: "LinkedIn",
    signal: "Where you are going",
    mark: "IN",
    color: "#ad9cff",
    blurb: "Approve career shape. Contacts are not retained.",
  },
  {
    id: "instagram",
    source: "instagram",
    scopes: ["instagram.profile", "instagram.following"],
    name: "Instagram",
    signal: "How you express",
    mark: "IG",
    color: "#ff8ec7",
    blurb: "Approve expression signal. Media files never leave Vana.",
  },
];

export const DNA_SOURCE_IDS = DNA_SOURCES.map((item) => item.id);

export function isDnaSourceId(value: string | null | undefined): value is DnaSourceId {
  return Boolean(value && DNA_SOURCE_IDS.includes(value as DnaSourceId));
}

export function getDnaSource(id: string): DnaSourceConfig {
  const match = DNA_SOURCES.find((item) => item.id === id);
  if (!match) {
    throw new Error(`Unsupported DNA source: ${id}`);
  }
  return match;
}
