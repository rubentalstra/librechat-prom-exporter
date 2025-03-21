import mongoose from 'mongoose';
import { IToken, tokenSchema } from "@librechat/data-schemas";

tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.model<IToken>('Token', tokenSchema);