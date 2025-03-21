import mongoose from 'mongoose';
import { ITransaction, transactionSchema } from "@librechat/data-schemas";

export default mongoose.model<ITransaction>('Transaction', transactionSchema);