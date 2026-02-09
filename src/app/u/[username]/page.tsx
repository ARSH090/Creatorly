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

import { getCurrentUser } from '@/lib/firebase/server-auth';
import Order from '@/lib/models/Order';
import NewsletterSignup from '@/components/storefront/NewsletterSignup';
import { ProductGridSkeleton } from '@/components/storefront/ProductSkeleton';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
    await connectToDatabase();
    const creator = await User.findOne({ username: params.username });

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

export default async function CreatorStorefront({ params }: { params: { username: string } }) {
    await connectToDatabase();

    const creator = await User.findOne({ username: params.username });
    if (!creator) notFound();

    const profile = await CreatorProfile.findOne({ creatorId: creator._id });
    const products = await ProductModel.find({ creatorId: creator._id, isActive: true }).sort({ isFeatured: -1, createdAt: -1 }) as IProduct[];

    // Fetch user's purchased products for this creator
    const currentUser = await getCurrentUser();
    let purchasedProductIds: string[] = [];

    if (currentUser) {
        const orders = await Order.find({
            userId: currentUser._id,
            creatorId: creator._id,
            status: 'success'
        });
        purchasedProductIds = orders.map(o => o.productId.toString());
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
        buttonStyle: 'rounded'
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
        theme: theme
    };

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
                {/* Intent/View Tracker (Anti-Gravity) */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                        fetch('/api/analytics/view', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                type: 'bio_page', 
                                creatorId: '${creator._id}',
                                path: window.location.pathname,
                                referrer: document.referrer
                            })
                        }).catch(() => {});
                    `}}
                />

                {/* Hero / Bio Section */}
                <CreatorBio creator={plainCreator} />

                {/* Products Section */}
                <section id="products" className="space-y-8">
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
                            theme={theme}
                        />
                    </Suspense>
                </section>

                {/* Newsletter Section */}
                {profile?.features?.newsletterEnabled !== false && (
                    <section id="newsletter" className="max-w-xl mx-auto">
                        <NewsletterSignup creatorId={creator._id.toString()} theme={theme} />
                    </section>
                )}

                {/* Footer Section */}
                <footer className="pt-20 pb-10 text-center border-t border-white/5">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">
                        Powered by Creatorly
                    </p>
                </footer>
            </main>
        </div>
    );
}
