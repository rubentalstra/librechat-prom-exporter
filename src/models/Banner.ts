import mongoose from 'mongoose';
import { bannerSchema, IBanner } from "@librechat/data-schemas";

export default mongoose.model<IBanner>('Banner', bannerSchema);