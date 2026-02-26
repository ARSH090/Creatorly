'use client';

/**
 * BlockRenderer — maps a StorefrontBlock to its widget component.
 * Used in both the editor preview AND the public storefront.
 */

import dynamic from 'next/dynamic';
import type {
    StorefrontBlock, StorefrontThemeV2, BlockSettings,
    HeroSettings, SocialLinksSettings, LinksSettings, ProductsSettings,
    VideoSettings, TestimonialsSettings, CountdownSettings, FAQSettings,
    NewsletterSettings, StatsSettings, GallerySettings, TextSettings,
    DividerSettings, SpacerSettings, EmbedSettings, AnnouncementSettings,
    MusicSettings, BookingSettings, MapSettings, BeforeAfterSettings,
} from '@/types/storefront-blocks.types';

// ── Lazy-load widgets for code-splitting ─────────────────────────────────────
const HeroWidget = dynamic(() => import('./widgets/HeroWidget'));
const SocialLinksWidget = dynamic(() => import('./widgets/SocialLinksWidget'));
const LinksWidget = dynamic(() => import('./widgets/LinksWidget'));
const ProductsWidget = dynamic(() => import('./widgets/ProductsWidget'));
const VideoWidget = dynamic(() => import('./widgets/VideoWidget'));
const TestimonialsWidget = dynamic(() => import('./widgets/TestimonialsWidget'));
const CountdownWidget = dynamic(() => import('./widgets/CountdownWidget'));
const FAQWidget = dynamic(() => import('./widgets/FAQWidget'));
const NewsletterWidget = dynamic(() => import('./widgets/NewsletterWidget'));
const StatsWidget = dynamic(() => import('./widgets/StatsWidget'));
const GalleryWidget = dynamic(() => import('./widgets/GalleryWidget'));
const TextWidget = dynamic(() => import('./widgets/TextWidget'));
const AnnouncementWidget = dynamic(() => import('./widgets/AnnouncementWidget'));
const BeforeAfterWidget = dynamic(() => import('./widgets/BeforeAfterWidget'));
const MusicWidget = dynamic(() => import('./widgets/MusicWidget'));
const BookingWidget = dynamic(() => import('./widgets/BookingWidget'));
const MapWidget = dynamic(() => import('./widgets/MapWidget'));
const EmbedWidget = dynamic(() => import('./widgets/EmbedWidget'));
// Named exports require custom loader
const DividerWidget = dynamic(() => import('./widgets/DividerWidget').then(m => ({ default: m.DividerWidget })));
const SpacerWidget = dynamic(() => import('./widgets/DividerWidget').then(m => ({ default: m.SpacerWidget })));

// ── Props ─────────────────────────────────────────────────────────────────────

interface BlockRendererProps {
    block: StorefrontBlock;
    theme: StorefrontThemeV2;
    creator?: { displayName?: string; username?: string; avatar?: string; bio?: string };
    products?: any[];
    creatorId?: string;
    creatorUsername?: string;
    isEditorPreview?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Unsafe cast — each widget gets the correct type for its own settings;
// union approach means we need to cast to bypass TS union narrowing issues.
function as<T>(s: BlockSettings): T { return s as unknown as T; }

/** Convert StorefrontThemeV2 to a flat Record<string,string> for widget props */
export function themeToRecord(theme: StorefrontThemeV2): Record<string, string> {
    return {
        primaryColor: theme.primaryColor,
        secondaryColor: theme.secondaryColor,
        accentColor: theme.accentColor,
        backgroundColor: theme.backgroundColor,
        cardColor: theme.cardColor,
        textColor: theme.textColor,
        mutedColor: theme.mutedColor,
        fontFamily: theme.fontFamily,
        borderRadius: String(theme.borderRadius),
    };
}

// ── Main Component ────────────────────────────────────────────────────────────

export function BlockRenderer({
    block, theme, creator, products, creatorId, creatorUsername,
}: BlockRendererProps) {
    const { type, settings, isVisible } = block;
    if (!isVisible) return null;

    const t = themeToRecord(theme);

    switch (type) {
        case 'hero':
            return <HeroWidget settings={as<HeroSettings>(settings)} theme={t} creator={creator} />;

        case 'social_links':
            return <SocialLinksWidget settings={as<SocialLinksSettings>(settings)} theme={t} />;

        case 'links':
            return <LinksWidget settings={as<LinksSettings>(settings)} theme={t} />;

        case 'products':
            return (
                <ProductsWidget
                    settings={as<ProductsSettings>(settings)}
                    theme={t}
                    products={products || []}
                    creatorUsername={creatorUsername}
                />
            );

        case 'video':
            return <VideoWidget settings={as<VideoSettings>(settings)} theme={t} />;

        case 'testimonials':
            return <TestimonialsWidget settings={as<TestimonialsSettings>(settings)} theme={t} />;

        case 'countdown':
            return <CountdownWidget settings={as<CountdownSettings>(settings)} theme={t} />;

        case 'faq':
            return <FAQWidget settings={as<FAQSettings>(settings)} theme={t} />;

        case 'newsletter':
            return <NewsletterWidget settings={as<NewsletterSettings>(settings)} theme={t} creatorId={creatorId} />;

        case 'stats':
            return <StatsWidget settings={as<StatsSettings>(settings)} theme={t} />;

        case 'gallery':
            return <GalleryWidget settings={as<GallerySettings>(settings)} theme={t} />;

        case 'text':
            return <TextWidget settings={as<TextSettings>(settings)} theme={t} />;

        case 'divider':
            return <DividerWidget settings={as<DividerSettings>(settings)} theme={t} />;

        case 'spacer':
            return <SpacerWidget settings={as<SpacerSettings>(settings)} />;

        case 'embed':
            return <EmbedWidget settings={as<EmbedSettings>(settings)} theme={t} />;

        case 'announcement':
            return <AnnouncementWidget settings={as<AnnouncementSettings>(settings)} theme={t} />;

        case 'music':
            return <MusicWidget settings={as<MusicSettings>(settings)} theme={t} />;

        case 'booking':
            return <BookingWidget settings={as<BookingSettings>(settings)} theme={t} />;

        case 'map':
            return <MapWidget settings={as<MapSettings>(settings)} theme={t} />;

        case 'before_after':
            return <BeforeAfterWidget settings={as<BeforeAfterSettings>(settings)} theme={t} />;

        default:
            return (
                <div className="px-4 py-6 text-center text-sm opacity-30">
                    Unknown block type: {type}
                </div>
            );
    }
}
