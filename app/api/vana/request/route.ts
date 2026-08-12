import { NextRequest, NextResponse } from "next/server";

import { isDnaSourceId } from "@/lib/sources";
import {
  getReturnUrl,
  getVanaController,
  REQUEST_COOKIE,
  SOURCE_COOKIE,
} from "@/lib/vana";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const windowMs = 60_000;
const requestLimits = new Map<string, { count: number; resetsAt: number }>();

function isRateLimited(ip: string) {
  const now = Date.now();
  const current = requestLimits.get(ip);

  if (!current || current.resetsAt <= now) {
    requestLimits.set(ip, { count: 1, resetsAt: now + windowMs });
    return false;
  }

  current.count += 1;
  return current.count > 8;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many connection requests. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  let sourceId = "spotify";
  try {
    const body = (await request.json()) as { source?: string };
    if (body?.source) sourceId = body.source;
  } catch {
    // Empty body defaults to spotify for backwards compatibility.
  }

  if (!isDnaSourceId(sourceId)) {
    return NextResponse.json(
      { error: "Unsupported data source. Choose a listed DNA signal." },
      { status: 400 },
    );
  }

  try {
    const accessRequest = await getVanaController(sourceId).createAccessRequest({
      returnUrl: getReturnUrl(),
    });
    const response = NextResponse.json({
      ...accessRequest,
      source: sourceId,
    });

    const cookieBase = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/api/vana",
      maxAge: 10 * 60,
    };

    response.cookies.set(REQUEST_COOKIE, accessRequest.requestId, cookieBase);
    response.cookies.set(SOURCE_COOKIE, sourceId, cookieBase);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Vana access request failed", { sourceId, error });
    return NextResponse.json(
      {
        error:
          "DNA could not start the Vana approval flow. Confirm mainnet app identity, VANA_APP_URL, and escrow funding.",
      },
      { status: 502 },
    );
  }
}
