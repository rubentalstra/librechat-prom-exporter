import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  name: string;
  promptGroupIds: mongoose.Types.ObjectId[];
  agentIds: string[];
}

const ProjectSchema = new Schema(
    {
      name: { type: String, required: true, index: true },
      promptGroupIds: { type: [Schema.Types.ObjectId], ref: 'PromptGroup', default: [] },
      agentIds: { type: [String], ref: 'Agent', default: [] },
    },
    { timestamps: true }
);

export default mongoose.model<IProject>('Project', ProjectSchema);