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
