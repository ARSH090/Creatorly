import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmailSequenceStep {
    delayHours: number; // 0 = immediate
    subject: string;
    content: string;
    sequenceOrder: number;
}

export interface IEmailSequence extends Document {
    creatorId: mongoose.Types.ObjectId;
    name: string;
    triggerType: 'signup' | 'purchase' | 'abandoned_cart';
    steps: IEmailSequenceStep[];
    isActive: boolean;
    stats: {
        enrollments: number;
        completed: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const emailSequenceStepSchema = new Schema({
    delayHours: { type: Number, default: 0 },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    sequenceOrder: { type: Number, required: true }
});

const emailSequenceSchema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    triggerType: {
        type: String,
        enum: ['signup', 'purchase', 'abandoned_cart'],
        required: true
    },
    steps: [emailSequenceStepSchema],
    isActive: { type: Boolean, default: false },
    stats: {
        enrollments: { type: Number, default: 0 },
        completed: { type: Number, default: 0 }
    }
}, { timestamps: true });

// Ensure unique name per creator ? usage per user? 
// Maybe just index creatorId and triggerType
emailSequenceSchema.index({ creatorId: 1, triggerType: 1 });

const EmailSequence: Model<IEmailSequence> = mongoose.models.EmailSequence || mongoose.model<IEmailSequence>('EmailSequence', emailSequenceSchema);
export default EmailSequence;
