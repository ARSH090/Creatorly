/**
 * Creatorly Storefront Block Builder — Type System
 * Supports 20 widget types with drag-and-drop ordering, themes, and multi-page layouts.
 */

// ─── Block Types ──────────────────────────────────────────────────────────────

export type BlockType =
    | 'hero'
    | 'social_links'
    | 'links'
    | 'products'
    | 'video'
    | 'testimonials'
    | 'countdown'
    | 'faq'
    | 'newsletter'
    | 'stats'
    | 'gallery'
    | 'text'
    | 'divider'
    | 'spacer'
    | 'embed'
    | 'announcement'
    | 'music'
    | 'booking'
    | 'map'
    | 'before_after';

export type BlockWidth = 'full' | 'half' | 'third';

// ─── Block Settings by Type ────────────────────────────────────────────────────

export interface HeroSettings {
    displayName?: string;
    bio?: string;
    photoShape?: 'circle' | 'square' | 'rounded';
    coverImage?: string;
    coverGradient?: string;
    typingWords?: string[];           // typewriter effect words
    ctaText?: string;
    ctaUrl?: string;
    ctaStyle?: 'filled' | 'outline' | 'ghost';
    textAlign?: 'left' | 'center' | 'right';
    bgType?: 'color' | 'gradient' | 'image' | 'video';
    bgValue?: string;
    showUsername?: boolean;
}

export interface SocialLink {
    platform: string;
    url: string;
    isVisible: boolean;
}

export interface SocialLinksSettings {
    links: SocialLink[];
    displayMode?: 'icons' | 'icons_label' | 'full_button' | 'floating';
    iconSize?: 'sm' | 'md' | 'lg';
    iconStyle?: 'brand' | 'custom' | 'mono' | 'outline';
    iconColor?: string;
    hoverEffect?: 'scale' | 'bounce' | 'rotate' | 'glow';
    floatSide?: 'left' | 'right';
    shape?: 'circle' | 'square' | 'rounded';
}

export interface LinkButton {
    id: string;
    title: string;
    url: string;
    iconName?: string;
    thumbnail?: string;
    description?: string;
    badgeText?: string;
    badgeColor?: string;
    highlightBorder?: boolean;
    isActive: boolean;
    order: number;
    scheduleStart?: string;
    scheduleEnd?: string;
    linkType?: string;
    clickCount?: number;
}

export interface LinksSettings {
    buttons: LinkButton[];
    buttonStyle?: 'filled' | 'outline' | 'ghost' | 'pill' | 'neon' | 'glass';
    showThumbnails?: boolean;
    showClickCount?: boolean;
}

export interface ProductsSettings {
    layout?: 'grid' | 'list' | 'carousel' | 'masonry';
    columns?: 2 | 3 | 4;
    cardStyle?: 'minimal' | 'detailed' | 'compact';
    categoryFilter?: string[];
    showViewAll?: boolean;
    maxVisible?: number;
    sortBy?: 'manual' | 'price_asc' | 'price_desc' | 'newest' | 'bestseller';
    featuredProductId?: string;
    title?: string;
}

export interface VideoSettings {
    url?: string;
    type?: 'youtube' | 'instagram' | 'vimeo' | 'mp4';
    thumbnail?: string;
    autoplay?: boolean;
    muted?: boolean;
    aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3';
    showBranding?: boolean;
    title?: string;
}

export interface Testimonial {
    id: string;
    name: string;
    role?: string;
    content: string;
    rating?: number;
    avatar?: string;
    source?: 'google' | 'instagram' | 'twitter' | 'whatsapp' | 'manual';
}

export interface TestimonialsSettings {
    items: Testimonial[];
    displayMode?: 'grid' | 'carousel' | 'masonry' | 'wall';
    autoScroll?: boolean;
    title?: string;
}

export interface CountdownSettings {
    targetDate?: string;
    targetTimezone?: string;
    style?: 'flip' | 'digital' | 'minimal' | 'circle';
    showDays?: boolean;
    showHours?: boolean;
    showMinutes?: boolean;
    showSeconds?: boolean;
    onExpire?: 'hide' | 'message' | 'redirect';
    expireMessage?: string;
    expireUrl?: string;
    label?: string;
}

