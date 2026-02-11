import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IScheduledContent extends Document {
    creatorId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    title: string;
    description: string;
    scheduledAt: Date;
    status: 'scheduled' | 'published' | 'failed';
    publishedAt?: Date;
    social: {
        twitter?: boolean;
        instagram?: boolean;
        facebook?: boolean;
        tiktok?: boolean;
    };
    hashtags: string[];
    imageUrl?: string;
    videoUrl?: string;
    error?: string;
    deletedAt?: Date;
}



const ScheduledContentSchema: Schema = new Schema({
    creatorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    scheduledAt: {
        type: Date,
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: ['scheduled', 'published', 'failed'],
        default: 'scheduled',
    },
    publishedAt: Date,
    social: {
        twitter: Boolean,
        instagram: Boolean,
        facebook: Boolean,
        tiktok: Boolean,
    },
    hashtags: [String],
    imageUrl: String,
    videoUrl: String,
    error: String,
    deletedAt: { type: Date, index: true }

}, { timestamps: true });


export default (mongoose.models.ScheduledContent as Model<IScheduledContent>) ||
    mongoose.model<IScheduledContent>('ScheduledContent', ScheduledContentSchema);
