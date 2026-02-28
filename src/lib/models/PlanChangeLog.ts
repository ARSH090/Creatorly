import mongoose from 'mongoose';

const PlanChangeLogSchema = new mongoose.Schema({
    planId: {
        type: String,
        required: true,
        index: true,
    },
    changedBy: {
        type: String,
        required: true,
        // Clerk userId of the admin
    },
    changedByEmail: {
        type: String,
        // Admin's email for readability in logs
    },
    changeType: {
        type: String,
        enum: [
            'price_changed',
            'limit_changed',
            'feature_toggled',
            'plan_enabled',
            'plan_disabled',
            'plan_created',
            'razorpay_linked',
            'name_changed',
            'description_changed',
            'features_list_updated',
        ],
        required: true,
    },
    fieldChanged: {
        type: String,
        // e.g. "price" | "limits.products" | "name"
    },
    previousValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    affectedSubscriberCount: {
        type: Number,
        default: 0,
    },
    note: {
        type: String,
        default: '',
        // Optional reason admin provides
    },
}, { timestamps: true });

PlanChangeLogSchema.index({ planId: 1, createdAt: -1 });

export const PlanChangeLog = mongoose.models.PlanChangeLog ||
    mongoose.model('PlanChangeLog', PlanChangeLogSchema);

export default PlanChangeLog;
