import mongoose from 'mongoose';
import { IMessage, messageSchema } from "@librechat/data-schemas";

messageSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });
messageSchema.index({ createdAt: 1 });
messageSchema.index({ messageId: 1, user: 1 }, { unique: true });

export default mongoose.models.Message ||
mongoose.model<IMessage>('Message', messageSchema);