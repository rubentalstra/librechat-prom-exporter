import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { resetConfigForTests } from "../config.js";
import { Balance, Transaction } from "../models/index.js";

import { cardinalityGauges, updateCardinalityMetrics } from "./cardinalityMetrics.js";

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await Balance.deleteMany({});
  await Transaction.deleteMany({});
  cardinalityGauges.balanceCreditsByUser.reset();
  cardinalityGauges.transactionTokenSumByUser.reset();
  delete process.env.EMIT_PER_USER_METRICS;
  delete process.env.ANONYMIZE_EMAIL_LABEL;
  delete process.env.METRICS_USER_ID_SALT;
  resetConfigForTests();
});

async function balanceSeries(): Promise<Map<string, number>> {
  const snapshot = await cardinalityGauges.balanceCreditsByUser.get();
  return new Map(snapshot.values.map((v) => [String(v.labels.id), v.value]));
}

async function tokenSumByUserSeries(): Promise<Map<string, number>> {
  const snapshot = await cardinalityGauges.transactionTokenSumByUser.get();
  return new Map(snapshot.values.map((v) => [String(v.labels.id), v.value]));
}

describe("updateCardinalityMetrics — balanceCreditsByUser", () => {
  it("emits raw tokenCredits for users with a balance and omits users without one", async () => {
    const alice = new mongoose.Types.ObjectId();
    const bob = new mongoose.Types.ObjectId();
    const carol = new mongoose.Types.ObjectId(); // no balance document
    await Balance.create([
      { user: alice, tokenCredits: 50000 },
      { user: bob, tokenCredits: 0 },
    ]);

    process.env.EMIT_PER_USER_METRICS = "true";
    resetConfigForTests();

    await updateCardinalityMetrics();

    const series = await balanceSeries();
    expect(series.size).toBe(2);
    expect(series.get(String(alice))).toBe(50000);
    expect(series.get(String(bob))).toBe(0);
    expect(series.has(String(carol))).toBe(false);
  });

  it("emits no per-user balance series when EMIT_PER_USER_METRICS is disabled", async () => {
    await Balance.create([{ user: new mongoose.Types.ObjectId(), tokenCredits: 12345 }]);

    process.env.EMIT_PER_USER_METRICS = "false";
    resetConfigForTests();

    await updateCardinalityMetrics();

    const series = await balanceSeries();
    expect(series.size).toBe(0);
  });

  it("pseudonymizes the id label when METRICS_USER_ID_SALT is set", async () => {
    const user = new mongoose.Types.ObjectId();
    await Balance.create([{ user, tokenCredits: 777 }]);

    process.env.EMIT_PER_USER_METRICS = "true";
    process.env.METRICS_USER_ID_SALT = "pepper";
    resetConfigForTests();

    await updateCardinalityMetrics();

    const snapshot = await cardinalityGauges.balanceCreditsByUser.get();
    expect(snapshot.values).toHaveLength(1);
    const [only] = snapshot.values;
    expect(String(only.labels.id)).toMatch(/^[a-f0-9]{16}$/);
    expect(String(only.labels.id)).not.toBe(String(user));
    expect(only.value).toBe(777);
  });
});

describe("updateCardinalityMetrics — transactionTokenSumByUser", () => {
  it("sums abs(rawAmount) per user across models/tokenTypes, omitting users with no transactions", async () => {
    const alice = new mongoose.Types.ObjectId();
    const bob = new mongoose.Types.ObjectId();
    const carol = new mongoose.Types.ObjectId(); // no transactions
    await Transaction.create([
      { user: alice, tokenType: "prompt", model: "gpt-4", rawAmount: -100 },
      { user: alice, tokenType: "completion", model: "gpt-4", rawAmount: -50 },
      { user: alice, tokenType: "prompt", model: "claude", rawAmount: -25 },
      { user: bob, tokenType: "prompt", model: "gpt-4", rawAmount: -10 },
    ]);

    process.env.EMIT_PER_USER_METRICS = "true";
    resetConfigForTests();

    await updateCardinalityMetrics();

    const series = await tokenSumByUserSeries();
    expect(series.size).toBe(2);
    expect(series.get(String(alice))).toBe(175);
    expect(series.get(String(bob))).toBe(10);
    expect(series.has(String(carol))).toBe(false);
  });

  it("emits no per-user token sum series when EMIT_PER_USER_METRICS is disabled", async () => {
    await Transaction.create([
      { user: new mongoose.Types.ObjectId(), tokenType: "prompt", model: "gpt-4", rawAmount: -100 },
    ]);

    process.env.EMIT_PER_USER_METRICS = "false";
    resetConfigForTests();

    await updateCardinalityMetrics();

    const series = await tokenSumByUserSeries();
    expect(series.size).toBe(0);
  });
});
