import mongoose from 'mongoose';
import { balanceSchema, IBalance } from "@librechat/data-schemas";

export default mongoose.model<IBalance>('Balance', balanceSchema);