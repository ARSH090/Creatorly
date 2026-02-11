import mongoose, { Schema, Document, Model } from 'mongoose';

export enum MembershipRole {
    OWNER = 'owner',
    ADMIN = 'admin',
    MEMBER = 'member',
    GUEST = 'guest'
}

export enum MembershipStatus {
    ACTIVE = 'active',
    PENDING = 'pending', // Invited but not yet accepted
    SUSPENDED = 'suspended',
    REJECTED = 'rejected'
}

export interface IMembership extends Document {
    teamId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    role: MembershipRole;
    status: MembershipStatus;
    invitedBy?: mongoose.Types.ObjectId;
    invitedEmail?: string; // For tracking invites to non-users
    joinedAt?: Date;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const MembershipSchema: Schema = new Schema({
    teamId: {
        type: Schema.Types.ObjectId,
        ref: 'Team',
        required: true,
        index: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true,
    },
    role: {
        type: String,
        enum: Object.values(MembershipRole),
        default: MembershipRole.MEMBER,
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(MembershipStatus),
        default: MembershipStatus.PENDING,
        required: true,
        index: true,
    },
    invitedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    invitedEmail: {
        type: String,
        lowercase: true,
        trim: true,
    },
    joinedAt: Date,
    deletedAt: {
        type: Date,
        index: true,
    },
}, { timestamps: true });

// Prevent duplicate memberships in the same team
MembershipSchema.index({ teamId: 1, userId: 1 }, { unique: true, sparse: true });
// Also index invitedEmail for lookup before user creation
MembershipSchema.index({ teamId: 1, invitedEmail: 1 }, { unique: true, sparse: true });

const Membership = (mongoose.models.Membership as Model<IMembership>) || mongoose.model<IMembership>('Membership', MembershipSchema);

export { Membership };
export default Membership;
