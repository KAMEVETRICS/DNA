"use client";

import { useEffect } from "react";
import { useDirectVanaConnect } from "@opendatalabs/vana-sdk/react";

import type { SourceDnaSignal } from "@/lib/dna-profile";
import type { DnaSourceConfig } from "@/lib/sources";

type VanaSourceConnectProps = {
  source: DnaSourceConfig;
  connected: boolean;
  busy?: boolean;
  onBusyChange?: (sourceId: string | null) => void;
  onConnected: (signal: SourceDnaSignal) => void;
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

export function VanaSourceConnect({
  source,
  connected,
  busy = false,
  onBusyChange,
  onConnected,
}: VanaSourceConnectProps) {
  const connect = useDirectVanaConnect<SourceDnaSignal>({
    createRequest: () =>
      jsonFetch("/api/vana/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: source.id }),
      }),
    getStatus: (requestId) =>
      jsonFetch(
        `/api/vana/status?requestId=${encodeURIComponent(requestId)}&source=${encodeURIComponent(source.id)}`,
      ),
    readResult: (requestId) =>
      jsonFetch(
        `/api/vana/data?requestId=${encodeURIComponent(requestId)}&source=${encodeURIComponent(source.id)}`,
      ),
    pollIntervalMs: 1800,
    timeoutMs: 5 * 60 * 1000,
  });

  useEffect(() => {
    const type = connect.state.type;
    if (type === "done") {
      onConnected(connect.state.result.data);
      onBusyChange?.(null);
      return;
    }
    if (type === "creating" || type === "awaiting_approval" || type === "reading") {
      onBusyChange?.(source.id);
      return;
    }
    if (type === "error") {
      onBusyChange?.(null);
    }
  }, [connect.state, onBusyChange, onConnected, source.id]);

  if (connected) {
    return (
      <div className="vana-inline vana-done">
        <span>Verified via Vana</span>
      </div>
    );
  }

  const label = {
    idle: `Connect ${source.name}`,
    creating: "Creating request…",
    awaiting_approval: "Waiting for approval…",
    reading: "Reading approved data…",
    done: `${source.name} verified ✓`,
    error: "Try again",
  }[connect.state.type];

  function handleClick() {
    if (connect.state.type === "error") connect.reset();
    onBusyChange?.(source.id);
    void connect.start();
  }

  const running = ["creating", "awaiting_approval", "reading", "done"].includes(connect.state.type);
  const blocked = busy && !running;

  return (
    <div className={`vana-inline vana-${connect.state.type}`} aria-live="polite">
      <button type="button" onClick={handleClick} disabled={running || blocked}>
        {blocked ? "Wait…" : label}
        <i aria-hidden="true">↗</i>
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
