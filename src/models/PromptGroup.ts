import mongoose, { Schema, Document } from 'mongoose';

export interface IPromptGroup extends Document {
    name: string;
    numberOfGenerations: number;
    oneliner: string;
    category: string;
    projectIds: mongoose.Types.ObjectId[];
    productionId: mongoose.Types.ObjectId;
    author: mongoose.Types.ObjectId;
    authorName: string;
    command?: string;
}

const PromptGroupSchema = new Schema(
    {
        name: { type: String, required: true, index: true },
        numberOfGenerations: { type: Number, default: 0 },
        oneliner: { type: String, default: '' },
        category: { type: String, default: '', index: true },
        projectIds: { type: [Schema.Types.ObjectId], ref: 'Project', index: true },
        productionId: { type: Schema.Types.ObjectId, ref: 'Prompt', required: true, index: true },
        author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        authorName: { type: String, required: true },
        command: {
            type: String,
            index: true,
            validate: {
                validator: function (v: string) {
                    return !v || /^[a-z0-9-]+$/.test(v);
                },
                message: (props: any) =>
                    `${props.value} is not a valid command. Only lowercase alphanumeric characters and hyphens are allowed.`,
            },
            maxlength: [
                56,
                `Command cannot be longer than 56 characters`,
            ],
        },
    },
    { timestamps: true },
);

PromptGroupSchema.index({ createdAt: 1, updatedAt: 1 });
export default mongoose.model<IPromptGroup>('PromptGroup', PromptGroupSchema);