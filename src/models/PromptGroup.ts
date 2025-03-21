import mongoose from 'mongoose';
import { IPromptGroup, promptGroupSchema } from "@librechat/data-schemas";

promptGroupSchema.index({ createdAt: 1, updatedAt: 1 });
export default mongoose.model<IPromptGroup>('PromptGroup', promptGroupSchema);