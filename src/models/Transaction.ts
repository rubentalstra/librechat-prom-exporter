import mongoose from 'mongoose';
import { ITransaction, transactionSchema } from "@librechat/data-schemas";

transactionSchema.index({ model: 1 });

export default mongoose.model<ITransaction>('Transaction', transactionSchema);