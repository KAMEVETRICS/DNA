"use client";

import { useCallback, useMemo, useState, type CSSProperties } from "react";

import { VanaSpotifyConnect } from "@/app/components/VanaSpotifyConnect";
import type { SpotifyDnaSignal } from "@/lib/dna-profile";

type Source = {
  id: string;
  name: string;
  signal: string;
  mark: string;
  color: string;
};

const sources: Source[] = [
  { id: "chatgpt", name: "ChatGPT", signal: "How you think", mark: "AI", color: "#c9ff69" },
  { id: "spotify", name: "Spotify", signal: "What moves you", mark: "SP", color: "#ff795f" },
  { id: "youtube", name: "YouTube", signal: "What pulls you in", mark: "YT", color: "#ffb75d" },
  { id: "github", name: "GitHub", signal: "What you build", mark: "GH", color: "#8ec5ff" },
  { id: "linkedin", name: "LinkedIn", signal: "Where you are going", mark: "IN", color: "#ad9cff" },
  { id: "instagram", name: "Instagram", signal: "How you express", mark: "IG", color: "#ff8ec7" },
];

const sourceWeights: Record<string, number[]> = {
  chatgpt: [18, 7, 12, 4, 9],
  spotify: [5, 20, 4, 11, 17],
  youtube: [13, 9, 6, 8, 15],
  github: [12, 3, 21, 5, 6],
  linkedin: [7, 4, 16, 14, 5],
  instagram: [4, 15, 5, 20, 9],
};

const traits = ["Curiosity", "Taste", "Momentum", "Connection", "Rhythm"];

function deriveScores(selected: string[]) {
  const base = [42, 38, 40, 36, 43];
  const totals = base.map((value, index) =>
    Math.min(96, value + selected.reduce((sum, id) => sum + sourceWeights[id][index], 0)),
  );
  return totals;
}

function deriveArchetype(selected: string[]) {
  if (selected.includes("github") && selected.includes("chatgpt")) return "The Signal Architect";
  if (selected.includes("spotify") && selected.includes("instagram")) return "The Culture Alchemist";
  if (selected.includes("youtube") && selected.includes("linkedin")) return "The Horizon Chaser";
  return selected.length > 4 ? "The Pattern Weaver" : "The Curious Catalyst";
}

function deriveVerifiedArchetype(scores: SpotifyDnaSignal["scores"]) {
  const strongest = scores.indexOf(Math.max(...scores));
  return [
    "The Sonic Cartographer",
    "The Culture Alchemist",
    "The Momentum Collector",
    "The Social Resonator",
    "The Rhythm Architect",
  ][strongest];
}

