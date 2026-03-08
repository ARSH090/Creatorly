import mongoose, { Schema, Document } from 'mongoose';

export interface IBlockedSlot extends Document {
    creatorId: mongoose.Types.ObjectId;
    calendarEventId: string;
    startTime: Date;
    endTime: Date;
    title?: string;
    isAllDay?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const BlockedSlotSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    calendarEventId: { type: String, required: true, index: true },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true, index: true },
    title: { type: String },
    isAllDay: { type: Boolean, default: false }
}, {
    timestamps: true
});

// Protect against duplicate events for the same creator
BlockedSlotSchema.index({ creatorId: 1, calendarEventId: 1 }, { unique: true });
BlockedSlotSchema.index({ creatorId: 1, startTime: 1, endTime: 1 });

export const BlockedSlot = mongoose.models.BlockedSlot || mongoose.model<IBlockedSlot>('BlockedSlot', BlockedSlotSchema);
export default BlockedSlot;
