import crypto from "crypto";

export function extractEmailDomain(email: string | null | undefined): string {
  if (!email || typeof email !== "string") {
    return "unknown";
  }
  const at = email.indexOf("@");
  if (at <= 0 || at >= email.length - 1) {
    return "unknown";
  }
  return email.slice(at + 1).toLowerCase();
}

/**
 * Derive a deterministic, pseudonymous label for a user from their MongoDB
 * document id and a secret salt.
 *
 * When METRICS_USER_ID_SALT is configured the exporter emits a truncated
 * HMAC-SHA256 hex value instead of the raw user email or id.  This prevents
 * anyone with Prometheus /metrics access from cross-referencing the label
 * against the database, while still keeping the time series stable (same user
 * == same label across scrapes).
 */
export function deriveUserLabel(userId: string | unknown, salt: string | undefined): string {
  const id = String(userId).trim();
  if (!salt || id === "" || id === "unknown") {
    return id;
  }
  return crypto.createHmac("sha256", salt).update(id).digest("hex").slice(0, 16);
}
