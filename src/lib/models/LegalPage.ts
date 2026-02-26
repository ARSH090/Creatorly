import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILegalPage extends Document {
    creatorId: mongoose.Types.ObjectId;
    title: string;
    slug: 'privacy-policy' | 'terms-of-service' | 'refund-policy' | 'shipping-policy' | string;
    content: string; // JSON from Tiptap or HTML
    isActive: boolean;
    updatedAt: Date;
}

const LegalPageSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, index: true },
    content: { type: String, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Ensure unique slug per creator
LegalPageSchema.index({ creatorId: 1, slug: 1 }, { unique: true });

const LegalPage: Model<ILegalPage> = mongoose.models.LegalPage || mongoose.model<ILegalPage>('LegalPage', LegalPageSchema);

export default LegalPage;
