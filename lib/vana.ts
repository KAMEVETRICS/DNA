import "server-only";

import { createDirectDataController, type DirectDataController } from "@opendatalabs/vana-sdk/server";

import { getDnaSource, isDnaSourceId, type DnaSourceId } from "@/lib/sources";

const controllers = new Map<DnaSourceId, DirectDataController>();

function requireEnvironment(name: "VANA_APP_PRIVATE_KEY" | "VANA_APP_URL") {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

/** Cup scoring requires mainnet. Override with VANA_NETWORK=moksha for local testnet only. */
export function getVanaNetwork(): "mainnet" | "moksha" {
  return process.env.VANA_NETWORK === "moksha" ? "moksha" : "mainnet";
}

export function getVanaController(sourceId: string): DirectDataController {
  if (!isDnaSourceId(sourceId)) {
    throw new Error(`Unsupported DNA source: ${sourceId}`);
  }

  const cached = controllers.get(sourceId);
  if (cached) return cached;

  const config = getDnaSource(sourceId);
  const homepageUrl = new URL(requireEnvironment("VANA_APP_URL"));

  const controller = createDirectDataController({
    env: "production",
    network: getVanaNetwork(),
    appPrivateKey: requireEnvironment("VANA_APP_PRIVATE_KEY"),
    app: {
      id: "dna",
      name: "DNA",
      homepageUrl: homepageUrl.origin,
    },
    source: config.source,
    scopes: config.scopes,
  });

  controllers.set(sourceId, controller);
  return controller;
}

export function getReturnUrl() {
  return `${new URL(requireEnvironment("VANA_APP_URL")).origin}/connect/return`;
}

export const REQUEST_COOKIE = "dna_vana_request";
export const SOURCE_COOKIE = "dna_vana_source";
export const requestIdPattern = /^dcr_[A-Za-z0-9_-]+$/;
