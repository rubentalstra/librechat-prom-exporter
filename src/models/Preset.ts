import mongoose, { Schema, Document } from 'mongoose';
import { conversationPreset } from './ConversationPreset';

export interface IPreset extends Document {
    presetId: string;
    title: string;
    user?: string;
    defaultPreset?: boolean;
    order?: number;
    agentOptions?: any;
    // plus conversationPreset fields…
}

const PresetSchema = new Schema(
    {
        presetId: { type: String, unique: true, required: true, index: true },
        title: { type: String, default: 'New Chat' },
        user: { type: String, default: null },
        defaultPreset: Boolean,
        order: Number,
        ...conversationPreset,
        agentOptions: { type: Schema.Types.Mixed, default: null },
    },
    { timestamps: true },
);

export default mongoose.models.Preset ||
mongoose.model<IPreset>('Preset', PresetSchema);