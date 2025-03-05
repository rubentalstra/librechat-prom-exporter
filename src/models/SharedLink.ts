import mongoose, { Schema, Document } from 'mongoose';

export interface ISharedLink extends Document {
    conversationId: string;
    title?: string;
    user?: string;
    messages: mongoose.Types.ObjectId[];
    shareId?: string;
    isPublic: boolean;
}

const SharedLinkSchema = new Schema(
    {
        conversationId: { type: String, required: true },
        title: { type: String, index: true },
        user: { type: String, index: true },
        messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
        shareId: { type: String, index: true },
        isPublic: { type: Boolean, default: true },
    },
    { timestamps: true },
);

export default mongoose.model<ISharedLink>('SharedLink', SharedLinkSchema);