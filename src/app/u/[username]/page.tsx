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
import { shouldDowngrade } from '@/lib/utils/tier-utils';
import { TIER_LIMITS } from '@/lib/constants/tier-limits';

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
    const creator = await User.findOne({
        $or: [{ username }, { storeSlug: username }]
    }).lean() as any;

    if (!creator) {
        return { title: 'Creator Not Found | Creatorly' };
    }

    const profile = await CreatorProfile.findOne({ creatorId: creator._id }).lean() as any;
    const displayName = creator.displayName || creator.username;
    const bio = profile?.description || creator.bio || `Check out ${displayName}'s store on Creatorly.`;
    const avatar = creator.avatar || '/default-avatar.png';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://creatorly.in';
    const image = avatar.startsWith('http') ? avatar : `${appUrl}${avatar}`;

    return {
        title: `${displayName} | Creatorly`,
        description: bio,
        alternates: {
            canonical: `${appUrl}/u/${username}`,
        },
        openGraph: {
            title: `${displayName} | Creatorly`,
            description: bio,
            images: [{ url: image, width: 400, height: 400, alt: displayName }],
            type: 'profile',
            url: `${appUrl}/u/${username}`,
        },
        twitter: {
            card: 'summary',
            title: `${displayName} | Creatorly`,
            description: bio,
            images: [image],
        },
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

    const creator = await User.findOne({
        $or: [{ username }, { storeSlug: username }]
    }).lean() as any;
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

    const profile = await CreatorProfile.findOne({ creatorId: creator._id }).lean() as any;

    // ── Enforce Product Limits ──
    let effectiveTier = creator.subscriptionTier || 'free';
    if (shouldDowngrade(creator.subscriptionStatus, creator.subscriptionEndAt)) {
        effectiveTier = 'free';
    }

    const tierLimits = TIER_LIMITS[effectiveTier as keyof typeof TIER_LIMITS];
    const productLimit = creator.planLimits?.maxProducts || tierLimits?.products || 1;

    const products = await ProductModel.find({ creatorId: creator._id, isActive: true, status: 'active' })
        .sort({ isFeatured: -1, createdAt: -1 })
        .limit(productLimit === Infinity ? 0 : productLimit)
        .lean() as IProduct[];

    // ── Purchased products (for logged-in visitor) ──
    const currentUser = await getCurrentUser();
    let purchasedProductIds: string[] = [];
    if (currentUser) {
        const orders = await Order.find({
            userId: (currentUser as any)._id,
            creatorId: creator._id,
            status: 'completed',
        }).lean();
        purchasedProductIds = orders.flatMap((o: any) =>
            o.items.map((item: any) => item.productId.toString())
        );
    }

    // ── Theme with defaults — each property extracted as a primitive to satisfy RSC serialisation ──
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
    };

    // ── Service Buttons ──
    const serviceButtons: ServiceButton[] = (profile?.serviceButtons || [])
        .filter((b: any) => b.isVisible)
        .sort((a: any, b: any) => a.order - b.order)
        .map((b: any) => ({
            id: b.id,
            label: b.label,
            serviceType: b.serviceType,
            link: b.link,
            modalEnabled: b.modalEnabled ?? true,
            isVisible: b.isVisible ?? true,
            order: b.order ?? 0,
        }));

    // ── Active links — extract plain primitives from Mongoose subdocuments ──
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

    // ── Serialise plain objects for client components ──
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

    // ── Plain creator — every value is a raw primitive or a new plain object literal ──
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
        // socialLinks — build a fresh plain object from individual string values
        socialLinks: {
            instagram: sl?.instagram ? String(sl.instagram) : undefined,
            twitter: sl?.twitter ? String(sl.twitter) : undefined,
            youtube: sl?.youtube ? String(sl.youtube) : undefined,
            tiktok: sl?.tiktok ? String(sl.tiktok) : undefined,
            linkedin: sl?.linkedin ? String(sl.linkedin) : undefined,
            website: sl?.website ? String(sl.website) : undefined,
        },
        // theme — already constructed as a plain object above
        theme,
    };

    // ── Layout sections ──
    const layout = (profile?.layout?.length ? profile.layout : [
        { id: 'hero', enabled: true },
        { id: 'services', enabled: true },
        { id: 'links', enabled: true },
        { id: 'products', enabled: true },
        { id: 'newsletter', enabled: true },
    ]) as Array<{ id: string; enabled: boolean }>;

    // ── Google Fonts ──
    const fontsUrl = getGoogleFontsUrl(theme.fontFamily);

    // ── JSON-LD structured data ──
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

    // ── Analytics & referral (fire-and-forget) ──
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

    return (
        <>
            {/* Google Fonts */}
            {fontsUrl && (
                <>
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                    <link rel="stylesheet" href={fontsUrl} />
                </>
            )}

            {/* JSON-LD structured data */}
            <Script
                id="creator-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div
                className="min-h-screen selection:bg-indigo-500/30 overflow-x-hidden"
                style={applyThemeToCSSVars(theme)}
            >
                <StoreHeader creator={plainCreator} />

                <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-32 pb-12 space-y-16 relative">
                    {layout.map((section) => {
                        if (!section.enabled) return null;

                        switch (section.id) {
                            // ── Hero ──────────────────────────────────────────
                            case 'hero':
                                return (
                                    <div key="hero">
                                        <CreatorBio creator={plainCreator} />
                                        <div className="mt-6">
                                            <ShareButtons
                                                username={creator.username}
                                                displayName={creator.displayName}
                                            />
                                        </div>
                                    </div>
                                );

                            // ── Service Buttons ───────────────────────────────
                            case 'services':
                                return (
                                    <section key="services" id="services" aria-label="Services">
                                        <Suspense fallback={<ServiceButtonsSkeleton count={3} />}>
                                            <StorefrontInteractive
                                                serviceButtons={serviceButtons}
                                                theme={theme}
                                                creatorUsername={creator.username}
                                            />
                                        </Suspense>
                                    </section>
                                );

                            // ── Links ─────────────────────────────────────────
                            case 'links':
                                return activeLinks.length > 0 ? (
                                    <section key="links" id="links" aria-label="Links">
                                        <Suspense fallback={<LinksSectionSkeleton count={4} />}>
                                            <LinksSection
                                                links={activeLinks}
                                                theme={theme}
                                                creatorId={creator._id.toString()}
                                            />
                                        </Suspense>
                                    </section>
                                ) : null;

                            // ── Products ──────────────────────────────────────
                            case 'products':
                                return plainProducts.length > 0 ? (
                                    <section key="products" id="products" className="space-y-8" aria-label="Products">
                                        <div className="flex items-center gap-6">
                                            <h2 className="text-2xl font-black uppercase tracking-widest whitespace-nowrap">
                                                Featured Products
                                            </h2>
                                            <div className="h-px flex-1 bg-white/10 hidden md:block" />
                                        </div>
                                        <Suspense fallback={<ProductGridSkeleton />}>
                                            <ProductGrid
                                                products={plainProducts}
                                                purchasedProductIds={purchasedProductIds}
                                                creator={{
                                                    id: creator._id.toString(),
                                                    username: creator.username,
                                                    displayName: creator.displayName,
                                                }}
                                                theme={theme}
                                            />
                                        </Suspense>
                                    </section>
                                ) : null;

                            // ── Newsletter ────────────────────────────────────
                            case 'newsletter':
                                return profile?.features?.newsletterEnabled !== false ? (
                                    <section key="newsletter" id="newsletter" className="max-w-xl mx-auto" aria-label="Newsletter">
                                        <NewsletterSignup
                                            creatorId={creator._id.toString()}
                                            theme={theme}
                                        />
                                    </section>
                                ) : null;

                            // ── Testimonials ──────────────────────────────────
                            case 'testimonials':
                                return profile?.testimonials?.length > 0 ? (
                                    <TestimonialsSection
                                        key="testimonials"
                                        testimonials={profile.testimonials}
                                        theme={theme}
                                    />
                                ) : null;

                            // ── FAQ ───────────────────────────────────────────
                            case 'faq':
                                return profile?.faqs?.length > 0 ? (
                                    <FAQSection
                                        key="faq"
                                        faqs={profile.faqs}
                                        theme={theme}
                                    />
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

                    {/* Real-time Chat */}
                    <ChatWidget creatorId={creator._id.toString()} />
                </main>
            </div >
        </>
    );
}
