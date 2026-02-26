import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubscriber extends Document {
    creatorId: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId; // Optional link to User if they have an account
    email: string;
    name?: string;
    status: 'active' | 'unsubscribed' | 'bounced';
    source: string; // e.g. 'storefront', 'checkout'
    createdAt: Date;
    updatedAt: Date;
}

const SubscriberSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    name: { type: String, trim: true },
    status: { type: String, enum: ['active', 'unsubscribed', 'bounced'], default: 'active', index: true },
    source: { type: String, default: 'manual' }
}, { timestamps: true });

// Unique subscriber per creator
SubscriberSchema.index({ email: 1, creatorId: 1 }, { unique: true });

const Subscriber: Model<ISubscriber> = mongoose.models.Subscriber || mongoose.model<ISubscriber>('Subscriber', SubscriberSchema);

export default Subscriber;
