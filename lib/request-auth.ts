import type { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

export const getRequestUser = async (request: NextRequest) => {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
};

export const getRequestAdmin = async (
  request: NextRequest,
  user?: Awaited<ReturnType<typeof getRequestUser>> | null,
) => {
  const currentUser = user ?? (await getRequestUser(request));

  if (!currentUser || !isAdminEmail(currentUser.email)) {
    return null;
  }

  return currentUser;
};