export interface FAQItem {
    id: string;
    question: string;
    answer: string;
    category?: string;
}

export interface FAQSettings {
    items: FAQItem[];
    defaultOpen?: boolean;
    showSearch?: boolean;
    title?: string;
}

export interface NewsletterSettings {
    heading?: string;
    subheading?: string;
    buttonText?: string;
    successMessage?: string;
    showGdpr?: boolean;
    gdprText?: string;
    leadMagnet?: string;
    provider?: 'native' | 'mailchimp' | 'convertkit';
    providerUrl?: string;
}

export interface StatItem {
    id: string;
    icon?: string;
    number: string;
    label: string;
    prefix?: string;
    suffix?: string;
}

export interface StatsSettings {
    items: StatItem[];
    layout?: 'row' | 'grid';
    animateOnScroll?: boolean;
    title?: string;
}

export interface GalleryImage {
    id: string;
    url: string;
    caption?: string;
    alt?: string;
}

export interface GallerySettings {
    images: GalleryImage[];
    displayMode?: 'grid' | 'masonry' | 'carousel' | 'lightbox';
    aspectRatio?: 'square' | 'landscape' | 'portrait';
    columns?: 2 | 3 | 4;
    title?: string;
}

export interface TextSettings {
    content?: string;             // HTML rich text
    fontSize?: 'sm' | 'md' | 'lg' | 'xl';
    textColor?: string;
    bgColor?: string;
    textAlign?: 'left' | 'center' | 'right';
    maxWidth?: 'sm' | 'md' | 'lg' | 'full';
}

export interface DividerSettings {
    style?: 'line' | 'dots' | 'wave' | 'zigzag';
    color?: string;
    width?: 'full' | 'center' | 'short';
    thickness?: number;
}

export interface SpacerSettings {
    height?: number;    // px, 8–200
}

export interface EmbedSettings {
    code?: string;      // sanitized iframe / html
    height?: number;
    title?: string;
}

export interface AnnouncementSettings {
    text?: string;
    emoji?: string;
    ctaText?: string;
    ctaUrl?: string;
    bgColor?: string;
    bgGradient?: string;
    dismissable?: boolean;
    sticky?: boolean;
    scheduleStart?: string;
    scheduleEnd?: string;
}

export interface TrackItem {
    id: string;
    title: string;
    artist?: string;
    coverUrl?: string;
    audioUrl?: string;
    embedUrl?: string;
    platform?: 'spotify' | 'apple' | 'soundcloud' | 'mp3';
}

export interface MusicSettings {
    tracks: TrackItem[];
    title?: string;
    showPlayer?: boolean;
}

export interface BookingSettings {
    calendarUrl?: string;
    title?: string;
    description?: string;
    buttonText?: string;
    showInline?: boolean;
}

export interface MapSettings {
    embedUrl?: string;
    address?: string;
    showDirectionsButton?: boolean;
    title?: string;
}

export interface BeforeAfterSettings {
    beforeImage?: string;
    afterImage?: string;
    beforeLabel?: string;
    afterLabel?: string;
    title?: string;
}

// ─── Union of all settings ─────────────────────────────────────────────────────

export type BlockSettings =
    | HeroSettings
    | SocialLinksSettings
    | LinksSettings
    | ProductsSettings
    | VideoSettings
    | TestimonialsSettings
    | CountdownSettings
    | FAQSettings
    | NewsletterSettings
    | StatsSettings
    | GallerySettings
    | TextSettings
    | DividerSettings
    | SpacerSettings
    | EmbedSettings
    | AnnouncementSettings
    | MusicSettings
    | BookingSettings
    | MapSettings
    | BeforeAfterSettings;

// ─── Core Block ───────────────────────────────────────────────────────────────

export interface StorefrontBlock {
    id: string;
    type: BlockType;
    width: BlockWidth;
    isVisible: boolean;
    order: number;
    settings: BlockSettings;
}

