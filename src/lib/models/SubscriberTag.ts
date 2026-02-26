import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubscriberTag extends Document {
    creatorId: mongoose.Types.ObjectId;
    subscriberId: mongoose.Types.ObjectId;
    tag: string;
    source: string; // 'manual', 'purchase', 'automation'
    createdAt: Date;
}

const SubscriberTagSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subscriberId: { type: Schema.Types.ObjectId, ref: 'Subscriber', required: true, index: true },
    tag: { type: String, required: true, trim: true },
    source: { type: String, default: 'manual' }
}, { timestamps: true });

// Unique tag per subscriber
SubscriberTagSchema.index({ subscriberId: 1, tag: 1 }, { unique: true });
SubscriberTagSchema.index({ creatorId: 1, tag: 1 });

const SubscriberTag: Model<ISubscriberTag> = mongoose.models.SubscriberTag || mongoose.model<ISubscriberTag>('SubscriberTag', SubscriberTagSchema);

export default SubscriberTag;
