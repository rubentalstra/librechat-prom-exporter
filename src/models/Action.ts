import mongoose from 'mongoose';
import { actionSchema, IAction } from "@librechat/data-schemas";

export default mongoose.model<IAction>('Action', actionSchema);