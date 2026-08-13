"use client";

import { useCallback, useMemo, useState, type CSSProperties } from "react";

import { VanaSourceConnect } from "@/app/components/VanaSourceConnect";
import {
  computeCompatibility,
  decodeInvite,
  encodeInvite,
  mergeDnaProfile,
  TRAITS,
  type DnaProfile,
  type SourceDnaSignal,
} from "@/lib/dna-profile";
import { DNA_SOURCES, type DnaSourceId } from "@/lib/sources";

const PROFILE_KEY = "dna.verified.profile.v1";
const START_SOURCE = DNA_SOURCES[0];

function loadStoredProfile(): DnaProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DnaProfile;
    if (parsed?.version !== 1 || !Array.isArray(parsed.sources)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function loadPeerFromUrl(): DnaProfile | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const invite = params.get("invite") ?? params.get("match");
  return invite ? decodeInvite(invite) : null;
}

function signalsFromProfile(profile: DnaProfile | null): Partial<Record<DnaSourceId, SourceDnaSignal>> {
  if (!profile) return {};
  const restored: Partial<Record<DnaSourceId, SourceDnaSignal>> = {};
  for (const signal of profile.sources) {
    restored[signal.source] = signal;
  }
  return restored;
}

function saveProfile(profile: DnaProfile) {
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export default function Home() {
  const [profile, setProfile] = useState<DnaProfile | null>(() => loadStoredProfile());
  const [signals, setSignals] = useState<Partial<Record<DnaSourceId, SourceDnaSignal>>>(() =>
    signalsFromProfile(loadStoredProfile()),
  );
  const [peerProfile] = useState<DnaProfile | null>(() => loadPeerFromUrl());
  const [copied, setCopied] = useState(false);
  const [busySource, setBusySource] = useState<string | null>(null);

  const connectedCount = Object.keys(signals).length;
  const remainingSources = DNA_SOURCES.filter((source) => !signals[source.id]);
  const nextSource = remainingSources[0] ?? null;
  const invitedDone = Boolean(copied);
  const matched = Boolean(profile && peerProfile);
  const compatibility = useMemo(() => {
    if (!profile || !peerProfile) return null;
    return computeCompatibility(profile, peerProfile);
  }, [profile, peerProfile]);

  const nextAction = !connectedCount
    ? { id: "connect", label: `Connect ${START_SOURCE.name}`, href: "#start" }
    : remainingSources.length
      ? { id: "more", label: `Connect ${nextSource?.name ?? "another source"}`, href: "#build" }
      : !matched
        ? { id: "invite", label: "Copy invite link", href: "#invite" }
        : { id: "match", label: "See your match", href: "#match" };

  const handleSourceConnected = useCallback((signal: SourceDnaSignal) => {
    setSignals((current) => {
      const next = { ...current, [signal.source]: signal };
      const list = DNA_SOURCES.map((source) => next[source.id]).filter(Boolean) as SourceDnaSignal[];
      const merged = mergeDnaProfile(list);
      setProfile(merged);
      saveProfile(merged);
      return next;
    });
    window.setTimeout(() => document.querySelector("#result")?.scrollIntoView({ behavior: "smooth" }), 80);
  }, []);

  async function copyInvite() {
    if (!profile) return;
    const token = encodeInvite(profile);
    const link = `${window.location.origin}/?invite=${token}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  const activeProfile = profile;
  const scores = activeProfile?.scores;
  const archetype = activeProfile?.archetype;
  const average = activeProfile?.average ?? 0;

  return (
    <main>
      <nav className="nav shell" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="DNA home">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>DNA</span>
        </a>
        <div className="nav-links">
          <a href="#start">1. Connect</a>
          <a href="#invite">2. Invite</a>
          <a href="#match">3. Match</a>
        </div>
        <a className="nav-cta" href={nextAction.href}>{nextAction.label} <span aria-hidden="true">↗</span></a>
      </nav>

      {peerProfile ? (
        <div className="invite-banner" role="status">
          <div className="shell invite-banner-inner">
            <b>A friend shared their DNA.</b>
            <span>
              {connectedCount
                ? "Your match is live below — connect more sources to refine it."
                : `Connect ${START_SOURCE.name} so you can compare with ${peerProfile.archetype}.`}
            </span>
            <a href={connectedCount ? "#match" : "#start"}>{connectedCount ? "See match" : "Connect now"}</a>
          </div>
        </div>
      ) : null}

      <section className="hero hero-action shell" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span /> Do these three things</div>
          <h1>Connect.<br />Invite.<br /><em>Match.</em></h1>
          <p>
            DNA is a live Vana app. Testers: don’t browse the story — complete the loop.
            Each approved source is a real mainnet read. The invite is how the product grows.
          </p>
          <ol className="mission-list">
            <li className={connectedCount ? "done" : "now"}>
              <span>01</span>
              <div>
                <strong>Connect a live source</strong>
                <small>Opens Vana. Approve. DNA reads aggregates only.</small>
              </div>
              <em>{connectedCount ? "Done" : "Do this first"}</em>
            </li>
            <li className={connectedCount >= 2 ? "done" : connectedCount ? "now" : ""}>
              <span>02</span>
              <div>
                <strong>Add a second source</strong>
                <small>Another first-read. Richer DNA. Another Goal.</small>
              </div>
              <em>{connectedCount >= 2 ? "Done" : connectedCount ? "Next" : "After 01"}</em>
            </li>
            <li className={matched ? "done" : connectedCount ? "now-soft" : ""}>
              <span>03</span>
              <div>
                <strong>Invite someone</strong>
                <small>They connect too. You both see a live match score.</small>
              </div>
              <em>{matched ? "Done" : "Then share"}</em>
            </li>
          </ol>
        </div>

        <div className="start-card" id="start">
          <div className="start-kicker">
            <span>START HERE · MAINNET</span>
            <span>1 of 3</span>
          </div>
          <h2>Approve {START_SOURCE.name} with Vana</h2>
          <p>
            Sync {START_SOURCE.name} in the{" "}
            <a href="https://app.vana.org/sources" target="_blank" rel="noreferrer">Vana app</a>{" "}
            on <b>Mainnet</b>, then tap connect. DNA never keeps raw tracks.
          </p>
          {signals[START_SOURCE.id] ? (
            <div className="start-done">
              <b>{START_SOURCE.name} verified</b>
              <span>Now connect another source or copy your invite.</span>
              <div className="start-done-actions">
                {nextSource ? <a className="primary-button" href={`#source-${nextSource.id}`}>Connect {nextSource.name} <span>↓</span></a> : null}
                <button className="ghost-button" type="button" onClick={copyInvite} disabled={!profile}>
                  {copied ? "Invite copied" : "Copy invite"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <VanaSourceConnect
                source={START_SOURCE}
                connected={false}
                emphasis="hero"
                busy={busySource !== null && busySource !== START_SOURCE.id}
                onBusyChange={setBusySource}
                onConnected={handleSourceConnected}
              />
              <p className="start-help">
                Popup blocked? Use the approval link that appears. Keep this tab open while you approve.
              </p>
            </>
          )}
        </div>
      </section>

      <section className="marquee" aria-label="What to test">
        <div>CONNECT A SOURCE <span>✦</span> APPROVE IN VANA <span>✦</span> INVITE A FRIEND <span>✦</span> CONNECT A SOURCE <span>✦</span> APPROVE IN VANA <span>✦</span></div>
      </section>

      <section className="builder-wrap" id="build">
        <div className="builder shell">
          <div className="builder-heading">
            <div>
              <div className="section-kicker light">02 / MORE SOURCES = MORE SIGNAL</div>
              <h2>Don’t stop<br />at <em>one.</em></h2>
            </div>
            <p>
              Each extra source is another Vana approval and another first-read.
              Connect at least two, then send the invite — that is the full product.
            </p>
          </div>

          <div className="progress-pills" aria-label="Test progress">
            <span className={connectedCount ? "on" : "hot"}>{connectedCount ? "✓" : "1"} First connect</span>
            <span className={connectedCount >= 2 ? "on" : connectedCount ? "hot" : ""}>{connectedCount >= 2 ? "✓" : "2"} Second source</span>
            <span className={matched || invitedDone ? "on" : connectedCount ? "hot" : ""}>{matched ? "✓" : "3"} Invite / match</span>
          </div>

          <div className="builder-grid">
            <div className="source-panel">
              <div className="panel-top">
                <span>LIVE VANA SOURCES</span>
                <span>{connectedCount}/{DNA_SOURCES.length} CONNECTED</span>
              </div>
              <div className="source-list">
                {DNA_SOURCES.map((source, index) => {
                  const signal = signals[source.id];
                  const connected = Boolean(signal);
                  const featured = !connected && source.id === (nextSource?.id ?? START_SOURCE.id);
                  return (
                    <div
                      className={`source-row static ${connected ? "connected active" : ""} ${featured ? "featured" : ""}`}
                      id={`source-${source.id}`}
                      key={source.id}
                    >
                      <span className="source-mark" style={{ background: source.color }}>{source.mark}</span>
                      <span className="source-name">
                        <b>
                          {source.name}
                          {featured ? <em className="now-tag">{index === 0 ? "Start here" : "Do this next"}</em> : null}
                        </b>
                        <small>
                          {connected
                            ? `${signal?.sampleSize.toLocaleString() ?? 0} signals · verified`
                            : `${source.signal} · live Vana read`}
                        </small>
                      </span>
                      <div className="source-actions">
                        {connected ? (
                          <span className="source-toggle">
                            Connected
                            <i>✓</i>
                          </span>
                        ) : (
                          <VanaSourceConnect
                            source={source}
                            connected={false}
                            emphasis={featured ? "hero" : "default"}
                            busy={busySource !== null && busySource !== source.id}
                            onBusyChange={setBusySource}
                            onConnected={handleSourceConnected}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className={`demo-note ${connectedCount ? "verified" : ""}`}>
                <span>●</span>
                {connectedCount
                  ? ` ${connectedCount} verified · connect ${Math.max(0, 2 - connectedCount)} more to finish the loop`
                  : " First connect is the whole test. Start with Spotify."}
              </p>
            </div>

            <div className={`result-card ${activeProfile ? "revealed" : ""}`} id="result" aria-live="polite">
              {activeProfile && scores && archetype ? (
                <>
                  <div className="result-top">
                    <span>DNA / VERIFIED PROFILE</span>
                    <span>VANA · {activeProfile.sources.length} SOURCE{activeProfile.sources.length === 1 ? "" : "S"}</span>
                  </div>
                  <div className="next-callout" id="invite">
                    <span>{remainingSources.length ? "NEXT ACTION" : "SHARE THIS"}</span>
                    <strong>
                      {remainingSources.length
                        ? `Connect ${nextSource?.name} — then invite someone.`
                        : "Copy your invite. The product is not done until someone else opens it."}
                    </strong>
                    <div className="next-callout-actions">
                      {nextSource ? <a href={`#source-${nextSource.id}`}>Connect {nextSource.name}</a> : null}
                      <button type="button" onClick={copyInvite}>{copied ? "Copied ✓ Send it now" : "Copy invite link"}</button>
                    </div>
                  </div>
                  <div className="result-orb" style={{ "--score": `${average * 3.6}deg` } as CSSProperties}>
                    <div><b>{average}</b><small>signal score</small></div>
                  </div>
                  <div className="result-title">
                    <span>YOUR ARCHETYPE</span>
                    <h3>{archetype}</h3>
                    <p>{activeProfile.evidence[0]}</p>
                  </div>
                  <div className="trait-list">
                    {TRAITS.map((trait, index) => (
                      <div className="trait" key={trait}>
                        <span>{trait}</span>
                        <i><b style={{ width: `${scores[index]}%` }} /></i>
                        <strong>{scores[index]}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="live-evidence">
                    <span>PRIVATE COMPUTE RECEIPT</span>
                    <p>
                      {activeProfile.sources.map((item) => item.source).join(" · ")} ·{" "}
                      {activeProfile.evidence[activeProfile.evidence.length - 1]}
                    </p>
                  </div>
                </>
              ) : (
                <div className="empty-result test-empty">
                  <span>TEST PATH</span>
                  <h3>Nothing happens until you approve a source.</h3>
                  <ol>
                    <li>Open <a href="https://app.vana.org/sources" target="_blank" rel="noreferrer">app.vana.org/sources</a> · Mainnet</li>
                    <li>Sync Spotify (or any listed source)</li>
                    <li>Come back and tap <b>Connect {START_SOURCE.name} with Vana</b></li>
                    <li>Approve the request · keep this tab open</li>
                  </ol>
                  <a className="primary-button" href="#start">Go to Connect <span>↑</span></a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="match shell" id="match">
        <div className="section-kicker">03 / THE FEATURE WE NEED TESTED</div>
        <div className="match-grid">
          <div className="match-copy">
            <h2>The invite<br />is the <em>product.</em></h2>
            <p>
              Compatibility is not a mock card. Copy the link after you connect.
              Your friend opens it, connects their own source, and the score appears.
            </p>
            <button className="primary-button" type="button" onClick={copyInvite} disabled={!profile}>
              {profile ? (copied ? "Copied — send it" : "Copy invite link") : "Connect first, then invite"}
              <span>↗</span>
            </button>
            <div className="match-stat">
              <b>{compatibility ? `${compatibility.score}%` : connectedCount ? "GO" : "—"}</b>
              <span>
                {compatibility
                  ? "live compatibility from two verified profiles"
                  : peerProfile
                    ? "peer is waiting — connect your source"
                    : "no match until both people have verified DNA"}
              </span>
            </div>
          </div>
          <div className="compat-card">
            <div className="compat-head">
              <span>COMPATIBILITY / {compatibility ? "LIVE" : "WAITING"}</span>
              <span>
                {compatibility
                  ? `${compatibility.sharedSources.length || "0"} SHARED`
                  : peerProfile
                    ? "PEER LOADED · YOUR MOVE"
                    : "COPY THE INVITE"}
              </span>
            </div>
            <div className="people">
              <div className="person">
                <div className="avatar avatar-one">{activeProfile ? activeProfile.archetype.slice(4, 5) || "Y" : "Y"}</div>
                <b>You</b>
                <small>{activeProfile?.archetype ?? "Not connected"}</small>
              </div>
              <div className="compat-score">
                <span>{compatibility ? `${compatibility.score}%` : "—"}</span>
                <small>{compatibility ? "ALIGNED" : "OPEN"}</small>
              </div>
              <div className="person">
                <div className="avatar avatar-two">{peerProfile ? peerProfile.archetype.slice(4, 5) || "P" : "?"}</div>
                <b>{peerProfile ? "Friend" : "Peer"}</b>
                <small>{peerProfile?.archetype ?? "Waiting on invite"}</small>
              </div>
            </div>
            <div className="shared-traits">
              <div>
                <span>Where you click</span>
                <b>{compatibility?.click ?? "Connect both profiles to reveal"}</b>
              </div>
              <div>
                <span>Where you stretch</span>
                <b>{compatibility?.stretch ?? "Differences appear after two verified DNAs"}</b>
              </div>
              <div>
                <span>What you should build</span>
                <b>{compatibility?.build ?? "Copy your invite after connecting a source"}</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="how shell" id="how">
        <div className="section-kicker">04 / WHY THIS WORKS</div>
        <div className="how-grid">
          <h2>Not another profile.<br />A map of <em>you.</em></h2>
          <div className="how-copy">
            <p>Every app knows a fragment of you. DNA brings those fragments together without turning you into the product.</p>
            <div className="steps">
              <article><span>01</span><div><h3>Approve real sources</h3><p>Each connect opens Vana. You approve one source at a time. DNA pays the protocol read from escrow.</p></div></article>
              <article><span>02</span><div><h3>Reveal your pattern</h3><p>Get a portable archetype from aggregate insights—not exposed raw history.</p></div></article>
              <article><span>03</span><div><h3>Find your people</h3><p>Share the invite. When they connect too, you both see real compatibility.</p></div></article>
            </div>
          </div>
        </div>
      </section>

      <section className="privacy" id="privacy">
        <div className="privacy-inner shell">
          <div className="privacy-seal"><span>YOU</span><i /><b>CONTROL<br />THE KEY</b></div>
          <div className="privacy-copy">
            <div className="section-kicker light">05 / BUILT DIFFERENT</div>
            <h2>Personal doesn’t have<br />to mean <em>exposed.</em></h2>
            <p>
              DNA is built on Vana’s user-owned data layer. Apps request access. You approve each
              source. Paid reads settle on mainnet. Only the insights you choose become part of
              your shareable identity.
            </p>
            <div className="privacy-points">
              <span><b>01</b> Source-by-source consent</span>
              <span><b>02</b> Derived traits, not raw history</span>
              <span><b>03</b> Mainnet Goals + invite loop</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer shell">
        <div className="footer-brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>DNA</span></div>
        <p>Data, Network, Alignment.<br />Built for the Vana Cup.</p>
        <a href="#start">Back to connect ↑</a>
        <div className="footer-bottom">
          <span>© 2026 DNA</span>
          <span>CONNECT · INVITE · MATCH</span>
          <span>MAINNET</span>
        </div>
      </footer>

      <div className="sticky-dock" role="navigation" aria-label="Next test action">
        <div className="sticky-dock-inner">
          <div className="dock-steps">
            <span className={connectedCount ? "on" : "hot"}>1 Connect</span>
            <span className={connectedCount >= 2 ? "on" : ""}>2 Another</span>
            <span className={matched ? "on" : ""}>3 Invite</span>
          </div>
          {nextAction.id === "invite" ? (
            <button type="button" onClick={copyInvite}>{copied ? "Copied ✓" : "Copy invite"}</button>
          ) : (
            <a href={nextAction.href}>{nextAction.label}</a>
          )}
        </div>
      </div>
    </main>
  );
}
