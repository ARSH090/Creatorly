import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWhatsAppFlow extends Document {
    creatorId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    trigger: string;
    nodes: Array<{
        id: string;
        type: string;
        position: { x: number; y: number };
        data: Record<string, any>;
    }>;
    edges: Array<{
        id: string;
        source: string;
        target: string;
        label?: string;
    }>;
    isActive: boolean;
    reEnrollmentDays: number;
    stats: {
        enrolled: number;
        completed: number;
        converted: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const WhatsAppFlowSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    trigger: { type: String, required: true },
    nodes: { type: [Schema.Types.Mixed], default: [] },
    edges: { type: [Schema.Types.Mixed], default: [] },
    isActive: { type: Boolean, default: true },
    reEnrollmentDays: { type: Number, default: 0 },
    stats: {
        enrolled: { type: Number, default: 0 },
        completed: { type: Number, default: 0 },
        converted: { type: Number, default: 0 }
    }
}, { timestamps: true });

export const WhatsAppFlow: Model<IWhatsAppFlow> = mongoose.models.WhatsAppFlow || mongoose.model<IWhatsAppFlow>('WhatsAppFlow', WhatsAppFlowSchema);
export default WhatsAppFlow;
