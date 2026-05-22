import client from "prom-client";

import { getConfig } from "../config.js";
import { logger } from "../logger.js";
import {
  Message,
  Banner,
  File,
  Agent,
  User,
  Session,
  PromptGroup,
  Prompt,
  ToolCall,
  Conversation,
  ConversationTag,
  SharedLink,
  Transaction,
  Action,
} from "../models/index.js";

import { extractEmailDomain } from "./util.js";

// Per-user `email`-labeled metrics live in `cardinalityGauges` (see
// ./cardinalityMetrics.ts) and are emitted by their own scrape loop on
// `CARDINALITY_REFRESH_INTERVAL`. The advanced scrape no longer touches
// them. Domain-level (`*_by_email_domain`) metrics defined below remain
// on regardless and are safe by default.

export const advancedGauges = {
  // Message metrics
  messageTokenSum: new client.Gauge({
    name: "librechat_message_token_sum",
    help: "Sum of tokenCount for all messages",
  }),
  messageTokenAvg: new client.Gauge({
    name: "librechat_message_token_avg",
    help: "Average tokenCount for messages",
  }),
  errorMessageCount: new client.Gauge({
    name: "librechat_error_message_count",
    help: "Count of messages with error",
  }),
  messageWithAttachmentsCount: new client.Gauge({
    name: "librechat_message_with_attachments_count",
    help: "Count of messages with attachments",
  }),
  messagePluginUsagePercent: new client.Gauge({
    name: "librechat_message_plugin_usage_percent",
    help: "Percentage of messages that use a plugin",
  }),

  // Feedback metrics
  messageFeedbackThumbsUpCount: new client.Gauge({
    name: "librechat_message_feedback_thumbs_up_count",
    help: "Count of messages with thumbs up feedback",
    labelNames: ["tag", "model"],
  }),
  messageFeedbackThumbsDownCount: new client.Gauge({
    name: "librechat_message_feedback_thumbs_down_count",
    help: "Count of messages with thumbs down feedback",
    labelNames: ["tag", "model"],
  }),
  messageFeedbackThumbsUpTotal: new client.Gauge({
    name: "librechat_message_feedback_thumbs_up_total",
    help: "Total count of messages with thumbs up feedback",
  }),
  messageFeedbackThumbsDownTotal: new client.Gauge({
    name: "librechat_message_feedback_thumbs_down_total",
    help: "Total count of messages with thumbs down feedback",
  }),
  feedbackThumbsUpPercentByModel30d: new client.Gauge({
    name: "librechat_feedback_thumbs_up_percent_by_model_30d",
    help: "Percentage of messages with thumbs up feedback per model (last 30 days)",
    labelNames: ["model"],
  }),
  feedbackThumbsDownPercentByModel30d: new client.Gauge({
    name: "librechat_feedback_thumbs_down_percent_by_model_30d",
    help: "Percentage of messages with thumbs down feedback per model (last 30 days)",
    labelNames: ["model"],
  }),
  feedbackThumbsUpPercentByAgent30d: new client.Gauge({
    name: "librechat_feedback_thumbs_up_percent_by_agent_30d",
    help: "Percentage of messages with thumbs up feedback per agent (last 30 days)",
    labelNames: ["agent"],
  }),
  feedbackThumbsDownPercentByAgent30d: new client.Gauge({
    name: "librechat_feedback_thumbs_down_percent_by_agent_30d",
    help: "Percentage of messages with thumbs down feedback per agent (last 30 days)",
    labelNames: ["agent"],
  }),
  feedbackEngagementRate30d: new client.Gauge({
    name: "librechat_feedback_engagement_rate_30d",
    help: "Percentage of assistant messages (last 30 days) that received any feedback",
  }),
  netSatisfactionByModel30d: new client.Gauge({
    name: "librechat_net_satisfaction_by_model_30d",
    help: "Net satisfaction score per model (last 30 days): (thumbsUp - thumbsDown) / total * 100",
    labelNames: ["model"],
  }),
  netSatisfactionByAgent30d: new client.Gauge({
    name: "librechat_net_satisfaction_by_agent_30d",
    help: "Net satisfaction score per agent (last 30 days): (thumbsUp - thumbsDown) / total * 100",
    labelNames: ["agent"],
  }),

  // Banner metrics
  activeBannerCount: new client.Gauge({
    name: "librechat_active_banner_count",
    help: "Count of banners currently active",
  }),

  // File metrics
  fileTotalBytes: new client.Gauge({
    name: "librechat_file_total_bytes",
    help: "Total bytes of all files",
  }),
  fileAvgBytes: new client.Gauge({
    name: "librechat_file_avg_bytes",
    help: "Average file size in bytes",
  }),

  // User metrics
  userProviderCount: new client.Gauge({
    name: "librechat_user_provider_count",
    help: "Count of users by provider",
    labelNames: ["provider"],
  }),
  activeUserCount: new client.Gauge({
    name: "librechat_active_users",
    help: "Number of active users within the last 5 minutes",
  }),
  activeUserCountByDomain: new client.Gauge({
    name: "librechat_active_users_by_email_domain",
    help: "Number of active users within the last 5 minutes grouped by email domain",
    labelNames: ["email_domain"],
  }),

  userCountByDomain: new client.Gauge({
    name: "librechat_user_count_by_email_domain",
    help: "Number of users grouped by email domain",
    labelNames: ["email_domain"],
  }),
  userPercentByDomain30d: new client.Gauge({
    name: "librechat_user_percent_by_email_domain_30d",
    help: "Percentage of active users by email domain (last 30 days)",
    labelNames: ["email_domain"],
  }),

  // User in messages metrics
  uniqueUserCount: new client.Gauge({
    name: "librechat_unique_users_count",
    help: "Number of unique users across all messages",
  }),
  uniqueUserCount1d: new client.Gauge({
    name: "librechat_unique_users_count_1d",
    help: "Unique users (last 1 day)",
  }),
  uniqueUserCount7d: new client.Gauge({
    name: "librechat_unique_users_count_7d",
    help: "Unique users (last 7 days)",
  }),
  uniqueUserCount30d: new client.Gauge({
    name: "librechat_unique_users_count_30d",
    help: "Unique users (last 30 days)",
  }),
  uniqueUserCount1dByDomain: new client.Gauge({
    name: "librechat_unique_users_count_1d_by_email_domain",
    help: "Unique users (last 1 day) grouped by email domain",
    labelNames: ["email_domain"],
  }),
  uniqueUserCount7dByDomain: new client.Gauge({
    name: "librechat_unique_users_count_7d_by_email_domain",
    help: "Unique users (last 7 days) grouped by email domain",
    labelNames: ["email_domain"],
  }),
  uniqueUserCount30dByDomain: new client.Gauge({
    name: "librechat_unique_users_count_30d_by_email_domain",
    help: "Unique users (last 30 days) grouped by email domain",
    labelNames: ["email_domain"],
  }),

  // Session metrics
  sessionAvgDuration: new client.Gauge({
    name: "librechat_session_avg_duration",
    help: "Average session duration in seconds",
  }),

  // Prompt Group metrics
  promptGroupGenerationsAvg: new client.Gauge({
    name: "librechat_prompt_group_generations_avg",
    help: "Average number of generations in prompt groups",
  }),

  // Prompt metrics
  promptCountByType: new client.Gauge({
    name: "librechat_prompt_count_by_type",
    help: "Count of prompts by type",
    labelNames: ["type"],
  }),

  // Tool Call metrics
  toolCallCountByTool: new client.Gauge({
    name: "librechat_tool_call_count_by_tool",
    help: "Count of tool calls by toolId",
    labelNames: ["toolId"],
  }),

  // Conversation metrics
  conversationMessageAvg: new client.Gauge({
    name: "librechat_conversation_message_avg",
    help: "Average number of messages per conversation",
  }),

  // Transaction cost metrics – recalculated using provided transaction data.
  transactionCostSum: new client.Gauge({
    name: "librechat_transaction_cost_sum",
    help: "Sum of transaction cost in USD by token type",
    labelNames: ["tokenType"],
  }),
  transactionCostAvg: new client.Gauge({
    name: "librechat_transaction_cost_avg",
    help: "Average transaction cost in USD by token type",
    labelNames: ["tokenType"],
  }),
  transactionCostTotalUSD: new client.Gauge({
    name: "librechat_transaction_cost_total_usd",
    help: "Total transaction cost in USD (aggregated over all token types)",
  }),
  transactionCostPerUser: new client.Gauge({
    name: "librechat_transaction_cost_per_user",
    help: "Average transaction cost in USD per user",
  }),
  transactionCostPerModel: new client.Gauge({
    name: "librechat_transaction_cost_per_model",
    help: "Total transaction cost in USD per deployed model",
    labelNames: ["model"],
  }),

  // Transaction token metrics – sum and average of tokens from transactions.
  transactionTokenSum: new client.Gauge({
    name: "librechat_transaction_token_sum",
    help: "Sum of tokens (absolute rawAmount) from all transactions",
  }),
  transactionTokenAvg: new client.Gauge({
    name: "librechat_transaction_token_avg",
    help: "Average tokens (absolute rawAmount) per transaction",
  }),
  transactionTokenSumByModelDomain: new client.Gauge({
    name: "librechat_transaction_token_sum_by_model_email_domain",
    help: "Sum of tokens (absolute rawAmount) per model and user email domain",
    labelNames: ["model", "tokenType", "email_domain"],
  }),
  // `transactionTokenSumByModelUser` moved to cardinalityGauges.

  // Action metrics
  actionCountByType: new client.Gauge({
    name: "librechat_action_count_by_type",
    help: "Count of actions by type",
    labelNames: ["type"],
  }),

  // Deployed models, agents, and assistants metrics
  deployedModelUsageCount: new client.Gauge({
    name: "librechat_model_usage_count",
    help: "Usage count for each deployed model",
    labelNames: ["model"],
  }),
  agentUsageCount: new client.Gauge({
    name: "librechat_agent_usage_count",
    help: "Usage count for each agent",
    labelNames: ["agent"],
  }),
  agentUsageByDomainCount: new client.Gauge({
    name: "librechat_agent_usage_by_email_domain_count",
    help: "Usage count for each agent grouped by user email domain",
    labelNames: ["agent", "email_domain"],
  }),
  // `agentUsageByUserCount` moved to cardinalityGauges.
  assistantUsageCount: new client.Gauge({
    name: "librechat_assistant_usage_count",
    help: "Usage count for each assistant",
    labelNames: ["assistant"],
  }),
  deployedModelNamesCount: new client.Gauge({
    name: "librechat_deployed_model_names_count",
    help: "Total number of distinct deployed model names found in messages",
  }),

  // Adoption rate metrics (1d omitted — equivalent to periodicityDaily)
  adoptionRate7d: new client.Gauge({
    name: "librechat_adoption_rate_7d",
    help: "Percentage of active users (last 7 days) vs total registered users",
  }),
  adoptionRate30d: new client.Gauge({
    name: "librechat_adoption_rate_30d",
    help: "Percentage of active users (last 30 days) vs total registered users",
  }),

  // Usage periodicity metrics
  periodicityDaily: new client.Gauge({
    name: "librechat_periodicity_daily",
    help: "Percentage of registered users active today (last 24h)",
  }),
  periodicityWeekly: new client.Gauge({
    name: "librechat_periodicity_weekly",
    help: "Percentage of registered users active 3+ days in the last 7 days",
  }),
  periodicityMonthly: new client.Gauge({
    name: "librechat_periodicity_monthly",
    help: "Percentage of registered users active 5+ days in the last 30 days",
  }),

  // MCP utilization metrics (30 days)
  mcpToolCallCount30d: new client.Gauge({
    name: "librechat_mcp_tool_call_count_30d",
    help: "Total MCP tool calls in the last 30 days",
  }),
  mcpToolCallCountByTool30d: new client.Gauge({
    name: "librechat_mcp_tool_call_count_by_tool_30d",
    help: "MCP tool calls in the last 30 days by toolId",
    labelNames: ["toolId"],
  }),
  mcpUniqueUserCount30d: new client.Gauge({
    name: "librechat_mcp_unique_users_30d",
    help: "Unique users using MCP tools in the last 30 days",
  }),
  mcpUtilizationPercent30d: new client.Gauge({
    name: "librechat_mcp_utilization_percent_30d",
    help: "Percentage of tool calls that are MCP in the last 30 days",
  }),

  // --- Activity & engagement ---
  messagesTotal24h: new client.Gauge({
    name: "librechat_messages_total_24h",
    help: "Total messages created in the last 24 hours",
  }),
  messagesTotal7d: new client.Gauge({
    name: "librechat_messages_total_7d",
    help: "Total messages created in the last 7 days",
  }),
  messagesTotal30d: new client.Gauge({
    name: "librechat_messages_total_30d",
    help: "Total messages created in the last 30 days",
  }),
  messagesByHourOfDay: new client.Gauge({
    name: "librechat_messages_by_hour_of_day",
    help: "Count of messages bucketed by hour of day (UTC) over the last 30 days",
    labelNames: ["hour"],
  }),
  messagesByWeekday: new client.Gauge({
    name: "librechat_messages_by_weekday",
    help: "Count of messages by weekday (1=Sunday..7=Saturday) over the last 30 days",
    labelNames: ["weekday"],
  }),
  newUsers30d: new client.Gauge({
    name: "librechat_new_users_30d",
    help: "Number of users created in the last 30 days",
  }),
  newConversations24h: new client.Gauge({
    name: "librechat_new_conversations_24h",
    help: "Number of conversations created in the last 24 hours",
  }),
  newConversations7d: new client.Gauge({
    name: "librechat_new_conversations_7d",
    help: "Number of conversations created in the last 7 days",
  }),
  newConversations30d: new client.Gauge({
    name: "librechat_new_conversations_30d",
    help: "Number of conversations created in the last 30 days",
  }),
  userRetentionD7Percent: new client.Gauge({
    name: "librechat_user_retention_d7_percent",
    help: "Percent of registered (>=7d ago) users who were active in the last 7 days",
  }),
  userRetentionD30Percent: new client.Gauge({
    name: "librechat_user_retention_d30_percent",
    help: "Percent of registered (>=30d ago) users who were active in the last 30 days",
  }),
  avgMessagesPerUser30d: new client.Gauge({
    name: "librechat_avg_messages_per_user_30d",
    help: "Average messages per active user in the last 30 days",
  }),
  powerUsersCount30d: new client.Gauge({
    name: "librechat_power_users_count_30d",
    help: "Distribution of users by usage intensity in the last 30 days",
    labelNames: ["tier"],
  }),

  // --- Conversation quality ---
  conversationLengthP50: new client.Gauge({
    name: "librechat_conversation_length_p50",
    help: "P50 of messages per conversation",
  }),
  conversationLengthP90: new client.Gauge({
    name: "librechat_conversation_length_p90",
    help: "P90 of messages per conversation",
  }),
  conversationLengthP95: new client.Gauge({
    name: "librechat_conversation_length_p95",
    help: "P95 of messages per conversation",
  }),
  conversationDurationSecondsAvg: new client.Gauge({
    name: "librechat_conversation_duration_seconds_avg",
    help: "Average conversation duration in seconds (last message - first message)",
  }),
  conversationUnfinishedCount: new client.Gauge({
    name: "librechat_conversation_unfinished_count",
    help: "Count of messages with unfinished=true",
  }),
  messageErrorRateByModel: new client.Gauge({
    name: "librechat_message_error_rate_by_model",
    help: "Percent of messages with error=true per model",
    labelNames: ["model"],
  }),
  messageErrorRate30d: new client.Gauge({
    name: "librechat_message_error_rate_30d",
    help: "Percent of messages (last 30 days) with error=true",
  }),

  // --- Tokens & cost (deeper slicing) ---
  transactionCostByEmailDomain: new client.Gauge({
    name: "librechat_transaction_cost_by_email_domain",
    help: "Total transaction cost in USD grouped by user email domain",
    labelNames: ["email_domain"],
  }),
  // `transactionCostByUser` moved to cardinalityGauges.
  transactionCostByAgent: new client.Gauge({
    name: "librechat_transaction_cost_by_agent",
    help: "Total transaction cost in USD grouped by agent (derived from conversations using the agent)",
    labelNames: ["agent"],
  }),
  transactionCost24h: new client.Gauge({
    name: "librechat_transaction_cost_24h",
    help: "Total transaction cost in USD over the last 24 hours",
  }),
  transactionCost7d: new client.Gauge({
    name: "librechat_transaction_cost_7d",
    help: "Total transaction cost in USD over the last 7 days",
  }),
  transactionCost30d: new client.Gauge({
    name: "librechat_transaction_cost_30d",
    help: "Total transaction cost in USD over the last 30 days",
  }),
  transactionTokenAvgPerMessageByModel: new client.Gauge({
    name: "librechat_transaction_token_avg_per_message_by_model",
    help: "Average tokens (abs rawAmount) per message per model",
    labelNames: ["model"],
  }),
  transactionPromptCompletionRatioByModel: new client.Gauge({
    name: "librechat_transaction_prompt_completion_ratio_by_model",
    help: "Ratio of completion to prompt tokens per model",
    labelNames: ["model"],
  }),
  costPerConversationAvg: new client.Gauge({
    name: "librechat_cost_per_conversation_avg",
    help: "Average transaction cost in USD per conversation",
  }),

  // --- Agents & assistants ---
  agentUniqueUsersCount: new client.Gauge({
    name: "librechat_agent_unique_users_count",
    help: "Distinct users that used each agent (all time)",
    labelNames: ["agent"],
  }),
  agentUniqueUsers30d: new client.Gauge({
    name: "librechat_agent_unique_users_30d",
    help: "Distinct users that used each agent in the last 30 days",
    labelNames: ["agent"],
  }),
  agentCreationCountByDomain: new client.Gauge({
    name: "librechat_agent_creation_count_by_user_domain",
    help: "Number of agents created, grouped by the author user email domain",
    labelNames: ["email_domain"],
  }),
  agentAvgMessagesPerUse: new client.Gauge({
    name: "librechat_agent_avg_messages_per_use",
    help: "Average messages per conversation that used the agent",
    labelNames: ["agent"],
  }),
  agentLastUsedAgeSeconds: new client.Gauge({
    name: "librechat_agent_last_used_age_seconds",
    help: "Seconds since the agent was last used",
    labelNames: ["agent"],
  }),

  // --- Tools & MCP ---
  mcpToolCallByUserDomain30d: new client.Gauge({
    name: "librechat_mcp_tool_call_count_by_user_domain_30d",
    help: "MCP tool calls (30d) grouped by toolId and user email domain",
    labelNames: ["toolId", "email_domain"],
  }),
  mcpUniqueUsersByTool30d: new client.Gauge({
    name: "librechat_mcp_unique_users_by_tool_30d",
    help: "Distinct users per MCP toolId in the last 30 days",
    labelNames: ["toolId"],
  }),
  toolCallAvgLatencySeconds: new client.Gauge({
    name: "librechat_tool_call_avg_latency_seconds",
    help: "Average tool call latency (updatedAt - createdAt) in seconds, per toolId",
    labelNames: ["toolId"],
  }),

  // --- Files & attachments ---
  fileCountByType: new client.Gauge({
    name: "librechat_file_count_by_type",
    help: "Count of files grouped by MIME type",
    labelNames: ["type"],
  }),
  fileBytesByUserDomain: new client.Gauge({
    name: "librechat_file_bytes_by_user_domain",
    help: "Total file bytes grouped by user email domain",
    labelNames: ["email_domain"],
  }),
  fileUploadCount24h: new client.Gauge({
    name: "librechat_file_upload_count_24h",
    help: "Files uploaded in the last 24 hours",
  }),
  fileUploadCount7d: new client.Gauge({
    name: "librechat_file_upload_count_7d",
    help: "Files uploaded in the last 7 days",
  }),
  fileSizeP50: new client.Gauge({
    name: "librechat_file_size_p50_bytes",
    help: "P50 of file size in bytes",
  }),
  fileSizeP95: new client.Gauge({
    name: "librechat_file_size_p95_bytes",
    help: "P95 of file size in bytes",
  }),

  // --- Feedback extensions ---
  feedbackCountByTag: new client.Gauge({
    name: "librechat_feedback_count_by_tag",
    help: "Count of feedback ratings grouped by tag and rating",
    labelNames: ["tag", "rating"],
  }),
  feedbackCountByDomain30d: new client.Gauge({
    name: "librechat_feedback_count_by_domain_30d",
    help: "Count of feedback ratings (30d) grouped by user email domain and rating",
    labelNames: ["email_domain", "rating"],
  }),

  // --- Sessions & auth ---
  sessionActiveCount: new client.Gauge({
    name: "librechat_session_active_count",
    help: "Number of sessions whose expiration is in the future",
  }),
  sessionExpiredCount24h: new client.Gauge({
    name: "librechat_session_expired_count_24h",
    help: "Number of sessions that expired in the last 24 hours",
  }),
  userEmailVerifiedPercent: new client.Gauge({
    name: "librechat_user_email_verified_percent",
    help: "Percent of users with emailVerified=true",
  }),
  userCountByRole: new client.Gauge({
    name: "librechat_user_count_by_role",
    help: "Number of users grouped by role",
    labelNames: ["role"],
  }),

  // --- Prompts library & conversation tags ---
  promptGroupCountByCategory: new client.Gauge({
    name: "librechat_prompt_group_count_by_category",
    help: "Count of prompt groups by category",
    labelNames: ["category"],
  }),
  sharedLinkCount24h: new client.Gauge({
    name: "librechat_shared_link_count_24h",
    help: "Shared links created in the last 24 hours",
  }),
  conversationTagUsageCount: new client.Gauge({
    name: "librechat_conversation_tag_usage_count",
    help: "Usage count per conversation tag (sum of ConversationTag.count grouped by tag)",
    labelNames: ["tag"],
  }),

  // --- Exporter operational ---
  exporterScrapeDurationSeconds: new client.Gauge({
    name: "librechat_exporter_scrape_duration_seconds",
    help: "Duration of the most recent scrape per metric group",
    labelNames: ["metric_group"],
  }),
  exporterScrapeErrorsTotal: new client.Counter({
    name: "librechat_exporter_scrape_errors_total",
    help: "Total number of scrape errors per metric group",
    labelNames: ["metric_group"],
  }),
  exporterLastSuccessfulScrapeTimestamp: new client.Gauge({
    name: "librechat_exporter_last_successful_scrape_timestamp",
    help: "Unix timestamp (seconds) of the last successful scrape per metric group",
    labelNames: ["metric_group"],
  }),
  exporterMongoConnected: new client.Gauge({
    name: "librechat_exporter_mongo_connected",
    help: "1 when mongoose reports a connected state (readyState=1), 0 otherwise",
  }),
  exporterMissingIndexes: new client.Gauge({
    name: "librechat_exporter_missing_indexes",
    help: "1 per recommended MongoDB index that is NOT present on startup (informational; does not block scrapes)",
    labelNames: ["collection", "key"],
  }),
  exporterSectionDurationSeconds: new client.Histogram({
    name: "librechat_exporter_section_duration_seconds",
    help: "Duration of each advanced-scrape section, observed every tick",
    labelNames: ["section"],
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60, 120],
  }),
};

