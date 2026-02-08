import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubscription extends Document {
    creatorId: mongoose.Types.ObjectId;
    customerId: string; // Internal or Razorpay Customer ID
    customerEmail: string;
    planId: string; // Razorpay Plan ID
    razorpaySubscriptionId: string;
    status: 'created' | 'authenticated' | 'active' | 'pending' | 'halted' | 'cancelled' | 'completed' | 'expired';
    currentStart: Date;
    currentEnd: Date;
    cancelAtPeriodEnd: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const SubscriptionSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customerEmail: { type: String, required: true },
    planId: { type: String, required: true },
    razorpaySubscriptionId: { type: String, required: true, unique: true },
    status: {
        type: String,
        enum: ['created', 'authenticated', 'active', 'pending', 'halted', 'cancelled', 'completed', 'expired'],
        default: 'created'
    },
    currentStart: { type: Date },
    currentEnd: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
}, { timestamps: true });

const Subscription: Model<ISubscription> = mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
export { Subscription };
export default Subscription;
