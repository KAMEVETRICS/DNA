import { NextRequest, NextResponse } from "next/server";

import { getReturnUrl, getVanaController } from "@/lib/vana";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REQUEST_COOKIE = "dna_vana_request";
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
  return current.count > 5;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many connection requests. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  try {
    const accessRequest = await getVanaController().createAccessRequest({
      returnUrl: getReturnUrl(),
    });
    const response = NextResponse.json(accessRequest);

    response.cookies.set(REQUEST_COOKIE, accessRequest.requestId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/api/vana",
      maxAge: 10 * 60,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Vana access request failed", error);
    return NextResponse.json(
      { error: "DNA could not start the Vana approval flow. Check the app identity configuration." },
      { status: 502 },
    );
  }
}
