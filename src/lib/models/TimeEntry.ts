import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITimeEntry extends Document {
    creatorId: mongoose.Types.ObjectId;
    projectId: mongoose.Types.ObjectId;
    taskId?: mongoose.Types.ObjectId;
    description?: string;
    hours: number; // decimal (1.5 = 1hr 30min)
    date: Date;
    startedAt?: Date;
    stoppedAt?: Date;
    isManual: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const TimeEntrySchema = new Schema<ITimeEntry>({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task' },
    description: String,
    hours: { type: Number, required: true },
    date: { type: Date, required: true },
    startedAt: Date,
    stoppedAt: Date,
    isManual: { type: Boolean, default: true }
}, { timestamps: true });

TimeEntrySchema.index({ creatorId: 1, date: -1 });

const TimeEntry: Model<ITimeEntry> = mongoose.models.TimeEntry || mongoose.model<ITimeEntry>('TimeEntry', TimeEntrySchema);
export { TimeEntry };
export default TimeEntry;
