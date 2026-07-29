import { describe, expect, it } from "vitest";

import { sumCreditsByEmailDomain } from "./advancedMetrics.js";

describe("sumCreditsByEmailDomain", () => {
  it("sums tokenCredits per email domain", () => {
    const userIdToEmail = new Map([
      ["u1", "alice@acme.com"],
      ["u2", "bob@acme.com"],
      ["u3", "carol@other.io"],
    ]);
    const balances = [
      { user: "u1", tokenCredits: 1000 },
      { user: "u2", tokenCredits: 500 },
      { user: "u3", tokenCredits: 250 },
    ];

    const byDomain = new Map(sumCreditsByEmailDomain(balances, userIdToEmail).map((r) => [r.domain, r.credits]));

    expect(byDomain.get("acme.com")).toBe(1500);
    expect(byDomain.get("other.io")).toBe(250);
  });

  it("buckets users with an unmapped id under 'unknown'", () => {
    const balances = [
      { user: "ghost1", tokenCredits: 10 },
      { user: "ghost2", tokenCredits: 5 },
    ];

    expect(sumCreditsByEmailDomain(balances, new Map())).toEqual([{ domain: "unknown", credits: 15 }]);
  });

  it("treats null or undefined tokenCredits as zero", () => {
    const userIdToEmail = new Map([["u1", "a@x.com"]]);
    const balances = [
      { user: "u1", tokenCredits: null },
      { user: "u1", tokenCredits: undefined },
    ];

    expect(sumCreditsByEmailDomain(balances, userIdToEmail)).toEqual([{ domain: "x.com", credits: 0 }]);
  });

  it("returns an empty array when there are no balances", () => {
    expect(sumCreditsByEmailDomain([], new Map())).toEqual([]);
  });
});
