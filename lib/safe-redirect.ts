/** Only allow redirects to paths on this site (blocks "//evil.com" and "https://…" open redirects). */
export function safeNext(next: string | null | undefined, fallback = "/account") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
