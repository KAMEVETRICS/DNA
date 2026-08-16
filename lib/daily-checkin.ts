export type DailyCheckinState = {
  version: 1;
  /** Calendar day of last claim in local time, YYYY-MM-DD */
  lastDate: string;
  streak: number;
  totalDays: number;
};

export type DailyMission = {
  id: "connect" | "more" | "invite" | "match";
  title: string;
  detail: string;
  cta: string;
  href: string;
};

const STORAGE_KEY = "dna.daily.checkin.v1";

export function todayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDay(key: string): number {
  const [year, month, day] = key.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function dayDiff(a: string, b: string): number {
  return Math.round((parseDay(b) - parseDay(a)) / 86_400_000);
}

export function loadCheckin(): DailyCheckinState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DailyCheckinState;
    if (parsed?.version !== 1 || typeof parsed.lastDate !== "string") return null;
    return {
      version: 1,
      lastDate: parsed.lastDate,
      streak: Math.max(0, Number(parsed.streak) || 0),
      totalDays: Math.max(0, Number(parsed.totalDays) || 0),
    };
  } catch {
    return null;
  }
}

export function saveCheckin(state: DailyCheckinState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function hasClaimedToday(state: DailyCheckinState | null, today = todayKey()): boolean {
  return Boolean(state && state.lastDate === today);
}

export function claimToday(state: DailyCheckinState | null, today = todayKey()): DailyCheckinState {
  if (state && state.lastDate === today) return state;

  let streak = 1;
  if (state?.lastDate) {
    const gap = dayDiff(state.lastDate, today);
    streak = gap === 1 ? state.streak + 1 : 1;
  }

  const next: DailyCheckinState = {
    version: 1,
    lastDate: today,
    streak,
    totalDays: (state?.totalDays ?? 0) + 1,
  };
  saveCheckin(next);
  return next;
}

/** Product action the daily claim should push toward. */
export function missionForState(input: {
  connectedCount: number;
  remainingSources: number;
  hasProfile: boolean;
  matched: boolean;
}): DailyMission {
  if (!input.connectedCount) {
    return {
      id: "connect",
      title: "Today: approve one live source",
      detail: "A first Vana read is a real Cup Goal. Pick any source you already synced on Mainnet.",
      cta: "Connect a source",
      href: "#start",
    };
  }

  if (input.remainingSources > 0) {
    return {
      id: "more",
      title: "Today: add another source",
      detail: "Each extra source is another first-read and a richer DNA profile.",
      cta: "Connect another source",
      href: "#build",
    };
  }

  if (!input.matched) {
    return {
      id: "invite",
      title: "Today: send your invite",
      detail: "Growth is the product. Copy the link so a friend can connect and match with you.",
      cta: "Copy invite",
      href: "#invite",
    };
  }

  return {
    id: "match",
    title: "Today: share your match",
    detail: "You already completed the loop. Re-share your invite and pull one more person in.",
    cta: "Open invite tools",
    href: "#match",
  };
}
