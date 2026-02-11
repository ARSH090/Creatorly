import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICreatorProfile extends Document {
    creatorId: mongoose.Types.ObjectId;
    storeName: string;
    logo?: string;
    banner?: string;
    description?: string;

    // Theme & Branding
    theme: {
        primaryColor: string;
        secondaryColor: string;
        accentColor: string;
        backgroundColor: string;
        textColor: string;
        fontFamily: string;
        borderRadius: string; // 'sm', 'md', 'lg', 'full'
        buttonStyle: 'pill' | 'square' | 'rounded';
    };

    // Social Links
    socialLinks: {
        instagram?: string;
        twitter?: string;
        youtube?: string;
        tiktok?: string;
        linkedin?: string;
        website?: string;
    };

    // Page Builder Metadata
    layout: Array<{
        id: string;
        type: 'hero' | 'featured_products' | 'categories' | 'testimonials' | 'newsletter';
        config: any;
        order: number;
    }>;

    // Custom Domain settings
    customDomain?: string;
    isCustomDomainVerified: boolean;

    // Feature Toggles
    features: {
        newsletterEnabled: boolean;
        commentsEnabled: boolean;
        storefrontEnabled: boolean;
    };

    // Booking & Availability
    availability: {
        weeklySchedule: Array<{
            dayOfWeek: number; // 0-6
            active: boolean;
            slots: Array<{
                start: string; // HH:mm
                end: string;
            }>;
        }>;
        bufferTime: number; // minutes
        defaultSlotDuration: number; // minutes
        googleCalendarId?: string;
        isGoogleCalendarSyncEnabled: boolean;
        isBookingEnabled: boolean;
        googleCalendarTokens?: {
            access_token?: string;
            refresh_token?: string;
            scope?: string;
            token_type?: string;
            expiry_date?: number;
        };
    };

    createdAt: Date;
    updatedAt: Date;
}

const CreatorProfileSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    storeName: { type: String, required: true },
    logo: String,
    banner: String,
    description: String,

    theme: {
        primaryColor: { type: String, default: '#6366f1' },
        secondaryColor: { type: String, default: '#a855f7' },
        accentColor: { type: String, default: '#ec4899' },
        backgroundColor: { type: String, default: '#030303' },
        textColor: { type: String, default: '#ffffff' },
        fontFamily: { type: String, default: 'Inter' },
        borderRadius: { type: String, default: 'md' },
        buttonStyle: { type: String, enum: ['pill', 'square', 'rounded'], default: 'rounded' }
    },

    socialLinks: {
        instagram: String,
        twitter: String,
        youtube: String,
        tiktok: String,
        linkedin: String,
        website: String
    },

    layout: [{
        id: String,
        type: { type: String, enum: ['hero', 'featured_products', 'categories', 'testimonials', 'newsletter'] },
        config: Schema.Types.Mixed,
        order: Number
    }],

    customDomain: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true
    },

    isCustomDomainVerified: { type: Boolean, default: false },

    features: {
        newsletterEnabled: { type: Boolean, default: true },
        commentsEnabled: { type: Boolean, default: true },
        storefrontEnabled: { type: Boolean, default: true }
    },

    availability: {
        weeklySchedule: [{
            dayOfWeek: { type: Number, required: true },
            active: { type: Boolean, default: true },
            slots: [{
                start: { type: String, default: '09:00' },
                end: { type: String, default: '17:00' }
            }]
        }],
        bufferTime: { type: Number, default: 15 },
        defaultSlotDuration: { type: Number, default: 30 },
        googleCalendarId: String,
        isGoogleCalendarSyncEnabled: { type: Boolean, default: false },
        isBookingEnabled: { type: Boolean, default: false },
        googleCalendarTokens: {
            access_token: String,
            refresh_token: String,
            scope: String,
            token_type: String,
            expiry_date: Number
        }
    }
}, { timestamps: true });

// Custom Domain index handled in field definition via sparse: true

const CreatorProfile: Model<ICreatorProfile> = mongoose.models.CreatorProfile || mongoose.model<ICreatorProfile>('CreatorProfile', CreatorProfileSchema);
export { CreatorProfile };
export default CreatorProfile;
