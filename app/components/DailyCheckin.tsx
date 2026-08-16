"use client";

import { useMemo, useState } from "react";

import {
  claimToday,
  hasClaimedToday,
  loadCheckin,
  missionForState,
  type DailyCheckinState,
  type DailyMission,
} from "@/lib/daily-checkin";

type DailyCheckinProps = {
  connectedCount: number;
  remainingSources: number;
  hasProfile: boolean;
  matched: boolean;
  onInvite?: () => void;
};

export function DailyCheckin({
  connectedCount,
  remainingSources,
  hasProfile,
  matched,
  onInvite,
}: DailyCheckinProps) {
  const [state, setState] = useState<DailyCheckinState | null>(() => loadCheckin());
  const [justClaimed, setJustClaimed] = useState(false);

  const claimed = hasClaimedToday(state);
  const mission = useMemo(
    () =>
      missionForState({
        connectedCount,
        remainingSources,
        hasProfile,
        matched,
      }),
    [connectedCount, remainingSources, hasProfile, matched],
  );

  function handleClaim() {
    const next = claimToday(state);
    setState(next);
    setJustClaimed(true);
  }

  function handleMissionCta(current: DailyMission) {
    if (current.id === "invite" && onInvite && hasProfile) {
      onInvite();
      return;
    }
    document.querySelector(current.href)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className={`daily-checkin ${claimed ? "claimed" : "open"}`} id="daily" aria-label="Daily check-in">
      <div className="daily-checkin-top">
        <div>
          <span className="daily-kicker">DAILY CHECK-IN</span>
          <h2>{claimed ? "You’re signed in for today." : "Claim today’s streak."}</h2>
          <p>
            Come back every day. Check-in builds a streak and points you at the action that
            actually grows DNA — connect, invite, match. It does not re-spend escrow.
          </p>
        </div>
        <div className="daily-stats" aria-label="Streak stats">
          <div>
            <b>{state?.streak ?? 0}</b>
            <small>day streak</small>
          </div>
          <div>
            <b>{state?.totalDays ?? 0}</b>
            <small>total days</small>
          </div>
        </div>
      </div>

      {claimed ? (
        <div className="daily-claimed">
          <div>
            <strong>{justClaimed ? "Streak updated." : "Already claimed today."}</strong>
            <span>{mission.title}</span>
            <p>{mission.detail}</p>
          </div>
          <button type="button" onClick={() => handleMissionCta(mission)}>
            {mission.cta}
            <i aria-hidden="true">↗</i>
          </button>
        </div>
      ) : (
        <div className="daily-claim-row">
          <p>
            <b>Today’s mission after claim:</b> {mission.title}
          </p>
          <button type="button" className="daily-claim-button" onClick={handleClaim}>
            Sign in for today
            <i aria-hidden="true">✦</i>
          </button>
        </div>
      )}
    </section>
  );
}
