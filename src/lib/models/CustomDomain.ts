import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICustomDomain extends Document {
    creatorId: mongoose.Types.ObjectId;
    domain: string;
    status: 'pending' | 'verified' | 'failed';
    dnsRecords: {
        type: string;
        name: string;
        value: string;
        verified: boolean;
    }[];
    sslStatus: 'pending' | 'active' | 'failed';
    verifiedAt?: Date;
    verificationToken?: string;
    lastChecked?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const CustomDomainSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    domain: { type: String, required: true, unique: true, lowercase: true },
    status: {
        type: String,
        enum: ['pending', 'verified', 'failed'],
        default: 'pending'
    },
    dnsRecords: [{
        type: { type: String },
        name: { type: String },
        value: { type: String },
        verified: { type: Boolean, default: false }
    }],
    sslStatus: {
        type: String,
        enum: ['pending', 'active', 'failed'],
        default: 'pending'
    },
    verifiedAt: { type: Date },
    verificationToken: { type: String },
    lastChecked: { type: Date }
}, { timestamps: true });



const CustomDomain: Model<ICustomDomain> = mongoose.models.CustomDomain || mongoose.model<ICustomDomain>('CustomDomain', CustomDomainSchema);
export { CustomDomain };
export default CustomDomain;
