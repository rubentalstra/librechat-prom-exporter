import mongoose from 'mongoose';
import { IPreset, presetSchema } from "@librechat/data-schemas";

export default mongoose.models.Preset ||
mongoose.model<IPreset>('Preset', presetSchema);