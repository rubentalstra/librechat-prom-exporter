import mongoose from 'mongoose';
import { IToolCallData, toolCallSchema } from "@librechat/data-schemas";

toolCallSchema.index({ messageId: 1, user: 1 });
toolCallSchema.index({ conversationId: 1, user: 1 });
export default mongoose.model<IToolCallData>('ToolCall', toolCallSchema);