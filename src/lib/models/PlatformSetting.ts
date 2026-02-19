import mongoose, { Document, Schema } from 'mongoose';

export interface IPlatformSetting extends Document {
    key: string;
    value: any;
    updatedBy?: mongoose.Types.ObjectId;
    updatedAt: Date;
}

const PlatformSettingSchema = new Schema<IPlatformSetting>(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        value: {
            type: Schema.Types.Mixed,
            required: true
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

export const PlatformSetting = mongoose.models.PlatformSetting || mongoose.model<IPlatformSetting>('PlatformSetting', PlatformSettingSchema);
export default PlatformSetting;
