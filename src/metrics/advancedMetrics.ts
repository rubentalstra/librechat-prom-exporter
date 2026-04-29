import client from 'prom-client';
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
    Transaction,
    Action,
} from '../models';

export const advancedGauges = {
    // Message metrics
    messageTokenSum: new client.Gauge({
        name: 'librechat_message_token_sum',
        help: 'Sum of tokenCount for all messages',
    }),
    messageTokenAvg: new client.Gauge({
        name: 'librechat_message_token_avg',
        help: 'Average tokenCount for messages',
    }),
    errorMessageCount: new client.Gauge({
        name: 'librechat_error_message_count',
        help: 'Count of messages with error',
    }),
    messageWithAttachmentsCount: new client.Gauge({
        name: 'librechat_message_with_attachments_count',
        help: 'Count of messages with attachments',
    }),
    messagePluginUsagePercent: new client.Gauge({
        name: 'librechat_message_plugin_usage_percent',
        help: 'Percentage of messages that use a plugin',
    }),

    // Feedback metrics
    messageFeedbackThumbsUpCount: new client.Gauge({
        name: 'librechat_message_feedback_thumbs_up_count',
        help: 'Count of messages with thumbs up feedback',
        labelNames: ['tag', 'model'],
    }),
    messageFeedbackThumbsDownCount: new client.Gauge({
        name: 'librechat_message_feedback_thumbs_down_count',
        help: 'Count of messages with thumbs down feedback',
        labelNames: ['tag', 'model'],
    }),
    messageFeedbackThumbsUpTotal: new client.Gauge({
        name: 'librechat_message_feedback_thumbs_up_total',
        help: 'Total count of messages with thumbs up feedback',
    }),
    messageFeedbackThumbsDownTotal: new client.Gauge({
        name: 'librechat_message_feedback_thumbs_down_total',
        help: 'Total count of messages with thumbs down feedback',
    }),
    feedbackThumbsUpPercentByModel30d: new client.Gauge({
        name: 'librechat_feedback_thumbs_up_percent_by_model_30d',
        help: 'Percentage of messages with thumbs up feedback per model (last 30 days)',
        labelNames: ['model'],
    }),
    feedbackThumbsDownPercentByModel30d: new client.Gauge({
        name: 'librechat_feedback_thumbs_down_percent_by_model_30d',
        help: 'Percentage of messages with thumbs down feedback per model (last 30 days)',
        labelNames: ['model'],
    }),
    feedbackThumbsUpPercentByAgent30d: new client.Gauge({
        name: 'librechat_feedback_thumbs_up_percent_by_agent_30d',
        help: 'Percentage of messages with thumbs up feedback per agent (last 30 days)',
        labelNames: ['agent'],
    }),
    feedbackThumbsDownPercentByAgent30d: new client.Gauge({
        name: 'librechat_feedback_thumbs_down_percent_by_agent_30d',
        help: 'Percentage of messages with thumbs down feedback per agent (last 30 days)',
        labelNames: ['agent'],
    }),
    feedbackEngagementRate30d: new client.Gauge({
        name: 'librechat_feedback_engagement_rate_30d',
        help: 'Percentage of assistant messages (last 30 days) that received any feedback',
    }),
    netSatisfactionByModel30d: new client.Gauge({
        name: 'librechat_net_satisfaction_by_model_30d',
        help: 'Net satisfaction score per model (last 30 days): (thumbsUp - thumbsDown) / total * 100',
        labelNames: ['model'],
    }),
    netSatisfactionByAgent30d: new client.Gauge({
        name: 'librechat_net_satisfaction_by_agent_30d',
        help: 'Net satisfaction score per agent (last 30 days): (thumbsUp - thumbsDown) / total * 100',
        labelNames: ['agent'],
    }),

    // Banner metrics
    activeBannerCount: new client.Gauge({
        name: 'librechat_active_banner_count',
        help: 'Count of banners currently active',
    }),

    // File metrics
    fileTotalBytes: new client.Gauge({
        name: 'librechat_file_total_bytes',
        help: 'Total bytes of all files',
    }),
    fileAvgBytes: new client.Gauge({
        name: 'librechat_file_avg_bytes',
        help: 'Average file size in bytes',
    }),

    // User metrics
    userProviderCount: new client.Gauge({
        name: 'librechat_user_provider_count',
        help: 'Count of users by provider',
        labelNames: ['provider'],
    }),
    activeUserCount: new client.Gauge({
        name: 'librechat_active_users',
        help: 'Number of active users within the last 5 minutes',
    }),
    activeUserCountByDomain: new client.Gauge({
        name: 'librechat_active_users_by_email_domain',
        help: 'Number of active users within the last 5 minutes grouped by email domain',
        labelNames: ['email_domain'],
    }),

    userCountByDomain: new client.Gauge({
        name: 'librechat_user_count_by_email_domain',
        help: 'Number of users grouped by email domain',
        labelNames: ['email_domain'],
    }),
    userPercentByDomain30d: new client.Gauge({
        name: 'librechat_user_percent_by_email_domain_30d',
        help: 'Percentage of active users by email domain (last 30 days)',
        labelNames: ['email_domain'],
    }),

    // User in messages metrics
    uniqueUserCount: new client.Gauge({
        name: 'librechat_unique_users_count',
        help: 'Number of unique users across all messages',
    }),
    uniqueUserCount1d: new client.Gauge({
        name: 'librechat_unique_users_count_1d',
        help: 'Unique users (last 1 day)',
    }),
    uniqueUserCount7d: new client.Gauge({
        name: 'librechat_unique_users_count_7d',
        help: 'Unique users (last 7 days)',
    }),
    uniqueUserCount30d: new client.Gauge({
        name: 'librechat_unique_users_count_30d',
        help: 'Unique users (last 30 days)',
    }),
    uniqueUserCount1dByDomain: new client.Gauge({
        name: 'librechat_unique_users_count_1d_by_email_domain',
        help: 'Unique users (last 1 day) grouped by email domain',
        labelNames: ['email_domain'],
    }),
    uniqueUserCount7dByDomain: new client.Gauge({
        name: 'librechat_unique_users_count_7d_by_email_domain',
        help: 'Unique users (last 7 days) grouped by email domain',
        labelNames: ['email_domain'],
    }),
    uniqueUserCount30dByDomain: new client.Gauge({
        name: 'librechat_unique_users_count_30d_by_email_domain',
        help: 'Unique users (last 30 days) grouped by email domain',
        labelNames: ['email_domain'],
    }),

    // Session metrics
    sessionAvgDuration: new client.Gauge({
        name: 'librechat_session_avg_duration',
        help: 'Average session duration in seconds',
    }),

    // Prompt Group metrics
    promptGroupGenerationsAvg: new client.Gauge({
        name: 'librechat_prompt_group_generations_avg',
        help: 'Average number of generations in prompt groups',
    }),

    // Prompt metrics
    promptCountByType: new client.Gauge({
        name: 'librechat_prompt_count_by_type',
        help: 'Count of prompts by type',
        labelNames: ['type'],
    }),

    // Tool Call metrics
    toolCallCountByTool: new client.Gauge({
        name: 'librechat_tool_call_count_by_tool',
        help: 'Count of tool calls by toolId',
        labelNames: ['toolId'],
    }),

    // Conversation metrics
    conversationMessageAvg: new client.Gauge({
        name: 'librechat_conversation_message_avg',
        help: 'Average number of messages per conversation',
    }),

    // Transaction cost metrics – recalculated using provided transaction data.
    transactionCostSum: new client.Gauge({
        name: 'librechat_transaction_cost_sum',
        help: 'Sum of transaction cost in USD by token type',
        labelNames: ['tokenType'],
    }),
    transactionCostAvg: new client.Gauge({
        name: 'librechat_transaction_cost_avg',
        help: 'Average transaction cost in USD by token type',
        labelNames: ['tokenType'],
    }),
    transactionCostTotalUSD: new client.Gauge({
        name: 'librechat_transaction_cost_total_usd',
        help: 'Total transaction cost in USD (aggregated over all token types)',
    }),
    transactionCostPerUser: new client.Gauge({
        name: 'librechat_transaction_cost_per_user',
        help: 'Average transaction cost in USD per user',
    }),
    transactionCostPerModel: new client.Gauge({
        name: 'librechat_transaction_cost_per_model',
        help: 'Total transaction cost in USD per deployed model',
        labelNames: ['model'],
    }),

    // Transaction token metrics – sum and average of tokens from transactions.
    transactionTokenSum: new client.Gauge({
        name: 'librechat_transaction_token_sum',
        help: 'Sum of tokens (absolute rawAmount) from all transactions',
    }),
    transactionTokenAvg: new client.Gauge({
        name: 'librechat_transaction_token_avg',
        help: 'Average tokens (absolute rawAmount) per transaction',
    }),

    // Action metrics
    actionCountByType: new client.Gauge({
        name: 'librechat_action_count_by_type',
        help: 'Count of actions by type',
        labelNames: ['type'],
    }),

    // Deployed models, agents, and assistants metrics
    deployedModelUsageCount: new client.Gauge({
        name: 'librechat_model_usage_count',
        help: 'Usage count for each deployed model',
        labelNames: ['model'],
    }),
    agentUsageCount: new client.Gauge({
        name: 'librechat_agent_usage_count',
        help: 'Usage count for each agent',
        labelNames: ['agent'],
    }),
    assistantUsageCount: new client.Gauge({
        name: 'librechat_assistant_usage_count',
        help: 'Usage count for each assistant',
        labelNames: ['assistant'],
    }),
    deployedModelNamesCount: new client.Gauge({
        name: 'librechat_deployed_model_names_count',
        help: 'Total number of distinct deployed model names found in messages',
    }),

    // Adoption rate metrics (1d omitted — equivalent to periodicityDaily)
    adoptionRate7d: new client.Gauge({
        name: 'librechat_adoption_rate_7d',
        help: 'Percentage of active users (last 7 days) vs total registered users',
    }),
    adoptionRate30d: new client.Gauge({
        name: 'librechat_adoption_rate_30d',
        help: 'Percentage of active users (last 30 days) vs total registered users',
    }),

    // Usage periodicity metrics
    periodicityDaily: new client.Gauge({
        name: 'librechat_periodicity_daily',
        help: 'Percentage of registered users active today (last 24h)',
    }),
    periodicityWeekly: new client.Gauge({
        name: 'librechat_periodicity_weekly',
        help: 'Percentage of registered users active 3+ days in the last 7 days',
    }),
    periodicityMonthly: new client.Gauge({
        name: 'librechat_periodicity_monthly',
        help: 'Percentage of registered users active 5+ days in the last 30 days',
    }),

    // MCP utilization metrics (30 days)
    mcpToolCallCount30d: new client.Gauge({
        name: 'librechat_mcp_tool_call_count_30d',
        help: 'Total MCP tool calls in the last 30 days',
    }),
    mcpToolCallCountByTool30d: new client.Gauge({
        name: 'librechat_mcp_tool_call_count_by_tool_30d',
        help: 'MCP tool calls in the last 30 days by toolId',
        labelNames: ['toolId'],
    }),
    mcpUniqueUserCount30d: new client.Gauge({
        name: 'librechat_mcp_unique_users_30d',
        help: 'Unique users using MCP tools in the last 30 days',
    }),
    mcpUtilizationPercent30d: new client.Gauge({
        name: 'librechat_mcp_utilization_percent_30d',
        help: 'Percentage of tool calls that are MCP in the last 30 days',
    }),
};

