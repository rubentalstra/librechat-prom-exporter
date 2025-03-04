import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name?: string;
    username?: string;
    email: string;
    emailVerified: boolean;
    password?: string;
    avatar?: string;
    provider: string;
    role?: string;
    googleId?: string;
    facebookId?: string;
    openidId?: string;
    ldapId?: string;
    githubId?: string;
    discordId?: string;
    appleId?: string;
    plugins?: any[];
    totpSecret?: string;
    backupCodes?: any[];
    refreshToken?: any[];
    expiresAt?: Date;
    termsAccepted?: boolean;
}

const backupCodeSchema = new Schema({
    codeHash: { type: String, required: true },
    used: { type: Boolean, default: false },
    usedAt: { type: Date, default: null },
});

const SessionSchema = new Schema({
    refreshToken: { type: String, default: '' },
});

const UserSchema = new Schema(
    {
        name: String,
        username: { type: String, lowercase: true, default: '' },
        email: {
            type: String,
            required: [true, "can't be blank"],
            lowercase: true,
            unique: true,
            match: [/\S+@\S+\.\S+/, 'is invalid'],
            index: true,
        },
        emailVerified: { type: Boolean, required: true, default: false },
        password: { type: String, trim: true, minlength: 8, maxlength: 128 },
        avatar: String,
        provider: { type: String, required: true, default: 'local' },
        role: { type: String, default: 'USER' },
        googleId: { type: String, unique: true, sparse: true },
        facebookId: { type: String, unique: true, sparse: true },
        openidId: { type: String, unique: true, sparse: true },
        ldapId: { type: String, unique: true, sparse: true },
        githubId: { type: String, unique: true, sparse: true },
        discordId: { type: String, unique: true, sparse: true },
        appleId: { type: String, unique: true, sparse: true },
        plugins: { type: Array },
        totpSecret: String,
        backupCodes: { type: [backupCodeSchema] },
        refreshToken: { type: [SessionSchema] },
        expiresAt: { type: Date, expires: 604800 },
        termsAccepted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);