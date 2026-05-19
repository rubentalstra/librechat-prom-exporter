/**
 * Extracts the lowercased domain portion of an email address.
 * Returns "unknown" for empty, non-string, malformed, or `@`-less input,
 * so caller code can rely on a stable string label without per-call guards.
 */
export function extractEmailDomain(
  email: string | null | undefined,
): string {
  if (!email || typeof email !== "string") return "unknown";
  const at = email.indexOf("@");
  if (at <= 0 || at >= email.length - 1) return "unknown";
  return email.slice(at + 1).toLowerCase();
}

/**
 * Parses a boolean-shaped env var. Canonical form is "true" / "false"
 * (documented in .env.example) but we also accept "1", "yes", "on"
 * (and their "0", "no", "off" counterparts) case-insensitively so ops
 * folks aren't surprised by muscle-memory.
 *
 * Returns `defaultValue` if the var is unset or empty.
 */
export function envFlag(name: string, defaultValue = false): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return defaultValue;
  return /^(1|true|yes|on)$/i.test(raw.trim());
}
