import { Suspense } from 'react';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import ProductModel, { IProduct } from '@/lib/models/Product';
import CreatorProfile from '@/lib/models/CreatorProfile';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import StoreHeader from '@/components/storefront/StoreHeader';
import CreatorBio from '@/components/storefront/CreatorBio';
import ProductGrid from '@/components/storefront/ProductGrid';
import LinksSection from '@/components/storefront/LinksSection';
import ChatWidget from '@/components/storefront/ChatWidget';
import ShareButtons from '@/components/storefront/ShareButtons';
import { ShieldAlert } from 'lucide-react';

import { getCurrentUser } from '@/lib/auth/server-auth';
import Order from '@/lib/models/Order';
import NewsletterSignup from '@/components/storefront/NewsletterSignup';
import { ProductGridSkeleton } from '@/components/storefront/ProductSkeleton';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
    await connectToDatabase();
    const { username } = await params;
    const creator = await User.findOne({ username });

    if (!creator) {
        return {
            title: 'Creator Not Found | Creatorly',
            description: 'The requested creator profile could not be found.'
        };
    }

    const displayName = creator.displayName || creator.username;
    const bio = (creator as any).bio || `Check out ${displayName}'s store on Creatorly.`;
    const image = (creator as any).avatar || '/default-avatar.png';

    return {
        title: `${displayName} | Creatorly Store`,
        description: bio,
        openGraph: {
            title: `${displayName}'s Store`,
            description: bio,
            images: [{ url: image }],
            type: 'profile',
        }
    };
}

export default async function CreatorStorefront({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
    await connectToDatabase();

    const creator = await User.findOne({ username });
    if (!creator) notFound();

    if (creator.isSuspended || creator.status === 'suspended') {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
                <div className="max-w-md space-y-6">
                    <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-rose-500/20">
                        <ShieldAlert className="w-10 h-10 text-rose-500" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">Storefront Locked</h1>
                        <p className="text-zinc-500 text-sm font-medium">This creator storefront has been temporarily suspended by the platform governance board due to a policy violation or maintenance.</p>
                    </div>
                    <div className="pt-6 border-t border-white/5">
                        <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em]">Protected by Creatorly Entity Oversight</p>
                    </div>
                </div>
            </div>
        );
    }

    const profile = await CreatorProfile.findOne({ creatorId: creator._id });
    const products = await ProductModel.find({ creatorId: creator._id, isActive: true }).sort({ isFeatured: -1, createdAt: -1 }) as IProduct[];

    // Fetch user's purchased products for this creator
    const currentUser = await getCurrentUser();
    let purchasedProductIds: string[] = [];

    if (currentUser) {
        const orders = await Order.find({
            userId: (currentUser as any)._id,
            creatorId: creator._id,
            status: 'success'
        });
        purchasedProductIds = orders.flatMap(o => o.items.map(item => item.productId.toString()));
    }

    // Standardize theme with defaults
    const theme = profile?.theme || {
        primaryColor: '#6366f1',
        secondaryColor: '#a855f7',
        accentColor: '#ec4899',
        backgroundColor: '#030303',
        textColor: '#ffffff',
        fontFamily: 'Inter',
        borderRadius: 'md',
        buttonStyle: 'rounded' as const
    };

    const plainProducts = products.map((p: any) => ({
        id: p._id.toString(),
        name: p.name,
        price: p.price,
        type: p.type as any,
        image: p.image,
        description: p.description,
        isBestSeller: p.isFeatured,
        isNew: new Date().getTime() - new Date(p.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
    }));

    const plainCreator = {
        displayName: creator.displayName,
        username: creator.username,
        bio: profile?.description || (creator as any).bio || '',
        avatar: (creator as any).avatar || '',
        logo: profile?.logo,
        socialLinks: profile?.socialLinks || {},
        theme: theme as any
    };

    // Default layout if none provided
    const layout = (profile?.layout?.length ? profile.layout : [
        { id: 'hero', enabled: true },
        { id: 'links', enabled: true },
        { id: 'products', enabled: true },
        { id: 'newsletter', enabled: true }
    ]) as any[];

    return (
        <div
            className="min-h-screen selection:bg-indigo-500/30 overflow-x-hidden"
            style={{
                backgroundColor: theme.backgroundColor,
                color: theme.textColor,
                fontFamily: theme.fontFamily
            } as React.CSSProperties}
        >
            <StoreHeader creator={plainCreator} />

            <main className="max-w-4xl mx-auto px-6 pt-32 pb-12 space-y-16 relative">
                {/* View Tracker */}
                {await (async () => {
                    const { AnalyticsEvent: EventModel } = await import('@/lib/models/AnalyticsEvent');
                    EventModel.create({
                        eventType: 'page_view',
                        creatorId: creator._id,
                        path: `/u/${username}`,
                        metadata: { source: 'server-component' }
                    }).catch(console.error);
                    return null;
                })()}

                {layout.map((section) => {
                    if (!section.enabled) return null;

                    switch (section.id) {
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


                        case 'links':
                            const activeLinks = (profile?.links || []).filter((link: any) => {
                                if (!link.url) return false;
                                const now = new Date();
                                if (link.scheduleStart && new Date(link.scheduleStart) > now) return false;
                                if (link.scheduleEnd && new Date(link.scheduleEnd) < now) return false;
                                return true;
                            });

                            return (
                                <LinksSection
                                    key="links"
                                    links={activeLinks}
                                    theme={theme as any}
                                    creatorId={creator._id.toString()}
                                />
                            );

                        case 'products':
                            return (
                                <section key="products" id="products" className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-black uppercase tracking-widest">Featured Products</h2>
                                        <div className="h-px flex-1 bg-white/10 mx-6 hidden md:block" />
                                    </div>

                                    <Suspense fallback={<ProductGridSkeleton />}>
                                        <ProductGrid
                                            products={plainProducts}
                                            purchasedProductIds={purchasedProductIds}
                                            creator={{
                                                id: creator._id.toString(),
                                                username: creator.username,
                                                displayName: creator.displayName
                                            }}
                                            theme={theme as any}
                                        />
                                    </Suspense>
                                </section>
                            );

                        case 'newsletter':
                            return profile?.features?.newsletterEnabled !== false && (
                                <section key="newsletter" id="newsletter" className="max-w-xl mx-auto">
                                    <NewsletterSignup creatorId={creator._id.toString()} theme={theme as any} />
                                </section>
                            );

                        default:
                            return null;
                    }
                })}

                <footer className="pt-20 pb-10 text-center border-t border-white/5">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">
                        Powered by Creatorly
                    </p>
                </footer>

                {/* Real-time 1-on-1 Chat */}
                <ChatWidget creatorId={creator._id.toString()} />
            </main>
        </div>
    );
}
