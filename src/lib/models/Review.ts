import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReview extends Document {
    productId: mongoose.Types.ObjectId;
    creatorId: mongoose.Types.ObjectId;
    buyerEmail: string;
    buyerName: string;
    orderId: mongoose.Types.ObjectId;
    rating: number; // 1-5
    reviewText: string;
    creatorReply?: string;
    creatorRepliedAt?: Date;
    isHidden: boolean;
    isVerifiedPurchase: boolean;
    helpfulCount: number;
    importedFrom?: 'google' | 'topmate' | 'manual';
    reviewToken?: string; // for one-click collection
    createdAt: Date;
    updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    buyerEmail: { type: String, required: true },
    buyerName: { type: String, required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    reviewText: { type: String, required: true },
    creatorReply: String,
    creatorRepliedAt: Date,
    isHidden: { type: Boolean, default: false },
    isVerifiedPurchase: { type: Boolean, default: true },
    helpfulCount: { type: Number, default: 0 },
    importedFrom: String,
    reviewToken: String
}, { timestamps: true });

ReviewSchema.index({ productId: 1, createdAt: -1 });

const Review: Model<IReview> = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
export { Review };
export default Review;
