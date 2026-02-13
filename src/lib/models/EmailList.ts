import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmailList extends Document {
    creatorId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    subscribers: any[]; // Array of subscriber references or embedded objects?
    // Usually list contains references to subscribers or rules.
    // For simplicity, let's say it just tracks count or holds IDs.
    // But subscribers are often dynamically queried or stored in a separate collection.
    // Step 1392 uses `list.subscribers?.length`.
    createdAt: Date;
    updatedAt: Date;
}

const EmailListSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    subscribers: [{ type: String }] // Array of emails or IDs
}, { timestamps: true });

// Ensure unique name per creator
EmailListSchema.index({ creatorId: 1, name: 1 }, { unique: true });

const EmailList: Model<IEmailList> = mongoose.models.EmailList || mongoose.model<IEmailList>('EmailList', EmailListSchema);
export { EmailList };
export default EmailList;
