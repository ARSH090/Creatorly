'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ShoppingBag, ArrowRight, Star } from 'lucide-react';
import type { FeaturedProductSettings } from '@/types/storefront-blocks.types';

interface Props {
    settings: FeaturedProductSettings;
    theme: Record<string, string>;
    products: any[];
}

export default function FeaturedProductWidget({ settings, theme, products }: Props) {
    const product = products.find(p => p.id === settings.productId) || products[0];

    if (!product && !settings.productId) {
        return (
            <div className="p-12 text-center border-2 border-dashed rounded-3xl opacity-20" style={{ borderColor: theme.textColor + '22' }}>
                <ShoppingBag className="mx-auto mb-4" />
                <p className="text-sm font-bold">Select a product to feature</p>
            </div>
        );
    }

    // Fallback for preview if no products match
    const displayProduct = product || {
        name: 'Premium Digital Product',
        price: '499',
        description: 'Create amazing results with our signature framework. Essential for every creator.',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
    };

    const isHorizontal = settings.layout === 'horizontal';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`relative group overflow-hidden rounded-[calc(var(--border-radius)*2)] border bg-white/[0.03] backdrop-blur-sm transition-all hover:bg-white/[0.05] ${isHorizontal ? 'flex flex-col md:flex-row' : 'flex flex-col'
                }`}
            style={{
                borderColor: theme.textColor + '11',
                borderRadius: `${Number(theme.borderRadius) * 2}px`
            }}
        >
            {/* Image Section */}
            <div className={`relative ${isHorizontal ? 'w-full md:w-2/5 aspect-square' : 'w-full aspect-video'}`}>
                {displayProduct.image ? (
                    <Image
                        src={displayProduct.image}
                        alt={displayProduct.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                        <ShoppingBag size={48} className="text-zinc-800" />
                    </div>
                )}
                {settings.badgeText && (
                    <div className="absolute top-4 left-4 z-10">
                        <span className="bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                            {settings.badgeText}
                        </span>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className={`p-6 md:p-8 flex flex-col justify-center ${isHorizontal ? 'flex-1' : 'w-full'}`}>
                <div className="flex items-center gap-2 mb-3">
                    <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                            <Star key={i} size={12} className="fill-yellow-500 text-yellow-500" />
                        ))}
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Best Seller</span>
                </div>

                <h3 className="text-2xl md:text-3xl font-black mb-3 tracking-tighter" style={{ color: theme.textColor }}>
                    {displayProduct.name}
                </h3>

                {settings.showDescription !== false && (
                    <p className="text-sm md:text-base mb-6 line-clamp-2 md:line-clamp-3 opacity-60 leading-relaxed">
                        {displayProduct.description}
                    </p>
                )}

                <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Investment</span>
                        <span className="text-2xl font-black tracking-tighter" style={{ color: theme.primaryColor }}>
                            ₹{displayProduct.price}
                        </span>
                    </div>

                    <button
                        className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-500/20"
                        style={{
                            backgroundColor: theme.primaryColor,
                            color: '#ffffff'
                        }}
                    >
                        {settings.buttonText || 'Buy Now'}
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
