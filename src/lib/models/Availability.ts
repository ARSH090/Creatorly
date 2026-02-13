import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAvailability extends Document {
    creatorId: mongoose.Types.ObjectId;
    timezone: string;
    schedule: Array<{
        dayOfWeek: number; // 0-6 (Sunday-Saturday)
        startTime: string; // HH:mm format
        endTime: string;
        isAvailable: boolean;
    }>;
    bufferTime: number; // minutes between bookings
    maxBookingsPerDay: number;
    createdAt: Date;
    updatedAt: Date;
}

const AvailabilitySchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
    schedule: [{
        dayOfWeek: { type: Number, min: 0, max: 6 },
        startTime: { type: String },
        endTime: { type: String },
        isAvailable: { type: Boolean, default: true }
    }],
    bufferTime: { type: Number, default: 15 },
    maxBookingsPerDay: { type: Number, default: 10 }
}, { timestamps: true });

const Availability: Model<IAvailability> = mongoose.models.Availability || mongoose.model<IAvailability>('Availability', AvailabilitySchema);
export { Availability };
export default Availability;
