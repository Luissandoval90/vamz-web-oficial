import { rejectCrossOrigin } from "@/lib/request-origin";
import { NextResponse } from "next/server";

import { getSessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;
  const response = NextResponse.json({ success: true });

  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });

  return response;
}
