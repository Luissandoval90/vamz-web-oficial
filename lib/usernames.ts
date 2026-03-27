const normalizeUsername = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-._]+|[-._]+$/g, "")
    .slice(0, 24);

export const getFallbackUsername = (email: string) => {
  const localPart = email.split("@")[0] ?? "usuario";
  return normalizeUsername(localPart) || "usuario";
};

export const getDisplayUsername = (username: string | null | undefined, email: string) =>
  username && username.trim() ? username : getFallbackUsername(email);
