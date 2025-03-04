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
    Transaction
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
        basicGauges.users.set(await User.countDocuments({}));
        basicGauges.actions.set(await Action.countDocuments({}));
        basicGauges.agents.set(await Agent.countDocuments({}));
        basicGauges.assistants.set(await Assistant.countDocuments({}));
        basicGauges.balances.set(await Balance.countDocuments({}));
        basicGauges.banners.set(await Banner.countDocuments({}));
        basicGauges.conversationTags.set(await ConversationTag.countDocuments({}));
        basicGauges.conversations.set(await Conversation.countDocuments({}));
        basicGauges.files.set(await File.countDocuments({}));
        basicGauges.keys.set(await Key.countDocuments({}));
        basicGauges.messages.set(await Message.countDocuments({}));
        basicGauges.pluginAuth.set(await PluginAuth.countDocuments({}));
        basicGauges.presets.set(await Preset.countDocuments({}));
        basicGauges.projects.set(await Project.countDocuments({}));
        basicGauges.promptGroups.set(await PromptGroup.countDocuments({}));
        basicGauges.prompts.set(await Prompt.countDocuments({}));
        basicGauges.sessions.set(await Session.countDocuments({}));
        basicGauges.sharedLinks.set(await SharedLink.countDocuments({}));
        basicGauges.tokens.set(await Token.countDocuments({}));
        basicGauges.toolCalls.set(await ToolCall.countDocuments({}));
        basicGauges.transactions.set(await Transaction.countDocuments({}));

        console.log('Basic metrics updated.');
    } catch (error) {
        console.error('Error updating basic metrics:', error);
    }
}