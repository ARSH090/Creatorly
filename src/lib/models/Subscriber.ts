import mongoose, { Schema, Document, Model } from 'mongoose';
import crypto from 'crypto';

export interface ISubscriber extends Document {
    creatorId: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId; // Optional link to User if they have an account
    email: string;
    name?: string;
    status: 'active' | 'unsubscribed' | 'bounced';
    source: string; // e.g. 'storefront', 'checkout'
    orderCount: number;
    totalSpent: number;
    unsubscribeToken: string;
    unsubscribedAt?: Date;
    bouncedAt?: Date;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
}

const SubscriberSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    name: { type: String, trim: true },
    status: { type: String, enum: ['active', 'unsubscribed', 'bounced'], default: 'active', index: true },
    source: { type: String, default: 'manual' },
    orderCount: { type: Number, default: 0, min: 0 },
    totalSpent: { type: Number, default: 0, min: 0 },
    unsubscribeToken: { type: String, default: () => crypto.randomBytes(32).toString('hex') },
    unsubscribedAt: { type: Date },
    bouncedAt: { type: Date },
    tags: [{ type: String }]
}, { timestamps: true });

// Unique subscriber per creator
SubscriberSchema.index({ email: 1, creatorId: 1 }, { unique: true });

const Subscriber: Model<ISubscriber> = mongoose.models.Subscriber || mongoose.model<ISubscriber>('Subscriber', SubscriberSchema);

export default Subscriber;
