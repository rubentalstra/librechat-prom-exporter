import mongoose from 'mongoose';
import { ISession, sessionSchema } from "@librechat/data-schemas";

export default mongoose.model<ISession>('Session', sessionSchema);