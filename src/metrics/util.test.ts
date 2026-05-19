import { describe, expect, it } from "vitest";

import { extractEmailDomain } from "./util.js";

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
