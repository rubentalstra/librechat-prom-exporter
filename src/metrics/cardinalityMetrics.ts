import client from "prom-client";

import { getConfig } from "../config.js";
import { Agent, Balance, Message, Transaction, User } from "../models/index.js";

import { deriveUserLabel } from "./util.js";

/**
 * Cardinality metrics are advanced metrics whose label sets are unbounded in
 * series count (currently: per-user gauges labeled with `id`). They are
 * kept in a separate module so operators can reason about (and gate) their
 * cost independently from the rest of the advanced tier.
 *
 * These gauges have their own scrape loop driven by
 * `CARDINALITY_REFRESH_INTERVAL`, and values are only emitted when
 * `EMIT_PER_USER_METRICS=true`. When the gate is off,
 * `updateCardinalityMetrics` is a no-op (no Mongo queries are issued) and
 * any previously-emitted series are cleared.
 */
export function emitPerUser(): boolean {
  return getConfig().EMIT_PER_USER_METRICS;
}

/**
 * When true (default), the per-user cardinality gauges use the user's
 * Mongo `_id` (ObjectId string) as the `id` label value. When false, the
 * `id` label carries the user's email address. The label name is always
 * `id` so it fits both representations.
 *
 * Set `ANONYMIZE_EMAIL_LABEL=false` to expose real email addresses (e.g.
 * for small internal deployments where per-user dashboards by email are
 * desired).
 */
function anonymizeEmailLabel(): boolean {
  return getConfig().ANONYMIZE_EMAIL_LABEL;
}

export const cardinalityGauges = {
  // Total transaction cost in USD per user.
  transactionCostByUser: new client.Gauge({
    name: "librechat_transaction_cost_by_user",
    help: "Total transaction cost in USD grouped by user (id = Mongo _id by default, email when ANONYMIZE_EMAIL_LABEL=false, or HMAC-SHA256 hex when METRICS_USER_ID_SALT is set)",
    labelNames: ["id"],
  }),

  // Sum of tokens (absolute rawAmount) per model and user.
  transactionTokenSumByModelUser: new client.Gauge({
    name: "librechat_transaction_token_sum_by_model_user",
    help: "Sum of tokens (absolute rawAmount) per model and user (id = Mongo _id by default, email when ANONYMIZE_EMAIL_LABEL=false, or HMAC-SHA256 hex when METRICS_USER_ID_SALT is set)",
    labelNames: ["model", "tokenType", "id"],
  }),

  // Sum of tokens (absolute rawAmount) per user, with model/tokenType
  // collapsed away. Low-cardinality companion to transactionTokenSumByModelUser
  // (one series per user instead of per user*model*tokenType) — use this one
  // whenever only the per-user total is needed, since aggregating the
  // model/tokenType-crossed metric at query time is expensive at high user
  // counts.
  transactionTokenSumByUser: new client.Gauge({
    name: "librechat_transaction_token_sum_by_user",
    help: "Sum of tokens (absolute rawAmount) per user, across all models/tokenTypes (id = Mongo _id by default, email when ANONYMIZE_EMAIL_LABEL=false, or HMAC-SHA256 hex when METRICS_USER_ID_SALT is set)",
    labelNames: ["id"],
  }),

  // Agent usage count per (agent, user) pair.
  agentUsageByUserCount: new client.Gauge({
    name: "librechat_agent_usage_by_user_count",
    help: "Usage count for each agent grouped by user (id = Mongo _id by default, email when ANONYMIZE_EMAIL_LABEL=false, or HMAC-SHA256 hex when METRICS_USER_ID_SALT is set)",
    labelNames: ["agent", "id"],
  }),

  // Current balance (raw tokenCredits) per user. Only users with a Balance
  // document produce a series; a user with a document but zero credits emits
  // 0, while a user with no document at all produces no series.
  balanceCreditsByUser: new client.Gauge({
    name: "librechat_balance_credits_by_user",
    help: "Current balance in raw tokenCredits per user (1e6 tokenCredits = $1 USD; id = Mongo _id by default, email when ANONYMIZE_EMAIL_LABEL=false, or HMAC-SHA256 hex when METRICS_USER_ID_SALT is set)",
    labelNames: ["id"],
  }),
};

function resetAll(): void {
  cardinalityGauges.transactionCostByUser.reset();
  cardinalityGauges.transactionTokenSumByModelUser.reset();
  cardinalityGauges.transactionTokenSumByUser.reset();
  cardinalityGauges.agentUsageByUserCount.reset();
  cardinalityGauges.balanceCreditsByUser.reset();
}

