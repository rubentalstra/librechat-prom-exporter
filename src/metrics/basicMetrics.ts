import client from 'prom-client';
import {
    User,
    Action,
    Agent,
    Assistant,
    Balance,
    Banner,
    ConversationTag,
    Conversation,
    File,
    Key,
    Message,
    PluginAuth,
    Preset,
    Project,
    PromptGroup,
    Prompt,
    Session,
    SharedLink,
    Token,
    ToolCall,
    Transaction,
} from '../models';

export const basicGauges = {
    users: new client.Gauge({ name: 'librechat_user_count', help: 'Total number of users' }),
    actions: new client.Gauge({ name: 'librechat_action_count', help: 'Total number of actions' }),
    agents: new client.Gauge({ name: 'librechat_agent_count', help: 'Total number of agents' }),
    assistants: new client.Gauge({ name: 'librechat_assistant_count', help: 'Total number of assistants' }),
    balances: new client.Gauge({ name: 'librechat_balance_count', help: 'Total number of balance records' }),
    banners: new client.Gauge({ name: 'librechat_banner_count', help: 'Total number of banners' }),
    conversationTags: new client.Gauge({ name: 'librechat_conversation_tag_count', help: 'Total number of conversation tags' }),
    conversations: new client.Gauge({ name: 'librechat_conversation_count', help: 'Total number of conversations' }),
    files: new client.Gauge({ name: 'librechat_file_count', help: 'Total number of files' }),
    keys: new client.Gauge({ name: 'librechat_key_count', help: 'Total number of keys' }),
    messages: new client.Gauge({ name: 'librechat_message_count', help: 'Total number of messages' }),
    pluginAuth: new client.Gauge({ name: 'librechat_plugin_auth_count', help: 'Total number of plugin auth records' }),
    presets: new client.Gauge({ name: 'librechat_preset_count', help: 'Total number of presets' }),
    projects: new client.Gauge({ name: 'librechat_project_count', help: 'Total number of projects' }),
    promptGroups: new client.Gauge({ name: 'librechat_prompt_group_count', help: 'Total number of prompt groups' }),
    prompts: new client.Gauge({ name: 'librechat_prompt_count', help: 'Total number of prompts' }),
    sessions: new client.Gauge({ name: 'librechat_session_count', help: 'Total number of sessions' }),
    sharedLinks: new client.Gauge({ name: 'librechat_shared_link_count', help: 'Total number of shared links' }),
    tokens: new client.Gauge({ name: 'librechat_token_count', help: 'Total number of tokens' }),
    toolCalls: new client.Gauge({ name: 'librechat_tool_call_count', help: 'Total number of tool calls' }),
    transactions: new client.Gauge({ name: 'librechat_transaction_count', help: 'Total number of transactions' }),
};

export async function updateBasicMetrics(): Promise<void> {
    try {
        const [
            userCount,
            actionCount,
            agentCount,
            assistantCount,
            balanceCount,
            bannerCount,
            conversationTagCount,
            conversationCount,
            fileCount,
            keyCount,
            messageCount,
            pluginAuthCount,
            presetCount,
            projectCount,
            promptGroupCount,
            promptCount,
            sessionCount,
            sharedLinkCount,
            tokenCount,
            toolCallCount,
            transactionCount,
        ] = await Promise.all([
            User.countDocuments({}),
            Action.countDocuments({}),
            Agent.countDocuments({}),
            Assistant.countDocuments({}),
            Balance.countDocuments({}),
            Banner.countDocuments({}),
            ConversationTag.countDocuments({}),
            Conversation.countDocuments({}),
            File.countDocuments({}),
            Key.countDocuments({}),
            Message.countDocuments({}),
            PluginAuth.countDocuments({}),
            Preset.countDocuments({}),
            Project.countDocuments({}),
            PromptGroup.countDocuments({}),
            Prompt.countDocuments({}),
            Session.countDocuments({}),
            SharedLink.countDocuments({}),
            Token.countDocuments({}),
            ToolCall.countDocuments({}),
            Transaction.countDocuments({}),
        ]);
        basicGauges.users.set(userCount);
        basicGauges.actions.set(actionCount);
        basicGauges.agents.set(agentCount);
        basicGauges.assistants.set(assistantCount);
        basicGauges.balances.set(balanceCount);
        basicGauges.banners.set(bannerCount);
        basicGauges.conversationTags.set(conversationTagCount);
        basicGauges.conversations.set(conversationCount);
        basicGauges.files.set(fileCount);
        basicGauges.keys.set(keyCount);
        basicGauges.messages.set(messageCount);
        basicGauges.pluginAuth.set(pluginAuthCount);
        basicGauges.presets.set(presetCount);
        basicGauges.projects.set(projectCount);
        basicGauges.promptGroups.set(promptGroupCount);
        basicGauges.prompts.set(promptCount);
        basicGauges.sessions.set(sessionCount);
        basicGauges.sharedLinks.set(sharedLinkCount);
        basicGauges.tokens.set(tokenCount);
        basicGauges.toolCalls.set(toolCallCount);
        basicGauges.transactions.set(transactionCount);

        console.log('Basic metrics updated.');
    } catch (error) {
        console.error('Error updating basic metrics:', error);
    }
}