import "server-only";

import { createDirectDataController } from "@opendatalabs/vana-sdk/server";

export const DNA_SOURCE = "spotify";
export const DNA_SCOPES = ["spotify.savedTracks"];

let controller: ReturnType<typeof createDirectDataController> | undefined;

function requireEnvironment(name: "VANA_APP_PRIVATE_KEY" | "VANA_APP_URL") {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

export function getVanaController() {
  if (controller) return controller;

  const homepageUrl = new URL(requireEnvironment("VANA_APP_URL"));

  controller = createDirectDataController({
    env: "production",
    network: process.env.VANA_NETWORK === "mainnet" ? "mainnet" : "moksha",
    appPrivateKey: requireEnvironment("VANA_APP_PRIVATE_KEY"),
    app: {
      id: "dna",
      name: "DNA",
      homepageUrl: homepageUrl.origin,
    },
    source: DNA_SOURCE,
    scopes: DNA_SCOPES,
  });

  return controller;
}

export function getReturnUrl() {
  return `${new URL(requireEnvironment("VANA_APP_URL")).origin}/connect/return`;
}
