import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IServiceOffering extends Document {
    creatorId: mongoose.Types.ObjectId;
    serviceName: string; // Likely redundant if linked to Product, but good for standalone
    description?: string;
    durationMinutes: number;
    price: number;
    availabilityPattern: {
        days: number[]; // 0-6 (Sun-Sat)
        hours: Array<{ start: string; end: string }>; // HH:mm
        bufferMinutes: number;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ServiceOfferingSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    serviceName: { type: String, required: true },
    description: String,
    durationMinutes: { type: Number, required: true },
    price: { type: Number, required: true },
    availabilityPattern: {
        days: [{ type: Number, min: 0, max: 6 }],
        hours: [{
            start: String,
            end: String
        }],
        bufferMinutes: { type: Number, default: 0 }
    },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

const ServiceOffering: Model<IServiceOffering> = mongoose.models.ServiceOffering || mongoose.model<IServiceOffering>('ServiceOffering', ServiceOfferingSchema);
export { ServiceOffering };
export default ServiceOffering;
