import { NextResponse } from "next/server";

export function rejectCrossOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  const expected = process.env.VAMZ_DOMAIN ? `https://${process.env.VAMZ_DOMAIN}` : `${url.protocol}//${request.headers.get("host") ?? url.host}`;
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== expected)) {
    return NextResponse.json({ error: "Solicitud de otro origen bloqueada." }, { status: 403 });
  }
  return null;
}
