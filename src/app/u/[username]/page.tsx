import { Suspense } from 'react';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import ProductModel, { IProduct } from '@/lib/models/Product';
import CreatorProfile from '@/lib/models/CreatorProfile';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Script from 'next/script';
import StoreHeader from '@/components/storefront/StoreHeader';
import CreatorBio from '@/components/storefront/CreatorBio';
import ProductGrid from '@/components/storefront/ProductGrid';
import LinksSection from '@/components/storefront/LinksSection';
import ChatWidget from '@/components/storefront/ChatWidget';
import ShareButtons from '@/components/storefront/ShareButtons';
import StorefrontInteractive from '@/components/storefront/StorefrontInteractive';
import { ShieldAlert } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/server-auth';
import Order from '@/lib/models/Order';
import NewsletterSignup from '@/components/storefront/NewsletterSignup';
import { ProductGridSkeleton, ServiceButtonsSkeleton, LinksSectionSkeleton } from '@/components/storefront/ProductSkeleton';
import TestimonialsSection from '@/components/storefront/TestimonialsSection';
import FAQSection from '@/components/storefront/FAQSection';
import { applyThemeToCSSVars, getGoogleFontsUrl } from '@/utils/theme.utils';
import type { StorefrontTheme, ServiceButton, PublicLink } from '@/types/storefront.types';
import { TIER_LIMITS } from '@/lib/constants/tier-limits';
import type { StorefrontBlock, StorefrontThemeV2 } from '@/types/storefront-blocks.types';
import { shouldDowngrade } from '@/lib/utils/tier-utils';
import StorefrontRenderer from '@/components/storefront/StorefrontRenderer';
import EditStorefrontButton from '@/components/storefront/EditStorefrontButton';

// ─── ISR: revalidate every 60 seconds ─────────────────────────────────────────
export const revalidate = 60;

// ─── Pre-render top creators at build time ────────────────────────────────────
export async function generateStaticParams() {
    try {
        await connectToDatabase();
        const topCreators = await User.find({ status: { $ne: 'suspended' } })
            .select('username')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        return topCreators.map((c: any) => ({ username: c.username }));
    } catch {
        return [];
    }
}