// ─── Theme ────────────────────────────────────────────────────────────────────

export type ThemePresetName =
    | 'minimal_white'
    | 'dark_mode'
    | 'neon_glow'
    | 'warm_beige'
    | 'bold_creator'
    | 'glassmorphism'
    | 'retro'
    | 'forest'
    | 'ocean'
    | 'sunset';

export interface StorefrontThemeV2 {
    preset?: ThemePresetName;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    cardColor: string;
    textColor: string;
    mutedColor: string;
    fontFamily: string;
    headingFont?: string;
    borderRadius: number;         // 0–20px global slider
    buttonStyle: 'rounded' | 'square' | 'pill' | 'outlined' | 'ghost';
    cardStyle: 'flat' | 'shadow' | 'border' | 'glass';
    spacing: 'compact' | 'normal' | 'spacious';
    bgType: 'color' | 'gradient' | 'image' | 'pattern' | 'video';
    bgValue?: string;
    darkMode: boolean;
    allowVisitorToggle?: boolean;
    customCss?: string;
}

export const THEME_PRESETS: Record<ThemePresetName, Partial<StorefrontThemeV2>> = {
    minimal_white: {
        backgroundColor: '#ffffff', cardColor: '#f9fafb',
        textColor: '#111111', mutedColor: '#6b7280',
        primaryColor: '#111111', secondaryColor: '#374151', accentColor: '#6366f1',
        fontFamily: 'Inter', borderRadius: 12, buttonStyle: 'square',
        cardStyle: 'border', darkMode: false, bgType: 'color',
    },
    dark_mode: {
        backgroundColor: '#030303', cardColor: '#0a0a0a',
        textColor: '#ffffff', mutedColor: '#71717a',
        primaryColor: '#6366f1', secondaryColor: '#a855f7', accentColor: '#ec4899',
        fontFamily: 'Inter', borderRadius: 16, buttonStyle: 'rounded',
        cardStyle: 'border', darkMode: true, bgType: 'color',
    },
    neon_glow: {
        backgroundColor: '#050510', cardColor: '#0a0a1a',
        textColor: '#ffffff', mutedColor: '#818cf8',
        primaryColor: '#7c3aed', secondaryColor: '#06b6d4', accentColor: '#10b981',
        fontFamily: 'Space Grotesk', borderRadius: 8, buttonStyle: 'pill',
        cardStyle: 'border', darkMode: true, bgType: 'gradient',
        bgValue: 'linear-gradient(135deg, #050510 0%, #0f0526 100%)',
    },
    warm_beige: {
        backgroundColor: '#f5f0e8', cardColor: '#ede8df',
        textColor: '#2C2416', mutedColor: '#8b7355',
        primaryColor: '#c97c3a', secondaryColor: '#e8b88a', accentColor: '#d97706',
        fontFamily: 'Playfair Display', borderRadius: 8, buttonStyle: 'rounded',
        cardStyle: 'shadow', darkMode: false, bgType: 'color',
    },
    bold_creator: {
        backgroundColor: '#0a0a0a', cardColor: '#141414',
        textColor: '#ffffff', mutedColor: '#a1a1aa',
        primaryColor: '#ff3d00', secondaryColor: '#ff6d00', accentColor: '#ffab00',
        fontFamily: 'Outfit', borderRadius: 4, buttonStyle: 'square',
        cardStyle: 'flat', darkMode: true, bgType: 'color',
    },
    glassmorphism: {
        backgroundColor: '#0f172a', cardColor: 'rgba(255,255,255,0.05)',
        textColor: '#f1f5f9', mutedColor: '#94a3b8',
        primaryColor: '#818cf8', secondaryColor: '#c4b5fd', accentColor: '#67e8f9',
        fontFamily: 'Inter', borderRadius: 20, buttonStyle: 'pill',
        cardStyle: 'glass', darkMode: true, bgType: 'gradient',
        bgValue: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
    },
    retro: {
        backgroundColor: '#fef3c7', cardColor: '#fef9ef',
        textColor: '#1c1917', mutedColor: '#78716c',
        primaryColor: '#dc2626', secondaryColor: '#2563eb', accentColor: '#16a34a',
        fontFamily: 'Playfair Display', borderRadius: 0, buttonStyle: 'square',
        cardStyle: 'border', darkMode: false, bgType: 'color',
    },
    forest: {
        backgroundColor: '#0f1a0f', cardColor: '#152415',
        textColor: '#e8f5e9', mutedColor: '#81c784',
        primaryColor: '#4caf50', secondaryColor: '#8bc34a', accentColor: '#cddc39',
        fontFamily: 'Outfit', borderRadius: 12, buttonStyle: 'rounded',
        cardStyle: 'border', darkMode: true, bgType: 'color',
    },
    ocean: {
        backgroundColor: '#0c1929', cardColor: '#0d2137',
        textColor: '#e0f2fe', mutedColor: '#7dd3fc',
        primaryColor: '#0ea5e9', secondaryColor: '#38bdf8', accentColor: '#06b6d4',
        fontFamily: 'Inter', borderRadius: 16, buttonStyle: 'rounded',
        cardStyle: 'border', darkMode: true, bgType: 'gradient',
        bgValue: 'linear-gradient(180deg, #0c1929 0%, #0c2340 100%)',
    },
    sunset: {
        backgroundColor: '#1a0a05', cardColor: '#2a1208',
        textColor: '#fff7ed', mutedColor: '#fb923c',
        primaryColor: '#f97316', secondaryColor: '#ec4899', accentColor: '#fbbf24',
        fontFamily: 'Outfit', borderRadius: 16, buttonStyle: 'pill',
        cardStyle: 'border', darkMode: true, bgType: 'gradient',
        bgValue: 'linear-gradient(135deg, #1a0a05 0%, #2d0a1f 100%)',
    },
};

