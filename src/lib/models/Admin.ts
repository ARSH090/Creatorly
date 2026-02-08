import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAdmin extends Document {
    userId: mongoose.Types.ObjectId;
    role: 'super_admin' | 'admin' | 'moderator';
    permissions: string[];
    createdAt: Date;
    updatedAt: Date;
}

const AdminSchema: Schema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    role: {
        type: String,
        enum: ['super_admin', 'admin', 'moderator'],
        required: true,
    },
    permissions: [String],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

export default (mongoose.models.Admin as Model<IAdmin>) ||
    mongoose.model<IAdmin>('Admin', AdminSchema);
