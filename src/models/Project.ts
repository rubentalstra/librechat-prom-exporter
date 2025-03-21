import mongoose from 'mongoose';
import { IMongoProject, projectSchema } from "@librechat/data-schemas";

export default mongoose.model<IMongoProject>('Project', projectSchema);