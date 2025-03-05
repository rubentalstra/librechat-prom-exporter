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
    Action
} from '../models';

// Advanced gauges including updated transaction cost metrics and new cost-per-user/model gauges.
export const advancedGauges = {
    // Message metrics
    messageTokenSum: new client.Gauge({
        name: 'librechat_message_token_sum',
        help: 'Sum of tokenCount for all messages'
    }),
    messageTokenAvg: new client.Gauge({
        name: 'librechat_message_token_avg',
        help: 'Average tokenCount for messages'
    }),
    errorMessageCount: new client.Gauge({
        name: 'librechat_error_message_count',
        help: 'Count of messages with error'
    }),
    messageWithAttachmentsCount: new client.Gauge({
        name: 'librechat_message_with_attachments_count',
        help: 'Count of messages with attachments'
    }),
    messagePluginUsagePercent: new client.Gauge({
        name: 'librechat_message_plugin_usage_percent',
        help: 'Percentage of messages that use a plugin'
    }),

    // Banner metrics
    activeBannerCount: new client.Gauge({
        name: 'librechat_active_banner_count',
        help: 'Count of banners currently active'
    }),

    // File metrics
    fileTotalBytes: new client.Gauge({
        name: 'librechat_file_total_bytes',
        help: 'Total bytes of all files'
    }),
    fileAvgBytes: new client.Gauge({
        name: 'librechat_file_avg_bytes',
        help: 'Average file size in bytes'
    }),

    // User metrics
    userProviderCount: new client.Gauge({
        name: 'librechat_user_provider_count',
        help: 'Count of users by provider',
        labelNames: ['provider']
    }),
    activeUserCount: new client.Gauge({
        name: 'librechat_active_users',
        help: 'Number of active users within the last 5 minutes'
    }),

    // Session metrics
    sessionAvgDuration: new client.Gauge({
        name: 'librechat_session_avg_duration',
        help: 'Average session duration in seconds'
    }),

    // Prompt Group metrics
    promptGroupGenerationsAvg: new client.Gauge({
        name: 'librechat_prompt_group_generations_avg',
        help: 'Average number of generations in prompt groups'
    }),

    // Prompt metrics
    promptCountByType: new client.Gauge({
        name: 'librechat_prompt_count_by_type',
        help: 'Count of prompts by type',
        labelNames: ['type']
    }),

    // Tool Call metrics
    toolCallCountByTool: new client.Gauge({
        name: 'librechat_tool_call_count_by_tool',
        help: 'Count of tool calls by toolId',
        labelNames: ['toolId']
    }),

    // Conversation metrics
    conversationMessageAvg: new client.Gauge({
        name: 'librechat_conversation_message_avg',
        help: 'Average number of messages per conversation'
    }),

    // Transaction cost metrics – recalculated using provided transaction data.
    transactionCostSum: new client.Gauge({
        name: 'librechat_transaction_cost_sum',
        help: 'Sum of transaction cost in USD by token type',
        labelNames: ['tokenType']
    }),
    transactionCostAvg: new client.Gauge({
        name: 'librechat_transaction_cost_avg',
        help: 'Average transaction cost in USD by token type',
        labelNames: ['tokenType']
    }),
    transactionCostTotalUSD: new client.Gauge({
        name: 'librechat_transaction_cost_total_usd',
        help: 'Total transaction cost in USD (aggregated over all token types)'
    }),
    transactionCostPerUser: new client.Gauge({
        name: 'librechat_transaction_cost_per_user',
        help: 'Average transaction cost in USD per user'
    }),
    transactionCostPerModel: new client.Gauge({
        name: 'librechat_transaction_cost_per_model',
        help: 'Total transaction cost in USD per deployed model',
        labelNames: ['model']
    }),

    // Transaction token metrics – sum and average of tokens from transactions.
    transactionTokenSum: new client.Gauge({
        name: 'librechat_transaction_token_sum',
        help: 'Sum of tokens (absolute rawAmount) from all transactions'
    }),
    transactionTokenAvg: new client.Gauge({
        name: 'librechat_transaction_token_avg',
        help: 'Average tokens (absolute rawAmount) per transaction'
    }),

    // Action metrics
    actionCountByType: new client.Gauge({
        name: 'librechat_action_count_by_type',
        help: 'Count of actions by type',
        labelNames: ['type']
    }),

    // New: Separate gauges for deployed models, agents, and assistants.
    // Only count messages for models that are not agents or assistants.
    deployedModelUsageCount: new client.Gauge({
        name: 'librechat_model_usage_count',
        help: 'Usage count for each deployed model',
        labelNames: ['model']
    }),
    agentUsageCount: new client.Gauge({
        name: 'librechat_agent_usage_count',
        help: 'Usage count for each agent',
        labelNames: ['agent']
    }),
    assistantUsageCount: new client.Gauge({
        name: 'librechat_assistant_usage_count',
        help: 'Usage count for each assistant',
        labelNames: ['assistant']
    }),
    deployedModelNamesCount: new client.Gauge({
        name: 'librechat_deployed_model_names_count',
        help: 'Total number of distinct deployed model names found in messages'
    })
};