export const DEFAULT_THEME_V2: StorefrontThemeV2 = {
    ...THEME_PRESETS.dark_mode,
    preset: 'dark_mode',
} as StorefrontThemeV2;

// ─── Page ─────────────────────────────────────────────────────────────────────

export interface StorefrontPage {
    id: string;
    slug: string;           // 'home', 'about', 'blog', or custom
    title: string;
    isVisible: boolean;
    showInNav: boolean;
    blocks: StorefrontBlock[];
}

// ─── Block metadata (for the block picker) ────────────────────────────────────

export interface BlockMeta {
    type: BlockType;
    label: string;
    icon: string;
    description: string;
    category: 'content' | 'social' | 'commerce' | 'media' | 'layout';
    proOnly?: boolean;
}

export const BLOCK_LIBRARY: BlockMeta[] = [
    { type: 'hero', label: 'Hero', icon: '🌟', description: 'Profile photo, bio, CTA button', category: 'content' },
    { type: 'social_links', label: 'Social Links', icon: '🔗', description: '50+ social platform icons', category: 'social' },
    { type: 'links', label: 'Link Buttons', icon: '🔘', description: 'Custom link buttons with icons', category: 'content' },
    { type: 'products', label: 'Products', icon: '🛍️', description: 'Your digital products grid', category: 'commerce' },
    { type: 'video', label: 'Video', icon: '🎬', description: 'YouTube, Vimeo, or MP4', category: 'media' },
    { type: 'testimonials', label: 'Testimonials', icon: '⭐', description: 'Customer reviews & ratings', category: 'content' },
    { type: 'countdown', label: 'Countdown', icon: '⏳', description: 'Timer for launches & offers', category: 'content' },
    { type: 'faq', label: 'FAQ', icon: '❓', description: 'Accordion Q&A section', category: 'content' },
    { type: 'newsletter', label: 'Newsletter', icon: '📧', description: 'Email list signup form', category: 'content' },
    { type: 'stats', label: 'Stats', icon: '📊', description: 'Social proof numbers', category: 'content' },
    { type: 'gallery', label: 'Gallery', icon: '🖼️', description: 'Image gallery with lightbox', category: 'media' },
    { type: 'text', label: 'Text', icon: '📝', description: 'Rich text block', category: 'layout' },
    { type: 'divider', label: 'Divider', icon: '─', description: 'Section separator', category: 'layout' },
    { type: 'spacer', label: 'Spacer', icon: '↕️', description: 'Empty space between blocks', category: 'layout' },
    { type: 'embed', label: 'Embed', icon: '🔌', description: 'Iframe / custom HTML embed', category: 'media' },
    { type: 'announcement', label: 'Announcement', icon: '📢', description: 'Banner / sticky notice', category: 'content' },
    { type: 'music', label: 'Music', icon: '🎵', description: 'Spotify / audio player', category: 'media' },
    { type: 'booking', label: 'Booking', icon: '📅', description: 'Inline calendar booking', category: 'commerce' },
    { type: 'map', label: 'Map', icon: '📍', description: 'Google Maps embed', category: 'content' },
    { type: 'before_after', label: 'Before / After', icon: '↔️', description: 'Comparison slider', category: 'media' },
];

