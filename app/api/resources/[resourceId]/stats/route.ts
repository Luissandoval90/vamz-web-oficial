import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db";
import { resources } from "@/db/schema";
import { rejectCrossOrigin } from "@/lib/request-origin";
import { limitPublicAction } from "@/lib/auth-rate-limit";
import {
  getVisitor,
  recordResourceEvent,
  getResourceSummary,
  VISITOR_COOKIE,
  visitorCookieOptions,
} from "@/lib/resource-engagement";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> },
) {
  const denied =
    rejectCrossOrigin(request) ??
    (await limitPublicAction(request, "resource-view", 90, 600));
  if (denied) return denied;
  const { resourceId } = await params;
  const [resource] = await getDb()
    .select({ id: resources.id })
    .from(resources)
    .where(and(eq(resources.id, resourceId), eq(resources.isPublished, true)))
    .limit(1);
  if (!resource)
    return NextResponse.json(
      { error: "Recurso no encontrado." },
      { status: 404 },
    );
  if (
    /bot|crawler|spider|Lighthouse|HeadlessChrome/i.test(
      request.headers.get("user-agent") ?? "",
    ) ||
    request.headers.get("purpose") === "prefetch"
  ) {
    return NextResponse.json(await getResourceSummary(resourceId), {
      headers: { "Cache-Control": "no-store" },
    });
  }
  const visitor = getVisitor(request);
  const summary = await recordResourceEvent(resourceId, "view", visitor.id);
  const response = NextResponse.json(summary, {
    headers: { "Cache-Control": "no-store" },
  });
  if (visitor.fresh)
    response.cookies.set(VISITOR_COOKIE, visitor.id, visitorCookieOptions);
  return response;
}