export async function updateCardinalityMetrics(): Promise<void> {
  // Gated. When disabled the scrape is a complete no-op — no Mongo queries
  // are issued. Existing series (if any) are cleared so toggling the flag
  // off is observable on the next scrape.
  if (!emitPerUser()) {
    resetAll();
    return;
  }

  // --- User map (mongo _id -> label) ---
  // The label name is always `id` (so it fits both shapes), but the value
  // is either the user's Mongo `_id` (anonymized, default) or the actual
  // email address depending on `ANONYMIZE_EMAIL_LABEL`. In the anonymize
  // path the value is just `String(row._id)` from each aggregation row, so
  // no users-collection scan is needed.
  const anonymize = anonymizeEmailLabel();
  const userIdToEmail: Map<string, string> = new Map();
  if (!anonymize) {
    const userDocs = await User.find({}, { email: 1 }).lean();
    for (const u of userDocs) {
      userIdToEmail.set(String(u._id), (u.email as string) || "unknown");
    }
  }

  // --- Transaction-derived: cost by user, tokens by (model, tokenType, user) ---
  // Single $facet to avoid scanning Transactions twice.
  const transactionAggPromise: Promise<
    Array<{
      byUser: Array<{ _id: unknown; cost: number }>;
      byModelUser: Array<{
        _id: { model: string; user: unknown; tokenType: string };
        tokens: number;
      }>;
      byUserTokens: Array<{ _id: unknown; tokens: number }>;
    }>
  > = Transaction.aggregate(
    [
      {
        $project: {
          user: 1,
          model: 1,
          tokenType: 1,
          rawAmount: 1,
          tokenValue: 1,
          createdAt: 1,
        },
      },
      { $addFields: { costUSD: { $divide: [{ $abs: "$tokenValue" }, 1e6] } } },
      {
        $facet: {
          byUser: [{ $group: { _id: "$user", cost: { $sum: "$costUSD" } } }],
          byModelUser: [
            {
              $group: {
                _id: {
                  model: "$model",
                  user: "$user",
                  tokenType: "$tokenType",
                },
                tokens: { $sum: { $abs: "$rawAmount" } },
              },
            },
          ],
          byUserTokens: [{ $group: { _id: "$user", tokens: { $sum: { $abs: "$rawAmount" } } } }],
        },
      },
    ],
    { allowDiskUse: true },
  );

  // --- Message-derived: agent usage by user ---
  const agentUsageByUserAggPromise: Promise<
    Array<{
      _id: { model: string; user: string };
      count: number;
    }>
  > = Message.aggregate(
    [
      { $match: { model: { $regex: /^agent_/ } } },
      {
        $group: {
          _id: { model: "$model", user: "$user" },
          count: { $sum: 1 },
        },
      },
    ],
    { allowDiskUse: true },
  );

  // --- Balance-derived: current tokenCredits per user ---
  // A single lean read of the (small, one-doc-per-user) balances collection.
  // Users without a Balance document are naturally absent from the result.
  const balanceDocsPromise: Promise<Array<{ user: unknown; tokenCredits?: number | null }>> = Balance.find(
    {},
    { user: 1, tokenCredits: 1 },
  ).lean();

  const [transactionAgg, agentUsageByUserAgg, balanceDocs] = await Promise.all([
    transactionAggPromise,
    agentUsageByUserAggPromise,
    balanceDocsPromise,
  ]);

  const byUser = transactionAgg[0]?.byUser || [];
  const byModelUser = transactionAgg[0]?.byModelUser || [];
  const byUserTokens = transactionAgg[0]?.byUserTokens || [];

  // Look up display names for the agents present in the result so labels
  // match what the advanced tier emits for `librechat_agent_usage_count`.
  const agentIds = Array.from(new Set(agentUsageByUserAgg.map((row) => row._id.model)));
  const agents =
    agentIds.length > 0 ? ((await Agent.find({ id: { $in: agentIds } })) as Array<{ id: string; name?: string }>) : [];
  const agentMap: Map<string, string> = new Map();
  for (const a of agents) {
    agentMap.set(a.id, a.name ? a.name : a.id);
  }

  // --- Emit ---
  resetAll();

  const salt = getConfig().METRICS_USER_ID_SALT;
  const labelFor = (userId: string): string =>
    salt ? deriveUserLabel(userId, salt) : anonymize ? userId : userIdToEmail.get(userId) || "unknown";

  for (const row of byUser) {
    cardinalityGauges.transactionCostByUser.set({ id: labelFor(String(row._id)) }, row.cost);
  }

  for (const row of byUserTokens) {
    cardinalityGauges.transactionTokenSumByUser.set({ id: labelFor(String(row._id)) }, row.tokens);
  }

  for (const row of byModelUser) {
    cardinalityGauges.transactionTokenSumByModelUser.set(
      { model: row._id.model, tokenType: row._id.tokenType, id: labelFor(String(row._id.user)) },
      row.tokens,
    );
  }

  for (const row of agentUsageByUserAgg) {
    const agent = agentMap.get(row._id.model);
    if (!agent) {
      continue;
    }
    cardinalityGauges.agentUsageByUserCount.set({ agent, id: labelFor(String(row._id.user)) }, row.count);
  }

  for (const row of balanceDocs) {
    cardinalityGauges.balanceCreditsByUser.set({ id: labelFor(String(row.user)) }, row.tokenCredits ?? 0);
  }
}
