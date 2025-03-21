import mongoose from 'mongoose';
import { IConversation, convoSchema } from "@librechat/data-schemas";

// Expire conversation documents when expiredAt is reached
convoSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });
convoSchema.index({ createdAt: 1, updatedAt: 1 });
convoSchema.index({ conversationId: 1, user: 1 }, { unique: true });

export default mongoose.models.Conversation ||
mongoose.model<IConversation>('Conversation', convoSchema);