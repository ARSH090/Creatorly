import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWhatsAppContact extends Document {
    creatorId: mongoose.Types.ObjectId;
    phone: string; // +91XXXXXXXXXX
    name?: string;
    waId?: string; // WhatsApp ID from API
    tags: string[];
    source?: string;
    optedOut: boolean;
    conversationStatus: 'active' | 'closed' | 'human_needed';
    activeFlowId?: mongoose.Types.ObjectId;
    activeFlowStep?: number;
    lastMessageAt?: Date;
    notes?: string;
    totalPurchases: number;
    totalSpend: number;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const WhatsAppContactSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    phone: { type: String, required: true, index: true },
    name: { type: String },
    waId: { type: String, index: true },
    tags: [{ type: String }],
    source: { type: String },
    optedOut: { type: Boolean, default: false },
    conversationStatus: {
        type: String,
        enum: ['active', 'closed', 'human_needed'],
        default: 'active'
    },
    activeFlowId: { type: Schema.Types.ObjectId, ref: 'WhatsAppFlow' },
    activeFlowStep: { type: Number },
    lastMessageAt: { type: Date },
    notes: { type: String },
    totalPurchases: { type: Number, default: 0 },
    totalSpend: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

WhatsAppContactSchema.index({ creatorId: 1, phone: 1 }, { unique: true });
WhatsAppContactSchema.index({ creatorId: 1, tags: 1 });

export const WhatsAppContact: Model<IWhatsAppContact> = mongoose.models.WhatsAppContact || mongoose.model<IWhatsAppContact>('WhatsAppContact', WhatsAppContactSchema);
export default WhatsAppContact;
