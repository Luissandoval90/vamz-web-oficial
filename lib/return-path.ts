export function safeReturnPath(value: unknown): string | null {
  return typeof value === "string" &&
    /^\/recurso\/[a-zA-Z0-9-]{1,100}(?:#resenas)?$/.test(value)
    ? value
    : null;
}
