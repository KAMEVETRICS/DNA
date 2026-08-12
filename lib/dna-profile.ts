export type SpotifyDnaSignal = {
  source: "spotify";
  scope: "spotify.savedTracks";
  sampleSize: number;
  scores: [number, number, number, number, number];
  evidence: string[];
  generatedAt: string;
  privacy: "aggregate-only";
};

type SpotifyStats = {
  artists: Set<string>;
  genres: Set<string>;
  popularities: number[];
  durations: number[];
  timestamps: number[];
  trackObjects: number;
  largestTrackArray: number;
};

const clamp = (value: number, minimum = 45, maximum = 96) =>
  Math.round(Math.min(maximum, Math.max(minimum, value)));

function addStrings(target: Set<string>, value: unknown) {
  if (typeof value === "string" && value.trim()) {
    target.add(value.trim().toLowerCase());
    return;
  }

  if (!Array.isArray(value)) return;

  for (const item of value) {
    if (typeof item === "string" && item.trim()) {
      target.add(item.trim().toLowerCase());
    } else if (item && typeof item === "object" && "name" in item) {
      addStrings(target, (item as { name?: unknown }).name);
    }
  }
}

function inspectSpotifyPayload(value: unknown, stats: SpotifyStats, key = "", depth = 0) {
  if (depth > 10 || value === null || value === undefined) return;

  if (Array.isArray(value)) {
    if (/tracks|items|saved/i.test(key)) {
      stats.largestTrackArray = Math.max(stats.largestTrackArray, value.length);
    }

    for (const item of value.slice(0, 5000)) {
      inspectSpotifyPayload(item, stats, key, depth + 1);
    }
    return;
  }

  if (typeof value !== "object") return;

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  const looksLikeTrack =
    keys.some((item) => /^(track|trackName|title|duration_ms|durationMs)$/i.test(item)) &&
    keys.some((item) => /^(artist|artists|album|uri|id)$/i.test(item));

  if (looksLikeTrack) stats.trackObjects += 1;

  for (const [childKey, childValue] of Object.entries(record)) {
    if (/^artists?$/i.test(childKey)) addStrings(stats.artists, childValue);
    if (/genres?/i.test(childKey)) addStrings(stats.genres, childValue);

    if (/popularity/i.test(childKey) && typeof childValue === "number") {
      stats.popularities.push(childValue);
    }

    if (/duration_?ms/i.test(childKey) && typeof childValue === "number") {
      stats.durations.push(childValue);
    }

    if (/added_?at|saved_?at|played_?at/i.test(childKey) && typeof childValue === "string") {
      const timestamp = Date.parse(childValue);
      if (Number.isFinite(timestamp)) stats.timestamps.push(timestamp);
    }

    inspectSpotifyPayload(childValue, stats, childKey, depth + 1);
  }
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function variation(values: number[]) {
  if (values.length < 2) return 0;
  const mean = average(values);
  if (!mean) return 0;
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance) / mean;
}

export function deriveSpotifyDna(rawData: unknown): SpotifyDnaSignal {
  const stats: SpotifyStats = {
    artists: new Set(),
    genres: new Set(),
    popularities: [],
    durations: [],
    timestamps: [],
    trackObjects: 0,
    largestTrackArray: 0,
  };

  inspectSpotifyPayload(rawData, stats);

  const sampleSize = Math.max(stats.largestTrackArray, stats.trackObjects);
  const artistCount = stats.artists.size;
  const genreCount = stats.genres.size;
  const artistBreadth = sampleSize ? Math.min(1, artistCount / sampleSize) : 0;
  const averagePopularity = average(stats.popularities);
  const durationVariation = variation(stats.durations);
  const newestSave = stats.timestamps.length ? Math.max(...stats.timestamps) : 0;
  const daysSinceNewest = newestSave ? (Date.now() - newestSave) / 86_400_000 : 365;
  const recency = Math.max(0, 1 - daysSinceNewest / 365);

  const scores: SpotifyDnaSignal["scores"] = [
    clamp(50 + Math.min(28, artistCount * 0.55) + Math.min(12, genreCount * 1.5)),
    clamp(56 + artistBreadth * 28 + Math.min(10, genreCount)),
    clamp(48 + Math.min(28, Math.log2(sampleSize + 1) * 5) + recency * 14),
    clamp(52 + (averagePopularity || 45) * 0.28 + artistBreadth * 14),
    clamp(54 + Math.min(24, durationVariation * 80) + Math.min(12, genreCount * 1.2)),
  ];

  const evidence = [
    sampleSize
      ? `${sampleSize.toLocaleString()} approved saved-track signals analyzed`
      : "Approved Spotify library connected",
    artistCount
      ? `${artistCount.toLocaleString()} distinct artists shaped your range`
      : "Only aggregate listening patterns were used",
    "Track names and raw listening history were not retained",
  ];

  return {
    source: "spotify",
    scope: "spotify.savedTracks",
    sampleSize,
    scores,
    evidence,
    generatedAt: new Date().toISOString(),
    privacy: "aggregate-only",
  };
}
