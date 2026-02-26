import mongoose, { Schema, Document } from 'mongoose';

export interface ICreatorAvailability extends Document {
    creatorId: mongoose.Types.ObjectId;
    timezone: string;
    weeklySchedule: {
        monday: Array<{ start: string; end: string }>;
        tuesday: Array<{ start: string; end: string }>;
        wednesday: Array<{ start: string; end: string }>;
        thursday: Array<{ start: string; end: string }>;
        friday: Array<{ start: string; end: string }>;
        saturday: Array<{ start: string; end: string }>;
        sunday: Array<{ start: string; end: string }>;
    };
    dateOverrides: Array<{
        date: Date;
        available: boolean;
        slots: Array<{ start: string; end: string }>;
    }>;
    googleCalendarConnected: boolean;
    googleCalendarId?: string;
    googleTokens?: {
        accessToken: string;
        refreshToken: string;
        expiryDate: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const SlotSchema = new Schema({
    start: { type: String, required: true }, // e.g. "09:00"
    end: { type: String, required: true }   // e.g. "18:00"
}, { _id: false });

const CreatorAvailabilitySchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    timezone: { type: String, default: 'UTC' },
    weeklySchedule: {
        monday: { type: [SlotSchema], default: [{ start: '09:00', end: '17:00' }] },
        tuesday: { type: [SlotSchema], default: [{ start: '09:00', end: '17:00' }] },
        wednesday: { type: [SlotSchema], default: [{ start: '09:00', end: '17:00' }] },
        thursday: { type: [SlotSchema], default: [{ start: '09:00', end: '17:00' }] },
        friday: { type: [SlotSchema], default: [{ start: '09:00', end: '17:00' }] },
        saturday: { type: [SlotSchema], default: [] },
        sunday: { type: [SlotSchema], default: [] }
    },
    dateOverrides: [{
        date: Date,
        available: { type: Boolean, default: false },
        slots: [SlotSchema]
    }],
    googleCalendarConnected: { type: Boolean, default: false },
    googleCalendarId: String,
    googleTokens: {
        accessToken: String,
        refreshToken: String,
        expiryDate: Number
    }
}, {
    timestamps: true
});

export const CreatorAvailability = mongoose.models.CreatorAvailability || mongoose.model<ICreatorAvailability>('CreatorAvailability', CreatorAvailabilitySchema);
