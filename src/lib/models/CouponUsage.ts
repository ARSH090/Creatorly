import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICouponUsage extends Document {
    couponId: mongoose.Types.ObjectId;
    couponCode: string;
    creatorId: mongoose.Types.ObjectId;
    buyerEmail: string;
    productId: mongoose.Types.ObjectId;
    orderId: mongoose.Types.ObjectId;
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
    usedAt: Date;
}

const CouponUsageSchema = new Schema<ICouponUsage>({
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon', required: true, index: true },
    couponCode: { type: String, required: true },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    buyerEmail: { type: String, required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    originalAmount: { type: Number, required: true },
    discountAmount: { type: Number, required: true },
    finalAmount: { type: Number, required: true },
    usedAt: { type: Date, default: Date.now }
});

const CouponUsage: Model<ICouponUsage> = mongoose.models.CouponUsage || mongoose.model<ICouponUsage>('CouponUsage', CouponUsageSchema);
export { CouponUsage };
export default CouponUsage;
