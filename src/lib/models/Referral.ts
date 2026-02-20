import mongoose, { Schema, model, models } from 'mongoose';

export interface IReferral {
    userId: string; // Clerk user ID
    code: string; // unique referral code
    clicks: number; // number of visits to /ref/[code]
    conversions: number; // number of leads attributed
    createdAt: Date;
    updatedAt: Date;
}

const ReferralSchema = new Schema<IReferral>(
    {
        userId: { type: String, required: true, unique: true, index: true },
        code: { type: String, required: true, unique: true },
        clicks: { type: Number, default: 0 },
        conversions: { type: Number, default: 0 },
    },
    { timestamps: true }
);

const Referral = models.Referral || model<IReferral>('Referral', ReferralSchema);
export default Referral;
