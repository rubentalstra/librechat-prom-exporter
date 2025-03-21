import mongoose from 'mongoose';
import { IUser, userSchema } from "@librechat/data-schemas";

export default mongoose.model<IUser>('User', userSchema);