import mongoose from 'mongoose';
import { assistantSchema, IAssistant } from "@librechat/data-schemas";

export default mongoose.model<IAssistant>('Assistant', assistantSchema);