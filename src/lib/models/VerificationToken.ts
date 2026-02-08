import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVerificationToken extends Document {
    email: string;
    token: string;
    type: 'email' | 'password_reset';
    expiresAt: Date;
    createdAt: Date;
}

const VerificationTokenSchema: Schema = new Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
    },
    token: {
        type: String,
        required: true,
        unique: true,
    },
    type: {
        type: String,
        enum: ['email', 'password_reset'],
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }, // Auto-delete after expiration
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Create index for email + type queries
VerificationTokenSchema.index({ email: 1, type: 1 });

export default (mongoose.models.VerificationToken as Model<IVerificationToken>) || 
    mongoose.model<IVerificationToken>('VerificationToken', VerificationTokenSchema);
