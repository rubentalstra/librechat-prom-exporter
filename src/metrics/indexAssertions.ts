import mongoose from "mongoose";

import { logger } from "../logger.js";

import { advancedGauges } from "./advancedMetrics.js";

const RECOMMENDED_INDEXES: ReadonlyArray<{
  collection: string;
  key: Record<string, 1 | -1>;
  reason: string;
}> = [
  {
    collection: "messages",
    key: { model: 1 },
    reason: "agent message scans (model: /^agent_/), per-model error rate, byModelType facet",
  },
  {
    collection: "transactions",
    key: { createdAt: 1 },
    reason: "c24h / c7d / c30d cost facets",
  },
  {
    collection: "conversations",
    key: { agent_id: 1 },
    reason: "convIdToAgentId join-map build",
  },
  {
    collection: "users",
    key: { provider: 1 },
    reason: "librechat_user_provider_count",
  },
  {
    collection: "users",
    key: { createdAt: 1 },
    reason: "new_users_30d and retention metrics",
  },
  {
    collection: "messages",
    key: { createdAt: 1 },
    reason: "every 30-day window (feedback, MCP, activity, retention, quality)",
  },
  {
    collection: "messages",
    key: { isCreatedByUser: 1, createdAt: -1 },
    reason: "assistant-vs-user message splits across time windows",
  },
  {
    collection: "files",
    key: { user: 1 },
    reason: "file bytes by user-domain after $lookup removal",
  },
  {
    collection: "transactions",
    key: { user: 1 },
    reason: "per-user cost facets",
  },
  {
    collection: "transactions",
    key: { conversationId: 1 },
    reason: "costByAgentAgg $match by convIdToAgentId keys",
  },
];

function keysMatch(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) {
    return false;
  }
  for (const k of ak) {
    if (a[k] !== b[k]) {
      return false;
    }
  }
  return true;
}

export async function assertIndexes(): Promise<void> {
  const log = logger();
  const db = mongoose.connection.db;
  if (!db) {
    log.warn("mongoose connection has no db; skipping index check");
    return;
  }
  for (const rec of RECOMMENDED_INDEXES) {
    try {
      const existing = await db.collection(rec.collection).indexes();
      const found = existing.some((ix) => keysMatch(ix.key, rec.key));
      if (!found) {
        const keyJson = JSON.stringify(rec.key);
        log.warn(
          {
            collection: rec.collection,
            key: rec.key,
            reason: rec.reason,
            createIndex: `db.${rec.collection}.createIndex(${keyJson})`,
          },
          "missing recommended index",
        );
        advancedGauges.exporterMissingIndexes.set({ collection: rec.collection, key: keyJson }, 1);
      }
    } catch (err) {
      log.warn({ collection: rec.collection, err }, "could not inspect collection indexes");
    }
  }
}