/**
 * Returns the percentage of `numerator` over `denominator`.
 * Returns 0 when denominator is 0 to avoid division-by-zero.
 */
function toPercent(numerator: number, denominator: number): number {
  return denominator > 0 ? (numerator / denominator) * 100 : 0;
}

function getDistinctUsersPipeline(timeFilter: Date) {
  return [{ $match: { createdAt: { $gte: timeFilter } } }, { $group: { _id: "$user" } }];
}

function bucketUserIdsByDomain(
  rows: Array<{ _id: unknown }>,
  userIdToEmail: Map<string, string>,
): Array<{ domain: string; count: number }> {
  const counts: Map<string, number> = new Map();
  for (const row of rows) {
    const email = userIdToEmail.get(String(row._id)) || "unknown";
    const domain = extractEmailDomain(email);
    counts.set(domain, (counts.get(domain) || 0) + 1);
  }
  return Array.from(counts.entries()).map(([domain, count]) => ({ domain, count }));
}

export async function updateAdvancedMetrics(): Promise<void> {
  const log = logger();
  const logTimings = getConfig().LOG_TIMINGS;
  try {
    let __lastMark = Date.now();
    const __startMark = __lastMark;
    const __mark = (label: string): void => {
      const now = Date.now();
      const durationSec = (now - __lastMark) / 1000;
      // Strip trailing parentheticals so dynamic counts in labels
      // (e.g. "(1020 users)") don't explode histogram cardinality.
      const section = label.replace(/\s*\([^)]*\)\s*$/, "");
      advancedGauges.exporterSectionDurationSeconds.observe({ section }, durationSec);
      if (logTimings) {
        const cumulativeSec = (now - __startMark) / 1000;
        log.debug({ section, label, durationSec, cumulativeSec }, "adv-section");
      }
      __lastMark = now;
    };
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Load users once and build an id->email map for in-JS joins (much faster
    // than re-running $lookup against `users` inside every aggregation).
    const userDocs = await User.find({}, { email: 1 }).lean();
    const userIdToEmail: Map<string, string> = new Map();
    for (const u of userDocs) {
      if (u && u._id) {
        userIdToEmail.set(String(u._id), (u.email as string) || "unknown");
      }
    }
    __mark(`User map loaded (${userIdToEmail.size} users)`);

    // Load conversation->agent map once (only conversations with an agent_id)
    // so we can avoid a $lookup against `conversations` in the Cost section.
    const convDocs = await Conversation.find(
      { agent_id: { $exists: true, $ne: null } },
      { conversationId: 1, agent_id: 1 },
    ).lean();
    const convIdToAgentId: Map<string, string> = new Map();
    for (const c of convDocs) {
      if (c && c.conversationId && c.agent_id) {
        convIdToAgentId.set(String(c.conversationId), String(c.agent_id));
      }
    }
    __mark(`Conv->agent map loaded (${convIdToAgentId.size} convs)`);

    // Kick off the heavy Transactions $facet eagerly so it overlaps with the
    // many lighter aggregations that follow. Both the Token-usage and Cost
    // sections later await this same promise instead of re-scanning the
    // collection.
    const costPipelineProjectEarly = [
      { $match: { model: { $nin: [null, "unknown", "UNKNOWN"] } } },
      {
        $project: {
          user: 1,
          conversationId: 1,
          createdAt: 1,
          model: 1,
          tokenType: { $ifNull: ["$tokenType", "unknown"] },
          rawAmount: 1,
          tokenValue: {
            $cond: {
              if: { $ifNull: ["$tokenValue", false] },
              then: "$tokenValue",
              else: {
                $multiply: [{ $abs: "$rawAmount" }, { $ifNull: ["$rate", 1] }],
              },
            },
          },
        },
      },
      { $addFields: { costUSD: { $divide: [{ $abs: "$tokenValue" }, 1e6] } } },
    ];
    const costCombinedAggPromise: Promise<
      Array<{
        c24h: Array<{ total: number }>;
        c7d: Array<{ total: number }>;
        c30d: Array<{ total: number }>;
        byUser: Array<{ _id: unknown; cost: number }>;
        byModelType: Array<{
          model: string;
          tokenType: string;
          tokens: number;
          convs: number;
        }>;
        byModelUser: Array<{
          _id: { model: string; user: unknown; tokenType: string };
          tokens: number;
        }>;
      }>
    > = Transaction.aggregate(
      [
        ...costPipelineProjectEarly,
        {
          $facet: {
            c24h: [
              { $match: { createdAt: { $gte: oneDayAgo } } },
              { $group: { _id: null, total: { $sum: "$costUSD" } } },
            ],
            c7d: [
              { $match: { createdAt: { $gte: sevenDaysAgo } } },
              { $group: { _id: null, total: { $sum: "$costUSD" } } },
            ],
            c30d: [
              { $match: { createdAt: { $gte: thirtyDaysAgo } } },
              { $group: { _id: null, total: { $sum: "$costUSD" } } },
            ],
            byUser: [{ $group: { _id: "$user", cost: { $sum: "$costUSD" } } }],
            byModelType: [
              {
                $group: {
                  _id: {
                    model: "$model",
                    tokenType: "$tokenType",
                    conv: "$conversationId",
                  },
                  tokens: { $sum: { $abs: "$rawAmount" } },
                },
              },
              {
                $group: {
                  _id: { model: "$_id.model", tokenType: "$_id.tokenType" },
                  tokens: { $sum: "$tokens" },
                  convs: { $sum: 1 },
                },
              },
              {
                $project: {
                  _id: 0,
                  model: "$_id.model",
                  tokenType: "$_id.tokenType",
                  tokens: 1,
                  convs: 1,
                },
              },
            ],
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
          },
        },
      ],
      { allowDiskUse: true },
    );

    __mark("Message Metrics (run concurrently)");

    // --- Message Metrics (run concurrently) ---
    const [
      tokenSumAgg,
      tokenAvgAgg,
      errorCount,
      msgWithAttachCount,
      totalMsgCount,
      pluginUsageCount,
      thumbsUpByTagAgg,
      thumbsDownByTagAgg,
    ] = await Promise.all([
      Message.aggregate([{ $group: { _id: null, total: { $sum: "$tokenCount" } } }], { allowDiskUse: true }),
      Message.aggregate([{ $group: { _id: null, avg: { $avg: "$tokenCount" } } }], { allowDiskUse: true }),
      Message.countDocuments({ error: true }),
      Message.countDocuments({ attachments: { $exists: true, $ne: [] } }),
      Message.countDocuments({}),
      Message.countDocuments({ plugin: { $exists: true, $ne: null } }),
      Message.aggregate(
        [
          { $match: { "feedback.rating": "thumbsUp" } },
          {
            $group: {
              _id: {
                tag: { $ifNull: ["$feedback.tag", "no_tag"] },
                model: { $ifNull: ["$model", "unknown"] },
              },
              count: { $sum: 1 },
            },
          },
        ],
        { allowDiskUse: true },
      ),
      Message.aggregate(
        [
          { $match: { "feedback.rating": "thumbsDown" } },
          {
            $group: {
              _id: {
                tag: { $ifNull: ["$feedback.tag", "no_tag"] },
                model: { $ifNull: ["$model", "unknown"] },
              },
              count: { $sum: 1 },
            },
          },
        ],
        { allowDiskUse: true },
      ),
    ]);

    advancedGauges.messageTokenSum.set(tokenSumAgg[0]?.total || 0);
    advancedGauges.messageTokenAvg.set(tokenAvgAgg[0]?.avg || 0);
    advancedGauges.errorMessageCount.set(errorCount);
    advancedGauges.messageWithAttachmentsCount.set(msgWithAttachCount);
    const pluginUsagePercent = toPercent(pluginUsageCount, totalMsgCount);
    advancedGauges.messagePluginUsagePercent.set(pluginUsagePercent);

    // Set feedback totals
    const thumbsUpTotal = thumbsUpByTagAgg.reduce((sum: number, r: { count: number }) => sum + r.count, 0);
    const thumbsDownTotal = thumbsDownByTagAgg.reduce((sum: number, r: { count: number }) => sum + r.count, 0);
    advancedGauges.messageFeedbackThumbsUpTotal.set(thumbsUpTotal);
    advancedGauges.messageFeedbackThumbsDownTotal.set(thumbsDownTotal);

    // Set feedback metrics by tag and model
    advancedGauges.messageFeedbackThumbsUpCount.reset();
    for (const result of thumbsUpByTagAgg) {
      const tag: string = result._id?.tag || "no_tag";
      const model: string = result._id?.model || "unknown";
      advancedGauges.messageFeedbackThumbsUpCount.set({ tag, model }, result.count);
    }

    advancedGauges.messageFeedbackThumbsDownCount.reset();
    for (const result of thumbsDownByTagAgg) {
      const tag: string = result._id?.tag || "no_tag";
      const model: string = result._id?.model || "unknown";
      advancedGauges.messageFeedbackThumbsDownCount.set({ tag, model }, result.count);
    }

    __mark("Banner Metrics");

    // --- Banner Metrics ---
    const activeBanners = await Banner.countDocuments({
      displayFrom: { $lte: now },
      $or: [{ displayTo: null }, { displayTo: { $gte: now } }],
    });
    advancedGauges.activeBannerCount.set(activeBanners);

    __mark("File Metrics");

    // --- File Metrics ---
    const fileBytesAgg = await File.aggregate(
      [
        {
          $group: {
            _id: null,
            totalBytes: { $sum: "$bytes" },
            avgBytes: { $avg: "$bytes" },
          },
        },
      ],
      { allowDiskUse: true },
    );
    advancedGauges.fileTotalBytes.set(fileBytesAgg[0]?.totalBytes || 0);
    advancedGauges.fileAvgBytes.set(fileBytesAgg[0]?.avgBytes || 0);

    __mark("User Metrics");

    // --- User Metrics ---
    const userProviderAgg = await User.aggregate([{ $group: { _id: "$provider", count: { $sum: 1 } } }]);
    advancedGauges.userProviderCount.reset();
    for (const result of userProviderAgg) {
      const provider: string = result._id || "unknown";
      advancedGauges.userProviderCount.set({ provider }, result.count);
    }

    __mark("User Count By Email Domain");

    // --- User Count By Email Domain ---
    const domainCountMap: Map<string, number> = new Map();
    for (const email of userIdToEmail.values()) {
      const email_domain = extractEmailDomain(email);
      if (email_domain === "unknown") {
        continue;
      }
      domainCountMap.set(email_domain, (domainCountMap.get(email_domain) || 0) + 1);
    }

    advancedGauges.userCountByDomain.reset();
    for (const [email_domain, count] of domainCountMap.entries()) {
      advancedGauges.userCountByDomain.set({ email_domain }, count);
    }

    __mark("Active Users in Last 5 Minutes");

    // --- Active Users in Last 5 Minutes ---
    const activeUserAgg = await Message.aggregate([
      { $match: { createdAt: { $gte: fiveMinutesAgo } } },
      { $group: { _id: "$user" } },
      { $count: "activeUsers" },
    ]);
    const activeUsers: number = activeUserAgg.length > 0 ? activeUserAgg[0].activeUsers : 0;
    advancedGauges.activeUserCount.set(activeUsers);

    __mark("Unique Users");

    // --- Unique Users ---
    const [uniqueUsers, totalUserCount] = await Promise.all([Message.distinct("user"), User.countDocuments({})]);
    advancedGauges.uniqueUserCount.set(uniqueUsers.length);

    __mark("Unique Users in Sliding Windows (1, 7 and 30 days)");

    // --- Unique Users in Sliding Windows (1, 7 and 30 days) ---
    const uniqueUsers1d = await Message.distinct("user", {
      createdAt: { $gte: oneDayAgo },
    });
    const uniqueUsers7d = await Message.distinct("user", {
      createdAt: { $gte: sevenDaysAgo },
    });
    const uniqueUsers30d = await Message.distinct("user", {
      createdAt: { $gte: thirtyDaysAgo },
    });

    advancedGauges.uniqueUserCount1d.set(uniqueUsers1d.length);
    advancedGauges.uniqueUserCount7d.set(uniqueUsers7d.length);
    advancedGauges.uniqueUserCount30d.set(uniqueUsers30d.length);

    __mark("Adoption Rates (active users / total users)");

    // --- Adoption Rates (active users / total users) ---
    // Note: 1d adoption rate is identical to periodicityDaily and emitted there.
    advancedGauges.adoptionRate7d.set(toPercent(uniqueUsers7d.length, totalUserCount));
    advancedGauges.adoptionRate30d.set(toPercent(uniqueUsers30d.length, totalUserCount));

    __mark("Usage Periodicity Metrics");

    // --- Usage Periodicity Metrics ---
    // Daily: % of registered users active today
    advancedGauges.periodicityDaily.set(toPercent(uniqueUsers1d.length, totalUserCount));

    // Weekly: % of registered users with 3+ active days in the last 7 days
    // Monthly: % of registered users with 5+ active days in the last 30 days
    const [weeklyPeriodicityAgg, monthlyPeriodicityAgg] = await Promise.all([
      Message.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: {
              user: "$user",
              day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            },
          },
        },
        { $group: { _id: "$_id.user", activeDays: { $sum: 1 } } },
        { $match: { activeDays: { $gte: 3 } } },
        { $count: "count" },
      ]),
      Message.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              user: "$user",
              day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            },
          },
        },
        { $group: { _id: "$_id.user", activeDays: { $sum: 1 } } },
        { $match: { activeDays: { $gte: 5 } } },
        { $count: "count" },
      ]),
    ]);

    const weeklyPeriodicityCount = weeklyPeriodicityAgg[0]?.count || 0;
    const monthlyPeriodicityCount = monthlyPeriodicityAgg[0]?.count || 0;
    advancedGauges.periodicityWeekly.set(toPercent(weeklyPeriodicityCount, totalUserCount));
    advancedGauges.periodicityMonthly.set(toPercent(monthlyPeriodicityCount, totalUserCount));

    __mark("Combined Active/Unique Users by Email Domain (5min, 1d, 7d, 30d)");

    // --- Combined Active/Unique Users by Email Domain (5min, 1d, 7d, 30d) ---
    const usersByDomainResults = await Message.aggregate(
      [
        {
          $facet: {
            active5min: getDistinctUsersPipeline(fiveMinutesAgo),
            unique1d: getDistinctUsersPipeline(oneDayAgo),
            unique7d: getDistinctUsersPipeline(sevenDaysAgo),
            unique30d: getDistinctUsersPipeline(thirtyDaysAgo),
          },
        },
      ],
      { allowDiskUse: true },
    );

    const activeUsersByDomainAgg = bucketUserIdsByDomain(usersByDomainResults[0]?.active5min || [], userIdToEmail);
    const uniqueUsers1dByDomainAgg = bucketUserIdsByDomain(usersByDomainResults[0]?.unique1d || [], userIdToEmail);
    const uniqueUsers7dByDomainAgg = bucketUserIdsByDomain(usersByDomainResults[0]?.unique7d || [], userIdToEmail);
    const uniqueUsers30dByDomainAgg = bucketUserIdsByDomain(usersByDomainResults[0]?.unique30d || [], userIdToEmail);

    advancedGauges.activeUserCountByDomain.reset();
    for (const result of activeUsersByDomainAgg) {
      advancedGauges.activeUserCountByDomain.set({ email_domain: result.domain }, result.count);
    }

    advancedGauges.uniqueUserCount1dByDomain.reset();
    for (const result of uniqueUsers1dByDomainAgg) {
      advancedGauges.uniqueUserCount1dByDomain.set({ email_domain: result.domain }, result.count);
    }

    advancedGauges.uniqueUserCount7dByDomain.reset();
    for (const result of uniqueUsers7dByDomainAgg) {
      advancedGauges.uniqueUserCount7dByDomain.set({ email_domain: result.domain }, result.count);
    }

    advancedGauges.uniqueUserCount30dByDomain.reset();
    for (const result of uniqueUsers30dByDomainAgg) {
      advancedGauges.uniqueUserCount30dByDomain.set({ email_domain: result.domain }, result.count);
    }

    __mark("User Percent By Email Domain (30 days)");

    // --- User Percent By Email Domain (30 days) ---
    const totalUniqueUsers30d = uniqueUsers30dByDomainAgg.reduce(
      (sum: number, r: { count: number }) => sum + r.count,
      0,
    );
    advancedGauges.userPercentByDomain30d.reset();
    for (const result of uniqueUsers30dByDomainAgg) {
      advancedGauges.userPercentByDomain30d.set(
        { email_domain: result.domain },
        toPercent(result.count, totalUniqueUsers30d),
      );
    }

    __mark("Session Metrics");

    // --- Session Metrics ---
    const sessionAgg = await Session.aggregate([
      { $project: { duration: { $subtract: ["$expiration", "$createdAt"] } } },
      { $group: { _id: null, avgDuration: { $avg: "$duration" } } },
    ]);
    advancedGauges.sessionAvgDuration.set((sessionAgg[0]?.avgDuration || 0) / 1000);

    __mark("Prompt Group Metrics");

    // --- Prompt Group Metrics ---
    const promptGroupAgg = await PromptGroup.aggregate([
      { $group: { _id: null, avgGenerations: { $avg: "$numberOfGenerations" } } },
    ]);
    advancedGauges.promptGroupGenerationsAvg.set(promptGroupAgg[0]?.avgGenerations || 0);

    __mark("Prompt Metrics");

    // --- Prompt Metrics ---
    const promptAgg = await Prompt.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]);
    advancedGauges.promptCountByType.reset();
    for (const result of promptAgg) {
      const type: string = result._id || "unknown";
      advancedGauges.promptCountByType.set({ type }, result.count);
    }

    __mark("Tool Call Metrics");

    // --- Tool Call Metrics ---
    const toolCallAgg = await ToolCall.aggregate([{ $group: { _id: "$toolId", count: { $sum: 1 } } }]);
    advancedGauges.toolCallCountByTool.reset();
    for (const result of toolCallAgg) {
      const toolId: string = result._id || "unknown";
      advancedGauges.toolCallCountByTool.set({ toolId }, result.count);
    }

    __mark("Conversation Metrics");

    // --- Conversation Metrics ---
    const convAgg = await Conversation.aggregate([
      { $project: { msgCount: { $size: "$messages" } } },
      { $group: { _id: null, avgMessages: { $avg: "$msgCount" } } },
    ]);
    advancedGauges.conversationMessageAvg.set(convAgg[0]?.avgMessages || 0);

    __mark("Transaction Token Metrics (using aggregation)");

    // --- Transaction Token Metrics (using aggregation) ---
    const tokenAgg = await Transaction.aggregate(
      [
        {
          $group: {
            _id: null,
            tokensSum: { $sum: { $abs: "$rawAmount" } },
            txnCount: { $sum: 1 },
          },
        },
      ],
      { allowDiskUse: true },
    );
    const tokensSum = tokenAgg[0]?.tokensSum || 0;
    const txnCount = tokenAgg[0]?.txnCount || 0;
    const tokenAvg = txnCount > 0 ? tokensSum / txnCount : 0;
    advancedGauges.transactionTokenSum.set(tokensSum);
    advancedGauges.transactionTokenAvg.set(tokenAvg);

    __mark("Transaction Cost Metrics");

    // --- Transaction Cost Metrics ---
    // Compute cost per token type and per model using a single aggregation with $facet.
    const txnCostResults = await Transaction.aggregate(
      [
        {
          $match: {
            model: { $nin: [null, "unknown", "UNKNOWN"] },
          },
        },
        {
          $project: {
            tokenType: { $ifNull: ["$tokenType", "unknown"] },
            effectiveModel: "$model",
            rawAmount: 1,
            rate: { $ifNull: ["$rate", 1] },
            tokenValue: {
              $cond: {
                if: { $ifNull: ["$tokenValue", false] },
                then: "$tokenValue",
                else: {
                  $multiply: [{ $abs: "$rawAmount" }, { $ifNull: ["$rate", 1] }],
                },
              },
            },
          },
        },
        { $addFields: { costUSD: { $divide: [{ $abs: "$tokenValue" }, 1e6] } } },
        {
          $facet: {
            costByType: [
              {
                $group: {
                  _id: "$tokenType",
                  totalCost: { $sum: "$costUSD" },
                  count: { $sum: 1 },
                },
              },
            ],
            costByModel: [
              {
                $group: {
                  _id: "$effectiveModel",
                  totalCost: { $sum: "$costUSD" },
                  count: { $sum: 1 },
                },
              },
            ],
            totalCost: [
              {
                $group: {
                  _id: null,
                  totalCost: { $sum: "$costUSD" },
                },
              },
            ],
          },
        },
      ],
      { allowDiskUse: true },
    );
    const costByType = txnCostResults[0]?.costByType || [];
    const costByModel = txnCostResults[0]?.costByModel || [];
    const totalCost = txnCostResults[0]?.totalCost[0]?.totalCost || 0;

    advancedGauges.transactionCostSum.reset();
    advancedGauges.transactionCostAvg.reset();
    for (const ct of costByType) {
      advancedGauges.transactionCostSum.set({ tokenType: ct._id }, ct.totalCost);
      advancedGauges.transactionCostAvg.set({ tokenType: ct._id }, ct.count > 0 ? ct.totalCost / ct.count : 0);
    }
    advancedGauges.transactionCostTotalUSD.set(totalCost);

    // Cost per user.
    const costPerUser = totalUserCount > 0 ? totalCost / totalUserCount : 0;
    advancedGauges.transactionCostPerUser.set(costPerUser);

    // Cost per deployed model.
    advancedGauges.transactionCostPerModel.reset();
    for (const cm of costByModel) {
      advancedGauges.transactionCostPerModel.set({ model: cm._id }, cm.totalCost);
    }

    __mark("Token usage per model per user / email domain");

    // --- Token usage per model per user / email domain ---
    // Awaits the eagerly-kicked Transactions $facet started after the user-map
    // load (see top of function). The same result is also reused by the Cost
    // section later, so the Transaction collection is only scanned once.
    const costCombinedAggEarly = await costCombinedAggPromise;
    const tokensByModelUserGrouped: Array<{
      _id: { model: string; user: unknown; tokenType: string };
      tokens: number;
    }> = costCombinedAggEarly[0]?.byModelUser || [];
    const tokensByModelUserAgg: Array<{
      model: string;
      tokenType: string;
      email: string | null;
      tokens: number;
    }> = tokensByModelUserGrouped.map((row) => ({
      model: row._id.model,
      tokenType: row._id.tokenType,
      email: userIdToEmail.get(String(row._id.user)) || null,
      tokens: row.tokens,
    }));

    advancedGauges.transactionTokenSumByModelDomain.reset();
    const tokensByModelDomain: Map<string, number> = new Map();
    for (const row of tokensByModelUserAgg) {
      const email = row.email || "unknown";
      const emailDomain = extractEmailDomain(email);

      const domainKey = `${row.model}\u0000${row.tokenType}\u0000${emailDomain}`;
      tokensByModelDomain.set(domainKey, (tokensByModelDomain.get(domainKey) || 0) + row.tokens);
    }
    for (const [key, tokens] of tokensByModelDomain.entries()) {
      const [model = "unknown", tokenType = "unknown", email_domain = "unknown"] = key.split("\u0000");
      advancedGauges.transactionTokenSumByModelDomain.set({ model, tokenType, email_domain }, tokens);
    }

    __mark("Action Metrics");

    // --- Action Metrics ---
    const actionAgg = await Action.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]);
    advancedGauges.actionCountByType.reset();
    for (const result of actionAgg) {
      const type: string = result._id || "unknown";
      advancedGauges.actionCountByType.set({ type }, result.count);
    }

    __mark("Deployed Models / Agents / Assistants Metrics");

    // --- Deployed Models / Agents / Assistants Metrics ---
    const deployedModelsAgg = await Message.aggregate(
      [{ $match: { model: { $ne: null } } }, { $group: { _id: "$model", count: { $sum: 1 } } }],
      { allowDiskUse: true },
    );
    const agentIds = deployedModelsAgg.map((result: { _id: string; count: number }) => result._id);
    const agents = await Agent.find({ id: { $in: agentIds } });
    const agentMap: Map<string, string> = new Map();
    agents.forEach((agent: { id: string; name?: string }) => {
      agentMap.set(agent.id, agent.name ? agent.name : agent.id);
    });

    advancedGauges.deployedModelUsageCount.reset();
    advancedGauges.agentUsageCount.reset();
    advancedGauges.assistantUsageCount.reset();
    advancedGauges.agentUsageByDomainCount.reset();

    for (const result of deployedModelsAgg) {
      const id: string = result._id;
      if (id.startsWith("agent_")) {
        if (agentMap.has(id)) {
          const displayName = agentMap.get(id)!;
          advancedGauges.agentUsageCount.set({ agent: displayName }, result.count);
        }
      } else if (id.startsWith("assistant_")) {
        if (agentMap.has(id)) {
          const displayName = agentMap.get(id)!;
          advancedGauges.assistantUsageCount.set({ assistant: displayName }, result.count);
        }
      } else {
        advancedGauges.deployedModelUsageCount.set({ model: id }, result.count);
      }
    }

    __mark("Agent usage broken down by user email and email domain");

    // --- Agent usage broken down by user email and email domain ---
    const agentUsageByUserAgg: Array<{
      _id: { model: string; user: string };
      count: number;
    }> = await Message.aggregate(
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

    const agentDomainCounts: Map<string, number> = new Map();
    for (const row of agentUsageByUserAgg) {
      const agentId = row._id.model;
      if (!agentMap.has(agentId)) {
        continue;
      }
      const agent = agentMap.get(agentId)!;
      const email = userIdToEmail.get(String(row._id.user)) || "unknown";
      const emailDomain = extractEmailDomain(email);

      const domainKey = `${agent}|${emailDomain}`;
      agentDomainCounts.set(domainKey, (agentDomainCounts.get(domainKey) || 0) + row.count);
    }
    for (const [key, count] of agentDomainCounts.entries()) {
      const sepIdx = key.indexOf("|");
      const agent = key.slice(0, sepIdx);
      const email_domain = key.slice(sepIdx + 1);
      advancedGauges.agentUsageByDomainCount.set({ agent, email_domain }, count);
    }

    __mark("Parallelized: Feedback, Distinct Models, MCP (independent queries)");

    // --- Parallelized: Feedback, Distinct Models, MCP (independent queries) ---
    const [feedbackByModel30dAgg, distinctModelsAgg, toolCallContentAgg] = await Promise.all([
      // Feedback by model/agent (30d) — only assistant messages are eligible
      Message.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
            model: { $ne: null },
            isCreatedByUser: false,
          },
        },
        {
          $group: {
            _id: "$model",
            total: { $sum: 1 },
            thumbsUp: {
              $sum: { $cond: [{ $eq: ["$feedback.rating", "thumbsUp"] }, 1, 0] },
            },
            thumbsDown: {
              $sum: {
                $cond: [{ $eq: ["$feedback.rating", "thumbsDown"] }, 1, 0],
              },
            },
          },
        },
      ]),
      // Distinct deployed model names
      Message.aggregate([{ $match: { model: { $ne: null } } }, { $group: { _id: "$model" } }]),
      // MCP tool call content (30d)
      Message.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
            "content.type": "tool_call",
          },
        },
        { $unwind: "$content" },
        { $match: { "content.type": "tool_call" } },
        {
          $addFields: {
            toolName: {
              $ifNull: ["$content.tool_call.name", { $ifNull: ["$content.tool_call.function.name", "unknown"] }],
            },
          },
        },
        {
          $facet: {
            totalToolCalls: [{ $count: "count" }],
            mcpTotal: [{ $match: { toolName: { $regex: "_mcp_" } } }, { $count: "count" }],
            mcpByTool: [
              { $match: { toolName: { $regex: "_mcp_" } } },
              { $group: { _id: "$toolName", count: { $sum: 1 } } },
            ],
            mcpUniqueUsers: [
              { $match: { toolName: { $regex: "_mcp_" } } },
              { $group: { _id: "$user" } },
              { $count: "count" },
            ],
          },
        },
      ]),
    ]);

    __mark("Feedback Percentage + Net Satisfaction by Model / Agent (30 days)");

    // --- Feedback Percentage + Net Satisfaction by Model / Agent (30 days) ---
    advancedGauges.feedbackThumbsUpPercentByModel30d.reset();
    advancedGauges.feedbackThumbsDownPercentByModel30d.reset();
    advancedGauges.feedbackThumbsUpPercentByAgent30d.reset();
    advancedGauges.feedbackThumbsDownPercentByAgent30d.reset();
    advancedGauges.netSatisfactionByModel30d.reset();
    advancedGauges.netSatisfactionByAgent30d.reset();

    let totalAssistantMessages30d = 0;
    let totalFeedbackMessages30d = 0;

    for (const result of feedbackByModel30dAgg) {
      const id: string = result._id;
      const total: number = result.total;
      if (total === 0) {
        continue;
      }

      totalAssistantMessages30d += total;
      totalFeedbackMessages30d += result.thumbsUp + result.thumbsDown;

      const upPct = toPercent(result.thumbsUp, total);
      const downPct = toPercent(result.thumbsDown, total);
      const netSatisfaction = toPercent(result.thumbsUp - result.thumbsDown, total);

      const entityType = id.split("_")[0];
      switch (entityType) {
        case "agent": {
          const displayName = agentMap.get(id) || id;
          advancedGauges.feedbackThumbsUpPercentByAgent30d.set({ agent: displayName }, upPct);
          advancedGauges.feedbackThumbsDownPercentByAgent30d.set({ agent: displayName }, downPct);
          advancedGauges.netSatisfactionByAgent30d.set({ agent: displayName }, netSatisfaction);
          break;
        }
        case "assistant":
          // add for future assistant metrics
          break;
        // had to be defaults as model have different naming conventions and we want to capture all models even if they don't follow a strict pattern
        default:
          advancedGauges.feedbackThumbsUpPercentByModel30d.set({ model: id }, upPct);
          advancedGauges.feedbackThumbsDownPercentByModel30d.set({ model: id }, downPct);
          advancedGauges.netSatisfactionByModel30d.set({ model: id }, netSatisfaction);
          break;
      }
    }

    // Feedback engagement rate: % of assistant messages that received any feedback
    advancedGauges.feedbackEngagementRate30d.set(toPercent(totalFeedbackMessages30d, totalAssistantMessages30d));

    __mark("Distinct Deployed Model Names");

    // --- Distinct Deployed Model Names ---
    const filteredDistinctModels = distinctModelsAgg.filter((doc: { _id: string }) => {
      const id: string = doc._id;
      return !id.startsWith("agent_") && !id.startsWith("assistant_");
    });
    advancedGauges.deployedModelNamesCount.set(filteredDistinctModels.length);

    __mark("MCP Utilization Metrics (30 days)");

    // --- MCP Utilization Metrics (30 days) ---
    const totalToolCalls30d = toolCallContentAgg[0]?.totalToolCalls[0]?.count || 0;
    const mcpTotal = toolCallContentAgg[0]?.mcpTotal[0]?.count || 0;
    const mcpByTool = toolCallContentAgg[0]?.mcpByTool || [];
    const mcpUsers = toolCallContentAgg[0]?.mcpUniqueUsers[0]?.count || 0;

    advancedGauges.mcpToolCallCount30d.set(mcpTotal);

    advancedGauges.mcpToolCallCountByTool30d.reset();
    for (const result of mcpByTool) {
      advancedGauges.mcpToolCallCountByTool30d.set({ toolId: result._id }, result.count);
    }

    advancedGauges.mcpUniqueUserCount30d.set(mcpUsers);
    advancedGauges.mcpUtilizationPercent30d.set(toPercent(mcpTotal, totalToolCalls30d));

    // ============================================================
    // === Extended metrics (Activity, Quality, Cost, Agents...) ===
    // ============================================================

    __mark("Activity & engagement (parallel)");

    // --- Activity & engagement (parallel) ---
    const [
      msg24h,
      msg7d,
      msg30d,
      msgByHourAgg,
      msgByWeekdayAgg,
      newUsers30dCount,
      newConv24h,
      newConv7d,
      newConv30d,
      registered7dPlus,
      registered30dPlus,
      powerUserAgg,
    ] = await Promise.all([
      Message.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      Message.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Message.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Message.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $hour: "$createdAt" }, count: { $sum: 1 } } },
      ]),
      Message.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dayOfWeek: "$createdAt" }, count: { $sum: 1 } } },
      ]),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Conversation.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      Conversation.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Conversation.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ createdAt: { $lte: sevenDaysAgo } }),
      User.countDocuments({ createdAt: { $lte: thirtyDaysAgo } }),
      Message.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: "$user", msgCount: { $sum: 1 } } },
        {
          $bucket: {
            groupBy: "$msgCount",
            boundaries: [1, 10, 50, Number.MAX_SAFE_INTEGER],
            default: "other",
            output: { count: { $sum: 1 } },
          },
        },
      ]),
    ]);

    advancedGauges.messagesTotal24h.set(msg24h);
    advancedGauges.messagesTotal7d.set(msg7d);
    advancedGauges.messagesTotal30d.set(msg30d);
    advancedGauges.newUsers30d.set(newUsers30dCount);
    advancedGauges.newConversations24h.set(newConv24h);
    advancedGauges.newConversations7d.set(newConv7d);
    advancedGauges.newConversations30d.set(newConv30d);

    advancedGauges.messagesByHourOfDay.reset();
    for (let h = 0; h < 24; h++) {
      advancedGauges.messagesByHourOfDay.set({ hour: String(h) }, 0);
    }
    for (const row of msgByHourAgg) {
      advancedGauges.messagesByHourOfDay.set({ hour: String(row._id) }, row.count);
    }

    advancedGauges.messagesByWeekday.reset();
    for (let w = 1; w <= 7; w++) {
      advancedGauges.messagesByWeekday.set({ weekday: String(w) }, 0);
    }
    for (const row of msgByWeekdayAgg) {
      advancedGauges.messagesByWeekday.set({ weekday: String(row._id) }, row.count);
    }

    // Retention: % registered N days ago who were active in the last N days
    advancedGauges.userRetentionD7Percent.set(toPercent(uniqueUsers7d.length, registered7dPlus));
    advancedGauges.userRetentionD30Percent.set(toPercent(uniqueUsers30d.length, registered30dPlus));

    // Avg messages per active user in 30d
    advancedGauges.avgMessagesPerUser30d.set(uniqueUsers30d.length > 0 ? msg30d / uniqueUsers30d.length : 0);

    // Power user tier buckets
    advancedGauges.powerUsersCount30d.reset();
    const tierLabels: Record<string, string> = {
      "1": "light",
      "10": "medium",
      "50": "heavy",
    };
    for (const row of powerUserAgg) {
      const tier = tierLabels[String(row._id)] || "other";
      advancedGauges.powerUsersCount30d.set({ tier }, row.count);
    }

    __mark("Conversation quality (parallel)");

    // --- Conversation quality (parallel) ---
    const [convLengthPercAgg, convDurationAgg, unfinishedCount, errorByModelAgg, err30dCount] = await Promise.all([
      Conversation.aggregate([
        { $project: { msgCount: { $size: { $ifNull: ["$messages", []] } } } },
        {
          $group: {
            _id: null,
            p: {
              $percentile: {
                p: [0.5, 0.9, 0.95],
                input: "$msgCount",
                method: "approximate",
              },
            },
          },
        },
      ]).catch(() => [] as Array<{ p: number[] }>),
      Message.aggregate([
        {
          $group: {
            _id: "$conversationId",
            firstAt: { $min: "$createdAt" },
            lastAt: { $max: "$createdAt" },
          },
        },
        {
          $project: {
            durationSec: {
              $divide: [{ $subtract: ["$lastAt", "$firstAt"] }, 1000],
            },
          },
        },
        { $group: { _id: null, avg: { $avg: "$durationSec" } } },
      ]),
      Message.countDocuments({ unfinished: true }),
      Message.aggregate([
        {
          $match: {
            model: { $ne: null },
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: "$model",
            total: { $sum: 1 },
            errors: {
              $sum: { $cond: [{ $eq: ["$error", true] }, 1, 0] },
            },
          },
        },
      ]),
      Message.countDocuments({
        error: true,
        createdAt: { $gte: thirtyDaysAgo },
      }),
    ]);

    const convPerc = convLengthPercAgg[0]?.p as number[] | undefined;
    advancedGauges.conversationLengthP50.set(convPerc?.[0] || 0);
    advancedGauges.conversationLengthP90.set(convPerc?.[1] || 0);
    advancedGauges.conversationLengthP95.set(convPerc?.[2] || 0);
    advancedGauges.conversationDurationSecondsAvg.set(convDurationAgg[0]?.avg || 0);
    advancedGauges.conversationUnfinishedCount.set(unfinishedCount);

    advancedGauges.messageErrorRateByModel.reset();
    for (const row of errorByModelAgg) {
      advancedGauges.messageErrorRateByModel.set({ model: row._id }, toPercent(row.errors, row.total));
    }
    advancedGauges.messageErrorRate30d.set(toPercent(err30dCount, msg30d));

    __mark("Cost: total per window + cost/conversation + per-domain/user/agent");

    // --- Cost: total per window + cost/conversation + per-domain/user/agent ---
    const costPipelineProject = [
      { $match: { model: { $nin: [null, "unknown", "UNKNOWN"] } } },
      {
        $project: {
          user: 1,
          conversationId: 1,
          createdAt: 1,
          model: 1,
          tokenType: { $ifNull: ["$tokenType", "unknown"] },
          rawAmount: 1,
          tokenValue: {
            $cond: {
              if: { $ifNull: ["$tokenValue", false] },
              then: "$tokenValue",
              else: {
                $multiply: [{ $abs: "$rawAmount" }, { $ifNull: ["$rate", 1] }],
              },
            },
          },
        },
      },
      { $addFields: { costUSD: { $divide: [{ $abs: "$tokenValue" }, 1e6] } } },
    ];

    const [costCombinedAgg, costByAgentAgg, totalConvCount] = await Promise.all([
      // Reuse the eagerly-kicked Transactions $facet started after user-map
      // load — already awaited in the Token-usage section above. This await
      // returns immediately because the promise is already resolved.
      costCombinedAggPromise,
      // Kept separate from the eager $facet because it's small after we
      // pre-load the conversation->agent map: just group transactions by
      // conversationId for the conversations we know belong to an agent.
      Transaction.aggregate(
        [
          ...costPipelineProject,
          {
            $match: {
              conversationId: {
                $in: Array.from(convIdToAgentId.keys()),
              },
            },
          },
          {
            $group: {
              _id: "$conversationId",
              cost: { $sum: "$costUSD" },
            },
          },
        ],
        { allowDiskUse: true },
      ),
      Conversation.countDocuments({}),
    ]);

    const costByWindowAgg = costCombinedAgg[0];
    const costByDomainUserAgg = costCombinedAgg[0]?.byUser || [];
    const tokensByModelTypeAgg = costCombinedAgg[0]?.byModelType || [];

    advancedGauges.transactionCost24h.set(costByWindowAgg?.c24h[0]?.total || 0);
    advancedGauges.transactionCost7d.set(costByWindowAgg?.c7d[0]?.total || 0);
    advancedGauges.transactionCost30d.set(costByWindowAgg?.c30d[0]?.total || 0);

    advancedGauges.transactionCostByEmailDomain.reset();
    const costByDomainMap: Map<string, number> = new Map();
    for (const row of costByDomainUserAgg) {
      const email = userIdToEmail.get(String(row._id)) || "unknown";
      const domain = extractEmailDomain(email);
      costByDomainMap.set(domain, (costByDomainMap.get(domain) || 0) + row.cost);
    }
    for (const [email_domain, cost] of costByDomainMap.entries()) {
      advancedGauges.transactionCostByEmailDomain.set({ email_domain }, cost);
    }

    // Tokens per message + prompt/completion ratio per model
    const tokensByModelTotal: Map<string, number> = new Map();
    const tokensByModelType: Map<string, Record<string, number>> = new Map();
    const convsByModel: Map<string, number> = new Map();
    for (const row of tokensByModelTypeAgg) {
      const m: string = row.model;
      tokensByModelTotal.set(m, (tokensByModelTotal.get(m) || 0) + row.tokens);
      const byType = tokensByModelType.get(m) || {};
      byType[row.tokenType] = (byType[row.tokenType] || 0) + row.tokens;
      tokensByModelType.set(m, byType);
      convsByModel.set(m, Math.max(convsByModel.get(m) || 0, row.convs));
    }
    advancedGauges.transactionTokenAvgPerMessageByModel.reset();
    advancedGauges.transactionPromptCompletionRatioByModel.reset();
    for (const [m, total] of tokensByModelTotal.entries()) {
      const convs = convsByModel.get(m) || 0;
      advancedGauges.transactionTokenAvgPerMessageByModel.set({ model: m }, convs > 0 ? total / convs : 0);
      const byType = tokensByModelType.get(m) || {};
      const prompt = byType.prompt || 0;
      const completion = byType.completion || 0;
      advancedGauges.transactionPromptCompletionRatioByModel.set({ model: m }, prompt > 0 ? completion / prompt : 0);
    }

    advancedGauges.transactionCostByAgent.reset();
    const costByAgentMap: Map<string, number> = new Map();
    for (const row of costByAgentAgg) {
      const convId: string = String(row._id);
      const agentId = convIdToAgentId.get(convId);
      if (!agentId) {
        continue;
      }
      costByAgentMap.set(agentId, (costByAgentMap.get(agentId) || 0) + row.cost);
    }
    for (const [agentId, cost] of costByAgentMap.entries()) {
      const displayName = agentMap.get(agentId) || agentId;
      advancedGauges.transactionCostByAgent.set({ agent: displayName }, cost);
    }
    advancedGauges.costPerConversationAvg.set(totalConvCount > 0 ? totalCost / totalConvCount : 0);

    __mark("Agents: unique users, last used, avg messages per use, creation by domain");

    // --- Agents: unique users, last used, avg messages per use, creation by domain ---
    // Single $facet over messages matching agent models so the (potentially huge)
    // Message collection is scanned only once instead of 4 separate times.
    const [agentFacetAgg, agentAuthorDocs] = await Promise.all([
      Message.aggregate(
        [
          { $match: { model: { $regex: /^agent_/ } } },
          {
            $facet: {
              uniqueUsersAll: [
                { $group: { _id: { model: "$model", user: "$user" } } },
                { $group: { _id: "$_id.model", users: { $sum: 1 } } },
              ],
              uniqueUsers30d: [
                { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                { $group: { _id: { model: "$model", user: "$user" } } },
                { $group: { _id: "$_id.model", users: { $sum: 1 } } },
              ],
              lastUsed: [{ $group: { _id: "$model", last: { $max: "$createdAt" } } }],
              msgsPerConv: [
                {
                  $group: {
                    _id: { model: "$model", conv: "$conversationId" },
                    msgs: { $sum: 1 },
                  },
                },
                { $group: { _id: "$_id.model", avgMsgs: { $avg: "$msgs" } } },
              ],
            },
          },
        ],
        { allowDiskUse: true },
      ),
      Agent.find({}, { author: 1 }).lean(),
    ]);

    const agentFacet = agentFacetAgg[0] || {
      uniqueUsersAll: [],
      uniqueUsers30d: [],
      lastUsed: [],
      msgsPerConv: [],
    };
    const agentUniqueUsersAllAgg = agentFacet.uniqueUsersAll;
    const agentUniqueUsers30dAgg = agentFacet.uniqueUsers30d;
    const agentLastUsedAgg = agentFacet.lastUsed;
    const agentMsgsPerConvAgg = agentFacet.msgsPerConv;

    advancedGauges.agentUniqueUsersCount.reset();
    for (const row of agentUniqueUsersAllAgg) {
      const name = agentMap.get(row._id);
      if (!name) {
        continue;
      }
      advancedGauges.agentUniqueUsersCount.set({ agent: name }, row.users);
    }
    advancedGauges.agentUniqueUsers30d.reset();
    for (const row of agentUniqueUsers30dAgg) {
      const name = agentMap.get(row._id);
      if (!name) {
        continue;
      }
      advancedGauges.agentUniqueUsers30d.set({ agent: name }, row.users);
    }
    advancedGauges.agentLastUsedAgeSeconds.reset();
    for (const row of agentLastUsedAgg) {
      const name = agentMap.get(row._id);
      if (!name) {
        continue;
      }
      const ageSec = (now.getTime() - new Date(row.last).getTime()) / 1000;
      advancedGauges.agentLastUsedAgeSeconds.set({ agent: name }, ageSec);
    }
    advancedGauges.agentAvgMessagesPerUse.reset();
    for (const row of agentMsgsPerConvAgg) {
      const name = agentMap.get(row._id);
      if (!name) {
        continue;
      }
      advancedGauges.agentAvgMessagesPerUse.set({ agent: name }, row.avgMsgs);
    }
    advancedGauges.agentCreationCountByDomain.reset();
    const agentByDomainMap: Map<string, number> = new Map();
    for (const a of agentAuthorDocs) {
      const email = userIdToEmail.get(String(a.author)) || "unknown";
      const domain = extractEmailDomain(email);
      agentByDomainMap.set(domain, (agentByDomainMap.get(domain) || 0) + 1);
    }
    for (const [email_domain, count] of agentByDomainMap.entries()) {
      advancedGauges.agentCreationCountByDomain.set({ email_domain }, count);
    }

    __mark("MCP per-tool per-domain & unique users + tool call latency");

    // --- MCP per-tool per-domain & unique users + tool call latency ---
    const [mcpByToolDomainAgg, mcpUniqueByToolAgg, toolLatencyAgg] = await Promise.all([
      Message.aggregate(
        [
          {
            $match: {
              createdAt: { $gte: thirtyDaysAgo },
              "content.type": "tool_call",
            },
          },
          { $unwind: "$content" },
          { $match: { "content.type": "tool_call" } },
          {
            $addFields: {
              toolName: {
                $ifNull: ["$content.tool_call.name", { $ifNull: ["$content.tool_call.function.name", "unknown"] }],
              },
            },
          },
          { $match: { toolName: { $regex: "_mcp_" } } },
          {
            $group: {
              _id: { toolId: "$toolName", user: "$user" },
              count: { $sum: 1 },
            },
          },
        ],
        { allowDiskUse: true },
      ),
      Message.aggregate(
        [
          {
            $match: {
              createdAt: { $gte: thirtyDaysAgo },
              "content.type": "tool_call",
            },
          },
          { $unwind: "$content" },
          { $match: { "content.type": "tool_call" } },
          {
            $addFields: {
              toolName: {
                $ifNull: ["$content.tool_call.name", { $ifNull: ["$content.tool_call.function.name", "unknown"] }],
              },
            },
          },
          { $match: { toolName: { $regex: "_mcp_" } } },
          { $group: { _id: { tool: "$toolName", user: "$user" } } },
          { $group: { _id: "$_id.tool", users: { $sum: 1 } } },
        ],
        { allowDiskUse: true },
      ),
      ToolCall.aggregate([
        {
          $project: {
            toolId: 1,
            latencyMs: { $subtract: ["$updatedAt", "$createdAt"] },
          },
        },
        {
          $group: {
            _id: "$toolId",
            avgLatencyMs: { $avg: "$latencyMs" },
          },
        },
      ]),
    ]);

    advancedGauges.mcpToolCallByUserDomain30d.reset();
    const mcpDomainAcc: Map<string, number> = new Map();
    for (const row of mcpByToolDomainAgg) {
      const toolId: string = row._id?.toolId || "unknown";
      const email = userIdToEmail.get(String(row._id?.user)) || "unknown";
      const email_domain = extractEmailDomain(email);
      const key = `${toolId}\u0000${email_domain}`;
      mcpDomainAcc.set(key, (mcpDomainAcc.get(key) || 0) + row.count);
    }
    for (const [key, count] of mcpDomainAcc.entries()) {
      const [toolId = "unknown", email_domain = "unknown"] = key.split("\u0000");
      advancedGauges.mcpToolCallByUserDomain30d.set({ toolId, email_domain }, count);
    }
    advancedGauges.mcpUniqueUsersByTool30d.reset();
    for (const row of mcpUniqueByToolAgg) {
      advancedGauges.mcpUniqueUsersByTool30d.set({ toolId: row._id }, row.users);
    }
    advancedGauges.toolCallAvgLatencySeconds.reset();
    for (const row of toolLatencyAgg) {
      const ms: number = row.avgLatencyMs || 0;
      advancedGauges.toolCallAvgLatencySeconds.set({ toolId: row._id || "unknown" }, ms / 1000);
    }

    __mark("Files: by type, by domain, recent uploads, size percentiles");

    // --- Files: by type, by domain, recent uploads, size percentiles ---
    const [fileTypeAgg, fileByDomainAgg, fileUploads24h, fileUploads7d, fileSizePercAgg] = await Promise.all([
      File.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]),
      File.aggregate([{ $group: { _id: "$user", totalBytes: { $sum: "$bytes" } } }], { allowDiskUse: true }),
      File.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      File.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      File.aggregate([
        {
          $group: {
            _id: null,
            p: {
              $percentile: {
                p: [0.5, 0.95],
                input: "$bytes",
                method: "approximate",
              },
            },
          },
        },
      ]).catch(() => [] as Array<{ p: number[] }>),
    ]);

    advancedGauges.fileCountByType.reset();
    for (const row of fileTypeAgg) {
      advancedGauges.fileCountByType.set({ type: row._id || "unknown" }, row.count);
    }
    advancedGauges.fileBytesByUserDomain.reset();
    const fileBytesByDomainMap: Map<string, number> = new Map();
    for (const row of fileByDomainAgg) {
      const email = userIdToEmail.get(String(row._id)) || "unknown";
      const domain = extractEmailDomain(email);
      fileBytesByDomainMap.set(domain, (fileBytesByDomainMap.get(domain) || 0) + row.totalBytes);
    }
    for (const [email_domain, bytes] of fileBytesByDomainMap.entries()) {
      advancedGauges.fileBytesByUserDomain.set({ email_domain }, bytes);
    }
    advancedGauges.fileUploadCount24h.set(fileUploads24h);
    advancedGauges.fileUploadCount7d.set(fileUploads7d);
    const fileSizeP = fileSizePercAgg[0]?.p as number[] | undefined;
    advancedGauges.fileSizeP50.set(fileSizeP?.[0] || 0);
    advancedGauges.fileSizeP95.set(fileSizeP?.[1] || 0);

    __mark("Feedback extensions: by tag-only and by domain (30d)");

    // --- Feedback extensions: by tag-only and by domain (30d) ---
    const [feedbackByTagOnlyAgg, feedbackByDomain30dAgg] = await Promise.all([
      Message.aggregate([
        { $match: { "feedback.rating": { $in: ["thumbsUp", "thumbsDown"] } } },
        {
          $group: {
            _id: {
              tag: { $ifNull: ["$feedback.tag", "no_tag"] },
              rating: "$feedback.rating",
            },
            count: { $sum: 1 },
          },
        },
      ]),
      Message.aggregate(
        [
          {
            $match: {
              createdAt: { $gte: thirtyDaysAgo },
              "feedback.rating": { $in: ["thumbsUp", "thumbsDown"] },
            },
          },
          {
            $group: {
              _id: { user: "$user", rating: "$feedback.rating" },
              count: { $sum: 1 },
            },
          },
        ],
        { allowDiskUse: true },
      ),
    ]);

    advancedGauges.feedbackCountByTag.reset();
    for (const row of feedbackByTagOnlyAgg) {
      advancedGauges.feedbackCountByTag.set(
        {
          tag: row._id?.tag || "no_tag",
          rating: row._id?.rating || "unknown",
        },
        row.count,
      );
    }
    advancedGauges.feedbackCountByDomain30d.reset();
    const feedbackDomainAcc: Map<string, number> = new Map();
    for (const row of feedbackByDomain30dAgg) {
      const email = userIdToEmail.get(String(row._id?.user)) || "unknown";
      const rating: string = row._id?.rating || "unknown";
      const domain = extractEmailDomain(email);
      const key = `${domain}\u0000${rating}`;
      feedbackDomainAcc.set(key, (feedbackDomainAcc.get(key) || 0) + row.count);
    }
    for (const [key, count] of feedbackDomainAcc.entries()) {
      const [email_domain = "unknown", rating = "unknown"] = key.split("\u0000");
      advancedGauges.feedbackCountByDomain30d.set({ email_domain, rating }, count);
    }

    __mark("Sessions & auth");

    // --- Sessions & auth ---
    const [sessionActive, sessionExpired24h, verifiedCount, userRoleAgg] = await Promise.all([
      Session.countDocuments({ expiration: { $gt: now } }),
      Session.countDocuments({
        expiration: { $gte: oneDayAgo, $lte: now },
      }),
      User.countDocuments({ emailVerified: true }),
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    ]);
    advancedGauges.sessionActiveCount.set(sessionActive);
    advancedGauges.sessionExpiredCount24h.set(sessionExpired24h);
    advancedGauges.userEmailVerifiedPercent.set(toPercent(verifiedCount, totalUserCount));
    advancedGauges.userCountByRole.reset();
    for (const row of userRoleAgg) {
      advancedGauges.userCountByRole.set({ role: row._id || "unknown" }, row.count);
    }

    __mark("Prompts library, shared links, conversation tags");

    // --- Prompts library, shared links, conversation tags ---
    const [promptGroupByCategoryAgg, sharedLinks24h, convTagUsageAgg] = await Promise.all([
      PromptGroup.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
      SharedLink.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      ConversationTag.aggregate([
        {
          $group: {
            _id: "$tag",
            total: { $sum: { $ifNull: ["$count", 0] } },
          },
        },
      ]),
    ]);
    advancedGauges.promptGroupCountByCategory.reset();
    for (const row of promptGroupByCategoryAgg) {
      advancedGauges.promptGroupCountByCategory.set({ category: row._id || "uncategorized" }, row.count);
    }
    advancedGauges.sharedLinkCount24h.set(sharedLinks24h);
    advancedGauges.conversationTagUsageCount.reset();
    for (const row of convTagUsageAgg) {
      advancedGauges.conversationTagUsageCount.set({ tag: row._id || "untagged" }, row.total);
    }

    __mark("END");
    // advanced scrape duration is reported via the [timing] log when
    // LOG_TIMINGS=true; no per-cycle "updated" line by default.
  } catch (error) {
    log.error({ err: error }, "error updating advanced metrics");
  }
}
