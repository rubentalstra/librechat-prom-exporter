import mongoose from 'mongoose';
import { createModels } from '@librechat/data-schemas';

// Create all models using the data-schemas package
const models = createModels(mongoose);

// Export all models used by the application
export const Action = models.Action;
export const Agent = models.Agent;
export const Assistant = models.Assistant;
export const Balance = models.Balance;
export const Banner = models.Banner;
export const ConversationTag = models.ConversationTag;
export const Conversation = models.Conversation;
export const File = models.File;
export const Key = models.Key;
export const Message = models.Message;
export const PluginAuth = models.PluginAuth;
export const Preset = models.Preset;
export const Project = models.Project;
export const PromptGroup = models.PromptGroup;
// Note: The original Prompt.ts file incorrectly used roleSchema to create a 'Role' model,
// so we maintain the export name 'Prompt' for backward compatibility in metrics code
export const Prompt = models.Role;
export const Session = models.Session;
export const SharedLink = models.SharedLink;
export const Token = models.Token;
export const ToolCall = models.ToolCall;
export const Transaction = models.Transaction;
export const User = models.User;