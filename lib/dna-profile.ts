import type { DnaSourceId } from "@/lib/sources";
import { DNA_SOURCES, getDnaSource } from "@/lib/sources";

export const TRAITS = ["Curiosity", "Taste", "Momentum", "Connection", "Rhythm"] as const;
export type TraitScores = [number, number, number, number, number];

export type SourceDnaSignal = {
  source: DnaSourceId;
  scope: string;
  sampleSize: number;
  scores: TraitScores;
  evidence: string[];
  generatedAt: string;
  privacy: "aggregate-only";
};

export type DnaProfile = {
  version: 1;
  archetype: string;
  scores: TraitScores;
  average: number;
  sources: SourceDnaSignal[];
  evidence: string[];
  generatedAt: string;
  privacy: "aggregate-only";
};

export type CompatibilityInsight = {
  score: number;
  sharedSources: string[];
  click: string;
  stretch: string;
  build: string;
  you: { archetype: string; average: number };
  peer: { archetype: string; average: number };
};

type GenericStats = {
  stringTokens: Set<string>;
  numbers: number[];
  timestamps: number[];
  arrayLengths: number[];
  objectCount: number;
  leafCount: number;
};

const clamp = (value: number, minimum = 45, maximum = 96) =>
  Math.round(Math.min(maximum, Math.max(minimum, value)));

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function variation(values: number[]) {
  if (values.length < 2) return 0;
  const mean = average(values);
  if (!mean) return 0;
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance) / Math.abs(mean);
}

function inspectPayload(value: unknown, stats: GenericStats, depth = 0) {
  if (depth > 10 || value === null || value === undefined) return;

  if (Array.isArray(value)) {
    stats.arrayLengths.push(value.length);
    for (const item of value.slice(0, 4000)) {
      inspectPayload(item, stats, depth + 1);
    }
    return;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return;
    stats.leafCount += 1;
    if (trimmed.length <= 80) stats.stringTokens.add(trimmed.toLowerCase());
    const timestamp = Date.parse(trimmed);
    if (Number.isFinite(timestamp) && trimmed.length >= 8) stats.timestamps.push(timestamp);
    return;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    stats.numbers.push(value);
    stats.leafCount += 1;
    return;
  }

  if (typeof value !== "object") return;

  stats.objectCount += 1;
  for (const child of Object.values(value as Record<string, unknown>)) {
    inspectPayload(child, stats, depth + 1);
  }
}

function emptyStats(): GenericStats {
  return {
    stringTokens: new Set(),
    numbers: [],
    timestamps: [],
    arrayLengths: [],
    objectCount: 0,
    leafCount: 0,
  };
}

/** Source-specific weight on the five DNA traits. */
const sourceTraitBias: Record<DnaSourceId, TraitScores> = {
  chatgpt: [18, 4, 10, 6, 8],
  spotify: [6, 18, 5, 10, 16],
  youtube: [12, 14, 8, 7, 12],
  github: [14, 5, 18, 6, 7],
  linkedin: [8, 5, 14, 16, 6],
  instagram: [5, 16, 7, 14, 12],
};

function scoresFromStats(sourceId: DnaSourceId, stats: GenericStats): TraitScores {
  const sampleSize = Math.max(
    stats.leafCount,
    stats.objectCount,
    ...stats.arrayLengths,
    stats.stringTokens.size,
  );
  const diversity = Math.min(1, stats.stringTokens.size / Math.max(12, sampleSize * 0.35));
  const volume = Math.min(1, Math.log2(sampleSize + 1) / 10);
  const numericSpread = Math.min(1, variation(stats.numbers));
  const newest = stats.timestamps.length ? Math.max(...stats.timestamps) : 0;
  const daysSinceNewest = newest ? (Date.now() - newest) / 86_400_000 : 240;
  const recency = Math.max(0, 1 - daysSinceNewest / 365);
  const bias = sourceTraitBias[sourceId];

  return [
    clamp(48 + bias[0] + diversity * 16 + volume * 10),
    clamp(48 + bias[1] + diversity * 18 + numericSpread * 8),
    clamp(48 + bias[2] + volume * 18 + recency * 12),
    clamp(48 + bias[3] + diversity * 10 + volume * 8 + recency * 6),
    clamp(48 + bias[4] + numericSpread * 14 + diversity * 10),
  ];
}

function evidenceFor(sourceId: DnaSourceId, stats: GenericStats, sampleSize: number): string[] {
  const name = getDnaSource(sourceId).name;
  const tokenCount = stats.stringTokens.size;

  return [
    sampleSize
      ? `${sampleSize.toLocaleString()} approved ${name} signals analyzed`
      : `Approved ${name} source connected`,
    tokenCount
      ? `${tokenCount.toLocaleString()} distinct tokens shaped your range`
      : "Only aggregate patterns were used",
    "Raw records were not retained by DNA",
  ];
}

