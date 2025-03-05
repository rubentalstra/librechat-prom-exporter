import mongoose, { Schema, Document } from 'mongoose';

// @ts-ignore
export interface ITransaction extends Document {
    user: mongoose.Types.ObjectId;
    conversationId?: string;
    tokenType: 'prompt' | 'completion' | 'credits';
    model?: string;
    context?: string;
    valueKey?: string;
    rate?: number;
    rawAmount?: number;
    tokenValue?: number;
    inputTokens?: number;
    writeTokens?: number;
    readTokens?: number;
}

const TransactionSchema = new Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
        conversationId: { type: String, ref: 'Conversation', index: true },
        tokenType: { type: String, enum: ['prompt', 'completion', 'credits'], required: true },
        model: { type: String },
        context: String,
        valueKey: String,
        rate: Number,
        rawAmount: Number,
        tokenValue: Number,
        inputTokens: Number,
        writeTokens: Number,
        readTokens: Number,
    },
    { timestamps: true },
);

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);