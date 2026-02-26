'use client';

import React from 'react';
import Image from 'next/image';
import type { ProductsSettings } from '@/types/storefront-blocks.types';

interface Product {
    id: string;
    name: string;
    price: number;
    image?: string;
    description?: string;
    type?: string;
    isBestSeller?: boolean;
    isNew?: boolean;
}

interface ProductsWidgetProps {
    settings: ProductsSettings;
    theme: Record<string, string>;
    products?: Product[];
    creatorUsername?: string;
}

const COLS_CLASS: Record<number, string> = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
};

export default function ProductsWidget({ settings, theme, products = [], creatorUsername }: ProductsWidgetProps) {
    const {
        layout = 'grid',
        columns = 3,
        cardStyle = 'detailed',
        showViewAll = true,
        maxVisible = 6,
        featuredProductId,
        title = 'My Products',
    } = settings;

    const borderRadius = Number(theme.borderRadius || 12);

    let sortedProducts = [...products];
    if (featuredProductId) {
        sortedProducts = [
            ...sortedProducts.filter(p => p.id === featuredProductId),
            ...sortedProducts.filter(p => p.id !== featuredProductId),
        ];
    }

    const displayedProducts = sortedProducts.slice(0, maxVisible);
    const hasMore = products.length > maxVisible;

    if (displayedProducts.length === 0) {
        return (
            <div className="text-center py-12 opacity-30">
                <p className="text-2xl mb-2">🛍️</p>
                <p className="text-sm font-semibold">No products yet</p>
            </div>
        );
    }

    return (
        <section className="w-full py-4">
            {/* Title */}
            <div className="flex items-center gap-4 mb-6">
                <h2 className="text-xl font-black uppercase tracking-widest" style={{ color: theme.textColor || '#fff' }}>
                    {title}
                </h2>
                <div className="h-px flex-1 opacity-10" style={{ backgroundColor: theme.textColor || '#fff' }} />
            </div>

            {/* Grid */}
            {layout === 'grid' && (
                <div className={`grid ${COLS_CLASS[columns] || COLS_CLASS[3]} gap-4`}>
                    {displayedProducts.map((product, idx) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            cardStyle={cardStyle}
                            theme={theme}
                            borderRadius={borderRadius}
                            isFeatured={idx === 0 && product.id === featuredProductId}
                            creatorUsername={creatorUsername}
                        />
                    ))}
                </div>
            )}

            {/* List */}
            {layout === 'list' && (
                <div className="flex flex-col gap-4">
                    {displayedProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            cardStyle="compact"
                            theme={theme}
                            borderRadius={borderRadius}
                            creatorUsername={creatorUsername}
                        />
                    ))}
                </div>
            )}

            {/* Carousel */}
            {layout === 'carousel' && (
                <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
                    {displayedProducts.map((product) => (
                        <div key={product.id} className="snap-start flex-shrink-0" style={{ width: 260 }}>
                            <ProductCard
                                product={product}
                                cardStyle={cardStyle}
                                theme={theme}
                                borderRadius={borderRadius}
                                creatorUsername={creatorUsername}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Masonry */}
            {layout === 'masonry' && (
                <div className="columns-2 md:columns-3 gap-4 space-y-4">
                    {displayedProducts.map((product) => (
                        <div key={product.id} className="break-inside-avoid mb-4">
                            <ProductCard
                                product={product}
                                cardStyle={cardStyle}
                                theme={theme}
                                borderRadius={borderRadius}
                                creatorUsername={creatorUsername}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* View All */}
            {showViewAll && hasMore && creatorUsername && (
                <div className="text-center mt-6">
                    <a
                        href={`/u/${creatorUsername}`}
                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all hover:opacity-90"
                        style={{
                            backgroundColor: `${theme.primaryColor || '#6366f1'}18`,
                            border: `1px solid ${theme.primaryColor || '#6366f1'}44`,
                            borderRadius,
                            color: theme.primaryColor || '#6366f1',
                        }}
                    >
                        View All Products →
                    </a>
                </div>
            )}
        </section>
    );
}

function ProductCard({ product, cardStyle, theme, borderRadius, isFeatured, creatorUsername }: {
    product: Product;
    cardStyle: string;
    theme: Record<string, string>;
    borderRadius: number;
    isFeatured?: boolean;
    creatorUsername?: string;
}) {
    const href = creatorUsername ? `/u/${creatorUsername}?product=${product.id}` : '#';
    const bgColor = theme.cardColor || 'rgba(255,255,255,0.04)';
    const textColor = theme.textColor || '#fff';
    const primaryColor = theme.primaryColor || '#6366f1';

    if (cardStyle === 'compact') {
        return (
            <a
                href={href}
                className="flex items-center gap-4 p-4 transition-all hover:opacity-90 hover:scale-[1.01]"
                style={{ backgroundColor: bgColor, borderRadius, border: `1px solid rgba(255,255,255,0.06)` }}
            >
                {product.image && (
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                        <Image src={product.image} alt={product.name} width={56} height={56} className="object-cover w-full h-full" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: textColor }}>{product.name}</p>
                    <p className="text-xs opacity-60 mt-0.5" style={{ color: textColor }}>{product.type}</p>
                </div>
                <div className="flex-shrink-0 font-black text-base" style={{ color: primaryColor }}>
                    ₹{product.price.toLocaleString('en-IN')}
                </div>
            </a>
        );
    }

    return (
        <a
            href={href}
            className={`group block overflow-hidden transition-all duration-200 hover:opacity-95 hover:shadow-xl ${isFeatured ? 'md:col-span-2' : ''}`}
            style={{ backgroundColor: bgColor, borderRadius, border: `1px solid rgba(255,255,255,0.06)` }}
        >
            {/* Image */}
            <div className="relative w-full aspect-video overflow-hidden">
                {product.image ? (
                    <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}22` }}>
                        <span className="text-4xl opacity-40">🛍️</span>
                    </div>
                )}
                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-1">
                    {product.isBestSeller && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500 text-black">Bestseller</span>
                    )}
                    {product.isNew && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500 text-white">New</span>
                    )}
                </div>
            </div>

            <div className="p-4 space-y-2">
                <p className="font-black text-base leading-tight" style={{ color: textColor }}>{product.name}</p>

                {cardStyle === 'detailed' && product.description && (
                    <p className="text-sm opacity-60 line-clamp-2" style={{ color: textColor }}>{product.description}</p>
                )}

                <div className="flex items-center justify-between pt-1">
                    <span className="font-black text-lg" style={{ color: primaryColor }}>
                        ₹{product.price.toLocaleString('en-IN')}
                    </span>
                    {cardStyle === 'detailed' && (
                        <span
                            className="text-xs font-bold px-3 py-1.5 transition-all"
                            style={{ backgroundColor: primaryColor, borderRadius: 999, color: '#fff' }}
                        >
                            Buy Now
                        </span>
                    )}
                </div>
            </div>
        </a>
    );
}
