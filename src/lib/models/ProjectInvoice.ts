import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProjectInvoice extends Document {
    creatorId: mongoose.Types.ObjectId;
    projectId: mongoose.Types.ObjectId;
    clientEmail: string;
    invoiceNumber: string;
    lineItems: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }>;
    subtotal: number;
    gstAmount: number;
    discountAmount: number;
    totalAmount: number;
    status: 'Draft' | 'Sent' | 'Viewed' | 'Partially Paid' | 'Paid' | 'Overdue';
    dueDate: Date;
    paidAt?: Date;
    paymentMethod?: string;
    razorpayOrderId?: string;
    pdfUrl?: string;
    remindersCount: number;
    lastReminderAt?: Date;
    notes?: string;
    paymentTerms: string;
    createdAt: Date;
    updatedAt: Date;
}

const ProjectInvoiceSchema = new Schema<IProjectInvoice>({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    clientEmail: { type: String, required: true },
    invoiceNumber: { type: String, required: true },
    lineItems: [{
        description: { type: String, required: true },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        total: { type: Number, required: true }
    }],
    subtotal: { type: Number, required: true },
    gstAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['Draft', 'Sent', 'Viewed', 'Partially Paid', 'Paid', 'Overdue'],
        default: 'Draft',
        index: true
    },
    dueDate: { type: Date, required: true },
    paidAt: Date,
    paymentMethod: String,
    razorpayOrderId: String,
    pdfUrl: String,
    remindersCount: { type: Number, default: 0 },
    lastReminderAt: Date,
    notes: String,
    paymentTerms: { type: String, default: 'Net 7' }
}, { timestamps: true });

ProjectInvoiceSchema.index({ creatorId: 1, invoiceNumber: 1 });

const ProjectInvoice: Model<IProjectInvoice> = mongoose.models.ProjectInvoice || mongoose.model<IProjectInvoice>('ProjectInvoice', ProjectInvoiceSchema);
export { ProjectInvoice };
export default ProjectInvoice;
