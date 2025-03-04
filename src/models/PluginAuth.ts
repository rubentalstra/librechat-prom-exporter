import mongoose, { Schema, Document } from 'mongoose';

export interface IPluginAuth extends Document {
    authField: string;
    value: string;
    userId: string;
    pluginKey?: string;
}

const PluginAuthSchema = new Schema(
    {
        authField: { type: String, required: true },
        value: { type: String, required: true },
        userId: { type: String, required: true },
        pluginKey: { type: String },
    },
    { timestamps: true }
);

export default mongoose.models.PluginAuth ||
mongoose.model<IPluginAuth>('PluginAuth', PluginAuthSchema);