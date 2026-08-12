"use client";

import { useEffect } from "react";
import { useDirectVanaConnect } from "@opendatalabs/vana-sdk/react";

import type { SpotifyDnaSignal } from "@/lib/dna-profile";

type VanaSpotifyConnectProps = {
  onConnected: (signal: SpotifyDnaSignal) => void;
};

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    cache: "no-store",
    credentials: "same-origin",
  });
  const body = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(body.error ?? `Request failed with ${response.status}`);
  }

  return body;
}

export function VanaSpotifyConnect({ onConnected }: VanaSpotifyConnectProps) {
  const connect = useDirectVanaConnect<SpotifyDnaSignal>({
    createRequest: () => jsonFetch("/api/vana/request", { method: "POST" }),
    getStatus: (requestId) =>
      jsonFetch(`/api/vana/status?requestId=${encodeURIComponent(requestId)}`),
    readResult: (requestId) =>
      jsonFetch(`/api/vana/data?requestId=${encodeURIComponent(requestId)}`),
    pollIntervalMs: 1800,
    timeoutMs: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (connect.state.type === "done") onConnected(connect.state.result.data);
  }, [connect.state, onConnected]);

  const label = {
    idle: "Connect Spotify with Vana",
    creating: "Creating private request…",
    awaiting_approval: "Waiting for your approval…",
    reading: "Building your verified signal…",
    done: "Spotify verified ✓",
    error: "Try Spotify again",
  }[connect.state.type];

  function handleClick() {
    if (connect.state.type === "error") connect.reset();
    void connect.start();
  }

  const running = ["creating", "awaiting_approval", "reading", "done"].includes(connect.state.type);

  return (
    <div className={`vana-connect vana-${connect.state.type}`} aria-live="polite">
      <div className="vana-connect-copy">
        <span>LIVE VANA SIGNAL</span>
        <p>Approve saved tracks once. DNA receives aggregate scores—not a public playlist.</p>
      </div>
      <button type="button" onClick={handleClick} disabled={running}>
        {label}<i aria-hidden="true">↗</i>
      </button>

      {connect.state.type === "awaiting_approval" && connect.state.popupBlocked ? (
        <a href={connect.state.request.approvalUrl} target="_blank" rel="noreferrer">
          Open the Vana approval page
        </a>
      ) : null}

      {connect.state.type === "error" ? (
        <p className="vana-error" role="alert">{connect.state.error.message}</p>
      ) : null}
    </div>
  );
}
