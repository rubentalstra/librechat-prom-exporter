import mongoose from 'mongoose';
import { IPluginAuth, pluginAuthSchema } from "@librechat/data-schemas";

export default mongoose.models.PluginAuth ||
mongoose.model<IPluginAuth>('PluginAuth', pluginAuthSchema);