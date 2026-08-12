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
  const compatibility = useMemo(() => {
    if (!profile || !peerProfile) return null;
    return computeCompatibility(profile, peerProfile);
  }, [profile, peerProfile]);

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
      window.setTimeout(() => setCopied(false), 1800);
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
          <a href="#how">How it works</a>
          <a href="#match">Match</a>
          <a href="#privacy">Privacy</a>
        </div>
        <a className="nav-cta" href="#build">Reveal my DNA <span aria-hidden="true">↗</span></a>
      </nav>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span /> Vana Cup · Mainnet data app</div>
          <h1>Your data has<br />a <em>shape.</em></h1>
          <p>
            DNA turns the context you already own into a private, portable identity—then
            reveals how you align with the people you choose. Every signal is a real Vana
            first-read on mainnet.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#build">Connect sources <span>↓</span></a>
            <a className="text-link" href="#how">See the idea <span>↗</span></a>
          </div>
          <div className="trust-row">
            <span className="tiny-lock" aria-hidden="true">⌁</span>
            <span>Permissioned by you</span>
            <i />
            <span>Raw data stays private</span>
            <i />
            <span>Powered by Vana</span>
          </div>
        </div>

        <div className="hero-visual" aria-label="A preview of a DNA identity profile">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="signal-pill signal-one"><span>AI</span> curiosity</div>
          <div className="signal-pill signal-two"><span>SP</span> taste</div>
          <div className="signal-pill signal-three"><span>GH</span> momentum</div>
          <div className="profile-card">
            <div className="card-meta"><span>DNA / LIVE</span><span>PRIVATE BY DEFAULT</span></div>
            <div className="identity-orb">
              <div className="orb-core">{activeProfile ? average : 87}</div>
              <span className="orb-dot dot-a" />
              <span className="orb-dot dot-b" />
              <span className="orb-dot dot-c" />
              <span className="orb-dot dot-d" />
            </div>
            <div className="card-label">YOUR ARCHETYPE</div>
            <strong>{activeProfile ? activeProfile.archetype : <>The Signal<br />Architect</>}</strong>
            <div className="mini-bars">
              <span style={{ "--fill": `${scores?.[0] ?? 91}%` } as CSSProperties} />
              <span style={{ "--fill": `${scores?.[1] ?? 76}%` } as CSSProperties} />
              <span style={{ "--fill": `${scores?.[2] ?? 88}%` } as CSSProperties} />
            </div>
          </div>
          <div className="hero-note">Different apps.<br /><b>One coherent you.</b></div>
        </div>
      </section>

      <section className="marquee" aria-label="Product promise">
        <div>YOUR CONTEXT <span>✦</span> YOUR IDENTITY <span>✦</span> YOUR TERMS <span>✦</span> YOUR CONTEXT <span>✦</span> YOUR IDENTITY <span>✦</span></div>
      </section>

      <section className="how shell" id="how">
        <div className="section-kicker">01 / THE IDEA</div>
        <div className="how-grid">
          <h2>Not another profile.<br />A map of <em>you.</em></h2>
          <div className="how-copy">
            <p>Every app knows a fragment of you. DNA brings those fragments together without turning you into the product.</p>
            <div className="steps">
              <article><span>01</span><div><h3>Approve real sources</h3><p>Each connect opens Vana. You approve one source at a time. DNA pays the protocol read from escrow.</p></div></article>
              <article><span>02</span><div><h3>Reveal your pattern</h3><p>Get a portable archetype from aggregate insights—not exposed raw history.</p></div></article>
              <article><span>03</span><div><h3>Invite a friend</h3><p>Share your verified DNA link. When they connect too, you both see real compatibility.</p></div></article>
            </div>
          </div>
        </div>
      </section>

      <section className="builder-wrap" id="build">
        <div className="builder shell">
          <div className="builder-heading">
            <div>
              <div className="section-kicker light">02 / BUILD YOUR DNA</div>
              <h2>Connect live<br /><em>signals.</em></h2>
            </div>
            <p>
              Every source below is a real Vana connector. Approve it once, DNA performs a paid
              mainnet read, and only aggregate traits stay in your browser. More sources mean more
              Goals on the Cup table.
            </p>
          </div>

          <div className="builder-grid">
            <div className="source-panel">
              <div className="panel-top">
                <span>YOUR SOURCES</span>
                <span>{connectedCount} CONNECTED · {DNA_SOURCES.length} LIVE</span>
              </div>
              <div className="source-list">
                {DNA_SOURCES.map((source) => {
                  const signal = signals[source.id];
                  const connected = Boolean(signal);
                  return (
                    <div
                      className={`source-row static ${connected ? "connected active" : ""}`}
                      key={source.id}
                    >
                      <span className="source-mark" style={{ background: source.color }}>{source.mark}</span>
                      <span className="source-name">
                        <b>{source.name}</b>
                        <small>{connected ? `${signal?.sampleSize.toLocaleString() ?? 0} signals · verified` : source.signal}</small>
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
                  ? ` ${connectedCount} Vana-verified source${connectedCount === 1 ? "" : "s"} · aggregate-only`
                  : " Connect any source to score a Cup Goal"}
              </p>
              <p className="demo-hint">{DNA_SOURCES[0]?.blurb}</p>
            </div>

            <div className={`result-card ${activeProfile ? "revealed" : ""}`} id="result" aria-live="polite">
              {activeProfile && scores && archetype ? (
                <>
                  <div className="result-top">
                    <span>DNA / VERIFIED PROFILE</span>
                    <span>VANA · {activeProfile.sources.length} SOURCE{activeProfile.sources.length === 1 ? "" : "S"}</span>
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
                  <div className="share-block">
                    <div>
                      <span>UNLOCK SOCIAL DNA</span>
                      <p>Copy your invite. A friend opens it, connects their sources, and you both get a real match score.</p>
                    </div>
                    <button type="button" onClick={copyInvite}>{copied ? "Copied ✓" : "Copy invite ↗"}</button>
                  </div>
                </>
              ) : (
                <div className="empty-result">
                  <div className="empty-orb"><span /><span /><span /></div>
                  <span>UNMAPPED SIGNAL</span>
                  <h3>Your pattern is waiting.</h3>
                  <p>Connect a source with Vana to reveal verified DNA.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="match shell" id="match">
        <div className="section-kicker">03 / THE GROWTH LOOP</div>
        <div className="match-grid">
          <div className="match-copy">
            <h2>Your DNA gets<br />better <em>together.</em></h2>
            <p>
              Invites carry only aggregate traits—never raw history. When both sides hold a
              verified profile, DNA computes alignment from the same five traits.
            </p>
            <div className="match-stat">
              <b>{compatibility ? `${compatibility.score}%` : "2×"}</b>
              <span>
                {compatibility
                  ? "live compatibility from two verified profiles"
                  : "profiles completed per friend match"}
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
                    ? "PEER LOADED · CONNECT YOURS"
                    : "INVITE A FRIEND"}
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

      <section className="privacy" id="privacy">
        <div className="privacy-inner shell">
          <div className="privacy-seal"><span>YOU</span><i /><b>CONTROL<br />THE KEY</b></div>
          <div className="privacy-copy">
            <div className="section-kicker light">04 / BUILT DIFFERENT</div>
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
        <a href="#top">Back to top ↑</a>
        <div className="footer-bottom">
          <span>© 2026 DNA</span>
          <span>YOUR CONTEXT · YOUR IDENTITY · YOUR TERMS</span>
          <span>MAINNET</span>
        </div>
      </footer>
    </main>
  );
}
