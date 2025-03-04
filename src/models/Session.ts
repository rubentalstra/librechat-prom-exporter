import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
    refreshTokenHash: string;
    expiration: Date;
    user: mongoose.Types.ObjectId;
}

const SessionSchema = new Schema({
    refreshTokenHash: { type: String, required: true },
    expiration: { type: Date, required: true, expires: 0 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

export default mongoose.model<ISession>('Session', SessionSchema);