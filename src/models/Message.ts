import mongoose, { Schema, Document } from 'mongoose';

// @ts-ignore
export interface IMessage extends Document {
  messageId: string;
  conversationId: string;
  user: string;
  model?: string;
  endpoint?: string;
  conversationSignature?: string;
  clientId?: string;
  invocationId?: number;
  parentMessageId?: string;
  tokenCount?: number;
  summaryTokenCount?: number;
  sender?: string;
  text: string;
  summary?: string;
  isCreatedByUser: boolean;
  unfinished?: boolean;
  error?: boolean;
  finish_reason?: string;
  _meiliIndex?: boolean;
  files?: any[];
  plugin?: {
    latest?: string;
    inputs?: any[];
    outputs?: string;
  };
  plugins?: any[];
  content?: any[];
  thread_id?: string;
  iconURL?: string;
  attachments?: any[];
  expiredAt?: Date;
}

const MessageSchema = new Schema(
    {
      messageId: { type: String, unique: true, required: true, index: true },
      conversationId: { type: String, index: true, required: true },
      user: { type: String, index: true, required: true, default: null },
      model: { type: String, default: null },
      endpoint: { type: String },
      conversationSignature: { type: String },
      clientId: { type: String },
      invocationId: { type: Number },
      parentMessageId: { type: String },
      tokenCount: { type: Number },
      summaryTokenCount: { type: Number },
      sender: { type: String },
      text: { type: String, required: true },
      summary: { type: String },
      isCreatedByUser: { type: Boolean, required: true, default: false },
      unfinished: { type: Boolean, default: false },
      error: { type: Boolean, default: false },
      finish_reason: { type: String },
      _meiliIndex: { type: Boolean, select: false, default: false },
      files: { type: [{ type: Schema.Types.Mixed }], default: undefined },
      plugin: {
        type: {
          latest: { type: String },
          inputs: { type: [Schema.Types.Mixed], default: undefined },
          outputs: { type: String },
        },
        default: undefined,
      },
      plugins: { type: [{ type: Schema.Types.Mixed }], default: undefined },
      content: { type: [{ type: Schema.Types.Mixed }], default: undefined },
      thread_id: { type: String },
      iconURL: { type: String },
      attachments: { type: [{ type: Schema.Types.Mixed }], default: undefined },
      expiredAt: { type: Date },
    },
    { timestamps: true }
);

MessageSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });
MessageSchema.index({ createdAt: 1 });
MessageSchema.index({ messageId: 1, user: 1 }, { unique: true });

export default mongoose.models.Message ||
mongoose.model<IMessage>('Message', MessageSchema);