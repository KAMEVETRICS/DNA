import { NextRequest, NextResponse } from "next/server";

import { deriveSourceDna, type SourceDnaSignal } from "@/lib/dna-profile";
import { isDnaSourceId, type DnaSourceId } from "@/lib/sources";
import {
  getVanaController,
  REQUEST_COOKIE,
  SOURCE_COOKIE,
  requestIdPattern,
} from "@/lib/vana";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SafeReadResult = {
  scope: string;
  source: DnaSourceId;
  data: SourceDnaSignal;
  payment?: unknown;
};

const completedReads = new Map<string, SafeReadResult>();
const inflightReads = new Map<string, Promise<SafeReadResult>>();

async function readOnce(requestId: string, sourceId: DnaSourceId) {
  const cacheKey = `${sourceId}:${requestId}`;
  const completed = completedReads.get(cacheKey);
  if (completed) return completed;

  const inflight = inflightReads.get(cacheKey);
  if (inflight) return inflight;

  const read = getVanaController(sourceId)
    .readApprovedData({ requestId })
    .then((result) => {
      const safeResult: SafeReadResult = {
        scope: result.scope,
        source: sourceId,
        data: deriveSourceDna(sourceId, result.data, result.scope),
        payment: result.payment,
      };

      completedReads.set(cacheKey, safeResult);
      if (completedReads.size > 200) {
        const oldest = completedReads.keys().next().value;
        if (oldest) completedReads.delete(oldest);
      }
      return safeResult;
    })
    .finally(() => inflightReads.delete(cacheKey));

  inflightReads.set(cacheKey, read);
  return read;
}

export async function GET(request: NextRequest) {
  const requestId = request.nextUrl.searchParams.get("requestId");
  const ownedRequestId = request.cookies.get(REQUEST_COOKIE)?.value;
  const sourceId =
    request.nextUrl.searchParams.get("source") ??
    request.cookies.get(SOURCE_COOKIE)?.value ??
    "";

  if (!requestId || !requestIdPattern.test(requestId)) {
    return NextResponse.json({ error: "Missing or invalid request ID." }, { status: 400 });
  }

  if (ownedRequestId !== requestId) {
    return NextResponse.json(
      { error: "This data request belongs to another session." },
      { status: 403 },
    );
  }

  if (!isDnaSourceId(sourceId)) {
    return NextResponse.json({ error: "Unsupported data source." }, { status: 400 });
  }

  try {
    const result = await readOnce(requestId, sourceId);
    const response = NextResponse.json(result);

    response.cookies.set(REQUEST_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/api/vana",
      maxAge: 0,
    });
    response.cookies.set(SOURCE_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/api/vana",
      maxAge: 0,
    });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    console.error("Vana paid data read failed", { sourceId, error });
    return NextResponse.json(
      {
        error:
          "The approved data could not be read. Confirm the source is synced on the same network (mainnet), and that escrow is funded.",
      },
      { status: 502 },
    );
  }
}
