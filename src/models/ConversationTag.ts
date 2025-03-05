import mongoose, { Schema, Document } from 'mongoose';

export interface IConversationTag extends Document {
  tag: string;
  user: string;
  description: string;
  count: number;
  position: number;
}

const ConversationTagSchema = new Schema(
    {
      tag: { type: String, index: true },
      user: { type: String, index: true },
      description: { type: String, index: true },
      count: { type: Number, default: 0 },
      position: { type: Number, default: 0, index: true },
    },
    { timestamps: true },
);

ConversationTagSchema.index({ tag: 1, user: 1 }, { unique: true });
export default mongoose.model<IConversationTag>('ConversationTag', ConversationTagSchema);