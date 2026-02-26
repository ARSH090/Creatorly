import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITaxSetting extends Document {
    creatorId: mongoose.Types.ObjectId;
    countryCode: string; // 'IN', 'US', etc.
    stateCode?: string; // Optional for state-specific tax
    taxName: string; // e.g., 'GST', 'VAT', 'Sales Tax'
    taxRate: number; // e.g., 18 for 18%
    isInclusive: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const TaxSettingSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    countryCode: { type: String, required: true, uppercase: true },
    stateCode: { type: String, uppercase: true },
    taxName: { type: String, required: true },
    taxRate: { type: Number, required: true, min: 0 },
    isInclusive: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Ensure unique tax rule per country/state for a creator
TaxSettingSchema.index({ creatorId: 1, countryCode: 1, stateCode: 1 }, { unique: true });

const TaxSetting: Model<ITaxSetting> = mongoose.models.TaxSetting || mongoose.model<ITaxSetting>('TaxSetting', TaxSettingSchema);

export default TaxSetting;
