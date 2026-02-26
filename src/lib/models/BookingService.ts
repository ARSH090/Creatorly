import mongoose, { Schema, Document } from 'mongoose';

export interface IBookingService extends Document {
    creatorId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    category: 'Coaching' | 'Consulting' | 'Tutoring' | 'Fitness' | 'Creative' | 'Technical' | 'Custom';
    internalNotes?: string;
    duration: number; // in minutes
    bufferBefore: number; // in minutes
    bufferAfter: number; // in minutes
    price: number;
    pricingType: 'free' | 'fixed' | 'pay_what_you_want' | 'package';
    currency: string;
    paymentTiming: 'pay_now' | 'pay_later' | 'deposit';
    depositAmount?: number;
    meetingType: 'zoom' | 'google_meet' | 'custom_link' | 'phone' | 'in_person' | 'client_choice';
    meetingLink?: string;
    address?: string;
    zoomConnected: boolean;
    customFields: Array<{
        id: string;
        label: string;
        type: 'short_text' | 'long_text' | 'dropdown' | 'checkbox' | 'file' | 'rating';
        placeholder?: string;
        required: boolean;
        options?: string[]; // for dropdown
    }>;
    confirmationMessage?: string;
    reminders: Array<{
        id: string;
        timingHoursBefore: number;
        methods: Array<'email' | 'whatsapp'>;
        message?: string;
    }>;
    followUpEmail?: {
        enabled: boolean;
        hoursAfter: number;
        message?: string;
    };
    cancellationPolicy: {
        allowCancellation: boolean;
        deadlineHours?: number;
        refundPolicy: 'full' | 'credit' | 'custom';
        customPolicyText?: string;
    };
    reschedulingPolicy: {
        allowReschedule: boolean;
        deadlineHours?: number;
        maxReschedules?: number;
    };
    bookingSlug: string;
    maxPerDay?: number;
    maxPerWeek?: number;
    minNoticeHours: number;
    maxAdvanceDays: number;
    groupMax: number; // 1 for 1:1, >1 for group
    waitlistEnabled: boolean;
    isActive: boolean;
    redirectUrl?: string; // after booking
    upsellProductId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const BookingServiceSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    category: {
        type: String,
        enum: ['Coaching', 'Consulting', 'Tutoring', 'Fitness', 'Creative', 'Technical', 'Custom'],
        default: 'Custom'
    },
    internalNotes: { type: String },
    duration: { type: Number, required: true, default: 30 },
    bufferBefore: { type: Number, default: 0 },
    bufferAfter: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    pricingType: {
        type: String,
        enum: ['free', 'fixed', 'pay_what_you_want', 'package'],
        default: 'free'
    },
    currency: { type: String, default: 'INR' },
    paymentTiming: {
        type: String,
        enum: ['pay_now', 'pay_later', 'deposit'],
        default: 'pay_now'
    },
    depositAmount: { type: Number },
    meetingType: {
        type: String,
        enum: ['zoom', 'google_meet', 'custom_link', 'phone', 'in_person', 'client_choice'],
        default: 'google_meet'
    },
    meetingLink: { type: String },
    address: { type: String },
    zoomConnected: { type: Boolean, default: false },
    customFields: [{
        id: String,
        label: String,
        type: { type: String, enum: ['short_text', 'long_text', 'dropdown', 'checkbox', 'file', 'rating'] },
        placeholder: String,
        required: { type: Boolean, default: false },
        options: [String]
    }],
    confirmationMessage: { type: String },
    reminders: [{
        id: String,
        timingHoursBefore: Number,
        methods: [String],
        message: String
    }],
    followUpEmail: {
        enabled: { type: Boolean, default: false },
        hoursAfter: { type: Number, default: 24 },
        message: String
    },
    cancellationPolicy: {
        allowCancellation: { type: Boolean, default: true },
        deadlineHours: { type: Number, default: 24 },
        refundPolicy: { type: String, enum: ['full', 'credit', 'custom'], default: 'full' },
        customPolicyText: String
    },
    reschedulingPolicy: {
        allowReschedule: { type: Boolean, default: true },
        deadlineHours: { type: Number, default: 24 },
        maxReschedules: { type: Number, default: 2 }
    },
    bookingSlug: { type: String, required: true },
    maxPerDay: { type: Number },
    maxPerWeek: { type: Number },
    minNoticeHours: { type: Number, default: 24 },
    maxAdvanceDays: { type: Number, default: 60 },
    groupMax: { type: Number, default: 1 },
    waitlistEnabled: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    redirectUrl: { type: String },
    upsellProductId: { type: Schema.Types.ObjectId, ref: 'Product' }
}, {
    timestamps: true
});

// Ensure bookingSlug is unique per creator
BookingServiceSchema.index({ creatorId: 1, bookingSlug: 1 }, { unique: true });

export const BookingService = mongoose.models.BookingService || mongoose.model<IBookingService>('BookingService', BookingServiceSchema);
