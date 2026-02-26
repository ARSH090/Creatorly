/**
 * Shared TypeScript types for the AutoDM Hub public storefront.
 * Used by the page, all storefront components, and the public API route.
 */

// ─── Theme ────────────────────────────────────────────────────────────────────

export interface StorefrontTheme {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
    borderRadius: 'sm' | 'md' | 'lg' | 'full';
    buttonStyle: 'pill' | 'square' | 'rounded';
    backgroundImage?: string;
    productLayout?: 'grid' | 'list';
    buttonColor?: string;
    buttonTextColor?: string;
}

export const DEFAULT_THEME: StorefrontTheme = {
    primaryColor: '#6366f1',
    secondaryColor: '#a855f7',
    accentColor: '#ec4899',
    backgroundColor: '#030303',
    textColor: '#ffffff',
    fontFamily: 'Inter',
    borderRadius: 'md',
    buttonStyle: 'rounded',
};

// ─── Service Buttons ──────────────────────────────────────────────────────────

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

export interface ServiceButton {
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

// ─── Public Creator Profile ───────────────────────────────────────────────────

export interface PublicSocialLinks {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
    linkedin?: string;
    website?: string;
    telegram?: string;
}

export interface PublicCreator {
    displayName: string;
    username: string;
    bio: string;
    avatar: string;
    joinedDate: string;
    logo?: string;
    socialLinks: PublicSocialLinks;
    theme: StorefrontTheme;
    showProfilePhoto?: boolean;
}

export interface PublicProfile {
    theme: StorefrontTheme;
    serviceButtons: ServiceButton[];
    links: PublicLink[];
    socialLinks: PublicSocialLinks;
    features: {
        newsletterEnabled: boolean;
        whatsappEnabled: boolean;
        storefrontEnabled: boolean;
    };
}

export interface PublicLink {
    id: string;
    title: string;
    url: string;
    thumbnail?: string;
    description?: string;
    isActive: boolean;
    order: number;
    linkType?: string;
    iconName?: string;
    badgeText?: string;
    badgeColor?: string;
    highlightBorder?: boolean;
}

// ─── Lead Capture ─────────────────────────────────────────────────────────────

export interface LeadFormValues {
    name: string;
    phone: string;
    email: string;
    interest: string;
}

export type LeadSubmitStatus = 'idle' | 'loading' | 'success' | 'error';

export interface LeadSubmitResult {
    deepLink?: string;
    autoSend?: string;
}