export default function Home() {
  const [selected, setSelected] = useState<string[]>([]);
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [verifiedSignal, setVerifiedSignal] = useState<SpotifyDnaSignal | null>(null);
  const scores = useMemo(
    () => verifiedSignal?.scores ?? deriveScores(selected),
    [selected, verifiedSignal],
  );
  const archetype = verifiedSignal
    ? deriveVerifiedArchetype(verifiedSignal.scores)
    : deriveArchetype(selected);
  const average = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

  const handleVanaConnected = useCallback((signal: SpotifyDnaSignal) => {
    setVerifiedSignal(signal);
    setSelected((current) => current.includes("spotify") ? current : [...current, "spotify"]);
    setGenerated(true);
    window.setTimeout(() => document.querySelector("#result")?.scrollIntoView({ behavior: "smooth" }), 80);
  }, []);

  function toggleSource(id: string) {
    if (id === "spotify" && verifiedSignal) return;
    setGenerated(false);
    setSelected((current) =>
      current.includes(id) ? current.filter((source) => source !== id) : [...current, id],
    );
  }

  function revealDNA() {
    if (selected.length < 3) return;
    setGenerated(true);
    window.setTimeout(() => document.querySelector("#result")?.scrollIntoView({ behavior: "smooth" }), 80);
  }

  async function copyInvite() {
    const link = `${window.location.origin}/?match=signal-architect`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main>
      <nav className="nav shell" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="DNA home">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>DNA</span>
        </a>
        <div className="nav-links">
          <a href="#how">How it works</a>
          <a href="#privacy">Privacy</a>
        </div>
        <a className="nav-cta" href="#build">Reveal my DNA <span aria-hidden="true">↗</span></a>
      </nav>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span /> Vana Cup 2026 · Interactive prototype</div>
          <h1>Your data has<br />a <em>shape.</em></h1>
          <p>
            DNA turns the context you already own into a private, portable identity—then
            reveals how you align with the people you choose.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#build">Reveal my DNA <span>↓</span></a>
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
            <div className="card-meta"><span>DNA / 001</span><span>PRIVATE BY DEFAULT</span></div>
            <div className="identity-orb">
              <div className="orb-core">87</div>
              <span className="orb-dot dot-a" />
              <span className="orb-dot dot-b" />
              <span className="orb-dot dot-c" />
              <span className="orb-dot dot-d" />
            </div>
            <div className="card-label">YOUR ARCHETYPE</div>
            <strong>The Signal<br />Architect</strong>
            <div className="mini-bars">
              <span style={{ "--fill": "91%" } as CSSProperties} />
              <span style={{ "--fill": "76%" } as CSSProperties} />
              <span style={{ "--fill": "88%" } as CSSProperties} />
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
              <article><span>01</span><div><h3>Choose your signals</h3><p>Add only the sources you want. Every permission is explicit.</p></div></article>
              <article><span>02</span><div><h3>Reveal your pattern</h3><p>Get a portable archetype built from useful insights—not exposed raw history.</p></div></article>
              <article><span>03</span><div><h3>Find your people</h3><p>Invite a friend and compare the traits you both consent to share.</p></div></article>
            </div>
          </div>
        </div>
      </section>

      <section className="builder-wrap" id="build">
        <div className="builder shell">
          <div className="builder-heading">
            <div>
              <div className="section-kicker light">02 / BUILD YOUR DNA</div>
              <h2>Choose your<br /><em>signals.</em></h2>
            </div>
            <p>Start with Spotify, now live through Vana. DNA turns your approved saved-track signal into aggregate traits; the remaining sources preview the multi-source experience.</p>
          </div>

          <div className="builder-grid">
            <div className="source-panel">
              <div className="panel-top">
                <span>YOUR SOURCES</span>
                <span>{verifiedSignal ? "1 CONNECTED" : "0 CONNECTED"} · {selected.length} SELECTED</span>
              </div>
              <div className="source-list">
                {sources.map((source) => {
                  const active = selected.includes(source.id);
                  const connected = source.id === "spotify" && verifiedSignal !== null;
                  return (
                    <button
                      className={`source-row ${active ? "active" : ""} ${connected ? "connected" : ""}`}
                      key={source.id}
                      type="button"
                      aria-pressed={active || connected}
                      disabled={connected}
                      onClick={() => toggleSource(source.id)}
                    >
                      <span className="source-mark" style={{ background: source.color }}>{source.mark}</span>
                      <span className="source-name"><b>{source.name}</b><small>{source.signal}</small></span>
                      <span className="source-toggle">
                        {connected ? "Connected" : active ? "Selected" : "Select"}
                        <i>{active || connected ? "✓" : "+"}</i>
                      </span>
                    </button>
                  );
                })}
              </div>
              <VanaSpotifyConnect onConnected={handleVanaConnected} />
              <button className="generate-button" type="button" disabled={selected.length < 3} onClick={revealDNA}>
                {selected.length < 3
                  ? `Choose ${3 - selected.length} more`
                  : verifiedSignal
                    ? "Reveal verified DNA"
                    : "Preview my DNA"}
                <span aria-hidden="true">✦</span>
              </button>
              <p className={`demo-note ${verifiedSignal ? "verified" : ""}`}>
                <span>●</span>{verifiedSignal
                  ? ` Vana verified · ${verifiedSignal.sampleSize.toLocaleString()} aggregate signals`
                  : " Preview mode · Connect Spotify for a verified result"}
              </p>
            </div>

            <div className={`result-card ${generated ? "revealed" : ""}`} id="result" aria-live="polite">
              {generated ? (
                <>
                  <div className="result-top">
                    <span>DNA / {verifiedSignal ? "VERIFIED PROFILE" : "PREVIEW PROFILE"}</span>
                    <span>{verifiedSignal ? "VANA · SPOTIFY" : `${selected.length} SIGNALS`}</span>
                  </div>
                  <div className="result-orb" style={{ "--score": `${average * 3.6}deg` } as CSSProperties}>
                    <div><b>{average}</b><small>signal score</small></div>
                  </div>
                  <div className="result-title">
                    <span>YOUR ARCHETYPE</span>
                    <h3>{archetype}</h3>
                    <p>{verifiedSignal
                      ? verifiedSignal.evidence[0]
                      : "You turn scattered inputs into systems people can use. Curious by instinct, deliberate by design."}</p>
                  </div>
                  <div className="trait-list">
                    {traits.map((trait, index) => (
                      <div className="trait" key={trait}>
                        <span>{trait}</span><i><b style={{ width: `${scores[index]}%` }} /></i><strong>{scores[index]}</strong>
                      </div>
                    ))}
                  </div>
                  {verifiedSignal ? (
                    <div className="live-evidence">
                      <span>PRIVATE COMPUTE RECEIPT</span>
                      <p>{verifiedSignal.evidence[1]} · {verifiedSignal.evidence[2]}</p>
                    </div>
                  ) : null}
                  <div className="share-block">
                    <div><span>UNLOCK SOCIAL DNA</span><p>Invite a friend to reveal where you click, clash, and create.</p></div>
                    <button type="button" onClick={copyInvite}>{copied ? "Copied ✓" : "Copy invite ↗"}</button>
                  </div>
                </>
              ) : (
                <div className="empty-result">
                  <div className="empty-orb"><span /><span /><span /></div>
                  <span>UNMAPPED SIGNAL</span>
                  <h3>Your pattern is waiting.</h3>
                  <p>Select three or more sources, then generate your DNA.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="match shell">
        <div className="section-kicker">03 / THE GROWTH LOOP</div>
        <div className="match-grid">
          <div className="match-copy">
            <h2>Your DNA gets<br />better <em>together.</em></h2>
            <p>Every profile creates a reason to invite someone else. The result is personal enough to share, private enough to trust, and more useful with every connection.</p>
            <div className="match-stat"><b>2×</b><span>profiles completed<br />per friend match</span></div>
          </div>
          <div className="compat-card">
            <div className="compat-head"><span>COMPATIBILITY / PREVIEW</span><span>3 SHARED SIGNALS</span></div>
            <div className="people">
              <div className="person"><div className="avatar avatar-one">A</div><b>You</b><small>Signal Architect</small></div>
              <div className="compat-score"><span>87%</span><small>ALIGNED</small></div>
              <div className="person"><div className="avatar avatar-two">M</div><b>Maya</b><small>Culture Alchemist</small></div>
            </div>
            <div className="shared-traits">
              <div><span>Where you click</span><b>Creative obsession</b></div>
              <div><span>Where you stretch</span><b>Planning vs. spontaneity</b></div>
              <div><span>What you should build</span><b>A tiny cultural machine</b></div>
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
            <p>DNA is designed around Vana’s user-owned data layer. Apps request access. You approve each source. Only the insights you choose become part of your shareable identity.</p>
            <div className="privacy-points">
              <span><b>01</b> Source-by-source consent</span>
              <span><b>02</b> Derived traits, not raw history</span>
              <span><b>03</b> Portable, revocable identity</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer shell">
        <div className="footer-brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>DNA</span></div>
        <p>Data, Network, Alignment.<br />Built for the Vana Cup.</p>
        <a href="#top">Back to top ↑</a>
        <div className="footer-bottom"><span>© 2026 DNA</span><span>YOUR CONTEXT · YOUR IDENTITY · YOUR TERMS</span><span>PROTOTYPE 01</span></div>
      </footer>
    </main>
  );
}
