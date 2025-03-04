import mongoose, { Schema, Document } from 'mongoose';

export interface IToolCall extends Document {
  conversationId: string;
  messageId: string;
  toolId: string;
  user: mongoose.Types.ObjectId;
  result?: any;
  attachments?: any;
  blockIndex?: number;
  partIndex?: number;
}

const ToolCallSchema = new Schema(
    {
      conversationId: { type: String, required: true },
      messageId: { type: String, required: true },
      toolId: { type: String, required: true },
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      result: Schema.Types.Mixed,
      attachments: Schema.Types.Mixed,
      blockIndex: Number,
      partIndex: Number,
    },
    { timestamps: true }
);

ToolCallSchema.index({ messageId: 1, user: 1 });
ToolCallSchema.index({ conversationId: 1, user: 1 });
export default mongoose.model<IToolCall>('ToolCall', ToolCallSchema);