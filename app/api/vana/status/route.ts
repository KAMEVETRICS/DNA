import { NextRequest, NextResponse } from "next/server";

import { isDnaSourceId } from "@/lib/sources";
import {
  getVanaController,
  REQUEST_COOKIE,
  SOURCE_COOKIE,
  requestIdPattern,
} from "@/lib/vana";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
      { error: "This approval request belongs to another session." },
      { status: 403 },
    );
  }

  if (!isDnaSourceId(sourceId)) {
    return NextResponse.json({ error: "Unsupported data source." }, { status: 400 });
  }

  try {
    const status = await getVanaController(sourceId).getAccessRequestStatus(requestId);
    const response = NextResponse.json({ status: status.status, source: sourceId });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Vana status check failed", { sourceId, error });
    return NextResponse.json({ error: "DNA could not check the approval status." }, { status: 502 });
  }
}
