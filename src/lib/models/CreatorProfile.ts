import mongoose, { Schema, Document, Model } from 'mongoose';

export type ServiceType =
    | 'whatsapp'
    | 'instagram'
    | 'youtube'
    | 'email'
    | 'booking'
    | 'telegram'
    | 'twitter'
    | 'linkedin'
    | 'tiktok'
    | 'custom';

export interface IServiceButton {
    id: string;
    label: string;
    serviceType: ServiceType;
    /** External URL — used when modalEnabled is false */
    link?: string;
    /** true = open lead capture modal; false = navigate to link */
    modalEnabled: boolean;
    isVisible: boolean;
    order: number;
}

export interface ILink {
    id: string;
    title: string;
    url: string;
    thumbnail?: string;
    isActive: boolean;
    order: number;
    clicks: number;
    description?: string;
    scheduleStart?: Date;
    scheduleEnd?: Date;
    linkType?: string;
    iconName?: string;
    badgeText?: string;
    badgeColor?: string;
    highlightBorder?: boolean;
}

export interface ICreatorProfile extends Document {
    creatorId: mongoose.Types.ObjectId;
    storeName: string;
    logo?: string;
    banner?: string;
    description?: string;

    // AutoDM Hub Service Buttons
    serviceButtons: IServiceButton[];

    // Custom links (Link-in-Bio)
    links: ILink[];

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
        backgroundImage?: string;
        productLayout: 'grid' | 'list';
        buttonColor?: string;
        buttonTextColor?: string;
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
        type: 'hero' | 'services' | 'links' | 'products' | 'newsletter' | 'featured_products' | 'categories' | 'testimonials';
        enabled?: boolean;
        order?: number;
    }>;

    // Custom Domain settings
    customDomain?: string;
    isCustomDomainVerified: boolean;

    // Feature Toggles
    features: {
        newsletterEnabled: boolean;
        commentsEnabled: boolean;
        storefrontEnabled: boolean;
        whatsappEnabled: boolean;
        googleSheetsEnabled: boolean;
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

    // Testimonials & FAQs
    testimonials: Array<{
        id: string;
        name: string;
        role: string;
        content: string;
        avatar?: string;
    }>;
    faqs: Array<{
        id: string;
        question: string;
        answer: string;
    }>;

    // New block builder fields
    blocksLayout?: any[];
    themeV2?: Record<string, any>;
    storefrontSeo?: {
        metaTitle?: string;
        metaDescription?: string;
        ogImage?: string;
        favicon?: string;
        keywords?: string;
    };
    passwordProtection?: {
        enabled: boolean;
        password?: string;
        hint?: string;
    };

    // New customization fields
    showProfilePhoto: boolean;
    isPublished: boolean;
    currency?: string;

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
        buttonStyle: { type: String, enum: ['pill', 'square', 'rounded'], default: 'rounded' },
        backgroundImage: String,
        productLayout: { type: String, enum: ['grid', 'list'], default: 'grid' },
        buttonColor: { type: String, default: '#6366f1' },
        buttonTextColor: { type: String, default: '#ffffff' }
    },

    showProfilePhoto: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: true },
    currency: { type: String, default: 'INR' },

    socialLinks: {
        instagram: String,
        twitter: String,
        youtube: String,
        tiktok: String,
        linkedin: String,
        website: String
    },

    serviceButtons: [{
        id: { type: String, required: true },
        label: { type: String, required: true },
        serviceType: {
            type: String,
            enum: ['whatsapp', 'instagram', 'youtube', 'email', 'booking', 'telegram', 'twitter', 'linkedin', 'tiktok', 'custom'],
            default: 'custom'
        },
        link: String,
        modalEnabled: { type: Boolean, default: true },
        isVisible: { type: Boolean, default: true },
        order: { type: Number, default: 0 }
    }],

    links: [{
        id: { type: String, required: true },
        title: { type: String, required: true },
        url: { type: String, required: true },
        thumbnail: String,
        isActive: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 },
        description: String,
        scheduleStart: Date,
        scheduleEnd: Date,
        linkType: { type: String, default: 'link' },
        iconName: String,
        badgeText: String,
        badgeColor: String,
        highlightBorder: { type: Boolean, default: false }
    }],

    layout: [{
        id: String,
        type: { type: String, enum: ['hero', 'services', 'links', 'products', 'newsletter', 'featured_products', 'categories', 'testimonials', 'faq'] },
        enabled: { type: Boolean, default: true },
        order: Number
    }],

    testimonials: [{
        id: String,
        name: String,
        role: String,
        content: String,
        avatar: String
    }],

    faqs: [{
        id: String,
        question: String,
        answer: String
    }],

    // New drag-and-drop block layout (stores full block array as flexible Mixed)
    blocksLayout: { type: [Schema.Types.Mixed], default: [] },

    // New enhanced theme (stored as a flexible Map)
    themeV2: { type: Schema.Types.Mixed, default: {} },

    storefrontSeo: {
        metaTitle: String,
        metaDescription: String,
        ogImage: String,
        favicon: String,
        keywords: String
    },

    passwordProtection: {
        enabled: { type: Boolean, default: false },
        password: String,
        hint: String
    },

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
        storefrontEnabled: { type: Boolean, default: true },
        whatsappEnabled: { type: Boolean, default: true },
        googleSheetsEnabled: { type: Boolean, default: true }
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
// Fast storefront listing by published status
CreatorProfileSchema.index({ isPublished: 1, creatorId: 1 });

const CreatorProfile: Model<ICreatorProfile> = mongoose.models.CreatorProfile || mongoose.model<ICreatorProfile>('CreatorProfile', CreatorProfileSchema);
export { CreatorProfile };
export default CreatorProfile;
