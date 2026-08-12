import { NextRequest, NextResponse } from "next/server";

import { deriveSpotifyDna, type SpotifyDnaSignal } from "@/lib/dna-profile";
import { getVanaController } from "@/lib/vana";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REQUEST_COOKIE = "dna_vana_request";
const requestIdPattern = /^dcr_[A-Za-z0-9_-]+$/;
type SafeReadResult = {
  scope: string;
  data: SpotifyDnaSignal;
  payment?: unknown;
};

const completedReads = new Map<string, SafeReadResult>();
const inflightReads = new Map<string, Promise<SafeReadResult>>();

async function readOnce(requestId: string) {
  const completed = completedReads.get(requestId);
  if (completed) return completed;

  const inflight = inflightReads.get(requestId);
  if (inflight) return inflight;

  const read = getVanaController()
    .readApprovedData({ requestId })
    .then((result) => {
      const safeResult: SafeReadResult = {
        scope: result.scope,
        data: deriveSpotifyDna(result.data),
        payment: result.payment,
      };

      completedReads.set(requestId, safeResult);
      if (completedReads.size > 100) {
        const oldest = completedReads.keys().next().value;
        if (oldest) completedReads.delete(oldest);
      }
      return safeResult;
    })
    .finally(() => inflightReads.delete(requestId));

  inflightReads.set(requestId, read);
  return read;
}

export async function GET(request: NextRequest) {
  const requestId = request.nextUrl.searchParams.get("requestId");
  const ownedRequestId = request.cookies.get(REQUEST_COOKIE)?.value;

  if (!requestId || !requestIdPattern.test(requestId)) {
    return NextResponse.json({ error: "Missing or invalid request ID." }, { status: 400 });
  }

  if (ownedRequestId !== requestId) {
    return NextResponse.json({ error: "This data request belongs to another session." }, { status: 403 });
  }

  try {
    const result = await readOnce(requestId);
    const response = NextResponse.json(result);

    response.cookies.set(REQUEST_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/api/vana",
      maxAge: 0,
    });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    console.error("Vana paid data read failed", error);
    return NextResponse.json(
      { error: "The approved data could not be read. Confirm the source is synced and escrow is finalized." },
      { status: 502 },
    );
  }
}
