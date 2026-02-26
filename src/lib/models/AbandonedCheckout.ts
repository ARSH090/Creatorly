import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAbandonedCheckout extends Document {
    creatorId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    buyerEmail: string;
    buyerName?: string;
    productPrice: number;
    couponCode?: string;
    status: 'abandoned' | 'recovered' | 'expired';
    recoveryEmail1SentAt?: Date;
    recoveryEmail2SentAt?: Date;
    recoveryEnded: boolean;
    capturedAt: Date;
    recoveredAt?: Date;
    recoveredOrderId?: mongoose.Types.ObjectId;
}

const AbandonedCheckoutSchema = new Schema<IAbandonedCheckout>({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    buyerEmail: { type: String, required: true, index: true },
    buyerName: String,
    productPrice: { type: Number, required: true },
    couponCode: String,
    status: {
        type: String,
        enum: ['abandoned', 'recovered', 'expired'],
        default: 'abandoned'
    },
    recoveryEmail1SentAt: Date,
    recoveryEmail2SentAt: Date,
    recoveryEnded: { type: Boolean, default: false },
    capturedAt: { type: Date, default: Date.now },
    recoveredAt: Date,
    recoveredOrderId: { type: Schema.Types.ObjectId, ref: 'Order' }
}, { timestamps: true });

AbandonedCheckoutSchema.index({ buyerEmail: 1, creatorId: 1 });

const AbandonedCheckout: Model<IAbandonedCheckout> = mongoose.models.AbandonedCheckout || mongoose.model<IAbandonedCheckout>('AbandonedCheckout', AbandonedCheckoutSchema);
export { AbandonedCheckout };
export default AbandonedCheckout;
