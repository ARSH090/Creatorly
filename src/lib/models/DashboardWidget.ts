import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Dashboard Widget Types
 */
export enum DashboardWidgetType {
    REVENUE_CARD = 'revenue_card',
    LEADS_SUMMARY = 'leads_summary',
    AI_CREDITS = 'ai_credits',
    QUICK_ACTIONS = 'quick_actions',
    RECENT_ORDERS = 'recent_orders',
    AUTOMATION_STATUS = 'automation_status',
    PERFORMANCE_GRAPH = 'performance_graph',
    CONVERSION_RATE = 'conversion_rate',
    TOP_PRODUCTS = 'top_products',
    RECENT_LEADS = 'recent_leads',
    SUBSCRIPTION_STATUS = 'subscription_status',
    NOTIFICATIONS_PREVIEW = 'notifications_preview'
}

/**
 * Dashboard Widget Visibility Settings
 */
export interface IDashboardWidgetVisibility {
    isVisible: boolean;
    isCollapsed?: boolean;
    showTitle?: boolean;
    refreshInterval?: number; // in seconds
}

/**
 * Dashboard Widget Configuration
 */
export interface IDashboardWidget extends Document {
    widgetId: string;
    widgetType: DashboardWidgetType;
    positionOrder: number;
    visibilitySettings: IDashboardWidgetVisibility;
    creatorId: mongoose.Types.ObjectId;
    config?: Record<string, any>; // Custom widget configuration
    version: number; // For concurrent updates
    createdAt: Date;
    updatedAt: Date;
}

const DashboardWidgetVisibilitySchema = new Schema<IDashboardWidgetVisibility>({
    isVisible: { type: Boolean, default: true },
    isCollapsed: { type: Boolean, default: false },
    showTitle: { type: Boolean, default: true },
    refreshInterval: { type: Number, default: 60 }
}, { _id: false });

const DashboardWidgetSchema: Schema = new Schema({
    widgetId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    widgetType: {
        type: String,
        enum: Object.values(DashboardWidgetType),
        required: true,
        index: true
    },
    positionOrder: {
        type: Number,
        required: true,
        min: 1,
        max: 12,
        validate: {
            validator: function (this: IDashboardWidget, value: number) {
                return value >= 1 && value <= 12;
            },
            message: 'Position order must be between 1 and 12'
        }
    },
    visibilitySettings: {
        type: DashboardWidgetVisibilitySchema,
        default: () => ({})
    },
    creatorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    config: {
        type: Schema.Types.Mixed,
        default: {}
    },
    version: {
        type: Number,
        default: 1,
        min: 1
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
DashboardWidgetSchema.index({ creatorId: 1, widgetType: 1 });
DashboardWidgetSchema.index({ creatorId: 1, positionOrder: 1 });

// Pre-save middleware to generate widgetId if not provided
DashboardWidgetSchema.pre('save', async function (this: IDashboardWidget) {
    if (!this.widgetId) {
        this.widgetId = `widget_${this._id}`;
    }
});

/**
 * Get default widgets for a new creator
 */
export function getDefaultWidgets(creatorId: mongoose.Types.ObjectId): Partial<IDashboardWidget>[] {
    const defaultWidgets: Partial<IDashboardWidget>[] = [
        {
            widgetType: DashboardWidgetType.REVENUE_CARD,
            positionOrder: 1,
            visibilitySettings: { isVisible: true },
            creatorId
        },
        {
            widgetType: DashboardWidgetType.LEADS_SUMMARY,
            positionOrder: 2,
            visibilitySettings: { isVisible: true },
            creatorId
        },
        {
            widgetType: DashboardWidgetType.AI_CREDITS,
            positionOrder: 3,
            visibilitySettings: { isVisible: true },
            creatorId
        },
        {
            widgetType: DashboardWidgetType.QUICK_ACTIONS,
            positionOrder: 4,
            visibilitySettings: { isVisible: true },
            creatorId
        },
        {
            widgetType: DashboardWidgetType.RECENT_ORDERS,
            positionOrder: 5,
            visibilitySettings: { isVisible: true },
            creatorId
        },
        {
            widgetType: DashboardWidgetType.AUTOMATION_STATUS,
            positionOrder: 6,
            visibilitySettings: { isVisible: true },
            creatorId
        },
        {
            widgetType: DashboardWidgetType.PERFORMANCE_GRAPH,
            positionOrder: 7,
            visibilitySettings: { isVisible: true },
            creatorId
        },
        {
            widgetType: DashboardWidgetType.CONVERSION_RATE,
            positionOrder: 8,
            visibilitySettings: { isVisible: true },
            creatorId
        },
        {
            widgetType: DashboardWidgetType.TOP_PRODUCTS,
            positionOrder: 9,
            visibilitySettings: { isVisible: true },
            creatorId
        },
        {
            widgetType: DashboardWidgetType.RECENT_LEADS,
            positionOrder: 10,
            visibilitySettings: { isVisible: true },
            creatorId
        },
        {
            widgetType: DashboardWidgetType.SUBSCRIPTION_STATUS,
            positionOrder: 11,
            visibilitySettings: { isVisible: true },
            creatorId
        },
        {
            widgetType: DashboardWidgetType.NOTIFICATIONS_PREVIEW,
            positionOrder: 12,
            visibilitySettings: { isVisible: true },
            creatorId
        }
    ];

    return defaultWidgets;
}

export const DashboardWidget = (mongoose.models.DashboardWidget as Model<IDashboardWidget>) ||
    mongoose.model<IDashboardWidget>('DashboardWidget', DashboardWidgetSchema);

export default DashboardWidget;
