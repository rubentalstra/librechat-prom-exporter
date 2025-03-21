import mongoose from 'mongoose';
import { conversationTagSchema, IConversationTag } from "@librechat/data-schemas";

conversationTagSchema.index({ tag: 1, user: 1 }, { unique: true });
export default mongoose.model<IConversationTag>('ConversationTag', conversationTagSchema);