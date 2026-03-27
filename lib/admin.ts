import { getEnv } from "@/lib/env";

const normalizeEmail = (value: string) => value.trim().toLowerCase();

let cachedAdminEmails: Set<string> | null = null;

const getAdminEmails = () => {
  if (!cachedAdminEmails) {
    cachedAdminEmails = new Set(
      getEnv()
        .ADMIN_EMAILS.split(",")
        .map(normalizeEmail)
        .filter(Boolean),
    );
  }

  return cachedAdminEmails;
};

export const isAdminEmail = (email: string) => getAdminEmails().has(normalizeEmail(email));
