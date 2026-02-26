import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
    creatorId: mongoose.Types.ObjectId;
    serviceId: mongoose.Types.ObjectId;
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    customFieldAnswers?: Record<string, any>;
    date: Date;
    startTime: Date;
    endTime: Date;
    timezone: string;
    status: 'confirmed' | 'completed' | 'cancelled' | 'no_show';
    meetingLink?: string;
    zoomMeetingId?: string;
    paymentStatus: 'free' | 'paid' | 'pending' | 'refunded';
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    amount: number;
    cancellationToken: string;
    rescheduledFrom?: mongoose.Types.ObjectId;
    remindersSent: string[]; // IDs of reminders already sent
    followUpSent: boolean;
    creatorNotes?: string;
    cancelReason?: string;
    packageId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const BookingSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'BookingService', required: true, index: true },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true, index: true },
    clientPhone: { type: String },
    customFieldAnswers: { type: Schema.Types.Mixed },
    date: { type: Date, required: true, index: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    timezone: { type: String, required: true },
    status: {
        type: String,
        enum: ['confirmed', 'completed', 'cancelled', 'no_show'],
        default: 'confirmed',
        index: true
    },
    meetingLink: { type: String },
    zoomMeetingId: { type: String },
    paymentStatus: {
        type: String,
        enum: ['free', 'paid', 'pending', 'refunded'],
        default: 'free'
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    amount: { type: Number, default: 0 },
    cancellationToken: { type: String, required: true, unique: true },
    rescheduledFrom: { type: Schema.Types.ObjectId, ref: 'Booking' },
    remindersSent: [String],
    followUpSent: { type: Boolean, default: false },
    creatorNotes: { type: String },
    cancelReason: { type: String },
    packageId: { type: Schema.Types.ObjectId, ref: 'Package' }
}, {
    timestamps: true
});

// Ensure a slot isn't double-booked for the same creator (basic race condition guard)
// Note: More complex logical checks happen in the API
BookingSchema.index({ creatorId: 1, startTime: 1, status: 1 });
BookingSchema.index({ creatorId: 1, startTime: 1, endTime: 1, status: 1 });
BookingSchema.index({ creatorId: 1, createdAt: -1 });
BookingSchema.index({ creatorId: 1, isPublished: 1 });

export const Booking = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
export default Booking;
