import mongoose, { Schema, Document } from 'mongoose';
// If FileSources is not available, you can use a fallback string.
const FileSources = { local: 'local' };

// @ts-ignore
export interface IFile extends Document {
  user: mongoose.Types.ObjectId;
  conversationId?: string;
  file_id: string;
  temp_file_id?: string;
  bytes: number;
  filename: string;
  filepath: string;
  object: string;
  type: string;
  context?: string;
  usage: number;
  source: string;
  model?: string;
  width?: number;
  height?: number;
  metadata?: { fileIdentifier?: string };
  expiresAt?: Date;
}

const FileSchema = new Schema(
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
      conversationId: { type: String, ref: 'Conversation', index: true },
      file_id: { type: String, index: true },
      temp_file_id: { type: String },
      bytes: { type: Number, required: true },
      filename: { type: String, required: true },
      filepath: { type: String, required: true },
      object: { type: String, required: true, default: 'file' },
      embedded: Boolean,
      type: { type: String, required: true },
      context: String,
      usage: { type: Number, required: true, default: 0 },
      source: { type: String, default: FileSources.local },
      model: String,
      width: Number,
      height: Number,
      metadata: { fileIdentifier: String },
      expiresAt: { type: Date, expires: 3600 },
    },
    { timestamps: true },
);

FileSchema.index({ createdAt: 1, updatedAt: 1 });

export default mongoose.model<IFile>('File', FileSchema);