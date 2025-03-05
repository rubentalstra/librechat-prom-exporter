import mongoose, { Schema, Document } from 'mongoose';

// @ts-ignore
export interface IAgent extends Document {
  id: string;
  name?: string;
  description?: string;
  instructions?: string;
  avatar?: { filepath: string; source: string };
  provider: string;
  model: string;
  model_parameters?: object;
  artifacts?: string;
  access_level?: number;
  tools?: string[];
  tool_kwargs?: any[];
  actions?: string[];
  author: mongoose.Types.ObjectId;
  authorName?: string;
  hide_sequential_outputs?: boolean;
  end_after_tools?: boolean;
  agent_ids?: string[];
  isCollaborative?: boolean;
  conversation_starters?: string[];
  tool_resources?: any;
  projectIds?: mongoose.Types.ObjectId[];
}

const AgentSchema = new Schema(
    {
      id: { type: String, index: true, unique: true, required: true },
      name: String,
      description: String,
      instructions: String,
      avatar: { type: { filepath: String, source: String }, default: undefined },
      provider: { type: String, required: true },
      model: { type: String, required: true },
      model_parameters: { type: Object },
      artifacts: String,
      access_level: Number,
      tools: { type: [String], default: undefined },
      tool_kwargs: { type: [{ type: Schema.Types.Mixed }] },
      actions: { type: [String], default: undefined },
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      authorName: { type: String, default: undefined },
      hide_sequential_outputs: Boolean,
      end_after_tools: Boolean,
      agent_ids: { type: [String] },
      isCollaborative: { type: Boolean, default: undefined },
      conversation_starters: { type: [String], default: [] },
      tool_resources: { type: Schema.Types.Mixed, default: {} },
      projectIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'Project', index: true },
    },
    { timestamps: true },
);

export default mongoose.model<IAgent>('Agent', AgentSchema);