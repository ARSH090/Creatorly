import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISequenceEnrollment extends Document {
    email: string;
    sequenceId: mongoose.Types.ObjectId;
    creatorId: mongoose.Types.ObjectId;
    currentStep: number;
    nextStepDueAt: Date;
    status: 'active' | 'completed' | 'cancelled';
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
}

const SequenceEnrollmentSchema = new Schema({
    email: { type: String, required: true, index: true },
    sequenceId: { type: Schema.Types.ObjectId, ref: 'EmailSequence', required: true, index: true },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    currentStep: { type: Number, default: 0 },
    nextStepDueAt: { type: Date, required: true, index: true },
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active',
        index: true
    },
    metadata: { type: Schema.Types.Mixed }
}, { timestamps: true });

// Prevent duplicate active enrollments for the same email and sequence
SequenceEnrollmentSchema.index({ email: 1, sequenceId: 1, status: 1 }, {
    unique: true,
    partialFilterExpression: { status: 'active' }
});

const SequenceEnrollment: Model<ISequenceEnrollment> = mongoose.models.SequenceEnrollment ||
    mongoose.model<ISequenceEnrollment>('SequenceEnrollment', SequenceEnrollmentSchema);

export default SequenceEnrollment;
