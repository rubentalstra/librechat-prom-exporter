import { describe, expect, it } from "vitest";

import { extractEmailDomain, deriveUserLabel } from "./util.js";

describe("extractEmailDomain", () => {
  it("returns 'unknown' for null", () => {
    expect(extractEmailDomain(null)).toBe("unknown");
  });

  it("returns 'unknown' for undefined", () => {
    expect(extractEmailDomain(undefined)).toBe("unknown");
  });

  it("returns 'unknown' for empty string", () => {
    expect(extractEmailDomain("")).toBe("unknown");
  });

  it("returns 'unknown' for string with no @", () => {
    expect(extractEmailDomain("alice")).toBe("unknown");
  });

  it("returns 'unknown' for @ at start", () => {
    expect(extractEmailDomain("@example.com")).toBe("unknown");
  });

  it("returns 'unknown' for @ at end", () => {
    expect(extractEmailDomain("alice@")).toBe("unknown");
  });

  it("lowercases the domain", () => {
    expect(extractEmailDomain("alice@EXAMPLE.COM")).toBe("example.com");
  });

  it("takes everything after the first @", () => {
    expect(extractEmailDomain("a@b@c.com")).toBe("b@c.com");
  });

  it("handles a normal email", () => {
    expect(extractEmailDomain("alice@example.com")).toBe("example.com");
  });
});

describe("deriveUserLabel", () => {
  it("returns raw id when salt is undefined", () => {
    expect(deriveUserLabel("user123", undefined)).toBe("user123");
  });

  it("returns raw id when userId is empty", () => {
    expect(deriveUserLabel("", "salty")).toBe("");
  });

  it("returns raw id when userId is 'unknown'", () => {
    expect(deriveUserLabel("unknown", "salty")).toBe("unknown");
  });

  it("returns a deterministic 16-char hex hash when salt is set", () => {
    const result = deriveUserLabel("user123", "salty");
    expect(result).toHaveLength(16);
    expect(result).toMatch(/^[a-f0-9]{16}$/);
  });

  it("returns the same hash for the same input on repeated calls", () => {
    expect(deriveUserLabel("abc", "salt")).toBe(deriveUserLabel("abc", "salt"));
  });

  it("returns different hashes for different user ids with same salt", () => {
    expect(deriveUserLabel("userA", "salt")).not.toBe(deriveUserLabel("userB", "salt"));
  });

  it("returns different hashes for same user id with different salts", () => {
    expect(deriveUserLabel("userA", "salt1")).not.toBe(deriveUserLabel("userA", "salt2"));
  });

  it("coerces unknown-ish input types to string", () => {
    expect(deriveUserLabel(42 as unknown as string, "salt")).toBe(deriveUserLabel("42", "salt"));
  });
});
