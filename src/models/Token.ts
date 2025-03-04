import mongoose, { Schema, Document } from 'mongoose';

export interface IToken extends Document {
    userId: mongoose.Types.ObjectId;
    email?: string;
    type?: string;
    identifier?: string;
    token: string;
    createdAt: Date;
    expiresAt: Date;
    metadata?: Map<string, any>;
}

const TokenSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    email: String,
    type: String,
    identifier: String,
    token: { type: String, required: true },
    createdAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true },
    metadata: { type: Map, of: Schema.Types.Mixed },
});

TokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.model<IToken>('Token', TokenSchema);