/**
 * Returns the percentage of `numerator` over `denominator`.
 * Returns 0 when denominator is 0 to avoid division-by-zero.
 */
function toPercent(numerator: number, denominator: number): number {
    return denominator > 0 ? (numerator / denominator) * 100 : 0;
}

/**
 * Helper function to create aggregation pipeline for users by email domain
 * @param timeFilter - Date filter for createdAt field
 * @returns Array of aggregation pipeline stages
 */
function getUsersByDomainPipeline(timeFilter: Date) {
    return [
        { $match: { createdAt: { $gte: timeFilter } } },
        { $group: { _id: '$user' } },
        { $addFields: { userId: { $toObjectId: '$_id' } } },
        { $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'userDetails',
            },
        },
        { $unwind: '$userDetails' },
        { $project: { emailDomain: { $arrayElemAt: [{ $split: ['$userDetails.email', '@'] }, 1] } } },
        { $group: { _id: '$emailDomain', userCount: { $sum: 1 } } },
        { $project: {
                _id: 0,
                domain: '$_id',
                count: '$userCount',
            },
        },
    ];
}

export async function updateAdvancedMetrics(): Promise<void> {
    try {
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

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
            Message.aggregate([{ $group: { _id: null, total: { $sum: '$tokenCount' } } }]),
            Message.aggregate([{ $group: { _id: null, avg: { $avg: '$tokenCount' } } }]),
            Message.countDocuments({ error: true }),
            Message.countDocuments({ attachments: { $exists: true, $ne: [] } }),
            Message.countDocuments({}),
            Message.countDocuments({ plugin: { $exists: true, $ne: null } }),
            Message.aggregate([
                { $match: { 'feedback.rating': 'thumbsUp' } },
                {
                    $group: {
                        _id: {
                            tag: { $ifNull: ['$feedback.tag', 'no_tag'] },
                            model: { $ifNull: ['$model', 'unknown'] },
                        },
                        count: { $sum: 1 },
                    },
                },
            ]),
            Message.aggregate([
                { $match: { 'feedback.rating': 'thumbsDown' } },
                {
                    $group: {
                        _id: {
                            tag: { $ifNull: ['$feedback.tag', 'no_tag'] },
                            model: { $ifNull: ['$model', 'unknown'] },
                        },
                        count: { $sum: 1 },
                    },
                },
            ]),
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
            const tag: string = result._id?.tag || 'no_tag';
            const model: string = result._id?.model || 'unknown';
            advancedGauges.messageFeedbackThumbsUpCount.set({ tag, model }, result.count);
        }

        advancedGauges.messageFeedbackThumbsDownCount.reset();
        for (const result of thumbsDownByTagAgg) {
            const tag: string = result._id?.tag || 'no_tag';
            const model: string = result._id?.model || 'unknown';
            advancedGauges.messageFeedbackThumbsDownCount.set({ tag, model }, result.count);
        }

        // --- Banner Metrics ---
        const activeBanners = await Banner.countDocuments({
            displayFrom: { $lte: now },
            $or: [{ displayTo: null }, { displayTo: { $gte: now } }],
        });
        advancedGauges.activeBannerCount.set(activeBanners);

        // --- File Metrics ---
        const fileBytesAgg = await File.aggregate([
            {
                $group: {
                    _id: null,
                    totalBytes: { $sum: '$bytes' },
                    avgBytes: { $avg: '$bytes' },
                },
            },
        ]);
        advancedGauges.fileTotalBytes.set(fileBytesAgg[0]?.totalBytes || 0);
        advancedGauges.fileAvgBytes.set(fileBytesAgg[0]?.avgBytes || 0);

        // --- User Metrics ---
        const userProviderAgg = await User.aggregate([
            { $group: { _id: '$provider', count: { $sum: 1 } } },
        ]);
        advancedGauges.userProviderCount.reset();
        for (const result of userProviderAgg) {
            const provider: string = result._id || 'unknown';
            advancedGauges.userProviderCount.set({ provider }, result.count);
        }

        // --- User Count By Email Domain ---
        const users = await User.find({ email: { $exists: true, $ne: null } }, { email: 1 });
        const domainCountMap: Map<string, number> = new Map();

        for (const user of users) {
            const email: string = user.email;
            const email_domain = email.split('@')[1] || 'unknown';
            domainCountMap.set(email_domain, (domainCountMap.get(email_domain) || 0) + 1);
        }

        advancedGauges.userCountByDomain.reset();
        for (const [email_domain, count] of domainCountMap.entries()) {
            advancedGauges.userCountByDomain.set({ email_domain }, count);
        }

        // --- Active Users in Last 5 Minutes ---
        const activeUserAgg = await Message.aggregate([
            { $match: { createdAt: { $gte: fiveMinutesAgo } } },
            { $group: { _id: '$user' } },
            { $count: 'activeUsers' },
        ]);
        const activeUsers: number =
            activeUserAgg.length > 0 ? activeUserAgg[0].activeUsers : 0;
        advancedGauges.activeUserCount.set(activeUsers);

        // --- Unique Users ---
        const [uniqueUsers, totalUserCount] = await Promise.all([
            Message.distinct('user'),
            User.countDocuments({}),
        ]);
        advancedGauges.uniqueUserCount.set(uniqueUsers.length);

        // --- Unique Users in Sliding Windows (1, 7 and 30 days) ---
        const uniqueUsers1d = await Message.distinct('user', {
            createdAt: { $gte: oneDayAgo },
        });
        const uniqueUsers7d = await Message.distinct('user', {
            createdAt: { $gte: sevenDaysAgo },
        });
        const uniqueUsers30d = await Message.distinct('user', {
            createdAt: { $gte: thirtyDaysAgo },
        });

        advancedGauges.uniqueUserCount1d.set(uniqueUsers1d.length);
        advancedGauges.uniqueUserCount7d.set(uniqueUsers7d.length);
        advancedGauges.uniqueUserCount30d.set(uniqueUsers30d.length);

        // --- Adoption Rates (active users / total users) ---
        // Note: 1d adoption rate is identical to periodicityDaily and emitted there.
        advancedGauges.adoptionRate7d.set(toPercent(uniqueUsers7d.length, totalUserCount));
        advancedGauges.adoptionRate30d.set(toPercent(uniqueUsers30d.length, totalUserCount));

        // --- Usage Periodicity Metrics ---
        // Daily: % of registered users active today
        advancedGauges.periodicityDaily.set(toPercent(uniqueUsers1d.length, totalUserCount));

        // Weekly: % of registered users with 3+ active days in the last 7 days
        // Monthly: % of registered users with 5+ active days in the last 30 days
        const [weeklyPeriodicityAgg, monthlyPeriodicityAgg] = await Promise.all([
            Message.aggregate([
                { $match: { createdAt: { $gte: sevenDaysAgo } } },
                { $group: { _id: { user: '$user', day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } } } },
                { $group: { _id: '$_id.user', activeDays: { $sum: 1 } } },
                { $match: { activeDays: { $gte: 3 } } },
                { $count: 'count' },
            ]),
            Message.aggregate([
                { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                { $group: { _id: { user: '$user', day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } } } },
                { $group: { _id: '$_id.user', activeDays: { $sum: 1 } } },
                { $match: { activeDays: { $gte: 5 } } },
                { $count: 'count' },
            ]),
        ]);

        const weeklyPeriodicityCount = weeklyPeriodicityAgg[0]?.count || 0;
        const monthlyPeriodicityCount = monthlyPeriodicityAgg[0]?.count || 0;
        advancedGauges.periodicityWeekly.set(toPercent(weeklyPeriodicityCount, totalUserCount));
        advancedGauges.periodicityMonthly.set(toPercent(monthlyPeriodicityCount, totalUserCount));

        // --- Combined Active/Unique Users by Email Domain (5min, 1d, 7d, 30d) ---
        const usersByDomainResults = await Message.aggregate([
            {
                $facet: {
                    // Active users in last 5 minutes by domain
                    active5min: getUsersByDomainPipeline(fiveMinutesAgo),
                    // Unique users in last 1 day by domain
                    unique1d: getUsersByDomainPipeline(oneDayAgo),
                    // Unique users in last 7 days by domain
                    unique7d: getUsersByDomainPipeline(sevenDaysAgo),
                    // Unique users in last 30 days by domain
                    unique30d: getUsersByDomainPipeline(thirtyDaysAgo),
                },
            },
        ]);

        // Process results and set metrics
        const [
            activeUsersByDomainAgg,
            uniqueUsers1dByDomainAgg,
            uniqueUsers7dByDomainAgg,
            uniqueUsers30dByDomainAgg,
        ] = [
            usersByDomainResults[0]?.active5min || [],
            usersByDomainResults[0]?.unique1d || [],
            usersByDomainResults[0]?.unique7d || [],
            usersByDomainResults[0]?.unique30d || [],
        ];

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

        // --- User Percent By Email Domain (30 days) ---
        const totalUniqueUsers30d = uniqueUsers30dByDomainAgg.reduce(
            (sum: number, r: { count: number }) => sum + r.count, 0,
        );
        advancedGauges.userPercentByDomain30d.reset();
        for (const result of uniqueUsers30dByDomainAgg) {
            advancedGauges.userPercentByDomain30d.set(
                { email_domain: result.domain },
                toPercent(result.count, totalUniqueUsers30d),
            );
        }

        // --- Session Metrics ---
        const sessionAgg = await Session.aggregate([
            { $project: { duration: { $subtract: ['$expiration', '$createdAt'] } } },
            { $group: { _id: null, avgDuration: { $avg: '$duration' } } },
        ]);
        advancedGauges.sessionAvgDuration.set((sessionAgg[0]?.avgDuration || 0) / 1000);

        // --- Prompt Group Metrics ---
        const promptGroupAgg = await PromptGroup.aggregate([
            { $group: { _id: null, avgGenerations: { $avg: '$numberOfGenerations' } } },
        ]);
        advancedGauges.promptGroupGenerationsAvg.set(promptGroupAgg[0]?.avgGenerations || 0);

        // --- Prompt Metrics ---
        const promptAgg = await Prompt.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } },
        ]);
        advancedGauges.promptCountByType.reset();
        for (const result of promptAgg) {
            const type: string = result._id || 'unknown';
            advancedGauges.promptCountByType.set({ type }, result.count);
        }

        // --- Tool Call Metrics ---
        const toolCallAgg = await ToolCall.aggregate([
            { $group: { _id: '$toolId', count: { $sum: 1 } } },
        ]);
        advancedGauges.toolCallCountByTool.reset();
        for (const result of toolCallAgg) {
            const toolId: string = result._id || 'unknown';
            advancedGauges.toolCallCountByTool.set({ toolId }, result.count);
        }

        // --- Conversation Metrics ---
        const convAgg = await Conversation.aggregate([
            { $project: { msgCount: { $size: '$messages' } } },
            { $group: { _id: null, avgMessages: { $avg: '$msgCount' } } },
        ]);
        advancedGauges.conversationMessageAvg.set(convAgg[0]?.avgMessages || 0);

        // --- Transaction Token Metrics (using aggregation) ---
        const tokenAgg = await Transaction.aggregate([
            {
                $group: {
                    _id: null,
                    tokensSum: { $sum: { $abs: '$rawAmount' } },
                    txnCount: { $sum: 1 },
                },
            },
        ]);
        const tokensSum = tokenAgg[0]?.tokensSum || 0;
        const txnCount = tokenAgg[0]?.txnCount || 0;
        const tokenAvg = txnCount > 0 ? tokensSum / txnCount : 0;
        advancedGauges.transactionTokenSum.set(tokensSum);
        advancedGauges.transactionTokenAvg.set(tokenAvg);

        // --- Transaction Cost Metrics ---
        // Compute cost per token type and per model using a single aggregation with $facet.
        const txnCostResults = await Transaction.aggregate([
            {
                $match: {
                    model: { $nin: [null, 'unknown', 'UNKNOWN'] },
                },
            },
            {
                $project: {
                    tokenType: { $ifNull: ['$tokenType', 'unknown'] },
                    effectiveModel: '$model',
                    rawAmount: 1,
                    rate: { $ifNull: ['$rate', 1] },
                    tokenValue: {
                        $cond: {
                            if: { $ifNull: ['$tokenValue', false] },
                            then: '$tokenValue',
                            else: { $multiply: [{ $abs: '$rawAmount' }, { $ifNull: ['$rate', 1] }] },
                        },
                    },
                },
            },
            { $addFields: { costUSD: { $divide: [{ $abs: '$tokenValue' }, 1e6] } } },
            {
                $facet: {
                    costByType: [
                        {
                            $group: {
                                _id: '$tokenType',
                                totalCost: { $sum: '$costUSD' },
                                count: { $sum: 1 },
                            },
                        },
                    ],
                    costByModel: [
                        {
                            $group: {
                                _id: '$effectiveModel',
                                totalCost: { $sum: '$costUSD' },
                                count: { $sum: 1 },
                            },
                        },
                    ],
                    totalCost: [
                        {
                            $group: {
                                _id: null,
                                totalCost: { $sum: '$costUSD' },
                            },
                        },
                    ],
                },
            },
        ]);
        const costByType = txnCostResults[0]?.costByType || [];
        const costByModel = txnCostResults[0]?.costByModel || [];
        const totalCost = txnCostResults[0]?.totalCost[0]?.totalCost || 0;

        advancedGauges.transactionCostSum.reset();
        advancedGauges.transactionCostAvg.reset();
        for (const ct of costByType) {
            advancedGauges.transactionCostSum.set({ tokenType: ct._id }, ct.totalCost);
            advancedGauges.transactionCostAvg.set(
                { tokenType: ct._id },
                ct.count > 0 ? ct.totalCost / ct.count : 0,
            );
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

        // --- Action Metrics ---
        const actionAgg = await Action.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } },
        ]);
        advancedGauges.actionCountByType.reset();
        for (const result of actionAgg) {
            const type: string = result._id || 'unknown';
            advancedGauges.actionCountByType.set({ type }, result.count);
        }

        // --- Deployed Models / Agents / Assistants Metrics ---
        const deployedModelsAgg = await Message.aggregate([
            { $match: { model: { $ne: null } } },
            { $group: { _id: '$model', count: { $sum: 1 } } },
        ]);
        const agentIds = deployedModelsAgg.map((result: { _id: string; count: number }) => result._id);
        const agents = await Agent.find({ id: { $in: agentIds } });
        const agentMap: Map<string, string> = new Map();
        agents.forEach((agent: { id: string; name?: string }) => {
            agentMap.set(agent.id, agent.name ? agent.name : agent.id);
        });

        advancedGauges.deployedModelUsageCount.reset();
        advancedGauges.agentUsageCount.reset();
        advancedGauges.assistantUsageCount.reset();

        for (const result of deployedModelsAgg) {
            const id: string = result._id;
            if (id.startsWith('agent_')) {
                if (agentMap.has(id)) {
                    const displayName = agentMap.get(id)!;
                    advancedGauges.agentUsageCount.set({ agent: displayName }, result.count);
                }
            } else if (id.startsWith('assistant_')) {
                if (agentMap.has(id)) {
                    const displayName = agentMap.get(id)!;
                    advancedGauges.assistantUsageCount.set({ assistant: displayName }, result.count);
                }
            } else {
                advancedGauges.deployedModelUsageCount.set({ model: id }, result.count);
            }
        }

        // --- Parallelized: Feedback, Distinct Models, MCP (independent queries) ---
        const [feedbackByModel30dAgg, distinctModelsAgg, toolCallContentAgg] = await Promise.all([
            // Feedback by model/agent (30d) — only assistant messages are eligible
            Message.aggregate([
                { $match: { createdAt: { $gte: thirtyDaysAgo }, model: { $ne: null }, isCreatedByUser: false } },
                {
                    $group: {
                        _id: '$model',
                        total: { $sum: 1 },
                        thumbsUp: {
                            $sum: { $cond: [{ $eq: ['$feedback.rating', 'thumbsUp'] }, 1, 0] },
                        },
                        thumbsDown: {
                            $sum: { $cond: [{ $eq: ['$feedback.rating', 'thumbsDown'] }, 1, 0] },
                        },
                    },
                },
            ]),
            // Distinct deployed model names
            Message.aggregate([
                { $match: { model: { $ne: null } } },
                { $group: { _id: '$model' } },
            ]),
            // MCP tool call content (30d)
            Message.aggregate([
                { $match: { createdAt: { $gte: thirtyDaysAgo }, 'content.type': 'tool_call' } },
                { $unwind: '$content' },
                { $match: { 'content.type': 'tool_call' } },
                {
                    $addFields: {
                        toolName: {
                            $ifNull: [
                                '$content.tool_call.name',
                                { $ifNull: ['$content.tool_call.function.name', 'unknown'] },
                            ],
                        },
                    },
                },
                {
                    $facet: {
                        totalToolCalls: [{ $count: 'count' }],
                        mcpTotal: [
                            { $match: { toolName: { $regex: '_mcp_' } } },
                            { $count: 'count' },
                        ],
                        mcpByTool: [
                            { $match: { toolName: { $regex: '_mcp_' } } },
                            { $group: { _id: '$toolName', count: { $sum: 1 } } },
                        ],
                        mcpUniqueUsers: [
                            { $match: { toolName: { $regex: '_mcp_' } } },
                            { $group: { _id: '$user' } },
                            { $count: 'count' },
                        ],
                    },
                },
            ]),
        ]);

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

            const entityType = id.split('_')[0];
            switch (entityType) {
                case 'agent': {
                    const displayName = agentMap.get(id) || id;
                    advancedGauges.feedbackThumbsUpPercentByAgent30d.set({ agent: displayName }, upPct);
                    advancedGauges.feedbackThumbsDownPercentByAgent30d.set({ agent: displayName }, downPct);
                    advancedGauges.netSatisfactionByAgent30d.set({ agent: displayName }, netSatisfaction);
                    break;
                }
                case 'assistant':
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
        advancedGauges.feedbackEngagementRate30d.set(
            toPercent(totalFeedbackMessages30d, totalAssistantMessages30d),
        );

        // --- Distinct Deployed Model Names ---
        const filteredDistinctModels = distinctModelsAgg.filter((doc: { _id: string }) => {
            const id: string = doc._id;          
            return !id.startsWith('agent_') && !id.startsWith('assistant_');     
        });
        advancedGauges.deployedModelNamesCount.set(filteredDistinctModels.length);

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

        console.log('Advanced metrics updated.');
    } catch (error) {
        console.error('Error updating advanced metrics:', error);
    }
}
