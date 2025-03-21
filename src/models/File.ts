import mongoose from 'mongoose';
import { IMongoFile, fileSchema } from "@librechat/data-schemas";

fileSchema.index({ createdAt: 1, updatedAt: 1 });

export default mongoose.model<IMongoFile>('File', fileSchema);