// ─── Default settings per block type ───────────────────────────────────────────

export function defaultSettings(type: BlockType): BlockSettings {
    switch (type) {
        case 'hero': return { photoShape: 'circle', textAlign: 'center', typingWords: ['Creator', 'Coach', 'Developer'], ctaText: 'Get in touch', showUsername: true, bgType: 'color' } as HeroSettings;
        case 'social_links': return { links: [], displayMode: 'icons', iconSize: 'md', iconStyle: 'brand', hoverEffect: 'scale', shape: 'circle' } as SocialLinksSettings;
        case 'links': return { buttons: [], buttonStyle: 'filled', showThumbnails: true } as LinksSettings;
        case 'products': return { layout: 'grid', columns: 3, cardStyle: 'detailed', showViewAll: true, maxVisible: 6, sortBy: 'manual', title: 'My Products' } as ProductsSettings;
        case 'video': return { aspectRatio: '16:9', showBranding: false } as VideoSettings;
        case 'testimonials': return { items: [], displayMode: 'grid', autoScroll: false, title: 'What People Say' } as TestimonialsSettings;
        case 'countdown': return { style: 'digital', showDays: true, showHours: true, showMinutes: true, showSeconds: true, onExpire: 'message', expireMessage: 'The offer has ended.' } as CountdownSettings;
        case 'faq': return { items: [], defaultOpen: false, showSearch: false, title: 'Frequently Asked Questions' } as FAQSettings;
        case 'newsletter': return { heading: 'Join the newsletter', subheading: 'Get weekly tips delivered to your inbox.', buttonText: 'Subscribe', successMessage: "You're in! 🎉", showGdpr: false } as NewsletterSettings;
        case 'stats': return { items: [], layout: 'row', animateOnScroll: true } as StatsSettings;
        case 'gallery': return { images: [], displayMode: 'grid', columns: 3, aspectRatio: 'square' } as GallerySettings;
        case 'text': return { content: '<p>Add your text here…</p>', textAlign: 'left', maxWidth: 'md' } as TextSettings;
        case 'divider': return { style: 'line', color: '#ffffff22', width: 'full', thickness: 1 } as DividerSettings;
        case 'spacer': return { height: 40 } as SpacerSettings;
        case 'embed': return { height: 400 } as EmbedSettings;
        case 'announcement': return { text: '🎉 New drop is live!', dismissable: true, sticky: false } as AnnouncementSettings;
        case 'music': return { tracks: [], showPlayer: true } as MusicSettings;
        case 'booking': return { title: 'Book a Session', description: 'Choose a time that works for you.', buttonText: 'Book Now', showInline: true } as BookingSettings;
        case 'map': return { showDirectionsButton: true, title: 'Find Us' } as MapSettings;
        case 'before_after': return { beforeLabel: 'Before', afterLabel: 'After' } as BeforeAfterSettings;
        default: return {} as BlockSettings;
    }
}

export function newBlock(type: BlockType, order: number): StorefrontBlock {
    return {
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        type,
        width: 'full',
        isVisible: true,
        order,
        settings: defaultSettings(type),
    };
}