export function deriveSourceDna(sourceId: DnaSourceId, rawData: unknown, scope?: string): SourceDnaSignal {
  const stats = emptyStats();
  inspectPayload(rawData, stats);

  const sampleSize = Math.max(
    stats.leafCount,
    stats.objectCount,
    stats.stringTokens.size,
    ...stats.arrayLengths,
    0,
  );
  const config = getDnaSource(sourceId);

  return {
    source: sourceId,
    scope: scope ?? config.scopes.join(","),
    sampleSize,
    scores: scoresFromStats(sourceId, stats),
    evidence: evidenceFor(sourceId, stats, sampleSize),
    generatedAt: new Date().toISOString(),
    privacy: "aggregate-only",
  };
}

export function deriveArchetype(scores: TraitScores): string {
  const strongest = scores.indexOf(Math.max(...scores));
  return [
    "The Signal Architect",
    "The Culture Alchemist",
    "The Momentum Collector",
    "The Social Resonator",
    "The Rhythm Cartographer",
  ][strongest];
}

export function mergeDnaProfile(signals: SourceDnaSignal[]): DnaProfile {
  if (!signals.length) {
    throw new Error("At least one verified source signal is required");
  }

  const totals = [0, 0, 0, 0, 0];
  for (const signal of signals) {
    for (let index = 0; index < 5; index += 1) {
      totals[index] += signal.scores[index];
    }
  }

  const scores: TraitScores = [
    Math.round(totals[0] / signals.length),
    Math.round(totals[1] / signals.length),
    Math.round(totals[2] / signals.length),
    Math.round(totals[3] / signals.length),
    Math.round(totals[4] / signals.length),
  ];
  const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  const evidence = signals.flatMap((signal) => signal.evidence.slice(0, 1)).slice(0, 4);

  return {
    version: 1,
    archetype: deriveArchetype(scores),
    scores,
    average: averageScore,
    sources: signals,
    evidence: [
      ...evidence,
      `${signals.length} Vana-verified source${signals.length === 1 ? "" : "s"} · aggregate-only`,
    ],
    generatedAt: new Date().toISOString(),
    privacy: "aggregate-only",
  };
}

function traitLabel(index: number) {
  return TRAITS[index] ?? "Signal";
}

export function computeCompatibility(you: DnaProfile, peer: DnaProfile): CompatibilityInsight {
  const deltas = you.scores.map((score, index) => Math.abs(score - peer.scores[index]));
  const meanDelta = average(deltas);
  const score = Math.round(Math.max(42, Math.min(97, 100 - meanDelta * 1.35)));

  const sharedSources = you.sources
    .map((item) => item.source)
    .filter((id) => peer.sources.some((peerSource) => peerSource.source === id))
    .map((id) => getDnaSource(id).name);

  const closest = deltas.indexOf(Math.min(...deltas));
  const farthest = deltas.indexOf(Math.max(...deltas));

  return {
    score,
    sharedSources,
    click: `Shared strength in ${traitLabel(closest).toLowerCase()}`,
    stretch: `Different emphasis on ${traitLabel(farthest).toLowerCase()}`,
    build:
      sharedSources.length >= 2
        ? "A multi-signal project neither of you would ship alone"
        : "A two-person experiment that mixes both archetypes",
    you: { archetype: you.archetype, average: you.average },
    peer: { archetype: peer.archetype, average: peer.average },
  };
}

/** Compact share payload for invite links (aggregates only). */
export type ShareableDna = {
  v: 1;
  a: string;
  s: TraitScores;
  avg: number;
  src: DnaSourceId[];
};

export function toShareable(profile: DnaProfile): ShareableDna {
  return {
    v: 1,
    a: profile.archetype,
    s: profile.scores,
    avg: profile.average,
    src: profile.sources.map((item) => item.source),
  };
}

export function fromShareable(share: ShareableDna): DnaProfile {
  const sources: SourceDnaSignal[] = share.src.map((id) => ({
    source: id,
    scope: getDnaSource(id).scopes[0],
    sampleSize: 0,
    scores: share.s,
    evidence: [`Peer shared a verified ${getDnaSource(id).name} signal`],
    generatedAt: new Date().toISOString(),
    privacy: "aggregate-only",
  }));

  return {
    version: 1,
    archetype: share.a,
    scores: share.s,
    average: share.avg,
    sources:
      sources.length > 0
        ? sources
        : [
            {
              source: "spotify",
              scope: "shared",
              sampleSize: 0,
              scores: share.s,
              evidence: ["Peer shared a verified DNA profile"],
              generatedAt: new Date().toISOString(),
              privacy: "aggregate-only",
            },
          ],
    evidence: ["Imported from invite · aggregate-only"],
    generatedAt: new Date().toISOString(),
    privacy: "aggregate-only",
  };
}

export function encodeInvite(profile: DnaProfile): string {
  const json = JSON.stringify(toShareable(profile));
  if (typeof btoa === "function") {
    return btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }
  return Buffer.from(json, "utf8").toString("base64url");
}

export function decodeInvite(token: string): DnaProfile | null {
  try {
    const normalized = token.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(token, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as ShareableDna;
    if (parsed?.v !== 1 || !Array.isArray(parsed.s) || parsed.s.length !== 5) return null;
    return fromShareable(parsed);
  } catch {
    return null;
  }
}

export function sourceLabel(id: DnaSourceId) {
  return DNA_SOURCES.find((item) => item.id === id)?.name ?? id;
}
