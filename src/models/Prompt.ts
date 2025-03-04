import mongoose, { Schema, Document } from 'mongoose';

/**
 * Enum for Permission Types
 */
export enum PermissionTypes {
    /**
     * Type for Prompt Permissions
     */
    PROMPTS = 'PROMPTS',
    /**
     * Type for Bookmark Permissions
     */
    BOOKMARKS = 'BOOKMARKS',
    /**
     * Type for Agent Permissions
     */
    AGENTS = 'AGENTS',
    /**
     * Type for Multi-Conversation Permissions
     */
    MULTI_CONVO = 'MULTI_CONVO',
    /**
     * Type for Temporary Chat
     */
    TEMPORARY_CHAT = 'TEMPORARY_CHAT',
    /**
     * Type for using the "Run Code" LC Code Interpreter API feature
     */
    RUN_CODE = 'RUN_CODE',
}

/**
 * Enum for Role-Based Access Control Constants
 */
export enum Permissions {
    SHARED_GLOBAL = 'SHARED_GLOBAL',
    USE = 'USE',
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    READ = 'READ',
    READ_AUTHOR = 'READ_AUTHOR',
    SHARE = 'SHARE',
}

export interface IRole extends Document {
    name: string;
    [key: string]: any;
}

const RoleSchema = new Schema({
    name: { type: String, required: true, unique: true, index: true },
    [PermissionTypes.BOOKMARKS]: {
        [Permissions.USE]: { type: Boolean, default: true },
    },
    [PermissionTypes.PROMPTS]: {
        [Permissions.SHARED_GLOBAL]: { type: Boolean, default: false },
        [Permissions.USE]: { type: Boolean, default: true },
        [Permissions.CREATE]: { type: Boolean, default: true },
    },
    [PermissionTypes.AGENTS]: {
        [Permissions.SHARED_GLOBAL]: { type: Boolean, default: false },
        [Permissions.USE]: { type: Boolean, default: true },
        [Permissions.CREATE]: { type: Boolean, default: true },
    },
    [PermissionTypes.MULTI_CONVO]: {
        [Permissions.USE]: { type: Boolean, default: true },
    },
    [PermissionTypes.TEMPORARY_CHAT]: {
        [Permissions.USE]: { type: Boolean, default: true },
    },
    [PermissionTypes.RUN_CODE]: {
        [Permissions.USE]: { type: Boolean, default: true },
    },
});

export default mongoose.model<IRole>('Role', RoleSchema);