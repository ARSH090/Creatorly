'use client';

import React from 'react';
import ProductCard from './ProductCard';

export default function ProductRecommendations() {
    const recommendations = [
        {
            id: 'rec-1',
            name: 'Photography Masterclass 2024',
            price: 2999,
            image: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2000&auto=format&fit=crop",
            rating: 5,
            reviewCount: 42,
            salesCount: 150,
            isBestSeller: true
        },
        {
            id: 'rec-2',
            name: 'Lightroom Presets Vol. 2',
            price: 999,
            originalPrice: 1499,
            image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2000&auto=format&fit=crop",
            rating: 4.8,
            reviewCount: 28,
            salesCount: 300,
            isNew: true
        }
    ];

    return (
        <div className="py-12 border-t border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-8">You might also like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendations.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
}
