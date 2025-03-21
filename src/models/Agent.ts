import mongoose from 'mongoose';
import { agentSchema, IAgent } from "@librechat/data-schemas";

export default mongoose.model<IAgent>('Agent', agentSchema);