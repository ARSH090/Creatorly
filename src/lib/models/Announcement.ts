import mongoose, { Document, Schema } from 'mongoose';

export interface IAnnouncement extends Document {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'danger' | 'success' | 'sale';
    targetPlan: string; // 'all', 'free', 'pro', 'elite', etc.
    isActive: boolean;
    link?: string;
    buttonText?: string;
    expiresAt?: Date;
    createdBy: string; // Admin email
    createdAt: Date;
    updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
    {
        title: { type: String, required: true },
        message: { type: String, required: true },
        type: {
            type: String,
            enum: ['info', 'warning', 'danger', 'success', 'sale'],
            default: 'info',
        },
        targetPlan: { type: String, default: 'all' },
        isActive: { type: Boolean, default: true },
        link: String,
        buttonText: String,
        expiresAt: Date,
        createdBy: { type: String, required: true },
    },
    { timestamps: true }
);

announcementSchema.index({ isActive: 1, targetPlan: 1 });

const Announcement = mongoose.models.Announcement || mongoose.model<IAnnouncement>('Announcement', announcementSchema);
export default Announcement;
