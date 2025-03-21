import mongoose from 'mongoose';
import { ISharedLink, shareSchema } from "@librechat/data-schemas";

export default mongoose.model<ISharedLink>('SharedLink', shareSchema);