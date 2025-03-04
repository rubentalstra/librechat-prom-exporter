import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  label: string;
  value: string;
}

const CategoriesSchema = new Schema({
  label: { type: String, required: true, unique: true },
  value: { type: String, required: true, unique: true },
});

export default mongoose.model<ICategory>('categories', CategoriesSchema);