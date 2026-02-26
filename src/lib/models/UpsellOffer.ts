import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUpsellOffer extends Document {
    creatorId: mongoose.Types.ObjectId;
    triggerProductId: mongoose.Types.ObjectId;
    offerProductId: mongoose.Types.ObjectId;
    headline: string;
    subheadline?: string;
    bodyCopy?: string;
    priceOverride?: number;
    expiresSeconds: number; // 0 for no expiration
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UpsellOfferSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    triggerProductId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    offerProductId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    headline: { type: String, required: true },
    subheadline: { type: String },
    bodyCopy: { type: String },
    priceOverride: { type: Number },
    expiresSeconds: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });

// Ensure unique upsell per trigger product for a creator
UpsellOfferSchema.index({ triggerProductId: 1, isActive: 1 });

const UpsellOffer: Model<IUpsellOffer> = mongoose.models.UpsellOffer || mongoose.model<IUpsellOffer>('UpsellOffer', UpsellOfferSchema);

export default UpsellOffer;
