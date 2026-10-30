import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { cache } from "react";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/session-user";
import { isAdminEmail } from "@/lib/admin";

export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    return await resolveSessionUser(token);
  } catch {
    return null;
  }
});

export const requireUser = async () => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
};

export const requireAdminUser = async () => {
  const user = await requireUser();

  if (!isAdminEmail(user.email)) {
    redirect("/recursos");
  }

  return user;
};