// ─── Dynamic Metadata ─────────────────────────────────────────────────────────
export async function generateMetadata({
    params,
}: {
    params: Promise<{ username: string }>;
}): Promise<Metadata> {
    await connectToDatabase();
    const { username } = await params;
    const usernameRegex = new RegExp(`^${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    const [creator, profile] = await Promise.all([
        User.findOne({ $or: [{ username: usernameRegex }, { storeSlug: usernameRegex }] }).lean() as Promise<any>,
        User.findOne({ $or: [{ username: usernameRegex }, { storeSlug: usernameRegex }] })
            .select('_id').lean()
            .then((c: any) => c ? CreatorProfile.findOne({ creatorId: c._id }).lean() : null) as Promise<any>,
    ]);

    if (!creator) {
        return { title: 'Creator Not Found | Creatorly' };
    }
    const displayName = creator.displayName || creator.username;
    const bio = profile?.description || creator.bio || `Check out ${displayName}'s store on Creatorly.`;
    const avatar = creator.avatar || '/default-avatar.png';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://creatorly.in';
    const image = avatar.startsWith('http') ? avatar : `${appUrl}${avatar}`;

    // Use SEO from new builder if present
    const seo = profile?.storefrontSeo;
    const pageTitle = seo?.metaTitle || `${displayName} — Digital Products & Courses | Creatorly`;
    const pageDesc = seo?.metaDescription || bio;
    const ogImage = seo?.ogImage || image;

    return {
        title: pageTitle,
        description: pageDesc,
        alternates: {
            canonical: `${appUrl}/${username}`,
        },
        openGraph: {
            title: pageTitle,
            description: pageDesc,
            images: [{ url: ogImage, width: 1200, height: 630, alt: `${displayName}'s Storefront` }],
            type: 'profile',
            url: `${appUrl}/${username}`,
        },
        twitter: {
            card: 'summary_large_image',
            title: pageTitle,
            description: pageDesc,
            images: [ogImage],
            site: '@creatorly',
        },
        robots: {
            index: true,
            follow: true,
            googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
        },
        icons: {
            icon: seo?.favicon || '/favicon.ico',
        },
        keywords: seo?.keywords || 'creator, digital products, courses, storefront, creatorly',
    };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function CreatorStorefront({
    params,
    searchParams,
}: {
    params: Promise<{ username: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { username } = await params;
    const { ref } = await searchParams;

    await connectToDatabase();
    const usernameRegex = new RegExp(`^${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    const [creator, profile] = await Promise.all([
        User.findOne({ $or: [{ username: usernameRegex }, { storeSlug: usernameRegex }] }).select('displayName username avatar bio status isSuspended createdAt').lean(),
        User.findOne({ $or: [{ username: usernameRegex }, { storeSlug: usernameRegex }] })
            .select('_id').lean()
            .then((c: any) => c ? CreatorProfile.findOne({ creatorId: c._id }).select('theme themeV2 layout blocksLayout links serviceButtons description testimonials faqs storefrontSeo passwordProtection showProfilePhoto').lean() : null)
    ]);

    if (!creator) notFound();

    // ── Suspended ──
    if (creator.isSuspended || creator.status === 'suspended') {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
                <div className="max-w-md space-y-6">
                    <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-rose-500/20">
                        <ShieldAlert className="w-10 h-10 text-rose-500" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">Storefront Locked</h1>
                        <p className="text-zinc-500 text-sm font-medium">
                            This creator storefront has been temporarily suspended.
                        </p>
                    </div>
                    <div className="pt-6 border-t border-white/5">
                        <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em]">
                            Protected by Creatorly Governance
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ── Coming Soon ──
    if (profile && profile.isPublished === false) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <div className="max-w-md space-y-6">
                    <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto text-4xl">🚀</div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
                            {creator.displayName || creator.username}
                        </h1>
                        <p className="text-zinc-500 font-medium">Something exciting is coming soon!</p>
                    </div>
                    <p className="text-xs text-zinc-300 uppercase tracking-widest font-bold">Powered by Creatorly</p>
                </div>
            </div>
        );
    }

    // ── Password Protection ──
    const { pwd } = (await searchParams) as { pwd?: string };
    if (profile?.passwordProtection?.enabled) {
        const correctPassword = profile.passwordProtection.password;
        if (pwd !== correctPassword) {
            return (
                <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
                    <div className="max-w-sm w-full space-y-8">
                        <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mx-auto text-3xl">
                            🔒
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-black text-white">{creator.displayName || creator.username}</h1>
                            <p className="text-zinc-500 text-sm">This storefront is password protected.</p>
                            {profile.passwordProtection.hint && (
                                <p className="text-xs text-zinc-600 italic">Hint: {profile.passwordProtection.hint}</p>
                            )}
                        </div>
                        <form className="space-y-4">
                            <input
                                name="pwd"
                                type="password"
                                placeholder="Enter password"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-zinc-600"
                                required
                            />
                            <button
                                type="submit"
                                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-2xl transition-all"
                            >
                                Unlock Storefront
                            </button>
                        </form>
                        <p className="text-[10px] text-zinc-700 uppercase tracking-widest font-bold">Powered by Creatorly</p>
                    </div>
                </div>
            );
        }
    }

    // ── Product limits ──
    let effectiveTier = creator.subscriptionTier || 'free';
    if (shouldDowngrade(creator.subscriptionStatus, creator.subscriptionEndAt)) {
        effectiveTier = 'free';
    }
    const tierLimits = TIER_LIMITS[effectiveTier as keyof typeof TIER_LIMITS];
    const productLimit = creator.planLimits?.maxProducts || tierLimits?.products || 1;

    const products = await ProductModel.find({
        creatorId: creator._id,
        isActive: true,
        status: 'published'
    })
        .select('title pricing productType coverImageUrl description isFeatured createdAt image name price type')
        .sort({ isFeatured: -1, createdAt: -1 })
        .limit(productLimit === Infinity ? 0 : productLimit)
        .lean({ virtuals: true });

    // ── Purchased products ──
    const currentUser = await getCurrentUser();
    let purchasedProductIds: string[] = [];
    if (currentUser) {
        const orders = await Order.find({
            userId: (currentUser as any)._id,
            creatorId: creator._id,
            status: 'completed',
        }).select('items.productId').lean();
        purchasedProductIds = orders.flatMap((o: any) =>
            o.items.map((item: any) => item.productId.toString())
        );
    }

    const isOwner = !!currentUser && (
        (currentUser as any)._id?.toString() === creator._id?.toString() ||
        (currentUser as any).clerkId === creator.clerkId ||
        (currentUser as any).username === creator.username
    );

    // Serialise products
    const plainProducts = products.map((p: any) => ({
        id: p._id.toString(),
        name: p.name,
        price: p.price,
        type: p.type,
        image: p.image,
        description: p.description,
        isBestSeller: p.isFeatured,
        isNew: Date.now() - new Date(p.createdAt).getTime() < 7 * 86400 * 1000,
    }));

    // ── Check if new block-based builder is being used ──
    const blocksLayout: StorefrontBlock[] | null = profile?.blocksLayout?.length
        ? profile.blocksLayout
        : null;

    const themeV2: StorefrontThemeV2 | null = (profile?.themeV2 as unknown as StorefrontThemeV2) ?? null;

    // ── Analytics ──
    const { AnalyticsEvent } = await import('@/lib/models/AnalyticsEvent');
    AnalyticsEvent.create({
        eventType: 'page_view',
        creatorId: creator._id,
        path: `/u/${username}`,
        metadata: { source: 'server-component', ref },
    }).catch(console.error);

    if (ref && typeof ref === 'string') {
        const { default: ReferralModel } = await import('@/lib/models/Referral');
        ReferralModel.findOneAndUpdate({ code: ref }, { $inc: { clicks: 1 } }).catch(console.error);
    }

    // ── NEW: UTM & Traffic Analytics ──
    const { headers } = await import('next/headers');
    const headerList = await headers();
    const utmSource = headerList.get('x-track-utm_source');
    const utmMedium = headerList.get('x-track-utm_medium');
    const utmCampaign = headerList.get('x-track-utm_campaign');

    if (utmSource || utmMedium || utmCampaign) {
        const { recordTrafficHit } = await import('@/lib/utils/analytics');
        const utmParams = {
            utm_source: utmSource || '',
            utm_medium: utmMedium || '',
            utm_campaign: utmCampaign || '',
            utm_term: headerList.get('x-track-utm_term') || '',
            utm_content: headerList.get('x-track-utm_content') || '',
            referrer: headerList.get('referer') || ''
        };
        recordTrafficHit(creator._id.toString(), `/u/${username}`, utmParams).catch(console.error);
    }

    // ── Custom Code Injections (CSS + Pixels) ──
    const customInjections = (
        <>
            {profile?.customCss && (
                <style id="creatorly-custom-css" dangerouslySetInnerHTML={{ __html: profile.customCss }} />
            )}

            {profile?.pixels?.metaPixelId && (
                <Script
                    id="meta-pixel"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
                            !function(f,b,e,v,n,t,s)
                            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                            n.queue=[];t=b.createElement(e);t.async=!0;
                            t.src=v;s=b.getElementsByTagName(e)[0];
                            s.parentNode.insertBefore(t,s)}(window, document,'script',
                            'https://connect.facebook.net/en_US/fbevents.js');
                            fbq('init', '${profile.pixels.metaPixelId}');
                            fbq('track', 'PageView');
                        `
                    }}
                />
            )}

            {profile?.pixels?.tiktokPixelId && (
                <Script
                    id="tiktok-pixel"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
                            !function (w, d, t) {
                              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
                              ttq.load('${profile.pixels.tiktokPixelId}');
                              ttq.page();
                            }(window, document, 'ttq');
                        `
                    }}
                />
            )}

            {profile?.pixels?.ga4MeasurementId && (
                <>
                    <Script src={`https://www.googletagmanager.com/gtag/js?id=${profile.pixels.ga4MeasurementId}`} strategy="afterInteractive" />
                    <Script
                        id="ga4-pixel"
                        strategy="afterInteractive"
                        dangerouslySetInnerHTML={{
                            __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${profile.pixels.ga4MeasurementId}');
                    `
                        }}
                    />
                </>
            )}

            {profile?.pixels?.snapchatPixelId && (
                <Script
                    id="snapchat-pixel"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
            (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
            {a.handleRequest ? a.handleRequest.apply(a, arguments) : a.queue.push(arguments)};
            a.queue=[];var s='script';r=t.createElement(s);r.async=!0;
            r.src=n;var u=t.getElementsByTagName(s)[0];
                            u.parentNode.insertBefore(r,u);})(window,document,
            'https://sc-static.net/scevent.min.js');
            snaptr('init', '${profile.pixels.snapchatPixelId}');
            snaptr('track', 'PAGE_VIEW');
            `
                    }}
                />
            )}
        </>
    );

    // ── NEW: Block-based renderer ─────────────────────────────────────────────
    if (blocksLayout && themeV2) {
        const plainCreator = {
            displayName: String(creator.displayName ?? ''),
            username: String(creator.username ?? ''),
            bio: String(profile?.description ?? creator.bio ?? ''),
            avatar: String(creator.avatar ?? ''),
        };

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://creatorly.in';
        const jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: creator.displayName,
            url: `${appUrl}/u/${username}`,
            image: creator.avatar || undefined,
            description: profile?.description || creator.bio || undefined,
            sameAs: Object.values(profile?.socialLinks || {}).filter(Boolean),
        };

        // Google Fonts URL for the new theme
        const fontsUrl = getGoogleFontsUrl(themeV2.fontFamily);

        return (
            <>
                {fontsUrl && (
                    <>
                        <link rel="preconnect" href="https://fonts.googleapis.com" />
                        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                        <link rel="stylesheet" href={fontsUrl} />
                    </>
                )}
                <Script
                    id="creator-jsonld"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
                {customInjections}
                <StorefrontRenderer
                    blocks={blocksLayout}
                    theme={themeV2}
                    creator={plainCreator}
                    products={plainProducts}
                    creatorId={creator._id.toString()}
                    creatorUsername={creator.username}
                />
                <EditStorefrontButton creatorUsername={creator.username} />
            </>
        );
    }

    // ── LEGACY: Original section-based renderer ───────────────────────────────
    const t = profile?.theme;
    const theme: StorefrontTheme = {
        primaryColor: String(t?.primaryColor ?? '#6366f1'),
        secondaryColor: String(t?.secondaryColor ?? '#a855f7'),
        accentColor: String(t?.accentColor ?? '#ec4899'),
        backgroundColor: String(t?.backgroundColor ?? '#030303'),
        textColor: String(t?.textColor ?? '#ffffff'),
        fontFamily: String(t?.fontFamily ?? 'Inter'),
        borderRadius: (t?.borderRadius ?? 'md') as 'sm' | 'md' | 'lg' | 'full',
        buttonStyle: (t?.buttonStyle ?? 'rounded') as 'pill' | 'square' | 'rounded',
        backgroundImage: t?.backgroundImage ? String(t.backgroundImage) : undefined,
        productLayout: (t?.productLayout ?? 'grid') as 'grid' | 'list',
        buttonColor: t?.buttonColor ? String(t.buttonColor) : undefined,
        buttonTextColor: t?.buttonTextColor ? String(t.buttonTextColor) : undefined,
    };

    const serviceButtons: ServiceButton[] = (profile?.serviceButtons || [])
        .filter((b: any) => b.isVisible)
        .sort((a: any, b: any) => a.order - b.order)
        .map((b: any) => ({
            id: b.id, label: b.label, serviceType: b.serviceType, link: b.link,
            modalEnabled: b.modalEnabled ?? true, isVisible: b.isVisible ?? true, order: b.order ?? 0,
        }));

    const activeLinks: PublicLink[] = (profile?.links ?? [])
        .filter((link: any) => {
            if (!link.isActive || !link.url) return false;
            const now = new Date();
            if (link.scheduleStart && new Date(link.scheduleStart) > now) return false;
            if (link.scheduleEnd && new Date(link.scheduleEnd) < now) return false;
            return true;
        })
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
        .map((link: any): PublicLink => ({
            id: String(link.id ?? link._id ?? ''),
            title: String(link.title ?? ''),
            url: String(link.url ?? ''),
            thumbnail: link.thumbnail ? String(link.thumbnail) : undefined,
            description: link.description ? String(link.description) : undefined,
            isActive: Boolean(link.isActive),
            order: Number(link.order ?? 0),
            linkType: link.linkType ? String(link.linkType) : undefined,
            iconName: link.iconName ? String(link.iconName) : undefined,
            badgeText: link.badgeText ? String(link.badgeText) : undefined,
            badgeColor: link.badgeColor ? String(link.badgeColor) : undefined,
            highlightBorder: Boolean(link.highlightBorder),
        }));

    const sl = profile?.socialLinks;
    const plainCreator = {
        displayName: String(creator.displayName ?? ''),
        username: String(creator.username ?? ''),
        bio: String(profile?.description ?? creator.bio ?? ''),
        avatar: String(creator.avatar ?? ''),
        joinedDate: creator.createdAt
            ? new Date(creator.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : '2024',
        logo: profile?.logo ? String(profile.logo) : undefined,
        socialLinks: {
            instagram: sl?.instagram ? String(sl.instagram) : undefined,
            twitter: sl?.twitter ? String(sl.twitter) : undefined,
            youtube: sl?.youtube ? String(sl.youtube) : undefined,
            tiktok: sl?.tiktok ? String(sl.tiktok) : undefined,
            linkedin: sl?.linkedin ? String(sl.linkedin) : undefined,
            website: sl?.website ? String(sl.website) : undefined,
        },
        theme,
        showProfilePhoto: profile?.showProfilePhoto !== false,
    };

    const layout = (profile?.layout?.length ? profile.layout : [
        { id: 'hero', enabled: true },
        { id: 'services', enabled: true },
        { id: 'links', enabled: true },
        { id: 'products', enabled: true },
        { id: 'newsletter', enabled: true },
    ]) as Array<{ id: string; enabled: boolean }>;

    const fontsUrl = getGoogleFontsUrl(theme.fontFamily);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://creatorly.in';
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: creator.displayName,
        url: `${appUrl}/u/${username}`,
        image: creator.avatar || undefined,
        description: profile?.description || creator.bio || undefined,
        sameAs: Object.values(profile?.socialLinks || {}).filter(Boolean),
    };

    return (
        <>
            {fontsUrl && (
                <>
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                    <link rel="stylesheet" href={fontsUrl} />
                </>
            )}
            <Script
                id="creator-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div
                className="min-h-screen selection:bg-indigo-500/30 overflow-x-hidden"
                style={applyThemeToCSSVars(theme)}
            >
                <StoreHeader creator={plainCreator} isOwner={isOwner} />

                <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-32 pb-12 space-y-16 relative">
                    {layout.map((section) => {
                        if (!section.enabled) return null;
                        switch (section.id) {
                            case 'hero':
                                return (
                                    <div key="hero">
                                        <CreatorBio creator={plainCreator} />
                                        <div className="mt-6">
                                            <ShareButtons username={creator.username} displayName={creator.displayName} />
                                        </div>
                                    </div>
                                );
                            case 'services':
                                return (
                                    <section key="services" id="services" aria-label="Services">
                                        <Suspense fallback={<ServiceButtonsSkeleton count={3} />}>
                                            <StorefrontInteractive serviceButtons={serviceButtons} theme={theme} creatorUsername={creator.username} />
                                        </Suspense>
                                    </section>
                                );
                            case 'links':
                                return activeLinks.length > 0 ? (
                                    <section key="links" id="links" aria-label="Links">
                                        <Suspense fallback={<LinksSectionSkeleton count={4} />}>
                                            <LinksSection links={activeLinks} theme={theme} creatorId={creator._id.toString()} />
                                        </Suspense>
                                    </section>
                                ) : null;
                            case 'products':
                                return plainProducts.length > 0 ? (
                                    <section key="products" id="products" className="space-y-8" aria-label="Products">
                                        <div className="flex items-center gap-6">
                                            <h2 className="text-2xl font-black uppercase tracking-widest whitespace-nowrap">Featured Products</h2>
                                            <div className="h-px flex-1 bg-white/10 hidden md:block" />
                                        </div>
                                        <Suspense fallback={<ProductGridSkeleton />}>
                                            <ProductGrid
                                                products={plainProducts}
                                                purchasedProductIds={purchasedProductIds}
                                                creator={{ id: creator._id.toString(), username: creator.username, displayName: creator.displayName }}
                                                theme={theme}
                                            />
                                        </Suspense>
                                    </section>
                                ) : null;
                            case 'newsletter':
                                return profile?.features?.newsletterEnabled !== false ? (
                                    <section key="newsletter" id="newsletter" className="max-w-xl mx-auto" aria-label="Newsletter">
                                        <NewsletterSignup creatorId={creator._id.toString()} theme={theme} />
                                    </section>
                                ) : null;
                            case 'testimonials':
                                return (profile?.testimonials && profile.testimonials.length > 0) ? (
                                    <TestimonialsSection key="testimonials" testimonials={profile.testimonials} theme={theme} />
                                ) : null;
                            case 'faq':
                                return (profile?.faqs && profile.faqs.length > 0) ? (
                                    <FAQSection key="faq" faqs={profile.faqs} theme={theme} />
                                ) : null;
                            default:
                                return null;
                        }
                    })}

                    <footer className="pt-20 pb-10 text-center border-t border-white/5" role="contentinfo">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">
                            Powered by Creatorly
                        </p>
                    </footer>

                    <ChatWidget creatorId={creator._id.toString()} />
                </main>
                <EditStorefrontButton creatorUsername={creator.username} />
            </div>
        </>
    );
}
