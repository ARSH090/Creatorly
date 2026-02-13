import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBooking extends Document {
    creatorId: mongoose.Types.ObjectId;
    customerId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    orderId?: mongoose.Types.ObjectId;
    startTime: Date;
    endTime: Date;
    status: 'pending' | 'confirmed' | 'canceled' | 'completed';
    meetLink?: string;
    googleEventId?: string;
    customerEmail: string;
    customerName: string;
    notes?: string;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const BookingSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'canceled', 'completed', 'no_show'],
        default: 'pending',
        index: true
    },
    meetLink: String,
    googleEventId: String,
    customerEmail: { type: String, required: true },
    customerName: { type: String, required: true },
    notes: String,
    completedAt: Date
}, { timestamps: true, minimize: false } as any);

// Ensure no double bookings for the same creator at the same time
BookingSchema.index({ creatorId: 1, startTime: 1, endTime: 1 }, { unique: true, partialFilterExpression: { status: 'confirmed' } });

const Booking: Model<IBooking> = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
export { Booking };
export default Booking;
