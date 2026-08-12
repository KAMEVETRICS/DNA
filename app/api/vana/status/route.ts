import { NextRequest, NextResponse } from "next/server";

import { getVanaController } from "@/lib/vana";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REQUEST_COOKIE = "dna_vana_request";
const requestIdPattern = /^dcr_[A-Za-z0-9_-]+$/;

export async function GET(request: NextRequest) {
  const requestId = request.nextUrl.searchParams.get("requestId");
  const ownedRequestId = request.cookies.get(REQUEST_COOKIE)?.value;

  if (!requestId || !requestIdPattern.test(requestId)) {
    return NextResponse.json({ error: "Missing or invalid request ID." }, { status: 400 });
  }

  if (ownedRequestId !== requestId) {
    return NextResponse.json({ error: "This approval request belongs to another session." }, { status: 403 });
  }

  try {
    const status = await getVanaController().getAccessRequestStatus(requestId);
    const response = NextResponse.json({ status: status.status });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Vana status check failed", error);
    return NextResponse.json({ error: "DNA could not check the approval status." }, { status: 502 });
  }
}
