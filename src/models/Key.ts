import mongoose, { Schema, Document } from 'mongoose';

export interface IKey extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    value: string;
    expiresAt?: Date;
}

const KeySchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    value: { type: String, required: true },
    expiresAt: Date,
});

KeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.model<IKey>('Key', KeySchema);