export async function updateAdvancedMetrics(): Promise<void> {
    try {
        // --- Message Token Metrics ---
        const tokenSumAgg = await Message.aggregate([
            { $group: { _id: null, total: { $sum: '$tokenCount' } } }
        ]);
        advancedGauges.messageTokenSum.set(tokenSumAgg[0]?.total || 0);

        const tokenAvgAgg = await Message.aggregate([
            { $group: { _id: null, avg: { $avg: '$tokenCount' } } }
        ]);
        advancedGauges.messageTokenAvg.set(tokenAvgAgg[0]?.avg || 0);

        const errorCount = await Message.countDocuments({ error: true });
        advancedGauges.errorMessageCount.set(errorCount);

        const msgWithAttachCount = await Message.countDocuments({ attachments: { $exists: true, $ne: [] } });
        advancedGauges.messageWithAttachmentsCount.set(msgWithAttachCount);

        const totalMsgCount = await Message.countDocuments({});
        const pluginUsageCount = await Message.countDocuments({ plugin: { $exists: true, $ne: null } });
        const pluginUsagePercent = totalMsgCount > 0 ? (pluginUsageCount / totalMsgCount) * 100 : 0;
        advancedGauges.messagePluginUsagePercent.set(pluginUsagePercent);

        // Banner metrics
        const now = new Date();
        const activeBanners = await Banner.countDocuments({
            displayFrom: { $lte: now },
            $or: [{ displayTo: null }, { displayTo: { $gte: now } }]
        });
        advancedGauges.activeBannerCount.set(activeBanners);

        // File metrics
        const fileBytesAgg = await File.aggregate([
            { $group: { _id: null, totalBytes: { $sum: '$bytes' }, avgBytes: { $avg: '$bytes' } } }
        ]);
        advancedGauges.fileTotalBytes.set(fileBytesAgg[0]?.totalBytes || 0);
        advancedGauges.fileAvgBytes.set(fileBytesAgg[0]?.avgBytes || 0);

        // User metrics
        const userProviderAgg = await User.aggregate([
            { $group: { _id: '$provider', count: { $sum: 1 } } }
        ]);
        advancedGauges.userProviderCount.reset();
        for (const result of userProviderAgg) {
            const provider: string = result._id || 'unknown';
            advancedGauges.userProviderCount.set({ provider }, result.count);
        }

        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const activeUserAgg = await Message.aggregate<{ activeUsers: number }>([
            { $match: { createdAt: { $gte: fiveMinutesAgo } } },
            { $group: { _id: '$user' } },
            { $count: 'activeUsers' }
        ]);
        const activeUsers: number = activeUserAgg.length > 0 ? activeUserAgg[0].activeUsers : 0;
        advancedGauges.activeUserCount.set(activeUsers);

        // Session metrics
        const sessionAgg = await Session.aggregate([
            { $project: { duration: { $subtract: ['$expiration', '$createdAt'] } } },
            { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
        ]);
        advancedGauges.sessionAvgDuration.set((sessionAgg[0]?.avgDuration || 0) / 1000);

        // Prompt Group metrics
        const promptGroupAgg = await PromptGroup.aggregate([
            { $group: { _id: null, avgGenerations: { $avg: '$numberOfGenerations' } } }
        ]);
        advancedGauges.promptGroupGenerationsAvg.set(promptGroupAgg[0]?.avgGenerations || 0);

        // Prompt metrics
        const promptAgg = await Prompt.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);
        advancedGauges.promptCountByType.reset();
        for (const result of promptAgg) {
            const type: string = result._id || 'unknown';
            advancedGauges.promptCountByType.set({ type }, result.count);
        }

        // Tool Call metrics
        const toolCallAgg = await ToolCall.aggregate([
            { $group: { _id: '$toolId', count: { $sum: 1 } } }
        ]);
        advancedGauges.toolCallCountByTool.reset();
        for (const result of toolCallAgg) {
            const toolId: string = result._id || 'unknown';
            advancedGauges.toolCallCountByTool.set({ toolId }, result.count);
        }

        // Conversation metrics
        const convAgg = await Conversation.aggregate([
            { $project: { msgCount: { $size: '$messages' } } },
            { $group: { _id: null, avgMessages: { $avg: '$msgCount' } } }
        ]);
        advancedGauges.conversationMessageAvg.set(convAgg[0]?.avgMessages || 0);

        // --- Transaction Token Metrics (Separate from cost) ---
        const transactions = await Transaction.find({});
        let tokensSum = 0;
        for (const tx of transactions) {
            const rawAmount: number = typeof tx.rawAmount === 'number' ? tx.rawAmount : 0;
            tokensSum += Math.abs(rawAmount);
        }
        const txnCount: number = transactions.length;
        const tokenAvg: number = txnCount > 0 ? tokensSum / txnCount : 0;
        advancedGauges.transactionTokenSum.set(tokensSum);
        advancedGauges.transactionTokenAvg.set(tokenAvg);

        // --- Transaction Cost Metrics ---
        const txnCostByType: Record<string, { total: number; count: number }> = {};
        const modelCostMap: Record<string, { total: number; count: number }> = {};
        let totalCostUSD = 0;

        for (const tx of transactions) {
            // Ignore transactions with missing or unknown model.
            if (!tx.model || (typeof tx.model === 'string' && tx.model.toLowerCase() === 'unknown')) {
                continue;
            }

            const rawAmount: number = typeof tx.rawAmount === 'number' ? tx.rawAmount : 0;
            const tokenType: string = tx.tokenType || 'unknown';
            const effectiveModel: string = tx.model;

            // Compute the token value and convert it to USD.
            const tokenValue: number = typeof tx.tokenValue === 'number'
                ? tx.tokenValue
                : Math.abs(rawAmount) * (typeof tx.rate === 'number' ? tx.rate : 1);
            const costUSD: number = Math.abs(tokenValue) / 1e6;
            totalCostUSD += costUSD;

            // Group by token type for cost calculations.
            if (!txnCostByType[tokenType]) {
                txnCostByType[tokenType] = { total: 0, count: 0 };
            }
            txnCostByType[tokenType].total += costUSD;
            txnCostByType[tokenType].count += 1;

            // Group cost per model.
            if (!modelCostMap[effectiveModel]) {
                modelCostMap[effectiveModel] = { total: 0, count: 0 };
            }
            modelCostMap[effectiveModel].total += costUSD;
            modelCostMap[effectiveModel].count += 1;
        }

        // Update cost gauges by token type.
        advancedGauges.transactionCostSum.reset();
        advancedGauges.transactionCostAvg.reset();
        for (const type in txnCostByType) {
            const { total, count } = txnCostByType[type];
            advancedGauges.transactionCostSum.set({ tokenType: type }, total);
            advancedGauges.transactionCostAvg.set({ tokenType: type }, count > 0 ? total / count : 0);
        }
        advancedGauges.transactionCostTotalUSD.set(totalCostUSD);

        // Cost per user.
        const userCount: number = await User.countDocuments({});
        const costPerUser: number = userCount > 0 ? totalCostUSD / userCount : 0;
        advancedGauges.transactionCostPerUser.set(costPerUser);

        // Cost per deployed model.
        advancedGauges.transactionCostPerModel.reset();
        for (const model in modelCostMap) {
            const { total } = modelCostMap[model];
            advancedGauges.transactionCostPerModel.set({ model }, total);
        }

        // Action metrics
        const actionAgg = await Action.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);
        advancedGauges.actionCountByType.reset();
        for (const result of actionAgg) {
            const type: string = result._id || 'unknown';
            advancedGauges.actionCountByType.set({ type }, result.count);
        }

        // --- Updated Deployed Models / Agents / Assistants Metrics ---
        // Group messages by their "model" field.
        const deployedModelsAgg = await Message.aggregate([
            { $match: { model: { $ne: null } } },
            { $group: { _id: '$model', count: { $sum: 1 } } }
        ]);

        // Get agent (or assistant) names from Agent collection based on their id.
        const agentIds: string[] = deployedModelsAgg.map(result => result._id);
        const agents = await Agent.find({ id: { $in: agentIds } });
        const agentMap: Map<string, string> = new Map();
        agents.forEach(agent => {
            // Use agent.name if available; otherwise fallback to agent.id.
            agentMap.set(agent.id, agent.name ? agent.name : agent.id);
        });

        // Reset all three gauges.
        advancedGauges.deployedModelUsageCount.reset();
        advancedGauges.agentUsageCount.reset();
        advancedGauges.assistantUsageCount.reset();

        for (const result of deployedModelsAgg) {
            const id: string = result._id;
            // If it's an agent, only update if we can map it to an agent.
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
                // Otherwise, count it as a deployed model.
                advancedGauges.deployedModelUsageCount.set({ model: id }, result.count);
            }
        }

        // Also count the total number of distinct deployed model names (only models, excluding agents/assistants).
        const distinctModelsAgg = await Message.aggregate([
            { $match: { model: { $ne: null } } },
            { $group: { _id: '$model' } }
        ]);
        const filteredDistinctModels = distinctModelsAgg.filter(doc => {
            const id: string = doc._id;
            return !id.startsWith("agent_") && !id.startsWith("assistant_");
        });
        advancedGauges.deployedModelNamesCount.set(filteredDistinctModels.length);

        console.log('Advanced metrics updated.');
    } catch (error) {
        console.error('Error updating advanced metrics:', error);
    }
}