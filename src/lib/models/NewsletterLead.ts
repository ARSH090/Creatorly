import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INewsletterLead extends Document {
    email: string;
    creatorId: mongoose.Types.ObjectId;
    source?: string; // e.g., 'storefront', 'checkout', 'popup'
    status: 'active' | 'unsubscribed';
    createdAt: Date;
    updatedAt: Date;
}

const NewsletterLeadSchema: Schema = new Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    creatorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    source: {
        type: String,
        default: 'storefront'
    },
    status: {
        type: String,
        enum: ['active', 'unsubscribed'],
        default: 'active',
        index: true
    }
}, { timestamps: true });

// Ensure unique subscription per creator
NewsletterLeadSchema.index({ email: 1, creatorId: 1 }, { unique: true });

const NewsletterLead: Model<INewsletterLead> = mongoose.models.NewsletterLead || mongoose.model<INewsletterLead>('NewsletterLead', NewsletterLeadSchema);
export { NewsletterLead };
export default NewsletterLead;
