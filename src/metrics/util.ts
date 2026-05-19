export function extractEmailDomain(
  email: string | null | undefined,
): string {
  if (!email || typeof email !== "string") {
    return "unknown";
  }
  const at = email.indexOf("@");
  if (at <= 0 || at >= email.length - 1) {
    return "unknown";
  }
  return email.slice(at + 1).toLowerCase();
}

// Accepts true/false, 1/0, yes/no, on/off (case-insensitive); anything
// else (or unset) falls back to defaultValue.
export function envFlag(name: string, defaultValue = false): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return defaultValue;
  }
  return /^(1|true|yes|on)$/i.test(raw.trim());
}
