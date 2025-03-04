import mongoose, { Schema, Document } from 'mongoose';
import { conversationPreset } from './ConversationPreset';

export interface IConversation extends Document {
    conversationId: string;
    title: string;
    user?: string;
    messages: mongoose.Types.ObjectId[];
    agentOptions?: any;
    agent_id?: string;
    tags?: string[];
    files?: string[];
    expiredAt?: Date;
    // plus additional fields from conversationPreset
}

const ConversationSchema = new Schema(
    {
        conversationId: { type: String, unique: true, required: true, index: true },
        title: { type: String, default: 'New Chat' },
        user: { type: String, index: true },
        messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
        agentOptions: { type: mongoose.Schema.Types.Mixed },
        ...conversationPreset,
        agent_id: { type: String },
        tags: { type: [String], default: [] },
        files: { type: [String] },
        expiredAt: { type: Date },
    },
    { timestamps: true }
);

// Expire conversation documents when expiredAt is reached
ConversationSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });
ConversationSchema.index({ createdAt: 1, updatedAt: 1 });
ConversationSchema.index({ conversationId: 1, user: 1 }, { unique: true });

export default mongoose.models.Conversation ||
mongoose.model<IConversation>('Conversation', ConversationSchema);