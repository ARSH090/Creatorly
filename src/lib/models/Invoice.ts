import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInvoice extends Document {
    invoiceNumber: string;
    creatorId?: mongoose.Types.ObjectId; // Optional: Creator for product invoices
    userId: mongoose.Types.ObjectId; // MongoDB User ID
    orderId?: mongoose.Types.ObjectId; // Optional: Linked to an Order
    subscriptionId?: mongoose.Types.ObjectId; // Optional: Linked to a Subscription

    amount: number;
    currency: string;
    status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled';

    customerDetails: {
        name?: string;
        email: string;
        address?: {
            street?: string;
            city?: string;
            state?: string;
            zip?: string;
            country?: string;
        };
    };

    pdfUrl?: string; // S3 link to generated invoice
    issuedAt: Date;
    dueDate?: Date;
    paidAt?: Date;

    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const InvoiceSchema: Schema = new Schema({
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', index: true },
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription', index: true },

    amount: { type: Number, required: true, min: 0, set: Math.round },
    currency: { type: String, default: 'INR' },
    status: {
        type: String,
        enum: ['draft', 'issued', 'paid', 'overdue', 'cancelled'],
        default: 'issued',
        index: true
    },

    customerDetails: {
        name: String,
        email: { type: String, required: true },
        address: {
            street: String,
            city: String,
            state: String,
            zip: String,
            country: String
        }
    },

    pdfUrl: { type: String },
    issuedAt: { type: Date, default: Date.now },
    dueDate: { type: Date },
    paidAt: { type: Date },
    metadata: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

// Export the model
const Invoice: Model<IInvoice> = mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
export { Invoice };
export default Invoice;
