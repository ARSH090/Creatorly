import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITeam extends Document {
    name: string;
    slug: string;
    ownerId: mongoose.Types.ObjectId;
    avatar?: string;
    description?: string;
    settings: {
        branding?: {
            logo?: string;
            primaryColor?: string;
        };
        allowMemberInvites: boolean;
        maxMembers: number;
    };
    subscriptionId?: mongoose.Types.ObjectId;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const TeamSchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    avatar: String,
    description: String,
    settings: {
        branding: {
            logo: String,
            primaryColor: String,
        },
        allowMemberInvites: {
            type: Boolean,
            default: true,
        },
        maxMembers: {
            type: Number,
            default: 1, // Default limit for free teams
        },
    },
    subscriptionId: {
        type: Schema.Types.ObjectId,
        ref: 'Subscription',
    },
    deletedAt: {
        type: Date,
        index: true,
    },
}, { timestamps: true });

// Ensure slugs are unique and handle collisions manually if needed
TeamSchema.index({ name: 'text', description: 'text' });

const Team = (mongoose.models.Team as Model<ITeam>) || mongoose.model<ITeam>('Team', TeamSchema);

export { Team };
export default Team;
