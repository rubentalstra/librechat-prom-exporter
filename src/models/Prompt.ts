import mongoose from 'mongoose';
import { IRole, roleSchema } from "@librechat/data-schemas";

export default mongoose.model<IRole>('Role', roleSchema);