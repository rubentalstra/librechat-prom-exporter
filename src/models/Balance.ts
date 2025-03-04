import mongoose, { Schema, Document } from 'mongoose';

export interface IBalance extends Document {
  user: mongoose.Types.ObjectId;
  tokenCredits: number;
}

const BalanceSchema = new Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  tokenCredits: { type: Number, default: 0 },
});

export default mongoose.model<IBalance>('Balance', BalanceSchema);