import mongoose from 'mongoose';
import { IKey, keySchema } from "@librechat/data-schemas";

keySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.model<IKey>('Key', keySchema);