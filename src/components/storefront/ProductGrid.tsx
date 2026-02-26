'use client';

import React from 'react';
import ProductCard from './ProductCard';
import { motion } from 'framer-motion';

interface ProductGridProps {
    products: any[];
    purchasedProductIds: string[];
    creator: {
        id: string;
        username: string;
        displayName: string;
    };
    theme: any;
}

export default function ProductGrid({ products, purchasedProductIds, creator, theme }: ProductGridProps) {
    if (!products.length) {
        return (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No products found</p>
            </div>
        );
    }

    const isList = theme.productLayout === 'list';

    return (
        <div className={isList ? "flex flex-col gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-8"}>
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    creator={creator}
                    theme={theme}
                    hasAccess={purchasedProductIds.includes(product.id)}
                    layout={theme.productLayout}
                />
            ))}
        </div>
    );
}
