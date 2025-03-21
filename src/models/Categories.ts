import mongoose from 'mongoose';
import { categoriesSchema, ICategory } from "@librechat/data-schemas";

export default mongoose.model<ICategory>('categories', categoriesSchema);